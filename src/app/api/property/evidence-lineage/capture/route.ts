import { NextRequest, NextResponse } from "next/server";
import { captureGeneratedEvidenceArtifactDurably } from "@/lib/property/durableEvidenceGenerationCapture";
import type { DownstreamArtifactKind } from "@/lib/property/officialEvidenceDownstreamInvalidation";
import { readJsonBodyWithLimit } from "@/lib/security/requestGuards";

const KINDS = new Set<DownstreamArtifactKind>(["property-report", "top-three", "tax-scenario", "qualification-result"]);
export async function POST(request: NextRequest) {
  const parsed = await readJsonBodyWithLimit<{ kind?: unknown; propertyId?: unknown; artifactId?: unknown; replayInput?: unknown; replayOutput?: unknown }>(request, { maxBytes: 256 * 1024 });
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  const body = parsed.body;
  const kind = typeof body.kind === "string" ? body.kind as DownstreamArtifactKind : null;
  const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim() : "";
  const artifactId = typeof body.artifactId === "string" ? body.artifactId.trim() : undefined;
  if (!kind || !KINDS.has(kind) || !propertyId || propertyId.length > 240 || (artifactId && artifactId.length > 320)) {
    return NextResponse.json({ ok: false, error: "Invalid evidence-lineage capture request." }, { status: 400 });
  }
  if (body.replayInput === undefined || body.replayOutput === undefined) {
    return NextResponse.json({ ok: false, error: "Replay input and output are required." }, { status: 400 });
  }
  try {
    const artifact = await captureGeneratedEvidenceArtifactDurably({ kind, propertyId, artifactId,
      authority: "CUSTOMER_ASSERTED", replayInput: body.replayInput, replayOutput: body.replayOutput });
    return NextResponse.json({ ok: true, artifactId: artifact.artifactId, dependencies: artifact.dependencies }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Evidence preservation is temporarily unavailable." }, { status: 503 });
  }
}
