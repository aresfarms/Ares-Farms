import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  OpportunityDiscoveryV2Input,
  composeOpportunityDiscoveryV2,
} from "@/lib/opportunity/discoveryV2Runtime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Opportunity Discovery v2 API
 *
 * Master Volume Governance:
 * - Vol I: preserves Customer Type review boundaries, Capital Graph
 *   sponsor authority, and legacy v1 discovery boundaries; the route
 *   never grants opportunity authority.
 * - Vol II: every composed opportunity card routes to the named
 *   sponsor / regulatory authority for review.
 * - Vol III: deterministic, replay-safe composition with explicit
 *   version lineage chaining v2 → Financing Pathway Engine v2 →
 *   Revenue Intelligence v2 → Customer Type → Capital Graph → legacy
 *   v1 opportunity discovery → legacy v1 revenue-source-intelligence.
 * - Vol III-B: runtime guard, classification, version lineage,
 *   observability, explainability, replay verification, audit-safe
 *   error envelope.
 * - Vol IV: routes governed handoffs to Capital Graph, Customer Type
 *   Registry, Revenue Intelligence v2, Financing Pathway Engine v2,
 *   borrower opportunities, revenue opportunities, customer revenue,
 *   lender workflow, advanced intelligence, evidence engine,
 *   certification engine, registry framework, evidence packets,
 *   audit replay, governance, reviews, and module readiness.
 * - Vol V: preserves canonical claims governance, controlled
 *   disclosure, replay, audit, portability, and source-authority
 *   boundaries.
 * - Vol VI: keeps every composed opportunity card behind a public-
 *   safe DTO; no raw borrower, sponsor, or property records, no live
 *   external fetch, no source-certainty claim.
 */

type OpportunityDiscoveryV2Request = OpportunityDiscoveryV2Input;

function createOpportunityDiscoveryV2TraceId(): string {
  return `opportunity-discovery-v2-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createOpportunityDiscoveryV2TraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as OpportunityDiscoveryV2Request;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.opportunity.discovery.v2.compose",
      module: "api.governance.opportunity-discovery-v2",
      traceId,
      schemaVersion: "opportunity-discovery-v2-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/opportunity-discovery-v2",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "OPPORTUNITY_DISCOVERY_V2_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Opportunity Discovery v2 runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.opportunity-discovery-v2",
        metadata: {
          route: "/api/governance/opportunity-discovery-v2",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/opportunity-discovery-v2",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime governance guard blocked Opportunity Discovery v2 request.",
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
      operation: "governance.opportunity.discovery.v2.compose",
      module: "api.governance.opportunity-discovery-v2",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "opportunity-discovery-v2-request-v0.1.0",
          "src/app/api/governance/opportunity-discovery-v2/route.ts",
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
          OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
          "src/lib/opportunity/discoveryV2Runtime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "rules",
          "financing-pathway-engine-v2-runtime-v0.1.0",
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
          "opportunity-discovery-runtime-v0.1.0",
          "src/lib/opportunity/discoveryRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource:
        "api-governance-opportunity-discovery-v2-route",
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
        "not-an-opportunity-determination",
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "not-a-source-certainty-claim",
        "not-a-live-external-action",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: [
        "governance-opportunity-discovery-v2-review-consent",
      ],
    });

    const v2Result = composeOpportunityDiscoveryV2(body);

    const classifiedOutput = classifyRecord(
      {
        v2Result,
        event: {
          eventType: "governance.opportunity.discovery.v2.composed",
          applicationId: v2Result.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-opportunity-discovery-v2-route-output",
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
          "not-an-opportunity-determination",
          "not-a-credit-decision",
          "not-a-public-verification",
          "not-a-regulatory-reliance",
          "not-a-lender-commitment",
          "not-a-program-approval",
          "not-a-tax-credit-allocation",
          "not-an-environmental-clearance",
          "not-a-carbon-credit-issuance",
          "not-a-source-certainty-claim",
          "not-a-live-external-action",
          "not-a-legal-reliance",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
          "redact-sovereign-participant-records-before-external-disclosure",
        ],
        consentRequirements: [
          "governance-opportunity-discovery-v2-review-consent",
        ],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "opportunity_discovery_v2_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Opportunity Discovery v2 pack composed as advisory, replay-safe, audit-safe, conflict-preserving internal evidence only. No approval, autonomous customer eligibility determination, autonomous pathway determination, autonomous opportunity determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, source certainty claim, or legal reliance is created.",
      ruleVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(0.45, 0.45 + v2Result.summary.totalGrantCardCount / 60)
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        customerProfileCount: v2Result.summary.customerProfileCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
        totalLegacyCardCount: v2Result.summary.totalLegacyCardCount,
        conflictSignalCount: v2Result.summary.conflictSignalCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCardCount: v2Result.summary.sovereignCardCount,
        replaySafe: v2Result.replaySafe,
        auditSafe: v2Result.auditSafe,
        conflictPreserving: v2Result.conflictPreserving,
        federationScoped: v2Result.federationScoped,
        productionBlocked: v2Result.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "OPPORTUNITY_DISCOVERY_V2_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Opportunity Discovery v2 pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.opportunity-discovery-v2",
      metadata: {
        route: "/api/governance/opportunity-discovery-v2",
        customerProfileCount: v2Result.summary.customerProfileCount,
        totalGrantCardCount: v2Result.summary.totalGrantCardCount,
        totalLegacyCardCount: v2Result.summary.totalLegacyCardCount,
        crossSourceConflictCount:
          v2Result.summary.crossSourceConflictCount,
        sovereignCardCount: v2Result.summary.sovereignCardCount,
        participantCardCount: v2Result.summary.participantCardCount,
        publicCardCount: v2Result.summary.publicCardCount,
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
          resourceType: "opportunity_discovery_v2_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/opportunity-discovery-v2",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "opportunity_discovery_v2_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/opportunity-discovery-v2",
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
        targetType: "opportunity_discovery_v2_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          customerProfileCount: v2Result.summary.customerProfileCount,
          totalGrantCardCount: v2Result.summary.totalGrantCardCount,
          totalLegacyCardCount: v2Result.summary.totalLegacyCardCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/opportunity-discovery-v2",
          operation: "governance.opportunity.discovery.v2.compose",
        },
      },
      metadata: {
        route: "/api/governance/opportunity-discovery-v2",
        operation: "governance.opportunity.discovery.v2.compose",
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
      eventType: "OPPORTUNITY_DISCOVERY_V2_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Opportunity Discovery v2 API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.opportunity-discovery-v2",
      metadata: {
        route: "/api/governance/opportunity-discovery-v2",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Opportunity Discovery v2 runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/opportunity-discovery-v2",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Opportunity Discovery v2 runtime error.",
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
