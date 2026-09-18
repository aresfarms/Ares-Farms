/**
 * customerDownloadToken — the return leg of the sovereign document loop
 * (founder direction 2026-08-05): when the licensed lender sends a document
 * BACK to the customer (approval letter, term sheet, disclosure), the
 * customer retrieves it through a signed, expiring, single-document link —
 * never email attachments.
 *
 * Same stateless HMAC design as uploadLinkToken (domain-separated over the
 * already-provisioned REPORT_SIGNING_SECRET). Claims carry only routing
 * facts: ONE document id + the deal reference + expiry. Possession
 * authorizes streaming that one lender-provided document, nothing else —
 * borrower-uploaded documents are NEVER downloadable this way.
 *
 * Master Volume Governance: Vol II regulated-document boundaries (customer
 * receives only what the lender addressed to them); Vol III deterministic
 * stateless verification; Vol V audit-safe minimum disclosure.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DOMAIN = "furlong-customer-doc-download-v1";
const LINK_TTL_HOURS = 2;

export interface CustomerDownloadClaims {
  documentId: string;
  dealRef: string;
  expiresAt: string; // ISO
}

function secret(): string {
  const configured = process.env.REPORT_SIGNING_SECRET;
  if (configured && configured.trim()) return configured.trim();
  if (process.env.NODE_ENV !== "production") {
    const g = globalThis as { __furlongDevUploadSecret?: string };
    if (!g.__furlongDevUploadSecret) g.__furlongDevUploadSecret = randomBytes(32).toString("hex");
    return g.__furlongDevUploadSecret;
  }
  throw new Error("REPORT_SIGNING_SECRET is not configured for this environment.");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`${DOMAIN}\n${payload}`).digest("base64url");
}

export function mintCustomerDownloadToken(args: { documentId: string; dealRef: string }): {
  token: string;
  claims: CustomerDownloadClaims;
} {
  const claims: CustomerDownloadClaims = {
    documentId: args.documentId,
    dealRef: args.dealRef,
    expiresAt: new Date(Date.now() + LINK_TTL_HOURS * 3_600_000).toISOString(),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, claims };
}

export function verifyCustomerDownloadToken(token: string): CustomerDownloadClaims | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CustomerDownloadClaims;
    if (!claims.documentId || !claims.dealRef || !claims.expiresAt) return null;
    if (new Date(claims.expiresAt).getTime() < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
