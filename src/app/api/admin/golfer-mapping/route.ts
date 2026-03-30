import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const golfers = await prisma.golfer.findMany({
    orderBy: [{ owgr: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      country: true,
      owgr: true,
      slashGolfId: true,
    },
  });

  return NextResponse.json(golfers);
}
