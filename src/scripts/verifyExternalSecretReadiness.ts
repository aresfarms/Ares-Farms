import {
  externalSecretInventory,
  governedLocalSecretNames,
  validateExternalSecretInventory,
} from "@/lib/security/externalSecretInventory";

const issues = validateExternalSecretInventory();
const pending = externalSecretInventory.secrets
  .filter((entry) => entry.rotationStatus !== "ROTATED")
  .map((entry) => ({ name: entry.name, status: entry.rotationStatus }));

console.log(JSON.stringify({
  ok: issues.length === 0 && pending.length === 0,
  approvedStore: externalSecretInventory.approvedStore,
  gcpProjectId: externalSecretInventory.gcpProjectId,
  governedSecretCount: governedLocalSecretNames.length,
  inventoryIssues: issues,
  pendingRotation: pending,
  valuesDisplayed: false,
}, null, 2));

if (issues.length > 0 || pending.length > 0) process.exitCode = 1;
