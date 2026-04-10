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
  });

  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.poolInvite.findMany({
    where: { poolId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
