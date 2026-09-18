import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { sessionAuthority } from "@/lib/auth/sessionAuthority";
import { parsePropertyComparisonIntake } from "@/lib/intelligence/propertyComparisonIntake";
import { createPropertyComparison } from "@/lib/intelligence/propertyComparisonStore";
import { runRuntimeGuard } from "@/lib/runtime/runtimeGuard";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBodyWithLimit<{
    addressesText?: string;
    excludedAddressesText?: string;
    requestedResultCount?: number;
  }>(req, { maxBytes: 384 * 1024 });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });

  const intake = parsePropertyComparisonIntake({
    addressesText: typeof parsed.body.addressesText === "string" ? parsed.body.addressesText : "",
    excludedAddressesText: typeof parsed.body.excludedAddressesText === "string"
      ? parsed.body.excludedAddressesText : "",
    requestedResultCount: typeof parsed.body.requestedResultCount === "number"
      ? parsed.body.requestedResultCount : 0,
  });
  if (!intake.ok) return NextResponse.json({ ok: false, error: intake.error }, { status: 400 });

  const authority = sessionAuthority(req);
  const traceId = "property-comparison-create-" + randomUUID();
  const guard = runRuntimeGuard({
    operation: "property.comparison.create",
    module: "api.public.property-comparisons",
    traceId,
    replayRef: traceId,
    actorId: authority.actorId,
    schemaVersion: "property-comparison-v1",
    governanceVersion: "master-volumes-runtime-v0.1.0",
    classificationLevel: "CONFIDENTIAL",
    metadata: {
      propertyCount: intake.value.addresses.length,
      requestedResultCount: intake.value.requestedResultCount,
      asynchronousExecutionRequired: true,
    },
  });
  if (!guard.allowed) {
    return NextResponse.json({ ok: false, error: "Property comparison intake is temporarily unavailable." }, { status: 403 });
  }

  try {
    const created = await createPropertyComparison({
      intake: intake.value,
      ownerActorId: authority.actorId,
      traceId,
    });
    return NextResponse.json({
      ok: true,
      ...created,
      duplicateCount: intake.duplicateCount,
      queue: {
        accepted: true,
        executionMode: "asynchronous",
        rankingAvailable: false,
        nextStatus: "Property verification has not started.",
      },
      traceId,
    }, {
      status: 202,
      headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" },
    });
  } catch {
    return NextResponse.json({
      ok: false,
      error: "The comparison could not be saved. Please try again in a moment.",
      traceId,
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
