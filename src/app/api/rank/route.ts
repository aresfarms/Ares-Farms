import { NextRequest, NextResponse } from "next/server";

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
 * Ranking API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces governed ranking accountability and audit-safe ordering logic.
 *
 * - Vol II: Regulatory Governance
 *   Supports compliant prioritization review and regulated ranking explainability.
 *
 * - Vol III: Technical Infrastructure
 *   Provides replay-safe ranking execution with durable version,
 *   classification, observability, and replay-verification evidence.
 *
 * - Vol IV: Operational Runbooks
 *   Supports ranking review, escalation, override analysis,
 *   and operational supervision.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces explainability, replayability, classification,
 *   observability, version-governed scoring, and evidence preservation.
 */

type RankApplication = {
  id?: string | null;
  tenantId?: string | null;
  propertyReadinessScore?: number | null;
  programFitScore?: number | null;
  evidenceCompletenessScore?: number | null;
  executionReadinessScore?: number | null;
  environmentalReadinessScore?: number | null;
  propertyRiskScore?: number | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type RankedApplication = RankApplication & {
  id: string;
  tenantId: string;
  computedRankScore: number;
  rankScore: number;
  rank: number;
  rankPosition: number;
};

type RankRequest = {
  borrowerId?: string | null;
  userId?: string | null;
  applications?: RankApplication[];
  farms?: RankApplication[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

const FORBIDDEN_PERSONAL_FINANCIAL_RANKING_KEYS = new Set([
  "creditscore",
  "credit_score",
  "liquidity",
  "personalincome",
  "householdincome",
  "debttoincome",
  "dti",
  "personalnetworth",
  "networth",
  "personalassets",
  "householdassets",
]);

function containsForbiddenRankingInput(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenRankingInput);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    const normalized = key.replace(/[^a-z0-9_]/gi, "").toLowerCase();
    return FORBIDDEN_PERSONAL_FINANCIAL_RANKING_KEYS.has(normalized) || containsForbiddenRankingInput(child);
  });
}

function createRankTraceId(): string {
  return `rank-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function clamp100(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

function computeRankScore(app: RankApplication): number {
  const propertyReadiness = clamp100(app.propertyReadinessScore);
  const programFit = clamp100(app.programFitScore);
  const evidenceCompleteness = clamp100(app.evidenceCompletenessScore);
  const executionReadiness = clamp100(app.executionReadinessScore);
  const environmentalReadiness = clamp100(app.environmentalReadinessScore);
  const propertyRisk = clamp100(app.propertyRiskScore);

  const positive =
    propertyReadiness * 0.30 +
    programFit * 0.25 +
    evidenceCompleteness * 0.20 +
    executionReadiness * 0.15 +
    environmentalReadiness * 0.10;
  return Math.max(0, Math.min(100, positive - propertyRisk * 0.15));
}

function normalizeApplications(body: RankRequest): RankApplication[] {
  if (Array.isArray(body.applications)) return body.applications;
  if (Array.isArray(body.farms)) return body.farms;
  return [];
}

function rankApplications(applications: RankApplication[]): RankedApplication[] {
  return applications
    .map((app, index) => {
      const stableId = String(app.id ?? app.tenantId ?? `property-${index + 1}`);
      const computedRankScore = computeRankScore(app);
      return {
        ...app,
        id: stableId,
        tenantId: String(app.tenantId ?? stableId),
        computedRankScore,
        rankScore: computedRankScore,
      };
    })
    .sort((a, b) => b.computedRankScore - a.computedRankScore || a.id.localeCompare(b.id))
    .map((app, index) => ({ ...app, rank: index + 1, rankPosition: index + 1 }));
}

export async function POST(req: NextRequest) {
  const traceId = createRankTraceId();

  try {
    const body = (await req.json()) as RankRequest;

    if (containsForbiddenRankingInput(body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nonresidential property/project ranking does not accept personal-financial scoring inputs.",
          governance: { traceId, propertyProjectOnly: true, selectedProviderOwnsBorrowerUnderwriting: true },
        },
        { status: 400 },
      );
    }

    const runtimeGuard = runRuntimeGuard({
      operation: "property-project-ranking.execute",
      module: "api.rank",
      traceId,
      schemaVersion: "ranking-runtime-v0.2.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "CONFIDENTIAL",
      replayRef: traceId,
      actorId: body.userId ?? body.borrowerId ?? null,
      metadata: {
        route: "/api/rank",
        rankingSurface: true,
      },
    });

    if (!runtimeGuard.allowed) {
      const observability = createObservabilityEvent({
        eventType: "RANKING_RUNTIME_BLOCKED",
        domain: "runtime",
        severity: "WARN",
        message: "Ranking runtime guard blocked the request.",
        traceId,
        replayRef: traceId,
        actorId: body.userId ?? body.borrowerId ?? null,
        module: "api.rank",
        metadata: {
          route: "/api/rank",
          findings: runtimeGuard.findings,
        },
      });

      const evidence = await persistGovernanceEvidence({
        traceId,
        replayRef: traceId,
        observability,
        metadata: {
          route: "/api/rank",
          runtimeBlocked: true,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked ranking request.",
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
      operation: "property-project-ranking.execute",
      module: "api.rank",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ranking-runtime-v0.2.0",
          "src/app/api/rank/route.ts",
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
          "property-project-ranking-v0.2.0",
          "api.rank.runtime",
          traceId
        ),
      ],
    });

    const classifiedInput = classifyRecord(body as Record<string, unknown>, {
      classificationLevel: "CONFIDENTIAL",
      sensitivityScope: "borrower",
      classificationSource: "api-rank-route",
      classificationVersion: "classification-runtime-v0.1.0",
      replayRef: traceId,
      disclosureAudience: [
        "authorized-underwriter",
        "authorized-operator",
        "governance",
      ],
      sharingPermissions: [
        "property-project-ranking-review",
        "internal-ranking-operations",
      ],
      aiUsagePermissions: ["score", "rank", "explain"],
      exportRestrictions: [
        "requires-governed-access",
        "requires-ranking-review-context",
      ],
      redactionRequirements: [
        "redact-sensitive-ranking-metadata-before-external-disclosure",
      ],
      consentRequirements: ["borrower-processing-consent"],
    });

    const applications = normalizeApplications(body);
    const ranked = rankApplications(applications);

    const classifiedOutput = classifyRecord(
      {
        ranked,
      },
      {
        classificationLevel: "CONFIDENTIAL",
        sensitivityScope: "borrower",
        classificationSource: "api-rank-route-output",
        classificationVersion: "classification-runtime-v0.1.0",
        replayRef: traceId,
        disclosureAudience: [
          "authorized-underwriter",
          "authorized-operator",
          "governance",
        ],
        sharingPermissions: [
          "property-project-ranking-review",
          "internal-ranking-operations",
        ],
        aiUsagePermissions: ["score", "rank", "explain"],
        exportRestrictions: [
          "not-underwriting-or-credit-decision",
          "requires-human-review",
        ],
        redactionRequirements: [
          "redact-internal-ranking-notes-before-public-disclosure",
        ],
        consentRequirements: ["borrower-processing-consent"],
      }
    );

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "property_project_ranking",
      audience: "internal",
      claimType: "recommendation",
      summary:
        "Property/project ranking executed from property-side readiness inputs only through governed replay-safe runtime controls.",
      ruleVersion: "ranking-runtime-v0.2.0",
      overlayRefs: [],
      confidenceScore: 0.75,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        rankedCount: ranked.length,
        notFinalCreditDecision: true,
        personalFinancialScoring: false,
        propertyProjectOnly: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "RANKING_EXECUTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Property/project ranking executed through governed runtime controls.",
      traceId,
      replayRef: traceId,
      actorId: body.userId ?? body.borrowerId ?? null,
      module: "api.rank",
      metadata: {
        rankedCount: ranked.length,
        versionRuntimeOk: versionRuntime.ok,
        classificationLevel:
          classifiedOutput.classification.classificationLevel,
        durableGovernanceEvidence: true,
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      versionRuntime,
      classifications: [
        {
          resourceType: "ranking_input",
          resourceId: traceId,
          classification: classifiedInput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/rank",
            stage: "input",
          },
        },
        {
          resourceType: "ranking_output",
          resourceId: traceId,
          classification: classifiedOutput.classification,
          traceId,
          replayRef: traceId,
          metadata: {
            route: "/api/rank",
            stage: "output",
            rankedCount: ranked.length,
          },
        },
      ],
      observability,
      replayVerification: {
        traceId,
        replayRef: traceId,
        targetType: "api_route",
        targetId: "api.rank",
        verificationStatus: versionRuntime.ok ? "PASS" : "WARN",
        deterministic: true,
        replaySafe: versionRuntime.replaySafe,
        sourceVersion: "ranking-runtime-v0.2.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: ranked.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          rankedCount: ranked.length,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/rank",
          operation: "property-project-ranking.execute",
        },
      },
      metadata: {
        route: "/api/rank",
        operation: "property-project-ranking.execute",
      },
    });

    return NextResponse.json({
      ok: true,
      ranked,
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
  } catch (error) {
    const observability = createObservabilityEvent({
      eventType: "RANKING_RUNTIME_ERROR",
      domain: "runtime",
      severity: "ERROR",
      message: "Ranking API encountered an unhandled runtime error.",
      traceId,
      replayRef: traceId,
      module: "api.rank",
      metadata: {
        route: "/api/rank",
        error:
          error instanceof Error ? error.message : "Unknown ranking runtime error.",
      },
    });

    const evidence = await persistGovernanceEvidence({
      traceId,
      replayRef: traceId,
      observability,
      metadata: {
        route: "/api/rank",
        runtimeError: true,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown ranking runtime error.",
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
