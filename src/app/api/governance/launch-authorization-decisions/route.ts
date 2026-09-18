import { NextRequest, NextResponse } from "next/server";
import { actorMayDecide, actorMayUseStagingUltimateAuthority, buildLaunchDecisionRollup, recordLaunchDecision, recordStagingUltimateAuthorityOverrides } from "@/lib/governance/launchAuthorizationDecisionStore";

const email = (req: NextRequest) =>
  req.headers.get("x-ares-authenticated-email")?.trim().toLowerCase() ?? "";

function actorRollup(actor: string) {
  const rollup = buildLaunchDecisionRollup();
  return {
    ...rollup,
    slots: rollup.slots.map((slot) => ({
      ...slot,
      canDecide: actorMayDecide(actor, slot.authorityRole),
    })),
  };
}

export async function GET(req: NextRequest) {
  const actor = email(req);
  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Authenticated identity required." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true, actor, testAuthorityEnabled: actorMayUseStagingUltimateAuthority(actor), rollup: actorRollup(actor) });
}

export async function POST(req: NextRequest) {
  const actor = email(req);
  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Authenticated identity required." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null) as
    | {
        action?: "APPROVE_ALL_ASSIGNED" | "STAGING_TEST_OVERRIDE_ALL";
        ttlMinutes?: number;
        blockerId?: string;
        authorityRole?: string;
        decision?: "APPROVE" | "APPROVE_WITH_CONDITIONS" | "REJECT";
        conditions?: string[];
        evidenceRef?: string;
      }
    | null;

  if (body?.action === "STAGING_TEST_OVERRIDE_ALL") {
    if (!actorMayUseStagingUltimateAuthority(actor)) return NextResponse.json({ ok: false, error: "Staging ultimate-authority mode is not enabled for this identity." }, { status: 403 });
    const overrides = recordStagingUltimateAuthorityOverrides({ decidedBy: actor, evidenceRef: body.evidenceRef?.trim() || "staging-ultimate-authority-test", ttlMinutes: body.ttlMinutes });
    return NextResponse.json({ ok: true, actor, testAuthorityEnabled: true, testOverride: { recorded: overrides.length, expiresAtUtc: overrides[0]?.expiresAtUtc ?? null }, rollup: actorRollup(actor) });
  }

  if (body?.action === "APPROVE_ALL_ASSIGNED") {
    const eligible = buildLaunchDecisionRollup().slots.filter(
      (slot) => !slot.decision && actorMayDecide(actor, slot.authorityRole)
    );
    const recorded = eligible.map((slot) =>
      recordLaunchDecision({
        blockerId: slot.blockerId,
        authorityRole: slot.authorityRole,
        decision: "APPROVE",
        decidedBy: actor,
        conditions: [],
        evidenceRef: body.evidenceRef?.trim() || "launch-authorization-batch-approval",
      })
    );
    return NextResponse.json({
      ok: true,
      batch: { recorded: recorded.length, skipped: buildLaunchDecisionRollup().required - recorded.length },
      rollup: actorRollup(actor),
    });
  }

  if (
    !body?.blockerId ||
    !body.authorityRole ||
    !body.decision ||
    !["APPROVE", "APPROVE_WITH_CONDITIONS", "REJECT"].includes(body.decision)
  ) {
    return NextResponse.json(
      { ok: false, error: "A valid blocker, authority role, and decision are required." },
      { status: 400 }
    );
  }

  if (!actorMayDecide(actor, body.authorityRole)) {
    return NextResponse.json(
      { ok: false, error: "This identity is not assigned to the selected authority role." },
      { status: 403 }
    );
  }

  try {
    const recorded = recordLaunchDecision({
      blockerId: body.blockerId,
      authorityRole: body.authorityRole,
      decision: body.decision,
      decidedBy: actor,
      conditions: Array.isArray(body.conditions)
        ? body.conditions.filter((x) => typeof x === "string" && x.trim()).slice(0, 20)
        : [],
      evidenceRef: body.evidenceRef?.trim() ?? "",
    });
    return NextResponse.json({ ok: true, recorded, rollup: actorRollup(actor) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Decision could not be recorded." },
      { status: 400 }
    );
  }
}
