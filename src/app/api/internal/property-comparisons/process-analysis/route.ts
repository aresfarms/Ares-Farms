import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { processPropertyComparisonAnalysisBatch } from "@/lib/intelligence/propertyComparisonAnalysisWorker";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { missingRequiredSecretDetail, readJsonBodyWithLimit, readRequiredSecret, secureCompare } from "@/lib/security/requestGuards";

function oidcAuthorized(req: NextRequest): boolean {
  return process.env.PROPERTY_COMPARISON_ALLOW_OIDC_SCHEDULER === "true" &&
    req.headers.get("x-cloudscheduler") === "true";
}

function authorized(req: NextRequest): boolean {
  if (oidcAuthorized(req)) return true;
  const configured = readRequiredSecret("PROPERTY_COMPARISON_WORKER_SECRET");
  const provided = req.headers.get("x-property-comparison-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return Boolean(configured && provided.trim() && secureCompare(provided.trim(), configured));
}

export async function POST(req: NextRequest) {
  if (!oidcAuthorized(req) && !readRequiredSecret("PROPERTY_COMPARISON_WORKER_SECRET")) {
    return NextResponse.json({
      ok: false,
      error: missingRequiredSecretDetail("PROPERTY_COMPARISON_WORKER_SECRET"),
    }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized property comparison analysis request." }, { status: 401 });
  }
  const parsed = await readJsonBodyWithLimit<{ limit?: number }>(req, { maxBytes: 4 * 1024 });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  const limit = typeof parsed.body.limit === "number"
    ? Math.min(Math.max(Math.trunc(parsed.body.limit), 1), 10)
    : 5;
  const traceId = "property-comparison-analysis-worker-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "property.comparison.analyze",
    module: "api.internal.property-comparisons.process-analysis",
    traceId,
    replayRef: traceId,
    actorId: "system:property-comparison-analysis-worker",
    schemaVersion: "property-comparison-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: { limit, boundedSequentialExecution: true, paidRankingRequiresCompleteEvidence: true },
  });
  if (!guard.allowed) {
    return NextResponse.json({ ok: false, error: "Property comparison analysis is unavailable." }, { status: 403 });
  }

  try {
    const batch = await processPropertyComparisonAnalysisBatch({ limit, traceId });
    return NextResponse.json({ ok: true, traceId, ...batch }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({
      ok: false,
      error: "The property analysis batch could not be completed.",
      traceId,
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
