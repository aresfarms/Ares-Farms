import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import {
  assertNoRawDocumentContent,
  persistDocumentSubmission,
} from "@/lib/documents/documentStore";
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
 * Document Submission API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed document submission authority and accountability.
 *
 * - Vol II: Regulatory Governance
 *   Preserves regulated borrower document metadata, consent, retention,
 *   controlled disclosure, and human review boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe document metadata intake tied to canonical application
 *   state without accepting raw binary content in this route.
 *
 * - Vol IV: Operational Runbooks
 *   Supports document review, escalation, evidence preservation, and recovery.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, consent, source authority, observability,
 *   replayability, version lineage, and governance evidence preservation.
 */

type DocumentSubmissionRequest = {
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  documentType?: string | null;
  documentName?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  byteSize?: number | null;
  checksum?: string | null;
  storageUri?: string | null;
  role?: string | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

function createDocumentTraceId(): string {
  return `document-submit-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function routeActorRole(body: DocumentSubmissionRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function actorId(body: DocumentSubmissionRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

export async function POST(req: NextRequest) {
  const traceId = createDocumentTraceId();

  try {
    const body = (await req.json()) as DocumentSubmissionRequest;
    const actor = actorId(body);

    assertNoRawDocumentContent(body as Record<string, unknown>);

    const runtimeGuard = runRuntimeGuard({
      operation: "document.submit",
      module: "api.documents.submit",
      traceId,
      schemaVersion: "document-submission-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/documents/submit",
        applicationId: body.applicationId ?? null,
        documentType: body.documentType ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_SUBMISSION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Document submission was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.submit",
        metadata: {
          route: "/api/documents/submit",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/submit",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked document submission.",
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
        "admin",
        "governance",
      ],
      operation: "document.submit",
      module: "api.documents.submit",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_SUBMISSION_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Document submission was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.submit",
        metadata: {
          route: "/api/documents/submit",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/submit",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for document submission.",
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
      operation: "document.submit",
      module: "api.documents.submit",
      traceId,
      resourceType: "document",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_SUBMISSION_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Document submission was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.submit",
        metadata: {
          route: "/api/documents/submit",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/submit",
          recordAccessDenied: true,
          access,
          recordAccess,
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
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "document.submit",
      module: "api.documents.submit",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "document-submission-v0.1.0",
          "src/app/api/documents/submit/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "application-documents-v0.1.0",
          "src/db/schema/applicationDocuments.ts",
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
          "runtime",
          "governance-evidence-store-v0.1.0",
          "src/lib/governance/evidenceStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "api",
          "document-intake-runtime-v0.1.0",
          "src/lib/documents/documentStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-documents-submit-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "borrower-document-review",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["classify", "summarize"],
      exportRestrictions: [
        "requires-governed-access",
        "requires-document-review-context",
        "raw-file-content-not-accepted-on-metadata-route",
      ],
      redactionRequirements: [
        "redact-sensitive-document-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["borrower-document-submission-consent"],
    });

    const persisted = await persistDocumentSubmission({
      traceId,
      source: "api.documents.submit",
      applicationId: body.applicationId ?? "",
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      documentType: body.documentType ?? "",
      documentName: body.documentName ?? "",
      fileName: body.fileName,
      mimeType: body.mimeType,
      byteSize: body.byteSize,
      checksum: body.checksum,
      storageUri: body.storageUri,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        documentId: persisted.document.id,
        applicationId: persisted.document.applicationId,
        propertyId: persisted.document.propertyId,
        status: persisted.document.status,
        reviewStatus: persisted.document.reviewStatus,
        rawContentAccepted: false,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-documents-submit-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "borrower",
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "borrower-document-review",
          "regulated-operational-processing",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-final-document-review",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-sensitive-document-identifiers-before-public-disclosure",
        ],
        consentRequirements: ["borrower-document-submission-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "document_submission",
      audience: "borrower",
      claimType: "fact",
      summary:
        "Document metadata was attached to a canonical application record through governed intake controls; raw file content was not accepted by this route.",
      ruleVersion: "document-submission-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        documentId: persisted.document.id,
        applicationId: persisted.document.applicationId,
        rawContentAccepted: false,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DOCUMENT_SUBMISSION_RECEIVED",
      domain: "operations",
      severity: "INFO",
      message:
        "Document metadata submission was persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.documents.submit",
      metadata: {
        documentId: persisted.document.id,
        applicationId: persisted.document.applicationId,
        status: persisted.document.status,
        reviewStatus: persisted.document.reviewStatus,
        versionRuntimeOk: versionRuntime.ok,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "document_submission_input",
          resourceId: persisted.document.id,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/documents/submit",
            stage: "input",
            applicationId: persisted.document.applicationId,
          },
        },
        {
          resourceType: "document_submission_output",
          resourceId: persisted.document.id,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/documents/submit",
            stage: "output",
            applicationId: persisted.document.applicationId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "document_submission",
        targetId: persisted.document.id,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "document-submission-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          documentId: persisted.document.id,
          applicationId: persisted.document.applicationId,
          rawContentAccepted: false,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/documents/submit",
          operation: "document.submit",
        },
      },
      metadata: {
        route: "/api/documents/submit",
        operation: "document.submit",
      },
    });

    return NextResponse.json({
      ok: true,
      document: persisted.document,
      application: persisted.application,
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
      eventType: "DOCUMENT_SUBMISSION_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Document submission encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.documents.submit",
      metadata: {
        route: "/api/documents/submit",
        error:
          error instanceof Error
            ? error.message
            : "Unknown document submission error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/documents/submit",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown document submission error.",
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
