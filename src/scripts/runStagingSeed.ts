import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REGION = process.env.GCP_REGION ?? "us-central1";
const SERVICE = process.env.SERVICE ?? "furlong-core";
const VERIFY_SA = process.env.VERIFY_SA ?? `furlong-verify@${PROJECT}.iam.gserviceaccount.com`;

function sh(cmd: string, args: string[], env?: Record<string, string>): string {
  return execFileSync(cmd, args, { encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function mintIapJwt(serviceUrl: string): string {
  const now = Math.floor(Date.now() / 1000);
  const dir = mkdtempSync(path.join(tmpdir(), "furlong-seed-"));
  const claimPath = path.join(dir, "claim.json");
  const outPath = path.join(dir, "out.jwt");
  try {
    writeFileSync(claimPath, JSON.stringify({ iss: VERIFY_SA, sub: VERIFY_SA, aud: `${serviceUrl}/*`, iat: now, exp: now + 600, email: VERIFY_SA }));
    sh("gcloud", ["iam", "service-accounts", "sign-jwt", "--iam-account", VERIFY_SA, claimPath, outPath]);
    return readFileSync(outPath, "utf8").trim();
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
function main(): void {
  const gitHead = sh("git", ["rev-parse", "--short", "HEAD"]);
  const serviceUrl = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(status.url)"]);
  const revision = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(status.latestReadyRevisionName)"]);
  const image = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(spec.template.spec.containers[0].image)"]);
  if (!image.includes("@sha256:")) throw new Error(`Staging image is not digest-pinned: ${image}`);
  const seedRunId = process.env.DEMO_SEED_RUN_ID ?? `staging-p4-${revision}`;
  const bearer = mintIapJwt(serviceUrl);
  const stagingSeedSecret = gcloud(["secrets", "versions", "access", "latest", "--secret", "STAGING_SEED_SHARED_SECRET"]);
  const output = sh("npm", ["run", "-s", "demo:seed"], { BACKEND_SMOKE_BASE_URL: serviceUrl, VERIFY_BEARER_TOKEN: bearer, STAGING_SEED_SHARED_SECRET: stagingSeedSecret, DEMO_SEED_RUN_ID: seedRunId });
  const seed = JSON.parse(output) as { ok?: boolean; runId?: string; applicationId?: string; guardrails?: Record<string, boolean>; steps?: unknown[] };
  if (seed.ok !== true || seed.runId !== seedRunId || !seed.applicationId || !Array.isArray(seed.steps) || seed.steps.length < 10) throw new Error(`Seed output failed verification: ${output}`);
  if (!seed.guardrails || Object.values(seed.guardrails).some(Boolean)) throw new Error("Seed guardrails indicate a prohibited action occurred.");
  const generatedAtUtc = new Date().toISOString();
  const record = { environment: "staging", outcome: "PASS", gitHead, project: PROJECT, region: REGION, service: SERVICE, serviceUrl, cloudRunRevision: revision, imageDigest: image.split("@")[1], seedRunId, applicationId: seed.applicationId, seededSteps: seed.steps.length, guardrails: seed.guardrails, generatedAtUtc };
  const bytes = JSON.stringify(record, null, 2);
  const stamp = generatedAtUtc.replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${stamp}-${gitHead}-seed.json`);
  writeFileSync(outPath, bytes);
  console.log(JSON.stringify({ ...record, recordSha256: createHash("sha256").update(bytes).digest("hex"), recordPath: path.relative(process.cwd(), outPath) }, null, 2));
}
main();
