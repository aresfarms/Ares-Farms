import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  productionDataInventory,
  productionDataInventoryVersion,
  productionPiiAuthorization,
} from "@/lib/governance/productionDataClassificationInventory";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REVISION = process.env.P5_DATA_REVISION ?? "furlong-core-00096-s4t";

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function npmPass(script: string): boolean { try { sh("npm", ["run", "-s", script]); return true; } catch { return false; } }

function main(): void {
  const checks: Array<{ name: string; pass: boolean; evidence: string }> = [];
  const add = (name: string, pass: boolean, evidence: string) => checks.push({ name, pass, evidence });
  const liveRevision = gcloud(["run", "services", "describe", "furlong-core", "--region", "us-central1", "--format", "value(status.latestReadyRevisionName)"]);
  const liveImage = gcloud(["run", "services", "describe", "furlong-core", "--region", "us-central1", "--format", "value(spec.template.spec.containers[0].image)"]);

  add("target revision is live", liveRevision === REVISION, `${liveRevision} expected ${REVISION}`);
  add("live image is digest pinned", liveImage.includes("@sha256:"), liveImage);
  add("classification runtime conformance", npmPass("verify:classification"), "npm run verify:classification");
  add("public redaction smoke", npmPass("smoke:redaction"), "npm run smoke:redaction");
  add("production inventory smoke", npmPass("smoke:production-data-classification"), "npm run smoke:production-data-classification");
  add("inventory covers restricted data", productionDataInventory.some((entry) => entry.classification === "RESTRICTED"), "RESTRICTED entries present");
  add("inventory covers sovereign data", productionDataInventory.some((entry) => entry.classification === "SOVEREIGN_CONTROLLED"), "SOVEREIGN_CONTROLLED entries present");
  add("all entries define retention", productionDataInventory.every((entry) => Boolean(entry.retentionPolicy)), `${productionDataInventory.length} entries checked`);
  add("all entries define disposal", productionDataInventory.every((entry) => Boolean(entry.disposalRule)), `${productionDataInventory.length} entries checked`);
  add("all entries define legal holds", productionDataInventory.every((entry) => Boolean(entry.legalHoldRule)), `${productionDataInventory.length} entries checked`);
  add("all entries define redaction", productionDataInventory.every((entry) => entry.redactionRules.length > 0), `${productionDataInventory.length} entries checked`);
  add("all entries define authorized actors", productionDataInventory.every((entry) => entry.permittedActors.length > 0), `${productionDataInventory.length} entries checked`);
  add("automation preserves human approval gate", productionPiiAuthorization.approvalRequired && !productionPiiAuthorization.approvalGranted, JSON.stringify(productionPiiAuthorization));
  add("production PII remains blocked", !productionPiiAuthorization.productionPiiPermitted, "productionPiiPermitted=false");

  const failed = checks.filter((check) => !check.pass);
  const generatedAtUtc = new Date().toISOString();
  const report = {
    schemaVersion: "p5-data-classification-readiness-v1",
    environment: "staging",
    targetRevision: REVISION,
    targetImage: liveImage,
    blockerId: "P5-B02",
    blockerStatus: failed.length ? "OPEN" : "EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",
    outcome: failed.length ? "FAIL" : "PASS",
    productionAuthorized: false,
    productionPiiPermitted: false,
    inventoryVersion: productionDataInventoryVersion,
    inventory: productionDataInventory,
    authorization: productionPiiAuthorization,
    checks,
    generatedAtUtc,
  };
  const bytes = JSON.stringify(report, null, 2);
  const signingSecret = gcloud(["secrets", "versions", "access", "latest", "--secret", "REPORT_SIGNING_SECRET"]);
  const signatureRecord = {
    algorithm: "HMAC-SHA256",
    keyId: "gcp-secret-manager://REPORT_SIGNING_SECRET/latest",
    reportSha256: createHash("sha256").update(bytes).digest("hex"),
    signature: createHmac("sha256", signingSecret).update(bytes).digest("base64url"),
    signedAtUtc: generatedAtUtc,
  };
  const dir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  mkdirSync(dir, { recursive: true });
  const stamp = generatedAtUtc.replace(/[:.]/g, "-");
  const reportPath = path.join(dir, `${stamp}-p5-b02-data-classification.json`);
  const signaturePath = path.join(dir, `${stamp}-p5-b02-data-classification-signature.json`);
  writeFileSync(reportPath, bytes);
  writeFileSync(signaturePath, JSON.stringify(signatureRecord, null, 2));
  console.log(JSON.stringify({
    outcome: report.outcome,
    blockerStatus: report.blockerStatus,
    passed: checks.length - failed.length,
    total: checks.length,
    failed: failed.map((check) => check.name),
    reportPath: path.relative(process.cwd(), reportPath),
    signaturePath: path.relative(process.cwd(), signaturePath),
    ...signatureRecord,
  }, null, 2));
  if (failed.length) process.exit(1);
}

main();
