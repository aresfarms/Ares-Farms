import fs from "node:fs";
const cloud = fs.readFileSync("cloudbuild.yaml", "utf8");
const required = [
  "verify:cloud-build-release-rule",
  "verify:official-evidence-source-governance",
  "verify:official-evidence-refresh-writer",
  "verify:official-evidence-durable-refresh",
  "verify:official-evidence-connector-registry",
  "verify:official-evidence-connector-durability",
  "verify:official-evidence-connector-change-control",
  "verify:official-evidence-connector-implementation-binding",
  "verify:official-evidence-refresh-provenance",
  "verify:official-evidence-read-provenance",
  "verify:official-evidence-quarantine",
  "verify:official-evidence-quarantine-resolution",
  "verify:official-evidence-downstream-invalidation",
  "verify:official-evidence-automatic-dependency-capture",
  "verify:official-evidence-recomputation-orchestration",
  "verify:official-evidence-scheduled-recomputation",
  "verify:official-evidence-durable-handler-governance",
  "verify:official-evidence-signed-replay",
  "verify:official-evidence-replay-key-rotation",
  "verify:official-evidence-deterministic-replay",
  "verify:official-evidence-production-replay-review",
  "verify:official-evidence-production-activation",
  "verify:official-evidence-activation-ceremony",
  "verify:official-evidence-scheduler-release",
  "verify:official-evidence-live-bootstrap",
  "verify:official-evidence-batch-replay",
  "verify:official-evidence-approval-packet",
  "verify:official-evidence-approval-completion",
  "verify:official-evidence-review-handoff",
  "verify:official-evidence-final-canary-packet",
  "verify:official-evidence-canary-transcript",
  "verify:official-evidence-post-resume-watchdog",
  "verify:official-evidence-steady-state-incident",
  "verify:official-evidence-incident-sla",
  "verify:official-evidence-incident-notification",
  "verify:official-evidence-external-notification-connector",
  "verify:official-property-source-adapters",
  "verify:structured-official-evidence",
  "verify:property-evidence-ingestion",
  "verify:property-evidence-panel",
  "verify:property-evidence-manifest",
  "verify:public-action-evidence",
  "verify:water-insurance-evidence",
  "verify:unified-property-risk",
  "verify:tax-aware-top-three",
  "verify:post-sale-tax",
  "verify:property-entry-parity",
];
for (const command of required)
  if (!cloud.includes(`npm run ${command}`))
    throw new Error(`Cloud Build is missing required roadmap gate: ${command}`);
if (!cloud.includes("images:"))
  throw new Error("Cloud Build must publish immutable build artifacts.");
console.log(
  JSON.stringify(
    { ok: true, rule: "GOOGLE-CLOUD-BUILD-REQUIRED-001", required },
    null,
    2,
  ),
);
