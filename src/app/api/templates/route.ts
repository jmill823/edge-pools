import { NextResponse } from "next/server";
import mastersClassic from "@/data/templates/masters-classic.json";
import valeroTexasOpen from "@/data/templates/valero-texas-open-2026.json";

export async function GET() {
  return NextResponse.json([mastersClassic, valeroTexasOpen]);
}
