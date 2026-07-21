import { NextRequest, NextResponse } from "next/server";
import { actorMayDecide, buildLaunchDecisionRollup, recordLaunchDecision } from "@/lib/governance/launchAuthorizationDecisionStore";
const email = (req: NextRequest) => req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() ?? "";
export async function GET(req: NextRequest) { const actor = email(req); if (!actor) return NextResponse.json({ ok: false, error: "Authenticated identity required." }, { status: 403 }); return NextResponse.json({ ok: true, actor, rollup: buildLaunchDecisionRollup() }); }
export async function POST(req: NextRequest) {
  const actor = email(req); if (!actor) return NextResponse.json({ ok: false, error: "Authenticated identity required." }, { status: 403 });
  const body = await req.json().catch(() => null) as { blockerId?: string; authorityRole?: string; decision?: "APPROVE"|"APPROVE_WITH_CONDITIONS"|"REJECT"; conditions?: string[]; evidenceRef?: string } | null;
  if (!body?.blockerId || !body.authorityRole || !body.decision || !["APPROVE","APPROVE_WITH_CONDITIONS","REJECT"].includes(body.decision)) return NextResponse.json({ ok: false, error: "A valid blocker, authority role, and decision are required." }, { status: 400 });
  if (!actorMayDecide(actor, body.authorityRole)) return NextResponse.json({ ok: false, error: "This identity is not assigned to the selected authority role." }, { status: 403 });
  try { const recorded = recordLaunchDecision({ blockerId: body.blockerId, authorityRole: body.authorityRole, decision: body.decision, decidedBy: actor, conditions: Array.isArray(body.conditions) ? body.conditions.filter((x) => typeof x === "string" && x.trim()).slice(0,20) : [], evidenceRef: body.evidenceRef?.trim() ?? "" }); return NextResponse.json({ ok: true, recorded, rollup: buildLaunchDecisionRollup() }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Decision could not be recorded." }, { status: 400 }); }
}
