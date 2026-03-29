import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const golfers = await prisma.golfer.findMany({
    orderBy: { owgr: { sort: "asc", nulls: "last" } },
  });
  return NextResponse.json(golfers);
}
