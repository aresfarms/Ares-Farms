import { createHmac, timingSafeEqual } from "node:crypto";

import { readRequiredSecret, sha256Digest } from "@/lib/security/requestGuards";

const REPORT_TOKEN_TTL_MS = 5 * 60 * 1000;

type ReportTokenPayload = {
  digest: string;
  contextKey: string;
  issuedAt: number;
  expiresAt: number;
};

// Development-only fallback: when the owner secret is absent OUTSIDE
// production, sign with an ephemeral per-process secret so local PDF
// generation works (tokens are issued and verified by the same process).
// Production still hard-fails without the real secret — the attestation's
// integrity guarantee is unchanged where it matters.
let devEphemeralSecret: string | null = null;

function signingSecret(): string {
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    if (!devEphemeralSecret) {
      devEphemeralSecret = createHmac("sha256", String(process.pid))
        .update(String(Date.now()))
        .digest("base64url");
    }
    return devEphemeralSecret;
  }
  throw new Error("REPORT_SIGNING_SECRET is not configured for this environment.");
}

function signBody(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

function encodePayload(payload: ReportTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(token: string): ReportTokenPayload | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ReportTokenPayload;
    if (
      typeof parsed.digest !== "string" ||
      typeof parsed.contextKey !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildReportDigest(report: unknown): string {
  return sha256Digest(JSON.stringify(report));
}

export function buildReportContextKey(input: {
  propertyId?: string | null;
  exactAddress?: string | null;
  title?: string | null;
  tierId?: string | null;
}): string {
  return sha256Digest(
    [
      input.propertyId ?? "",
      input.exactAddress ?? "",
      input.title ?? "",
      input.tierId ?? "",
    ].join("|")
  );
}

export function issueReportAttestation(input: {
  digest: string;
  contextKey: string;
  now?: number;
}): string {
  const issuedAt = input.now ?? Date.now();
  const payload: ReportTokenPayload = {
    digest: input.digest,
    contextKey: input.contextKey,
    issuedAt,
    expiresAt: issuedAt + REPORT_TOKEN_TTL_MS,
  };
  const body = encodePayload(payload);
  const signature = signBody(body);
  return `${body}.${signature}`;
}

export function verifyReportAttestation(input: {
  token: string;
  digest: string;
  contextKey: string;
  now?: number;
}): { ok: true } | { ok: false; error: string } {
  const [body, signature] = input.token.split(".");
  if (!body || !signature) {
    return { ok: false, error: "Report attestation token is malformed." };
  }

  const expectedSignature = signBody(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expectedSignature);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, error: "Report attestation token signature is invalid." };
  }

  const payload = decodePayload(body);
  if (!payload) {
    return { ok: false, error: "Report attestation token payload is invalid." };
  }

  const now = input.now ?? Date.now();
  if (payload.expiresAt < now) {
    return { ok: false, error: "Report attestation token has expired." };
  }

  if (payload.digest !== input.digest || payload.contextKey !== input.contextKey) {
    return { ok: false, error: "Report attestation token does not match this report payload." };
  }

  return { ok: true };
}
