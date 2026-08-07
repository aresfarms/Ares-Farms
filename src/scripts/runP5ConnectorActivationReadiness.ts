import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { productionConnectorActivationAuthorization as authorization, productionConnectorActivationInventory as inventory, productionConnectorActivationVersion as inventoryVersion } from "@/lib/governance/productionConnectorActivationInventory";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_CONNECTOR_REVISION ?? "furlong-core-00099";
function sh(cmd: string, args: string[]): string { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function npmPass(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }
function main(): void {
  const checks: Array<{ name: string; pass: boolean; evidence: string }> = [];
  const add = (name: string, pass: boolean, evidence: string) => checks.push({ name, pass, evidence });
  const liveRevision = gcloud(["run", "services", "describe", "furlong-core", "--region", "us-central1", "--format", "value(status.latestReadyRevisionName)"]);
  const liveImage = gcloud(["run", "services", "describe", "furlong-core", "--region", "us-central1", "--format", "value(spec.template.spec.containers[0].image)"]);
  add("target revision is live", liveRevision === REVISION, `${liveRevision} expected ${REVISION}`);
  add("live image is digest pinned", liveImage.includes("@sha256:"), liveImage);
  add("production connector activation smoke", npmPass("smoke:production-connector-activation"), "npm run smoke:production-connector-activation");
  add("connector certification v1", npmPass("smoke:connector-certification"), "npm run smoke:connector-certification");
  add("connector certification v2", npmPass("smoke:connector-certification-v2"), "npm run smoke:connector-certification-v2");
  add("external connector execution gate", existsSync(path.join(process.cwd(), "src/app/api/connectors/execution/route.ts")) && existsSync(path.join(process.cwd(), "src/scripts/externalConnectorExecutionSmokeTest.ts")), "execution route and governed integration smoke are present; live calls remain disabled");
  add("all connectors inventoried", inventory.length > 0, `${inventory.length} connectors`);
  add("certified adapters required", inventory.every((x) => x.adapterCertificationRequired), "all connectors");
  add("monitoring required", inventory.every((x) => x.monitoringAndAlertingRequired), "all connectors");
  add("rollback required", inventory.every((x) => x.rollbackPlanRequired), "all connectors");
  add("kill switch required", inventory.every((x) => x.killSwitchRequired), "all connectors");
  add("provenance and replay required", inventory.every((x) => x.provenanceRequired && x.deterministicReplayRequired), "all connectors");
  add("source legal approval required", inventory.every((x) => x.sourceLegalApprovalRequired), "all connectors");
  add("human approval preserved", authorization.approvalRequired && !authorization.approvalGranted, JSON.stringify(authorization));
  add("live execution remains blocked", inventory.every((x) => !x.liveExecutionPermitted) && !authorization.liveExternalExecutionPermitted, "liveExternalExecutionPermitted=false");
  const failed = checks.filter((x) => !x.pass); const generatedAtUtc = new Date().toISOString();
  const report = { schemaVersion: "p5-connector-activation-readiness-v1", environment: "staging", targetRevision: REVISION, targetImage: liveImage, blockerId: "P5-B05", blockerStatus: failed.length ? "OPEN" : "EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED", outcome: failed.length ? "FAIL" : "PASS", productionAuthorized: false, liveExternalExecutionPermitted: false, inventoryVersion, inventory, authorization, checks, generatedAtUtc };
  const bytes = JSON.stringify(report, null, 2); const secret = gcloud(["secrets", "versions", "access", "latest", "--secret", "REPORT_SIGNING_SECRET"]);
  const signatureRecord = { algorithm: "HMAC-SHA256", keyId: "gcp-secret-manager://REPORT_SIGNING_SECRET/latest", reportSha256: createHash("sha256").update(bytes).digest("hex"), signature: createHmac("sha256", secret).update(bytes).digest("base64url"), signedAtUtc: generatedAtUtc };
  const dir = path.join(process.cwd(), "artifacts", "deployments", "staging"); mkdirSync(dir, { recursive: true }); const stamp = generatedAtUtc.replace(/[:.]/g, "-");
  const reportPath = path.join(dir, `${stamp}-p5-b05-connector-activation.json`); const signaturePath = path.join(dir, `${stamp}-p5-b05-connector-activation-signature.json`);
  writeFileSync(reportPath, bytes); writeFileSync(signaturePath, JSON.stringify(signatureRecord, null, 2));
  console.log(JSON.stringify({ outcome: report.outcome, blockerStatus: report.blockerStatus, passed: checks.length - failed.length, total: checks.length, failed: failed.map((x) => x.name), reportPath: path.relative(process.cwd(), reportPath), signaturePath: path.relative(process.cwd(), signaturePath), ...signatureRecord }, null, 2));
  if (failed.length) process.exit(1);
}
main();
