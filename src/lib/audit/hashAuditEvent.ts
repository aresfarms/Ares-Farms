import crypto from "crypto";

/**
 * Deterministic SHA256 hash for audit chaining
 */
export function hashAuditEvent(input: {
  prev_hash: string | null;
  payload: any;
}) {
  const data = JSON.stringify({
    prev_hash: input.prev_hash ?? "GENESIS",
    payload: input.payload,
  });

  return crypto.createHash("sha256").update(data).digest("hex");
}
