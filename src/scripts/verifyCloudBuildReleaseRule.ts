import fs from "node:fs";
const cloud = fs.readFileSync("cloudbuild.yaml", "utf8");
const required = ["verify:cloud-build-release-rule", "verify:official-evidence-source-governance", "verify:official-evidence-refresh-writer", "verify:official-evidence-durable-refresh", "verify:official-property-source-adapters", "verify:structured-official-evidence", "verify:property-evidence-ingestion", "verify:property-evidence-panel", "verify:property-evidence-manifest", "verify:public-action-evidence", "verify:water-insurance-evidence", "verify:unified-property-risk", "verify:tax-aware-top-three", "verify:post-sale-tax", "verify:property-entry-parity"];
for (const command of required) if (!cloud.includes(`npm run ${command}`)) throw new Error(`Cloud Build is missing required roadmap gate: ${command}`);
if (!cloud.includes("images:")) throw new Error("Cloud Build must publish immutable build artifacts.");
console.log(JSON.stringify({ ok: true, rule: "GOOGLE-CLOUD-BUILD-REQUIRED-001", required }, null, 2));
