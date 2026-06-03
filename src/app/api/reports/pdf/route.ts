import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { persistReportRecord } from "@/lib/reports/reportRecordStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * PDF Report API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed report generation, auditability, and constitutional disclosure controls.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliant report production and examination-safe export handling.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe report generation, version lineage, and durable evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports reporting workflows, escalation review,
 *   operational oversight, and evidence preservation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, replayability,
 *   observability, export governance, version lineage, content-claims
 *   governance, and durable governance evidence.
 */

type ReportRequest = {
  borrowerId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  role?: string | null;
  reportType?: string | null;
  applicationId?: string | null;
  metadata?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

function createReportTraceId(): string {
  return `report-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function routeActorRole(body: ReportRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function reportRecordResponse(
  record: Awaited<ReturnType<typeof persistReportRecord>>
) {
  return {
    id: record.id,
    reportId: record.reportId,
    reportType: record.reportType,
    reportStatus: record.reportStatus,
    applicationId: record.applicationId,
    borrowerId: record.borrowerId,
    tenantId: record.tenantId,
    actorId: record.actorId,
    reportTitle: record.reportTitle,
    advisory: record.advisory,
    advisoryOnly: record.advisoryOnly,
    officialUseAllowed: record.officialUseAllowed,
    borrowerDisclosureAllowed: record.borrowerDisclosureAllowed,
    humanReviewRequired: record.humanReviewRequired,
    externalReportGenerated: record.externalReportGenerated,
    classification: record.classification,
    replayRef: record.replayRef,
    traceId: record.traceId,
    generatedAt: record.generatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createReportTraceId();

  try {
    const body = (await req.json()) as ReportRequest;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "report.generate",
      module: "api.reports.pdf",
      traceId,
      schemaVersion: "report-runtime-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/reports/pdf",
        reportType: body.reportType ?? "UNKNOWN",
        outwardFacingArtifact: true,
        durableGovernanceEvidence: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_RUNTIME_BLOCKED",
        domain: "security",
        severity: "WARN",
        message: "Report generation was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.reports.pdf",
        metadata: {
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reports/pdf",
          blocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked report generation.",
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
      operation: "report.generate",
      module: "api.reports.pdf",
      traceId,
      actorId,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Report generation was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.reports.pdf",
        metadata: {
          route: "/api/reports/pdf",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reports/pdf",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for report generation.",
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

    const recordAccess = body.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "report.generate",
          module: "api.reports.pdf",
          traceId,
          resourceType: "borrower_report",
          applicationId: body.applicationId,
          borrowerId: body.borrowerId,
          tenantId: body.tenantId,
          userId: body.userId,
        })
      : null;

    if (recordAccess && !recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Report generation was denied by application record-level access control.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.reports.pdf",
        metadata: {
          route: "/api/reports/pdf",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/reports/pdf",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized to generate a report for this application.",
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
      operation: "report.generate",
      module: "api.reports.pdf",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "report-runtime-v0.1.0",
          "src/app/api/reports/pdf/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volumes-runtime-v0.1.0",
          "Master Volume Series",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "report-records-v0.1.0",
          "src/db/schema/reportRecords.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "runtime-enforcement-v0.1.0",
          "src/lib/runtime",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "report-engine-v0.1.0",
          "api.reports.pdf.runtime",
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
          "content-claims-policy-v0.1.0",
          "src/lib/governance/contentClaimsPolicy.ts",
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

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-report-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "borrower-reporting",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-export-context",
        "requires-review-before-third-party-disclosure",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-data-for-non-authorized-audiences",
      ],
      consentRequirements: ["borrower-report-consent"],
    });

    const report = {
      reportId: traceId,
      generatedAt: new Date().toISOString(),
      reportType: body.reportType ?? "STANDARD",
      advisory:
        "AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.",
      replayRef: traceId,
      applicationId: body.applicationId ?? null,
      borrowerId: body.borrowerId ?? null,
      tenantId: body.tenantId ?? null,
      payload: body.payload ?? {},
    };

    const contentClaims = evaluateContentClaims({
      text: [
        "Borrower readiness report",
        String(report.reportType),
        report.advisory,
      ],
      context: {
        freeTierBaselineReadinessAvailable: true,
        borrowerPortabilityAvailable: true,
        publicVerificationGatewayOperational: false,
        canonicalHashVerificationOperational: false,
      },
    });

    if (!contentClaims.ok) {
      const observability = createObservabilityEvent({
        eventType: "REPORT_CONTENT_CLAIMS_BLOCKED",
        domain: "operations",
        severity: "WARN",
        message:
          "Report generation was blocked by governed content-claims policy.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.reports.pdf",
        metadata: {
          route: "/api/reports/pdf",
          contentClaims,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        versionRuntime,
        observability,
        metadata: {
          route: "/api/reports/pdf",
          contentClaimsBlocked: true,
          contentClaims,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Report content claims require governance review.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            versionRuntime,
            contentClaims,
            observability,
            evidence,
          },
        },
        { status: 422 }
      );
    }

    const classifiedOutput = classifyRecord(report, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-report-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "borrower-reporting",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-an-official-regulatory-document",
        "requires-human-review-before-regulatory-reliance",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-data-before-third-party-sharing",
      ],
      consentRequirements: ["borrower-report-consent"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_report",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Borrower report generated through governed runtime controls with replay-safe lineage.",
      ruleVersion: "report-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.7,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        reportType: body.reportType ?? "STANDARD",
        advisoryOnly: true,
      },
    });

    const reportRecord = await persistReportRecord({
      traceId,
      reportId: traceId,
      reportType: body.reportType ?? "STANDARD",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      actorId,
      reportTitle: `${body.reportType ?? "STANDARD"} borrower report`,
      advisory: report.advisory,
      requestPayload: body as Record<string, unknown>,
      reportPayload: report,
      outputSummary: {
        reportType: body.reportType ?? "STANDARD",
        advisoryOnly: true,
        humanReviewRequired: explanation.humanReviewRequired,
        officialUseAllowed: false,
      },
      metadata: {
        access,
        recordAccess,
        contentClaims,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "REPORT_GENERATED",
      domain: "operations",
      severity: "INFO",
      message: "Borrower report generated through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.reports.pdf",
      metadata: {
        reportRecordId: reportRecord.id,
        reportId: reportRecord.reportId,
        reportType: body.reportType ?? "STANDARD",
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "report_request",
          resourceId: String(reportRecord.id),
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reports/pdf",
            reportType: body.reportType ?? "STANDARD",
          },
        },
        {
          resourceType: "borrower_report",
          resourceId: String(reportRecord.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/reports/pdf",
            reportType: body.reportType ?? "STANDARD",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_report",
        targetId: String(reportRecord.id),
        verificationStatus: versionRuntime.ok ? "verified" : "warning",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "report-runtime-v0.1.0",
        replayVersion: "report-runtime-replay-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          reportId: traceId,
          reportRecordId: reportRecord.id,
          reportType: body.reportType ?? "STANDARD",
          advisoryOnly: true,
          humanReviewRequired: explanation.humanReviewRequired,
          contentClaimsOk: contentClaims.ok,
        },
        metadata: {
          route: "/api/reports/pdf",
          contentClaimsPolicyVersion: contentClaims.policyVersion,
        },
        verifiedBy: "api.reports.pdf",
      },
      metadata: {
        route: "/api/reports/pdf",
        operation: "report.generate",
      },
    });

    return NextResponse.json({
      ok: true,
      report: classifiedOutput,
      reportRecord: reportRecordResponse(reportRecord),
      governance: {
        traceId,
        runtimeGuard,
        access,
        recordAccess,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        contentClaims,
        explainability: explanation,
        observability,
        evidence,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown report runtime error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
