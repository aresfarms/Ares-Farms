import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { auditEvents } from "@/db/schema";
import { validateCanonicalChain } from "@/lib/ledger/validateCanonicalChain";

import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  createRuntimeVersionRef,
  evaluateVersionRuntime,
} from "@/lib/runtime/versionRuntime";
import { createObservabilityEvent } from "@/lib/runtime/observabilityRuntime";
import { createExplanationLineage } from "@/lib/runtime/explainabilityRuntime";

/**
 * Canonical Ledger Repair Plan API
 *
 * Master Volume Governance:
 * - Vol I: Constitutional Backbone
 *   Enforces audit integrity, immutable lineage, and constitutional accountability.
 *
 * - Vol II: Regulatory Governance
 *   Supports regulated remediation planning and examination-ready evidence.
 *
 * - Vol III: Technical Infrastructure
 *   Evaluates canonical chain state without mutating source records.
 *
 * - Vol IV: Operational Runbooks
 *   Supports controlled repair planning, escalation, and operational recovery.
 *
 * - Vol V: Canonical Platform Doctrines
 *   Preserves replayability, observability, explainability, version lineage,
 *   anomaly review, and simulation-safe remediation planning.
 */

type ChainIssue = {
  index: number;
  id: string;
  reason?: string;
  issue?: string;
};

function createCanonicalPlanTraceId(): string {
  return `canonical-plan-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeIssueCode(issue: ChainIssue): string {
  return issue.issue ?? issue.reason ?? "UNKNOWN_CHAIN_ISSUE";
}

export async function GET() {
  try {
    const traceId = createCanonicalPlanTraceId();

    const runtimeGuard = runRuntimeGuard({
      operation: "ledger.canonical.plan",
      module: "api.ledger.canonical.plan",
      traceId,
      schemaVersion: "canonical-ledger-plan-v0.1.0",
      governanceVersion: "master-volumes-runtime-v0.1.0",
      classificationLevel: "INTERNAL",
      replayRef: traceId,
      metadata: {
        route: "/api/ledger/canonical/plan",
      },
    });

    if (!runtimeGuard.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Runtime governance guard blocked canonical ledger plan.",
          governance: {
            traceId,
            runtimeGuard,
          },
        },
        { status: 403 }
      );
    }

    const versionRuntime = evaluateVersionRuntime({
      operation: "ledger.canonical.plan",
      module: "api.ledger.canonical.plan",
      traceId,
      versions: [
        createRuntimeVersionRef(
          "schema",
          "canonical-ledger-plan-v0.1.0",
          "src/app/api/ledger/canonical/plan/route.ts",
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
          "ledger",
          "canonical-chain-validation-v0.1.0",
          "src/lib/ledger/validateCanonicalChain.ts",
          traceId
        ),
      ],
    });

    const entries = await db.select().from(auditEvents);
    const validation = validateCanonicalChain([...entries]);

    const issues = (validation.issues ?? []) as ChainIssue[];

    const fixes = issues.map((issue) => {
      const issueCode = normalizeIssueCode(issue);

      return {
        id: issue.id,
        index: issue.index,
        issue: issueCode,
        severity: issueCode === "CHAIN_BREAK" ? "CRITICAL" : "MEDIUM",
        proposedAction:
          issueCode === "CHAIN_BREAK"
            ? "Recompute prevHash/eventHash chain from last valid predecessor under governed repair workflow."
            : "Review canonical ledger entry and normalize missing or incompatible hash fields.",
      };
    });

    const explanation = createExplanationLineage({
      outputIdentifier: traceId,
      outputType: "canonical_ledger_repair_plan",
      audience: "auditor",
      claimType: "recommendation",
      summary:
        fixes.length === 0
          ? "Canonical ledger repair plan found no issues requiring remediation."
          : "Canonical ledger repair plan identified issues requiring governed remediation review.",
      ruleVersion: "canonical-ledger-plan-runtime-v0.1.0",
      overlayRefs: [],
      confidenceScore: 1,
      humanReviewRequired: fixes.length > 0,
      replayRefs: [traceId],
      auditEventRefs: [],
      metadata: {
        issueCount: fixes.length,
        valid: validation.valid,
      },
    });

    const observability = createObservabilityEvent({
      eventType:
        fixes.length === 0
          ? "CANONICAL_LEDGER_PLAN_CLEAR"
          : "CANONICAL_LEDGER_PLAN_REMEDIATION_REQUIRED",
      domain: "ledger",
      severity: fixes.length === 0 ? "INFO" : "WARN",
      message:
        fixes.length === 0
          ? "Canonical ledger repair planning completed with no proposed fixes."
          : "Canonical ledger repair planning generated proposed remediation actions.",
      traceId,
      replayRef: traceId,
      module: "api.ledger.canonical.plan",
      metadata: {
        issueCount: fixes.length,
        versionRuntimeOk: versionRuntime.ok,
      },
    });

    return NextResponse.json({
      ok: true,
      valid: validation.valid,
      issueCount: fixes.length,
      fixes,
      governance: {
        traceId,
        runtimeGuard,
        versionRuntime,
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
            : "Unknown canonical ledger plan runtime error.",
      },
      { status: 500 }
    );
  }
}
