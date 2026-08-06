import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  AuditLedgerAdminRecords,
  listAuditLedgerAdminRecords,
} from "@/lib/ledger/auditLedgerAdminStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Audit/Ledger Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for audit and ledger inspection.
 *
 * - Vol II: Protects regulated audit evidence from uncontrolled disclosure,
 *   broad exports, or non-authorized operational inspection.
 *
 * - Vol III: Provides deterministic, replay-safe read access across audit
 *   events, canonical ledger projections, and canonical ledger metadata.
 *
 * - Vol IV: Supports examination preparation, incident review, repair
 *   planning, rollback analysis, and operational evidence preservation.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, source authority, controlled disclosure, and export governance.
 */

type LedgerAdminQuery = {
  role: string;
  userId?: string | null;
  eventId?: string | null;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  eventHash?: string | null;
  source?: string | null;
  classification?: string | null;
  traceId?: string | null;
  moduleId?: string | null;
  anonymousId?: string | null;
  actorRef?: string | null;
  from?: Date | null;
  to?: Date | null;
  limit: number;
  includeCanonicalLedger: boolean;
  includeCanonicalMeta: boolean;
  includeReplay: boolean;
  includeObservability: boolean;
};

function createLedgerAdminTraceId(): string {
  return `ledger-admin-read-${Date.now()}-${Math.random()
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

function normalizeDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 25);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

function parseQuery(req: NextRequest): LedgerAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    eventId: normalizeText(params.get("eventId")),
    eventType: normalizeText(params.get("eventType")),
    entityType: normalizeText(params.get("entityType")),
    entityId: normalizeText(params.get("entityId")),
    eventHash: normalizeText(params.get("eventHash")),
    source: normalizeText(params.get("source")),
    classification: normalizeText(params.get("classification")),
    traceId: normalizeText(params.get("traceId")),
    moduleId: normalizeText(params.get("moduleId")),
    anonymousId: normalizeText(params.get("anonymousId")),
    actorRef: normalizeText(params.get("actorRef")),
    from: normalizeDate(params.get("from")),
    to: normalizeDate(params.get("to")),
    limit: normalizeLimit(params.get("limit")),
    includeCanonicalLedger: normalizeBoolean(
      params.get("includeCanonicalLedger"),
      false,
    ),
    includeCanonicalMeta: normalizeBoolean(
      params.get("includeCanonicalMeta"),
      true,
    ),
    includeReplay: normalizeBoolean(params.get("includeReplay"), true),
    includeObservability: normalizeBoolean(
      params.get("includeObservability"),
      true,
    ),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function hasBoundedLedgerScope(query: LedgerAdminQuery): boolean {
  return Boolean(
    query.eventId ||
    query.entityId ||
    query.eventHash ||
    query.source ||
    query.eventType ||
    query.entityType ||
    query.classification ||
    query.traceId ||
    query.moduleId ||
    query.anonymousId ||
    query.actorRef ||
    query.from ||
    query.to,
  );
}

function scopeRequired(query: LedgerAdminQuery): boolean {
  return !(privilegedRole(query.role) || hasBoundedLedgerScope(query));
}

function auditEventResponse(
  record: AuditLedgerAdminRecords["auditEvents"][number],
) {
  return {
    id: record.id,
    userId: record.userId,
    eventType: record.eventType,
    entityType: record.entityType,
    entityId: record.entityId,
    decision: record.decision,
    compositeScore: record.compositeScore,
    riskScore: record.riskScore,
    input: record.input,
    output: record.output,
    trace: record.trace,
    payload: record.payload,
    prevHash: record.prevHash,
    eventHash: record.eventHash,
    hash: record.hash,
    classification: record.classification,
    source: record.source,
    createdAt: record.createdAt,
  };
}

function canonicalLedgerResponse(
  record: AuditLedgerAdminRecords["canonicalLedgerRows"][number],
) {
  return {
    id: record.id,
    sequence: record.sequence,
    userId: record.userId,
    eventType: record.eventType,
    entityType: record.entityType,
    entityId: record.entityId,
    decision: record.decision,
    compositeScore: record.compositeScore,
    riskScore: record.riskScore,
    input: record.input,
    output: record.output,
    trace: record.trace,
    payload: record.payload,
    prevHash: record.prevHash,
    eventHash: record.eventHash,
    version: record.version,
    classification: record.classification,
    createdAt: record.createdAt,
  };
}

function canonicalMetaResponse(
  record: AuditLedgerAdminRecords["canonicalMeta"][number],
) {
  return {
    id: record.id,
    activeVersion: record.activeVersion,
    lastBuiltAt: record.lastBuiltAt,
    lastHash: record.lastHash,
    status: record.status,
    activeLedgerVersion: record.activeLedgerVersion,
    previousLedgerVersion: record.previousLedgerVersion,
    promotionStatus: record.promotionStatus,
    sourceTable: record.sourceTable,
    targetTable: record.targetTable,
    promotionTraceId: record.promotionTraceId,
    replayRef: record.replayRef,
    verificationRef: record.verificationRef,
    promotedBy: record.promotedBy,
    replayVerified: record.replayVerified,
    rollbackAvailable: record.rollbackAvailable,
    governanceVersion: record.governanceVersion,
    metadata: record.metadata,
    promotedAt: record.promotedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const traceId = createLedgerAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.admin-read",
      module: "api.ledger.admin",
      traceId,
      schemaVersion: "ledger-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/ledger/admin",
        eventId: query.eventId,
        entityId: query.entityId,
        eventHash: query.eventHash,
        includeCanonicalLedger: query.includeCanonicalLedger,
        includeCanonicalMeta: query.includeCanonicalMeta,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["auditor", "admin", "governance"],
      operation: "ledger.admin-read",
      module: "api.ledger.admin",
      traceId,
      actorId: actor,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      const observability = createObservabilityEvent({
        eventType: "LEDGER_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Ledger admin read was denied by runtime, role, or bounded-scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.ledger.admin",
        metadata: {
          route: "/api/ledger/admin",
          runtimeGuard,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/ledger/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for ledger admin reads or is missing a bounded ledger scope.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            observability,
            evidence,
          },
        },
        { status: 403 },
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.admin-read",
      module: "api.ledger.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ledger-admin-read-api-v0.1.0",
          "src/app/api/ledger/admin/route.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "schema",
          "audit-events-v0.1.0",
          "src/db/schema/auditEvents.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "schema",
          "canonical-ledger-v0.1.0",
          "src/db/schema/canonicalLedger.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "schema",
          "canonical-ledger-meta-v0.1.0",
          "src/db/schema/canonicalLedgerMeta.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId,
        ),
        createRuntimeVersionRef(
          "runtime",
          "ledger-admin-read-runtime-v0.1.0",
          "src/lib/ledger/auditLedgerAdminStore.ts",
          traceId,
        ),
        createRuntimeVersionRef(
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId,
        ),
      ],
    });

    const records = await listAuditLedgerAdminRecords({
      eventId: query.eventId,
      eventType: query.eventType,
      entityType: query.entityType,
      entityId: query.entityId,
      eventHash: query.eventHash,
      source: query.source,
      classification: query.classification,
      traceId: query.traceId,
      moduleId: query.moduleId,
      anonymousId: query.anonymousId,
      from: query.from,
      to: query.to,
      limit: query.limit,
      includeCanonicalLedger: query.includeCanonicalLedger,
      includeCanonicalMeta: query.includeCanonicalMeta,
      includeReplay: query.includeReplay,
      includeObservability: query.includeObservability,
    });

    const responseRecords = {
      auditEvents: records.auditEvents.map(auditEventResponse),
      canonicalLedgerRows: records.canonicalLedgerRows.map(
        canonicalLedgerResponse,
      ),
      canonicalMeta: records.canonicalMeta.map(canonicalMetaResponse),
      replayRows: records.replayRows,
      observabilityRows: records.observabilityRows,
    };
    const totalCount =
      responseRecords.auditEvents.length +
      responseRecords.canonicalLedgerRows.length +
      responseRecords.canonicalMeta.length +
      responseRecords.replayRows.length +
      responseRecords.observabilityRows.length;

    const classifiedOutput = classifyRecord(
      {
        count: totalCount,
        query: {
          eventId: query.eventId,
          eventType: query.eventType,
          entityType: query.entityType,
          entityId: query.entityId,
          eventHash: query.eventHash,
          source: query.source,
          classification: query.classification,
          traceId: query.traceId,
          moduleId: query.moduleId,
          anonymousId: query.anonymousId,
          from: query.from?.toISOString() ?? null,
          to: query.to?.toISOString() ?? null,
          includeCanonicalLedger: query.includeCanonicalLedger,
          includeCanonicalMeta: query.includeCanonicalMeta,
        },
        ...responseRecords,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "regulatory",
        classificationSource: "api-ledger-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["auditor", "regulator", "governance"],
        sharingPermissions: ["regulated-audit-ledger-admin-read"],
        aiUsagePermissions: ["summarize", "classify", "explain"],
        exportRestrictions: [
          "requires-governed-recipient",
          "requires-audit-purpose",
          "requires-redaction-review-before-external-disclosure",
        ],
        redactionRequirements: [
          "redact-unrelated-borrower-or-operator-data-before-external-disclosure",
        ],
        consentRequirements: ["regulatory-or-audit-authority"],
      },
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "audit_ledger_admin_read",
      audience: "auditor",
      claimType: "fact",
      summary:
        "Audit and ledger records were read through governed, bounded-scope admin controls.",
      ruleVersion: "ledger-admin-read-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: false,
      replayRefs: [traceId],
      auditEventRefs: responseRecords.auditEvents
        .map((record) => record.id)
        .filter((id): id is string => Boolean(id)),
      metadata: {
        auditEventCount: responseRecords.auditEvents.length,
        canonicalLedgerCount: responseRecords.canonicalLedgerRows.length,
        canonicalMetaCount: responseRecords.canonicalMeta.length,
        replayCount: responseRecords.replayRows.length,
        observabilityCount: responseRecords.observabilityRows.length,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "LEDGER_ADMIN_READ",
      domain: "ledger",
      severity: "INFO",
      message:
        "Audit and ledger records were read through governed admin controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.ledger.admin",
      metadata: {
        route: "/api/ledger/admin",
        totalCount,
        auditEventCount: responseRecords.auditEvents.length,
        canonicalLedgerCount: responseRecords.canonicalLedgerRows.length,
        canonicalMetaCount: responseRecords.canonicalMeta.length,
        replayCount: responseRecords.replayRows.length,
        observabilityCount: responseRecords.observabilityRows.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "ledger_admin_read",
          resourceId:
            query.eventId ??
            query.entityId ??
            query.eventHash ??
            query.source ??
            query.traceId ??
            query.moduleId ??
            query.anonymousId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/ledger/admin",
            totalCount,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "ledger_admin_read",
        targetId:
          query.eventId ??
          query.entityId ??
          query.eventHash ??
          query.source ??
          query.traceId ??
          query.moduleId ??
          query.anonymousId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "ledger-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: totalCount,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          totalCount,
          auditEventCount: responseRecords.auditEvents.length,
          canonicalLedgerCount: responseRecords.canonicalLedgerRows.length,
          canonicalMetaCount: responseRecords.canonicalMeta.length,
          replayCount: responseRecords.replayRows.length,
          observabilityCount: responseRecords.observabilityRows.length,
        },
        metadata: {
          route: "/api/ledger/admin",
          operation: "ledger.admin-read",
        },
      },
      metadata: {
        route: "/api/ledger/admin",
        operation: "ledger.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: totalCount,
      auditEventCount: responseRecords.auditEvents.length,
      canonicalLedgerCount: responseRecords.canonicalLedgerRows.length,
      canonicalMetaCount: responseRecords.canonicalMeta.length,
      replayCount: responseRecords.replayRows.length,
      observabilityCount: responseRecords.observabilityRows.length,
      auditEvents: responseRecords.auditEvents,
      canonicalLedgerRows: responseRecords.canonicalLedgerRows,
      canonicalMeta: responseRecords.canonicalMeta,
      replayRows: responseRecords.replayRows,
      observabilityRows: responseRecords.observabilityRows,
      output: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        access,
        versionRuntime,
        classification: classifiedOutput.classification,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "LEDGER_ADMIN_READ_ERROR",
      domain: "ledger",
      severity: "ERROR",
      message: "Ledger admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.admin",
      metadata: {
        route: "/api/ledger/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown ledger admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/ledger/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown ledger admin read error.",
        governance: {
          traceId,
          observability,
          evidence,
        },
      },
      { status: 500 },
    );
  }
}
