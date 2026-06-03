/**
 * Lender Workflow Coordination Runtime
 *
 * Master Volume Governance:
 * - Vol I: keeps lender coordination subordinate to constitutional
 *   authority. The lender role is coordination, not credit, underwriting,
 *   or eligibility authority.
 * - Vol II: blocks coordination from becoming approval, preapproval,
 *   underwriting decision, eligibility determination, credit decision,
 *   lender commitment, official credit communication, or regulatory
 *   reliance.
 * - Vol III: provides deterministic, replay-safe aggregation of
 *   application, overlay, evidence, packet, and partner-workflow
 *   coordination posture across borrower submissions.
 * - Vol III-B: supplies classification-, version-, observability-, and
 *   explainability-ready posture for runtime evidence.
 * - Vol IV: routes lender handoffs to lender applications, overlays,
 *   evidence, property opportunities, revenue opportunities, partner
 *   workflows, and the lender dashboard.
 * - Vol V: preserves canonical claims governance, controlled disclosure,
 *   replay, and source-authority boundaries on lender-readable output.
 * - Vol VI-VII: keeps the surface as a portable governed module with safe
 *   coordination-layer copy and no live-action posture.
 *
 * Safety boundary:
 * - Lender workflow coordination is operational coordination only.
 * - It does not approve, preapprove, deny, score, underwrite, determine
 *   eligibility, commit credit, send borrower notices, capture payment,
 *   publish official reports, or authorize any regulatory or legal
 *   reliance.
 */

export const LENDER_WORKFLOW_RUNTIME_VERSION =
  "lender-workflow-runtime-v0.1.0";

export type LenderApplicationStatus =
  | "AWAITING_INTAKE"
  | "INTAKE_RECEIVED"
  | "REVIEW_IN_PROGRESS"
  | "EVIDENCE_PENDING"
  | "OVERLAY_REVIEW_PENDING"
  | "PACKET_READY_FOR_REVIEW"
  | "ON_HOLD";

export type LenderQueueItemStatus =
  | "READY_FOR_REVIEW"
  | "NEEDS_INPUT"
  | "AWAITING_REVIEW"
  | "NOT_STARTED";

export type LenderApplicationInput = {
  applicationId: string;
  borrowerId?: string | null;
  status?: LenderApplicationStatus | null;
  intakeReadinessPercent?: number | null;
  documentsRequested?: number | null;
  documentsReceived?: number | null;
  documentsPendingReview?: number | null;
  overlayCount?: number | null;
  overlayReviewedCount?: number | null;
  evidencePacketReady?: boolean | null;
  borrowerPacketReady?: boolean | null;
  partnerWorkflowState?:
    | "NOT_OPENED"
    | "OPENED"
    | "AWAITING_LENDER_REVIEW"
    | "COMPLETED";
  notes?: string | null;
};

export type LenderWorkflowInput = {
  lenderId?: string | null;
  userId?: string | null;
  partnerWorkflowId?: string | null;
  applications?: LenderApplicationInput[];
  filter?: {
    statuses?: LenderApplicationStatus[];
    onlyPacketReady?: boolean;
    onlyOverlayPending?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type LenderQueueItem = {
  applicationId: string;
  borrowerIdMasked: string;
  status: LenderQueueItemStatus;
  applicationStatus: LenderApplicationStatus;
  intakeReadinessPercent: number;
  documents: {
    requested: number;
    received: number;
    pendingReview: number;
  };
  overlays: {
    count: number;
    reviewed: number;
  };
  evidencePacketReady: boolean;
  borrowerPacketReady: boolean;
  partnerWorkflowState: LenderApplicationInput["partnerWorkflowState"];
  reviewSignals: string[];
  blockedClaims: string[];
  recommendedNextRoutes: string[];
};

export type LenderWorkflowSection = {
  id:
    | "ready_for_review"
    | "evidence_pending"
    | "overlay_review_pending"
    | "intake_in_progress"
    | "on_hold";
  label: string;
  count: number;
  items: LenderQueueItem[];
  reviewRoute: string;
};

export type LenderWorkflowHandoff = {
  id: string;
  label: string;
  route: string;
  reason: string;
};

export type LenderWorkflowResult = {
  runtimeVersion: string;
  generatedAt: string;
  totals: {
    applicationCount: number;
    readyForReviewCount: number;
    evidencePendingCount: number;
    overlayReviewPendingCount: number;
    intakeInProgressCount: number;
    onHoldCount: number;
  };
  queueItems: LenderQueueItem[];
  sections: LenderWorkflowSection[];
  handoffs: LenderWorkflowHandoff[];
  recommendedNextRoutes: string[];
  disclosures: string[];
  productionRestrictions: string[];
  blockedClaims: string[];
  productionBlocked: true;
  humanReviewRequired: true;
  advisoryOnly: true;
  coordinationOnly: true;
  noUnderwritingReliance: true;
  noLenderCommitment: true;
  noOfficialCreditDecision: true;
  noBorrowerNoticeSend: true;
  noLegalOrRegulatoryReliance: true;
};

const DEFAULT_BLOCKED_CLAIMS = [
  "approval",
  "preapproval",
  "underwriting decision",
  "eligibility determination",
  "credit decision",
  "lender commitment",
  "official credit communication",
  "borrower notice send",
  "payment capture",
  "live external action",
  "legal or regulatory reliance",
] as const;

export const LENDER_WORKFLOW_DISCLOSURES = [
  "Lender workflow coordination is review-bound and coordination only.",
  "Lender workflow coordination does not create approval, preapproval, or eligibility determination.",
  "Lender workflow coordination does not create an underwriting decision or credit decision.",
  "Lender workflow coordination does not create a lender commitment.",
  "Lender workflow coordination does not send borrower notices.",
  "Lender workflow coordination does not capture payment.",
  "Lender workflow coordination does not authorize legal or regulatory reliance.",
  "Lender-ready means organized and complete against intake requirements only.",
  "Lender-ready does not mean approval, pre-approval, creditworthiness, eligibility for funding, underwriting approval, or guaranteed acceptance.",
  "Borrowers retain data review, export, transport, and portability rights through governed workflows.",
  "Human review is required before any coordination signal is treated as a decision.",
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
] as const;

export const LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS = [
  "no approval",
  "no preapproval",
  "no underwriting decision",
  "no eligibility determination",
  "no credit decision",
  "no lender commitment",
  "no official credit communication",
  "no borrower notice send",
  "no payment capture",
  "no live external action",
  "no legal or regulatory reliance",
] as const;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampCount(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.trunc(parsed);
}

function maskBorrowerId(borrowerId: string | null | undefined): string {
  if (!borrowerId || typeof borrowerId !== "string") {
    return "borrower-pending";
  }

  const trimmed = borrowerId.trim();

  if (trimmed.length <= 6) {
    return `borrower-${trimmed.slice(0, 2)}***`;
  }

  return `borrower-${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`;
}

function deriveStatus(
  application: LenderApplicationInput,
  documentsReceived: number,
  documentsRequested: number,
  documentsPending: number,
  overlayReviewed: number,
  overlayCount: number,
  evidenceReady: boolean,
  packetReady: boolean,
  intakeReadiness: number
): { status: LenderQueueItemStatus; applicationStatus: LenderApplicationStatus } {
  if (application.status === "ON_HOLD") {
    return { status: "AWAITING_REVIEW", applicationStatus: "ON_HOLD" };
  }

  if (intakeReadiness === 0 && documentsReceived === 0) {
    return {
      status: "NOT_STARTED",
      applicationStatus: application.status ?? "AWAITING_INTAKE",
    };
  }

  if (documentsRequested > 0 && documentsReceived < documentsRequested) {
    return {
      status: "NEEDS_INPUT",
      applicationStatus: "EVIDENCE_PENDING",
    };
  }

  if (overlayCount > 0 && overlayReviewed < overlayCount) {
    return {
      status: "AWAITING_REVIEW",
      applicationStatus: "OVERLAY_REVIEW_PENDING",
    };
  }

  if (packetReady && evidenceReady && documentsPending === 0) {
    return {
      status: "READY_FOR_REVIEW",
      applicationStatus: "PACKET_READY_FOR_REVIEW",
    };
  }

  if (evidenceReady && documentsPending > 0) {
    return {
      status: "AWAITING_REVIEW",
      applicationStatus: "REVIEW_IN_PROGRESS",
    };
  }

  return {
    status: "AWAITING_REVIEW",
    applicationStatus: application.status ?? "INTAKE_RECEIVED",
  };
}

function buildQueueItem(
  application: LenderApplicationInput
): LenderQueueItem {
  const documentsRequested = clampCount(application.documentsRequested);
  const documentsReceived = clampCount(application.documentsReceived);
  const documentsPendingReview = clampCount(application.documentsPendingReview);
  const overlayCount = clampCount(application.overlayCount);
  const overlayReviewed = clampCount(application.overlayReviewedCount);
  const intakeReadiness = clampPercent(application.intakeReadinessPercent ?? 0);
  const evidencePacketReady = Boolean(application.evidencePacketReady);
  const borrowerPacketReady = Boolean(application.borrowerPacketReady);
  const partnerWorkflowState =
    application.partnerWorkflowState ?? "NOT_OPENED";

  const { status, applicationStatus } = deriveStatus(
    application,
    documentsReceived,
    documentsRequested,
    documentsPendingReview,
    overlayReviewed,
    overlayCount,
    evidencePacketReady,
    borrowerPacketReady,
    intakeReadiness
  );

  const reviewSignals: string[] = [
    "Lender review is coordination only. No approval, eligibility, underwriting, or credit decision is created by this surface.",
  ];

  if (intakeReadiness < 100) {
    reviewSignals.push(
      `Borrower intake readiness is ${intakeReadiness}%. Additional intake items remain outstanding.`
    );
  }

  if (documentsRequested > 0 && documentsReceived < documentsRequested) {
    reviewSignals.push(
      `${documentsRequested - documentsReceived} requested document(s) remain outstanding.`
    );
  }

  if (documentsPendingReview > 0) {
    reviewSignals.push(
      `${documentsPendingReview} document(s) await human review.`
    );
  }

  if (overlayCount > 0 && overlayReviewed < overlayCount) {
    reviewSignals.push(
      `${overlayCount - overlayReviewed} overlay(s) await lender review.`
    );
  }

  if (!evidencePacketReady) {
    reviewSignals.push(
      "Evidence packet is not ready. Evidence preparation remains governed and review-bound."
    );
  }

  if (!borrowerPacketReady) {
    reviewSignals.push(
      "Borrower packet is not ready. Packet readiness reflects coordination state only."
    );
  }

  if (partnerWorkflowState !== "NOT_OPENED") {
    reviewSignals.push(
      `Partner workflow state: ${partnerWorkflowState}.`
    );
  }

  if (typeof application.notes === "string" && application.notes.trim().length > 0) {
    reviewSignals.push(`Coordination note: ${application.notes.trim()}.`);
  }

  const recommendedNextRoutes = unique([
    "/lender/applications",
    overlayCount > 0 ? "/lender/overlays" : "",
    "/lender/evidence",
    "/lender/dashboard",
  ]);

  return {
    applicationId: application.applicationId,
    borrowerIdMasked: maskBorrowerId(application.borrowerId),
    status,
    applicationStatus,
    intakeReadinessPercent: intakeReadiness,
    documents: {
      requested: documentsRequested,
      received: documentsReceived,
      pendingReview: documentsPendingReview,
    },
    overlays: {
      count: overlayCount,
      reviewed: overlayReviewed,
    },
    evidencePacketReady,
    borrowerPacketReady,
    partnerWorkflowState,
    reviewSignals: unique(reviewSignals),
    blockedClaims: [...DEFAULT_BLOCKED_CLAIMS],
    recommendedNextRoutes,
  };
}

function buildSections(
  items: LenderQueueItem[]
): LenderWorkflowSection[] {
  const ready = items.filter(
    (item) => item.applicationStatus === "PACKET_READY_FOR_REVIEW"
  );
  const evidencePending = items.filter(
    (item) => item.applicationStatus === "EVIDENCE_PENDING"
  );
  const overlayPending = items.filter(
    (item) => item.applicationStatus === "OVERLAY_REVIEW_PENDING"
  );
  const intakeInProgress = items.filter(
    (item) =>
      item.applicationStatus === "AWAITING_INTAKE" ||
      item.applicationStatus === "INTAKE_RECEIVED" ||
      item.applicationStatus === "REVIEW_IN_PROGRESS"
  );
  const onHold = items.filter(
    (item) => item.applicationStatus === "ON_HOLD"
  );

  return [
    {
      id: "ready_for_review",
      label: "Packet ready for review",
      count: ready.length,
      items: ready,
      reviewRoute: "/lender/evidence",
    },
    {
      id: "evidence_pending",
      label: "Evidence pending",
      count: evidencePending.length,
      items: evidencePending,
      reviewRoute: "/lender/evidence",
    },
    {
      id: "overlay_review_pending",
      label: "Overlay review pending",
      count: overlayPending.length,
      items: overlayPending,
      reviewRoute: "/lender/overlays",
    },
    {
      id: "intake_in_progress",
      label: "Intake in progress",
      count: intakeInProgress.length,
      items: intakeInProgress,
      reviewRoute: "/lender/applications",
    },
    {
      id: "on_hold",
      label: "On hold",
      count: onHold.length,
      items: onHold,
      reviewRoute: "/lender/dashboard",
    },
  ];
}

function buildHandoffs(): LenderWorkflowHandoff[] {
  return [
    {
      id: "lender-applications",
      label: "Lender applications",
      route: "/lender/applications",
      reason: "Application-level intake translation for coordination review.",
    },
    {
      id: "lender-overlays",
      label: "Lender overlays",
      route: "/lender/overlays",
      reason: "Advisory overlay posture and lender-facing review state.",
    },
    {
      id: "lender-evidence",
      label: "Lender evidence",
      route: "/lender/evidence",
      reason:
        "Evidence orientation and audit-traceable governance evidence without verification claims.",
    },
    {
      id: "lender-property-opportunities",
      label: "Lender property opportunities",
      route: "/lender/property-opportunities",
      reason:
        "Property coordination context without commitments or underwriting authority.",
    },
    {
      id: "lender-revenue-opportunities",
      label: "Lender revenue opportunities",
      route: "/lender/revenue-opportunities",
      reason:
        "Revenue coordination context without commitment or program certainty claims.",
    },
    {
      id: "lender-dashboard",
      label: "Lender dashboard",
      route: "/lender/dashboard",
      reason:
        "Lender coordination dashboard without commitment or underwriting claims.",
    },
    {
      id: "partner-workflows",
      label: "Partner workflows",
      route: "/partners",
      reason:
        "Partner workflow coordination and routing through governed surfaces.",
    },
  ];
}

function applyFilter(
  items: LenderQueueItem[],
  filter: LenderWorkflowInput["filter"]
): LenderQueueItem[] {
  if (!filter) {
    return items;
  }

  let filtered = items;

  if (Array.isArray(filter.statuses) && filter.statuses.length > 0) {
    const allowed = new Set(filter.statuses);

    filtered = filtered.filter((item) => allowed.has(item.applicationStatus));
  }

  if (filter.onlyPacketReady) {
    filtered = filtered.filter(
      (item) => item.applicationStatus === "PACKET_READY_FOR_REVIEW"
    );
  }

  if (filter.onlyOverlayPending) {
    filtered = filtered.filter(
      (item) => item.applicationStatus === "OVERLAY_REVIEW_PENDING"
    );
  }

  return filtered;
}

export function evaluateLenderWorkflow(
  input: LenderWorkflowInput = {}
): LenderWorkflowResult {
  const rawApplications = Array.isArray(input.applications)
    ? input.applications
    : [];
  const allItems = rawApplications.map(buildQueueItem);
  const queueItems = applyFilter(allItems, input.filter ?? null);

  const sections = buildSections(queueItems);
  const handoffs = buildHandoffs();
  const recommendedNextRoutes = unique(handoffs.map((handoff) => handoff.route));

  const totals = {
    applicationCount: queueItems.length,
    readyForReviewCount: sections.find((section) => section.id === "ready_for_review")
      ?.count ?? 0,
    evidencePendingCount:
      sections.find((section) => section.id === "evidence_pending")?.count ?? 0,
    overlayReviewPendingCount:
      sections.find((section) => section.id === "overlay_review_pending")
        ?.count ?? 0,
    intakeInProgressCount:
      sections.find((section) => section.id === "intake_in_progress")?.count ??
      0,
    onHoldCount: sections.find((section) => section.id === "on_hold")?.count ??
      0,
  };

  return {
    runtimeVersion: LENDER_WORKFLOW_RUNTIME_VERSION,
    generatedAt: new Date().toISOString(),
    totals,
    queueItems,
    sections,
    handoffs,
    recommendedNextRoutes,
    disclosures: unique([...LENDER_WORKFLOW_DISCLOSURES]),
    productionRestrictions: unique([...LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS]),
    blockedClaims: unique([...DEFAULT_BLOCKED_CLAIMS]),
    productionBlocked: true,
    humanReviewRequired: true,
    advisoryOnly: true,
    coordinationOnly: true,
    noUnderwritingReliance: true,
    noLenderCommitment: true,
    noOfficialCreditDecision: true,
    noBorrowerNoticeSend: true,
    noLegalOrRegulatoryReliance: true,
  };
}
