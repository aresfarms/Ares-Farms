import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Canonical Ledger API
 *
 * Master Volume Governance:
 * - Vol I: Exposes governed canonical ledger state.
 * - Vol III: Uses the canonical database access path.
 * - Vol IV: Supports operational ledger inspection.
 * - Vol V: Supports replay verification and explainability.
 */

type MetaRow = {
  id?: string;
  active_version?: string;
  activeVersion?: string;
  promoted_at?: string;
  promotedAt?: string;
  [key: string]: unknown;
};

export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT *
      FROM canonical_ledger_meta
      ORDER BY promoted_at DESC
      LIMIT 1
    `);

    const rows = Array.isArray(result) ? result : [];

    const latestMeta = rows[0] as MetaRow | undefined;

    return NextResponse.json({
      ok: true,
      source: "canonical_ledger_meta",
      activeVersion:
        latestMeta?.active_version ??
        latestMeta?.activeVersion ??
        null,
      promotedAt:
        latestMeta?.promoted_at ??
        latestMeta?.promotedAt ??
        null,
      meta: latestMeta ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "canonical_ledger_meta",
        error:
          error instanceof Error
            ? error.message
            : "Unknown canonical ledger error",
      },
      { status: 500 }
    );
  }
}
