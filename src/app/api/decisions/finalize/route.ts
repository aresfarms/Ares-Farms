import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistRegulatedDecisionNotice } from "@/lib/decisions/regulatedDecisionNoticeStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Regulated Decision Finalization API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Requires accountable authority before any final regulated action.
 *
 * - Vol II: Regulatory Governance
 *   Preserves adverse-action, appeal, disclosure, borrower explanation,
 *   fair-lending, and official-notice boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe final-action control state and deterministic gate
 *   results before any official decision or notice can be issued.
 *
 * - Vol IV: Operational Runbooks
 *   Supports escalation, notice preparation, dispute handling, recovery,
 *   and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replayability,
 *   version lineage, controlled disclosure, and evidence preservation.
 */

type FinalizeDecisionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  role?: string | null;
  humanReviewWorkflowId?: string | null;
  adverseActionReviewId?: string | null;
  decisionType?: string | null;
  requestedOutcome?: string | null;
  finalActionRequested?: boolean | null;
  disclosureStatus?: string | null;
  appealRightsIncluded?: boolean | null;
  reasonCodes?: string[];
  explanationSummary?: string | null;
  noticeSummary?: string | null;
  metadata?: Record<string, unknown>;
};

function createDecisionFinalizeTraceId(): string {
  return `decision-finalize-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: FinalizeDecisionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: FinalizeDecisionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function decisionNoticeResponse(
  decisionNotice: Awaited<
    ReturnType<typeof persistRegulatedDecisionNotice>
  >["decisionNotice"]
) {
  return {
    id: decisionNotice.id,
    applicationId: decisionNotice.applicationId,
    borrowerId: decisionNotice.borrowerId,
    tenantId: decisionNotice.tenantId,
    humanReviewWorkflowId: decisionNotice.humanReviewWorkflowId,
    adverseActionReviewId: decisionNotice.adverseActionReviewId,
    decisionType: decisionNotice.decisionType,
    requestedOutcome: decisionNotice.requestedOutcome,
    finalDecisionStatus: decisionNotice.finalDecisionStatus,
    noticeStatus: decisionNotice.noticeStatus,
    disclosureStatus: decisionNotice.disclosureStatus,
    appealStatus: decisionNotice.appealStatus,
    reasonCodes: decisionNotice.reasonCodes,
    finalActionRequested: decisionNotice.finalActionRequested,
    finalActionAllowed: decisionNotice.finalActionAllowed,
    finalNoticeAllowed: decisionNotice.finalNoticeAllowed,
    borrowerDisclosureAllowed: decisionNotice.borrowerDisclosureAllowed,
    humanReviewRequired: decisionNotice.humanReviewRequired,
    adverseActionRequired: decisionNotice.adverseActionRequired,
    appealRightsIncluded: decisionNotice.appealRightsIncluded,
    effectiveAt: decisionNotice.effectiveAt,
    issuedAt: decisionNotice.issuedAt,
    createdAt: decisionNotice.createdAt,
    updatedAt: decisionNotice.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createDecisionFinalizeTraceId();

  try {
    const body = (await req.json()) as FinalizeDecisionRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "regulated-decision.finalize",
      module: "api.decisions.finalize",
      traceId,
      schemaVersion: "regulated-decision-notices-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/decisions/finalize",
        applicationId: body.applicationId ?? null,
        requestedOutcome: body.requestedOutcome ?? null,
        finalActionRequested: body.finalActionRequested ?? true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REGULATED_DECISION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Regulated decision finalization was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.decisions.finalize",
        metadata: {
          route: "/api/decisions/finalize",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/decisions/finalize",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked regulated decision finalization.",
          governance: {
            traceId,
            runtimeGuard,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const access = evaluateAccess({
      role: routeActorRole(body),
      allowedRoles: [
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "regulated-decision.finalize",
      module: "api.decisions.finalize",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REGULATED_DECISION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Regulated decision finalization was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.decisions.finalize",
        metadata: {
          route: "/api/decisions/finalize",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/decisions/finalize",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for regulated decision finalization.",
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

    const recordAccess = await evaluateApplicationRecordAccess({
      access,
      operation: "regulated-decision.finalize",
      module: "api.decisions.finalize",
      traceId,
      resourceType: "regulated_decision_notice",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REGULATED_DECISION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Regulated decision finalization was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.decisions.finalize",
        metadata: {
          route: "/api/decisions/finalize",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/decisions/finalize",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this regulated decision record.",
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

    const versionRuntime = evaluateVersionRuntime({
      operation: "regulated-decision.finalize",
      module: "api.decisions.finalize",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "regulated-decision-finalize-api-v0.1.0",
          "src/app/api/decisions/finalize/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "regulated-decision-notices-v0.1.0",
          "src/db/schema/regulatedDecisionNotices.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "review-workflows-v0.1.0",
          "src/db/schema/reviewWorkflows.ts",
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
          "regulated-decision-notice-runtime-v0.1.0",
          "src/lib/decisions/regulatedDecisionNoticeStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        humanReviewWorkflowId: body.humanReviewWorkflowId ?? null,
        adverseActionReviewId: body.adverseActionReviewId ?? null,
        decisionType: body.decisionType ?? null,
        requestedOutcome: body.requestedOutcome ?? null,
        finalActionRequested: body.finalActionRequested ?? true,
        disclosureStatus: body.disclosureStatus ?? null,
        appealRightsIncluded: body.appealRightsIncluded ?? false,
        reasonCodes: body.reasonCodes ?? [],
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-decisions-finalize-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "regulated-final-action-review",
          "adverse-action-notice-control",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "not-borrower-disclosable-unless-final-notice-allowed",
          "requires-human-review-before-final-action",
          "requires-appeal-and-disclosure-controls-before-notice",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const regulatedDecision = await persistRegulatedDecisionNotice({
      traceId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      humanReviewWorkflowId: body.humanReviewWorkflowId,
      adverseActionReviewId: body.adverseActionReviewId,
      decisionType: body.decisionType,
      requestedOutcome: body.requestedOutcome,
      finalActionRequested: body.finalActionRequested,
      disclosureStatus: body.disclosureStatus,
      appealRightsIncluded: body.appealRightsIncluded,
      reasonCodes: body.reasonCodes,
      explanationSummary: body.explanationSummary,
      noticeSummary: body.noticeSummary,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        decisionNoticeId: regulatedDecision.decisionNotice.id,
        applicationId: regulatedDecision.decisionNotice.applicationId,
        finalDecisionStatus:
          regulatedDecision.decisionNotice.finalDecisionStatus,
        noticeStatus: regulatedDecision.decisionNotice.noticeStatus,
        finalActionAllowed: regulatedDecision.finalActionAllowed,
        finalNoticeAllowed: regulatedDecision.finalNoticeAllowed,
        borrowerDisclosureAllowed:
          regulatedDecision.decisionNotice.borrowerDisclosureAllowed,
        gates: regulatedDecision.gates,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-decisions-finalize-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "regulated-final-action-review",
          "adverse-action-notice-control",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-borrower-disclosable-unless-borrower-disclosure-allowed",
          "blocked-record-is-not-a-final-credit-decision",
          "blocked-record-is-not-an-adverse-action-notice",
        ],
        redactionRequirements: [
          "redact-internal-review-metadata-before-borrower-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(regulatedDecision.decisionNotice.id),
      outputType: "regulated_decision_notice_control",
      audience: "governance",
      claimType: "fact",
      summary:
        "Final regulated decision and notice controls were evaluated against human-review, adverse-action, appeal, disclosure, and reason-code gates.",
      ruleVersion: "regulated-decision-notice-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: !regulatedDecision.gates.humanReviewApproved,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: regulatedDecision.decisionNotice.applicationId,
          sourceType: "human_review",
          sourceName: "regulated-decision-finalization-control",
          sourceVersion: "regulated-decision-notice-runtime-v0.1.0",
          replayRef: traceId,
        },
      ],
      metadata: {
        decisionNoticeId: regulatedDecision.decisionNotice.id,
        finalActionAllowed: regulatedDecision.finalActionAllowed,
        finalNoticeAllowed: regulatedDecision.finalNoticeAllowed,
        gates: regulatedDecision.gates,
      },
    });

    const observability = createObservabilityEvent({
      eventType: regulatedDecision.finalActionAllowed
        ? "REGULATED_DECISION_FINAL_ACTION_ALLOWED"
        : "REGULATED_DECISION_FINAL_ACTION_BLOCKED",
      domain: "operations",
      severity: regulatedDecision.finalActionAllowed ? "INFO" : "WARN",
      message: regulatedDecision.finalActionAllowed
        ? "Regulated decision final-action gates passed."
        : "Regulated decision final-action gates blocked official decision or notice.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.decisions.finalize",
      metadata: {
        decisionNoticeId: regulatedDecision.decisionNotice.id,
        applicationId: regulatedDecision.decisionNotice.applicationId,
        finalDecisionStatus:
          regulatedDecision.decisionNotice.finalDecisionStatus,
        noticeStatus: regulatedDecision.decisionNotice.noticeStatus,
        finalActionAllowed: regulatedDecision.finalActionAllowed,
        finalNoticeAllowed: regulatedDecision.finalNoticeAllowed,
        gates: regulatedDecision.gates,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "regulated_decision_notice_input",
          resourceId: body.applicationId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/decisions/finalize",
            stage: "input",
          },
        },
        {
          resourceType: "regulated_decision_notice_output",
          resourceId: String(regulatedDecision.decisionNotice.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/decisions/finalize",
            stage: "output",
            applicationId: regulatedDecision.decisionNotice.applicationId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "regulated_decision_notice",
        targetId: String(regulatedDecision.decisionNotice.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "regulated-decision-finalize-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          decisionNoticeId: regulatedDecision.decisionNotice.id,
          finalActionAllowed: regulatedDecision.finalActionAllowed,
          finalNoticeAllowed: regulatedDecision.finalNoticeAllowed,
          finalDecisionStatus:
            regulatedDecision.decisionNotice.finalDecisionStatus,
          noticeStatus: regulatedDecision.decisionNotice.noticeStatus,
          gates: regulatedDecision.gates,
        },
        metadata: {
          route: "/api/decisions/finalize",
          operation: "regulated-decision.finalize",
        },
      },
      metadata: {
        route: "/api/decisions/finalize",
        operation: "regulated-decision.finalize",
      },
    });

    return NextResponse.json({
      ok: true,
      decisionNotice: decisionNoticeResponse(
        regulatedDecision.decisionNotice
      ),
      result: {
        finalActionAllowed: regulatedDecision.finalActionAllowed,
        finalNoticeAllowed: regulatedDecision.finalNoticeAllowed,
        finalDecisionStatus:
          regulatedDecision.decisionNotice.finalDecisionStatus,
        noticeStatus: regulatedDecision.decisionNotice.noticeStatus,
        borrowerDisclosureAllowed:
          regulatedDecision.decisionNotice.borrowerDisclosureAllowed,
        gates: regulatedDecision.gates,
        message: regulatedDecision.finalActionAllowed
          ? "Final regulated decision gates passed. Notice issuance still depends on controlled delivery workflow."
          : "Final regulated decision or notice is blocked. This record is not a final credit decision and is not an adverse-action notice.",
      },
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "REGULATED_DECISION_FINALIZE_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Regulated decision finalization encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.decisions.finalize",
      metadata: {
        route: "/api/decisions/finalize",
        error:
          error instanceof Error
            ? error.message
            : "Unknown regulated decision finalization error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/decisions/finalize",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown regulated decision finalization error.",
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
