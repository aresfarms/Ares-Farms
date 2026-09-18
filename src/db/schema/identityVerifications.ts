import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Identity verification records — the ONLY thing that can raise a subject to
 * the `identity-verified` assurance tier (src/lib/privacy/actionGate.ts).
 *
 * PROVIDER: Stripe Identity (founder decision 2026-08-10, replacing ID.me on
 * cost). Chosen over Plaid Identity Verification deliberately:
 *
 *   · OUR STATED BASIS IS FRAUD PREVENTION AND SIGNATURE ATTRIBUTION, not
 *     anti-money-laundering. The consent registry says so in terms
 *     (`identity-verification`.basisNote): Furlong is not a financial
 *     institution carrying AML duties — the licensed broker and the funding
 *     lender carry those. Plaid IDV's distinguishing feature is KYC/AML
 *     watchlist screening. Performing screening we have no obligation to
 *     perform would manufacture duties, and would hold data we should not.
 *   · VENDOR SEPARATION IS A FEATURE. Plaid sees bank data. Stripe sees
 *     identity. NEITHER SEES BOTH. One breach, one subpoena, or one vendor
 *     compromise therefore cannot reconstruct a borrower.
 *
 * WHAT THIS TABLE DELIBERATELY DOES NOT HOLD: no document images, no selfie,
 * no ID number, no date of birth, no address. Stripe retains those; we keep
 * the OUTCOME and the pointer. A verification record should be able to sit in
 * a breach report and embarrass no one.
 *
 * BIPA WARNING (Illinois, private right of action): the Stripe flow performs a
 * biometric selfie comparison. A written policy and a signed release are
 * required BEFORE capture. That gate lives in the consent layer and is on the
 * counsel list; this table records that a consent ref was captured, and the
 * verification must not be started without one.
 *
 * Master Volume Governance: Vol II (minimum disclosure, consent before
 * action), Vol III-B (GOV-RUNTIME-001), Vol V (versioned, replay-safe,
 * evidence-preserving).
 */
export const identityVerifications = pgTable("identity_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Who this is about — the deal reference or application id, never raw PII. */
  subjectRef: text("subject_ref").notNull(),
  /** The email the session was opened against (already known to us). */
  subjectEmail: text("subject_email"),
  provider: text("provider").notNull().default("stripe-identity"),
  /** Stripe's VerificationSession id. The pointer, not the contents. */
  providerSessionId: text("provider_session_id").notNull(),
  /**
   * requires_input | processing | verified | canceled — Stripe's own status
   * vocabulary, stored verbatim so a replay can be reconciled against Stripe.
   */
  status: text("status").notNull().default("requires_input"),
  /** True ONLY on a Stripe `verified` outcome. The gate reads this. */
  verified: boolean("verified").notNull().default(false),
  /**
   * Whether the verified name matched the name on the request. Recorded
   * because a genuine ID belonging to someone else is the interesting fraud
   * case, and a pass/fail on identity alone would miss it.
   */
  nameMatchedRequest: boolean("name_matched_request"),
  /** Which consent version authorized this check (consentRegistry). */
  consentRef: text("consent_ref").notNull(),
  /** Stripe's reason when a check fails — never the underlying data. */
  lastErrorCode: text("last_error_code"),
  /** TEST-mode ceremonies must never be mistaken for live verification. */
  mode: text("mode").notNull().default("test"),
  traceId: text("trace_id"),
  replayRef: text("replay_ref"),
  classificationLevel: text("classification_level").notNull().default("RESTRICTED"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  /** Retention boundary — a verification outcome is not kept forever. */
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
