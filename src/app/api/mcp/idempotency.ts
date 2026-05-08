// Idempotency keys for MCP write tools — SCAFFOLD for Day 2.
//
// Day 2 has no write tools (read tools never need idempotency). Day 4
// implementations of `add_players` and `nudge_late_pickers` will use this
// module. Stored in-memory for now; Day 4 will swap to a DB-backed store
// (likely a new Prisma model) so keys survive serverless cold starts.
//
// Contract per spec § Idempotency model:
// - Key = (commissionerId, toolName, idempotencyKey)
// - Same key + normalized-equal payload within TTL → return cached result
// - Same key + different payload → 409 conflict
// - Missing key on a write tool → 400 bad_request (caller side check)

export interface IdempotencyEntry<T = unknown> {
  payloadFingerprint: string;
  result: T;
  createdAt: number;
  ttlMs: number;
}

export interface IdempotencyCheckResult<T> {
  status: "fresh" | "cached" | "conflict";
  cached?: T;
}

export interface IdempotencyStore {
  get<T>(key: string): Promise<IdempotencyEntry<T> | null>;
  set<T>(key: string, entry: IdempotencyEntry<T>): Promise<void>;
}

const memoryStore = new Map<string, IdempotencyEntry>();

export const inMemoryStore: IdempotencyStore = {
  async get<T>(key: string): Promise<IdempotencyEntry<T> | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      memoryStore.delete(key);
      return null;
    }
    return entry as IdempotencyEntry<T>;
  },
  async set<T>(key: string, entry: IdempotencyEntry<T>): Promise<void> {
    memoryStore.set(key, entry);
  },
};

export function buildKey(
  commissionerId: string,
  toolName: string,
  idempotencyKey: string
): string {
  return `${commissionerId}::${toolName}::${idempotencyKey}`;
}

// Normalizes a payload for fingerprint comparison. add_players sorts
// emails lowercased before comparison; nudge_late_pickers has only
// pool_id so normalization is a noop. Tool implementations on Day 4
// pass already-normalized payloads.
export function fingerprintPayload(payload: unknown): string {
  return JSON.stringify(payload);
}

export async function checkAndStore<T>(
  store: IdempotencyStore,
  key: string,
  payload: unknown,
  ttlMs: number,
  exec: () => Promise<T>
): Promise<IdempotencyCheckResult<T>> {
  const fingerprint = fingerprintPayload(payload);
  const existing = await store.get<T>(key);
  if (existing) {
    if (existing.payloadFingerprint === fingerprint) {
      return { status: "cached", cached: existing.result };
    }
    return { status: "conflict" };
  }
  const result = await exec();
  await store.set<T>(key, {
    payloadFingerprint: fingerprint,
    result,
    createdAt: Date.now(),
    ttlMs,
  });
  return { status: "fresh", cached: result };
}
