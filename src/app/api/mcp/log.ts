// Structured call-log instrumentation for TILT MCP server.
// Storage mechanism: structured JSON to stdout. Vercel captures this in
// Functions logs; queries like "calls in last 24h grouped by tool" run via
// `vercel logs --json --since 24h | jq 'select(.tag=="mcp_call") | .tool'`
// or piped through Datadog/Logflare if attached. Satisfies spec § Signal
// instrumentation queryability requirement without a DB schema change.

import { createHash } from "crypto";
import { stripPii } from "./lib/pii-strip";
import type {
  CallerFingerprint,
  Tier,
  ToolCallLogRecord,
} from "./lib/types";

const TAG = "mcp_call";

export function fingerprintCaller(userAgent: string | null): CallerFingerprint {
  if (!userAgent) return "Other";
  const ua = userAgent.toLowerCase();
  if (ua.includes("claude")) return "Claude Desktop";
  if (ua.includes("chatgpt") || ua.includes("openai")) return "ChatGPT";
  if (ua.includes("cursor")) return "Cursor";
  return "Other";
}

export function hashCommissioner(commissionerId: string | null): string | null {
  if (!commissionerId) return null;
  return createHash("sha256").update(commissionerId).digest("hex").slice(0, 16);
}

interface RecordCallInput {
  tool: string;
  fingerprint: CallerFingerprint;
  commissionerId: string | null;
  input: unknown;
  ok: boolean;
  errorCode: string | null;
  latencyMs: number;
  tier: Tier;
}

export function recordCall(input: RecordCallInput): void {
  const record: ToolCallLogRecord & { tag: string } = {
    tag: TAG,
    ts: new Date().toISOString(),
    tool: input.tool,
    fingerprint: input.fingerprint,
    commissioner_id_hash: hashCommissioner(input.commissionerId),
    input: stripPii(input.input),
    ok: input.ok,
    error_code: input.errorCode,
    latency_ms: input.latencyMs,
    tier: input.tier,
  };

  // Single-line JSON to stdout. Vercel groups this as the function's logs.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}

// Wraps a tool implementation with timing + log emission. Tools return
// either a successful payload or a {error} envelope; this layer doesn't
// care which.
export async function withLog<T>(
  meta: {
    tool: string;
    fingerprint: CallerFingerprint;
    commissionerId: string | null;
    tier: Tier;
    input: unknown;
  },
  fn: () => Promise<{ ok: boolean; errorCode?: string; result: T }>
): Promise<T> {
  const start = Date.now();
  let ok = false;
  let errorCode: string | null = null;
  try {
    const r = await fn();
    ok = r.ok;
    errorCode = r.errorCode ?? null;
    return r.result;
  } catch (err) {
    errorCode = "internal";
    throw err;
  } finally {
    recordCall({
      tool: meta.tool,
      fingerprint: meta.fingerprint,
      commissionerId: meta.commissionerId,
      input: meta.input,
      ok,
      errorCode,
      latencyMs: Date.now() - start,
      tier: meta.tier,
    });
  }
}
