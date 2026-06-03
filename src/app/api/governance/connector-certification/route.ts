import { NextRequest, NextResponse } from "next/server";

import {
  CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
  ConnectorCertificationEngineInput,
  evaluateConnectorCertification,
} from "@/lib/connectors/certificationRuntime";
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
 * Connector Certification API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over connector certification
 *   posture; the runtime describes internal review state and never
 *   replaces external promotion, public verification, or live execution.
 * - Vol II: prevents posture from becoming live external action, public
 *   verification, regulatory reliance, lender commitment, environmental
 *   clearance, payment authorization, or legal reliance.
 * - Vol III: provides deterministic, replay-safe per-connector posture
 *   across review, certification evidence, rollback, monitoring, and
 *   activation checks.
 * - Vol III-B: attaches runtime guard, classification (RESTRICTED), version
 *   lineage, observability, explainability, replay verification, and
 *   audit-safe error envelope.
 * - Vol IV: routes posture handoffs to the Module 10 Connector
 *   Certification Console, Source Ingestion Gate, Live Scraper
 *   Activation Gate, Registry Framework, Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V-VII: enforces canonical claims governance, controlled
 *   disclosure, replay, audit, portability, source authority, and
 *   conformance on every composed posture.
 */

type ConnectorCertificationRequest = ConnectorCertificationEngineInput & {
  userId?: string | null;
};

function createConnectorCertificationTraceId(): string {
  return `connector-certification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createConnectorCertificationTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as ConnectorCertificationRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.connector.certification.compose",
      module: "api.governance.connector-certification",
      traceId,
      schemaVersion: "connector-certification-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/connector-certification",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CONNECTOR_CERTIFICATION_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Connector certification runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.connector-certification",
        metadata: {
          route: "/api/governance/connector-certification",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/connector-certification",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked connector certification request.",
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

    const versionRuntime = evaluateVersionRuntime({
      operation: "governance.connector.certification.compose",
      module: "api.governance.connector-certification",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "connector-certification-request-v0.1.0",
          "src/app/api/governance/connector-certification/route.ts",
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
          "rules",
          CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
          "src/lib/connectors/certificationRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-connector-certification-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-operator",
        "governance",
        "auditor",
        "regulator",
      ],
      sharingPermissions: [
        "regulated-operational-review",
        "governance-evidence-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-live-external-action",
        "not-an-external-promotion",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-credential-vault-refs-before-external-disclosure",
      ],
      consentRequirements: ["governance-connector-review-consent"],
    });

    const postureResult = evaluateConnectorCertification(body);

    const classifiedOutput = classifyRecord(
      {
        postureResult,
        event: {
          eventType: "governance.connector.certification.composed",
          applicationId: body.applicationId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-connector-certification-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-operator",
          "governance",
          "auditor",
          "regulator",
        ],
        sharingPermissions: [
          "regulated-operational-review",
          "governance-evidence-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-live-external-action",
          "not-an-external-promotion",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-an-environmental-determination",
          "not-a-payment-authorization",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["governance-connector-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "connector_certification_posture",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Connector certification posture composed as review-bound internal evidence only. No live external connector execution, external promotion, public verification, regulatory reliance, lender commitment, or legal reliance is created.",
      ruleVersion: CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.9,
        Math.max(
          0.45,
          0.45 + postureResult.summary.overallReadinessPercent / 200
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        connectorCount: postureResult.summary.connectorCount,
        certifiedConnectorCount:
          postureResult.summary.certifiedConnectorCount,
        blockedConnectorCount: postureResult.summary.blockedConnectorCount,
        liveExecutionBlocked: postureResult.liveExecutionBlocked,
        productionBlocked: postureResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CONNECTOR_CERTIFICATION_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Connector certification posture composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.connector-certification",
      metadata: {
        route: "/api/governance/connector-certification",
        connectorCount: postureResult.summary.connectorCount,
        certifiedConnectorCount:
          postureResult.summary.certifiedConnectorCount,
        blockedConnectorCount: postureResult.summary.blockedConnectorCount,
        overallReadinessPercent: postureResult.summary.overallReadinessPercent,
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
          resourceType: "connector_certification_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/connector-certification",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "connector_certification_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/connector-certification",
            stage: "output",
            connectorCertificationInternalOnly: true,
            liveExecutionBlocked: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "connector_certification_posture",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          connectorCount: postureResult.summary.connectorCount,
          certifiedConnectorCount:
            postureResult.summary.certifiedConnectorCount,
          blockedConnectorCount: postureResult.summary.blockedConnectorCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/connector-certification",
          operation: "governance.connector.certification.compose",
        },
      },
      metadata: {
        route: "/api/governance/connector-certification",
        operation: "governance.connector.certification.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      postureResult,
      event: classifiedOutput.event,
      governance: {
        traceId,
        runtimeGuard,
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
      eventType: "CONNECTOR_CERTIFICATION_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Connector certification API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.connector-certification",
      metadata: {
        route: "/api/governance/connector-certification",
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector certification runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/connector-certification",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown connector certification runtime error.",
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
