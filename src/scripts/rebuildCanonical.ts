import { buildCanonicalView } from "@/lib/ledger/buildCanonicalView";

/**
 * OPTION C RULE:
 * Canonical rebuild is now a NO-OP.
 * Canonical data is always derived at read time.
 */

async function run() {
  console.log("🚫 canonical rebuild disabled (Option C)");
  console.log("✔ canonical_* is derived from audit_events in real-time");

  const view = await buildCanonicalView();

  console.log("📊 audit_events projection loaded:", {
    rows: view.length,
  });

  console.log("ℹ️ No writes performed. System is read-model only.");
}

run().catch((err) => {
  console.error("❌ canonical script error:", err);
  process.exit(1);
});
