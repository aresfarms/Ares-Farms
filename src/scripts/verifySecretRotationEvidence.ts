import {
  externalSecretInventory,
  validateExternalSecretInventory,
} from "@/lib/security/externalSecretInventory";

const issues = validateExternalSecretInventory();
const traversalInventory = {
  ...externalSecretInventory,
  secrets: externalSecretInventory.secrets.map((entry) => entry.name === "REPORT_SIGNING_SECRET"
    ? { ...entry, rotationEvidence: "../outside-evidence.json" }
    : entry),
};
const traversalIssues = validateExternalSecretInventory(traversalInventory);
if (!traversalIssues.some((issue) => issue.includes("repository-relative path"))) {
  throw new Error("Traversal-shaped rotation evidence was not rejected.");
}

console.log(JSON.stringify({
  ok: issues.length === 0,
  evidenceFilesValidated: true,
  evidenceRestrictedToArtifacts: true,
  secretAndProjectBindingValidated: true,
  providerRevocationAndConnectorEvidenceRequired: true,
  traversalEvidenceRejected: true,
  valuesDisplayed: false,
  issues,
}, null, 2));

if (issues.length > 0) process.exitCode = 1;
