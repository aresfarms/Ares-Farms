import { calculatePropertyScore } from "../src/services/scoringEngine";

async function runTest() {
  try {
    const result = await calculatePropertyScore(
      "test-property-id"
    );

    console.log("✅ Property Score Result");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Test failed");
    console.error(err);
  }
}

runTest();
