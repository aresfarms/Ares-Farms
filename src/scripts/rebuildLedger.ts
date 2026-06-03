import { db } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { buildLedgerCanonicalWriter } from "@/lib/ledger/buildLedgerCanonicalWriter";

async function run() {
  console.log("TOTAL ROWS: fetching...");

  const entries = await db.select().from(auditEvents);

  console.log("TOTAL ROWS:", entries.length);

  // OPTION B: deterministic canonical writer
  const result = buildLedgerCanonicalWriter(entries);

  console.log("BROKEN AT:", result.brokenAt);
  console.log("ISSUES COUNT:", result.issues.length);

  if (result.issues.length > 0) {
    console.log("FIRST ISSUES:", result.issues.slice(0, 5));
  }

  // IMPORTANT:
  // We update only canonical hash fields.
  // We NEVER touch input/output/trace or event metadata.

  for (const entry of result.updated) {
    console.log("UPDATING:", entry.id);

    await db
      .update(auditEvents)
      .set({
        hash: entry.hash,
        prevHash: entry.prevHash,
        eventHash: entry.eventHash,
      })
      .where((auditEvents as any).id.eq(entry.id));
  }

  console.log("REBUILD COMPLETE");
}

run().catch((err) => {
  console.error("REBUILD FAILED:", err);
  process.exit(1);
});
