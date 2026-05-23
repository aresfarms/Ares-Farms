import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auditEvents } from "@/db/schema";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Audit Export API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces audit openness, immutable evidence access, and constitutional accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports examination-ready audit exports and regulated evidentiary review.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe, classification-aware export access.
 *
 * - Vol IV: Operational Runbooks
 *   Supports examination preparation, export review, and operational audit procedures.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, selective disclosure, replay context,
 *   observability, explainability, and version lineage.
 */

function createAuditExportTraceId(): string {
  return `audit-export-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function GET() {
  try {
    const traceId = createAuditExportTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "audit.export",
      module: "api.audit.export",
      traceId,
      schemaVersion: "audit-export-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      metadata: {
        route: "/api/audit/export",
        exportSurface: true,
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked audit export.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "audit.export",
      module: "api.audit.export",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "audit-export-v0.1.0",
          "src/app/api/audit/export/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "governance",
          "master-volume-runtime-v0.1.0",
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
          "ledger",
          "audit-events-v0.1.0",
          "src/db/schema/auditEvents.ts",
          traceId
        ),
      ],
    });

    const rows = await db.select().from(auditEvents);

    const classifiedExport = classifyRecord(
      {
        count: rows.length,
        rows,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "regulatory",
        classificationSource: "api-audit-export-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["auditor", "regulator", "governance"],
        sharingPermissions: ["regulated-examination-export"],
        exportRestrictions: [
          "requires-governed-recipient",
          "requires-audit-purpose",
          "requires-redaction-review-before-external-disclosure",
        ],
        redactionRequirements: [
          "redact-unrelated-borrower-pii-for-non-authorized-audiences",
        ],
        consentRequirements: ["regulatory-or-audit-authority"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "audit_export",
      audience: "auditor",
      claimType: "fact",
      summary:
        "Audit export was generated through classification-aware governed runtime controls.",
      ruleVersion: "audit-export-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        rowCount: rows.length,
        classificationLevel:
          classifiedExport.classification.classificationLevel,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "AUDIT_EXPORT_GENERATED",
      domain: "ledger",
      severity: "WARN",
      message:
        "Audit export generated through canonical runtime governance and requires controlled handling.",
      traceId,
      replayRef: traceId,
      module: "api.audit.export",
      metadata: {
        rowCount: rows.length,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedExport.classification.classificationLevel,
      },
    });

    return NextResponse.json({
      ok: true,
      count: rows.length,
      export: classifiedExport,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        classification: classifiedExport.classification,
        explainability: explanation,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown audit export runtime error.",
      },
      { status: 500 }
    );
  }
}
