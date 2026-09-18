/**
 * signingToken — authorizes ONE customer signing ceremony for ONE document
 * (founder-approved signature vault, 2026-08-06). Minted only by the status
 * lookup (ref + email is the customer's authentication), short-lived, and
 * single-purpose: it opens the ceremony and submits the signature for that
 * document — no other read or write.
 *
 * Same stateless HMAC design as the upload/download tokens (domain-separated
 * over REPORT_SIGNING_SECRET).
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DOMAIN = "furlong-document-signing-v1";
const LINK_TTL_HOURS = 2;

export interface SigningClaims {
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

export function mintSigningToken(args: { documentId: string; dealRef: string }): {
  token: string;
  claims: SigningClaims;
} {
  const claims: SigningClaims = {
    documentId: args.documentId,
    dealRef: args.dealRef,
    expiresAt: new Date(Date.now() + LINK_TTL_HOURS * 3_600_000).toISOString(),
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, claims };
}

export function verifySigningToken(token: string): SigningClaims | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SigningClaims;
    if (!claims.documentId || !claims.dealRef || !claims.expiresAt) return null;
    if (new Date(claims.expiresAt).getTime() < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
