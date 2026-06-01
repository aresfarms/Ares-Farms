import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistRuleOverlayEvaluation } from "@/lib/rules/ruleOverlayRegistryStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Rule and Overlay Evaluation API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces constitutional rule hierarchy and overlay supremacy.
 *
 * - Vol II: Regulatory Governance
 *   Keeps eligibility, fair-lending, adverse-action, and human-review
 *   boundaries governed before regulated reliance.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe rule and overlay evaluation state with deterministic
 *   version, classification, observability, and replay evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports operator review, escalation, exception handling, amendment review,
 *   and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces rule versioning, overlay precedence, explainability,
 *   classification, replayability, source authority, and evidence preservation.
 */

type RuleEvaluationRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  subjectId?: string | null;
  operation?: string | null;
  role?: string | null;
  ruleIds?: string[];
  overlayIds?: string[];
  facts?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

function createRuleTraceId(): string {
  return `rule-overlay-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: RuleEvaluationRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: RuleEvaluationRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function operationName(body: RuleEvaluationRequest): string {
  return body.operation ?? "regulated-rule-overlay-review";
}

export async function POST(req: NextRequest) {
  const traceId = createRuleTraceId();

  try {
    const body = (await req.json()) as RuleEvaluationRequest;
    const actor = actorId(body);
    const operation = operationName(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "rules.evaluate",
      module: "api.rules.evaluate",
      traceId,
      schemaVersion: "rule-overlay-evaluation-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/rules/evaluate",
        operation,
        applicationId: body.applicationId ?? null,
        advisoryOnly: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RULE_OVERLAY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Rule overlay evaluation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.rules.evaluate",
        metadata: {
          route: "/api/rules/evaluate",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/rules/evaluate",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked rule overlay evaluation.",
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
        "user",
        "borrower",
        "operator",
        "underwriter",
        "auditor",
        "admin",
        "governance",
      ],
      operation: "rules.evaluate",
      module: "api.rules.evaluate",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RULE_OVERLAY_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Rule overlay evaluation was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.rules.evaluate",
        metadata: {
          route: "/api/rules/evaluate",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/rules/evaluate",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for rule overlay evaluation.",
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
      operation: "rules.evaluate",
      module: "api.rules.evaluate",
      traceId,
      resourceType: "rule_evaluation",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RULE_OVERLAY_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Rule overlay evaluation was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.rules.evaluate",
        metadata: {
          route: "/api/rules/evaluate",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/rules/evaluate",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this application rule record.",
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
      operation: "rules.evaluate",
      module: "api.rules.evaluate",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "rule-overlay-evaluation-v0.1.0",
          "src/app/api/rules/evaluate/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "rule-overlay-registry-v0.1.0",
          "src/db/schema/ruleOverlayRegistry.ts",
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
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "rule-overlay-registry-runtime-v0.1.0",
          "src/lib/rules/ruleOverlayRegistryStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "overlay",
          "overlay-resolution-runtime-v0.1.0",
          "src/lib/runtime/overlayRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(
      {
        operation,
        applicationId: body.applicationId ?? null,
        borrowerId: body.borrowerId ?? null,
        tenantId: body.tenantId ?? null,
        ruleIds: body.ruleIds ?? [],
        overlayIds: body.overlayIds ?? [],
        facts: body.facts ?? {},
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-rules-evaluate-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "regulated-rule-review",
          "overlay-resolution-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "advisory-governance-record-only",
          "not-a-final-eligibility-decision",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-application-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const evaluation = await persistRuleOverlayEvaluation({
      traceId,
      operation,
      subjectId: body.subjectId,
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId: actor,
      requestedRuleIds: body.ruleIds,
      requestedOverlayIds: body.overlayIds,
      facts: body.facts ?? {},
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        ruleEvaluationId: evaluation.ruleEvaluation.id,
        resultStatus: evaluation.ruleEvaluation.resultStatus,
        finalEffect: evaluation.ruleEvaluation.finalEffect,
        advisoryOnly: evaluation.ruleEvaluation.advisoryOnly,
        humanReviewRequired: evaluation.ruleEvaluation.humanReviewRequired,
        appliedOverlayId: evaluation.ruleEvaluation.appliedOverlayId,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-rules-evaluate-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "regulated-rule-review",
          "overlay-resolution-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-final-eligibility-decision",
          "not-an-adverse-action-notice",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-borrower-and-application-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(evaluation.ruleEvaluation.id),
      outputType: "rule_overlay_evaluation",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Rule and overlay evaluation was recorded as advisory governance output with human review required.",
      ruleVersion: "rule-overlay-registry-runtime-v0.1.0",
      overlayRefs: evaluation.overlays.map((overlay) => overlay.id),
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: evaluation.rules.map((rule) => ({
        refId: rule.id,
        sourceType: "rule",
        sourceName: rule.ruleName,
        sourceVersion: rule.ruleVersion,
        replayRef: traceId,
      })),
      metadata: {
        ruleEvaluationId: evaluation.ruleEvaluation.id,
        finalEffect: evaluation.ruleEvaluation.finalEffect,
        resultStatus: evaluation.ruleEvaluation.resultStatus,
        advisoryOnly: evaluation.ruleEvaluation.advisoryOnly,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "RULE_OVERLAY_EVALUATION_RECORDED",
      domain: "overlay",
      severity: "INFO",
      message:
        "Rule and overlay evaluation was persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.rules.evaluate",
      metadata: {
        ruleEvaluationId: evaluation.ruleEvaluation.id,
        resultStatus: evaluation.ruleEvaluation.resultStatus,
        finalEffect: evaluation.ruleEvaluation.finalEffect,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "rule_overlay_input",
          resourceId: String(evaluation.ruleEvaluation.id),
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/rules/evaluate",
            stage: "input",
          },
        },
        {
          resourceType: "rule_overlay_output",
          resourceId: String(evaluation.ruleEvaluation.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/rules/evaluate",
            stage: "output",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "rule_overlay_evaluation",
        targetId: String(evaluation.ruleEvaluation.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "rule-overlay-evaluation-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          ruleEvaluationId: evaluation.ruleEvaluation.id,
          resultStatus: evaluation.ruleEvaluation.resultStatus,
          finalEffect: evaluation.ruleEvaluation.finalEffect,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/rules/evaluate",
          operation: "rules.evaluate",
        },
      },
      metadata: {
        route: "/api/rules/evaluate",
        operation: "rules.evaluate",
      },
    });

    return NextResponse.json({
      ok: true,
      ruleEvaluation: evaluation.ruleEvaluation,
      rules: evaluation.rules,
      overlays: evaluation.overlays,
      evaluation: evaluation.evaluation,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
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
      eventType: "RULE_OVERLAY_EVALUATION_ERROR",
      domain: "overlay",
      severity: "ERROR",
      message: "Rule overlay evaluation encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.rules.evaluate",
      metadata: {
        route: "/api/rules/evaluate",
        error:
          error instanceof Error
            ? error.message
            : "Unknown rule overlay evaluation error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/rules/evaluate",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown rule overlay evaluation error.",
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
