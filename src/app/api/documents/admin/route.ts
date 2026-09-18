import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import {
  DocumentAdminRecord,
  getDocumentAdminRecordById,
  listDocumentAdminRecords,
} from "@/lib/documents/documentAdminStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Document Admin Read API
 *
 * Master Volume Governance:
 * - Vol I: Requires accountable authority for application document reads.
 *
 * - Vol II: Protects borrower document metadata, retention posture, review
 *   status, and storage references from uncontrolled disclosure.
 *
 * - Vol III: Provides replay-safe, record-scoped document metadata reads
 *   before borrower, operator, lender, sponsor, or admin modules consume data.
 *
 * - Vol IV: Supports document review, escalation, recovery, audit
 *   preparation, and dashboard-safe backend access.
 *
 * - Vol V: Enforces classification, observability, replayability, version
 *   lineage, controlled disclosure, and evidence preservation.
 */

type DocumentAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  documentId?: string | null;
  documentType?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
  limit: number;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createDocumentAdminTraceId(): string {
  return `document-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): DocumentAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    documentId: normalizeText(params.get("documentId")),
    documentType: normalizeText(params.get("documentType")),
    status: normalizeText(params.get("status")),
    reviewStatus: normalizeText(params.get("reviewStatus")),
    limit: normalizeLimit(params.get("limit")),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: DocumentAdminQuery): boolean {
  return !privilegedRole(query.role) && !query.tenantId;
}

function documentResponse(record: DocumentAdminRecord) {
  return {
    id: record.document.id,
    applicationId: record.document.applicationId,
    borrowerId: record.document.borrowerId,
    tenantId: record.document.tenantId,
    propertyId: record.document.propertyId,
    documentType: record.document.documentType,
    documentName: record.document.documentName,
    fileName: record.document.fileName,
    mimeType: record.document.mimeType,
    byteSize: record.document.byteSize,
    checksum: record.document.checksum,
    storageUri: record.document.storageUri,
    status: record.document.status,
    reviewStatus: record.document.reviewStatus,
    retentionStatus: record.document.retentionStatus,
    governanceVersion: record.document.governanceVersion,
    classification: record.document.classification,
    replayRef: record.document.replayRef,
    source: record.document.source,
    receivedAt: record.document.receivedAt,
    reviewedAt: record.document.reviewedAt,
    createdAt: record.document.createdAt,
    updatedAt: record.document.updatedAt,
  };
}

function applicationResponse(record: DocumentAdminRecord) {
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

function propertyResponse(record: DocumentAdminRecord) {
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

function documentApplicationId(record: DocumentAdminRecord): string {
  return record.application?.id ?? record.document.applicationId;
}

async function evaluateRecordAccessForRecords(input: {
  records: DocumentAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: DocumentAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "document.admin-read",
        module: "api.documents.admin",
        traceId: input.traceId,
        resourceType: "document",
        applicationId: documentApplicationId(record),
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: null,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createDocumentAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "document.admin-read",
      module: "api.documents.admin",
      traceId,
      schemaVersion: "document-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/documents/admin",
        applicationId: query.applicationId,
        documentId: query.documentId,
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
      operation: "document.admin-read",
      module: "api.documents.admin",
      traceId,
      actorId: actor,
      tenantId: query.tenantId,
    });

    if (!runtimeGuard.allowed || !access.allowed || scopeRequired(query)) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Document admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.admin",
        metadata: {
          route: "/api/documents/admin",
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
          route: "/api/documents/admin",
          accessDenied: true,
          access,
          scopeRequired: scopeRequired(query),
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for document admin reads or is missing governed tenant scope.",
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
      operation: "document.admin-read",
      module: "api.documents.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "document-admin-read-api-v0.1.0",
          "src/app/api/documents/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "application-documents-v0.1.0",
          "src/db/schema/applicationDocuments.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "applications-v0.1.0",
          "src/db/schema/applications.ts",
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
          "document-admin-read-runtime-v0.1.0",
          "src/lib/documents/documentAdminStore.ts",
          traceId
        ),
      ],
    });

    const documentScopedRecord = query.documentId
      ? await getDocumentAdminRecordById(query.documentId)
      : null;
    const scopedApplicationId =
      query.applicationId ?? documentScopedRecord?.document.applicationId ?? null;
    const requestedRecordAccess = scopedApplicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "document.admin-read",
          module: "api.documents.admin",
          traceId,
          resourceType: "document",
          applicationId: scopedApplicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: null,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Document admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.admin",
        metadata: {
          route: "/api/documents/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this application document record.",
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

    const records = await listDocumentAdminRecords({
      documentId: query.documentId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      documentType: query.documentType,
      status: query.status,
      reviewStatus: query.reviewStatus,
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
        eventType: "DOCUMENT_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Document admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.admin",
        metadata: {
          route: "/api/documents/admin",
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
          route: "/api/documents/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more application document records.",
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

    const documentRecords = records.map((record) => ({
      document: documentResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: documentRecords.length,
        query: {
          documentId: query.documentId,
          applicationId: query.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          documentType: query.documentType,
          status: query.status,
          reviewStatus: query.reviewStatus,
        },
        documents: documentRecords,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-documents-admin-read-route-output",
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
        sharingPermissions: ["controlled-document-admin-read"],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "not-public-document-data",
          "raw-file-content-not-included",
          "requires-governed-dashboard-access",
          "requires-redaction-before-borrower-disclosure",
        ],
        redactionRequirements: [
          "redact-storage-uri-before-non-authorized-disclosure",
          "redact-checksum-before-public-disclosure",
          "redact-property-address-before-non-authorized-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "DOCUMENT_ADMIN_READ",
      domain: "operations",
      severity: "INFO",
      message:
        "Document metadata records were read through governed record-scoped controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.documents.admin",
      metadata: {
        route: "/api/documents/admin",
        rowCount: documentRecords.length,
        applicationId: query.applicationId,
        documentId: query.documentId,
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
          resourceType: "document_admin_read",
          resourceId:
            query.documentId ?? query.applicationId ?? query.tenantId ?? traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/documents/admin",
            rowCount: documentRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "document_admin_read",
        targetId:
          query.documentId ?? query.applicationId ?? query.tenantId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "document-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: documentRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: documentRecords.length,
          documentId: query.documentId,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
        },
        metadata: {
          route: "/api/documents/admin",
          operation: "document.admin-read",
        },
      },
      metadata: {
        route: "/api/documents/admin",
        operation: "document.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: documentRecords.length,
      documents: documentRecords,
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
      eventType: "DOCUMENT_ADMIN_READ_ERROR",
      domain: "operations",
      severity: "ERROR",
      message: "Document admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.documents.admin",
      metadata: {
        route: "/api/documents/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown document admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/documents/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown document admin read error.",
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
