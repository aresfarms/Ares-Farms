import { NextRequest, NextResponse } from "next/server";

import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import { resolvePlaidPrincipal } from "@/lib/plaid/connectionPrincipal";
import { captureConsent } from "@/lib/privacy/consentRegistry";
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

function activePlaidSyntheticFixture(
  req: NextRequest,
  email: string | null | undefined,
  secret: string,
): SyntheticFixtureContext | null {
  const raw = req.cookies.get(SYNTHETIC_FIXTURE_COOKIE)?.value;
  if (!raw) return null;
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (!normalizedEmail) {
    throw new Error(
      "Synthetic Plaid testing requires an authenticated operator email.",
    );
  }
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

function plaidBaseUrl() {
  const env = (process.env.PLAID_ENV || "sandbox").trim().toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    consentAgreed?: boolean;
    dealRef?: string;
    token?: string;
  } | null;

  // Consent is checked BEFORE the caller is even resolved: opening Plaid Link
  // authorises ongoing access to account data, and that authorisation is the
  // customer's to give regardless of which door they came through.
  if (body?.consentAgreed !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "Explicit Plaid financial-account consent is required.",
      },
      { status: 400 },
    );
  }

  // ONE resolution point for both doors — staff session + fresh passkey MFA,
  // or a deal link token + a verified identity. See connectionPrincipal.ts.
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

  // Synthetic fixtures are an OPERATOR testing lane and stay staff-only: the
  // fixture token is bound to an operator email, which a customer has not got.
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

  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const plaidSecret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !plaidSecret) {
    return NextResponse.json(
      { ok: false, error: "Plaid credentials are not configured." },
      { status: 503 },
    );
  }

  const consent = captureConsent("plaid-financial-account-access", true);
  const dealRef = principal.dealRef;
  const authorization = await writeAuditEvent({
    userId: principal.auditUserId,
    anonymousId: principal.anonymousId,
    eventType: "PLAID_LINK_AUTHORIZED",
    entityType: "PLAID_LINK_AUTHORIZATION",
    entityId: dealRef ?? principal.subjectRef,
    classification: "RESTRICTED",
    source: "api.plaid.link-token",
    moduleId: "api.plaid.link-token",
    actorRef: principal.actorRef,
    target: { type: "financial-account-connection", id: dealRef ?? principal.subjectRef },
    payload: {
      consent,
      dealRef,
      // Which door, and the evidence that opened it. A reader of this audit
      // record must be able to tell WHY the connection was permitted.
      door: principal.door,
      stepUp: principal.stepUp,
      sessionVersion: principal.sessionVersion,
      syntheticFixture: syntheticFixtureContext,
    },
  });
  if (syntheticFixtureContext) {
    await persistSyntheticFixtureLineage({
      context: syntheticFixtureContext,
      recordType: "audit_event",
      recordId: authorization.auditId,
      traceId: syntheticFixtureContext.testRunId,
      source: "api.plaid.link-token",
    });
  }

  const end = new Date();
  const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
  const response = await fetch(`${plaidBaseUrl()}/link/token/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "PLAID-CLIENT-ID": clientId,
      "PLAID-SECRET": plaidSecret,
    },
    body: JSON.stringify({
      client_name: "Furlong",
      language: "en",
      country_codes: ["US"],
      user: {
        client_user_id: syntheticFixtureContext
          ? `${principal.plaidClientUserId}:${syntheticFixtureContext.testRunId}`
          : principal.plaidClientUserId,
      },
      products: ["identity"],
      required_if_supported_products: ["statements"],
      statements: { start_date: dateOnly(start), end_date: dateOnly(end) },
    }),
  });
  const plaid = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok || typeof plaid.link_token !== "string") {
    const failureAudit = await writeAuditEvent({
      userId: principal.auditUserId,
      anonymousId: principal.anonymousId,
      eventType: "PLAID_LINK_TOKEN_FAILED",
      entityType: "PLAID_LINK_AUTHORIZATION",
      entityId: authorization.auditId,
      classification: "RESTRICTED",
      source: "api.plaid.link-token",
      payload: {
        authorizationRef: authorization.auditId,
        plaidErrorCode: plaid.error_code ?? null,
        requestId: plaid.request_id ?? null,
        syntheticFixture: syntheticFixtureContext,
      },
    });
    if (syntheticFixtureContext) {
      await persistSyntheticFixtureLineage({
        context: syntheticFixtureContext,
        recordType: "audit_event",
        recordId: failureAudit.auditId,
        traceId: syntheticFixtureContext.testRunId,
        source: "api.plaid.link-token",
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Plaid Link token creation failed.",
        requestId: plaid.request_id ?? null,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    linkToken: plaid.link_token,
    expiration: plaid.expiration ?? null,
    authorizationRef: authorization.auditId,
    consent: {
      id: consent.consentId,
      version: consent.version,
      textSha256: consent.textSha256,
    },
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
