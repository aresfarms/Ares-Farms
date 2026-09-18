import { readFileSync } from "node:fs";
import { buildPostSaleTaxScenario, type OwnershipCostContext } from "@/lib/property/ownershipCostModel";

const context = (effectiveRatePct: number): OwnershipCostContext => ({
  rates: { weekOf: "2026-07-24", rate30: 6.5, rate15: null },
  taxContext: { medianAnnualTax: 4_000, medianHomeValue: 200_000, effectiveRatePct },
  electricity: null,
  hpi: null,
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`POST-SALE-TAX-001 failed: ${message}`);
}

const shocks = [
  { name: "2x bill", price: 400_000, seller: 4_000, rate: 2, expected: 8_000, multiplier: 2 },
  { name: "3x bill", price: 600_000, seller: 4_000, rate: 2, expected: 12_000, multiplier: 3 },
  { name: "4x bill", price: 800_000, seller: 4_000, rate: 2, expected: 16_000, multiplier: 4 },
];

for (const shock of shocks) {
  const result = buildPostSaleTaxScenario({
    price: shock.price,
    sellerCurrentAnnualTax: shock.seller,
    currentTaxTransfersUnchanged: false,
  }, context(shock.rate));
  assert(result.status === "post-transfer-unresolved", `${shock.name}: status must remain unresolved`);
  assert(result.qualificationAnnual === shock.expected, `${shock.name}: qualification must use stabilized buyer tax`);
  assert(result.multiplierVsSeller === shock.multiplier, `${shock.name}: wrong multiplier`);
  assert(result.buyerFirstYearAnnual === null, `${shock.name}: first-year bill must not be invented`);
  assert(result.warning.includes("Do not rely on the seller's current bill"), `${shock.name}: warning missing`);
}

const verified = buildPostSaleTaxScenario({
  price: 600_000,
  sellerCurrentAnnualTax: 4_000,
  currentTaxTransfersUnchanged: true,
}, context(2));
assert(verified.status === "transfer-verified", "verified transfer status missing");
assert(verified.qualificationAnnual === 4_000, "verified transferable bill should be usable");

const modelSource = readFileSync("src/lib/property/ownershipCostModel.ts", "utf8");
assert(modelSource.includes('label: "Property taxes — buyer-side planning"'), "buyer-side tax line missing");
assert(!modelSource.includes('label: "Property taxes",'), "legacy generic tax line remains");
assert(modelSource.includes('monthly.find((line) => line.label === "Property taxes — buyer-side planning")'), "qualification is not wired to buyer-side tax line");

console.log(JSON.stringify({
  ok: true,
  rule: "POST-SALE-TAX-001",
  shocks: shocks.map((shock) => ({ name: shock.name, sellerAnnual: shock.seller, buyerAnnual: shock.expected, multiplier: shock.multiplier })),
  verifiedTransferAnnual: verified.qualificationAnnual,
}, null, 2));
