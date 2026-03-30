import { NextRequest, NextResponse } from "next/server";
import { pollAllLiveTournaments } from "@/lib/scoring/poll-scores";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for scoring

/**
 * Cron endpoint for polling SlashGolf scores.
 * Called by Vercel Cron every 5 minutes, or manually via admin.
 * Secured by CRON_SECRET header check.
 */
export async function POST(req: NextRequest) {
  // Verify auth — either Vercel cron or manual trigger with secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await pollAllLiveTournaments();

    if (results.length === 0) {
      return NextResponse.json({ message: "No LIVE tournaments to poll" });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Poll scores error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (it uses GET by default)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await pollAllLiveTournaments();
    return NextResponse.json({
      message: results.length === 0 ? "No LIVE tournaments" : "Scores polled",
      results,
    });
  } catch (err) {
    console.error("Poll scores error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
