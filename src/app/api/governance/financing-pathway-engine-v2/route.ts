import { NextRequest, NextResponse } from "next/server";

import {
  FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
  FinancingPathwayEngineV2Input,
  composeFinancingPathwayEngineV2,
} from "@/lib/financing/pathwayEngineV2Runtime";
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
 * Financing Pathway Engine v2 API
 *
 * Master Volume Governance:
 * - Vol I: preserves Customer Type review boundaries and Capital Graph
 *   sponsor authority; the route never grants pathway authority.
 * - Vol II: every composed pathway candidate routes to the named
 *   sponsor / regulatory authority for review.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining v2 → Revenue Intelligence v2 → Customer
 *   Type → Capital Graph → legacy v1 financing-pathway-engine.
 * - Vol III-B: runtime guard, classification, version lineage,
 *   observability, explainability, replay verification, audit-safe
 *   error envelope.
 * - Vol IV: routes governed handoffs to the Capital Graph, Customer
 *   Type Registry, Revenue Intelligence v2, borrower opportunities,
 *   revenue opportunities, customer revenue, lender workflow,
 *   advanced intelligence, evidence engine, certification engine,
 *   registry framework, governance, reviews, evidence packets,
 *   audit replay, and module readiness.
 * - Vol V: preserves canonical claims governance, controlled
 *   disclosure, replay, audit, portability, and source-authority
 *   boundaries.
 * - Vol VI: keeps every composed pathway entry behind a public-safe
 *   DTO; no raw sponsor or borrower records, no live external fetch,
 *   no source-certainty claim.
 */

type FinancingPathwayEngineV2Request = FinancingPathwayEngineV2Input;

function createFinancingPathwayEngineV2TraceId(): string {
  return `financing-pathway-engine-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createFinancingPathwayEngineV2TraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as FinancingPathwayEngineV2Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.financing.pathway.engine.v2.compose",
      module: "api.governance.financing-pathway-engine-v2",
      traceId,
      schemaVersion: "financing-pathway-engine-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/financing-pathway-engine-v2",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "FINANCING_PATHWAY_ENGINE_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Financing Pathway Engine v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.financing-pathway-engine-v2",
        metadata: {
          route: "/api/governance/financing-pathway-engine-v2",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/financing-pathway-engine-v2",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Financing Pathway Engine v2 request.",
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
      operation: "governance.financing.pathway.engine.v2.compose",
      module: "api.governance.financing-pathway-engine-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "financing-pathway-engine-v2-request-v0.1.0",
          "src/app/api/governance/financing-pathway-engine-v2/route.ts",
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
          FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
          "src/lib/financing/pathwayEngineV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "revenue-intelligence-v2-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueIntelligenceV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "customer-type-runtime-v0.1.0",
          "src/lib/customer-types/customerTypeRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "capital-graph-runtime-v0.1.0",
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "financing-pathway-engine-v0.1.0",
          "src/lib/financing/pathwayEngine.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-financing-pathway-engine-v2-route",
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
        "not-an-approval",
        "not-an-eligibility-determination",
        "not-a-pathway-determination",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "not-a-live-external-action",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-financing-pathway-engine-v2-review-consent",
      ],
    });

    const v2Result = composeFinancingPathwayEngineV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType: "governance.financing.pathway.engine.v2.composed",
          applicationId: v2Result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-financing-pathway-engine-v2-route-output",
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
          "not-an-approval",
          "not-an-eligibility-determination",
          "not-a-pathway-determination",
          "not-a-credit-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-live-external-action",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-financing-pathway-engine-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "financing_pathway_engine_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Financing Pathway Engine v2 pack composed as advisory, replay-safe, audit-safe, conflict-preserving internal evidence only. No approval, autonomous customer eligibility determination, autonomous pathway determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, or legal reliance is created.",
      ruleVersion: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + v2Result.summary.totalCandidateCount / 60)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        customerProfileCount: v2Result.summary.customerProfileCount,
        totalCandidateCount: v2Result.summary.totalCandidateCount,
        totalLegacyCandidateCount:
          v2Result.summary.totalLegacyCandidateCount,
        conflictSignalCount: v2Result.summary.conflictSignalCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCandidateCount:
          v2Result.summary.sovereignCandidateCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "FINANCING_PATHWAY_ENGINE_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Financing Pathway Engine v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.financing-pathway-engine-v2",
      metadata: {
        route: "/api/governance/financing-pathway-engine-v2",
        customerProfileCount: v2Result.summary.customerProfileCount,
        totalCandidateCount: v2Result.summary.totalCandidateCount,
        totalLegacyCandidateCount:
          v2Result.summary.totalLegacyCandidateCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCandidateCount:
          v2Result.summary.sovereignCandidateCount,
        participantCandidateCount:
          v2Result.summary.participantCandidateCount,
        publicCandidateCount: v2Result.summary.publicCandidateCount,
        federationGatedCount: v2Result.summary.federationGatedCount,
        missingInformationCount:
          v2Result.summary.missingInformationCount,
        reviewRequiredCount: v2Result.summary.reviewRequiredCount,
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
          resourceType: "financing_pathway_engine_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/financing-pathway-engine-v2",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "financing_pathway_engine_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/financing-pathway-engine-v2",
            stage: "output",
            advisoryOnly: true,
            replaySafe: true,
            auditSafe: true,
            conflictPreserving: true,
            federationScoped: true,
            productionBlocked: true,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "financing_pathway_engine_v2_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          customerProfileCount: v2Result.summary.customerProfileCount,
          totalCandidateCount: v2Result.summary.totalCandidateCount,
          totalLegacyCandidateCount:
            v2Result.summary.totalLegacyCandidateCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/financing-pathway-engine-v2",
          operation: "governance.financing.pathway.engine.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/financing-pathway-engine-v2",
        operation: "governance.financing.pathway.engine.v2.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      v2Result,
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
      eventType: "FINANCING_PATHWAY_ENGINE_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Financing Pathway Engine v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.financing-pathway-engine-v2",
      metadata: {
        route: "/api/governance/financing-pathway-engine-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Financing Pathway Engine v2 runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/financing-pathway-engine-v2",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Financing Pathway Engine v2 runtime error.",
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
