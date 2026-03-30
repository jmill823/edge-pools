import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slashGolfId } = await req.json();

  const golfer = await prisma.golfer.update({
    where: { id: params.id },
    data: { slashGolfId: slashGolfId || null },
  });

  return NextResponse.json(golfer);
}
