import { NextRequest, NextResponse } from "next/server";
import { captureGeneratedEvidenceArtifact } from "@/lib/property/officialEvidenceGenerationCapture";
import type { DownstreamArtifactKind } from "@/lib/property/officialEvidenceDownstreamInvalidation";

const KINDS = new Set<DownstreamArtifactKind>(["property-report", "top-three", "tax-scenario", "qualification-result"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { kind?: string; propertyId?: string; artifactId?: string } | null;
  const kind = body?.kind as DownstreamArtifactKind | undefined;
  const propertyId = body?.propertyId?.trim() ?? "";
  const artifactId = body?.artifactId?.trim();
  if (!kind || !KINDS.has(kind) || !propertyId || propertyId.length > 240 || (artifactId && artifactId.length > 320)) {
    return NextResponse.json({ ok: false, error: "Invalid evidence-lineage capture request." }, { status: 400 });
  }
  const artifact = captureGeneratedEvidenceArtifact({ kind, propertyId, artifactId });
  return NextResponse.json({ ok: true, artifactId: artifact.artifactId, dependencies: artifact.dependencies });
}
