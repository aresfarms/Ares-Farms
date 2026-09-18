/**
 * stripeIdentity — the ONLY route to the `identity-verified` assurance tier.
 *
 * Founder decision 2026-08-10: Stripe Identity, replacing ID.me on cost.
 * Plaid keeps banking; it does not do identity here. The reasoning is recorded
 * in src/db/schema/identityVerifications.ts and is not restated.
 *
 * WHAT THIS MODULE REFUSES TO DO, BY DESIGN:
 *
 *   · It never receives, requests, stores, or logs a document image, a selfie,
 *     an ID number, a date of birth, or an address. Stripe holds those. We
 *     take the OUTCOME. Everything this module persists could appear in a
 *     breach report without harming the person it describes.
 *   · It never starts a session without a captured consent reference. The
 *     Stripe flow performs a BIOMETRIC selfie comparison, and Illinois BIPA
 *     requires a written policy and a release BEFORE capture — with a private
 *     right of action if you get it wrong. `startVerification` throws rather
 *     than proceed on a missing consent.
 *   · It never trusts the browser for the outcome. A client can claim
 *     "verified" all it likes; only the Stripe webhook, signature-checked,
 *     flips `verified` to true. The redirect back from Stripe is a UI event,
 *     not evidence.
 *
 * TEST MODE: staging runs Stripe test keys, so every record here is stamped
 * mode="test" and must never be read as a live identity assertion.
 *
 * Master Volume Governance: Vol II (consent before action, minimum
 * disclosure), Vol III-B (GOV-RUNTIME-001), Vol V (replay-safe, evidenced).
 */

import { stripe } from "@/lib/stripe";

export const IDENTITY_PROVIDER = "stripe-identity" as const;
/** Bumped whenever the verification contract changes shape. */
export const IDENTITY_VERIFICATION_VERSION = "identity-verification-v1.0.0" as const;

export interface IdentityReadiness {
  configured: boolean;
  provider: typeof IDENTITY_PROVIDER;
  mode: "test" | "live";
  /** Honest reason when not configured — surfaced, never swallowed. */
  reason: string | null;
}

/**
 * Readiness is derived from the SAME secret the payment path uses. There is no
 * separate Stripe Identity key — enabling the product is an account action, so
 * a present key does not by itself prove Identity is switched on. Say so.
 */
export function identityReadiness(): IdentityReadiness {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const mode: "test" | "live" = key.startsWith("sk_live_") ? "live" : "test";
  if (!key) {
    return {
      configured: false,
      provider: IDENTITY_PROVIDER,
      mode: "test",
      reason: "STRIPE_SECRET_KEY is not present in this environment.",
    };
  }
  return {
    configured: true,
    provider: IDENTITY_PROVIDER,
    mode,
    reason:
      mode === "test"
        ? "Stripe test mode. Verifications are ceremonies, not live identity assertions."
        : null,
  };
}

export interface StartVerificationArgs {
  /** Deal or application reference. NEVER raw PII. */
  subjectRef: string;
  /** Already known to us; Stripe uses it only to address the session. */
  subjectEmail?: string | null;
  /** Consent version captured immediately before this call. REQUIRED. */
  consentRef: string;
  /** Where Stripe returns the person after the flow. */
  returnUrl: string;
  traceId: string;
}

export interface StartedVerification {
  providerSessionId: string;
  /** The hosted Stripe page the person is sent to. */
  redirectUrl: string | null;
  status: string;
  mode: "test" | "live";
}

/**
 * Open a Stripe Identity VerificationSession.
 *
 * Throws on a missing consent reference rather than defaulting — a biometric
 * capture with no recorded authorization is the one failure mode here that
 * carries statutory damages.
 */
export async function startVerification(args: StartVerificationArgs): Promise<StartedVerification> {
  const readiness = identityReadiness();
  if (!readiness.configured) {
    throw new Error(`Identity verification is not configured: ${readiness.reason}`);
  }
  if (!args.consentRef?.trim()) {
    throw new Error(
      "Refusing to start identity verification without a captured consent reference — " +
        "the flow performs a biometric comparison and may not begin unauthorized."
    );
  }

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    // Ask for the selfie comparison: a document alone proves the DOCUMENT is
    // genuine, not that the holder is the person presenting it.
    options: { document: { require_matching_selfie: true } },
    return_url: args.returnUrl,
    // Metadata carries ONLY references. No names, no PII — this round-trips
    // through Stripe and lands in their dashboard.
    metadata: {
      subjectRef: args.subjectRef,
      consentRef: args.consentRef,
      traceId: args.traceId,
      contractVersion: IDENTITY_VERIFICATION_VERSION,
    },
  });

  return {
    providerSessionId: session.id,
    redirectUrl: session.url ?? null,
    status: session.status,
    mode: readiness.mode,
  };
}

export interface VerificationOutcome {
  providerSessionId: string;
  status: string;
  verified: boolean;
  lastErrorCode: string | null;
  /** Verified full name, used ONLY for the match check, never persisted raw. */
  verifiedName: string | null;
  subjectRef: string | null;
  consentRef: string | null;
}

/**
 * Read an outcome back from Stripe. Called from the webhook — never trusted
 * from a client redirect.
 *
 * `verified_outputs` is expanded here because the NAME is needed for the
 * match check below. It is used and discarded; the caller persists only the
 * boolean result.
 */
export async function readVerificationOutcome(sessionId: string): Promise<VerificationOutcome> {
  const session = await stripe.identity.verificationSessions.retrieve(sessionId, {
    expand: ["verified_outputs"],
  });
  const outputs = (session as unknown as {
    verified_outputs?: { first_name?: string | null; last_name?: string | null } | null;
  }).verified_outputs;
  const verifiedName = outputs
    ? [outputs.first_name, outputs.last_name].filter(Boolean).join(" ").trim() || null
    : null;

  return {
    providerSessionId: session.id,
    status: session.status,
    verified: session.status === "verified",
    lastErrorCode: session.last_error?.code ?? null,
    verifiedName,
    subjectRef: (session.metadata?.subjectRef as string | undefined) ?? null,
    consentRef: (session.metadata?.consentRef as string | undefined) ?? null,
  };
}

/**
 * Compare the verified name against the name on the request.
 *
 * WHY THIS EXISTS: a genuine government ID belonging to a DIFFERENT person is
 * the fraud case a pass/fail identity check sails straight past. The document
 * is real, the selfie matches the document, and the person is not the
 * borrower. Comparing to the name on the file is what catches it.
 *
 * Deliberately forgiving on form and strict on substance: case, punctuation,
 * middle names and suffixes are normalized away; a genuine difference in
 * surname or given name is reported as a mismatch for a human to look at. It
 * returns a SIGNAL, never a decision — married names, transliterations and
 * legal name changes are all ordinary, and none of them are fraud.
 */
export function namesMatch(verifiedName: string | null, requestName: string | null): boolean | null {
  if (!verifiedName || !requestName) return null;
  const normalize = (value: string): string[] =>
    value
      .toLowerCase()
      .replace(/[.,''`-]/g, " ")
      .replace(/\b(jr|sr|ii|iii|iv|md|phd|esq|pe)\b/g, " ")
      .split(/\s+/)
      .filter((part) => part.length > 1);

  const verified = normalize(verifiedName);
  const requested = normalize(requestName);
  if (!verified.length || !requested.length) return null;

  // First and last must both appear on the other side. Middle names are
  // ignored entirely — people omit them constantly and it means nothing.
  const first = verified[0];
  const last = verified[verified.length - 1];
  return requested.includes(first) && requested.includes(last);
}
