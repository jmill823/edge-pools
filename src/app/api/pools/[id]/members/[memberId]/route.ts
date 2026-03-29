import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({ where: { id: params.id } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hasPaid } = await req.json();
  const updated = await prisma.poolMember.update({
    where: { id: params.memberId },
    data: { hasPaid },
  });

  return NextResponse.json(updated);
}
