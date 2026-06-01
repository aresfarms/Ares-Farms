import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { evaluateApplicationRecordAccess } from "@/lib/auth/recordAccess";
import { assertNoRawDocumentContent } from "@/lib/documents/documentStore";
import { createDocumentStorageHandoff } from "@/lib/documents/storageHandoffStore";
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
 * Document Storage Handoff API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed storage intent authority before raw file movement.
 *
 * - Vol II: Regulatory Governance
 *   Preserves regulated borrower document consent, controlled disclosure,
 *   retention, and chain-of-custody boundaries.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe upload handoff records without accepting raw binary
 *   document content into API runtime.
 *
 * - Vol IV: Operational Runbooks
 *   Supports document upload recovery, storage provider review, escalation,
 *   evidence preservation, and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, consent, source authority, observability,
 *   replayability, version lineage, and governance evidence preservation.
 */

type StorageHandoffRequest = {
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
  storageProvider?: string | null;
  storageBucket?: string | null;
  role?: string | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

function createStorageHandoffTraceId(): string {
  return `document-storage-handoff-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: StorageHandoffRequest): string | null {
  return body.userId ?? body.borrowerId ?? null;
}

function routeActorRole(body: StorageHandoffRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function handoffResponse(input: Awaited<ReturnType<typeof createDocumentStorageHandoff>>) {
  return {
    id: input.handoff.id,
    applicationId: input.handoff.applicationId,
    borrowerId: input.handoff.borrowerId,
    tenantId: input.handoff.tenantId,
    documentType: input.handoff.documentType,
    documentName: input.handoff.documentName,
    fileName: input.handoff.fileName,
    mimeType: input.handoff.mimeType,
    byteSize: input.handoff.byteSize,
    checksum: input.handoff.checksum,
    storageProvider: input.handoff.storageProvider,
    storageBucket: input.handoff.storageBucket,
    objectKey: input.handoff.objectKey,
    storageUri: input.handoff.storageUri,
    uploadMethod: input.handoff.uploadMethod,
    uploadUrl: input.handoff.uploadUrl,
    handoffToken: input.handoffToken,
    handoffStatus: input.handoff.handoffStatus,
    rawContentAccepted: input.handoff.rawContentAccepted,
    providerConfigured: input.handoff.providerConfigured,
    humanReviewRequired: input.handoff.humanReviewRequired,
    expiresAt: input.handoff.expiresAt,
    createdAt: input.handoff.createdAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createStorageHandoffTraceId();

  try {
    const body = (await req.json()) as StorageHandoffRequest;
    const actor = actorId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "document-storage.handoff",
      module: "api.documents.storage-handoff",
      traceId,
      schemaVersion: "document-storage-handoff-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/documents/storage-handoff",
        applicationId: body.applicationId ?? null,
        documentType: body.documentType ?? null,
        rawContentAccepted: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_STORAGE_HANDOFF_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Document storage handoff was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.storage-handoff",
        metadata: {
          route: "/api/documents/storage-handoff",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/storage-handoff",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked document storage handoff.",
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
      operation: "document-storage.handoff",
      module: "api.documents.storage-handoff",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_STORAGE_HANDOFF_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message: "Document storage handoff was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.storage-handoff",
        metadata: {
          route: "/api/documents/storage-handoff",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/storage-handoff",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Role is not authorized for document storage handoff.",
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
      operation: "document-storage.handoff",
      module: "api.documents.storage-handoff",
      traceId,
      resourceType: "document",
      applicationId: body.applicationId,
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    if (!recordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_STORAGE_HANDOFF_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Document storage handoff was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.storage-handoff",
        metadata: {
          route: "/api/documents/storage-handoff",
          access,
          recordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/storage-handoff",
          recordAccessDenied: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Actor is not authorized for this document storage handoff.",
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

    try {
      assertNoRawDocumentContent(body as Record<string, unknown>);
    } catch (error) {
      const observability = createObservabilityEvent({
        eventType: "DOCUMENT_STORAGE_HANDOFF_RAW_CONTENT_REJECTED",
        domain: "security",
        severity: "WARN",
        message:
          "Document storage handoff rejected raw document content in API runtime.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.documents.storage-handoff",
        metadata: {
          route: "/api/documents/storage-handoff",
          access,
          recordAccess,
          rawContentRejected: true,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/documents/storage-handoff",
          rawContentRejected: true,
          access,
          recordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Raw document content is not accepted.",
          governance: {
            traceId,
            runtimeGuard,
            access,
            recordAccess,
            observability,
            evidence,
          },
        },
        { status: 400 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "document-storage.handoff",
      module: "api.documents.storage-handoff",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "document-storage-handoff-v0.1.0",
          "src/app/api/documents/storage-handoff/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "document-storage-handoffs-v0.1.0",
          "src/db/schema/documentStorageHandoffs.ts",
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
          "api",
          "document-storage-handoff-runtime-v0.1.0",
          "src/lib/documents/storageHandoffStore.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-documents-storage-handoff-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-operator",
        "authorized-underwriter",
        "governance",
      ],
      sharingPermissions: [
        "borrower-document-storage",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["classify", "summarize"],
      exportRestrictions: [
        "requires-governed-access",
        "raw-file-content-not-accepted-by-api-runtime",
      ],
      redactionRequirements: [
        "redact-sensitive-document-storage-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["borrower-document-storage-consent"],
    });

    const created = await createDocumentStorageHandoff({
      traceId,
      source: "api.documents.storage-handoff",
      applicationId: body.applicationId ?? "",
      borrowerId: body.borrowerId,
      tenantId: body.tenantId,
      documentType: body.documentType ?? "",
      documentName: body.documentName ?? "",
      fileName: body.fileName ?? "",
      mimeType: body.mimeType,
      byteSize: body.byteSize,
      checksum: body.checksum,
      storageProvider: body.storageProvider,
      storageBucket: body.storageBucket,
      metadata: {
        ...(body.metadata ?? {}),
        access,
        recordAccess,
      },
    });
    const handoff = handoffResponse(created);

    const classifiedOutput = classifyRecord(handoff, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-documents-storage-handoff-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "borrower",
        "authorized-operator",
        "authorized-underwriter",
        "governance",
      ],
      sharingPermissions: [
        "borrower-document-storage",
        "regulated-operational-processing",
      ],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-a-raw-document-upload",
        "requires-certified-storage-provider-before-direct-upload",
      ],
      redactionRequirements: [
        "redact-handoff-token-before-persistence-or-public-disclosure",
        "redact-sensitive-storage-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["borrower-document-storage-consent"],
    });

    const explanation = createExplanationLineage({
      outputIdentifier: String(created.handoff.id),
      outputType: "document_storage_handoff",
      audience: "internal",
      claimType: "fact",
      summary:
        "Document storage handoff was created as a governed upload intent; raw document content was not accepted by API runtime.",
      ruleVersion: "document-storage-handoff-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        handoffId: created.handoff.id,
        applicationId: created.handoff.applicationId,
        storageUri: created.handoff.storageUri,
        rawContentAccepted: false,
        providerConfigured: created.handoff.providerConfigured,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "DOCUMENT_STORAGE_HANDOFF_CREATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Document storage handoff was persisted through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.documents.storage-handoff",
      metadata: {
        handoffId: created.handoff.id,
        applicationId: created.handoff.applicationId,
        handoffStatus: created.handoff.handoffStatus,
        rawContentAccepted: created.handoff.rawContentAccepted,
        providerConfigured: created.handoff.providerConfigured,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "document_storage_handoff_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/documents/storage-handoff",
            stage: "input",
          },
        },
        {
          resourceType: "document_storage_handoff",
          resourceId: String(created.handoff.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/documents/storage-handoff",
            stage: "output",
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "document_storage_handoff",
        targetId: String(created.handoff.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "document-storage-handoff-runtime-v0.1.0",
        replayVersion: "document-storage-handoff-replay-v0.1.0",
        metadata: {
          handoffStatus: created.handoff.handoffStatus,
          rawContentAccepted: created.handoff.rawContentAccepted,
        },
      },
      metadata: {
        route: "/api/documents/storage-handoff",
        handoffId: created.handoff.id,
        durableGovernanceEvidence: true,
      },
    });

    return NextResponse.json({
      ok: true,
      handoff,
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
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown document storage handoff error.",
        governance: {
          traceId,
        },
      },
      { status: 500 }
    );
  }
}
