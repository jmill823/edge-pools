// Public REST endpoint for market_coverage. Reachable without auth.
// Mirror of the JSON-RPC tools/call?name=market_coverage path; provided
// because some discovery clients prefer a plain-HTTP endpoint over JSON-RPC.

import { NextResponse } from "next/server";
import { runMarketCoverage } from "../../tools/market_coverage";
import { fingerprintCaller, recordCall } from "../../log";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const start = Date.now();
  const fingerprint = fingerprintCaller(req.headers.get("user-agent"));
  try {
    const data = await runMarketCoverage();
    recordCall({
      tool: "market_coverage",
      fingerprint,
      commissionerId: null,
      input: {},
      ok: true,
      errorCode: null,
      latencyMs: Date.now() - start,
      tier: "public",
    });
    return NextResponse.json(data);
  } catch (err) {
    recordCall({
      tool: "market_coverage",
      fingerprint,
      commissionerId: null,
      input: {},
      ok: false,
      errorCode: "internal",
      latencyMs: Date.now() - start,
      tier: "public",
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: { code: "internal", message } }, { status: 500 });
  }
}
