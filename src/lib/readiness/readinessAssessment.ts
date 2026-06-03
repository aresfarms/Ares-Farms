import {
  BorrowerOnboardingState,
  BorrowerOnboardingWorkflow,
  createBorrowerOnboardingWorkflow,
} from "@/lib/borrower/onboardingCore";
import {
  FINANCING_PATHWAY_ENGINE_VERSION,
  FinancingPathwayInput,
  FinancingPathwayResult,
  evaluateFinancingPathways,
} from "@/lib/financing/pathwayEngine";

/**
 * Borrower Readiness Assessment Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps readiness guidance subordinate to constitutional authority and
 *   accountable human review.
 * - Vol II: blocks readiness from becoming approval, eligibility, underwriting,
 *   official certification, public verification, regulatory clearance, or
 *   legal reliance.
 * - Vol III: provides deterministic, replay-safe readiness aggregation across
 *   onboarding intake, financing pathway guidance, environmental interest,
 *   discovery interest, document preparation, and data-rights posture.
 * - Vol III-B: supplies classification-, version-, observability-, and
 *   explainability-ready surface state for runtime evidence.
 * - Vol IV: supports operator/borrower continuity through missing-item review
 *   and human-review-bound handoffs.
 * - Vol V-VII: preserves claims controls, source authority, conformance, and
 *   disclosure boundaries on borrower-readable readiness output.
 *
 * Safety boundary:
 * - Readiness assessment is operational guidance only.
 * - It does not create official certification, public verification, eligibility
 *   determination, approval, preapproval, lender commitment, environmental
 *   clearance, payment authorization, or any regulatory or legal reliance.
 */

export const READINESS_ASSESSMENT_RUNTIME_VERSION =
  "readiness-assessment-runtime-v0.1.0";

export type ReadinessSectionId =
  | "borrower_intake"
  | "financing_pathway"
  | "documents"
  | "environmental"
  | "opportunity_discovery"
  | "data_rights";

export type ReadinessSectionStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "AWAITING_REVIEW"
  | "NOT_STARTED";

export type ReadinessHandoffStatus =
  | "complete"
  | "needs-input"
  | "pending-review";

export type ReadinessHandoff = {
  id: string;
  label: string;
  route: string;
  status: ReadinessHandoffStatus;
  reason: string;
};

export type ReadinessSection = {
  id: ReadinessSectionId;
  label: string;
  status: ReadinessSectionStatus;
  readinessPercent: number;
  missingItems: string[];
  reviewSignals: string[];
  nextRoute: string;
};

export type ReadinessAssessmentInput = {
  borrowerId?: string | null;
  applicationId?: string | null;
  userId?: string | null;
  onboarding?: BorrowerOnboardingState | null;
  financing?: FinancingPathwayInput | null;
  documents?: {
    requestedCount?: number;
    receivedCount?: number;
    pendingReviewCount?: number;
  } | null;
  environmental?: {
    triggerReviewRequested?: boolean;
    exemptionReviewRequested?: boolean;
    intakeSubmitted?: boolean;
  } | null;
  discovery?: {
    interestsSelected?: number;
    advisoryViews?: number;
  } | null;
  dataRights?: {
    portabilityRequested?: boolean;
    accessRequestSubmitted?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type ReadinessAssessmentResult = {
  runtimeVersion: string;
  generatedAt: string;
  overallReadinessPercent: number;
  reviewSignals: string[];
  missingItems: string[];
  sections: ReadinessSection[];
  handoffs: ReadinessHandoff[];
  recommendedNextRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  onboardingWorkflow: BorrowerOnboardingWorkflow | null;
  financingPathway: FinancingPathwayResult | null;
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  noCertification: true;
  noPublicVerification: true;
  noApproval: true;
  noLegalOrRegulatoryReliance: true;
};

export const READINESS_DISCLOSURES = [
  "Readiness assessment is operational guidance only.",
  "Readiness assessment is not an approval.",
  "Readiness assessment is not an eligibility determination.",
  "Readiness assessment is not an official certification.",
  "Readiness assessment is not a public verification.",
  "Readiness assessment does not authorize legal or regulatory reliance.",
  "Readiness assessment does not authorize payment capture.",
  "Readiness assessment does not authorize borrower notice sending.",
  "Readiness assessment does not authorize official report publication.",
  "Human review is required before any readiness signal is treated as a decision.",
  "Missing information may delay review until borrower or operator review is complete.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const READINESS_PRODUCTION_RESTRICTIONS = [
  "no certification",
  "no public verification",
  "no eligibility determination",
  "no approval",
  "no preapproval",
  "no underwriting decision",
  "no lender commitment",
  "no environmental clearance",
  "no regulatory reliance",
  "no legal reliance",
  "no borrower notice send",
  "no payment capture",
  "no live external action",
] as const;

const READINESS_SECTION_WEIGHTS: Record<ReadinessSectionId, number> = {
  borrower_intake: 25,
  financing_pathway: 20,
  documents: 15,
  environmental: 15,
  opportunity_discovery: 10,
  data_rights: 15,
};

const READINESS_SECTION_LABELS: Record<ReadinessSectionId, string> = {
  borrower_intake: "Borrower intake",
  financing_pathway: "Financing pathway",
  documents: "Documents",
  environmental: "Environmental intake",
  opportunity_discovery: "Opportunity discovery",
  data_rights: "Data rights",
};

const READINESS_SECTION_ROUTES: Record<ReadinessSectionId, string> = {
  borrower_intake: "/onboarding",
  financing_pathway: "/financing-pathways",
  documents: "/portal/borrower/documents",
  environmental: "/portal/borrower/environmental-intake",
  opportunity_discovery: "/portal/borrower/opportunities",
  data_rights: "/portal/borrower/data-rights",
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildBorrowerIntakeSection(
  workflow: BorrowerOnboardingWorkflow | null
): ReadinessSection {
  if (!workflow) {
    return {
      id: "borrower_intake",
      label: READINESS_SECTION_LABELS.borrower_intake,
      status: "NOT_STARTED",
      readinessPercent: 0,
      missingItems: [
        "borrower onboarding intake",
        "farm stage",
        "farm location",
        "farm type",
        "borrower goal",
        "acreage",
        "service interest",
      ],
      reviewSignals: [
        "Borrower onboarding intake has not been submitted.",
        "Borrower onboarding must be submitted before readiness can be assessed for downstream review.",
      ],
      nextRoute: READINESS_SECTION_ROUTES.borrower_intake,
    };
  }

  const reviewSignals: string[] = [
    "Borrower intake remains review-bound and not an approval, eligibility, or financing determination.",
  ];

  if (workflow.missingItems.length > 0) {
    reviewSignals.push(
      `Borrower intake is missing ${workflow.missingItems.length} required item(s).`
    );
  }

  let status: ReadinessSectionStatus;

  if (workflow.readinessPercent >= 100) {
    status = "READY_FOR_REVIEW";
  } else if (workflow.readinessPercent === 0) {
    status = "NOT_STARTED";
  } else {
    status = "NEEDS_INPUT";
  }

  return {
    id: "borrower_intake",
    label: READINESS_SECTION_LABELS.borrower_intake,
    status,
    readinessPercent: clampPercent(workflow.readinessPercent),
    missingItems: [...workflow.missingItems],
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.borrower_intake,
  };
}

function buildFinancingPathwaySection(
  pathway: FinancingPathwayResult | null
): ReadinessSection {
  if (!pathway) {
    return {
      id: "financing_pathway",
      label: READINESS_SECTION_LABELS.financing_pathway,
      status: "NOT_STARTED",
      readinessPercent: 0,
      missingItems: [
        "financing pathway evaluation",
        "borrower context for pathway guidance",
      ],
      reviewSignals: [
        "No financing pathway guidance has been requested.",
        "Financing pathway guidance is advisory only and review-bound.",
      ],
      nextRoute: READINESS_SECTION_ROUTES.financing_pathway,
    };
  }

  const reviewSignals: string[] = [
    "Financing pathway guidance remains advisory only with no approval, eligibility, or lender commitment claims.",
  ];

  if (pathway.readiness.missingItems.length > 0) {
    reviewSignals.push(
      `Financing pathway context is missing ${pathway.readiness.missingItems.length} required item(s).`
    );
  }

  if (pathway.pathways.length === 0) {
    reviewSignals.push(
      "No pathway candidates were returned for the supplied borrower context."
    );
  }

  let status: ReadinessSectionStatus;

  if (pathway.readiness.readinessPercent >= 100) {
    status = "READY_FOR_REVIEW";
  } else if (pathway.readiness.readinessPercent === 0) {
    status = "NOT_STARTED";
  } else {
    status = "NEEDS_INPUT";
  }

  return {
    id: "financing_pathway",
    label: READINESS_SECTION_LABELS.financing_pathway,
    status,
    readinessPercent: clampPercent(pathway.readiness.readinessPercent),
    missingItems: [...pathway.readiness.missingItems],
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.financing_pathway,
  };
}

function buildDocumentsSection(
  documents: ReadinessAssessmentInput["documents"]
): ReadinessSection {
  const requested = Math.max(0, Math.trunc(documents?.requestedCount ?? 0));
  const received = Math.max(0, Math.trunc(documents?.receivedCount ?? 0));
  const pending = Math.max(0, Math.trunc(documents?.pendingReviewCount ?? 0));
  const missingItems: string[] = [];
  const reviewSignals: string[] = [
    "Document review is human-review-bound and does not authorize an official report or determination.",
  ];

  let readinessPercent = 0;
  let status: ReadinessSectionStatus = "NOT_STARTED";

  if (requested === 0 && received === 0 && pending === 0) {
    missingItems.push("document request scope");
    reviewSignals.push(
      "Document scope has not been requested. Continue to documents to prepare materials."
    );
    status = "NOT_STARTED";
  } else if (requested === 0 && received > 0) {
    readinessPercent = 50;
    status = "AWAITING_REVIEW";
    reviewSignals.push("Submitted documents await human review.");
  } else if (requested > 0) {
    const ratio = Math.min(1, received / requested);
    readinessPercent = Math.round(ratio * 100);

    if (received < requested) {
      missingItems.push(
        `${requested - received} requested document(s) remain outstanding`
      );
      status = "NEEDS_INPUT";
    } else if (pending > 0) {
      status = "AWAITING_REVIEW";
      reviewSignals.push(
        `${pending} document(s) await human review before completion.`
      );
    } else {
      status = "READY_FOR_REVIEW";
    }
  }

  return {
    id: "documents",
    label: READINESS_SECTION_LABELS.documents,
    status,
    readinessPercent: clampPercent(readinessPercent),
    missingItems,
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.documents,
  };
}

function buildEnvironmentalSection(
  environmental: ReadinessAssessmentInput["environmental"],
  onboarding: BorrowerOnboardingState | null | undefined
): ReadinessSection {
  const interestRequested = Boolean(
    onboarding?.interests?.environmentalReports
  );
  const triggerReview = Boolean(environmental?.triggerReviewRequested);
  const exemptionReview = Boolean(environmental?.exemptionReviewRequested);
  const intakeSubmitted = Boolean(environmental?.intakeSubmitted);

  const missingItems: string[] = [];
  const reviewSignals: string[] = [
    "Environmental review is human-review-bound. No environmental clearance, permit, or provider engagement is created.",
  ];

  let readinessPercent = 0;
  let status: ReadinessSectionStatus = "NOT_STARTED";

  if (!interestRequested && !intakeSubmitted) {
    reviewSignals.push(
      "Environmental review has not been requested by the borrower."
    );
    status = "NOT_STARTED";
  } else if (interestRequested && !intakeSubmitted) {
    missingItems.push("environmental intake submission");
    readinessPercent = 30;
    status = "NEEDS_INPUT";
  } else if (intakeSubmitted && !triggerReview && !exemptionReview) {
    readinessPercent = 60;
    status = "AWAITING_REVIEW";
    reviewSignals.push(
      "Environmental intake submitted; trigger or exemption routing is pending review."
    );
  } else if (intakeSubmitted && (triggerReview || exemptionReview)) {
    readinessPercent = 100;
    status = "READY_FOR_REVIEW";
    reviewSignals.push(
      "Environmental intake is routed for governed trigger/exemption review."
    );
  }

  return {
    id: "environmental",
    label: READINESS_SECTION_LABELS.environmental,
    status,
    readinessPercent: clampPercent(readinessPercent),
    missingItems,
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.environmental,
  };
}

function buildDiscoverySection(
  discovery: ReadinessAssessmentInput["discovery"],
  onboarding: BorrowerOnboardingState | null | undefined
): ReadinessSection {
  const discoveryInterestSelected =
    Boolean(onboarding?.interests?.vendorRecommendations) ||
    Boolean(onboarding?.interests?.commodityIntelligence) ||
    Boolean(onboarding?.interests?.soilAnalysis);
  const interestsSelected = Math.max(
    0,
    Math.trunc(discovery?.interestsSelected ?? 0)
  );
  const advisoryViews = Math.max(0, Math.trunc(discovery?.advisoryViews ?? 0));

  const reviewSignals: string[] = [
    "Discovery output is advisory only with no source certainty, guaranteed revenue, program approval, or legal permission claim.",
  ];
  const missingItems: string[] = [];

  let readinessPercent = 0;
  let status: ReadinessSectionStatus = "NOT_STARTED";

  if (!discoveryInterestSelected && interestsSelected === 0) {
    reviewSignals.push(
      "Opportunity discovery has not been requested by the borrower."
    );
    status = "NOT_STARTED";
  } else if (discoveryInterestSelected && advisoryViews === 0) {
    readinessPercent = 40;
    status = "NEEDS_INPUT";
    missingItems.push("advisory discovery review");
    reviewSignals.push(
      "Discovery interest selected; advisory discovery review has not been started."
    );
  } else {
    readinessPercent = 100;
    status = "READY_FOR_REVIEW";
    reviewSignals.push(
      "Advisory discovery has been reviewed and remains advisory only."
    );
  }

  return {
    id: "opportunity_discovery",
    label: READINESS_SECTION_LABELS.opportunity_discovery,
    status,
    readinessPercent: clampPercent(readinessPercent),
    missingItems,
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.opportunity_discovery,
  };
}

function buildDataRightsSection(
  dataRights: ReadinessAssessmentInput["dataRights"]
): ReadinessSection {
  const portabilityRequested = Boolean(dataRights?.portabilityRequested);
  const accessRequestSubmitted = Boolean(dataRights?.accessRequestSubmitted);

  const reviewSignals: string[] = [
    "Borrower data rights remain available through governed portability and access workflows.",
  ];
  const missingItems: string[] = [];

  let readinessPercent = 0;
  let status: ReadinessSectionStatus = "NOT_STARTED";

  if (!portabilityRequested && !accessRequestSubmitted) {
    readinessPercent = 50;
    status = "AWAITING_REVIEW";
    reviewSignals.push(
      "Data rights workflows are available on demand and do not require active borrower request."
    );
  } else if (portabilityRequested && !accessRequestSubmitted) {
    readinessPercent = 75;
    status = "AWAITING_REVIEW";
    missingItems.push("access request review");
  } else {
    readinessPercent = 100;
    status = "READY_FOR_REVIEW";
    reviewSignals.push("Data rights request is queued for governed review.");
  }

  return {
    id: "data_rights",
    label: READINESS_SECTION_LABELS.data_rights,
    status,
    readinessPercent: clampPercent(readinessPercent),
    missingItems,
    reviewSignals,
    nextRoute: READINESS_SECTION_ROUTES.data_rights,
  };
}

function aggregateReadinessPercent(sections: ReadinessSection[]): number {
  const totalWeight = sections.reduce(
    (sum, section) => sum + (READINESS_SECTION_WEIGHTS[section.id] ?? 0),
    0
  );

  if (totalWeight === 0) {
    return 0;
  }

  const weighted = sections.reduce(
    (sum, section) =>
      sum +
      (READINESS_SECTION_WEIGHTS[section.id] ?? 0) *
        (section.readinessPercent / 100),
    0
  );

  return clampPercent((weighted / totalWeight) * 100);
}

function buildHandoffs(sections: ReadinessSection[]): ReadinessHandoff[] {
  return sections.map((section) => {
    let status: ReadinessHandoffStatus = "needs-input";

    if (section.status === "READY_FOR_REVIEW") {
      status = "pending-review";
    } else if (section.status === "AWAITING_REVIEW") {
      status = "pending-review";
    } else if (section.status === "NEEDS_INPUT") {
      status = "needs-input";
    } else if (section.status === "NOT_STARTED") {
      status = "needs-input";
    }

    return {
      id: `readiness-${section.id}`,
      label: section.label,
      route: section.nextRoute,
      status,
      reason:
        section.reviewSignals[0] ??
        "Section remains review-bound and advisory only.",
    };
  });
}

export function assessBorrowerReadiness(
  input: ReadinessAssessmentInput = {}
): ReadinessAssessmentResult {
  const onboardingWorkflow = input.onboarding
    ? createBorrowerOnboardingWorkflow(input.onboarding)
    : null;

  const financingPathway = input.financing
    ? evaluateFinancingPathways(input.financing)
    : null;

  const sections: ReadinessSection[] = [
    buildBorrowerIntakeSection(onboardingWorkflow),
    buildFinancingPathwaySection(financingPathway),
    buildDocumentsSection(input.documents ?? null),
    buildEnvironmentalSection(input.environmental ?? null, input.onboarding ?? null),
    buildDiscoverySection(input.discovery ?? null, input.onboarding ?? null),
    buildDataRightsSection(input.dataRights ?? null),
  ];

  const overallReadinessPercent = aggregateReadinessPercent(sections);
  const missingItems = unique(
    sections.flatMap((section) => section.missingItems)
  );
  const reviewSignals = unique(
    sections.flatMap((section) => section.reviewSignals)
  );

  if (overallReadinessPercent < 100) {
    reviewSignals.unshift(
      "Readiness is partial. Complete the missing items and continue review."
    );
  } else {
    reviewSignals.unshift(
      "Readiness is fully prepared for human review. No determination has been issued."
    );
  }

  const handoffs = buildHandoffs(sections);
  const recommendedNextRoutes = unique(
    handoffs
      .filter((handoff) => handoff.status !== "complete")
      .map((handoff) => handoff.route)
  );

  return {
    runtimeVersion: READINESS_ASSESSMENT_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    overallReadinessPercent,
    reviewSignals,
    missingItems,
    sections,
    handoffs,
    recommendedNextRoutes,
    disclosures: unique([
      ...READINESS_DISCLOSURES,
      ...(financingPathway ? financingPathway.disclosures : []),
    ]),
    productionRestrictions: unique([
      ...READINESS_PRODUCTION_RESTRICTIONS,
      ...(financingPathway ? financingPathway.productionRestrictions : []),
    ]),
    onboardingWorkflow,
    financingPathway,
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    noCertification: true,
    noPublicVerification: true,
    noApproval: true,
    noLegalOrRegulatoryReliance: true,
  };
}

export const READINESS_VERSION_REFS = {
  runtime: READINESS_ASSESSMENT_RUNTIME_VERSION,
  financingPathway: FINANCING_PATHWAY_ENGINE_VERSION,
} as const;
