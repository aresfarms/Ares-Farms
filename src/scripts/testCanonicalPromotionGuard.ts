import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { finalizeCanonicalPromotion } from "@/scripts/finalizeCanonicalPromotion";

async function getMeta() {
  const res = await db.execute(sql`
    SELECT active_version, status
    FROM canonical_ledger_meta
    WHERE id = 'canonical'
    LIMIT 1;
  `);

  return res.rows?.[0];
}

async function getLock() {
  const res = await db.execute(sql`
    SELECT locked, locked_at, locked_by
    FROM canonical_rebuild_lock
    WHERE id = 'canonical'
    LIMIT 1;
  `);

  return res.rows?.[0];
}

async function resetLock() {
  await db.execute(sql`
    UPDATE canonical_rebuild_lock
    SET locked = false,
        locked_at = NULL,
        locked_by = NULL
    WHERE id = 'canonical';
  `);
}

export async function runPromotionGuardTest() {
  console.log("🧪 Running Canonical Promotion Guard Test (Option C)");

  // ----------------------------
  // BASELINE STATE
  // ----------------------------
  const before = await getMeta();
  console.log("📊 BEFORE:", before);

  await resetLock();

  // ----------------------------
  // TEST 1: FAILURE + ROLLBACK
  // ----------------------------
  console.log("\n🔴 TEST 1: Forced failure rollback");

  try {
    process.env.FORCE_FAIL = "true";

    await finalizeCanonicalPromotion();

    console.log("❌ ERROR: expected failure did not occur");
  } catch (err: any) {
    console.log("✅ Failure triggered as expected:", err.message);
  } finally {
    process.env.FORCE_FAIL = "false";
  }

  const afterFail = await getMeta();
  console.log("📊 AFTER FAILURE:", afterFail);

  // ----------------------------
  // TEST 2: LOCK SAFETY
  // ----------------------------
  console.log("\n🔒 TEST 2: Lock enforcement");

  await db.execute(sql`
    UPDATE canonical_rebuild_lock
    SET locked = true,
        locked_by = 'test-harness'
    WHERE id = 'canonical';
  `);

  try {
    await finalizeCanonicalPromotion();
    console.log("❌ ERROR: lock was bypassed");
  } catch (err: any) {
    console.log("✅ Lock enforced correctly:", err.message);
  }

  await resetLock();

  // ----------------------------
  // FINAL STATE CHECK
  // ----------------------------
  const finalMeta = await getMeta();
  const finalLock = await getLock();

  console.log("\n📊 FINAL META:", finalMeta);
  console.log("🔐 FINAL LOCK:", finalLock);

  console.log("\n✅ Promotion Guard Test Complete");
}

runPromotionGuardTest().catch((err) => {
  console.error("💥 Guard test failed:", err);
  process.exit(1);
});
