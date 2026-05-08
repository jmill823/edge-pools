// market_coverage — public, no auth.
// Returns the list of PGA Tour tournaments TILT supports for live scoring.
// Funnel signal for prospective commissioners ("does TILT support X?").
//
// Status mapping (per spec § Tool Surface #6):
//   ready             → tournament has slashGolfTournId set; scoring wired
//   scoring_pending   → slashGolfTournId is null; scoring not configured
//   field_pending     → slashGolfTournId set but lastSyncAt is null AND status=UPCOMING
//                       (engine knows about it but no field/scores synced yet)
//   unsupported       → COMPLETE tournament with no slashGolfTournId
//                       (historical, never wired)

import { prisma } from "@/lib/db";
import type { CoverageStatus, MarketCoverageOutput } from "../lib/types";

export async function runMarketCoverage(): Promise<MarketCoverageOutput> {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      slashGolfTournId: true,
      lastSyncAt: true,
    },
  });

  return {
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      dates: {
        start: t.startDate.toISOString(),
        end: t.endDate.toISOString(),
      },
      status: deriveStatus(t),
    })),
  };
}

function deriveStatus(t: {
  status: string;
  slashGolfTournId: string | null;
  lastSyncAt: Date | null;
}): CoverageStatus {
  if (!t.slashGolfTournId) {
    return t.status === "COMPLETE" ? "unsupported" : "scoring_pending";
  }
  if (t.status === "UPCOMING" && !t.lastSyncAt) {
    return "field_pending";
  }
  return "ready";
}
