import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";

/**
 * Public Trust Pages Runtime
 *
 * Master Volume Governance:
 * - Vol 0: presents the platform orientation in borrower- and public-safe
 *   language with required no-approval, no-guarantee, and no-reliance
 *   posture.
 * - Vol I: keeps the trust surface subordinate to constitutional authority;
 *   the surface explains coordination and advisory guidance only.
 * - Vol II: blocks public claims that imply approval, eligibility,
 *   underwriting, credit decision, lender commitment, environmental
 *   clearance, certification, public verification, payment authorization,
 *   official report publication, or regulatory or legal reliance.
 * - Vol III: provides deterministic, replay-safe trust content with
 *   content-claims evaluation and version lineage.
 * - Vol III-B: supplies classification-, observability-, and explainability-
 *   ready posture for runtime evidence.
 * - Vol IV: supports operator continuity by routing visitors to readiness,
 *   data rights, and financing pathway guidance for review-bound followup.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   portability, replay, and source-authority boundaries.
 * - Vol VI: keeps the surface as a portable governed public surface with
 *   safe translation-layer copy.
 * - Vol VII: keeps the surface advisory and review-bound; no external
 *   conformance, verification, or reliance claim is created.
 *
 * Safety boundary:
 * - Public trust content is advisory and protections-explainer only.
 * - It does not create approval, eligibility, certification, public
 *   verification, environmental clearance, lender commitment, payment
 *   authorization, official report, or legal or regulatory reliance.
 */

export const PUBLIC_TRUST_RUNTIME_VERSION =
  "public-trust-runtime-v0.1.0";

export type WhatFurlongIsItem = {
  id: string;
  label: string;
  description: string;
  reviewRoute: string;
};

export type WhatFurlongIsNotItem = {
  id: string;
  label: string;
  rationale: string;
};

export type BorrowerProtectionItem = {
  id: string;
  label: string;
  description: string;
  governanceRefs: string[];
  reviewRoute: string;
};

export type PublicTrustHandoff = {
  id: string;
  label: string;
  route: string;
  reason: string;
};

export type PublicTrustContentClaimFinding = {
  code: string;
  severity: string;
  matchedText: string;
  message: string;
};

export type PublicTrustEvaluation = {
  policyVersion: string;
  ok: boolean;
  findingCount: number;
  blockCount: number;
  reviewCount: number;
  findings: PublicTrustContentClaimFinding[];
};

export type PublicTrustResult = {
  runtimeVersion: string;
  generatedAt: string;
  whatFurlongIs: WhatFurlongIsItem[];
  whatFurlongIsNot: WhatFurlongIsNotItem[];
  borrowerProtections: BorrowerProtectionItem[];
  canonicalDisclosures: string[];
  productionRestrictions: string[];
  handoffs: PublicTrustHandoff[];
  recommendedNextRoutes: string[];
  contentClaimsEvaluation: PublicTrustEvaluation;
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  noApproval: true;
  noGuarantee: true;
  noCertification: true;
  noPublicVerification: true;
  noLegalOrRegulatoryReliance: true;
  publicSurfaceSafe: true;
};

export type PublicTrustInput = {
  audience?: "public" | "borrower" | null;
  referrerRoute?: string | null;
};

export const PUBLIC_TRUST_WHAT_FURLONG_IS: WhatFurlongIsItem[] = [
  {
    id: "what-coordination",
    label: "Governed coordination platform",
    description:
      "Furlong helps farmer-borrowers, lenders, sponsors, and operators coordinate intake, review, and supporting evidence through a governed backend and module spine.",
    reviewRoute: "/onboarding",
  },
  {
    id: "what-advisory",
    label: "Advisory guidance",
    description:
      "Furlong organizes financing pathway, opportunity, readiness, and environmental intake guidance. Guidance remains review-bound and not a decision.",
    reviewRoute: "/financing-pathways",
  },
  {
    id: "what-readiness",
    label: "Readiness assessment",
    description:
      "Furlong shows what is complete, what is missing, and what may need human review across borrower workflows.",
    reviewRoute: "/readiness",
  },
  {
    id: "what-data-rights",
    label: "Borrower data rights",
    description:
      "Furlong gives borrowers governed review, export, transport, and portability of their records without premium barriers or dark patterns.",
    reviewRoute: "/portal/borrower/data-rights",
  },
  {
    id: "what-opportunity",
    label: "Advisory opportunity discovery",
    description:
      "Furlong composes governed grants, programs, properties, equipment, market context, and revenue opportunity summaries as advisory translation-layer content.",
    reviewRoute: "/portal/borrower/opportunities",
  },
];

export const PUBLIC_TRUST_WHAT_FURLONG_IS_NOT: WhatFurlongIsNotItem[] = [
  {
    id: "not-lender",
    label: "Not a lender",
    rationale:
      "Furlong does not lend, fund, or commit credit. Lender review and lender decisions remain with qualified lender partners.",
  },
  {
    id: "not-credit-bureau",
    label: "Not a credit bureau",
    rationale:
      "Furlong does not score or rate borrower credit. No credit decision is created or implied.",
  },
  {
    id: "not-underwriter",
    label: "Not an underwriter",
    rationale:
      "Furlong does not underwrite or determine eligibility. No underwriting reliance is authorized by any Furlong output.",
  },
  {
    id: "not-environmental-authority",
    label: "Not an environmental authority",
    rationale:
      "Furlong does not issue environmental clearances, permits, or determinations. Environmental review remains with the Environmental Engineering Spoke and qualified providers.",
  },
  {
    id: "not-legal-or-regulatory-authority",
    label: "Not a legal or regulatory authority",
    rationale:
      "Furlong does not grant legal permission, certify regulatory standing, or authorize legal or regulatory reliance.",
  },
  {
    id: "not-public-verification",
    label: "Not a public verification service",
    rationale:
      "Furlong does not provide external public verification of borrower readiness, source authority, or program eligibility.",
  },
  {
    id: "not-payment-service",
    label: "Not a payment service",
    rationale:
      "Furlong does not capture payment, hold borrower funds, or authorize external charges.",
  },
  {
    id: "not-source-of-truth-for-third-parties",
    label: "Not an authoritative source for third parties",
    rationale:
      "Furlong outputs remain advisory unless separately promoted through governed controlled-promotion gates.",
  },
];

export const PUBLIC_TRUST_BORROWER_PROTECTIONS: BorrowerProtectionItem[] = [
  {
    id: "protection-data-portability",
    label: "Borrower data portability",
    description:
      "Borrowers can review, export, and transport their records through governed, machine-readable portability workflows.",
    governanceRefs: ["BORROWER-PORTABILITY-001", "CANON-DATA-001"],
    reviewRoute: "/portal/borrower/data-rights",
  },
  {
    id: "protection-fee-autonomy",
    label: "Provider fee autonomy",
    description:
      "Borrowers retain the right to engage approved external environmental firms. Provider fees may not exceed standard market rates and require explicit borrower fee disclosure.",
    governanceRefs: ["CANON-ECON-001", "CANON-SOVEREIGNTY-001"],
    reviewRoute: "/portal/borrower/environmental-intake",
  },
  {
    id: "protection-spoke-isolation",
    label: "Banker spoke isolation",
    description:
      "The Environmental Engineering Spoke retains environmental review authority. The Banker Spoke is isolated from environmental determinations.",
    governanceRefs: ["ROLE-ARCH-001", "REG-NEPA-001"],
    reviewRoute: "/environmental-compliance",
  },
  {
    id: "protection-claims-governance",
    label: "Content claims governance",
    description:
      "Public copy is evaluated against a deterministic content-claims policy that blocks approval, underwriting, credit, public-verification, and reliance claims.",
    governanceRefs: ["CANON-CLAIMS-001", "LENDER-READY-GOV-001"],
    reviewRoute: "/trust",
  },
  {
    id: "protection-replay-and-audit",
    label: "Replay and audit",
    description:
      "Material decisions, classifications, and disclosures are replay-safe and audit-traceable through governed runtime evidence.",
    governanceRefs: ["TECH-LEDGER-001", "TECH-REPLAY-001"],
    reviewRoute: "/audit-replay",
  },
  {
    id: "protection-free-tier-baseline",
    label: "Free-tier baseline readiness",
    description:
      "Free-tier borrower readiness is preserved. There is no paywall on baseline readiness, no upsell trap, and no degraded portability workflow.",
    governanceRefs: ["FREE-TIER-GOV-001", "BORROWER-PORTABILITY-001"],
    reviewRoute: "/readiness",
  },
  {
    id: "protection-human-review-boundary",
    label: "Human review boundary",
    description:
      "Decision-adjacent actions require human review before reliance. Furlong outputs remain advisory until reviewed.",
    governanceRefs: ["TECH-RBAC-001", "PROMOTION-GATE-001"],
    reviewRoute: "/operator-queue",
  },
  {
    id: "protection-redaction-and-classification",
    label: "Classification and redaction",
    description:
      "Borrower records are classified and redacted at the public-surface boundary. Raw records are never exposed through public translation layers.",
    governanceRefs: ["CANON-CLASS-001", "SURFACE-GOV-001"],
    reviewRoute: "/trust",
  },
];

export const PUBLIC_TRUST_CANONICAL_DISCLOSURES = [
  ADVISORY_ONLY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  "Furlong does not approve, deny, underwrite, determine eligibility, or make credit decisions.",
  "Furlong outputs are advisory and review-bound.",
  "Furlong does not guarantee revenue, program approval, or external verification.",
  "Furlong does not grant environmental clearance, permits, or determinations.",
  "Furlong does not authorize legal or regulatory reliance.",
  "Furlong does not capture payment or hold borrower funds.",
  "Borrowers retain data review, export, transport, and portability rights through governed workflows.",
  "Human review is required before any Furlong output is treated as a decision.",
  "Public copy carries advisory, no-approval, no-guarantee, and no-reliance boundaries.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const PUBLIC_TRUST_PRODUCTION_RESTRICTIONS = [
  "no approval",
  "no preapproval",
  "no eligibility determination",
  "no underwriting decision",
  "no credit decision",
  "no lender commitment",
  "no environmental clearance",
  "no environmental permit",
  "no certification",
  "no public verification",
  "no guaranteed revenue",
  "no program approval",
  "no payment capture",
  "no notice send",
  "no official report publication",
  "no legal or regulatory reliance",
  "no live external action",
] as const;

const PUBLIC_TRUST_HANDOFFS: PublicTrustHandoff[] = [
  {
    id: "data-rights",
    label: "Borrower data rights",
    route: "/portal/borrower/data-rights",
    reason:
      "Review, export, transport, and portability of borrower records through governed workflows.",
  },
  {
    id: "readiness",
    label: "Readiness assessment",
    route: "/readiness",
    reason:
      "See what is complete, what is missing, and what may need human review.",
  },
  {
    id: "financing-pathways",
    label: "Financing pathway guidance",
    route: "/financing-pathways",
    reason: "Advisory financing pathway guidance for borrower planning.",
  },
  {
    id: "opportunities",
    label: "Opportunity discovery",
    route: "/portal/borrower/opportunities",
    reason: "Advisory grants, programs, properties, and revenue opportunity summaries.",
  },
  {
    id: "environmental-intake",
    label: "Environmental intake",
    route: "/portal/borrower/environmental-intake",
    reason:
      "Submit environmental context for governed trigger/exemption review routing.",
  },
  {
    id: "about",
    label: "About Furlong",
    route: "/about",
    reason: "What Furlong is, how it works, and what it is not.",
  },
];

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function toPublicTrustEvaluation(
  evaluation: ReturnType<typeof evaluateContentClaims>
): PublicTrustEvaluation {
  return {
    policyVersion: evaluation.policyVersion,
    ok: evaluation.ok,
    findingCount: evaluation.findingCount,
    blockCount: evaluation.blockCount,
    reviewCount: evaluation.reviewCount,
    findings: evaluation.findings.map((finding) => ({
      code: finding.code,
      severity: finding.severity,
      matchedText: finding.matchedText,
      message: finding.message,
    })),
  };
}

export function evaluatePublicTrustContent(
  input: PublicTrustInput = {}
): PublicTrustResult {
  const text = [
    ...PUBLIC_TRUST_WHAT_FURLONG_IS.map(
      (item) => `${item.label}: ${item.description}`
    ),
    ...PUBLIC_TRUST_WHAT_FURLONG_IS_NOT.map(
      (item) => `${item.label}: ${item.rationale}`
    ),
    ...PUBLIC_TRUST_BORROWER_PROTECTIONS.map(
      (item) => `${item.label}: ${item.description}`
    ),
    ...PUBLIC_TRUST_CANONICAL_DISCLOSURES,
  ];

  const contentClaimsEvaluation = toPublicTrustEvaluation(
    evaluateContentClaims({
      text,
      context: {
        publicVerificationGatewayOperational: false,
        canonicalHashVerificationOperational: false,
        lenderReadyDisclosurePresent: true,
        freeTierBaselineReadinessAvailable: true,
        borrowerPortabilityAvailable: true,
        soc2Type2Operational: false,
      },
    })
  );

  const handoffs = input.referrerRoute
    ? PUBLIC_TRUST_HANDOFFS.filter(
        (handoff) => handoff.route !== input.referrerRoute
      )
    : PUBLIC_TRUST_HANDOFFS;

  return {
    runtimeVersion: PUBLIC_TRUST_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    whatFurlongIs: PUBLIC_TRUST_WHAT_FURLONG_IS,
    whatFurlongIsNot: PUBLIC_TRUST_WHAT_FURLONG_IS_NOT,
    borrowerProtections: PUBLIC_TRUST_BORROWER_PROTECTIONS,
    canonicalDisclosures: unique([...PUBLIC_TRUST_CANONICAL_DISCLOSURES]),
    productionRestrictions: unique([...PUBLIC_TRUST_PRODUCTION_RESTRICTIONS]),
    handoffs,
    recommendedNextRoutes: unique(handoffs.map((handoff) => handoff.route)),
    contentClaimsEvaluation,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    noApproval: true,
    noGuarantee: true,
    noCertification: true,
    noPublicVerification: true,
    noLegalOrRegulatoryReliance: true,
    publicSurfaceSafe: true,
  };
}
