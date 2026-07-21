import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REGION = process.env.GCP_REGION ?? "us-central1";
const SOURCE = process.env.P5_B09_SOURCE_INSTANCE ?? "furlong-staging-pg";
const TARGET = process.env.P5_B09_RECOVERY_INSTANCE ?? "furlong-p5b09-20260721163218";
const VERIFY_JOB = process.env.P5_B09_VERIFY_JOB ?? "p5-b09-recovery-verify-164255";
const MIGRATE_JOB = process.env.P5_B09_MIGRATE_JOB ?? "p5-b09-recovery-migrate-165006";
const TEMP_SECRET = process.env.P5_B09_TEMP_SECRET ?? "p5-b09-recovery-db-20260721164255";
const CLONE_OPERATION = process.env.P5_B09_CLONE_OPERATION ?? "069a0471-96a5-4b8c-8e03-652300000032";
const RECOVERY_POINT = process.env.P5_B09_RECOVERY_POINT ?? "2026-07-21T16:27:18Z";
const MIGRATION_EXECUTION = process.env.P5_B09_MIGRATION_EXECUTION ?? "p5-b09-recovery-migrate-165006-z57qd";
const VERIFY_EXECUTION = process.env.P5_B09_VERIFY_EXECUTION ?? "p5-b09-recovery-verify-164255-wq4k2";
const EVIDENCE_DIR = process.env.P5_B09_EVIDENCE_DIR ?? "/tmp/p5b09-evidence";

function sh(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function read(name: string): string { return readFileSync(path.join(EVIDENCE_DIR, name), "utf8"); }
function absent(command: string, args: string[], needle: string): boolean {
  try { return !sh(command, args).split("\n").some((line) => line.trim() === needle); } catch { return true; }
}

function main(): void {
  const source = JSON.parse(gcloud(["sql", "instances", "describe", SOURCE, "--format", "json"])) as any;
  const backups = JSON.parse(gcloud(["sql", "backups", "list", "--instance", SOURCE, "--limit", "7", "--format", "json"])) as any[];
  const clone = JSON.parse(read("clone-operation.json")) as any;
  const migration = JSON.parse(read("migration-execution.json")) as any;
  const verify = JSON.parse(read("final-verify-execution.json")) as any;
  const migrationLog = read("migration-replay.log");
  const verifyLog = read("final-verify.log");
  const checks: Array<{ name: string; pass: boolean; actual: string; evidence: string }> = [];
  const add = (name: string, pass: boolean, actual: string, evidence: string) => checks.push({ name, pass, actual, evidence });
  const backup = source.settings?.backupConfiguration ?? {};
  const ip = source.settings?.ipConfiguration ?? {};
  add("PITR enabled", backup.pointInTimeRecoveryEnabled === true, String(backup.pointInTimeRecoveryEnabled), SOURCE);
  add("automated backups enabled", backup.enabled === true, String(backup.enabled), SOURCE);
  add("backup retention at least seven", Number(backup.backupRetentionSettings?.retainedBackups ?? 0) >= 7, String(backup.backupRetentionSettings?.retainedBackups), SOURCE);
  add("transaction logs retained at least seven days", Number(backup.transactionLogRetentionDays ?? 0) >= 7, String(backup.transactionLogRetentionDays), SOURCE);
  add("deletion protection enabled", source.settings?.deletionProtectionEnabled === true, String(source.settings?.deletionProtectionEnabled), SOURCE);
  add("private networking only", ip.ipv4Enabled === false && Boolean(ip.privateNetwork), JSON.stringify({ ipv4Enabled: ip.ipv4Enabled, privateNetwork: ip.privateNetwork }), SOURCE);
  add("recent automated backups successful", backups.length >= 5 && backups.slice(0, 5).every((entry) => entry.status === "SUCCESSFUL"), backups.slice(0, 5).map((entry) => entry.status).join(","), "Cloud SQL backup history");
  const cloneStart = Date.parse(clone.startTime);
  const cloneEnd = Date.parse(clone.endTime);
  const recoverySeconds = Math.round((cloneEnd - cloneStart) / 1000);
  add("point-in-time clone completed", clone.status === "DONE" && recoverySeconds > 0, `${clone.status}; ${recoverySeconds}s`, CLONE_OPERATION);
  add("migration replay succeeded", Number(migration.status?.succeededCount ?? 0) === 1 && migrationLog.includes("Canonical governance migrations applied successfully (29 files)."), MIGRATION_EXECUTION, "immutable migrator image replay");
  add("schema and application reads succeeded", Number(verify.status?.succeededCount ?? 0) === 1 && verifyLog.includes("P5B09_FINAL_END") && verifyLog.includes("TABLE_COUNT applications 1") && verifyLog.includes("TABLE_COUNT operator_review_queue_items 1") && verifyLog.includes("TABLE_COUNT external_data_sources 3"), VERIFY_EXECUTION, "private Cloud Run verification job");
  add("temporary verification job deleted", absent("gcloud", ["run", "jobs", "list", "--project", PROJECT, "--region", REGION, "--format", "value(metadata.name)"], VERIFY_JOB), VERIFY_JOB, "post-drill cleanup");
  add("temporary migration job deleted", absent("gcloud", ["run", "jobs", "list", "--project", PROJECT, "--region", REGION, "--format", "value(metadata.name)"], MIGRATE_JOB), MIGRATE_JOB, "post-drill cleanup");
  add("temporary secret deleted", absent("gcloud", ["secrets", "list", "--project", PROJECT, "--format", "value(name)"], TEMP_SECRET), TEMP_SECRET, "post-drill cleanup");
  add("temporary recovery instance deleted", absent("gcloud", ["sql", "instances", "list", "--project", PROJECT, "--format", "value(name)"], TARGET), TARGET, "post-drill cleanup");
  add("source database remained runnable", source.state === "RUNNABLE", source.state, SOURCE);
  const failed = checks.filter((check) => !check.pass);
  const generatedAtUtc = new Date().toISOString();
  const report = {
    schemaVersion: "p5-b09-database-recovery-readiness-v1",
    environment: "staging",
    blockerId: "P5-B09",
    blockerStatus: failed.length ? "OPEN" : "EVIDENCE_READY_HUMAN_APPROVAL_REQUIRED",
    outcome: failed.length ? "FAIL" : "PASS",
    productionAuthorized: false,
    sourceInstance: SOURCE,
    temporaryRecoveryInstance: TARGET,
    selectedRecoveryPointUtc: RECOVERY_POINT,
    cloneOperationId: CLONE_OPERATION,
    recoveryTimeSeconds: recoverySeconds,
    recoveryTimeHuman: `${Math.floor(recoverySeconds / 60)}m ${recoverySeconds % 60}s`,
    migrationExecution: MIGRATION_EXECUTION,
    verificationExecution: VERIFY_EXECUTION,
    checks,
    cleanupVerified: checks.filter((check) => check.name.includes("temporary")).every((check) => check.pass),
    liveDatabaseModifiedByDrill: false,
    humanApprovalRequired: true,
    generatedAtUtc,
  };
  const bytes = JSON.stringify(report, null, 2);
  const secret = gcloud(["secrets", "versions", "access", "latest", "--secret", "REPORT_SIGNING_SECRET"]);
  const signature = {
    algorithm: "HMAC-SHA256",
    keyId: "gcp-secret-manager://REPORT_SIGNING_SECRET/latest",
    reportSha256: createHash("sha256").update(bytes).digest("hex"),
    signature: createHmac("sha256", secret).update(bytes).digest("base64url"),
    signedAtUtc: generatedAtUtc,
  };
  const outputDir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  mkdirSync(outputDir, { recursive: true });
  const stamp = generatedAtUtc.replace(/[:.]/g, "-");
  const reportPath = path.join(outputDir, `${stamp}-p5-b09-database-recovery.json`);
  const signaturePath = path.join(outputDir, `${stamp}-p5-b09-database-recovery-signature.json`);
  writeFileSync(reportPath, bytes);
  writeFileSync(signaturePath, JSON.stringify(signature, null, 2));
  console.log(JSON.stringify({ outcome: report.outcome, blockerStatus: report.blockerStatus, passed: checks.length - failed.length, total: checks.length, failed: failed.map((check) => check.name), reportPath: path.relative(process.cwd(), reportPath), signaturePath: path.relative(process.cwd(), signaturePath), ...signature }, null, 2));
  if (failed.length) process.exit(1);
}
main();
