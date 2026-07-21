import { NextRequest, NextResponse } from "next/server";
import { buildRollup, normalizeTester, recordAttestation, type Finding, type Verdict } from "@/lib/acceptance/namedTesterAcceptance";

function actor(req: NextRequest) { return normalizeTester(req.headers.get("x-ares-authenticated-email")); }
export async function GET(req: NextRequest) { const tester = actor(req); if (!tester) return NextResponse.json({ ok: false, error: "Named tester identity required." }, { status: 403 }); return NextResponse.json({ ok: true, currentTester: tester, rollup: buildRollup() }); }
export async function POST(req: NextRequest) {
  const tester = actor(req); if (!tester) return NextResponse.json({ ok: false, error: "Named tester identity required." }, { status: 403 });
  const body = await req.json().catch(() => null) as { verdict?: Verdict; findings?: Finding[] } | null;
  if (!body || !["PASS", "PASS_WITH_FINDINGS", "FAIL"].includes(body.verdict ?? "")) return NextResponse.json({ ok: false, error: "A valid verdict is required." }, { status: 400 });
  const findings = Array.isArray(body.findings) ? body.findings.filter((f) => f && typeof f.summary === "string" && f.summary.trim()).slice(0, 25) : [];
  try { const attestation = recordAttestation({ testerEmail: tester, verdict: body.verdict!, findings }); return NextResponse.json({ ok: true, attestation, rollup: buildRollup() }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Acceptance could not be recorded." }, { status: 400 }); }
}
