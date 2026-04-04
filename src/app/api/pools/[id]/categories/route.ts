import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          golfers: {
            include: {
              golfer: true,
            },
          },
        },
      },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  // Allow any pool member (or organizer) to view categories
  const membership = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: params.id, userId: user.id } },
  });
  if (!membership && pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = pool.categories.map((c) => ({
    id: c.id,
    name: c.name,
    qualifier: c.qualifier,
    sortOrder: c.sortOrder,
    golfers: c.golfers.map((cg) => ({
      id: cg.golfer.id,
      name: cg.golfer.name,
      country: cg.golfer.country,
      owgr: cg.golfer.owgr,
    })),
  }));

  return NextResponse.json(categories);
}

/**
 * PUT — Replace all categories for a pool (SETUP status only).
 * Body: { categories: [{ name, sortOrder, golferIds: string[] }] }
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({ where: { id: params.id } });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }
  if (pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (pool.status !== "SETUP") {
    return NextResponse.json(
      { error: "Categories can only be edited while pool is in SETUP status" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const cats: { name: string; qualifier?: string; sortOrder: number; golferIds: string[] }[] =
    body.categories;

  if (!Array.isArray(cats) || cats.length === 0) {
    return NextResponse.json(
      { error: "At least one category is required" },
      { status: 400 }
    );
  }

  // Delete existing categories + assignments, then recreate
  await prisma.$transaction(async (tx) => {
    // Delete CategoryGolfer records for this pool's categories
    const existingCatIds = await tx.category.findMany({
      where: { poolId: params.id },
      select: { id: true },
    });
    const catIds = existingCatIds.map((c) => c.id);

    if (catIds.length > 0) {
      await tx.categoryGolfer.deleteMany({
        where: { categoryId: { in: catIds } },
      });
      await tx.category.deleteMany({
        where: { poolId: params.id },
      });
    }

    // Create new categories with golfer assignments
    for (const cat of cats) {
      const created = await tx.category.create({
        data: {
          poolId: params.id,
          name: cat.name,
          qualifier: cat.qualifier || null,
          sortOrder: cat.sortOrder,
        },
      });

      if (cat.golferIds.length > 0) {
        await tx.categoryGolfer.createMany({
          data: cat.golferIds.map((golferId) => ({
            categoryId: created.id,
            golferId,
          })),
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
