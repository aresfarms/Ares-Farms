import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { ensureAccessSecurityState } from "@/lib/auth/accessSecurityRuntime";
import {
  MFA_ASSURANCE_COOKIE,
  MFA_STEP_UP_MAX_AGE_SECONDS,
  verifyMfaAssurance,
} from "@/lib/auth/mfaAssurance";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
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
  const session = await getServerSession(authOptions);
  const user = session?.user as
    { id?: string; email?: string; sessionVersion?: number } | undefined;
  if (!user?.id)
    return NextResponse.json(
      { ok: false, error: "Authenticated user required." },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    consentAgreed?: boolean;
    dealRef?: string;
  } | null;
  if (body?.consentAgreed !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "Explicit Plaid financial-account consent is required.",
      },
      { status: 400 },
    );
  }

  const state = await ensureAccessSecurityState(user.id);
  if (
    typeof user.sessionVersion === "number" &&
    user.sessionVersion !== state.sessionVersion
  ) {
    return NextResponse.json(
      { ok: false, error: "Session authority has changed. Sign in again." },
      { status: 401 },
    );
  }
  const secret = resolveNextAuthSecret();
  if (!secret)
    return NextResponse.json(
      { ok: false, error: "Session signing authority unavailable." },
      { status: 503 },
    );
  let syntheticFixtureContext: SyntheticFixtureContext | null = null;
  try {
    syntheticFixtureContext = activePlaidSyntheticFixture(
      req,
      user.email,
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
  const assurance = await verifyMfaAssurance({
    token: req.cookies.get(MFA_ASSURANCE_COOKIE)?.value,
    userId: user.id,
    sessionVersion: state.sessionVersion,
    secret,
    maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS,
  });
  if (!assurance)
    return NextResponse.json(
      {
        ok: false,
        error: "Fresh passkey MFA is required before Plaid Link can open.",
      },
      { status: 403 },
    );
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const plaidSecret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !plaidSecret) {
    return NextResponse.json(
      { ok: false, error: "Plaid credentials are not configured." },
      { status: 503 },
    );
  }

  const consent = captureConsent("plaid-financial-account-access", true);
  const dealRef = body?.dealRef?.trim().slice(0, 120) || null;
  const authorization = await writeAuditEvent({
    userId: user.id,
    eventType: "PLAID_LINK_AUTHORIZED",
    entityType: "PLAID_LINK_AUTHORIZATION",
    entityId: dealRef ?? user.id,
    classification: "RESTRICTED",
    source: "api.plaid.link-token",
    moduleId: "api.plaid.link-token",
    actorRef: `user:${user.id}`,
    target: { type: "financial-account-connection", id: dealRef ?? user.id },
    payload: {
      consent,
      dealRef,
      mfaMethod: assurance.method,
      mfaVerifiedAt: assurance.verifiedAt,
      sessionVersion: state.sessionVersion,
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
          ? `${user.id}:${syntheticFixtureContext.testRunId}`
          : user.id,
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
      userId: user.id,
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
