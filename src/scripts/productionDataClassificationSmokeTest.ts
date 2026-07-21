import fs from "node:fs";
import path from "node:path";

import {
  productionDataInventory,
  productionDataInventoryVersion,
  productionPiiAuthorization,
} from "@/lib/governance/productionDataClassificationInventory";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  assert(productionDataInventoryVersion.length > 0, "Inventory version is missing.");
  assert(productionDataInventory.length >= 8, "Production inventory is not broad enough.");
  const ids = new Set<string>();
  for (const entry of productionDataInventory) {
    assert(!ids.has(entry.id), `Duplicate inventory id: ${entry.id}`);
    ids.add(entry.id);
    assert(entry.schemaRefs.length > 0, `${entry.id} has no schema references.`);
    assert(entry.fields.length > 0, `${entry.id} has no fields.`);
    assert(entry.piiTypes.length > 0, `${entry.id} has no PII types.`);
    assert(entry.retentionPolicy.length > 0, `${entry.id} has no retention policy.`);
    assert(entry.disposalRule.length > 0, `${entry.id} has no disposal rule.`);
    assert(entry.legalHoldRule.length > 0, `${entry.id} has no legal hold rule.`);
    assert(entry.redactionRules.length > 0, `${entry.id} has no redaction rules.`);
    assert(entry.permittedActors.length > 0, `${entry.id} has no permitted actors.`);
    assert(entry.humanApprovalRequired, `${entry.id} must require human approval.`);
  }
  assert(productionDataInventory.some((entry) => entry.classification === "SOVEREIGN_CONTROLLED"), "Sovereign-controlled data is not inventoried.");
  assert(productionDataInventory.some((entry) => entry.externalDisclosure === "PROHIBITED"), "No prohibited-disclosure class exists.");
  assert(productionDataInventory.some((entry) => entry.aiUse === "PROHIBITED"), "No AI-prohibited class exists.");
  assert(!productionPiiAuthorization.approvalGranted, "Automation must not grant Data Rights Officer approval.");
  assert(!productionPiiAuthorization.productionPiiPermitted, "Production PII must remain blocked before human approval.");

  const requiredFiles = [
    "src/db/schema/dataClassificationRegistry.ts",
    "src/lib/runtime/classificationRuntime.ts",
    "src/scripts/classificationConformanceTest.ts",
    "src/scripts/redactionSmokeTest.ts",
  ];
  for (const file of requiredFiles) {
    assert(fs.existsSync(path.join(process.cwd(), file)), `Required control is missing: ${file}`);
  }

  console.log(JSON.stringify({
    ok: true,
    checkedAt: new Date().toISOString(),
    inventoryVersion: productionDataInventoryVersion,
    inventoryEntries: productionDataInventory.length,
    blockerId: productionPiiAuthorization.blockerId,
    humanApprovalRequired: true,
    productionPiiPermitted: false,
    message: "Production data classification inventory smoke test passed fail-closed.",
  }, null, 2));
}

main();
