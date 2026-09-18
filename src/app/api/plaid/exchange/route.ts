import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { auditEvents } from "@/db/schema";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
// MFA_STEP_UP_MAX_AGE_SECONDS still bounds how long a link-token
// authorization stays exchangeable, for BOTH doors — the window is a property
// of the authorization, not of how the caller proved themselves.
import { MFA_STEP_UP_MAX_AGE_SECONDS } from "@/lib/auth/mfaAssurance";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { resolvePlaidPrincipal } from "@/lib/plaid/connectionPrincipal";
import { db } from "@/lib/db";
import { persistPlaidSecret } from "@/lib/plaid/secureDataStore";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";
import { persistSyntheticFixtureLineage } from "@/lib/testing/syntheticFixtureLineageStore";

const PLAID_SYNTHETIC_SCENARIOS = new Set([
  "plaid-link",
  "plaid-account-ownership",
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function activePlaidSyntheticFixture(
  req: NextRequest,
  email: string | null | undefined,
  secret: string,
): SyntheticFixtureContext | null {
  const raw = req.cookies.get(SYNTHETIC_FIXTURE_COOKIE)?.value;
  if (!raw) return null;
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (!normalizedEmail)
    throw new Error("Synthetic Plaid testing requires an operator email.");
  const context = verifySyntheticFixtureSessionToken(
    raw,
    secret,
    normalizedEmail,
  );
  if (!context)
    throw new Error("Synthetic Plaid fixture is invalid or expired.");
  if (!PLAID_SYNTHETIC_SCENARIOS.has(context.scenarioId)) {
    throw new Error(
      "The active synthetic fixture is not authorized for Plaid testing.",
    );
  }
  return context;
}

function auditSyntheticFixture(
  payload: unknown,
): Record<string, unknown> | null {
  const root = record(payload);
  const data = record(root.data);
  const fixture = record(data.syntheticFixture);
  return Object.keys(fixture).length ? fixture : null;
}

function plaidBaseUrl() {
  const env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    publicToken?: string;
    authorizationRef?: string;
    token?: string;
  } | null;
  const publicToken = body?.publicToken?.trim();
  const authorizationRef = body?.authorizationRef?.trim();
  if (!publicToken || !authorizationRef) {
    return NextResponse.json(
      {
        ok: false,
        error: "Plaid public token and authorization reference are required.",
      },
      { status: 400 },
    );
  }

  // Same two doors, same rules as link-token. Both routes must agree, or the
  // weaker one becomes the way in.
  const resolution = await resolvePlaidPrincipal(req, body);
  if (!resolution.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: resolution.error,
        ...(resolution.identityRequired ? { identityRequired: true } : {}),
      },
      { status: resolution.status },
    );
  }
  const principal = resolution.principal;

  let syntheticFixtureContext: SyntheticFixtureContext | null = null;
  if (principal.door === "staff-session") {
    const secret = resolveNextAuthSecret();
    if (!secret)
      return NextResponse.json(
        { ok: false, error: "Session signing authority unavailable." },
        { status: 503 },
      );
    try {
      syntheticFixtureContext = activePlaidSyntheticFixture(
        req,
        principal.email,
        secret,
      );
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Synthetic Plaid authorization failed.",
        },
        { status: 403 },
      );
    }
  }

  const cutoff = new Date(Date.now() - MFA_STEP_UP_MAX_AGE_SECONDS * 1000);
  const authRows = await db
    .select({ id: auditEvents.id, payload: auditEvents.payload })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.id, authorizationRef),
        eq(auditEvents.userId, principal.auditUserId),
        eq(auditEvents.eventType, "PLAID_LINK_AUTHORIZED"),
        gt(auditEvents.createdAt, cutoff),
      ),
    )
    .limit(1);
  if (!authRows[0]) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Plaid authorization is missing, expired, or belongs to another session.",
      },
      { status: 403 },
    );
  }
  const authorizedFixture = auditSyntheticFixture(authRows[0].payload);
  if (authorizedFixture || syntheticFixtureContext) {
    if (
      !authorizedFixture ||
      !syntheticFixtureContext ||
      authorizedFixture.testRunId !== syntheticFixtureContext.testRunId ||
      authorizedFixture.syntheticPersonaId !==
        syntheticFixtureContext.syntheticPersonaId ||
      authorizedFixture.scenarioId !== syntheticFixtureContext.scenarioId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Plaid synthetic-fixture lineage does not match its authorization.",
        },
        { status: 403 },
      );
    }
  }

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const plaidSecret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !plaidSecret)
    return NextResponse.json(
      { ok: false, error: "Plaid credentials are not configured." },
      { status: 503 },
    );

  const response = await fetch(`${plaidBaseUrl()}/item/public_token/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PLAID-CLIENT-ID": clientId,
      "PLAID-SECRET": plaidSecret,
    },
    body: JSON.stringify({ public_token: publicToken }),
  });
  const plaid = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (
    !response.ok ||
    typeof plaid.access_token !== "string" ||
    typeof plaid.item_id !== "string"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Plaid token exchange failed.",
        requestId: plaid.request_id ?? null,
      },
      { status: 502 },
    );
  }
  const secure = await persistPlaidSecret({
    subjectRef: principal.subjectRef,
    category: "access-token",
    value: { accessToken: plaid.access_token, itemId: plaid.item_id },
    consentRef: authorizationRef,
    retentionClass: "PLAID_ACTIVE_FINANCING",
    syntheticFixtureContext,
  });
  const itemRefHash = createHash("sha256").update(plaid.item_id).digest("hex");
  const connectedAudit = await writeAuditEvent({
    userId: principal.auditUserId,
    anonymousId: principal.anonymousId,
    eventType: "PLAID_ITEM_CONNECTED",
    entityType: "PLAID_SECURE_RECORD",
    entityId: secure.id,
    classification: "RESTRICTED",
    source: "api.plaid.exchange",
    moduleId: "api.plaid.exchange",
    actorRef: principal.actorRef,
    target: { type: "plaid-secure-record", id: secure.id },
    payload: {
      authorizationRef,
      secureRecordId: secure.id,
      itemRefHash,
      plaidRequestId: plaid.request_id ?? null,
      accessTokenPersistedPlaintext: false,
      door: principal.door,
      stepUp: principal.stepUp,
      syntheticFixture: syntheticFixtureContext,
    },
  });
  if (syntheticFixtureContext) {
    await persistSyntheticFixtureLineage({
      context: syntheticFixtureContext,
      recordType: "audit_event",
      recordId: connectedAudit.auditId,
      traceId: syntheticFixtureContext.testRunId,
      source: "api.plaid.exchange",
    });
  }

  return NextResponse.json({
    ok: true,
    connected: true,
    secureRecordId: secure.id,
    itemRefHash,
    syntheticFixture: syntheticFixtureContext
      ? {
          syntheticPersonaId: syntheticFixtureContext.syntheticPersonaId,
          testRunId: syntheticFixtureContext.testRunId,
          fixtureVersion: syntheticFixtureContext.fixtureVersion,
          environment: syntheticFixtureContext.environment,
          scenarioId: syntheticFixtureContext.scenarioId,
        }
      : null,
  });
}
