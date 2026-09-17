import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { loadPropertyComparison } from "@/lib/intelligence/propertyComparisonStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";

function bearer(req: NextRequest): string | null {
  const value = req.headers.get("authorization")?.trim() ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() || null : null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ comparisonId: string }> },
) {
  const comparisonId = (await context.params).comparisonId.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(comparisonId)) {
    return NextResponse.json({ ok: false, error: "A valid comparison identifier is required." }, { status: 400 });
  }

  const authority = sessionAuthority(req);
  const traceId = "property-comparison-read-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "property.comparison.read",
    module: "api.public.property-comparisons",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "property-comparison-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: { comparisonId, tokenPresented: Boolean(bearer(req)) },
  });
  if (!guard.allowed) {
    return NextResponse.json({ ok: false, error: "Property comparison access is unavailable." }, { status: 403 });
  }

  try {
    const bundle = await loadPropertyComparison({
      comparisonId,
      ownerActorId: authority.actorId,
      accessToken: bearer(req),
    });
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Comparison not found or access not authorized." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      ...bundle,
      governance: {
        traceId,
        rankingAvailableOnlyAfterComparableChildResults: true,
        borrowerUnderwritingPerformed: false,
      },
    }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" } });
  } catch {
    return NextResponse.json({
      ok: false,
      error: "Comparison status is temporarily unavailable.",
      traceId,
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
