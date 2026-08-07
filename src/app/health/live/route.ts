import { NextResponse } from "next/server";

/**
 * /health/live — liveness probe (STAGING-DEPLOY P2.3)
 *
 * Master Volume Governance:
 * - Vol III / III-B: deterministic runtime health posture — liveness is "the
 *   Node process answers HTTP", NOTHING more.
 * - Vol IV: the Cloud Run startup + liveness probe target.
 *
 * DELIBERATELY NO DATABASE QUERY. Database reachability is a READINESS /
 * diagnostic signal (/health/ready), never the liveness condition — a transient
 * DB blip must not cause pathological container recycling (spec P2.3).
 *
 * No diagnostic detail is exposed: anonymous callers get {ok:true} only.
 */

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true }, { status: 200 });
}
