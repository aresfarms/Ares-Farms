import { runPipeline } from "../src/lib/pipeline/runPipeline";

const BASE_URL = "http://localhost:3001";

async function run() {
  console.log("🚀 Running pipeline test...\n");

  const result = await runPipeline({
    userId: "test-user-001",
    name: "Test Farm Property",
    location: {
      state: "MD",
      county: "Carroll",
    },
    financials: {
      revenue: 250000,
      expenses: 120000,
    },
    metadata: {
      type: "row-crop",
      acres: 60,
    },
  });

  console.log("\n✅ PIPELINE OUTPUT:\n");
  console.dir(result, { depth: null });

  // FULL SYSTEM INTEGRITY CHECK (single authoritative call)
  console.log("\n🔍 VERIFYING AUDIT CHAIN...\n");

  try {
    const res = await fetch(`${BASE_URL}/api/audit/verify`);
    const audit = await res.json();

    console.log("\n🔐 AUDIT VERIFY RESULT:\n");
    console.dir(audit, { depth: null });

    if (!audit.ok || audit.valid === false) {
      throw new Error("AUDIT CHAIN INVALID");
    }

    console.log("\n🎯 AUDIT INTEGRITY OK ✔");
  } catch (err) {
    console.error("\n❌ AUDIT VERIFY FAILED:\n", err);
  }

  console.log("\n🎯 Pipeline test completed successfully\n");
}

run().catch((err) => {
  console.error("\n❌ PIPELINE FAILED:\n", err);
  process.exit(1);
});
