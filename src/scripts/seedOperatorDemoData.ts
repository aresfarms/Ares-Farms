import "dotenv/config";

/**
 * Governed Operator Demo Seed
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional auditability and accountable authority.
 * - Vol II: keeps demo borrower, lender, sponsor, report, and agency-adjacent
 *   records advisory-only until explicit production gates pass.
 * - Vol III: seeds through replay-safe backend routes instead of direct table
 *   writes so version, classification, observability, and evidence records are
 *   produced by the same runtime used by Modules 01-20.
 * - Vol IV: gives operators a repeatable handoff workflow for demos,
 *   training, exception review, and audit preparation.
 * - Vol V: enforces canonical classification, explainability, source authority,
 *   controlled disclosure, replayability, and durable governance evidence.
 *
 * Usage:
 * 1. Start the app in another terminal: npm run dev
 * 2. Run this command: npm run demo:seed
 */

const baseUrl =
  process.env.BACKEND_SMOKE_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type RouteJson = Record<string, unknown> & {
  ok?: boolean;
  accepted?: boolean;
  auditId?: string;
  application?: {
    id?: string;
  };
  document?: {
    id?: string;
  };
  handoff?: {
    id?: string;
    handoffToken?: string;
    rawContentAccepted?: boolean;
  };
  queueItem?: {
    id?: string;
    status?: string;
  };
  connectorRun?: {
    id?: string;
    liveCallPerformed?: boolean;
  };
  result?: {
    advisoryOnly?: boolean;
    liveCallPerformed?: boolean;
    readyForSession?: boolean;
    sessionOutcome?: string;
    externalRequestTransmitted?: boolean;
    dataProcessedByEngine?: boolean;
  };
  ruleEvaluation?: {
    id?: string;
    advisoryOnly?: boolean;
    humanReviewRequired?: boolean;
  };
  humanReview?: {
    id?: string;
    finalActionAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  adverseActionReview?: {
    id?: string;
    noticeStatus?: string;
    finalNoticeAllowed?: boolean;
  } | null;
  ingestionEvent?: {
    id?: string;
    dataProcessedByEngine?: boolean;
    externalRequestTransmitted?: boolean;
  };
  workflow?: {
    id?: string;
    partnerType?: string;
    finalActionAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
  };
  reportRecord?: {
    id?: string;
    reportId?: string;
    reportType?: string;
    advisoryOnly?: boolean;
    officialUseAllowed?: boolean;
    borrowerDisclosureAllowed?: boolean;
    humanReviewRequired?: boolean;
    externalReportGenerated?: boolean;
  };
  governance?: {
    traceId?: string;
  };
};

type SeedStep = {
  label: string;
  path: string;
  id?: string | null;
  traceId?: string | null;
};

async function post(path: string, body: Record<string, unknown>): Promise<RouteJson> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `Could not reach ${baseUrl}${path}. Start the app with npm run dev before running npm run demo:seed. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const json = (await response.json()) as RouteJson;

  if (response.status < 200 || response.status >= 300 || json.ok !== true) {
    throw new Error(
      `Demo seed route failed: ${path} ${response.status} ${JSON.stringify(json)}`
    );
  }

  return json;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Demo seed did not receive required ${label}.`);
  }

  return value;
}

function completeCredentialedIngestionPayload(input: {
  runId: string;
  applicationId: string;
  borrowerId: string;
  tenantId: string;
  operatorId: string;
}) {
  return {
    role: "operator",
    userId: input.borrowerId,
    actorId: input.operatorId,
    initiatingActorId: input.operatorId,
    borrowerId: input.borrowerId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    externalTargetDomain: "farmers.gov",
    vaultRefId: `vault://${input.runId}/demo/usda-farmers-gov`,
    credentialType: "SESSION_TOKEN",
    externalPlatform: "USDA Farmers.gov",
    holdingActorId: input.operatorId,
    licenseType: "credentialed-human-agency-access",
    licenseScope: {
      applicationId: input.applicationId,
      borrowerId: input.borrowerId,
      permittedCategories: [
        "farm-record-summary",
        "program-eligibility-reference",
      ],
    },
    expiryTimestamp: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    renewalStatus: "ACTIVE",
    acquisitionMethod: "SESSION",
    sourceType: "CREDENTIALED_SESSION",
    sourceTrustClassification: "ADVISORY",
    requestedDataCategories: [
      "farm-record-summary",
      "program-eligibility-reference",
    ],
    humanAuthorizationRef: `human-auth://${input.runId}/demo`,
    sourceAuthorityRef: `source-authority://${input.runId}/farmers-gov`,
    dataResidencyZone: "US",
    sovereigntyClassification: "NON_SOVEREIGN_APPLICATION_SCOPED",
    tosComplianceAttestationRef: `tos://${input.runId}/demo`,
    tosPermitsAccess: true,
    licenseAuthorizesCategories: true,
    useWithinLicenseScope: true,
    whitelistApproved: true,
    baselineSyncRef: `baseline-sync://${input.runId}/demo`,
    isolationBoundaryConfirmed: true,
    provenanceEnvelopeRef: `provenance://${input.runId}/demo`,
    bulkAcquisitionRequested: false,
    metadata: {
      demoSeedRunId: input.runId,
      scenario: "operator-demo-ready-not-started",
      officialDataFetched: false,
      externalActionAllowed: false,
    },
  };
}

async function main(): Promise<void> {
  const runId = `operator-demo-seed-${Date.now()}`;
  const tenantId = `${runId}-tenant`;
  const borrowerId = `${runId}-borrower`;
  const applicationId = `${runId}-application`;
  const operatorId = `${runId}-operator`;
  const lenderId = `${runId}-lender`;
  const sponsorId = `${runId}-sponsor`;
  const steps: SeedStep[] = [];

  const sharedMetadata = {
    demoSeedRunId: runId,
    masterVolumeAligned: true,
    advisoryOnly: true,
    productionLiveActionAllowed: false,
  };

  const onboard = await post("/api/onboard", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    farmName: "Ares Demo Farm",
    county: "Wake",
    state: "NC",
    acreage: 128,
    requestedAmount: 485000,
    metadata: sharedMetadata,
  });

  if (onboard.application?.id !== applicationId || onboard.accepted !== true) {
    throw new Error("Demo seed onboarding did not create the expected application.");
  }

  steps.push({
    label: "borrower-onboarding",
    path: "/api/onboard",
    id: onboard.application.id,
    traceId: onboard.governance?.traceId,
  });

  const application = await post("/api/apply", {
    role: "borrower",
    userId: borrowerId,
    borrowerId,
    tenantId,
    applicationId,
    eventType: "APPLICATION_SUBMITTED",
    entityType: "application",
    entityId: applicationId,
    requestedAmount: 485000,
    requestedPrograms: ["USDA_FSA_REVIEW", "SBA_7A_REVIEW"],
    payload: {
      farmName: "Ares Demo Farm",
      county: "Wake",
      state: "NC",
      acreage: 128,
      crops: ["vegetables", "small-grain-rotation"],
      livestock: ["pasture-poultry"],
      requestedAmount: 485000,
      requestedPrograms: ["USDA_FSA_REVIEW", "SBA_7A_REVIEW"],
    },
    metadata: {
      ...sharedMetadata,
      stage: "operator-demo-application-intake",
    },
  });

  steps.push({
    label: "application-submission",
    path: "/api/apply",
    id: application.auditId,
    traceId: application.governance?.traceId,
  });

  const document = await post("/api/documents/submit", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    documentType: "farm_operating_plan",
    documentName: "Farm Operating Plan",
    fileName: "ares-demo-farm-operating-plan.pdf",
    mimeType: "application/pdf",
    byteSize: 4096,
    checksum: `${runId}-farm-operating-plan-checksum`,
    storageUri: `governed://documents/${runId}/farm-operating-plan.pdf`,
    metadata: {
      ...sharedMetadata,
      rawDocumentContentStoredBySeed: false,
    },
  });
  const documentId = requireString(document.document?.id, "document id");

  steps.push({
    label: "document-metadata",
    path: "/api/documents/submit",
    id: documentId,
    traceId: document.governance?.traceId,
  });

  const handoff = await post("/api/documents/storage-handoff", {
    role: "borrower",
    borrowerId,
    tenantId,
    applicationId,
    documentType: "farm_operating_plan",
    documentName: "Farm Operating Plan",
    fileName: "ares-demo-farm-operating-plan.pdf",
    mimeType: "application/pdf",
    byteSize: 8192,
    checksum: `${runId}-storage-handoff-checksum`,
    metadata: {
      ...sharedMetadata,
      rawDocumentContentStoredBySeed: false,
    },
  });
  const handoffId = requireString(handoff.handoff?.id, "storage handoff id");

  if (handoff.handoff?.rawContentAccepted !== false) {
    throw new Error("Demo seed storage handoff unexpectedly accepted raw content.");
  }

  steps.push({
    label: "document-storage-handoff",
    path: "/api/documents/storage-handoff",
    id: handoffId,
    traceId: handoff.governance?.traceId,
  });

  const queue = await post("/api/queues/operator", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    queueType: "DOCUMENT_REVIEW",
    sourceType: "application_document",
    sourceId: documentId,
    sourceTraceId: document.governance?.traceId ?? `${runId}-document-trace`,
    priority: "HIGH",
    reviewReason:
      "Demo case document metadata requires operator review before lender, sponsor, borrower, or agency-facing reliance.",
    requiredRole: "operator",
    metadata: sharedMetadata,
  });
  const queueItemId = requireString(queue.queueItem?.id, "operator queue item id");

  steps.push({
    label: "operator-review-queue",
    path: "/api/queues/operator",
    id: queueItemId,
    traceId: queue.governance?.traceId,
  });

  const connector = await post("/api/connectors/source-check", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    sourceId: "usda-fsa",
    queryType: "program_reference",
    query: {
      state: "NC",
      county: "Wake",
      programFamily: "farm-service-review",
    },
    metadata: sharedMetadata,
  });
  const connectorRunId = requireString(
    connector.connectorRun?.id,
    "connector run id"
  );

  if (
    connector.connectorRun?.liveCallPerformed !== false ||
    connector.result?.liveCallPerformed !== false
  ) {
    throw new Error("Demo seed connector check unexpectedly performed a live call.");
  }

  steps.push({
    label: "advisory-source-check",
    path: "/api/connectors/source-check",
    id: connectorRunId,
    traceId: connector.governance?.traceId,
  });

  const rule = await post("/api/rules/evaluate", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    operation: "regulated-eligibility-review",
    facts: {
      state: "NC",
      county: "Wake",
      acreage: 128,
      revenue: 225000,
      requestedProgram: "USDA_FSA_REVIEW",
      operatorDemo: true,
    },
    metadata: sharedMetadata,
  });
  const ruleEvaluationId = requireString(
    rule.ruleEvaluation?.id,
    "rule evaluation id"
  );

  if (
    rule.ruleEvaluation?.advisoryOnly !== true ||
    rule.ruleEvaluation.humanReviewRequired !== true
  ) {
    throw new Error("Demo seed rule evaluation did not remain advisory and reviewable.");
  }

  steps.push({
    label: "rule-overlay-evaluation",
    path: "/api/rules/evaluate",
    id: ruleEvaluationId,
    traceId: rule.governance?.traceId,
  });

  const review = await post("/api/reviews/human", {
    role: "operator",
    borrowerId,
    tenantId,
    applicationId,
    reviewType: "regulated_decision_review",
    sourceType: "rule_overlay_evaluation",
    sourceId: ruleEvaluationId,
    sourceTraceId: rule.governance?.traceId ?? `${runId}-rule-trace`,
    priority: "HIGH",
    requiredReviewerRole: "authorized-underwriter",
    candidateOutcome: "DENIAL_REVIEW",
    adverseActionCandidate: true,
    reasonCodes: ["ADVERSE_ACTION_REVIEW_REQUIRED"],
    explanationSummary:
      "Demo candidate requires accountable human review before any adverse-action notice or final action.",
    metadata: sharedMetadata,
  });
  const humanReviewId = requireString(
    review.humanReview?.id,
    "human review workflow id"
  );
  const adverseActionReviewId = requireString(
    review.adverseActionReview?.id,
    "adverse-action review id"
  );

  if (
    review.humanReview?.finalActionAllowed !== false ||
    review.adverseActionReview?.finalNoticeAllowed !== false
  ) {
    throw new Error("Demo seed review unexpectedly allowed final action or notice.");
  }

  steps.push({
    label: "human-review-workflow",
    path: "/api/reviews/human",
    id: humanReviewId,
    traceId: review.governance?.traceId,
  });

  const credentialedIngestion = await post(
    "/api/connectors/credentialed-ingestion",
    completeCredentialedIngestionPayload({
      runId,
      applicationId,
      borrowerId,
      tenantId,
      operatorId,
    })
  );
  const ingestionEventId = requireString(
    credentialedIngestion.ingestionEvent?.id,
    "credentialed ingestion event id"
  );

  if (
    credentialedIngestion.result?.readyForSession !== true ||
    credentialedIngestion.result.externalRequestTransmitted !== false ||
    credentialedIngestion.result.dataProcessedByEngine !== false ||
    credentialedIngestion.ingestionEvent?.externalRequestTransmitted !== false ||
    credentialedIngestion.ingestionEvent.dataProcessedByEngine !== false
  ) {
    throw new Error(
      "Demo seed credentialed ingestion did not remain ready-not-started."
    );
  }

  steps.push({
    label: "credentialed-ingestion-ready-not-started",
    path: "/api/connectors/credentialed-ingestion",
    id: ingestionEventId,
    traceId: credentialedIngestion.governance?.traceId,
  });

  const lender = await post("/api/partners/workflows", {
    role: "lender",
    userId: borrowerId,
    partnerType: "LENDER",
    partnerId: lenderId,
    partnerName: "Ares Demo Community Lender",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "LENDER_REVIEW",
    workflowStage: "DUE_DILIGENCE",
    priority: "HIGH",
    requestedAmount: 485000,
    programType: "USDA_FSA_REVIEW",
    assignedTo: lenderId,
    metadata: {
      ...sharedMetadata,
      partnerActorId: lenderId,
    },
  });
  const lenderWorkflowId = requireString(lender.workflow?.id, "lender workflow id");

  const sponsor = await post("/api/partners/workflows", {
    role: "sponsor",
    userId: borrowerId,
    partnerType: "SPONSOR",
    partnerId: sponsorId,
    partnerName: "Ares Demo Sponsor Partner",
    borrowerId,
    tenantId,
    applicationId,
    workflowType: "SPONSORSHIP_REVIEW",
    workflowStage: "REVIEW",
    priority: "NORMAL",
    programType: "sponsor-support-review",
    assignedTo: sponsorId,
    metadata: {
      ...sharedMetadata,
      partnerActorId: sponsorId,
    },
  });
  const sponsorWorkflowId = requireString(
    sponsor.workflow?.id,
    "sponsor workflow id"
  );

  for (const workflow of [lender.workflow, sponsor.workflow]) {
    if (
      workflow?.finalActionAllowed !== false ||
      workflow.borrowerDisclosureAllowed !== false ||
      workflow.humanReviewRequired !== true
    ) {
      throw new Error(
        "Demo seed partner workflow did not remain advisory, undisclosed, and reviewable."
      );
    }
  }

  steps.push(
    {
      label: "lender-workflow",
      path: "/api/partners/workflows",
      id: lenderWorkflowId,
      traceId: lender.governance?.traceId,
    },
    {
      label: "sponsor-workflow",
      path: "/api/partners/workflows",
      id: sponsorWorkflowId,
      traceId: sponsor.governance?.traceId,
    }
  );

  const reportTypes = [
    "DEMO_OPERATOR_BRIEFING",
    "EXCEPTION_REMEDIATION_MEMO",
    "BORROWER_PORTABILITY_PACKAGE_SUMMARY",
  ];
  const reports: Array<{
    reportType?: string;
    reportId?: string;
    reportRecordId?: string;
    traceId?: string | null;
  }> = [];

  for (const reportType of reportTypes) {
    const report = await post("/api/reports/pdf", {
      role: "operator",
      userId: borrowerId,
      borrowerId,
      tenantId,
      applicationId,
      reportType,
      payload: {
        score: 0.72,
        programFamily: "USDA_FSA_REVIEW",
        queueItemId,
        humanReviewId,
        connectorRunId,
        ingestionEventId,
        advisoryOnly: true,
        officialUseAllowed: false,
        externalReportGenerated: false,
      },
      metadata: {
        ...sharedMetadata,
        operatorActorId: operatorId,
        reportPurpose: reportType,
      },
    });

    if (
      report.reportRecord?.advisoryOnly !== true ||
      report.reportRecord.officialUseAllowed !== false ||
      report.reportRecord.borrowerDisclosureAllowed !== false ||
      report.reportRecord.humanReviewRequired !== true ||
      report.reportRecord.externalReportGenerated !== false
    ) {
      throw new Error(
        `Demo seed report ${reportType} did not preserve advisory report controls.`
      );
    }

    reports.push({
      reportType: report.reportRecord.reportType,
      reportId: report.reportRecord.reportId,
      reportRecordId: report.reportRecord.id,
      traceId: report.governance?.traceId,
    });

    steps.push({
      label: `report-${reportType.toLowerCase()}`,
      path: "/api/reports/pdf",
      id: report.reportRecord.id,
      traceId: report.governance?.traceId,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        message:
          "Governed operator demo seed completed. All seeded records remain advisory-only and gated from live external action.",
        baseUrl,
        runId,
        tenantId,
        borrowerId,
        applicationId,
        operatorId,
        records: {
          applicationAuditId: application.auditId,
          documentId,
          handoffId,
          queueItemId,
          connectorRunId,
          ruleEvaluationId,
          humanReviewId,
          adverseActionReviewId,
          ingestionEventId,
          lenderWorkflowId,
          sponsorWorkflowId,
          reports,
        },
        nextRoutes: [
          "/module-readiness",
          "/case-command",
          "/applications",
          "/documents",
          "/operator-queue",
          "/reviews",
          "/rules",
          "/connectors",
          "/source-ingestion",
          "/partners",
          "/reports",
          "/exception-remediation",
          "/data-rights",
        ],
        guardrails: {
          officialReportGenerated: false,
          liveExternalCallPerformed: false,
          rawDocumentContentAccepted: false,
          paymentCaptured: false,
          finalDecisionIssued: false,
          borrowerNoticeSent: false,
          publicVerificationEnabled: false,
        },
        steps,
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown governed operator demo seed error."
  );
  process.exit(1);
});
