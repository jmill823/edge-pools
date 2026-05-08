// late_pickers — commissioner read tool.
// Wraps GET /api/pools/[id]/members, filtered to entriesSubmitted: 0.
// Read-only; sends nothing. Companion to nudge_late_pickers (Day 4).

import { prisma } from "@/lib/db";
import { requireOrganizer } from "../auth";
import { ERROR_CODES, type ToolError } from "../lib/errors";
import type { LatePickersOutput } from "../lib/types";

export interface LatePickersInput {
  pool_id: string;
}

export type LatePickersResult =
  | { ok: true; data: LatePickersOutput }
  | { ok: false; error: ToolError };

export async function runLatePickers(
  input: LatePickersInput,
  commissionerId: string
): Promise<LatePickersResult> {
  if (!input.pool_id || typeof input.pool_id !== "string") {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.INPUT_INVALID.code,
        status: ERROR_CODES.INPUT_INVALID.status,
        message: "pool_id is required and must be a string.",
      },
    };
  }

  const orgCheck = await requireOrganizer(commissionerId, input.pool_id);
  if (!orgCheck.ok) return { ok: false, error: orgCheck.error };

  const members = await prisma.poolMember.findMany({
    where: { poolId: input.pool_id },
    include: { user: { select: { id: true, displayName: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const entryCounts = await prisma.entry.groupBy({
    by: ["userId"],
    where: { poolId: input.pool_id },
    _count: true,
  });
  const counts = new Map(entryCounts.map((e) => [e.userId, e._count]));

  const latePickers = members
    .filter((m) => (counts.get(m.userId) ?? 0) === 0)
    .map((m) => ({
      name: m.user.displayName,
      email: m.user.email,
      // Field renamed from spec's `last_seen` to `joined_at` per v0.6 watch-
      // item: the underlying PoolMember has no last-activity column, so the
      // honest field name is the one that matches what we actually return.
      joined_at: m.joinedAt.toISOString(),
    }));

  return {
    ok: true,
    data: {
      late_pickers: latePickers,
      total_pending: latePickers.length,
    },
  };
}
