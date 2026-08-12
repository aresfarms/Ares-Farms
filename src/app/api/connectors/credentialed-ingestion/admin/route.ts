import { NextRequest, NextResponse } from "next/server";

import { effectiveRole } from "@/lib/auth/sessionAuthority";

import { evaluateAccess } from "@/lib/auth/accessControl";
import {
  RecordAccessDecision,
  evaluateApplicationRecordAccess,
} from "@/lib/auth/recordAccess";
import {
  CredentialedIngestionAdminRecord,
  getCredentialedIngestionAdminScopeRecord,
  listCredentialedIngestionAdminRecords,
} from "@/lib/connectors/credentialedIngestionAdminStore";
import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Credentialed Agency Ingestion Admin Read API
 *
 * Master Volume Governance:
 * - Vol I §3.37: credentialed agency ingestion records require accountable
 *   operational review authority.
 * - Vol II §3.25: ToS, license, credential, isolation, and anti-bulk evidence
 *   remains controlled.
 * - Vol III TECH-CONN-001: reads canonical credentialed_scraping_events and
 *   credential_vault_refs without performing external requests.
 * - Vol IV OPS-CONN-002: supports SEV-2/circuit-breaker inspection.
 * - Vol V CANON-EXTSOURCE-001: preserves source trust, replay, provenance,
 *   advisory-only status, and controlled disclosure.
 */

type CredentialedIngestionAdminQuery = {
  role: string;
  userId?: string | null;
  borrowerId?: string | null;
  tenantId?: string | null;
  applicationId?: string | null;
  eventId?: string | null;
  scrapingEventId?: string | null;
  vaultRefId?: string | null;
  externalTargetDomain?: string | null;
  sourceType?: string | null;
  sessionOutcome?: string | null;
  readyForSession?: boolean | null;
  limit: number;
  includeCredential: boolean;
  includeApplication: boolean;
  includeProperty: boolean;
};

function createCredentialedIngestionAdminTraceId(): string {
  return `credentialed-ingestion-admin-read-${Date.now()}-${Math.random()
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

function parseQuery(req: NextRequest): CredentialedIngestionAdminQuery {
  const params = req.nextUrl.searchParams;

  return {
    role: effectiveRole(req),
    userId: normalizeText(params.get("userId")),
    borrowerId: normalizeText(params.get("borrowerId")),
    tenantId: normalizeText(params.get("tenantId")),
    applicationId: normalizeText(params.get("applicationId")),
    eventId: normalizeText(params.get("eventId")),
    scrapingEventId: normalizeText(params.get("scrapingEventId")),
    vaultRefId: normalizeText(params.get("vaultRefId")),
    externalTargetDomain: normalizeText(params.get("externalTargetDomain")),
    sourceType: normalizeText(params.get("sourceType")),
    sessionOutcome: normalizeText(params.get("sessionOutcome")),
    readyForSession: normalizeOptionalBoolean(params.get("readyForSession")),
    limit: normalizeLimit(params.get("limit")),
    includeCredential: normalizeBoolean(params.get("includeCredential"), true),
    includeApplication: normalizeBoolean(params.get("includeApplication"), true),
    includeProperty: normalizeBoolean(params.get("includeProperty"), true),
  };
}

function privilegedRole(role: string): boolean {
  return role === "admin" || role === "governance";
}

function scopeRequired(query: CredentialedIngestionAdminQuery): boolean {
  return !(
    privilegedRole(query.role) ||
    query.tenantId ||
    query.applicationId ||
    query.eventId ||
    query.scrapingEventId
  );
}

function ingestionEventResponse(record: CredentialedIngestionAdminRecord) {
  return {
    id: record.ingestionEvent.id,
    scrapingEventId: record.ingestionEvent.scrapingEventId,
    initiatingActorId: record.ingestionEvent.initiatingActorId,
    externalTargetDomain: record.ingestionEvent.externalTargetDomain,
    licenseIdentifierRef: record.ingestionEvent.licenseIdentifierRef,
    applicationIdScope: record.ingestionEvent.applicationIdScope,
    borrowerId: record.ingestionEvent.borrowerId,
    tenantId: record.ingestionEvent.tenantId,
    acquisitionMethod: record.ingestionEvent.acquisitionMethod,
    sourceType: record.ingestionEvent.sourceType,
    sourceTrustClassification:
      record.ingestionEvent.sourceTrustClassification,
    requestedDataCategories: record.ingestionEvent.requestedDataCategories,
    humanAuthorizationRef: record.ingestionEvent.humanAuthorizationRef,
    sourceAuthorityRef: record.ingestionEvent.sourceAuthorityRef,
    dataResidencyZone: record.ingestionEvent.dataResidencyZone,
    sovereigntyClassification:
      record.ingestionEvent.sovereigntyClassification,
    ingestedPayloadHash: record.ingestionEvent.ingestedPayloadHash,
    provenanceEnvelopeRef: record.ingestionEvent.provenanceEnvelopeRef,
    tosComplianceAttestation:
      record.ingestionEvent.tosComplianceAttestation,
    tosComplianceAttestationRef:
      record.ingestionEvent.tosComplianceAttestationRef,
    licenseBoundaryConfirmed:
      record.ingestionEvent.licenseBoundaryConfirmed,
    whitelistVerified: record.ingestionEvent.whitelistVerified,
    baselineSyncLogged: record.ingestionEvent.baselineSyncLogged,
    isolationBoundaryConfirmed:
      record.ingestionEvent.isolationBoundaryConfirmed,
    credentialValid: record.ingestionEvent.credentialValid,
    credentialExpired: record.ingestionEvent.credentialExpired,
    credentialRevoked: record.ingestionEvent.credentialRevoked,
    circuitBreakerTriggered:
      record.ingestionEvent.circuitBreakerTriggered,
    sev2EventRef: record.ingestionEvent.sev2EventRef,
    sessionOutcome: record.ingestionEvent.sessionOutcome,
    readyForSession: record.ingestionEvent.readyForSession,
    externalRequestTransmitted:
      record.ingestionEvent.externalRequestTransmitted,
    dataProcessedByEngine: record.ingestionEvent.dataProcessedByEngine,
    bulkAcquisitionRequested:
      record.ingestionEvent.bulkAcquisitionRequested,
    antiBulkAcquisitionSatisfied:
      record.ingestionEvent.antiBulkAcquisitionSatisfied,
    aiTier: record.ingestionEvent.aiTier,
    gateSnapshot: record.ingestionEvent.gateSnapshot,
    blockerReasons: record.ingestionEvent.blockerReasons,
    classification: record.ingestionEvent.classification,
    replayRef: record.ingestionEvent.replayRef,
    traceId: record.ingestionEvent.traceId,
    createdAt: record.ingestionEvent.createdAt,
    updatedAt: record.ingestionEvent.updatedAt,
  };
}

function credentialResponse(record: CredentialedIngestionAdminRecord) {
  if (!record.credential) {
    return null;
  }

  return {
    id: record.credential.id,
    vaultRefId: record.credential.vaultRefId,
    credentialType: record.credential.credentialType,
    externalPlatform: record.credential.externalPlatform,
    holdingActorId: record.credential.holdingActorId,
    licenseType: record.credential.licenseType,
    licenseScope: record.credential.licenseScope,
    expiryTimestamp: record.credential.expiryTimestamp,
    lastValidatedTimestamp: record.credential.lastValidatedTimestamp,
    renewalStatus: record.credential.renewalStatus,
    revocationEventRef: record.credential.revocationEventRef,
    classification: record.credential.classification,
    replayRef: record.credential.replayRef,
    traceId: record.credential.traceId,
    createdAt: record.credential.createdAt,
    updatedAt: record.credential.updatedAt,
  };
}

function applicationResponse(record: CredentialedIngestionAdminRecord) {
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

function propertyResponse(record: CredentialedIngestionAdminRecord) {
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
  records: CredentialedIngestionAdminRecord[];
  access: Parameters<typeof evaluateApplicationRecordAccess>[0]["access"];
  query: CredentialedIngestionAdminQuery;
  traceId: string;
}): Promise<RecordAccessDecision[]> {
  const decisions: RecordAccessDecision[] = [];

  for (const record of input.records) {
    decisions.push(
      await evaluateApplicationRecordAccess({
        access: input.access,
        operation: "credentialed-ingestion.admin-read",
        module: "api.connectors.credentialed-ingestion.admin",
        traceId: input.traceId,
        resourceType: "connector_request",
        applicationId: record.ingestionEvent.applicationIdScope,
        borrowerId: input.query.borrowerId,
        tenantId: input.query.tenantId,
        userId: input.query.userId,
      })
    );
  }

  return decisions;
}

export async function GET(req: NextRequest) {
  const traceId = createCredentialedIngestionAdminTraceId();

  try {
    const query = parseQuery(req);
    const actor = query.userId ?? query.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "credentialed-ingestion.admin-read",
      module: "api.connectors.credentialed-ingestion.admin",
      traceId,
      schemaVersion: "credentialed-ingestion-admin-read-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/credentialed-ingestion/admin",
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        eventId: query.eventId,
        scrapingEventId: query.scrapingEventId,
        externalRequestExpected: false,
      },
    });

    const access = evaluateAccess({
      role: query.role,
      allowedRoles: ["operator", "underwriter", "auditor", "admin", "governance"],
      operation: "credentialed-ingestion.admin-read",
      module: "api.connectors.credentialed-ingestion.admin",
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
        eventType: "CREDENTIALED_INGESTION_ADMIN_READ_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Credentialed ingestion admin read was denied by runtime, role, or scope controls.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.credentialed-ingestion.admin",
        metadata: {
          route: "/api/connectors/credentialed-ingestion/admin",
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
          route: "/api/connectors/credentialed-ingestion/admin",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for credentialed ingestion admin reads or is missing governed scope.",
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
      operation: "credentialed-ingestion.admin-read",
      module: "api.connectors.credentialed-ingestion.admin",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "credentialed-ingestion-admin-read-api-v0.1.0",
          "src/app/api/connectors/credentialed-ingestion/admin/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "credentialed-agency-ingestion-v0.1.0",
          "src/db/schema/credentialedScrapingEvents.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "credential-vault-refs-v0.1.0",
          "src/db/schema/credentialVaultRefs.ts",
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
          "credentialed-ingestion-admin-read-runtime-v0.1.0",
          "src/lib/connectors/credentialedIngestionAdminStore.ts",
          traceId
        ),
      ],
    });

    const scopeRecord = await getCredentialedIngestionAdminScopeRecord({
      eventId: query.eventId,
      scrapingEventId: query.scrapingEventId,
      applicationId: query.applicationId,
    });
    const requestedRecordAccess = scopeRecord?.applicationId
      ? await evaluateApplicationRecordAccess({
          access,
          operation: "credentialed-ingestion.admin-read",
          module: "api.connectors.credentialed-ingestion.admin",
          traceId,
          resourceType: "connector_request",
          applicationId: scopeRecord.applicationId,
          borrowerId: query.borrowerId,
          tenantId: query.tenantId,
          userId: query.userId,
        })
      : null;

    if (requestedRecordAccess && !requestedRecordAccess.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CREDENTIALED_INGESTION_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Credentialed ingestion admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.credentialed-ingestion.admin",
        metadata: {
          route: "/api/connectors/credentialed-ingestion/admin",
          access,
          requestedRecordAccess,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/credentialed-ingestion/admin",
          recordAccessDenied: true,
          access,
          requestedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for this credentialed ingestion record.",
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

    const records = await listCredentialedIngestionAdminRecords({
      eventId: query.eventId,
      scrapingEventId: query.scrapingEventId,
      vaultRefId: query.vaultRefId,
      applicationId: query.applicationId,
      borrowerId: query.borrowerId,
      tenantId: query.tenantId,
      externalTargetDomain: query.externalTargetDomain,
      sourceType: query.sourceType,
      sessionOutcome: query.sessionOutcome,
      readyForSession: query.readyForSession,
      limit: query.limit,
      includeCredential: query.includeCredential,
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
      const observability = createObservabilityEvent({
        eventType: "CREDENTIALED_INGESTION_ADMIN_READ_RECORD_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Credentialed ingestion admin read was denied by record-level access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.credentialed-ingestion.admin",
        metadata: {
          route: "/api/connectors/credentialed-ingestion/admin",
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
          route: "/api/connectors/credentialed-ingestion/admin",
          recordAccessDenied: true,
          access,
          deniedRecordAccess,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Actor is not authorized for one or more credentialed ingestion records.",
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

    const credentialedIngestionRecords = records.map((record) => ({
      ingestionEvent: ingestionEventResponse(record),
      credential: credentialResponse(record),
      application: applicationResponse(record),
      property: propertyResponse(record),
    }));

    const classifiedOutput = classifyRecord(
      {
        count: credentialedIngestionRecords.length,
        query,
        credentialedIngestionRecords,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource:
          "api-credentialed-ingestion-admin-read-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "authorized-underwriter",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "controlled-credentialed-ingestion-read",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "classify"],
        exportRestrictions: [
          "credential-references-only",
          "requires-governed-dashboard-access",
          "requires-redaction-before-public-disclosure",
        ],
        redactionRequirements: [
          "redact-borrower-property-credential-and-license-references-before-public-disclosure",
        ],
        consentRequirements: ["authorized-operational-processing"],
      }
    );

    const observability = createObservabilityEvent({
      eventType: "CREDENTIALED_INGESTION_ADMIN_READ",
      domain: "connector",
      severity: "INFO",
      message:
        "Credentialed ingestion records were read through governed record-scoped controls without external requests.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.credentialed-ingestion.admin",
      metadata: {
        route: "/api/connectors/credentialed-ingestion/admin",
        rowCount: credentialedIngestionRecords.length,
        applicationId: query.applicationId,
        tenantId: query.tenantId,
        eventId: query.eventId,
        scrapingEventId: query.scrapingEventId,
        externalRequestTransmitted: false,
        dataProcessedByEngine: false,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "credentialed_ingestion_admin_read",
          resourceId:
            query.eventId ??
            query.scrapingEventId ??
            query.applicationId ??
            query.tenantId ??
            traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/credentialed-ingestion/admin",
            rowCount: credentialedIngestionRecords.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "credentialed_ingestion_admin_read",
        targetId:
          query.eventId ??
          query.scrapingEventId ??
          query.applicationId ??
          query.tenantId ??
          traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "credentialed-ingestion-admin-read-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: credentialedIngestionRecords.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          count: credentialedIngestionRecords.length,
          applicationId: query.applicationId,
          tenantId: query.tenantId,
          externalRequestTransmitted: false,
          dataProcessedByEngine: false,
        },
        metadata: {
          route: "/api/connectors/credentialed-ingestion/admin",
          operation: "credentialed-ingestion.admin-read",
        },
      },
      metadata: {
        route: "/api/connectors/credentialed-ingestion/admin",
        operation: "credentialed-ingestion.admin-read",
      },
    });

    return NextResponse.json({
      ok: true,
      count: credentialedIngestionRecords.length,
      credentialedIngestionRecords,
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
      eventType: "CREDENTIALED_INGESTION_ADMIN_READ_ERROR",
      domain: "connector",
      severity: "ERROR",
      message:
        "Credentialed ingestion admin read encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.connectors.credentialed-ingestion.admin",
      metadata: {
        route: "/api/connectors/credentialed-ingestion/admin",
        error:
          error instanceof Error
            ? error.message
            : "Unknown credentialed ingestion admin read error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/connectors/credentialed-ingestion/admin",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown credentialed ingestion admin read error.",
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
