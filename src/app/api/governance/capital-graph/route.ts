import { NextRequest, NextResponse } from "next/server";

import {
  CAPITAL_GRAPH_RUNTIME_VERSION,
  CapitalGraphInput,
  composeCapitalGraph,
} from "@/lib/capital-graph/capitalGraphRuntime";
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
 * Capital Graph API
 *
 * Master Volume Governance:
 * - Vol I (Constitutional Backbone): preserves constitutional authority
 *   over capital pathway composition; the route never claims authority.
 * - Vol II (Regulatory Governance): every program-level decision routes
 *   to the named sponsor authority; no regulatory determination is made.
 * - Vol III (Technical Infrastructure): deterministic, replay-safe
 *   composition over the canonical Capital Graph runtime.
 * - Vol III-B (Governance Runtime): runtime guard, classification,
 *   version lineage, observability, explainability, replay verification,
 *   and audit-safe error envelope.
 * - Vol IV (Operational Runbooks): routes capital pathway handoffs to
 *   financing pathway guidance, opportunity discovery, advanced
 *   intelligence, lender workflow, evidence engine, certification engine,
 *   registry framework, governance, and reviews.
 * - Vol V (Canonical Doctrines): preserves canonical claims governance,
 *   controlled disclosure, replay, audit, portability, and source-
 *   authority boundaries.
 * - Vol VI (Source Intelligence Integration): keeps every program
 *   behind a public-safe DTO; no raw sponsor records, no live external
 *   fetch, no source-certainty claim.
 */

type CapitalGraphRequest = CapitalGraphInput;

function createCapitalGraphTraceId(): string {
  return `capital-graph-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const traceId = createCapitalGraphTraceId();

  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as CapitalGraphRequest;
    const actorId = body.userId ?? body.reviewerRole ?? null;

    const runtimeGuard = runRuntimeGuard({
      operation: "governance.capital.graph.compose",
      module: "api.governance.capital-graph",
      traceId,
      schemaVersion: "capital-graph-request-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "RESTRICTED",
      replayRef: traceId,
      actorId,
      metadata: {
        route: "/api/governance/capital-graph",
        applicationId: body.applicationId ?? null,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "CAPITAL_GRAPH_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Capital Graph runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId,
        module: "api.governance.capital-graph",
        metadata: {
          route: "/api/governance/capital-graph",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/governance/capital-graph",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked Capital Graph request.",
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
      operation: "governance.capital.graph.compose",
      module: "api.governance.capital-graph",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "capital-graph-request-v0.1.0",
          "src/app/api/governance/capital-graph/route.ts",
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
          CAPITAL_GRAPH_RUNTIME_VERSION,
          "src/lib/capital-graph/capitalGraphRuntime.ts",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "RESTRICTED",
      sensitivityScope: "governance",
      classificationSource: "api-governance-capital-graph-route",
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
        "not-a-credit-decision",
        "not-a-public-verification",
        "not-a-regulatory-reliance",
        "not-a-lender-commitment",
        "not-a-live-external-action",
        "requires-human-review",
      ],
      redactionRequirements: [
        "redact-sensitive-application-content-before-external-disclosure",
        "redact-sovereign-participant-records-before-external-disclosure",
      ],
      consentRequirements: ["governance-capital-graph-review-consent"],
    });

    const capitalGraphResult = composeCapitalGraph(body);

    const classifiedOutput = classifyRecord(
      {
        capitalGraphResult,
        event: {
          eventType: "governance.capital.graph.composed",
          applicationId: capitalGraphResult.applicationId,
          replayRef: traceId,
          humanReviewRequired: true,
        },
      },
      {
        classificationLevel: "RESTRICTED",
        sensitivityScope: "governance",
        classificationSource:
          "api-governance-capital-graph-route-output",
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
        consentRequirements: ["governance-capital-graph-review-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "capital_graph_pack",
      audience: "governance",
      claimType: "recommendation",
      summary:
        "Capital Graph pack composed as advisory, replay-safe, audit-safe, conflict-preserving internal evidence only. No autonomous lending decision, program approval, public verification, regulatory reliance, lender commitment, tax-credit allocation, environmental clearance, carbon-credit issuance, or legal reliance is created.",
      ruleVersion: CAPITAL_GRAPH_RUNTIME_VERSION,
      overlayRefs: [],
      confidenceScore: Math.min(
        0.85,
        Math.max(
          0.45,
          0.45 + capitalGraphResult.summary.pathwayCandidateCount / 40
        )
      ),
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        categoryCount: capitalGraphResult.summary.categoryCount,
        programCount: capitalGraphResult.summary.programCount,
        matchedProgramCount:
          capitalGraphResult.summary.matchedProgramCount,
        pathwayCandidateCount:
          capitalGraphResult.summary.pathwayCandidateCount,
        conflictSignalCount:
          capitalGraphResult.summary.conflictSignalCount,
        sovereignProgramCount:
          capitalGraphResult.summary.sovereignProgramCount,
        noAutonomousLending: capitalGraphResult.noAutonomousLending,
        replaySafe: capitalGraphResult.replaySafe,
        auditSafe: capitalGraphResult.auditSafe,
        conflictPreserving: capitalGraphResult.conflictPreserving,
        federationScoped: capitalGraphResult.federationScoped,
        productionBlocked: capitalGraphResult.productionBlocked,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "CAPITAL_GRAPH_COMPOSED",
      domain: "operations",
      severity: "INFO",
      message:
        "Capital Graph pack composed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.governance.capital-graph",
      metadata: {
        route: "/api/governance/capital-graph",
        categoryCount: capitalGraphResult.summary.categoryCount,
        programCount: capitalGraphResult.summary.programCount,
        matchedProgramCount:
          capitalGraphResult.summary.matchedProgramCount,
        pathwayCandidateCount:
          capitalGraphResult.summary.pathwayCandidateCount,
        sovereignProgramCount:
          capitalGraphResult.summary.sovereignProgramCount,
        participantProgramCount:
          capitalGraphResult.summary.participantProgramCount,
        publicProgramCount:
          capitalGraphResult.summary.publicProgramCount,
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
          resourceType: "capital_graph_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/capital-graph",
            stage: "input",
            applicationId: body.applicationId ?? null,
          },
        },
        {
          resourceType: "capital_graph_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/governance/capital-graph",
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
        targetType: "capital_graph_pack",
        targetId: body.applicationId ?? traceId,
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: CAPITAL_GRAPH_RUNTIME_VERSION,
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: 1,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          categoryCount: capitalGraphResult.summary.categoryCount,
          programCount: capitalGraphResult.summary.programCount,
          matchedProgramCount:
            capitalGraphResult.summary.matchedProgramCount,
          pathwayCandidateCount:
            capitalGraphResult.summary.pathwayCandidateCount,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/governance/capital-graph",
          operation: "governance.capital.graph.compose",
        },
      },
      metadata: {
        route: "/api/governance/capital-graph",
        operation: "governance.capital.graph.compose",
      },
    });

    return NextResponse.json({
      ok: true,
      capitalGraphResult,
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
      eventType: "CAPITAL_GRAPH_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message:
        "Capital Graph API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.governance.capital-graph",
      metadata: {
        route: "/api/governance/capital-graph",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Capital Graph runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/governance/capital-graph",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Capital Graph runtime error.",
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
