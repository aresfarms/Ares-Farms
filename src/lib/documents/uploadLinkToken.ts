/**
 * uploadLinkToken — the "sovereign link" (founder direction 2026-08-05):
 * a signed, expiring, single-purpose link a borrower uses to upload
 * financial/PII documents into governed custody for the licensed lender —
 * replacing email, which is no longer a compliant channel for this.
 *
 * Stateless HMAC design (no new table, no new secret): the token is
 * HMAC-SHA256 over a domain-separated payload using the already-provisioned
 * REPORT_SIGNING_SECRET. The payload carries only non-PII routing facts:
 * the application id, a customer-facing deal reference, and expiry.
 * Possession of the link IS the authorization to *submit* documents for
 * that one deal — it grants no read access to anything, ever.
 *
 * Master Volume Governance: Vol II regulated-document boundaries; Vol III
 * deterministic verification + replay-safe (no server session state);
 * Vol V classification and consent carried by the downstream stores.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DOMAIN = "furlong-borrower-doc-upload-v1";
const LINK_TTL_HOURS = 72;

export interface UploadLinkClaims {
  applicationId: string;
  dealRef: string;
  expiresAt: string; // ISO
}

function secret(): string {
  const configured = process.env.REPORT_SIGNING_SECRET;
  if (configured && configured.trim()) return configured.trim();
  if (process.env.NODE_ENV !== "production") {
    // Dev-only ephemeral secret (same posture as report attestation): links
    // survive only the current process — fine for local testing, impossible
    // to mistake for production behavior.
    const g = globalThis as { __furlongDevUploadSecret?: string };
    if (!g.__furlongDevUploadSecret) g.__furlongDevUploadSecret = randomBytes(32).toString("hex");
    return g.__furlongDevUploadSecret;
  }
  throw new Error("REPORT_SIGNING_SECRET is not configured for this environment.");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`${DOMAIN}\n${payload}`).digest("base64url");
}

export function mintUploadLinkToken(args: { applicationId: string; dealRef: string }): {
  token: string;
  claims: UploadLinkClaims;
} {
  const claims: UploadLinkClaims = {
    applicationId: args.applicationId,
    dealRef: args.dealRef,
    expiresAt: new Date(Date.now() + LINK_TTL_HOURS * 3_600_000).toISOString(),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, claims };
}

export function verifyUploadLinkToken(token: string): UploadLinkClaims | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadLinkClaims;
    if (!claims.applicationId || !claims.dealRef || !claims.expiresAt) return null;
    if (new Date(claims.expiresAt).getTime() < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
