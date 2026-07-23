import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { acknowledgeRecommendationReleaseEscalation, listPendingRecommendationReleaseAttestations } from "@/lib/intelligence/recommendationReleaseStore";

export const runtime = "nodejs";

const RELEASE_ROLES = new Set(["admin", "governance", "underwriter"]);

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user) {
    return NextResponse.json({ ok: false, error: "Authentication is required to view pending release attestations." }, { status: 401 });
  }
  const actorId = String((auth.session.user as any).id ?? "").trim();
  const role = String((auth.session.user as any).role ?? "user").trim().toLowerCase();
  if (!actorId || !RELEASE_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "Your account is not assigned recommendation-release review authority." }, { status: 403 });
  }
  try {
    const rows = await listPendingRecommendationReleaseAttestations({
      actorId,
      subjectType: req.nextUrl.searchParams.get("subjectType") ?? undefined,
      subjectKey: req.nextUrl.searchParams.get("subjectKey") ?? undefined,
    });
    return NextResponse.json({ ok: true, serverTime: new Date().toISOString(), rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Pending release lookup failed." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok || !auth.session?.user) return NextResponse.json({ ok: false, error: "Authentication is required." }, { status: 401 });
  const user = auth.session.user as any;
  const actorId = String(user.id ?? "").trim();
  const email = String(user.email ?? "").trim();
  const role = String(user.role ?? "user").trim().toLowerCase();
  if (!actorId || !email || !RELEASE_ROLES.has(role)) return NextResponse.json({ ok: false, error: "Your account is not assigned recommendation-release review authority." }, { status: 403 });
  try {
    const body = await req.json() as { releaseId?: string; attestationCycleId?: string; traceId?: string };
    await acknowledgeRecommendationReleaseEscalation({
      releaseId: body.releaseId ?? "",
      attestationCycleId: body.attestationCycleId ?? "",
      actor: { actorId, email, name: String(user.name ?? "").trim() || null, role },
      traceId: body.traceId,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Escalation acknowledgement failed." }, { status: 400 });
  }
}
