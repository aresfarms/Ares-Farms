import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  ReviewAdminRecord,
  getReviewAdminScopeRecord,
  listReviewAdminRecords,
} from "@/lib/reviews/reviewAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Review Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for review record reads.
 *
 * - Vol II: Protects human-review, adverse-action, appeal, explanation,
 *   disclosure, and final-action posture from uncontrolled disclosure.
 *
 * - Vol III: Provides replay-safe, record-scoped review reads before
 *   operator, underwriter, auditor, or admin modules consume review records.
 *
 * - Vol IV: Supports review monitoring, escalation, recovery, audit
 *   preparation, and dashboard-safe backend access.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type ReviewAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  transitionId?: string | null;
  status?: string | null;
  adverseActionStatus?: string | null;
  transitionStatus?: string | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
  includeAdverseActionReviews: boolean;
  includeTransitions: boolean;
};

function createReviewAdminTraceId(): string {
  return `review-admin-read-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeText(value: string | null): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): ReviewAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    humanReviewWorkflowId: normalizeText(params.get("humanReviewWorkflowId")),
    adverseActionReviewId: normalizeText(params.get("adverseActionReviewId")),
    transitionId: normalizeText(params.get("transitionId")),
    status: normalizeText(params.get("status")),
    adverseActionStatus: normalizeText(params.get("adverseActionStatus")),
    transitionStatus: normalizeText(params.get("transitionStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
    includeAdverseActionReviews: normalizeBoolean(
      params.get("includeAdverseActionReviews"),
      true
    ),
    includeTransitions: normalizeBoolean(params.get("includeTransitions"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: ReviewAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function humanReviewResponse(record: ReviewAdminRecord) {
  return {
    id: record.humanReview.id,
    applicationId: record.humanReview.applicationId,
    borrowerId: record.humanReview.borrowerId,
    tenantId: record.humanReview.tenantId,
    actorId: record.humanReview.actorId,
    reviewType: record.humanReview.reviewType,
    sourceType: record.humanReview.sourceType,
    sourceId: record.humanReview.sourceId,
    sourceTraceId: record.humanReview.sourceTraceId,
    status: record.humanReview.status,
    priority: record.humanReview.priority,
    requiredReviewerRole: record.humanReview.requiredReviewerRole,
    assignedTo: record.humanReview.assignedTo,
    escalationStatus: record.humanReview.escalationStatus,
    candidateOutcome: record.humanReview.candidateOutcome,
    advisoryOnly: record.humanReview.advisoryOnly,
    finalActionAllowed: record.humanReview.finalActionAllowed,
    adverseActionCandidate: record.humanReview.adverseActionCandidate,
    humanReviewRequired: record.humanReview.humanReviewRequired,
    governanceVersion: record.humanReview.governanceVersion,
    classification: record.humanReview.classification,
    replayRef: record.humanReview.replayRef,
    traceId: record.humanReview.traceId,
    source: record.humanReview.source,
    dueAt: record.humanReview.dueAt,
    reviewedAt: record.humanReview.reviewedAt,
    createdAt: record.humanReview.createdAt,
    updatedAt: record.humanReview.updatedAt,
  };
}

function adverseActionReviewResponse(record: ReviewAdminRecord) {
  return record.adverseActionReviews.map((review) => ({
    id: review.id,
    humanReviewWorkflowId: review.humanReviewWorkflowId,
    applicationId: review.applicationId,
    borrowerId: review.borrowerId,
    tenantId: review.tenantId,
    actorId: review.actorId,
    candidateOutcome: review.candidateOutcome,
    adverseActionStatus: review.adverseActionStatus,
    noticeStatus: review.noticeStatus,
    reasonCodes: review.reasonCodes,
    explanationSummary: review.explanationSummary,
    appealStatus: review.appealStatus,
    advisoryOnly: review.advisoryOnly,
    humanReviewRequired: review.humanReviewRequired,
    finalActionAllowed: review.finalActionAllowed,
    finalNoticeAllowed: review.finalNoticeAllowed,
    governanceVersion: review.governanceVersion,
    classification: review.classification,
    replayRef: review.replayRef,
    traceId: review.traceId,
    source: review.source,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }));
}

function transitionResponse(record: ReviewAdminRecord) {
  return record.transitions.map((transition) => ({
    id: transition.id,
    applicationId: transition.applicationId,
    borrowerId: transition.borrowerId,
    tenantId: transition.tenantId,
    actorId: transition.actorId,
    humanReviewWorkflowId: transition.humanReviewWorkflowId,
    adverseActionReviewId: transition.adverseActionReviewId,
    transitionType: transition.transitionType,
    requestedStatus: transition.requestedStatus,
    transitionStatus: transition.transitionStatus,
    reviewOutcome: transition.reviewOutcome,
    reviewerRole: transition.reviewerRole,
    reviewerAttestationRef: transition.reviewerAttestationRef,
    approvalAuthorityRef: transition.approvalAuthorityRef,
    reasonCodes: transition.reasonCodes,
    explanationSummary: transition.explanationSummary,
    transitionGates: transition.transitionGates,
    disclosureReviewCompleted: transition.disclosureReviewCompleted,
    appealRightsPrepared: transition.appealRightsPrepared,
    finalActionAllowed: transition.finalActionAllowed,
    finalNoticeAllowed: transition.finalNoticeAllowed,
    borrowerDisclosureAllowed: transition.borrowerDisclosureAllowed,
    adverseActionRequired: transition.adverseActionRequired,
    humanReviewRequired: transition.humanReviewRequired,
    governanceVersion: transition.governanceVersion,
    classification: transition.classification,
    replayRef: transition.replayRef,
    traceId: transition.traceId,
    source: transition.source,
    transitionedAt: transition.transitionedAt,
    createdAt: transition.createdAt,
    updatedAt: transition.updatedAt,
  }));
}

function applicationResponse(record: ReviewAdminRecord) {
  if (!record.application) {
    return null;
  }

  return {
    id: record.application.id,
    borrowerId: record.application.borrowerId,
    tenantId: record.application.tenantId,
    propertyId: record.application.propertyId,
    status: record.application.status,
    reviewStatus: record.application.reviewStatus,
    decisionStatus: record.application.decisionStatus,
    classification: record.application.classification,
    replayRef: record.application.replayRef,
  };
}

function propertyResponse(record: ReviewAdminRecord) {
  if (!record.property) {
    return null;
  }

  return {
    id: record.property.id,
    tenantId: record.property.tenantId,
    name: record.property.name,
    city: record.property.city,
    state: record.property.state,
    county: record.property.county,
    country: record.property.country,
    classification: record.property.classification,
    replayRef: record.property.replayRef,
  };
}

async function evaluateRecordAccessForRecords(input: {
  records: ReviewAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: ReviewAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "review.admin-read",
        module: "api.reviews.admin",
        traceId: input.traceId,
        resourceType: "human_review",
        applicationId: record.humanReview.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: null,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createReviewAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "review.admin-read",
      module: "api.reviews.admin",
      traceId,
      schemaVersion: "review-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/reviews/admin",
        applicationId: query.applicationId,
        humanReviewWorkflowId: query.humanReviewWorkflowId,
        adverseActionReviewId: query.adverseActionReviewId,
        transitionId: query.transitionId,
        tenantId: query.tenantId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "review.admin-read",
      module: "api.reviews.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (!runtimeGuard.allowed || !access.allowed || scopeRequired(query)) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Review admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.admin",
        metadata: {
          route: "/api/reviews/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for review admin reads or is missing governed tenant scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "review.admin-read",
      module: "api.reviews.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "review-admin-read-api-v0.1.0",
          "src/app/api/reviews/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "review-workflows-v0.1.0",
          "src/db/schema/reviewWorkflows.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "review-transition-controls-v0.1.0",
          "src/db/schema/reviewTransitionControls.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "review-admin-read-runtime-v0.1.0",
          "src/lib/reviews/reviewAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getReviewAdminScopeRecord({
      humanReviewWorkflowId: query.humanReviewWorkflowId,
      adverseActionReviewId: query.adverseActionReviewId,
      transitionId: query.transitionId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "review.admin-read",
          module: "api.reviews.admin",
          traceId,
          resourceType: "human_review",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: null,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Review admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.admin",
        metadata: {
          route: "/api/reviews/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this review record.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess: requestedRecordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const records = await listReviewAdminRecords({
      humanReviewWorkflowId: query.humanReviewWorkflowId,
      adverseActionReviewId: query.adverseActionReviewId,
      transitionId: query.transitionId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      status: query.status,
      adverseActionStatus: query.adverseActionStatus,
      transitionStatus: query.transitionStatus,
      limit: query.limit,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
      includeAdverseActionReviews: query.includeAdverseActionReviews,
      includeTransitions: query.includeTransitions,
    });
    const recordAccess = await evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter((decision) => !decision.allowed);

    if (deniedRecordAccess.length > 0) {
      const observability = createObservabilityEvent({
        eventType: "REVIEW_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Review admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reviews.admin",
        metadata: {
          route: "/api/reviews/admin",
          deniedCount: deniedRecordAccess.length,
          access,
          deniedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reviews/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for one or more review records.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const reviewRecords = records.map((record) => ({
      humanReview: humanReviewResponse(record),
      adverseActionReviews: adverseActionReviewResponse(record),
      transitions: transitionResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: reviewRecords.length,
        query: {
          humanReviewWorkflowId: query.humanReviewWorkflowId,
          adverseActionReviewId: query.adverseActionReviewId,
          transitionId: query.transitionId,
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          status: query.status,
          adverseActionStatus: query.adverseActionStatus,
          transitionStatus: query.transitionStatus,
        },
        reviews: reviewRecords,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-reviews-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-review-admin-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-review-data",
          "not-borrower-disclosable-without-approved-notice-context",
          "requires-governed-dashboard-access",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-borrower-disclosure",
          "redact-reviewer-authority-metadata-before-public-disclosure",
          "redact-property-address-before-non-authorized-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "REVIEW_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Review records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.reviews.admin",
      metadata: {
        route: "/api/reviews/admin",
        rowCount: reviewRecords.length,
        applicationId: query.applicationId,
        humanReviewWorkflowId: query.humanReviewWorkflowId,
        tenantId: query.tenantId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "review_admin_read",
          resourceId:
            query.humanReviewWorkflowId ??
            query.adverseActionReviewId ??
            query.transitionId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reviews/admin",
            rowCount: reviewRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "review_admin_read",
        targetId:
          query.humanReviewWorkflowId ??
          query.adverseActionReviewId ??
          query.transitionId ??
          query.applicationId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "review-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: reviewRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: reviewRecords.length,
          humanReviewWorkflowId: query.humanReviewWorkflowId,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
        },
        metadata: {
          route: "/api/reviews/admin",
          operation: "review.admin-read",
        },
      },
      metadata: {
        route: "/api/reviews/admin",
        operation: "review.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: reviewRecords.length,
      reviews: reviewRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess: {
          evaluated: recordAccess.length,
          denied: deniedRecordAccess.length,
          requested: requestedRecordAccess,
          decisions: recordAccess,
        },
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "REVIEW_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Review admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.reviews.admin",
      metadata: {
        route: "/api/reviews/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown review admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/reviews/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown review admin read error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 }
    );
  }
}
