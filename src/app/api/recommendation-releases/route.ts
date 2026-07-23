import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import type { RecommendationReleaseRecord } from "@/lib/intelligence/recommendationReleaseRecord";
import { listRecommendationReleaseHistory, persistRecommendationRelease } from "@/lib/intelligence/recommendationReleaseStore";

export const runtime = "nodejs";

const RELEASE_ROLES = new Set(["admin", "governance", "underwriter"]);

function sessionIdentity(session: any) {
  const actorId = String(session?.user?.id ?? "").trim();
  const email = String(session?.user?.email ?? "").trim().toLowerCase();
  const name = String(session?.user?.name ?? "").trim() || null;
  const role = String(session?.user?.role ?? "user").trim().toLowerCase();
  return { actorId, email, name, role };
}

export async function GET(req: NextRequest) {
  try {
    const subjectType = req.nextUrl.searchParams.get("subjectType") ?? "";
    const subjectKey = req.nextUrl.searchParams.get("subjectKey") ?? "";
    const records = await listRecommendationReleaseHistory({ subjectType, subjectKey });
    const rows = records.map((record) => ({
      releaseId: record.releaseId,
      previousReleaseId: record.previousReleaseId,
      evidenceVersion: record.evidenceVersion,
      releaseState: record.releaseState,
      finality: record.finality,
      releasePayload: record.releasePayload,
      changeControlPayload: record.changeControlPayload,
      historyPayload: record.historyPayload,
      createdAt: record.createdAt,
    }));
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Release history lookup failed." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session) {
    return NextResponse.json({ ok: false, error: "An authenticated human reviewer is required to record a recommendation release." }, { status: 401 });
  }
  const reviewer = sessionIdentity(auth.session);
  if (!reviewer.actorId || !reviewer.email || !RELEASE_ROLES.has(reviewer.role)) {
    return NextResponse.json({ ok: false, error: "Your account is not assigned recommendation-release authority.", requiredRoles: [...RELEASE_ROLES] }, { status: 403 });
  }

  try {
    const body = await req.json() as {
      subjectType?: string;
      subjectKey?: string;
      traceId?: string;
      release?: RecommendationReleaseRecord;
      decisionContext?: Record<string, unknown>;
    };
    if (!body.release) throw new Error("release is required.");
    const authorityBasis = "Authenticated workspace human-review release authority.";
    const result = await persistRecommendationRelease({
      subjectType: body.subjectType ?? "",
      subjectKey: body.subjectKey ?? "",
      traceId: body.traceId?.trim() || `recommendation-release-${Date.now()}`,
      release: body.release,
      reviewer: { ...reviewer, authorityBasis },
      decisionContext: body.decisionContext ?? {},
    });
    return NextResponse.json({
      ok: true,
      row: result.row,
      previousReleaseId: result.previous?.releaseId ?? null,
      reviewer: { actorId: reviewer.actorId, email: reviewer.email, name: reviewer.name, role: reviewer.role, authorityBasis },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Release persistence failed." }, { status: 400 });
  }
}
