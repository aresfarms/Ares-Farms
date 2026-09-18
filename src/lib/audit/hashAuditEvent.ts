import crypto from "crypto";

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Audit hash payload contains a non-finite number.");
    return Object.is(value, -0) ? 0 : value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) =>
      item === undefined ? null : canonicalize(item),
    );
  }
  if (value && typeof value === "object") {
    const jsonValue =
      typeof (value as { toJSON?: unknown }).toJSON === "function"
        ? (value as { toJSON: () => unknown }).toJSON()
        : value;
    if (jsonValue !== value) return canonicalize(jsonValue);
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  throw new TypeError(
    `Audit hash payload contains unsupported type: ${typeof value}`,
  );
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/** Deterministic SHA-256 hash for canonical audit-chain v2. */
export function hashAuditEvent(input: {
  prev_hash: string | null;
  payload: unknown;
}) {
  return crypto
    .createHash("sha256")
    .update(
      canonicalJson({
        prev_hash: input.prev_hash ?? "GENESIS",
        payload: input.payload,
      }),
    )
    .digest("hex");
}
