import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { writeSealedAuditEvent } from "@/lib/ledger/auditSeal";
import { verifyAuditChain } from "@/lib/ledger/verifyAuditChain";

type Meta = {
  active_version: number;
  status: string;
};

async function getMeta(): Promise<Meta> {
  const res = await db.execute(sql`
    SELECT active_version, status
    FROM canonical_ledger_meta
    WHERE id = 'canonical'
    LIMIT 1;
  `);

  const row = res.rows?.[0] as Meta | undefined;

  if (!row) {
    throw new Error("CANONICAL_META_MISSING");
  }

  return row;
}

async function acquireLock() {
  const res = await db.execute(sql`
    UPDATE canonical_rebuild_lock
    SET locked = true,
        locked_at = now(),
        locked_by = 'finalize_promotion'
    WHERE id = 'canonical'
      AND locked = false
    RETURNING id;
  `);

  if (!res.rows || res.rows.length === 0) {
    throw new Error("PROMOTION_LOCK_FAILED");
  }
}

async function releaseLock() {
  await db.execute(sql`
    UPDATE canonical_rebuild_lock
    SET locked = false,
        locked_at = NULL,
        locked_by = NULL
    WHERE id = 'canonical';
  `);
}

async function assertVersionExists(version: number) {
  const res = await db.execute(sql`
    SELECT to_regclass(${`canonical_ledger_v${version}`}) IS NOT NULL AS exists;
  `);

  if (!(res.rows?.[0] as any)?.exists) {
    throw new Error(`MISSING_LEDGER_VERSION_${version}`);
  }
}

export async function finalizeCanonicalPromotion() {
  console.log("🚀 Finalizing canonical promotion (Option C + crypto enforcement)...");

  await acquireLock();

  try {
    const meta = await getMeta();

    const currentVersion = meta.active_version;
    const nextVersion = currentVersion + 1;

    console.log("🔎 Current version:", currentVersion);
    console.log("🔎 Target version:", nextVersion);

    // 1. Ensure target table exists
    await assertVersionExists(nextVersion);

    // 2. HARD SAFETY CHECK: prevent drift
    const maxVersionRes = await db.execute(sql`
      SELECT MAX(
        CAST(
          REPLACE(tablename, 'canonical_ledger_v', '') AS INT
        )
      ) AS max_version
      FROM pg_tables
      WHERE tablename LIKE 'canonical_ledger_v%';
    `);

    const maxVersion = (maxVersionRes.rows?.[0] as any)?.max_version;

    if (maxVersion !== nextVersion) {
      throw new Error(
        `VERSION_DRIFT_DETECTED expected=${nextVersion} actual=${maxVersion}`
      );
    }

    // 3. ATOMIC PROMOTION
    await db.execute(sql`
      UPDATE canonical_ledger_meta
      SET active_version = ${nextVersion},
          last_built_at = now(),
          status = 'promoted'
      WHERE id = 'canonical';
    `);

    // 4. VERIFY PROMOTION
    const verify = await getMeta();

    if (verify.active_version !== nextVersion) {
      throw new Error("PROMOTION_VERIFICATION_FAILED");
    }

    // 5. AUDIT SEALED EVENT (CRYPTO LINKED)
    await writeSealedAuditEvent({
      event_type: "PROMOTION_COMMITTED",
      status: "SUCCESS",
      version_from: currentVersion,
      version_to: nextVersion,
      metadata: {
        mode: "OPTION_C_FINAL",
      },
    });

    // 6. VERIFY AUDIT CHAIN INTEGRITY
    const auditCheck = await verifyAuditChain();

    if (!auditCheck.healthy) {
      throw new Error(
        `AUDIT_CHAIN_BROKEN_AT_INDEX=${auditCheck.brokenIndex}`
      );
    }

    console.log("✅ Promotion complete:", {
      from: currentVersion,
      to: nextVersion,
      auditHealthy: auditCheck.healthy,
    });

  } catch (err: any) {
    console.error("💥 Promotion failed:", err.message);

    throw err;
  } finally {
    await releaseLock();
  }
}

/**
 * CLI ENTRYPOINT
 */
if (require.main === module) {
  finalizeCanonicalPromotion()
    .then(() => {
      console.log("🟢 Promotion complete");
      process.exit(0);
    })
    .catch(() => {
      console.log("🔴 Promotion aborted");
      process.exit(1);
    });
}
