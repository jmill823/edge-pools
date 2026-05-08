// PII strip rule per spec § Signal instrumentation.
// Strip: email, emails[*], name. Keep: pool_id, tournament_id,
// idempotency_key, counts, status fields, error codes.

const PII_KEYS = new Set(["email", "emails", "name", "displayName", "to"]);

export function stripPii(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stripPii);
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.has(k)) {
      if (Array.isArray(v)) {
        out[k] = `[redacted ${v.length} item${v.length === 1 ? "" : "s"}]`;
      } else {
        out[k] = "[redacted]";
      }
      continue;
    }
    out[k] = stripPii(v);
  }
  return out;
}
