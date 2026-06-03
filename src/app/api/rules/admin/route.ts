import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  RuleOverlayAdminRecord,
  getRuleOverlayAdminScopeRecord,
  listRuleOverlayAdminRecords,
} from "@/lib/rules/ruleOverlayAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Rule and Overlay Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Preserves constitutional rule and overlay authority for reads.
 * - Vol II: Protects eligibility, fair-lending, source-reliance,
 *   adverse-action, and human-review boundaries.
 * - Vol III: Provides replay-safe rule evaluation inspection before
 *   dashboards consume rule or overlay state.
 * - Vol IV: Supports operator review, escalation, amendment review,
 *   exception handling, and audit preparation.
 * - Vol V: Enforces rule versioning, overlay precedence, explainability,
 *   classification, observability, replayability, and evidence doctrine.
 */

type RuleOverlayAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  evaluationId?: string | null;
  operation?: string | null;
  subjectId?: string | null;
  actorId?: string | null;
  resultStatus?: string | null;
  finalEffect?: string | null;
  advisoryOnly?: boolean | null;
  humanReviewRequired?: boolean | null;
  limit: number;
  includeRules: boolean;
  includeOverlays: boolean;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createRuleOverlayAdminTraceId(): string {
  return `rule-overlay-admin-read-${Date.now()}-${Math.random()
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

function normalizeOptionalBoolean(value: string | null): boolean | null {
  if (value === null) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): RuleOverlayAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    evaluationId: normalizeText(params.get("evaluationId")),
    operation: normalizeText(params.get("operation")),
    subjectId: normalizeText(params.get("subjectId")),
    actorId: normalizeText(params.get("actorId")),
    resultStatus: normalizeText(params.get("resultStatus")),
    finalEffect: normalizeText(params.get("finalEffect")),
    advisoryOnly: normalizeOptionalBoolean(params.get("advisoryOnly")),
    humanReviewRequired: normalizeOptionalBoolean(
      params.get("humanReviewRequired")
    ),
    limit: normalizeLimit(params.get("limit")),
    includeRules: normalizeBoolean(params.get("includeRules"), true),
    includeOverlays: normalizeBoolean(params.get("includeOverlays"), true),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: RuleOverlayAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId
  );
}

function ruleEvaluationResponse(record: RuleOverlayAdminRecord) {
  const ruleEvaluation = record.ruleEvaluation;

  return {
    id: ruleEvaluation.id,
    operation: ruleEvaluation.operation,
    subjectId: ruleEvaluation.subjectId,
    applicationId: ruleEvaluation.applicationId,
    borrowerId: ruleEvaluation.borrowerId,
    tenantId: ruleEvaluation.tenantId,
    actorId: ruleEvaluation.actorId,
    ruleIds: ruleEvaluation.ruleIds,
    overlayIds: ruleEvaluation.overlayIds,
    appliedOverlayId: ruleEvaluation.appliedOverlayId,
    finalEffect: ruleEvaluation.finalEffect,
    resultStatus: ruleEvaluation.resultStatus,
    advisoryOnly: ruleEvaluation.advisoryOnly,
    humanReviewRequired: ruleEvaluation.humanReviewRequired,
    inputSnapshot: ruleEvaluation.inputSnapshot,
    evaluationResult: ruleEvaluation.evaluationResult,
    governanceVersion: ruleEvaluation.governanceVersion,
    classification: ruleEvaluation.classification,
    replayRef: ruleEvaluation.replayRef,
    traceId: ruleEvaluation.traceId,
    source: ruleEvaluation.source,
    metadata: ruleEvaluation.metadata,
    evaluatedAt: ruleEvaluation.evaluatedAt,
    createdAt: ruleEvaluation.createdAt,
    updatedAt: ruleEvaluation.updatedAt,
  };
}

function rulesResponse(record: RuleOverlayAdminRecord) {
  return record.rules.map((rule) => ({
    id: rule.id,
    ruleName: rule.ruleName,
    ruleDomain: rule.ruleDomain,
    ruleType: rule.ruleType,
    ruleVersion: rule.ruleVersion,
    status: rule.status,
    authorityLevel: rule.authorityLevel,
    decisionUse: rule.decisionUse,
    humanReviewRequired: rule.humanReviewRequired,
    governanceVersion: rule.governanceVersion,
    classification: rule.classification,
    replayRef: rule.replayRef,
    source: rule.source,
    metadata: rule.metadata,
    effectiveAt: rule.effectiveAt,
    supersededAt: rule.supersededAt,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }));
}

function overlaysResponse(record: RuleOverlayAdminRecord) {
  return record.overlays.map((overlay) => ({
    id: overlay.id,
    overlayName: overlay.overlayName,
    overlayTier: overlay.overlayTier,
    overlayScope: overlay.overlayScope,
    effect: overlay.effect,
    priority: overlay.priority,
    overlayVersion: overlay.overlayVersion,
    status: overlay.status,
    ruleId: overlay.ruleId,
    authorityLevel: overlay.authorityLevel,
    rationale: overlay.rationale,
    governanceVersion: overlay.governanceVersion,
    classification: overlay.classification,
    replayRef: overlay.replayRef,
    source: overlay.source,
    metadata: overlay.metadata,
    effectiveAt: overlay.effectiveAt,
    supersededAt: overlay.supersededAt,
    createdAt: overlay.createdAt,
    updatedAt: overlay.updatedAt,
  }));
}

function applicationResponse(record: RuleOverlayAdminRecord) {
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

function propertyResponse(record: RuleOverlayAdminRecord) {
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
  records: RuleOverlayAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: RuleOverlayAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "rules.admin-read",
        module: "api.rules.admin",
        traceId: input.traceId,
        resourceType: "rule_evaluation",
        applicationId: record.ruleEvaluation.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: input.query.userId,
      })
    );
  }

  return decisions;
}

async function deniedResponse(input: {
  status: number;
  traceId: string;
  actor: string | null;
  runtimeGuard: ReturnType<typeof runRuntimeGuard>;
  access?: ReturnType<typeof evaluateAccess> | null;
  eventType: string;
  message: string;
  error: string;
  metadata?: Record<string, unknown>;
}) {
  const observability = createObservabilityEvent({
    eventType: input.eventType,
    domain: "security",
    severity: "WARN",
    message: input.message,
    traceId: input.traceId,
    replayRef: input.traceId,
    actorId: input.actor,
    module: "api.rules.admin",
    metadata: {
      route: "/api/rules/admin",
      runtimeAllowed: input.runtimeGuard.allowed,
      accessAllowed: input.access?.allowed ?? null,
      ...(input.metadata ?? {}),
    },
  });

  const evidence = await persistGovernanceEvidence({
    traceId: input.traceId,
    replayRef: input.traceId,
    observability,
    metadata: {
      route: "/api/rules/admin",
      accessDenied: true,
      access: input.access ?? null,
      ...(input.metadata ?? {}),
    },
  });

  return NextResponse.json(
    {
      ok: false,
      error: input.error,
      governance: {
        traceId: input.traceId,
        runtimeGuard: input.runtimeGuard,
        access: input.access ?? null,
        observability,
        evidence,
      },
    },
    { status: input.status }
  );
}

export async function GET(req: NextRequest) {
  const traceId = createRuleOverlayAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "rules.admin-read",
      module: "api.rules.admin",
      traceId,
      schemaVersion: "rule-overlay-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/rules/admin",
        evaluationId: query.evaluationId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        advisoryReadOnly: true,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "rules.admin-read",
      module: "api.rules.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "RULE_OVERLAY_ADMIN_READ_ACCESS_DENIED",
        message:
          "Rule and overlay admin read was denied by runtime, role, or scope controls.",
        error:
          "Role is not authorized for rule and overlay admin reads or is missing governed scope.",
        metadata: {
          scopeRequired: scopeRequired({ ...query, role: access.role }),
          evaluationId: query.evaluationId,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
        },
      });
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "rules.admin-read",
      module: "api.rules.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "rule-overlay-admin-read-api-v0.1.0",
          "src/app/api/rules/admin/route.ts",
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
          "Master Volume Series v2026-05-24",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "rule-overlay-admin-read-runtime-v0.1.0",
          "src/lib/rules/ruleOverlayAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getRuleOverlayAdminScopeRecord({
      evaluationId: query.evaluationId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "rules.admin-read",
          module: "api.rules.admin",
          traceId,
          resourceType: "rule_evaluation",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "RULE_OVERLAY_ADMIN_READ_RECORD_ACCESS_DENIED",
        message:
          "Rule and overlay admin read was denied by record-level access control.",
        error: "Actor is not authorized for this rule evaluation record.",
        metadata: {
          requestedRecordAccess,
        },
      });
    }

    const records = await listRuleOverlayAdminRecords({
      evaluationId: query.evaluationId,
      operation: query.operation,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      subjectId: query.subjectId,
      actorId: query.actorId,
      resultStatus: query.resultStatus,
      finalEffect: query.finalEffect,
      advisoryOnly: query.advisoryOnly,
      humanReviewRequired: query.humanReviewRequired,
      limit: query.limit,
      includeRules: query.includeRules,
      includeOverlays: query.includeOverlays,
      includeApplication: query.includeApplication,
      includeProperty: query.includeProperty,
    });
    const recordAccess = await evaluateRecordAccessForRecords({
      records,
      access,
      query,
      traceId,
    });
    const deniedRecordAccess = recordAccess.filter(
      (decision) => !decision.allowed
    );

    if (deniedRecordAccess.length > 0) {
      return deniedResponse({
        status: 403,
        traceId,
        actor,
        runtimeGuard,
        access,
        eventType: "RULE_OVERLAY_ADMIN_READ_RECORD_ACCESS_DENIED",
        message:
          "Rule and overlay admin read was denied by record-level access control.",
        error:
          "Actor is not authorized for one or more rule evaluation records.",
        metadata: {
          deniedCount: deniedRecordAccess.length,
          deniedRecordAccess,
        },
      });
    }

    const ruleRecords = records.map((record) => ({
      ruleEvaluation: ruleEvaluationResponse(record),
      rules: rulesResponse(record),
      overlays: overlaysResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: ruleRecords.length,
        query,
        ruleRecords,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "regulatory",
        classificationSource: "api-rule-overlay-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "regulated-rule-review",
          "overlay-resolution-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-a-final-eligibility-decision",
          "not-an-adverse-action-notice",
          "requires-human-review-before-regulatory-reliance",
          "requires-governed-dashboard-access",
        ],
        redactionRequirements: [
          "redact-borrower-application-and-rule-context-before-public-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "RULE_OVERLAY_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Rule and overlay evaluations were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.rules.admin",
      metadata: {
        route: "/api/rules/admin",
        rowCount: ruleRecords.length,
        evaluationId: query.evaluationId,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        advisoryOnly: true,
        humanReviewRequired: true,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "rule_overlay_admin_read",
          resourceId:
            query.evaluationId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/rules/admin",
            rowCount: ruleRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "rule_overlay_admin_read",
        targetId:
          query.evaluationId ??
          query.applicationId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "rule-overlay-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: ruleRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: ruleRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          advisoryOnly: true,
          humanReviewRequired: true,
        },
        metadata: {
          route: "/api/rules/admin",
          operation: "rules.admin-read",
        },
      },
      metadata: {
        route: "/api/rules/admin",
        operation: "rules.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: ruleRecords.length,
      ruleRecords,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        classification: classifiedOutput.classification,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "RULE_OVERLAY_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Rule and overlay admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.rules.admin",
      metadata: {
        route: "/api/rules/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown rule and overlay admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/rules/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown rule and overlay admin read error.",
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
