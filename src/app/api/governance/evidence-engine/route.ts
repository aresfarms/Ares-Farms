import { NextRequest, NextResponse } from "next/server";

import {
  EvidencePackInput,
  GOVERNANCE_EVIDENCE_ENGINE_VERSION,
  composeGovernanceEvidencePack,
} from "@/lib/governance/evidenceEngine";
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
 * Governance Evidence Engine API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over evidence composition.
 * - Vol II: prevents composition from becoming approval, official
 *   certification, public verification, regulatory reliance, lender
 *   commitment, credit decision, environmental clearance, payment
 *   authorization, or legal reliance.
 * - Vol III: provides deterministic, replay-safe composition across module
 *   manifests, event contracts, handoff trails, audit anchors, replay
 *   verification refs, classification posture, observability events,
 *   content claims posture, and human authority mapping.
 * - Vol III-B: attaches runtime guard, classification, version lineage,
 *   observability, explainability, replay verification, and audit-safe
 *   error envelope.
 * - Vol IV: routes pack handoffs to Module 16 Evidence Packet Workspace,
 *   Audit Replay Console, Reviews, Governance, and Module Readiness
 *   Control Tower.
 * - Vol V-VII: enforces canonical claims governance, controlled disclosure,
 *   replay, audit, portability, source authority, and conformance on every
 *   composed pack.
 */

type GovernanceEvidenceRequest = EvidencePackInput;

function createEvidenceEngineTraceId(): string {
  return `governance-evidence-engine-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createEvidenceEngineTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as GovernanceEvidenceRequest;
    const actorId = body.userId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.evidence.pack.compose",
      module: "api.governance.evidence-engine",
      traceId,
      schemaVersion: "governance-evidence-pack-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/evidence-engine",
        packIntent: body.packIntent ?? "INTERNAL_REVIEW",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "GOVERNANCE_EVIDENCE_ENGINE_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Governance evidence engine runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.evidence-engine",
        metadata: {
          route: "/api/governance/evidence-engine",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/evidence-engine",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked governance evidence engine request.",
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
      operation: "governance.evidence.pack.compose",
      module: "api.governance.evidence-engine",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "governance-evidence-pack-request-v0.1.0",
          "src/app/api/governance/evidence-engine/route.ts",
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
          GOVERNANCE_EVIDENCE_ENGINE_VERSION,
          "src/lib/governance/evidenceEngine.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-evidence-engine-route",
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
        "not-an-official-certification",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-borrower-identifiers-before-external-disclosure",
        "redact-sensitive-application-content-before-external-disclosure",
      ],
      consentRequirements: ["governance-evidence-review-consent"],
    });

    const packResult = composeGovernanceEvidencePack(body);

    const classifiedOutput = classifyRecord(
      {
        packResult,
        event: {
          eventType: "governance.evidence.pack.composed",
          packIntent: packResult.packIntent ?? "INTERNAL_REVIEW",
          applicationId: packResult.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-evidence-engine-route-output",
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
          "not-an-official-certification",
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
        consentRequirements: ["governance-evidence-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "governance_evidence_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Governance evidence pack composed as advisory, review-bound evidence aggregation only. No approval, official certification, public verification, regulatory reliance, lender commitment, or legal reliance is created.",
      ruleVersion: GOVERNANCE_EVIDENCE_ENGINE_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.9,
        Math.max(
          0.45,
          packResult.summary.moduleCount === 0
            ? 0.45
            : 0.55 +
                Math.min(0.35, packResult.summary.moduleCount / 100)
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        packIntent: packResult.packIntent ?? "INTERNAL_REVIEW",
        moduleCount: packResult.summary.moduleCount,
        eventContractCount: packResult.summary.eventContractCount,
        handoffCount: packResult.summary.handoffCount,
        humanAuthorityCount: packResult.summary.humanAuthorityCount,
        evidenceOnly: packResult.evidenceOnly,
        productionBlocked: packResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "GOVERNANCE_EVIDENCE_PACK_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Governance evidence pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.evidence-engine",
      metadata: {
        route: "/api/governance/evidence-engine",
        packIntent: packResult.packIntent ?? "INTERNAL_REVIEW",
        moduleCount: packResult.summary.moduleCount,
        eventContractCount: packResult.summary.eventContractCount,
        handoffCount: packResult.summary.handoffCount,
        humanAuthorityCount: packResult.summary.humanAuthorityCount,
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
          resourceType: "governance_evidence_pack_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/evidence-engine",
            stage: "input",
            packIntent: packResult.packIntent ?? "INTERNAL_REVIEW",
          },
        },
        {
          resourceType: "governance_evidence_pack_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/evidence-engine",
            stage: "output",
            evidenceOnly: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "governance_evidence_pack",
        targetId:
          packResult.applicationId ?? body.packIntent ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: GOVERNANCE_EVIDENCE_ENGINE_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          moduleCount: packResult.summary.moduleCount,
          eventContractCount: packResult.summary.eventContractCount,
          handoffCount: packResult.summary.handoffCount,
          humanAuthorityCount: packResult.summary.humanAuthorityCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/evidence-engine",
          operation: "governance.evidence.pack.compose",
        },
      },
      metadata: {
        route: "/api/governance/evidence-engine",
        operation: "governance.evidence.pack.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      packResult,
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
      eventType: "GOVERNANCE_EVIDENCE_ENGINE_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Governance evidence engine API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.evidence-engine",
      metadata: {
        route: "/api/governance/evidence-engine",
        error:
          error instanceof Error
            ? error.message
            : "Unknown governance evidence engine runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/evidence-engine",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown governance evidence engine runtime error.",
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
