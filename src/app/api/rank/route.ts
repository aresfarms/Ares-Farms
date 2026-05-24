import { NextRequest, NextResponse } from "next/server";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { classifyRecord } from "@/lib/runtime/classificationRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

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
 *   Provides replay-safe ranking execution and governed scoring lineage.
 *
 * - Vol IV: Operational Runbooks
 *   Supports ranking review, escalation, override analysis,
 *   and operational supervision.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Enforces explainability, replayability, classification,
 *   observability, and version-governed scoring.
 */

type RankApplication = {
  id: string;
  score?: number;
  risk?: number;
  acreage?: number;
  liquidity?: number;
  metadata?: Record<string, unknown>;
};

type RankRequest = {
  borrowerId?: string | null;
  userId?: string | null;
  applications?: RankApplication[];
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

function computeRankScore(app: RankApplication): number {
  const score = toSafeNumber(app.score);
  const risk = toSafeNumber(app.risk);
  const liquidity = toSafeNumber(app.liquidity);
  const acreage = toSafeNumber(app.acreage);

  return score + liquidity + acreage - risk;
}

export async function POST(req: NextRequest) {
  try {
    const traceId = createRankTraceId();
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
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked ranking request.",
          governance: {
            traceId,
            runtimeGuard,
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
          "master-volume-runtime-v0.1.0",
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

    const applications = Array.isArray(body.applications)
      ? body.applications
      : [];

    const ranked = applications
      .map((app) => ({
        ...app,
        computedRankScore: computeRankScore(app),
      }))
      .sort((a, b) => b.computedRankScore - a.computedRankScore)
      .map((app, index) => ({
        ...app,
        rank: index + 1,
      }));

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
      },
    });

    return NextResponse.json({
      ok: true,
      ranked: classifiedOutput,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
        inputClassification: classifiedInput.classification,
        outputClassification: classifiedOutput.classification,
        explainability: explanation,
        observability,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown ranking runtime error.",
      },
      { status: 500 }
    );
  }
}
