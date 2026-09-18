import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import {
  isEnterpriseEconomicEvidencePackage,
  type EnterpriseEconomicEvidencePackage,
} from "@/lib/intelligence/economicEvidencePackage";
import {
  PropertyComparisonEconomicEvidenceError,
  finalizePropertyComparison,
  recordCompletedPropertyComparisonAnalysis,
} from "@/lib/intelligence/propertyComparisonStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import {
  readJsonBodyWithLimit,
} from "@/lib/security/requestGuards";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ comparisonId: string; itemId: string }>;
  },
) {
  const authority = sessionAuthority(req);
  if (!["governance", "operator"].includes(authority.role)) {
    return NextResponse.json({
      ok: false,
      error: "Economic evidence review requires an operator session.",
    }, { status: 403 });
  }

  const { comparisonId, itemId } = await context.params;
  if (!UUID.test(comparisonId) || !UUID.test(itemId)) {
    return NextResponse.json({
      ok: false,
      error: "Valid comparison and item identifiers are required.",
    }, { status: 400 });
  }

  const traceId =
    "property-comparison-economic-review-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "property.comparison.economic-analysis.record",
    module:
      "api.internal.property-comparisons.items.economic-analysis",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "property-comparison-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      comparisonId,
      itemId,
      supervisedEvidenceSubmission: true,
      authorityRole: authority.role,
      authorityBasis: authority.basis,
    },
  });
  if (!guard.allowed) {
    return NextResponse.json({
      ok: false,
      error: "Economic evidence review is unavailable.",
    }, { status: 403 });
  }

  const parsed = await readJsonBodyWithLimit<{
    evidencePackages?: unknown;
  }>(req, { maxBytes: 2 * 1024 * 1024 });
  if (!parsed.ok) {
    return NextResponse.json({
      ok: false,
      error: parsed.error,
    }, { status: parsed.status });
  }

  if (!Array.isArray(parsed.body.evidencePackages) ||
      parsed.body.evidencePackages.length !== 3 ||
      !parsed.body.evidencePackages.every(
        isEnterpriseEconomicEvidencePackage,
      )) {
    return NextResponse.json({
      ok: false,
      error:
        "Exactly three structurally valid economic evidence packages are required.",
    }, { status: 400 });
  }

  try {
    const evidencePackages =
      parsed.body.evidencePackages as
        EnterpriseEconomicEvidencePackage[];
    const recorded =
      await recordCompletedPropertyComparisonAnalysis({
        comparisonId,
        itemId,
        evidencePackages,
        traceId,
      });
    if (!recorded) {
      return NextResponse.json({
        ok: false,
        error:
          "The comparison item was not found or is not ready for economic review.",
        traceId,
      }, { status: 409 });
    }

    const finalization = await finalizePropertyComparison({
      comparisonId,
      traceId,
    });
    return NextResponse.json({
      ok: true,
      comparisonId,
      itemId,
      candidateCount: evidencePackages.length,
      finalization,
      traceId,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof PropertyComparisonEconomicEvidenceError) {
      return NextResponse.json({
        ok: false,
        error:
          "The economic evidence packages are not ready for paid ranking.",
        missingEvidence: error.missingEvidence,
        traceId,
      }, {
        status: 422,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    return NextResponse.json({
      ok: false,
      error:
        "The reviewed economic analysis could not be recorded.",
      traceId,
    }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
