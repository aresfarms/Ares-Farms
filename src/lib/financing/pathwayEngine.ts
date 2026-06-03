import {
  PROGRAM_GRAPH,
  REVENUE_PRODUCTION_RESTRICTIONS,
  REVENUE_SOURCE_REQUIRED_DISCLOSURES,
} from "@/lib/revenue-intelligence/revenueSourceIntelligenceRuntime";

/**
 * Financing Pathway Engine
 *
 * Master Volume Governance:
 * - Vol I: keeps financing guidance subordinate to constitutional authority.
 * - Vol II: blocks approval, eligibility, underwriting, lender commitment,
 *   legal advice, regulatory reliance, and guaranteed outcomes.
 * - Vol III: provides deterministic, replay-safe pathway ranking.
 * - Vol III-B: requires human review, classification, runtime evidence, and
 *   explainability before any production promotion.
 * - Vol IV: supports operator handoff, missing-item review, and escalation.
 * - Vol V-VII: preserves claims governance, source authority, disclosure,
 *   conformance, and source-intelligence boundaries.
 */

export type FinancingPathwayInput = {
  borrowerId?: string | null;
  applicationId?: string | null;
  location?: {
    country?: string | null;
    state?: string | null;
    county?: string | null;
  };
  farmTypes?: string[];
  goals?: string[];
  acreage?: number | null;
  requestedAmount?: number | null;
  stage?: string | null;
  requestedPrograms?: string[];
  documents?: string[];
  metadata?: Record<string, unknown>;
};

export type FinancingPathwayCandidate = {
  id: string;
  label: string;
  sponsorType: string;
  fitScore: number;
  status: "REVIEW_REQUIRED" | "MISSING_INFORMATION";
  fitReasons: string[];
  missingItems: string[];
  blockedClaims: string[];
  sourceRefs: string[];
  replayRefs: string[];
};

export type FinancingReadinessAssessment = {
  readinessPercent: number;
  missingItems: string[];
  reviewSignals: string[];
};

export type FinancingPathwayResult = {
  engineVersion: string;
  generatedAt: string;
  readiness: FinancingReadinessAssessment;
  pathways: FinancingPathwayCandidate[];
  recommendedNextRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  noApproval: true;
  noGuarantee: true;
  noLegalOrRegulatoryReliance: true;
};

export const FINANCING_PATHWAY_ENGINE_VERSION =
  "financing-pathway-engine-v0.1.0";

export const FINANCING_PATHWAY_DISCLOSURES = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
  "Financing pathway output is advisory planning support only.",
  "No approval has been granted.",
  "No guarantee is made.",
  "No lender commitment has been made.",
  "No eligibility determination has been made.",
  "No underwriting reliance is authorized.",
  "No legal or regulatory reliance is authorized.",
  "No public verification is available unless separately authorized.",
  ...REVENUE_SOURCE_REQUIRED_DISCLOSURES,
] as const;

const BASE_REQUIRED_ITEMS = [
  "borrower identity",
  "farm location",
  "farm type",
  "borrower goal",
  "acreage",
  "requested amount or financing purpose",
  "supporting documents",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function numericValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function buildMissingItems(input: FinancingPathwayInput): string[] {
  const missingItems: string[] = [];

  if (!hasText(input.borrowerId)) {
    missingItems.push("borrower identity");
  }

  if (
    !hasText(input.location?.country) ||
    !hasText(input.location?.state) ||
    !hasText(input.location?.county)
  ) {
    missingItems.push("farm location");
  }

  if (!Array.isArray(input.farmTypes) || input.farmTypes.length === 0) {
    missingItems.push("farm type");
  }

  if (!Array.isArray(input.goals) || input.goals.length === 0) {
    missingItems.push("borrower goal");
  }

  if (numericValue(input.acreage) <= 0) {
    missingItems.push("acreage");
  }

  if (numericValue(input.requestedAmount) <= 0 && !hasText(input.metadata?.purpose)) {
    missingItems.push("requested amount or financing purpose");
  }

  if (!Array.isArray(input.documents) || input.documents.length === 0) {
    missingItems.push("supporting documents");
  }

  return unique(missingItems);
}

function calculateReadiness(missingItems: string[]): number {
  const completedItems = Math.max(0, BASE_REQUIRED_ITEMS.length - missingItems.length);

  return Math.round((completedItems / BASE_REQUIRED_ITEMS.length) * 100);
}

function goalMatchesProgram(goal: string, eligibleUses: string[]): boolean {
  const normalizedGoal = goal.toLowerCase();

  return eligibleUses.some((eligibleUse) => {
    const normalizedUse = eligibleUse.toLowerCase();

    return (
      normalizedUse.includes(normalizedGoal) ||
      normalizedGoal.includes("expansion") ||
      normalizedGoal.includes("sustainability") ||
      normalizedGoal.includes("land")
    );
  });
}

function candidateFitScore(
  input: FinancingPathwayInput,
  missingItems: string[],
  program: (typeof PROGRAM_GRAPH)[number]
): number {
  let score = 40;

  if (hasText(input.location?.state)) {
    score += program.geography_scope.some((scope) =>
      ["federal", "state-administered", "state", "county"].includes(scope)
    )
      ? 12
      : 4;
  }

  if ((input.farmTypes ?? []).length > 0) {
    score += program.eligible_customer_types.some((customerType) =>
      customerType.toLowerCase().includes("farmer") ||
      customerType.toLowerCase().includes("farm") ||
      customerType.toLowerCase().includes("operator")
    )
      ? 14
      : 6;
  }

  if ((input.goals ?? []).some((goal) => goalMatchesProgram(goal, program.eligible_uses))) {
    score += 14;
  }

  if (numericValue(input.acreage) > 0) {
    score += 8;
  }

  if (numericValue(input.requestedAmount) > 0) {
    score += 8;
  }

  score -= missingItems.length * 5;

  return Math.max(0, Math.min(100, score));
}

function buildCandidate(
  input: FinancingPathwayInput,
  missingItems: string[],
  program: (typeof PROGRAM_GRAPH)[number]
): FinancingPathwayCandidate {
  const fitScore = candidateFitScore(input, missingItems, program);
  const reviewReasons = [
    `${program.sponsor_type} pathway source requires governed program review.`,
    "Program rules, overlays, deadlines, and source authority must be reviewed before reliance.",
  ];

  if (program.stacking_rules.length > 0) {
    reviewReasons.push("Stacking rules require review before combining pathways.");
  }

  if (program.conflict_rules.length > 0) {
    reviewReasons.push("Conflict rules require review before borrower-facing reliance.");
  }

  return {
    id: program.program_id,
    label: program.program_name,
    sponsorType: program.sponsor_type,
    fitScore,
    status: missingItems.length === 0 ? "REVIEW_REQUIRED" : "MISSING_INFORMATION",
    fitReasons: reviewReasons,
    missingItems,
    blockedClaims: [
      "approval",
      "preapproval",
      "eligibility determination",
      "lender commitment",
      "underwriting reliance",
      "legal or regulatory reliance",
    ],
    sourceRefs: program.source_refs,
    replayRefs: program.replay_refs,
  };
}

export function evaluateFinancingPathways(
  input: FinancingPathwayInput = {}
): FinancingPathwayResult {
  const missingItems = buildMissingItems(input);
  const readinessPercent = calculateReadiness(missingItems);
  const pathways = PROGRAM_GRAPH.map((program) =>
    buildCandidate(input, missingItems, program)
  ).sort((a, b) => b.fitScore - a.fitScore);

  const reviewSignals = [
    "Human review is required before any pathway can be treated as a financing determination.",
    "Program overlays, source authority, deadline posture, and borrower documents remain unresolved until review.",
  ];

  if (missingItems.length > 0) {
    reviewSignals.push(`Missing ${missingItems.length} required item(s).`);
  }

  return {
    engineVersion: FINANCING_PATHWAY_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    readiness: {
      readinessPercent,
      missingItems,
      reviewSignals,
    },
    pathways,
    recommendedNextRoutes: unique([
      "/onboarding",
      "/readiness",
      "/portal/borrower/opportunities",
      "/portal/borrower/applications",
      "/portal/borrower/documents",
      "/portal/revenue-opportunities",
      "/portal/borrower/data-rights",
    ]),
    disclosures: unique([...FINANCING_PATHWAY_DISCLOSURES]),
    productionRestrictions: unique([
      ...REVENUE_PRODUCTION_RESTRICTIONS,
      "no financing approval",
      "no preapproval",
      "no final eligibility determination",
      "no adverse action notice",
      "no borrower notice send",
    ]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    noApproval: true,
    noGuarantee: true,
    noLegalOrRegulatoryReliance: true,
  };
}
