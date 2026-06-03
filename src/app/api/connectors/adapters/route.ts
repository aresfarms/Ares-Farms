import { NextRequest, NextResponse } from "next/server";

import { evaluateAccess } from "@/lib/auth/accessControl";
import { persistCertifiedConnectorAdapter } from "@/lib/connectors/certifiedConnectorAdapterStore";
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
 * Certified Connector Adapter API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed connector-promotion authority and accountable access.
 *
 * - Vol II: Regulatory Governance
 *   Prevents unapproved USDA, SBA, property, borrower, or institutional
 *   external-source reliance in regulated workflows.
 *
 * - Vol III: Technical Infrastructure
 *   Records replay-safe, schema-aware adapter certification state before any
 *   live connector execution can be promoted.
 *
 * - Vol IV: Operational Runbooks
 *   Supports credential review, outage handling, isolation, escalation,
 *   certification review, and audit preparation.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces source authority, consent, classification, replayability,
 *   observability, version lineage, and evidence preservation.
 */

type ConnectorAdapterRequest = {
  userId?: string | null;
  actorId?: string | null;
  tenantId?: string | null;
  role?: string | null;
  adapterId?: string | null;
  adapterName?: string | null;
  adapterType?: string | null;
  sourceId?: string | null;
  source?: string | null;
  sourceAuthorityRef?: string | null;
  certificationStatus?: string | null;
  credentialRef?: string | null;
  credentialStatus?: string | null;
  outagePolicyRef?: string | null;
  outageStatus?: string | null;
  replayPolicyRef?: string | null;
  replayStatus?: string | null;
  schemaContractVersion?: string | null;
  metadata?: Record<string, unknown>;
};

function createConnectorAdapterTraceId(): string {
  return `connector-adapter-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function actorId(body: ConnectorAdapterRequest): string | null {
  return body.actorId ?? body.userId ?? null;
}

function routeActorRole(body: ConnectorAdapterRequest): unknown {
  return body.role ?? body.metadata?.role ?? body.metadata?.actorRole ?? "user";
}

function requestedSourceId(body: ConnectorAdapterRequest): string {
  return body.sourceId ?? body.source ?? "";
}

function adapterResponse(
  adapter: Awaited<ReturnType<typeof persistCertifiedConnectorAdapter>>["adapter"]
) {
  return {
    id: adapter.id,
    adapterId: adapter.adapterId,
    adapterName: adapter.adapterName,
    adapterType: adapter.adapterType,
    sourceId: adapter.sourceId,
    sourceName: adapter.sourceName,
    sourceType: adapter.sourceType,
    sourceAuthorityRef: adapter.sourceAuthorityRef,
    certificationStatus: adapter.certificationStatus,
    liveCallsAllowed: adapter.liveCallsAllowed,
    credentialRef: adapter.credentialRef,
    credentialStatus: adapter.credentialStatus,
    credentialVaultRequired: adapter.credentialVaultRequired,
    outagePolicyRef: adapter.outagePolicyRef,
    outageStatus: adapter.outageStatus,
    replayPolicyRef: adapter.replayPolicyRef,
    replayStatus: adapter.replayStatus,
    schemaContractVersion: adapter.schemaContractVersion,
    connectorConsentRequired: adapter.connectorConsentRequired,
    isolationRequired: adapter.isolationRequired,
    humanReviewRequired: adapter.humanReviewRequired,
    lastCertifiedAt: adapter.lastCertifiedAt,
    revokedAt: adapter.revokedAt,
    createdAt: adapter.createdAt,
    updatedAt: adapter.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  const traceId = createConnectorAdapterTraceId();

  try {
    const body = (await req.json()) as ConnectorAdapterRequest;
    const actor = actorId(body);
    const sourceId = requestedSourceId(body);

    const runtimeGuard = runRuntimeGuard({
      operation: "connector-adapter.certify",
      module: "api.connectors.adapters",
      traceId,
      schemaVersion: "certified-connector-adapters-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId: actor,
      metadata: {
        route: "/api/connectors/adapters",
        sourceId,
        adapterId: body.adapterId ?? null,
        liveCallExpected: false,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_ADAPTER_RUNTIME_BLOCKED",
        domain: "connector",
        severity: "WARN",
        message:
          "Connector adapter certification was blocked by runtime governance.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.adapters",
        metadata: {
          route: "/api/connectors/adapters",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/adapters",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked connector adapter certification.",
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
      allowedRoles: ["operator", "auditor", "admin", "governance"],
      operation: "connector-adapter.certify",
      module: "api.connectors.adapters",
      traceId,
      actorId: actor,
      tenantId: body.tenantId ?? null,
    });

    if (!access.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_ADAPTER_ACCESS_DENIED",
        domain: "security",
        severity: "WARN",
        message:
          "Connector adapter certification was denied by role access control.",
        traceId,
        replayRef: traceId,
        actorId: actor,
        module: "api.connectors.adapters",
        metadata: {
          route: "/api/connectors/adapters",
          access,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/connectors/adapters",
          accessDenied: true,
          access,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Role is not authorized for connector adapter certification.",
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
      operation: "connector-adapter.certify",
      module: "api.connectors.adapters",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "certified-connector-adapters-api-v0.1.0",
          "src/app/api/connectors/adapters/route.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "certified-connector-adapters-v0.1.0",
          "src/db/schema/certifiedConnectorAdapters.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "schema",
          "external-data-sources-v0.1.0",
          "src/db/schema/externalDataConnectors.ts",
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
          "certified-connector-adapter-runtime-v0.1.0",
          "src/lib/connectors/certifiedConnectorAdapterStore.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "connector-source-registry-v0.1.0",
          "src/lib/connectors/connectorSourceRegistry.ts",
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

    const classifiedInput = classifyRecord(
      {
        adapterId: body.adapterId ?? null,
        adapterName: body.adapterName ?? null,
        adapterType: body.adapterType ?? null,
        sourceId,
        sourceAuthorityRef: body.sourceAuthorityRef ?? null,
        certificationStatus: body.certificationStatus ?? null,
        credentialRef: body.credentialRef ?? null,
        credentialStatus: body.credentialStatus ?? null,
        outagePolicyRef: body.outagePolicyRef ?? null,
        outageStatus: body.outageStatus ?? null,
        replayPolicyRef: body.replayPolicyRef ?? null,
        replayStatus: body.replayStatus ?? null,
        schemaContractVersion: body.schemaContractVersion ?? null,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-connectors-adapters-route",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "connector-certification-review",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["classify", "summarize"],
        exportRestrictions: [
          "credential-references-only",
          "no-secret-material",
          "not-official-external-source-data",
        ],
        redactionRequirements: [
          "redact-credential-references-before-public-disclosure",
        ],
        consentRequirements: ["connector-consent-governance-review"],
      }
    );

    const certification = await persistCertifiedConnectorAdapter({
      traceId,
      adapterId: body.adapterId,
      adapterName: body.adapterName,
      adapterType: body.adapterType,
      sourceId,
      sourceAuthorityRef: body.sourceAuthorityRef,
      certificationStatus: body.certificationStatus,
      credentialRef: body.credentialRef,
      credentialStatus: body.credentialStatus,
      outagePolicyRef: body.outagePolicyRef,
      outageStatus: body.outageStatus,
      replayPolicyRef: body.replayPolicyRef,
      replayStatus: body.replayStatus,
      schemaContractVersion: body.schemaContractVersion,
      actorId: actor,
      metadata: {
        ...(body.metadata ?? {}),
        access,
      },
    });

    const classifiedOutput = classifyRecord(
      {
        adapterId: certification.adapter.adapterId,
        sourceId: certification.adapter.sourceId,
        certificationStatus: certification.certificationStatus,
        liveCallsAllowed: certification.liveCallsAllowed,
        controls: certification.controls,
        liveCallPerformed: false,
        officialDataFetched: false,
        humanReviewRequired: certification.adapter.humanReviewRequired,
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "security",
        classificationSource: "api-connectors-adapters-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "auditor",
          "governance",
        ],
        sharingPermissions: [
          "connector-certification-review",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "certification-record-only",
          "does-not-authorize-this-route-to-fetch-live-data",
          "requires-certified-adapter-execution-path-before-live-use",
        ],
        redactionRequirements: [
          "redact-credential-references-before-public-disclosure",
        ],
        consentRequirements: ["connector-consent-governance-review"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: String(certification.adapter.id),
      outputType: "connector_adapter_certification",
      audience: "governance",
      claimType: "fact",
      summary:
        "Connector adapter certification was evaluated against source authority, credential, outage, replay, and schema-contract controls without performing a live external data call.",
      ruleVersion: "certified-connector-adapter-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      evidenceRefs: [
        {
          refId: certification.adapter.sourceId,
          sourceType: "connector",
          sourceName: certification.adapter.sourceName,
          sourceVersion: certification.source.sourceVersion,
          replayRef: traceId,
        },
      ],
      metadata: {
        adapterId: certification.adapter.adapterId,
        certificationStatus: certification.certificationStatus,
        liveCallsAllowed: certification.liveCallsAllowed,
        controls: certification.controls,
        liveCallPerformed: false,
      },
    });

    const observability = createObservabilityEvent({
      eventType: certification.liveCallsAllowed
        ? "CONNECTOR_ADAPTER_CERTIFIED"
        : "CONNECTOR_ADAPTER_CERTIFICATION_BLOCKED",
      domain: "connector",
      severity: certification.liveCallsAllowed ? "INFO" : "WARN",
      message: certification.liveCallsAllowed
        ? "Connector adapter certification was recorded with live-call eligibility. No live call was performed by this route."
        : "Connector adapter certification was blocked or remains pending because one or more required controls are incomplete.",
      traceId,
      replayRef: traceId,
      actorId: actor,
      module: "api.connectors.adapters",
      metadata: {
        adapterId: certification.adapter.adapterId,
        sourceId: certification.adapter.sourceId,
        certificationStatus: certification.certificationStatus,
        liveCallsAllowed: certification.liveCallsAllowed,
        controls: certification.controls,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "connector_adapter_certification_input",
          resourceId: body.adapterId ?? traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/adapters",
            stage: "input",
            sourceId: certification.adapter.sourceId,
          },
        },
        {
          resourceType: "connector_adapter_certification_output",
          resourceId: String(certification.adapter.id),
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/connectors/adapters",
            stage: "output",
            sourceId: certification.adapter.sourceId,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "certified_connector_adapter",
        targetId: String(certification.adapter.id),
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "certified-connector-adapters-api-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          adapterId: certification.adapter.adapterId,
          sourceId: certification.adapter.sourceId,
          certificationStatus: certification.certificationStatus,
          liveCallsAllowed: certification.liveCallsAllowed,
          liveCallPerformed: false,
          controls: certification.controls,
        },
        metadata: {
          route: "/api/connectors/adapters",
          operation: "connector-adapter.certify",
        },
      },
      metadata: {
        route: "/api/connectors/adapters",
        operation: "connector-adapter.certify",
      },
    });

    return NextResponse.json({
      ok: true,
      adapter: adapterResponse(certification.adapter),
      source: certification.source,
      result: {
        certificationStatus: certification.certificationStatus,
        liveCallsAllowed: certification.liveCallsAllowed,
        liveCallPerformed: false,
        officialDataFetched: false,
        controls: certification.controls,
        message: certification.message,
      },
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
      eventType: "CONNECTOR_ADAPTER_CERTIFICATION_ERROR",
      domain: "connector",
      severity: "ERROR",
      message:
        "Connector adapter certification encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.connectors.adapters",
      metadata: {
        route: "/api/connectors/adapters",
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector adapter certification error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/connectors/adapters",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector adapter certification error.",
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
