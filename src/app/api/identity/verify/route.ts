import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { identityVerifications } from "@/db/schema";
import {
  IDENTITY_PROVIDER,
  identityReadiness,
  namesMatch,
  readVerificationOutcome,
  startVerification,
} from "@/lib/identity/stripeIdentity";
import { CONSENTS, captureConsent } from "@/lib/privacy/consentRegistry";
import { verifyUploadLinkToken } from "@/lib/documents/uploadLinkToken";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

/**
 * Identity Verification API — the only path to the `identity-verified`
 * assurance tier (src/lib/privacy/actionGate.ts).
 *
 * PUBLIC ROUTE, TOKEN-GATED. Customers have no accounts; possession of the
 * deal's signed link token is the authorization to open a verification for
 * THAT deal and no other.
 *
 * Two actions:
 *   start  — capture consent, open a Stripe session, return the hosted URL
 *   status — report where the subject stands (read-only, safe to poll)
 *
 * THE OUTCOME IS NEVER SET HERE. `verified` flips only in the Stripe webhook
 * after signature verification. A client returning from Stripe saying "I'm
 * done" is a UI event, not evidence — see the webhook handler.
 *
 * Master Volume Governance: Vol II (consent recorded before action, minimum
 * disclosure), Vol III-B (GOV-RUNTIME-001 observability), Vol V (replay-safe).
 */

const CONSENT_ID = "identity-verification" as const;

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<{
    action?: unknown;
    token?: unknown;
    consented?: unknown;
    requestName?: unknown;
  }>(req, { maxBytes: 8 * 1024 });
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.body;
  const action = typeof body.action === "string" ? body.action : "";
  const token = typeof body.token === "string" ? body.token.slice(0, 2048) : "";

  const claims = verifyUploadLinkToken(token);
  if (!claims) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This link is invalid or has expired. Ask your contact for a fresh one — expiring links are part of how the channel stays safe.",
      },
      { status: 401 }
    );
  }
  const subjectRef = claims.applicationId;
  const traceId = `identity-verify-${subjectRef}-${Date.now().toString(36)}`;

  // ---- status ------------------------------------------------------------
  if (action === "status") {
    const [record] = await db
      .select()
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.subjectRef, subjectRef),
          eq(identityVerifications.provider, IDENTITY_PROVIDER)
        )
      )
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);

    return NextResponse.json({
      ok: true,
      // Absence is an answer, and it is the honest one: not started.
      status: record?.status ?? "not-started",
      verified: record?.verified ?? false,
      nameMatchedRequest: record?.nameMatchedRequest ?? null,
      mode: record?.mode ?? identityReadiness().mode,
      lastErrorCode: record?.lastErrorCode ?? null,
    });
  }

  // ---- start -------------------------------------------------------------
  if (action === "start") {
    const readiness = identityReadiness();
    if (!readiness.configured) {
      // Degrade honestly. A person must never be told they are verified, or
      // that verification is unavailable "temporarily", when the truth is the
      // environment has no provider.
      return NextResponse.json(
        {
          ok: false,
          error:
            "Identity verification is not active in this environment. Nothing you do here can complete it yet.",
          reason: readiness.reason,
        },
        { status: 503 }
      );
    }

    // BIPA: the Stripe flow takes a selfie and compares it biometrically. No
    // consent, no capture — this is the one gate here with statutory teeth.
    if (body.consented !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: "Read and agree to the identity check statement before it can begin.",
          consentText: CONSENTS[CONSENT_ID].text,
          consentVersion: CONSENTS[CONSENT_ID].version,
        },
        { status: 400 }
      );
    }
    const consent = captureConsent(CONSENT_ID, true);

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    let started;
    try {
      started = await startVerification({
        subjectRef,
        subjectEmail: null,
        consentRef: `${consent.consentId}@${consent.version}`,
        returnUrl: `${origin}/status?identity=returned`,
        traceId,
      });
    } catch (error) {
      await createObservabilityEvent({
        eventType: "IDENTITY_VERIFICATION_START_FAILED",
        domain: "security",
        severity: "WARN",
        message: "A Stripe Identity session could not be opened.",
        traceId,
        replayRef: traceId,
        actorId: `customer:${claims.dealRef}`,
        module: "api.identity.verify",
        metadata: { subjectRef, reason: error instanceof Error ? error.message : "unknown" },
      });
      return NextResponse.json(
        { ok: false, error: "Identity verification could not be started. Nothing was captured." },
        { status: 502 }
      );
    }

    await db.insert(identityVerifications).values({
      subjectRef,
      provider: IDENTITY_PROVIDER,
      providerSessionId: started.providerSessionId,
      status: started.status,
      verified: false,
      consentRef: `${consent.consentId}@${consent.version}`,
      mode: started.mode,
      traceId,
      replayRef: traceId,
      metadata: {
        dealRef: claims.dealRef,
        consentTextSha256: consent.textSha256,
        consentCapturedAt: consent.capturedAtIso,
        // Carried so the webhook can run the name-match check without ever
        // persisting the verified name itself.
        requestName: typeof body.requestName === "string" ? body.requestName.slice(0, 140) : null,
      },
    });

    await createObservabilityEvent({
      eventType: "IDENTITY_VERIFICATION_STARTED",
      domain: "security",
      severity: "INFO",
      message:
        started.mode === "test"
          ? "A TEST-MODE identity verification session was opened."
          : "An identity verification session was opened.",
      traceId,
      replayRef: traceId,
      actorId: `customer:${claims.dealRef}`,
      module: "api.identity.verify",
      metadata: { subjectRef, providerSessionId: started.providerSessionId, mode: started.mode },
    });

    return NextResponse.json({
      ok: true,
      redirectUrl: started.redirectUrl,
      status: started.status,
      mode: started.mode,
      // Said plainly so a tester never mistakes a staging ceremony for a real
      // identity assertion.
      notice:
        started.mode === "test"
          ? "TEST MODE — this is a verification ceremony, not a live identity assertion."
          : null,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}

/**
 * Applied from the Stripe webhook ONLY, after signature verification.
 * Exported rather than inlined so the webhook has one obvious call and the
 * name-match logic lives beside the record it describes.
 */
export async function applyVerificationOutcome(providerSessionId: string, traceId: string) {
  const outcome = await readVerificationOutcome(providerSessionId);
  const [existing] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.providerSessionId, providerSessionId))
    .limit(1);
  if (!existing) return null;

  const requestName = (existing.metadata as Record<string, unknown> | null)?.requestName;
  const matched = namesMatch(
    outcome.verifiedName,
    typeof requestName === "string" ? requestName : null
  );

  await db
    .update(identityVerifications)
    .set({
      status: outcome.status,
      verified: outcome.verified,
      nameMatchedRequest: matched,
      lastErrorCode: outcome.lastErrorCode,
      verifiedAt: outcome.verified ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(identityVerifications.id, existing.id));

  await createObservabilityEvent({
    eventType: outcome.verified ? "IDENTITY_VERIFICATION_VERIFIED" : "IDENTITY_VERIFICATION_RESOLVED",
    domain: "security",
    severity: outcome.verified && matched === false ? "WARN" : "INFO",
    message:
      outcome.verified && matched === false
        ? "Identity verified, but the verified name does not match the name on the request — human review required."
        : `Identity verification resolved: ${outcome.status}.`,
    traceId,
    replayRef: traceId,
    actorId: `identity-provider:${IDENTITY_PROVIDER}`,
    module: "api.identity.verify",
    metadata: {
      subjectRef: existing.subjectRef,
      providerSessionId,
      status: outcome.status,
      verified: outcome.verified,
      nameMatchedRequest: matched,
    },
  });

  return { verified: outcome.verified, nameMatchedRequest: matched, status: outcome.status };
}
