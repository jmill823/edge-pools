// MCP commissioner auth — STUB for Day 2 (v0.6 spec).
//
// Day 4 replaces this with a real Personal Access Token (PAT) validator
// (the v0.6 spec pivoted away from Clerk OAuth Applications because the
// tenant doesn't support that feature on its plan). Until then this stub
// provides:
//   1. A development-mode bypass via env vars so Day 3 dogfood can run
//      against Jeff's actual pools.
//   2. A stable, queryable error envelope ("auth_bridge_pending") for any
//      caller that doesn't satisfy the dev-bypass path. The error shape
//      will remain consistent when PAT validation lands on Day 4 — calling
//      code does not need to change.
//
// Production guard (watch-item 1 from Day 2 review): if NODE_ENV is
// production and MCP_DEV_BYPASS_TOKEN is set, the module throws at load
// time. This crashes the function on cold start so a misconfigured deploy
// surfaces immediately instead of silently leaving dev-bypass active.

import { prisma } from "@/lib/db";
import { ERROR_CODES, type ToolError } from "./lib/errors";
import type { AuthContext, Tier } from "./lib/types";

const DEV_BYPASS_TOKEN = process.env.MCP_DEV_BYPASS_TOKEN;
const DEV_COMMISSIONER_USER_ID = process.env.MCP_DEV_COMMISSIONER_USER_ID;

if (process.env.NODE_ENV === "production" && DEV_BYPASS_TOKEN) {
  throw new Error(
    "MCP_DEV_BYPASS_TOKEN must not be set in production. " +
      "This env var enables a development-only auth bypass and is forbidden " +
      "in production deploys. Unset it in your hosting environment and redeploy."
  );
}

export type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; error: ToolError };

export async function resolveAuth(req: Request): Promise<AuthResult> {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.AUTH_MISSING.code,
        status: ERROR_CODES.AUTH_MISSING.status,
        message:
          "Missing Authorization: Bearer <token> header. Generate a token at https://playtilt.io/settings/api-tokens and paste it into your MCP client config.",
      },
    };
  }

  const token = header.slice("Bearer ".length).trim();

  // --- Dev bypass path. Only active when both env vars set AND
  // NODE_ENV is not production (the load-time check above hard-stops
  // production but we belt-and-suspenders this branch too). ---
  if (
    process.env.NODE_ENV !== "production" &&
    DEV_BYPASS_TOKEN &&
    DEV_COMMISSIONER_USER_ID &&
    token === DEV_BYPASS_TOKEN
  ) {
    const user = await prisma.user.findUnique({
      where: { id: DEV_COMMISSIONER_USER_ID },
      select: { id: true },
    });
    if (!user) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID.code,
          status: ERROR_CODES.AUTH_INVALID.status,
          message:
            "Dev-bypass commissioner user not found in DB. Check MCP_DEV_COMMISSIONER_USER_ID.",
        },
      };
    }
    return {
      ok: true,
      context: {
        commissionerId: user.id,
        tier: resolveTier(user.id),
      },
    };
  }

  // --- Real PAT validation. Day 4. ---
  return {
    ok: false,
    error: {
      code: ERROR_CODES.AUTH_BRIDGE_PENDING.code,
      status: ERROR_CODES.AUTH_BRIDGE_PENDING.status,
      message:
        "MCP auth bridge not yet available. Public tools (market_coverage) work without auth; commissioner tools land Day 4 with PAT validation. Generate a token at https://playtilt.io/settings/api-tokens once that ships.",
    },
  };
}

// Tier resolution. Day 4 will look this up against a billing/subscription
// record. For now every commissioner is "free" — sufficient for Day 2
// scaffolding because no v1 read tool tier-gates beyond auth.
function resolveTier(commissionerId: string): Tier {
  void commissionerId;
  return "free";
}

// Helper for tools that must verify the commissioner organizes the pool.
export async function requireOrganizer(
  commissionerId: string,
  poolId: string
): Promise<{ ok: true } | { ok: false; error: ToolError }> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { id: true, organizerId: true },
  });
  if (!pool) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.POOL_NOT_FOUND.code,
        status: ERROR_CODES.POOL_NOT_FOUND.status,
        message: `Pool ${poolId} not found.`,
      },
    };
  }
  if (pool.organizerId !== commissionerId) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.FORBIDDEN_NOT_ORGANIZER.code,
        status: ERROR_CODES.FORBIDDEN_NOT_ORGANIZER.status,
        message: "You are not the organizer of this pool.",
      },
    };
  }
  return { ok: true };
}
