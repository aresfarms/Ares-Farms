import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { auditEvents } from "@/db/schema";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import { MFA_ASSURANCE_COOKIE, MFA_STEP_UP_MAX_AGE_SECONDS, verifyMfaAssurance } from "@/lib/auth/mfaAssurance";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { db } from "@/lib/db";
import { persistPlaidSecret } from "@/lib/plaid/secureDataStore";

function plaidBaseUrl() {
  const env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; sessionVersion?: number } | undefined;
  if (!user?.id) return NextResponse.json({ ok: false, error: "Authenticated user required." }, { status: 401 });
  const body = await req.json().catch(() => null) as { publicToken?: string; authorizationRef?: string } | null;
  const publicToken = body?.publicToken?.trim();
  const authorizationRef = body?.authorizationRef?.trim();
  if (!publicToken || !authorizationRef) {
    return NextResponse.json({ ok: false, error: "Plaid public token and authorization reference are required." }, { status: 400 });
  }

  const state = await ensureAccessSecurityState(user.id);
  if (typeof user.sessionVersion === "number" && user.sessionVersion !== state.sessionVersion) {
    return NextResponse.json({ ok: false, error: "Session authority has changed. Sign in again." }, { status: 401 });
  }
  const secret = resolveNextAuthSecret();
  if (!secret) return NextResponse.json({ ok: false, error: "Session signing authority unavailable." }, { status: 503 });
  const assurance = await verifyMfaAssurance({ token: req.cookies.get(MFA_ASSURANCE_COOKIE)?.value, userId: user.id, sessionVersion: state.sessionVersion, secret, maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS });
  if (!assurance) return NextResponse.json({ ok: false, error: "Fresh passkey MFA is required for Plaid token exchange." }, { status: 403 });

  const cutoff = new Date(Date.now() - MFA_STEP_UP_MAX_AGE_SECONDS * 1000);
  const authRows = await db.select({ id: auditEvents.id, payload: auditEvents.payload })
    .from(auditEvents)
    .where(and(
      eq(auditEvents.id, authorizationRef),
      eq(auditEvents.userId, user.id),
      eq(auditEvents.eventType, "PLAID_LINK_AUTHORIZED"),
      gt(auditEvents.createdAt, cutoff),
    ))
    .limit(1);
  if (!authRows[0]) {
    return NextResponse.json({ ok: false, error: "Plaid authorization is missing, expired, or belongs to another session." }, { status: 403 });
  }

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const plaidSecret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !plaidSecret) return NextResponse.json({ ok: false, error: "Plaid credentials are not configured." }, { status: 503 });

  const response = await fetch(`${plaidBaseUrl()}/item/public_token/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": plaidSecret },
    body: JSON.stringify({ public_token: publicToken }),
  });
  const plaid = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof plaid.access_token !== "string" || typeof plaid.item_id !== "string") {
    return NextResponse.json({ ok: false, error: "Plaid token exchange failed.", requestId: plaid.request_id ?? null }, { status: 502 });
  }
  const secure = await persistPlaidSecret({
    subjectRef: `user:${user.id}`,
    category: "access-token",
    value: { accessToken: plaid.access_token, itemId: plaid.item_id },
    consentRef: authorizationRef,
    retentionClass: "PLAID_ACTIVE_FINANCING",
  });
  const itemRefHash = createHash("sha256").update(plaid.item_id).digest("hex");
  await writeAuditEvent({
    userId: user.id,
    eventType: "PLAID_ITEM_CONNECTED",
    entityType: "PLAID_SECURE_RECORD",
    entityId: secure.id,
    classification: "RESTRICTED",
    source: "api.plaid.exchange",
    moduleId: "api.plaid.exchange",
    actorRef: `user:${user.id}`,
    target: { type: "plaid-secure-record", id: secure.id },
    payload: {
      authorizationRef,
      secureRecordId: secure.id,
      itemRefHash,
      plaidRequestId: plaid.request_id ?? null,
      accessTokenPersistedPlaintext: false,
      mfaVerifiedAt: assurance.verifiedAt,
    },
  });

  return NextResponse.json({ ok: true, connected: true, secureRecordId: secure.id, itemRefHash });
}
