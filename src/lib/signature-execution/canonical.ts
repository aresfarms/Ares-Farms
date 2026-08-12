import { createHash } from "node:crypto";

export function signatureSha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function signatureCanonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(signatureCanonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${signatureCanonicalJson(record[key])}`).join(",")}}`;
}
