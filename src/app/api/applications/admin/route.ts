import { NextRequest, NextResponse } from "next/server";

import {
  ApplicationAdminRecord,
  listApplicationAdminRecords,
} from "@/lib/applications/applicationAdminStore";
import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Application Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for application record reads.
 *
 * - Vol II: Protects borrower, application, property, and review posture
 *   records from uncontrolled dashboard or partner disclosure.
 *
 * - Vol III: Provides replay-safe, record-scoped application reads before
 *   borrower, operator, lender, sponsor, or admin modules consume records.
 *
 * - Vol IV: Supports operator/admin monitoring, recovery, escalation,
 *   audit preparation, and dashboard-safe backend access.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type ApplicationAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  decisionStatus?: string | null;
  limit: number;
  includeProperty: boolean;
};

function createApplicationAdminTraceId(): string {
  return `application-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): ApplicationAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: params.get("role") ?? "user",
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    status: normalizeText(params.get("status")),
    reviewStatus: normalizeText(params.get("reviewStatus")),
    decisionStatus: normalizeText(params.get("decisionStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: ApplicationAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function applicationResponse(record: ApplicationAdminRecord) {
  return {
    id: record.application.id,
    userId: record.application.userId,
    borrowerId: record.application.borrowerId,
    tenantId: record.application.tenantId,
    propertyId: record.application.propertyId,
    status: record.application.status,
    reviewStatus: record.application.reviewStatus,
    decisionStatus: record.application.decisionStatus,
    requestedAmount: record.application.requestedAmount,
    requestedPrograms: record.application.requestedPrograms,
    governanceVersion: record.application.governanceVersion,
    classification: record.application.classification,
    replayRef: record.application.replayRef,
    source: record.application.source,
    createdAt: record.application.createdAt,
    updatedAt: record.application.updatedAt,
  };
}

function propertyResponse(record: ApplicationAdminRecord) {
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
    federalRegion: record.property.federalRegion,
    internalRegion: record.property.internalRegion,
    governanceVersion: record.property.governanceVersion,
    classification: record.property.classification,
    replayRef: record.property.replayRef,
    createdAt: record.property.createdAt,
    updatedAt: record.property.updatedAt,
  };
}

async function evaluateRecordAccessForRecords(input: {
  records: ApplicationAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: ApplicationAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "application.admin-read",
        module: "api.applications.admin",
        traceId: input.traceId,
        resourceType: "application",
        applicationId: record.application.id,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: null,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createApplicationAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "application.admin-read",
      module: "api.applications.admin",
      traceId,
      schemaVersion: "application-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/applications/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: [
        "operator",
        "underwriter",
        "auditor",
        "lender",
        "sponsor",
        "admin",
        "governance",
      ],
      operation: "application.admin-read",
      module: "api.applications.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (!runtimeGuard.allowed || !access.allowed || scopeRequired(query)) {
      const observability = createObservabilityEvent({
        eventType: "APPLICATION_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Application admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.applications.admin",
        metadata: {
          route: "/api/applications/admin",
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
          route: "/api/applications/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for application admin reads or is missing governed tenant scope.",
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
      operation: "application.admin-read",
      module: "api.applications.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "application-admin-read-api-v0.1.0",
          "src/app/api/applications/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "applications-v0.1.0",
          "src/db/schema/applications.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "properties-v0.1.0",
          "src/db/schema/index.ts#properties",
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
          "application-admin-read-runtime-v0.1.0",
          "src/lib/applications/applicationAdminStore.ts",
          traceId
        ),
      ],
    });

    const requestedRecordAccess = query.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "application.admin-read",
          module: "api.applications.admin",
          traceId,
          resourceType: "application",
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: null,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "APPLICATION_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Application admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.applications.admin",
        metadata: {
          route: "/api/applications/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/applications/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this application record.",
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

    const records = await listApplicationAdminRecords({
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      userId: null,
      status: query.status,
      reviewStatus: query.reviewStatus,
      decisionStatus: query.decisionStatus,
      limit: query.limit,
      includeProperty: query.includeProperty,
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
        eventType: "APPLICATION_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Application admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.applications.admin",
        metadata: {
          route: "/api/applications/admin",
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
          route: "/api/applications/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more application records.",
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

    const applicationRecords = records.map((record) => ({
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: applicationRecords.length,
        query: {
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          status: query.status,
          reviewStatus: query.reviewStatus,
          decisionStatus: query.decisionStatus,
        },
        applications: applicationRecords,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-applications-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "authorized-lender",
          "authorized-sponsor",
          "governance",
        ],
        sharingPermissions: ["controlled-application-admin-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-application-data",
          "requires-governed-dashboard-access",
          "requires-redaction-before-borrower-disclosure",
        ],
        redactionRequirements: [
          "redact-internal-application-metadata-before-external-disclosure",
          "redact-property-address-before-non-authorized-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "APPLICATION_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Application records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.applications.admin",
      metadata: {
        route: "/api/applications/admin",
        rowCount: applicationRecords.length,
        applicationId: query.applicationId,
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
          resourceType: "application_admin_read",
          resourceId: query.applicationId ?? query.tenantId ?? traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/applications/admin",
            rowCount: applicationRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "application_admin_read",
        targetId: query.applicationId ?? query.tenantId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "application-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: applicationRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: applicationRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
        },
        metadata: {
          route: "/api/applications/admin",
          operation: "application.admin-read",
        },
      },
      metadata: {
        route: "/api/applications/admin",
        operation: "application.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: applicationRecords.length,
      applications: applicationRecords,
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
      eventType: "APPLICATION_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message:
        "Application admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.applications.admin",
      metadata: {
        route: "/api/applications/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown application admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/applications/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown application admin read error.",
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
