import { NextResponse, NextRequest } from "next/server";

// Static imports so Next.js bundles these into the serverless function
import mastersClassic from "../../../data/templates/masters-classic.json";
import valeroTexasOpen from "../../../data/templates/valero-texas-open-2026.json";
import rbcHeritageQuick6 from "../../../data/templates/rbc-heritage-quick-6.json";
import rbcHeritageClassic from "../../../data/templates/rbc-heritage-classic.json";

const ALL_TEMPLATES = [
  mastersClassic,
  valeroTexasOpen,
  rbcHeritageQuick6,
  rbcHeritageClassic,
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tournament = searchParams.get("tournament");

  if (tournament) {
    // Filter templates by tournamentName field (case-insensitive partial match)
    const filtered = ALL_TEMPLATES.filter((t) => {
      const tn = (t as Record<string, unknown>).tournamentName as string | undefined;
      if (!tn) return false;
      const tLower = tn.toLowerCase();
      const qLower = tournament.toLowerCase();
      return tLower.includes(qLower) || qLower.includes(tLower);
    });
    // If no templates match the tournament, fall back to showing all
    if (filtered.length > 0) {
      return NextResponse.json(filtered);
    }
  }

  return NextResponse.json(ALL_TEMPLATES);
}
