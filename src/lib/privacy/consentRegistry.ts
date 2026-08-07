/**
 * consentRegistry — every consent the platform asks for, versioned, with the
 * EXACT text that was shown recorded against each agreement.
 *
 * WHY VERSIONING IS THE WHOLE POINT: in a dispute, "the customer agreed to
 * our terms" is worth very little; "the customer agreed to THIS text, on THIS
 * date, and here is its hash" is worth a great deal. Consent language changes
 * over time — without versioning, you cannot prove what anyone actually saw.
 * The signature vault already works this way (ESIGN_CONSENT_VERSION); this
 * generalizes it to every consent.
 *
 * ARCHITECTURAL FACTS THAT SHAPE THESE CONSENTS (they differ from standard
 * SaaS boilerplate, deliberately):
 *   · CUSTOMERS HAVE NO ACCOUNTS. Boilerplate ties e-SIGN consent to "creating
 *     an account"; there is no account here. The trigger is submitting a
 *     financing request, and later, opening a signing ceremony.
 *   · CONSENTS ARE SEPARATED, NOT BUNDLED. GDPR treats a single checkbox
 *     covering terms + privacy + e-sign + identity as bundled consent. Each
 *     consent below is captured at the moment it becomes relevant, on its own.
 *   · IDENTITY VERIFICATION IS NOT ASKED FOR AT INTAKE. It happens at the
 *     first sensitive action (first signature / first broker document), so its
 *     authorization is captured THERE — not months earlier for something that
 *     may never occur.
 *
 * Master Volume Governance: Vol II (consent recorded before action, CANON-
 * CONSENT-001), Vol V (versioned, evidence-preserved, replay-safe).
 */

import { createHash } from "node:crypto";

export type ConsentId =
  | "financing-intake-routing"
  | "fee-posture"
  | "electronic-communications"
  | "esign-signature"
  | "identity-verification"
  | "financial-data-handling"
  | "document-attestation"
  | "lender-submission-sharing"
  | "marketing-optional";

export interface ConsentDefinition {
  id: ConsentId;
  version: string;
  /** When this consent is asked for — never earlier than it is needed. */
  capturedAt: string;
  /** GDPR Art. 6 lawful basis, stated honestly for THIS platform. */
  lawfulBasis:
    | "contract"
    | "legal-obligation"
    | "legitimate-interest"
    | "consent";
  /** Must the person agree to proceed, or is it genuinely optional? */
  required: boolean;
  text: string;
  /** Why this basis — the sentence counsel will want to interrogate. */
  basisNote: string;
}

/**
 * DRAFT LANGUAGE — counsel owns the final wording. What the platform owns is
 * that whatever the words become, the version and hash of the exact text
 * shown are recorded with every agreement.
 */
export const CONSENTS: Record<ConsentId, ConsentDefinition> = {
  "financing-intake-routing": {
    id: "financing-intake-routing",
    version: "intake-routing-v1",
    capturedAt: "Financing request submission",
    lawfulBasis: "contract",
    required: true,
    text:
      "I consent to routing my request to the commercial debt broker, and understand this is " +
      "not a qualification, pre-approval, rate lock, or lender commitment.",
    basisNote:
      "Necessary to perform the service the person is asking for — routing their request. Not 'consent' " +
      "as a basis, because a person cannot meaningfully refuse this and still receive the service.",
  },
  "fee-posture": {
    id: "fee-posture",
    version: "fee-posture-v1",
    capturedAt: "Financing request submission",
    lawfulBasis: "contract",
    required: true,
    text:
      "I understand there is no fee to submit, and loan costs are set by the lender and disclosed " +
      "in writing before I commit.",
    basisNote: "Disclosure acknowledgement, recorded before the request is acted on.",
  },
  "electronic-communications": {
    id: "electronic-communications",
    version: "e-comms-v1",
    capturedAt: "Financing request submission",
    lawfulBasis: "consent",
    required: true,
    text:
      "I agree to receive documents, notices, and communications about this request electronically — " +
      "by email and through this portal. To read them I need an internet-connected device, a current " +
      "web browser, and access to the email address I gave. I can withdraw this consent at any time " +
      "by contacting the portal, but because this service is delivered entirely electronically, " +
      "withdrawing it means the request cannot continue here.",
    basisNote:
      "ESIGN/UETA require this to be conspicuous, separate, and to state the hardware/software needed " +
      "and the consequence of withdrawal. Ours is stated honestly: there is no paper alternative.",
  },
  "esign-signature": {
    id: "esign-signature",
    version: "esign-consent-v1-precounsel",
    capturedAt: "Each signing ceremony, per document",
    lawfulBasis: "contract",
    required: true,
    text:
      "I agree to conduct this transaction electronically and to sign this document electronically. " +
      "I have been able to view the exact document I am signing. I understand that my typed name, " +
      "the date and time, my network address, and a digital fingerprint of the document will be " +
      "recorded together as my signature, and that I may request a paper copy of the signed record " +
      "at any time.",
    basisNote:
      "Captured per document, not once at onboarding — a signature consent given months earlier for " +
      "an unknown future document is weak evidence of intent.",
  },
  "identity-verification": {
    id: "identity-verification",
    version: "identity-v1-draft",
    capturedAt: "First signature or first sensitive document access — never at intake",
    lawfulBasis: "legitimate-interest",
    required: true,
    text:
      "To confirm I am the person this request belongs to, I authorize the portal and its identity " +
      "verification provider to verify my identity using a government-issued ID and, where required, " +
      "a photo of my face compared against that ID. This is used only to confirm my identity and to " +
      "prevent fraud. It is not a credit check and does not affect my credit.",
    basisNote:
      "IMPORTANT — the basis here is fraud prevention and signature attribution, NOT anti-money-" +
      "laundering. This platform is not a financial institution with AML obligations; the licensed " +
      "broker and the funding lender carry those. Claiming an AML legal obligation we do not have " +
      "would itself be a misstatement. If a biometric (face) comparison is used, that is special-" +
      "category data requiring EXPLICIT separate consent, and US biometric statutes (notably Illinois " +
      "BIPA, with its private right of action) require a written policy and a release BEFORE capture.",
  },
  "financial-data-handling": {
    id: "financial-data-handling",
    version: "financial-data-v1-draft",
    capturedAt: "Before the first financial document is uploaded",
    lawfulBasis: "contract",
    required: true,
    text:
      "I am sending financial records — which may include tax returns, bank statements and a " +
      "personal financial statement — so my broker can work my financing request. I understand " +
      "they are stored encrypted, that every time anyone opens one it is recorded, that they are " +
      "never sent by email, and that they are shared only with the broker working this request " +
      "and any lender I agree to send them to.",
    basisNote:
      "Necessary to perform the requested service, not 'consent' — a person cannot refuse this and " +
      "still get a loan arranged. Captured at the moment of the first financial upload so it is " +
      "specific and contemporaneous, and paired with the identity check because these documents are " +
      "the ones an impostor actually wants.",
  },
  "document-attestation": {
    id: "document-attestation",
    version: "attestation-v1-draft",
    capturedAt: "EVERY document upload, per file",
    lawfulBasis: "contract",
    required: true,
    text:
      "I confirm this file is a true, complete and unaltered copy of the record it claims to be, " +
      "that I am authorised to provide it, and that I understand my broker and any lender will rely " +
      "on it. I understand that knowingly providing a falsified or altered financial record in " +
      "support of a loan application may be a criminal offence.",
    basisNote:
      "NOT a consent — an ATTESTATION, and the distinction matters. Consent authorises processing " +
      "and is asked ONCE (repeating it identically breeds click-fatigue and weakens the record: the " +
      "EDPB warns about exactly this, and eight identical ticks in four minutes reads as ritual, not " +
      "agreement). An attestation is a fresh statement about a DIFFERENT file each time, so it has no " +
      "fatigue problem, and it does what consent cannot: it creates the borrower's own exposure for a " +
      "falsified record. That is the real deterrent against doctored statements, it mirrors the " +
      "certifications SBA/USDA lenders already require, and it puts 'the borrower affirmed this file " +
      "was genuine at this moment' into the chain-of-custody record.",
  },
  "lender-submission-sharing": {
    id: "lender-submission-sharing",
    version: "lender-package-sharing-v1",
    capturedAt: "After human review of each exact lender package and before dispatch",
    lawfulBasis: "consent",
    required: true,
    text:
      "I authorize Furlong to send this exact package to the named lender and verified recipient " +
      "for the stated financing-review purpose. This authorization is limited to the listed data " +
      "categories and channel, expires as shown, and may be revoked before dispatch. Submission is " +
      "not approval, underwriting, a credit decision, or a lender commitment.",
    basisNote:
      "Captured against the immutable package version and manifest hash; any package mutation, " +
      "recipient change, lender change, channel change, expiry, or revocation requires new consent.",
  },
  "marketing-optional": {
    id: "marketing-optional",
    version: "marketing-v1",
    capturedAt: "Optional, anywhere it is offered",
    lawfulBasis: "consent",
    required: false,
    text:
      "Send me occasional updates about programs, deadlines and property intelligence. I can " +
      "unsubscribe at any time, and this has no effect on my request.",
    basisNote:
      "Must default to UNCHECKED and must never be bundled with a required consent — the bundling " +
      "prohibition is the single most commonly violated part of GDPR.",
  },
};

/** Stable hash of the exact text shown — the durable proof of what was seen. */
export function consentTextHash(id: ConsentId): string {
  return createHash("sha256").update(CONSENTS[id].text, "utf8").digest("hex");
}

export interface CapturedConsent {
  consentId: ConsentId;
  version: string;
  textSha256: string;
  agreed: boolean;
  capturedAtIso: string;
}

/**
 * Build the record to store alongside whatever action the consent authorized.
 * Store this, never a bare boolean — a boolean cannot tell you what the person
 * actually read.
 */
export function captureConsent(id: ConsentId, agreed: boolean): CapturedConsent {
  return {
    consentId: id,
    version: CONSENTS[id].version,
    textSha256: consentTextHash(id),
    agreed,
    capturedAtIso: new Date().toISOString(),
  };
}

/** Required consents for a given moment — used to render, and to verify. */
export function requiredConsentsFor(moment: "intake" | "signing" | "identity"): ConsentDefinition[] {
  switch (moment) {
    case "intake":
      return [
        CONSENTS["fee-posture"],
        CONSENTS["financing-intake-routing"],
        CONSENTS["electronic-communications"],
      ];
    case "signing":
      return [CONSENTS["esign-signature"]];
    case "identity":
      return [CONSENTS["identity-verification"]];
  }
}
