import { NextRequest, NextResponse } from "next/server";

import {
  calculatePropertyScore,
  type ApplicantInput,
} from "@/services/scoring/calculatePropertyScore";
import { persistRouteGovernanceEvidence } from "@/lib/governance/routeEvidence";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";

/**
 * Test Score API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Keeps test scoring advisory, governed, and subordinate to constitutional rules.
 *
 * - Vol II: Regulatory Governance
 *   Prevents test scoring from being treated as a final credit, financing,
 *   legal, permitting, or regulatory determination.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe scoring smoke tests with durable version,
 *   classification, observability, and replay-verification evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports backend health checks, operator diagnostics, and controlled testing.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces classification, explainability, observability, replayability,
 *   version lineage, and evidence preservation.
 */

type TestScoreRequestBody = Partial<ApplicantInput> & {
  borrowerId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

const DEFAULT_SCORE_INPUT: ApplicantInput = {
  creditScore: 690,
  liquidity: 150000,
  experienceLevel: 6,
  collateralEquity: 250000,
  acreage: 80,
};

function createTestScoreTraceId(): string {
  return `test-score-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function toNumberOrDefault(value: unknown, fallback: number): number {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeScoreInput(body: TestScoreRequestBody = {}): ApplicantInput {
  return {
    creditScore: toNumberOrDefault(
      body.creditScore,
      DEFAULT_SCORE_INPUT.creditScore
    ),
    liquidity: toNumberOrDefault(body.liquidity, DEFAULT_SCORE_INPUT.liquidity),
    experienceLevel: toNumberOrDefault(
      body.experienceLevel,
      DEFAULT_SCORE_INPUT.experienceLevel
    ),
    collateralEquity: toNumberOrDefault(
      body.collateralEquity,
      DEFAULT_SCORE_INPUT.collateralEquity
    ),
    acreage: toNumberOrDefault(body.acreage, DEFAULT_SCORE_INPUT.acreage),
  };
}

async function executeScoreRequest(
  body: TestScoreRequestBody,
  method: "GET" | "POST"
) {
  const traceId = createTestScoreTraceId();
  const input = normalizeScoreInput(body);
  const actorId = body.userId ?? body.borrowerId ?? null;

  const runtimeGuard = runRuntimeGuard({
    operation: "score.test",
    module: "api.testScore",
    traceId,
    schemaVersion: "test-score-request-v0.1.0",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "INTERNAL",
    replayRef: traceId,
    actorId,
    metadata: {
      route: "/api/test-score",
      method,
      diagnosticSurface: true,
    },
  });

  if (!runtimeGuard.allowed) {
    const observability = createObservabilityEvent({
      eventType: "TEST_SCORE_RUNTIME_BLOCKED",
      domain: "runtime",
      severity: "WARN",
      message: "Test score request was blocked by runtime governance.",
      traceId,
      replayRef: traceId,
      actorId,
      module: "api.testScore",
      metadata: {
        route: "/api/test-score",
        findings: runtimeGuard.findings,
      },
    });

    const evidence = await persistRouteGovernanceEvidence({
      traceId,
      route: "/api/test-score",
      operation: "score.test",
      module: "api.testScore",
      observability,
      sourceVersion: "test-score-api-v0.1.0",
      metadata: {
        runtimeBlocked: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Runtime governance guard blocked test scoring.",
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
    operation: "score.test",
    module: "api.testScore",
    traceId,
    versions: [
      createRuntimeVersionRef(
        "schema",
        "test-score-request-v0.1.0",
        "src/app/api/test-score/route.ts",
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
        "rules",
        "test-score-engine-v0.1.0",
        "src/services/scoring/calculatePropertyScore.ts",
        traceId
      ),
    ],
  });

  const classifiedInput = classifyRecord(
    {
      input,
      method,
    },
    {
      classificationLevel: "INTERNAL",
      sensitivityScope: "borrower",
      classificationSource: "api-test-score-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance"],
      sharingPermissions: ["backend-diagnostic-review"],
      aiUsagePermissions: ["score", "summarize", "explain"],
      exportRestrictions: [
        "not-a-final-credit-decision",
        "requires-diagnostic-context",
      ],
      redactionRequirements: [
        "redact-test-borrower-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["diagnostic-test-context"],
    }
  );

  const score = calculatePropertyScore(input);

  const classifiedOutput = classifyRecord(
    {
      score,
      advisory:
        "AI-GENERATED INFORMATION ONLY - NOT AN OFFICIAL REPORT - NOT VALID FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.",
    },
    {
      classificationLevel: "INTERNAL",
      sensitivityScope: "borrower",
      classificationSource: "api-test-score-route-output",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: ["authorized-operator", "governance"],
      sharingPermissions: ["backend-diagnostic-review"],
      aiUsagePermissions: ["summarize", "explain"],
      exportRestrictions: [
        "not-a-final-credit-decision",
        "requires-human-review-before-regulatory-reliance",
      ],
      redactionRequirements: [
        "redact-test-borrower-identifiers-before-public-disclosure",
      ],
      consentRequirements: ["diagnostic-test-context"],
    }
  );

  const explanation = createExplanationLineage({
    outputIdentifier: traceId,
    outputType: "test_score_result",
    audience: "internal",
    claimType: "recommendation",
    summary:
      "Test score generated through governed backend diagnostics and preserved with durable evidence.",
    ruleVersion: "test-score-runtime-v0.1.0",
    overlayRefs: [],
    confidenceScore: 0.7,
    humanReviewRequired: true,
    replayRefs: [traceId],
    auditEventRefs: [],
    metadata: {
      method,
      advisoryOnly: true,
      sba: score.sba,
    },
  });

  const observability = createObservabilityEvent({
    eventType: "TEST_SCORE_EXECUTED",
    domain: "operations",
    severity: "INFO",
    message: "Test score executed through governed backend runtime controls.",
    traceId,
    replayRef: traceId,
    actorId,
    module: "api.testScore",
    metadata: {
      method,
      versionRuntimeOk: versionRuntime.ok,
      advisoryOnly: true,
      durableGovernanceEvidence: true,
    },
  });

  const evidence = await persistRouteGovernanceEvidence({
    traceId,
    route: "/api/test-score",
    operation: "score.test",
    module: "api.testScore",
    versionRuntime,
    classifications: [
      {
        resourceType: "test_score_input",
        resourceId: traceId,
        classification: classifiedInput.classification,
        traceId,
        replayRef: traceId,
        metadata: {
          method,
          stage: "input",
        },
      },
      {
        resourceType: "test_score_output",
        resourceId: traceId,
        classification: classifiedOutput.classification,
        traceId,
        replayRef: traceId,
        metadata: {
          method,
          stage: "output",
          advisoryOnly: true,
        },
      },
    ],
    observability,
    sourceVersion: "test-score-api-v0.1.0",
    result: {
      method,
      versionRuntimeOk: versionRuntime.ok,
      advisoryOnly: true,
      sba: score.sba,
    },
  });

  return NextResponse.json({
    ok: true,
    score,
    input,
    advisoryOnly: true,
    output: classifiedOutput,
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
}

export async function GET() {
  return executeScoreRequest({}, "GET");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TestScoreRequestBody;

  return executeScoreRequest(body, "POST");
}
