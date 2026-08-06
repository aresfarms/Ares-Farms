import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { canonicalReportAuthority } from "@/lib/platform/authorities/report";
import type { ReportAdminRecord } from "@/lib/platform/authorities/report";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Report Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for report record reads.
 *
 * - Vol II: Protects borrower, application, advisory-only, disclosure,
 *   human-review, regulatory-use, and export boundaries.
 *
 * - Vol III: Provides replay-safe, record-scoped report reads before
 *   dashboards, borrower portals, or export workflows consume reports.
 *
 * - Vol IV: Supports report review, escalation, retention, audit preparation,
 *   and operational evidence preservation.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and export governance.
 */

type ReportAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  reportId?: string | null;
  reportType?: string | null;
  reportStatus?: string | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createReportAdminTraceId(): string {
  return `report-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): ReportAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    reportId: normalizeText(params.get("reportId")),
    reportType: normalizeText(params.get("reportType")),
    reportStatus: normalizeText(params.get("reportStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: ReportAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId
  );
}

function reportResponse(record: ReportAdminRecord) {
  return {
    id: record.report.id,
    reportId: record.report.reportId,
    reportType: record.report.reportType,
    reportStatus: record.report.reportStatus,
    applicationId: record.report.applicationId,
    borrowerId: record.report.borrowerId,
    tenantId: record.report.tenantId,
    actorId: record.report.actorId,
    reportTitle: record.report.reportTitle,
    advisory: record.report.advisory,
    advisoryOnly: record.report.advisoryOnly,
    officialUseAllowed: record.report.officialUseAllowed,
    borrowerDisclosureAllowed: record.report.borrowerDisclosureAllowed,
    humanReviewRequired: record.report.humanReviewRequired,
    externalReportGenerated: record.report.externalReportGenerated,
    outputSummary: record.report.outputSummary,
    governanceVersion: record.report.governanceVersion,
    classification: record.report.classification,
    replayRef: record.report.replayRef,
    traceId: record.report.traceId,
    source: record.report.source,
    generatedAt: record.report.generatedAt,
    reviewedAt: record.report.reviewedAt,
    exportedAt: record.report.exportedAt,
    createdAt: record.report.createdAt,
    updatedAt: record.report.updatedAt,
  };
}

function applicationResponse(record: ReportAdminRecord) {
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

function propertyResponse(record: ReportAdminRecord) {
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
  records: ReportAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: ReportAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    if (!record.report.applicationId) {
      continue;
    }

    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "report.admin-read",
        module: "api.reports.admin",
        traceId: input.traceId,
        resourceType: "borrower_report",
        applicationId: record.report.applicationId,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: input.query.userId,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createReportAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "report.admin-read",
      module: "api.reports.admin",
      traceId,
      schemaVersion: "report-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/reports/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        reportId: query.reportId,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "report.admin-read",
      module: "api.reports.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (
      !runtimeGuard.allowed ||
      !access.allowed ||
      scopeRequired({ ...query, role: access.role })
    ) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Report admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reports.admin",
        metadata: {
          route: "/api/reports/admin",
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
          route: "/api/reports/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired({ ...query, role: access.role }),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for report admin reads or is missing governed scope.",
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
      operation: "report.admin-read",
      module: "api.reports.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "report-admin-read-api-v0.1.0",
          "src/app/api/reports/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "report-records-v0.1.0",
          "src/db/schema/reportRecords.ts",
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
          "report-record-runtime-v0.1.0",
          "src/lib/reports/reportRecordStore.ts",
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

    const scopeRecord = await canonicalReportAuthority.getAdminScope({
      reportId: query.reportId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "report.admin-read",
          module: "api.reports.admin",
          traceId,
          resourceType: "borrower_report",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Report admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reports.admin",
        metadata: {
          route: "/api/reports/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reports/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this report record.",
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

    const records = await canonicalReportAuthority.listAdminRecords({
      reportId: query.reportId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      reportType: query.reportType,
      reportStatus: query.reportStatus,
      limit: query.limit,
      includeApplication: query.includeApplication,
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
        eventType: "REPORT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Report admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.reports.admin",
        metadata: {
          route: "/api/reports/admin",
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
          route: "/api/reports/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for one or more report records.",
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

    const reportRecordsResponse = records.map((record) => ({
      report: reportResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: reportRecordsResponse.length,
        query: {
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          reportId: query.reportId,
          reportType: query.reportType,
          reportStatus: query.reportStatus,
          includeApplication: query.includeApplication,
          includeProperty: query.includeProperty,
        },
        reportRecords: reportRecordsResponse,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-reports-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: ["controlled-report-lifecycle-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-official-regulatory-document",
          "requires-governed-dashboard-access",
          "requires-human-review-before-regulatory-reliance",
        ],
        redactionRequirements: [
          "redact-sensitive-borrower-report-data-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "REPORT_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Report records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.reports.admin",
      metadata: {
        route: "/api/reports/admin",
        rowCount: reportRecordsResponse.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        reportId: query.reportId,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "report_admin_read",
          resourceId: query.reportId ?? query.applicationId ?? traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reports/admin",
            rowCount: reportRecordsResponse.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "report_admin_read",
        targetId: query.reportId ?? query.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "report-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: reportRecordsResponse.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: reportRecordsResponse.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          reportId: query.reportId,
        },
        metadata: {
          route: "/api/reports/admin",
          operation: "report.admin-read",
        },
      },
      metadata: {
        route: "/api/reports/admin",
        operation: "report.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: reportRecordsResponse.length,
      reportRecords: reportRecordsResponse,
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
      eventType: "REPORT_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Report admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.reports.admin",
      metadata: {
        route: "/api/reports/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown report admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/reports/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown report admin read error.",
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
