// JSON-RPC 2.0 error helpers for TILT MCP server.
// Maps HTTP-style error codes to JSON-RPC error responses where appropriate.

export const ERROR_CODES = {
  AUTH_MISSING: { code: "auth_missing", status: 401 },
  AUTH_INVALID: { code: "auth_invalid", status: 401 },
  AUTH_BRIDGE_PENDING: { code: "auth_bridge_pending", status: 503 },
  FORBIDDEN_NOT_ORGANIZER: { code: "forbidden_not_organizer", status: 403 },
  POOL_NOT_FOUND: { code: "pool_not_found", status: 404 },
  TOURNAMENT_NOT_FOUND: { code: "tournament_not_found", status: 404 },
  IDEMPOTENCY_CONFLICT: { code: "idempotency_conflict", status: 409 },
  IDEMPOTENCY_KEY_MISSING: { code: "idempotency_key_missing", status: 400 },
  RATE_LIMITED: { code: "rate_limited", status: 429 },
  BATCH_TOO_LARGE: { code: "batch_too_large", status: 400 },
  INPUT_INVALID: { code: "input_invalid", status: 400 },
  TIER_LIMIT: { code: "tier_limit", status: 402 },
  TOOL_NOT_FOUND: { code: "tool_not_found", status: 404 },
  TOOL_DEFERRED: { code: "tool_deferred_to_day_4", status: 501 },
  INTERNAL: { code: "internal", status: 500 },
} as const;

export type ErrorKey = keyof typeof ERROR_CODES;

export interface ToolError {
  code: string;
  message: string;
  status: number;
}

export function toolError(key: ErrorKey, message: string): ToolError {
  return { code: ERROR_CODES[key].code, message, status: ERROR_CODES[key].status };
}

// JSON-RPC 2.0 reserved error codes. Map our string codes to the closest
// JSON-RPC int code for protocol-level errors; tool-level errors travel
// inside the result envelope instead.
export const JSONRPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;
