import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * /health/ready — readiness / diagnostic probe (STAGING-DEPLOY P2.3)
 *
 * Master Volume Governance:
 * - Vol III / III-B: readiness = "the process can reach its database", checked
 *   with ONE bounded, lightweight query. Distinct from liveness (/health/live,
 *   no DB) so DB blips never recycle containers.
 * - Vol IV: the P2.4 deployed-environment verification target ("/health/ready
 *   confirms DB connectivity").
 * - Vol V: audit-safe output — diagnostic detail is PROTECTED. Callers never
 *   receive DB names, addresses, versions, or exception text (spec P2.3);
 *   the payload is {ok, ready} plus a coarse reason token only.
 *
 * Bounded: the DB check races a hard timeout so a hung connection returns an
 * honest 503 quickly instead of tying up the probe.
 */

export const dynamic = "force-dynamic";

const READY_CHECK_TIMEOUT_MS = 2_000;

async function boundedDbCheck(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("ready-check-timeout")),
      READY_CHECK_TIMEOUT_MS
    );
  });

  try {
    await Promise.race([db.execute(sql`select 1`), timeout]);
    return true;
  } catch {
    // Swallow detail deliberately — no exception text leaves this handler.
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET(): Promise<NextResponse> {
  const ready = await boundedDbCheck();

  if (!ready) {
    return NextResponse.json(
      { ok: false, ready: false, reason: "dependency-unavailable" },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, ready: true }, { status: 200 });
}
