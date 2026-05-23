import { NextResponse } from "next/server";
import { replayCanonicalLedger } from "@/lib/ledger/replayCanonicalLedger";

/**
 * Option C RULE:
 * - API is a thin deterministic wrapper
 * - NO local validation logic
 * - NO partial state inference
 * - ONLY relies on replayCanonicalLedger output
 */

export async function GET() {
  try {
    const result = await replayCanonicalLedger();

    // HARD GUARANTEE: normalize output shape
    const verified = Boolean(result?.verified);
    const ok = Boolean(result?.ok);

    return NextResponse.json({
      ok,
      verified,
      count: result?.count ?? 0,
      head: result?.head ?? null,
      message: ok && verified
        ? "ledger_verified"
        : "ledger_inconsistent",
      verified_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        verified: false,
        error: "replay_verify_failed",
        message: err?.message ?? "unknown_error",
        verified_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
