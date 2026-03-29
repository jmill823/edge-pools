import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SETUP: ["OPEN"],
  OPEN: ["LOCKED"],
  LOCKED: ["LIVE"],
  LIVE: ["COMPLETE"],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = await prisma.pool.findUnique({ where: { id: params.id } });
  if (!pool || pool.organizerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await req.json();
  const allowed = VALID_TRANSITIONS[pool.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${pool.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.pool.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(updated);
}
