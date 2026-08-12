import { createHash, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT = process.env.GCP_PROJECT ?? "furlong-staging-499102";
const REGION = process.env.GCP_REGION ?? "us-central1";
const SERVICE = process.env.SERVICE ?? "furlong-core";

function sh(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function gcloud(args: string[]): string { return sh("gcloud", [...args, "--project", PROJECT]); }
function latestSeedRecord() {
  const dir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  const files = readdirSync(dir).filter((f) => f.endsWith("-seed.json")).sort();
  if (!files.length) throw new Error("No governed P4 seed record found.");
  const file = files.at(-1)!;
  return { file, path: path.join(dir, file), value: JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Record<string, unknown> };
}
async function http(url: string): Promise<{ status: number; body: string; location: string | null }> {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.text(), location: response.headers.get("location") };
}
function sign(bytes: string): { algorithm: string; keyId: string; signature: string } {
  const secret = gcloud(["secrets", "versions", "access", "latest", "--secret", "REPORT_SIGNING_SECRET"]);
  return {
    algorithm: "HMAC-SHA256",
    keyId: "gcp-secret-manager://REPORT_SIGNING_SECRET/latest",
    signature: createHmac("sha256", secret).update(bytes).digest("base64url"),
  };
}

async function main(): Promise<void> {
  const seed = latestSeedRecord();
  const seedValue = seed.value as { outcome?: string; cloudRunRevision?: string; imageDigest?: string; applicationId?: string; seededSteps?: number; guardrails?: Record<string, boolean>; seedRunId?: string };
  const targetRevision = process.env.P5_TARGET_REVISION ?? seedValue.cloudRunRevision;
  const expectedImage = process.env.P5_TARGET_IMAGE_DIGEST ?? seedValue.imageDigest;
  if (!targetRevision || !expectedImage) {
    throw new Error("The governed P4 seed record lacks the revision or image digest required for acceptance.");
  }
  const serviceUrl = gcloud(["run", "services", "describe", SERVICE, "--region", REGION, "--format", "value(status.url)"]);
  const revisionImage = gcloud(["run", "revisions", "describe", targetRevision, "--region", REGION, "--format", "value(spec.containers[0].image)"]);
  const revisionReady = gcloud(["run", "revisions", "describe", targetRevision, "--region", REGION, "--format", "value(status.conditions[0].status)"]);
  const migration = JSON.parse(gcloud(["run", "jobs", "executions", "list", "--job", "furlong-db-migrate", "--region", REGION, "--limit", "5", "--format", "json"])) as Array<Record<string, any>>;
  const runtime = JSON.parse(gcloud(["run", "jobs", "executions", "list", "--job", "furlong-runtime-verify", "--region", REGION, "--limit", "5", "--format", "json"])) as Array<Record<string, any>>;
  const checks: Array<{ name: string; pass: boolean; actual: string; evidence: string }> = [];
  const add = (name: string, pass: boolean, actual: string, evidence: string) => checks.push({ name, pass, actual, evidence });

  add("target revision ready", revisionReady === "True", revisionReady, targetRevision);
  add("target image digest exact", revisionImage.endsWith(`@${expectedImage}`), revisionImage, expectedImage);
  add("P4 seed bound to target revision", seedValue.cloudRunRevision === targetRevision, String(seedValue.cloudRunRevision), seed.file);
  add("P4 seed outcome PASS", seedValue.outcome === "PASS", String(seedValue.outcome), seed.file);
  add("seeded workflow breadth", (seedValue.seededSteps ?? 0) >= 14, String(seedValue.seededSteps), "14 governed workflow steps required");
  add("seed prohibited-action guardrails", Boolean(seedValue.guardrails) && !Object.values(seedValue.guardrails ?? {}).some(Boolean), JSON.stringify(seedValue.guardrails), seed.file);
  add("migration execution succeeded", migration.some((e) => (e.status?.succeededCount ?? 0) >= 1 && !(e.status?.failedCount ?? 0)), migration[0]?.metadata?.name ?? "NONE", "Cloud Run job history");
  add("runtime privilege verification succeeded", runtime.some((e) => (e.status?.succeededCount ?? 0) >= 1 && !(e.status?.failedCount ?? 0)), runtime[0]?.metadata?.name ?? "NONE", "Cloud Run job history");

  const publicHome = await http(`${serviceUrl}/`);
  const publicSurfaces = await http(`${serviceUrl}/api/public/surfaces`);
  const internal = await http(`${serviceUrl}/operator-demo`);
  const applicationId = seedValue.applicationId ?? "";
  add("anonymous edge remains IAP-blocked", publicHome.status === 302, `HTTP ${publicHome.status}`, publicHome.location ?? "no location");
  add("internal workflow remains IAP-blocked", internal.status === 302, `HTTP ${internal.status}`, internal.location ?? "no location");
  add("public API contains no seeded application identifier", !publicSurfaces.body.includes(applicationId), `HTTP ${publicSurfaces.status}; leaked=${publicSurfaces.body.includes(applicationId)}`, "/api/public/surfaces");
  add("homepage contains no seeded application identifier", !publicHome.body.includes(applicationId), `leaked=${publicHome.body.includes(applicationId)}`, "/");

  const logFilter = `resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE}\" AND resource.labels.revision_name=\"${targetRevision}\" AND jsonPayload.policy=\"staging-seed-authority\"`;
  const logCountRaw = gcloud(["logging", "read", logFilter, "--limit", "200", "--format", "value(jsonPayload.route)"]);
  const routes = logCountRaw.split("\n").map((v) => v.trim()).filter(Boolean);
  const expectedRoutes = ["/api/onboard","/api/apply","/api/documents/submit","/api/documents/storage-handoff","/api/queues/operator","/api/connectors/source-check","/api/rules/evaluate","/api/reviews/human","/api/connectors/credentialed-ingestion","/api/partners/workflows","/api/reports/pdf"];
  const missingRoutes = expectedRoutes.filter((route) => !routes.includes(route));
  add("all governed seed route families observed in Cloud Logging", missingRoutes.length === 0, missingRoutes.length ? `missing: ${missingRoutes.join(", ")}` : `${new Set(routes).size} route families`, "api-perimeter staging-seed-authority logs");

  const blockers = [
    ["P5-B01","Named tester acceptance","Caitlin Hudson / Stuart Fraass","Both named testers record PASS or documented findings","OPEN"],
    ["P5-B02","Production data classification and PII authorization","Data Rights Officer","Approved PII inventory, retention and redaction evidence","OPEN"],
    ["P5-B03","Financing activation authority","Credit/Eligibility Authority","Qualified human approval and lender workflow controls","OPEN"],
    ["P5-B04","Live source legal and licensing approval","Source Legal Authority","Source-by-source license, ToS, retention and display approval","OPEN"],
    ["P5-B05","External connector activation","Qualified Governance Reviewer","Certified adapters, monitoring, rollback and kill-switch proof","OPEN"],
    ["P5-B06","Payments and billing activation","Chief Governance Authority","Payment processor, refund, dispute and reconciliation gates","OPEN"],
    ["P5-B07","Official reports and notices","Regulatory Liaison Authority","Official-use templates, delivery receipts and adverse-action review","OPEN"],
    ["P5-B08","Security and incident readiness","Security/Operations Authority","Production threat model, incident drill and alert evidence","OPEN"],
    ["P5-B09","Production database and backup recovery","Platform Operations Authority","Restore drill, PITR evidence and production migration approval","OPEN"],
    ["P5-B10","Release board, DNS and final launch hold","Production Release Board","Quorum approval, DNS plan, rollback and final hold release","OPEN"],
  ].map(([id,title,owner,passCondition,status]) => ({ id,title,owner,passCondition,status }));

  const generatedAtUtc = new Date().toISOString();
  const failed = checks.filter((check) => !check.pass);
  const acceptance = {
    schemaVersion: "p5-seeded-workflow-acceptance-v1",
    environment: "staging",
    targetRevision,
    targetImageDigest: expectedImage,
    seedRunId: seedValue.seedRunId,
    applicationId,
    outcome: failed.length === 0 ? "PASS" : "FAIL",
    automatedAcceptanceOnly: true,
    namedTesterAcceptance: "PENDING",
    productionAuthorized: false,
    checks,
    blockerSummary: { total: blockers.length, open: blockers.filter((b) => b.status === "OPEN").length },
    generatedAtUtc,
  };
  const blockerReport = { schemaVersion: "p5-production-blocker-ledger-v1", environment: "staging", targetRevision, productionAuthorized: false, blockers, generatedAtUtc };
  const acceptanceBytes = JSON.stringify(acceptance, null, 2);
  const blockerBytes = JSON.stringify(blockerReport, null, 2);
  const stamp = generatedAtUtc.replace(/[:.]/g, "-");
  const dir = path.join(process.cwd(), "artifacts", "deployments", "staging");
  mkdirSync(dir, { recursive: true });
  const acceptancePath = path.join(dir, `${stamp}-${targetRevision}-p5-acceptance.json`);
  const blockersPath = path.join(dir, `${stamp}-${targetRevision}-p5-blockers.json`);
  const signature = sign(`${acceptanceBytes}\n${blockerBytes}`);
  const signatureRecord = { ...signature, acceptanceSha256: createHash("sha256").update(acceptanceBytes).digest("hex"), blockerReportSha256: createHash("sha256").update(blockerBytes).digest("hex"), signedAtUtc: generatedAtUtc };
  const signaturePath = path.join(dir, `${stamp}-${targetRevision}-p5-signature.json`);
  writeFileSync(acceptancePath, acceptanceBytes);
  writeFileSync(blockersPath, blockerBytes);
  writeFileSync(signaturePath, JSON.stringify(signatureRecord, null, 2));
  console.log(JSON.stringify({ outcome: acceptance.outcome, passedChecks: checks.length - failed.length, totalChecks: checks.length, failedChecks: failed.map((c) => c.name), openBlockers: blockers.length, acceptancePath: path.relative(process.cwd(), acceptancePath), blockerReportPath: path.relative(process.cwd(), blockersPath), signaturePath: path.relative(process.cwd(), signaturePath), ...signatureRecord }, null, 2));
  if (failed.length) process.exit(1);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
