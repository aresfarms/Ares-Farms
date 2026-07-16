import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canonicalTargetSchemaVersion } from "@/lib/db/canonicalGovernanceMigrations";

/**
 * deploy:verify-manifest — P2.4 deployed-environment verification + P2.5
 * deployment manifest, as ONE command (STAGING-DEPLOY P2).
 *
 * Master Volume Governance:
 * - Vol III / III-B: the deployed posture is PROVEN, not asserted — every
 *   derivable manifest field is read from gcloud/git/HTTP, never hand-typed.
 * - Vol IV: the single post-deploy verification step of the staging runbook.
 * - Vol V: replayable record — manifest + gate report + sha256 linkage.
 *
 * What it does, in order:
 *   1. Derives facts: git HEAD, terraform commit, Cloud Run revision + image
 *      digest, service-level run.invoker members, latest migration Job
 *      execution, schema version (canonical registry).
 *   2. Runs the P2.4 checks against the LIVE service (IAM-private, so
 *      authenticated with the operator's identity token):
 *        - anonymous invocation is BLOCKED at the edge (401/403);
 *        - no allUsers / allAuthenticatedUsers invoker binding;
 *        - authenticated homepage 200 with the app surface present;
 *        - /health/live 200 (process) and /health/ready 200 (DB confirmed);
 *        - /internal walls to sign-in (app-level wall behind IAM);
 *        - anonymous /api/audit rejected;
 *        - verify:csp-hydration against the deployed URL (bearer-forwarded);
 *        - latest furlong-db-migrate execution SUCCEEDED.
 *   3. On ALL GREEN: writes
 *        artifacts/deployments/staging/<UTC>-<gitSHA>.json         (manifest)
 *        artifacts/deployments/staging/<UTC>-<gitSHA>-gates.json   (gate report)
 *      with manifest.gateReportSha256 = sha256(gate report bytes).
 *      On ANY failure: writes ONLY the gate report and exits non-zero — a
 *      manifest is never emitted for a red deploy.
 *
 * Posture constants (combinedProductionReady=false, openBlockers=10,
 * piiPermitted=false, financingEnabled=false, dnsCutoverAuthorized=false)
 * are hard-coded HERE so they cannot be hand-edited per-run; iapEnabled and
 * anonymousInvocationAllowed are DERIVED from the deployed environment and the
 * run fails if the anonymous edge posture is open. dataSeedStatus stays
 * NOT_LOADED until P4.
 *
 * Usage (after the Stage-2 apply):
 *   npm run deploy:verify-manifest
 * Optional env: GCP_PROJECT (furlong-staging-499102), GCP_REGION (us-central1),
 * SERVICE (furlong-core), JOB (furlong-db-migrate).
 */

// NOTE: the bare "furlong-staging" project ID was taken globally; the real
// staging project is furlong-staging-499102 (name "furlong-staging").
const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REGION = process.env.GCP_REGION ?? "us-central1";
const SERVICE = process.env.SERVICE ?? "furlong-core";
const JOB = process.env.JOB ?? "furlong-db-migrate";
const VERIFY_JOB = process.env.VERIFY_JOB ?? "furlong-runtime-verify";

interface Check {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
}
const checks: Check[] = [];
function record(name: string, expected: string, actual: string, pass: boolean) {
  checks.push({ name, expected, actual, pass });
  console.log(`  ${pass ? "✓" : "✗"} ${name} — ${actual}`);
}

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function gcloud(args: string[]): string {
  return sh("gcloud", [...args, "--project", PROJECT]);
}

async function http(
  url: string,
  bearer?: string
): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
  });
  return { status: res.status, body: await res.text() };
}

async function main(): Promise<void> {
  console.log(`deploy:verify-manifest — ${SERVICE} @ ${PROJECT}/${REGION}\n`);

  // ---- 1. Derived facts ------------------------------------------------------
  const gitHead = sh("git", ["rev-parse", "--short", "HEAD"]);
  const terraformCommit = sh("git", ["log", "-1", "--format=%h", "--", "infra/staging"]);

  const serviceUrl = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(status.url)"]);
  const revision = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(status.latestReadyRevisionName)"]);
  const image = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(spec.template.spec.containers[0].image)"]);
  const imageDigest = image.includes("@") ? image.split("@")[1] : `UNPINNED(${image})`;
  const serviceDescribeText = gcloud(["run", "services", "describe", SERVICE, "--region", REGION]);
  const iapEnabled = /Iap Enabled:\s+true/i.test(serviceDescribeText);

  const iamPolicy = JSON.parse(
    gcloud(["run", "services", "get-iam-policy", SERVICE, "--region", REGION, "--format", "json"])
  ) as { bindings?: Array<{ role: string; members: string[] }> };
  const invokerMembers = (iamPolicy.bindings ?? [])
    .filter((b) => b.role === "roles/run.invoker")
    .flatMap((b) => b.members);

  const executions = JSON.parse(
    gcloud(["run", "jobs", "executions", "list", "--job", JOB, "--region", REGION, "--limit", "1", "--format", "json"])
  ) as Array<{ metadata?: { name?: string }; status?: { succeededCount?: number; failedCount?: number } }>;
  const lastExecution = executions[0];
  const migrationJobExecution = lastExecution?.metadata?.name ?? "NONE";

  const verifyExecutions = JSON.parse(
    gcloud(["run", "jobs", "executions", "list", "--job", VERIFY_JOB, "--region", REGION, "--limit", "1", "--format", "json"])
  ) as Array<{ metadata?: { name?: string }; status?: { succeededCount?: number; failedCount?: number } }>;
  const lastVerifyExecution = verifyExecutions[0];
  const runtimeVerifyExecution = lastVerifyExecution?.metadata?.name ?? "NONE";

  const bearer = sh("gcloud", ["auth", "print-identity-token"]);

  // ---- 2. P2.4 checks --------------------------------------------------------
  console.log("P2.4 checks:");

  // Image pinned by digest (P2.1).
  record("image pinned by digest", "@sha256:…", imageDigest, imageDigest.startsWith("sha256:"));

  // No anonymous-invoke bindings (IAM scan).
  const forbidden = invokerMembers.filter((m) => m === "allUsers" || m === "allAuthenticatedUsers");
  record(
    "no allUsers/allAuthenticatedUsers invoker binding",
    "none",
    forbidden.length ? forbidden.join(",") : `none (invokers: ${invokerMembers.join(", ") || "—"})`,
    forbidden.length === 0
  );

  // Anonymous invocation blocked at the edge.
  const anon = await http(`${serviceUrl}/`);
  record("anonymous invocation blocked at edge", "401/403", `HTTP ${anon.status}`, anon.status === 401 || anon.status === 403);

  // Authenticated homepage serves the app.
  const home = await http(`${serviceUrl}/`, bearer);
  record(
    "authenticated homepage serves app",
    "200 + app surface",
    `HTTP ${home.status}, ${home.body.length}B`,
    home.status === 200 && home.body.length > 5000
  );

  // Health: live (no DB) and ready (DB confirmed) — distinct signals.
  const live = await http(`${serviceUrl}/health/live`, bearer);
  record("/health/live", "200", `HTTP ${live.status}`, live.status === 200);
  const ready = await http(`${serviceUrl}/health/ready`, bearer);
  record("/health/ready (DB confirmed)", "200", `HTTP ${ready.status}`, ready.status === 200);

  // App-level operator wall still intact BEHIND the IAM edge.
  const internal = await http(`${serviceUrl}/internal`, bearer);
  record("/internal walls to sign-in", "3xx redirect", `HTTP ${internal.status}`, internal.status >= 300 && internal.status < 400);

  // Anonymous API rejected (edge; app would 401 as second layer).
  const audit = await http(`${serviceUrl}/api/audit`);
  record("anonymous /api/audit rejected", "401/403", `HTTP ${audit.status}`, audit.status === 401 || audit.status === 403);

  // Migration job's latest execution succeeded (P2.2 already run).
  const jobOk = (lastExecution?.status?.succeededCount ?? 0) >= 1 && !(lastExecution?.status?.failedCount ?? 0);
  record("furlong-db-migrate latest execution SUCCEEDED", "succeeded", migrationJobExecution, jobOk);

  const verifyJobOk =
    (lastVerifyExecution?.status?.succeededCount ?? 0) >= 1 &&
    !(lastVerifyExecution?.status?.failedCount ?? 0);
  record(
    "furlong-runtime-verify latest execution SUCCEEDED",
    "succeeded",
    runtimeVerifyExecution,
    verifyJobOk
  );

  // Strict-CSP hydration against the deployed URL (bearer forwarded).
  let cspPass = false;
  let cspTail = "";
  try {
    const out = execFileSync("npm", ["run", "-s", "verify:csp-hydration"], {
      encoding: "utf8",
      env: { ...process.env, BASE_URL: serviceUrl, VERIFY_BEARER_TOKEN: bearer },
      stdio: ["ignore", "pipe", "pipe"],
    });
    cspPass = true;
    cspTail = out.trim().split("\n").pop() ?? "PASS";
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    cspTail = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim().split("\n").slice(-3).join(" | ");
  }
  record("verify:csp-hydration @ deployed URL", "PASS", cspTail.slice(0, 160), cspPass);

  // ---- 3. Gate report + manifest ---------------------------------------------
  const failed = checks.filter((c) => !c.pass);
  const deployedAtUtc = new Date().toISOString();
  const stamp = deployedAtUtc.replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  mkdirSync(outDir, { recursive: true });

  const gateReport = {
    operation: "deploy:verify-manifest (P2.4)",
    outcome: failed.length === 0 ? "PASS" : "FAIL",
    serviceUrl,
    totalChecks: checks.length,
    failedChecks: failed.length,
    checks,
    generatedAtUtc: deployedAtUtc,
  };
  const gateBytes = JSON.stringify(gateReport, null, 2);
  const gatePath = path.join(outDir, `${stamp}-${gitHead}-gates.json`);
  writeFileSync(gatePath, gateBytes);
  console.log(`\ngate report: ${path.relative(process.cwd(), gatePath)}`);

  if (failed.length > 0) {
    console.error(`\n✗ P2.4 FAIL — ${failed.length} check(s) failed; NO manifest emitted for a red deploy.`);
    process.exit(1);
  }

  const manifest = {
    environment: "staging",
    gitHead,
    imageDigest,
    terraformCommit,
    cloudRunRevision: revision,
    migrationJobExecution,
    runtimeVerifyExecution,
    schemaVersion: canonicalTargetSchemaVersion(),
    p2InvokerPrincipals: invokerMembers,
    gateReportSha256: createHash("sha256").update(gateBytes).digest("hex"),
    deployedAtUtc,
    gcpProjectId: PROJECT,
    region: REGION,
    // Posture constants — fixed here so they are never hand-edited per run.
    combinedProductionReady: false,
    openBlockers: 10,
    piiPermitted: false,
    financingEnabled: false,
    dnsCutoverAuthorized: false,
    iapEnabled,
    anonymousInvocationAllowed: false, // DERIVED green above or we exited 1
    dataSeedStatus: "NOT_LOADED",      // P4 changes this via migrate/seed flow
  };
  const manifestPath = path.join(outDir, `${stamp}-${gitHead}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`manifest:    ${path.relative(process.cwd(), manifestPath)}`);
  console.log(`\n✓ P2.4 PASS — manifest emitted. URL stays UNSHARED until P3 (IAP).`);
}

main().catch((error: unknown) => {
  console.error(
    "deploy:verify-manifest FAILED —",
    error instanceof Error ? error.message : "unknown error"
  );
  process.exit(1);
});
