/**
 * actionGate — "to do X you must first have done Y" (founder direction
 * 2026-08-06). Consent and identity assurance are tied to the ACTION being
 * performed, not collected in a lump at the door.
 *
 * WHY THIS IS THE RIGHT SHAPE, not merely a compliant one:
 *   · It is GDPR's preferred pattern (just-in-time consent): a person agrees
 *     to a specific thing at the moment it happens, so the agreement is
 *     evidence of actual intent rather than a forgotten checkbox.
 *   · It is self-documenting: the consent record IS the proof the
 *     precondition was met. There is no separate "did they agree?" question.
 *   · It scales friction to sensitivity — browsing costs nothing, uploading
 *     tax returns costs an ID check. People accept friction that is
 *     obviously proportionate; they resent friction that is not.
 *
 * ONE DELIBERATE RESTRAINT: a DISTINCT consent is asked once per context, not
 * on every click. Re-asking the same question breeds consent fatigue, people
 * stop reading, and the evidentiary value of the agreement collapses — the
 * opposite of the goal. Signatures are the exception: each document signed is
 * its own agreement and gets its own consent, every time.
 *
 * ASSURANCE TIERS
 *   anonymous          — no claim about who this is (public discovery)
 *   email-possession   — holds the reference + the email on it, or a signed
 *                        link sent to that email (today's status/upload proof)
 *   identity-verified  — a government ID was checked by the identity provider
 *                        and bound to this deal
 *
 * Master Volume Governance: Vol II (CANON-CONSENT-001 — consent recorded
 * before the record is acted on), Vol I (human authority), Vol V (evidence).
 */

import type { ConsentId } from "@/lib/privacy/consentRegistry";

export type AssuranceTier = "anonymous" | "email-possession" | "identity-verified";

export type GatedAction =
  | "submit-financing-request"
  | "upload-supporting-document"
  | "upload-financial-document"
  | "sign-document"
  | "receive-broker-document"
  | "order-environmental-work"
  | "export-my-data";

export interface ActionRequirement {
  action: GatedAction;
  minimumTier: AssuranceTier;
  consents: ConsentId[];
  /** Plain sentence shown to the person explaining WHY this gate exists. */
  because: string;
}

const TIER_ORDER: Record<AssuranceTier, number> = {
  anonymous: 0,
  "email-possession": 1,
  "identity-verified": 2,
};

/**
 * The gate table. Read it as policy: this is the whole answer to "what must
 * be true before someone may do this?"
 */
export const ACTION_REQUIREMENTS: Record<GatedAction, ActionRequirement> = {
  "submit-financing-request": {
    action: "submit-financing-request",
    minimumTier: "anonymous",
    consents: ["fee-posture", "financing-intake-routing", "electronic-communications"],
    because:
      "Submitting a request costs nothing and proves nothing about who you are — so we ask only " +
      "that you understand the fee posture, agree to routing, and accept electronic delivery.",
  },
  "upload-supporting-document": {
    action: "upload-supporting-document",
    minimumTier: "email-possession",
    consents: [],
    because:
      "Your secure upload link was sent to the email on this request, so using it already shows you " +
      "control that mailbox. Entity documents, purchase agreements and environmental reports need " +
      "nothing further.",
  },
  "upload-financial-document": {
    action: "upload-financial-document",
    minimumTier: "identity-verified",
    consents: ["identity-verification", "financial-data-handling"],
    because:
      "Tax returns, bank statements and personal financial statements are the most sensitive things " +
      "you will ever send us — and the most valuable to an impostor. Before they enter the vault we " +
      "confirm you are you, once.",
  },
  "sign-document": {
    action: "sign-document",
    minimumTier: "identity-verified",
    consents: ["identity-verification", "esign-signature"],
    because:
      "A signature is only worth what its attribution is worth. Verifying identity once, then " +
      "recording each signature separately, is what makes it hold up.",
  },
  "receive-broker-document": {
    action: "receive-broker-document",
    minimumTier: "email-possession",
    consents: [],
    because:
      "Reading a document your broker addressed to you requires proving you hold this request's " +
      "reference and email — the same proof as checking your status.",
  },
  "order-environmental-work": {
    action: "order-environmental-work",
    minimumTier: "anonymous",
    consents: ["fee-posture", "electronic-communications"],
    because:
      "Ordering site assessment work is a service request, not a financial disclosure. The licensed " +
      "engineer scopes and quotes it before any work or charge begins.",
  },
  "export-my-data": {
    action: "export-my-data",
    minimumTier: "email-possession",
    consents: [],
    because:
      "Exercising your rights over your own data must never be harder than the thing it protects — " +
      "the same reference and email that reach your status page reach your record.",
  },
};

export interface GateContext {
  tier: AssuranceTier;
  /** Consent ids already captured for this deal/person, with agreement true. */
  consentsHeld: ConsentId[];
}

export interface GateDecision {
  permitted: boolean;
  missingTier: AssuranceTier | null;
  missingConsents: ConsentId[];
  because: string;
}

/**
 * Evaluate whether an action may proceed. Returns WHAT is missing, so the UI
 * can ask for exactly that and nothing more — the entire point of gating by
 * action rather than collecting everything up front.
 */
export function evaluateActionGate(action: GatedAction, context: GateContext): GateDecision {
  const requirement = ACTION_REQUIREMENTS[action];
  const tierOk = TIER_ORDER[context.tier] >= TIER_ORDER[requirement.minimumTier];
  const missingConsents = requirement.consents.filter((c) => !context.consentsHeld.includes(c));
  return {
    permitted: tierOk && missingConsents.length === 0,
    missingTier: tierOk ? null : requirement.minimumTier,
    missingConsents,
    because: requirement.because,
  };
}

/** Document types that count as FINANCIAL and therefore raise the gate. */
export const FINANCIAL_DOCUMENT_TYPES = new Set([
  "bank-statements",
  "tax-returns",
  "personal-financial-statement",
  "debt-schedule",
]);

/** Which gated action a given upload represents. */
export function actionForDocumentType(documentType: string): GatedAction {
  return FINANCIAL_DOCUMENT_TYPES.has(documentType)
    ? "upload-financial-document"
    : "upload-supporting-document";
}
