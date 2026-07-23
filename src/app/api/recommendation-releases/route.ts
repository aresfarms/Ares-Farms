import { NextRequest, NextResponse } from "next/server";

import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import { listRecommendationReleaseHistory, persistRecommendationRelease } from "@/lib/intelligence/recommendationReleaseStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const subjectType = req.nextUrl.searchParams.get("subjectType") ?? "";
    const subjectKey = req.nextUrl.searchParams.get("subjectKey") ?? "";
    const rows = await listRecommendationReleaseHistory({ subjectType, subjectKey });
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Release history lookup failed." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      subjectType?: string;
      subjectKey?: string;
      traceId?: string;
      release?: RecommendationReleaseRecord;
    };
    if (!body.release) throw new Error("release is required.");
    const result = await persistRecommendationRelease({
      subjectType: body.subjectType ?? "",
      subjectKey: body.subjectKey ?? "",
      traceId: body.traceId?.trim() || `recommendation-release-${Date.now()}`,
      release: body.release,
    });
    return NextResponse.json({ ok: true, row: result.row, previousReleaseId: result.previous?.releaseId ?? null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Release persistence failed." }, { status: 400 });
  }
}
