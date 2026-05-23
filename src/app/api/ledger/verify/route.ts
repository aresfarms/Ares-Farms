import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // =========================================
    // META
    // =========================================

    const metaResult = await db.execute(sql`
      SELECT *
      FROM canonical_ledger_meta
      WHERE id = 'canonical'
      LIMIT 1;
    `);

    const meta = metaResult.rows?.[0] ?? null;

    if (!meta) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_meta"
        },
        { status: 500 }
      );
    }

    const activeVersion = Number(meta.active_version);

    if (!activeVersion || Number.isNaN(activeVersion)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_active_version"
        },
        { status: 500 }
      );
    }

    // =========================================
    // CHAIN STATS
    // =========================================

    const chainStats = await db.execute(sql.raw(`
      SELECT
        COUNT(*) FILTER (WHERE prev_hash IS NULL) AS roots,
        COUNT(*) FILTER (WHERE prev_hash IS NOT NULL) AS linked,
        COUNT(*) AS total
      FROM canonical_ledger_v${activeVersion};
    `));

    // =========================================
    // ORPHAN CHECK
    // =========================================

    const orphanStats = await db.execute(sql.raw(`
      SELECT COUNT(*) AS orphan_count
      FROM canonical_ledger_v${activeVersion} a
      LEFT JOIN canonical_ledger_v${activeVersion} b
        ON a.prev_hash = b.event_hash
      WHERE a.prev_hash IS NOT NULL
        AND b.event_hash IS NULL;
    `));

    // =========================================
    // HASH COVERAGE
    // =========================================

    const hashCoverage = await db.execute(sql.raw(`
      SELECT
        COUNT(*) FILTER (WHERE event_hash IS NOT NULL) AS hashed_rows,
        COUNT(*) AS total_rows
      FROM canonical_ledger_v${activeVersion};
    `));

    // =========================================
    // RESPONSE
    // =========================================

    return NextResponse.json({
      ok: true,

      active_version: activeVersion,

      meta,

      chain: chainStats.rows?.[0] ?? null,

      orphans: orphanStats.rows?.[0] ?? null,

      hashes: hashCoverage.rows?.[0] ?? null,

      verified_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("VERIFY API FAILED:", err);

    return NextResponse.json(
      {
        ok: false,
        error: "verify_failed",
        message: err?.message ?? "unknown_error"
      },
      { status: 500 }
    );
  }
}
