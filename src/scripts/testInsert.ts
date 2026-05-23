import { sealCanonicalEvent } from "@/lib/ledger/sealCanonicalEvent";

async function run() {
  console.log("🧪 Canonical ledger write-path test starting...");

  const result = await sealCanonicalEvent({
    id: `test-${Date.now()}`,
    userId: "test-user-001",
    eventType: "TEST_INSERT",
    decision: "PASS",
    compositeScore: 0.91,
    riskScore: 0.12,
    input: {
      source: "testInsert.ts",
      mode: "crypto-validation",
    },
    output: {
      ok: true,
      stage: "write-path-test",
    },
    trace: {
      step: "sealCanonicalEvent",
      phase: "final-crypto-write",
    },
  });

  console.log("✅ Insert successful:");
  console.log(result);
}

run()
  .then(() => {
    console.log("🏁 Test completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Test failed:");
    console.error(err);
    process.exit(1);
  });
