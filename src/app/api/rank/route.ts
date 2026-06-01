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
  score?: number | null;
  rankScore?: number | null;
  risk?: number | { volatility?: number | null; survivability?: number | null };
  acreage?: number | null;
  liquidity?: number | null;
  scores?: {
    sba?: number | null;
    liquidity?: number | null;
    [key: string]: unknown;
  };
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
};

function createRankTraceId(): string {
  return `rank-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function toSafeNumber(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return numeric;
}

function toRiskPenalty(app: RankApplication): number {
  if (typeof app.risk === "number") {
    return toSafeNumber(app.risk);
  }

  if (app.risk && typeof app.risk === "object") {
    return toSafeNumber(app.risk.volatility);
  }

  return 0;
}

function computeRankScore(app: RankApplication): number {
  const baseScore = toSafeNumber(app.score ?? app.rankScore);
  const sbaScore = toSafeNumber(app.scores?.sba);
  const liquidity = toSafeNumber(app.liquidity ?? app.scores?.liquidity);
  const acreage = toSafeNumber(app.acreage);
  const riskPenalty = toRiskPenalty(app);

  return baseScore + sbaScore + liquidity + acreage - riskPenalty;
}

function normalizeApplications(body: RankRequest): RankApplication[] {
  if (Array.isArray(body.applications)) {
    return body.applications;
  }

  if (Array.isArray(body.farms)) {
    return body.farms;
  }

  return [];
}

function rankApplications(applications: RankApplication[]): RankedApplication[] {
  return applications
    .map((app, index) => {
      const stableId = String(app.id ?? app.tenantId ?? `application-${index + 1}`);
      const computedRankScore = computeRankScore(app);

      return {
        ...app,
        id: stableId,
        tenantId: String(app.tenantId ?? stableId),
        computedRankScore,
        rankScore: computedRankScore,
      };
    })
    .sort((a, b) => b.computedRankScore - a.computedRankScore)
    .map((app, index) => ({
      ...app,
      rank: index + 1,
      rankPosition: index + 1,
    }));
}

export async function POST(req: NextRequest) {
  const traceId = createRankTraceId();

  try {
    const body = (await req.json()) as RankRequest;

    const runtimeGuard = runRuntimeGuard({
      operation: "ranking.execute",
      module: "api.rank",
      traceId,
      schemaVersion: "ranking-runtime-v0.1.0",
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
      operation: "ranking.execute",
      module: "api.rank",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "ranking-runtime-v0.1.0",
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
          "ranking-rules-v0.1.0",
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
        "regulated-ranking-review",
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
          "regulated-ranking-review",
          "internal-ranking-operations",
        ],
        aiUsagePermissions: ["score", "rank", "explain"],
        exportRestrictions: [
          "not-a-final-credit-decision",
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
      outputType: "borrower_ranking",
      audience: "internal",
      claimType: "recommendation",
      summary:
        "Ranking executed through governed runtime controls using replay-safe scoring lineage.",
      ruleVersion: "ranking-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 0.75,
      humanReviewRequired: true,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        rankedCount: ranked.length,
        notFinalCreditDecision: true,
      },
    });

    const observability = createObservabilityEvent({
      eventType: "RANKING_EXECUTED",
      domain: "operations",
      severity: "INFO",
      message:
        "Borrower/application ranking executed through governed runtime controls.",
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
        sourceVersion: "ranking-runtime-v0.1.0",
        replayVersion: "governance-evidence-store-v0.1.0",
        eventCount: ranked.length,
        mismatchCount: versionRuntime.ok ? 0 : 1,
        result: {
          rankedCount: ranked.length,
          versionRuntimeOk: versionRuntime.ok,
        },
        metadata: {
          route: "/api/rank",
          operation: "ranking.execute",
        },
      },
      metadata: {
        route: "/api/rank",
        operation: "ranking.execute",
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
