// MCP server entry — JSON-RPC 2.0 dispatch over HTTP.
//
// Day 2: implements `initialize`, `tools/list`, and `tools/call` for the
// three read tools shipped this session (current_standings, late_pickers,
// market_coverage). Auth-bridge-blocked tools (replay_last_season,
// add_players, nudge_late_pickers) appear in tools/list with placeholder
// descriptions but `tools/call` returns a stable "deferred" error — the
// shape Day 4 implementations will replace.
//
// Spec § Decision #4: all new endpoints under /api/mcp/. The catch-all
// `[[...slug]]` segment matches `/api/mcp` exactly (slug=[]) and any
// nested path the client posts to.
//
// Auth model (Day 2 stub):
//   - Public tool (market_coverage): no auth header required
//   - Commissioner tools: Bearer token via auth.resolveAuth()
//     - Real Clerk OAuth bridge ships Day 4
//     - Dev bypass via MCP_DEV_BYPASS_TOKEN env var until then

import { NextResponse } from "next/server";
import { resolveAuth } from "../auth";
import { ERROR_CODES, JSONRPC_ERRORS } from "../lib/errors";
import { fingerprintCaller, recordCall } from "../log";
import { runCurrentStandings } from "../tools/current_standings";
import { runLatePickers } from "../tools/late_pickers";
import { runMarketCoverage } from "../tools/market_coverage";
import type { CallerFingerprint, ToolDescriptor, Tier } from "../lib/types";

export const dynamic = "force-dynamic";

const SERVER_INFO = {
  name: "tilt",
  version: "1.0.0-day2",
};

// Tool catalog. Descriptions are draft; spec § Locked decision #2 reserves
// final copy for Jeff's Day 4 polish session.
const TOOLS: ToolDescriptor[] = [
  {
    name: "current_standings",
    description:
      "Get the live leaderboard for a Tilt pool. Returns player rankings, each player's golfer picks per category, and total points.",
    inputSchema: {
      type: "object",
      properties: { pool_id: { type: "string" } },
      required: ["pool_id"],
      additionalProperties: false,
    },
  },
  {
    name: "late_pickers",
    description:
      "List players in a Tilt pool who haven't submitted picks yet. Read-only. Companion to nudge_late_pickers.",
    inputSchema: {
      type: "object",
      properties: { pool_id: { type: "string" } },
      required: ["pool_id"],
      additionalProperties: false,
    },
  },
  {
    name: "market_coverage",
    description:
      "List the PGA Tour tournaments Tilt currently supports for live scoring. Public — no auth required.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "replay_last_season",
    description:
      "[Day 4] Build a draft pool for a new tournament using a prior pool as template.",
    inputSchema: {
      type: "object",
      properties: {
        new_tournament_id: { type: "string" },
        prior_pool_id: { type: "string" },
      },
      required: ["new_tournament_id"],
      additionalProperties: false,
    },
  },
  {
    name: "add_players",
    description:
      "[Day 4] Invite players to a Tilt pool by email. Idempotency-keyed.",
    inputSchema: {
      type: "object",
      properties: {
        pool_id: { type: "string" },
        emails: { type: "array", items: { type: "string" } },
        idempotency_key: { type: "string" },
      },
      required: ["pool_id", "emails", "idempotency_key"],
      additionalProperties: false,
    },
  },
  {
    name: "nudge_late_pickers",
    description:
      "[Day 4] Send a reminder email to players who haven't picked. Rate-limited to 1/4h per pool.",
    inputSchema: {
      type: "object",
      properties: {
        pool_id: { type: "string" },
        idempotency_key: { type: "string" },
      },
      required: ["pool_id", "idempotency_key"],
      additionalProperties: false,
    },
  },
];

const PUBLIC_TOOLS = new Set(["market_coverage"]);
const DEFERRED_TOOLS = new Set([
  "replay_last_season",
  "add_players",
  "nudge_late_pickers",
]);

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: string | number | null;
  result: unknown;
}

interface JsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: { code: number; message: string; data?: unknown };
}

export async function POST(req: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, JSONRPC_ERRORS.PARSE_ERROR, "Invalid JSON body");
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return jsonRpcError(
      body.id ?? null,
      JSONRPC_ERRORS.INVALID_REQUEST,
      "Request must be JSON-RPC 2.0 with a method"
    );
  }

  const id = body.id ?? null;

  switch (body.method) {
    case "initialize":
      return jsonRpcSuccess(id, {
        protocolVersion: "2025-03-26",
        serverInfo: SERVER_INFO,
        capabilities: { tools: { listChanged: false } },
      });
    case "tools/list":
      return jsonRpcSuccess(id, { tools: TOOLS });
    case "tools/call":
      return await handleToolsCall(req, id, body.params);
    case "ping":
      return jsonRpcSuccess(id, {});
    default:
      return jsonRpcError(
        id,
        JSONRPC_ERRORS.METHOD_NOT_FOUND,
        `Method not found: ${body.method}`
      );
  }
}

// GET serves discovery metadata. Some MCP clients probe with GET first.
export async function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    transport: "streamable-http",
    methods: ["initialize", "tools/list", "tools/call", "ping"],
    discovery: "/.well-known/mcp.json",
  });
}

async function handleToolsCall(
  req: Request,
  id: string | number | null,
  params: unknown
): Promise<Response> {
  const start = Date.now();
  const fingerprint = fingerprintCaller(req.headers.get("user-agent"));

  if (!params || typeof params !== "object") {
    return jsonRpcError(
      id,
      JSONRPC_ERRORS.INVALID_PARAMS,
      "tools/call requires params: {name, arguments?}"
    );
  }

  const { name, arguments: args = {} } = params as {
    name?: string;
    arguments?: unknown;
  };
  if (!name || typeof name !== "string") {
    return jsonRpcError(
      id,
      JSONRPC_ERRORS.INVALID_PARAMS,
      "params.name (tool name) is required"
    );
  }

  // Tool not in catalog
  const descriptor = TOOLS.find((t) => t.name === name);
  if (!descriptor) {
    recordCall({
      tool: name,
      fingerprint,
      commissionerId: null,
      input: args,
      ok: false,
      errorCode: ERROR_CODES.TOOL_NOT_FOUND.code,
      latencyMs: Date.now() - start,
      tier: "public",
    });
    return jsonRpcSuccess(id, toolErrorEnvelope("tool_not_found", `Unknown tool: ${name}`, 404));
  }

  // Public tool path
  if (PUBLIC_TOOLS.has(name)) {
    return await runPublicTool(name, args, fingerprint, id, start);
  }

  // Deferred tools — auth bridge ships Day 4
  if (DEFERRED_TOOLS.has(name)) {
    recordCall({
      tool: name,
      fingerprint,
      commissionerId: null,
      input: args,
      ok: false,
      errorCode: ERROR_CODES.TOOL_DEFERRED.code,
      latencyMs: Date.now() - start,
      tier: "free",
    });
    return jsonRpcSuccess(
      id,
      toolErrorEnvelope(
        ERROR_CODES.TOOL_DEFERRED.code,
        `Tool ${name} ships Day 4 (May 10) once the Clerk OAuth auth bridge is built.`,
        ERROR_CODES.TOOL_DEFERRED.status
      )
    );
  }

  // Authenticated commissioner tools
  const auth = await resolveAuth(req);
  if (!auth.ok) {
    recordCall({
      tool: name,
      fingerprint,
      commissionerId: null,
      input: args,
      ok: false,
      errorCode: auth.error.code,
      latencyMs: Date.now() - start,
      tier: "free",
    });
    return jsonRpcSuccess(
      id,
      toolErrorEnvelope(auth.error.code, auth.error.message, auth.error.status)
    );
  }

  return await runCommissionerTool(
    name,
    args,
    auth.context.commissionerId,
    auth.context.tier,
    fingerprint,
    id,
    start
  );
}

async function runPublicTool(
  name: string,
  args: unknown,
  fingerprint: CallerFingerprint,
  id: string | number | null,
  start: number
): Promise<Response> {
  if (name !== "market_coverage") {
    return jsonRpcError(id, JSONRPC_ERRORS.INTERNAL_ERROR, "unreachable");
  }
  try {
    const data = await runMarketCoverage();
    recordCall({
      tool: name,
      fingerprint,
      commissionerId: null,
      input: args,
      ok: true,
      errorCode: null,
      latencyMs: Date.now() - start,
      tier: "public",
    });
    return jsonRpcSuccess(id, toolSuccessEnvelope(data));
  } catch (err) {
    recordCall({
      tool: name,
      fingerprint,
      commissionerId: null,
      input: args,
      ok: false,
      errorCode: ERROR_CODES.INTERNAL.code,
      latencyMs: Date.now() - start,
      tier: "public",
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonRpcSuccess(
      id,
      toolErrorEnvelope(ERROR_CODES.INTERNAL.code, message, 500)
    );
  }
}

async function runCommissionerTool(
  name: string,
  args: unknown,
  commissionerId: string,
  tier: Tier,
  fingerprint: CallerFingerprint,
  id: string | number | null,
  start: number
): Promise<Response> {
  try {
    let result;
    if (name === "current_standings") {
      result = await runCurrentStandings(
        args as { pool_id: string },
        commissionerId
      );
    } else if (name === "late_pickers") {
      result = await runLatePickers(
        args as { pool_id: string },
        commissionerId
      );
    } else {
      return jsonRpcSuccess(
        id,
        toolErrorEnvelope(
          ERROR_CODES.TOOL_NOT_FOUND.code,
          `Unknown commissioner tool: ${name}`,
          404
        )
      );
    }

    if (result.ok) {
      recordCall({
        tool: name,
        fingerprint,
        commissionerId,
        input: args,
        ok: true,
        errorCode: null,
        latencyMs: Date.now() - start,
        tier,
      });
      return jsonRpcSuccess(id, toolSuccessEnvelope(result.data));
    }

    recordCall({
      tool: name,
      fingerprint,
      commissionerId,
      input: args,
      ok: false,
      errorCode: result.error.code,
      latencyMs: Date.now() - start,
      tier,
    });
    return jsonRpcSuccess(
      id,
      toolErrorEnvelope(result.error.code, result.error.message, result.error.status)
    );
  } catch (err) {
    recordCall({
      tool: name,
      fingerprint,
      commissionerId,
      input: args,
      ok: false,
      errorCode: ERROR_CODES.INTERNAL.code,
      latencyMs: Date.now() - start,
      tier,
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonRpcSuccess(
      id,
      toolErrorEnvelope(ERROR_CODES.INTERNAL.code, message, 500)
    );
  }
}

// --- envelope helpers ---

// MCP convention: tools/call returns {content: [{type: "text", text: "..."}], isError?: bool}
// We return data as JSON-stringified text inside the content array, plus
// a parallel structuredContent field for clients that prefer typed access.
function toolSuccessEnvelope(data: unknown): unknown {
  return {
    content: [
      { type: "text", text: JSON.stringify(data, null, 2) },
    ],
    structuredContent: data,
    isError: false,
  };
}

function toolErrorEnvelope(code: string, message: string, status: number): unknown {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: { code, message, status } }, null, 2),
      },
    ],
    structuredContent: { error: { code, message, status } },
    isError: true,
  };
}

function jsonRpcSuccess(id: string | number | null, result: unknown): Response {
  const body: JsonRpcSuccess = { jsonrpc: "2.0", id, result };
  return NextResponse.json(body);
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): Response {
  const body: JsonRpcError = {
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  };
  return NextResponse.json(body);
}
