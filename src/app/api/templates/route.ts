import { NextResponse } from "next/server";
import mastersClassic from "@/data/templates/masters-classic.json";

export async function GET() {
  return NextResponse.json([mastersClassic]);
}
