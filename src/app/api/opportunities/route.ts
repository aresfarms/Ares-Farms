import { NextRequest, NextResponse } from "next/server";

import { persistGovernanceEvidence } from "@/lib/governance/evidenceStore";
import {
  OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
  OpportunityDiscoveryInput,
  evaluateOpportunityDiscovery,
} from "@/lib/opportunity/discoveryRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Borrower Opportunity Discovery API
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional authority over borrower-readable
 *   opportunity discovery.
 * - Vol II: prevents discovery from becoming approval, eligibility,
 *   guaranteed revenue, program approval, legal permission, lender
 *   commitment, official report publication, or regulatory or legal
 *   reliance.
 * - Vol III: provides deterministic, replay-safe composition across the
 *   program graph, marketplace, market signals, operating costs, geo
 *   suitability profiles, revenue opportunity registry, sellable catalog,
 *   and property discovery source stack.
 * - Vol III-B: attaches runtime guard, classification, version lineage,
 *   observability, explainability, replay verification, and audit-safe
 *   error envelope.
 * - Vol IV: routes missing-item handoffs to existing borrower discovery
 *   surfaces, readiness, applications, documents, and data rights.
 * - Vol V-VII: enforces claims governance, source authority, conformance,
 *   and public-surface disclosure boundaries on borrower-readable discovery
 *   output.
 */

type OpportunityDiscoveryRequest = OpportunityDiscoveryInput & {
  userId?: string | null;
};

function createOpportunityDiscoveryTraceId(): string {
  return `opportunity-discovery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createOpportunityDiscoveryTraceId();

  try {
    const body = (await req.json()) as OpportunityDiscoveryRequest;
    const actorId = body.userId ?? body.borrowerId ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "borrower.opportunity.discovery.view",
      module: "api.opportunities",
      traceId,
      schemaVersion: "opportunity-discovery-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/opportunities",
        borrowerGuidanceSurface: true,
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "OPPORTUNITY_DISCOVERY_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message:
          "Opportunity discovery runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.opportunities",
        metadata: {
          route: "/api/opportunities",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/opportunities",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked opportunity discovery request.",
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
      operation: "borrower.opportunity.discovery.view",
      module: "api.opportunities",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "opportunity-discovery-request-v0.1.0",
          "src/app/api/opportunities/route.ts",
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
          OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
          "src/lib/opportunity/discoveryRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "revenue-source-intelligence-runtime-v0.1.0",
          "src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts",
          traceId
        ),
        createRuntimeVersionRef(
          "runtime",
          "source-intelligence-runtime-v0.1.0",
          "src/lib/source-intelligence/sourceIntelligenceRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-opportunities-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["borrower", "authorized-operator", "governance"],
      sharingPermissions: [
        "borrower-guidance",
        "regulated-operational-review",
      ],
      aiUsagePermissions: ["summarize", "classify", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "not-a-program-approval",
        "not-a-revenue-guarantee",
        "not-a-property-certification",
        "not-a-source-certainty-claim",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-borrower-context-before-external-disclosure",
      ],
      consentRequirements: ["borrower-guidance-consent"],
    });

    const discoveryResult = evaluateOpportunityDiscovery(body);

    const classifiedOutput = classifyRecord(
      {
        discoveryResult,
        event: {
          eventType: "borrower.opportunity.discovery.viewed",
          applicationId: body.applicationId ?? null,
          borrowerId: body.borrowerId ?? null,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-opportunities-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: ["borrower", "authorized-operator", "governance"],
        sharingPermissions: [
          "borrower-guidance",
          "regulated-operational-review",
        ],
        aiUsagePermissions: ["summarize", "explain"],
        exportRestrictions: [
          "not-a-credit-decision",
          "not-a-program-approval",
          "not-a-revenue-guarantee",
          "not-a-property-certification",
          "not-a-source-certainty-claim",
          "not-a-live-fetch-result",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-review-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-guidance-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "borrower_opportunity_discovery",
      audience: "borrower",
      claimType: "recommendation",
      summary:
        "Borrower opportunity discovery generated as advisory translation-layer guidance only. No program approval, revenue guarantee, property certification, or source-certainty claim is created.",
      ruleVersion: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.95,
        Math.max(
          0.45,
          discoveryResult.totalOpportunityCount === 0
            ? 0.45
            : 0.65
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        sectionCount: discoveryResult.sections.length,
        totalOpportunityCount: discoveryResult.totalOpportunityCount,
        advisoryOnly: discoveryResult.advisoryOnly,
        liveFetchPerformed: discoveryResult.liveFetchPerformed,
        productionBlocked: discoveryResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "OPPORTUNITY_DISCOVERY_EVALUATED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower opportunity discovery composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.opportunities",
      metadata: {
        route: "/api/opportunities",
        applicationId: body.applicationId ?? null,
        sectionCount: discoveryResult.sections.length,
        totalOpportunityCount: discoveryResult.totalOpportunityCount,
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
          resourceType: "opportunity_discovery_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/opportunities",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "opportunity_discovery_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/opportunities",
            stage: "output",
            advisoryOnly: true,
            productionBlocked: true,
            liveFetchPerformed: false,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "borrower_opportunity_discovery",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: OPPORTUNITY_DISCOVERY_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          sectionCount: discoveryResult.sections.length,
          totalOpportunityCount: discoveryResult.totalOpportunityCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/opportunities",
          operation: "borrower.opportunity.discovery.view",
        },
      },
      metadata: {
        route: "/api/opportunities",
        operation: "borrower.opportunity.discovery.view",
      },
    });

    return NextResponse.json({
      ok: true,
      discoveryResult,
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
      eventType: "OPPORTUNITY_DISCOVERY_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Opportunity discovery API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.opportunities",
      metadata: {
        route: "/api/opportunities",
        error:
          error instanceof Error
            ? error.message
            : "Unknown opportunity discovery runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/opportunities",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown opportunity discovery runtime error.",
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
