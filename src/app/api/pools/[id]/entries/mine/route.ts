import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET — Return the current user's entries for this pool.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: params.id, userId: user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a pool member" }, { status: 403 });
  }

  const entries = await prisma.entry.findMany({
    where: { poolId: params.id, userId: user.id },
    include: {
      picks: {
        include: {
          golfer: { select: { id: true, name: true, country: true, owgr: true } },
          category: { select: { id: true, name: true, sortOrder: true } },
        },
        orderBy: { category: { sortOrder: "asc" } },
      },
    },
    orderBy: { entryNumber: "asc" },
  });

  return NextResponse.json(entries);
}
