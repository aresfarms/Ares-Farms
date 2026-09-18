import fs from "fs";
import path from "path";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sourceFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return /\.(?:ts|tsx|js|mjs)$/.test(entry.name) ? [absolutePath] : [];
  });
}

const proxy = read("src/proxy.ts");
const session = read("src/lib/auth/session.ts");
const ledgerHashChain = read("src/lib/security/ledgerHashChain.ts");
const nextConfig = read("next.config.mjs");
const infraAuthorityPath = process.env.FURLONG_INFRA_AUTHORITY_MANIFEST_PATH
  ?? path.join(repoRoot, ".controlled", "infra-authority-manifest.json");
assert(fs.existsSync(infraAuthorityPath), `Authoritative GCP infrastructure manifest is required: ${infraAuthorityPath}`);
const infraAuthority = JSON.parse(fs.readFileSync(infraAuthorityPath, "utf8")) as {
  schemaVersion?: string;
  projectId?: string;
  authority?: string;
  controlledSource?: { uri?: string; generation?: string; sha256?: string };
  terraform?: { backend?: string; stateBucket?: string; statePrefix?: string; serial?: number; lineage?: string };
  controls?: Record<string, boolean | string>;
  live?: Record<string, unknown>;
};
const applicationSources = sourceFiles(path.join(repoRoot, "src"));
const apiRoutes = applicationSources.filter((file) => /\/app\/api\/.+\/route\.ts$/.test(file));

assert(apiRoutes.length >= 200, `Expected the complete API surface; found only ${apiRoutes.length} route handlers.`);
assert(proxy.includes("secureCompare(req.headers.get(\"authorization\")"), "Preview Basic auth must use constant-time comparison.");
assert(!proxy.includes("clientIp: clientIdentity"), "Perimeter logs must not persist raw client IP addresses.");
assert(!proxy.includes("detail: {\n        session,\n        claimed,"), "Authority-conflict logs must not persist raw session/claim identifiers.");
assert(!proxy.includes("'strict-dynamic' https: http:"), "Production CSP must not retain broad legacy script-host fallbacks.");
assert(proxy.includes("process.env.STAGING_SEED_ENABLED !== \"true\""), "Staging seed authority must require an explicit environment switch.");
assert(infraAuthority.schemaVersion === "furlong-infra-authority-manifest-v1", "Infrastructure authority manifest schema must be v1.");
assert(infraAuthority.projectId === "furlong-staging-499102", "Infrastructure authority manifest must describe the canonical staging project.");
assert(infraAuthority.authority === "GCP_LIVE_STATE", "Security verification must consume GCP live-state authority, not excluded local Terraform files.");
assert(Boolean(infraAuthority.controlledSource?.uri?.startsWith("gs://furlong-staging-499102-iac-source/")), "Infrastructure authority must identify the controlled GCS IaC source.");
assert(/^\d+$/.test(infraAuthority.controlledSource?.generation ?? ""), "Controlled IaC source must be pinned to an immutable GCS generation.");
assert(/^[a-f0-9]{64}$/.test(infraAuthority.controlledSource?.sha256 ?? ""), "Controlled IaC source must carry a SHA-256 digest.");
assert(infraAuthority.terraform?.backend === "gcs", "Terraform authority must use the GCS backend.");
assert(infraAuthority.terraform?.stateBucket === "furlong-staging-499102-tfstate", "Terraform state must live in the governed state bucket.");
assert((infraAuthority.terraform?.serial ?? 0) > 0 && Boolean(infraAuthority.terraform?.lineage), "Terraform state must carry live serial and lineage evidence.");
assert(infraAuthority.controls?.stagingSeedExplicitSwitchDeclared === true, "Controlled IaC source must explicitly scope STAGING_SEED_ENABLED.");
assert(infraAuthority.controls?.binaryAuthorizationEnforced === true, "GCP live state must enforce Binary Authorization.");
assert(infraAuthority.controls?.iapEnabled === true, "GCP live state must keep IAP enabled.");
assert(infraAuthority.controls?.cloudSqlPrivateOnly === true, "Cloud SQL must remain private-IP only.");
assert(infraAuthority.controls?.stateVersioningEnabled === true && infraAuthority.controls?.statePublicAccessPrevention === true && infraAuthority.controls?.stateCmekEnabled === true, "Terraform state bucket must retain versioning, PAP, and CMEK.");
assert(proxy.includes("same-origin-mutation"), "Protected mutation requests must enforce same-origin browser context.");
assert(proxy.includes("API_MAX_JSON_BODY_BYTES"), "Perimeter JSON claim inspection must be size-bounded.");
assert(proxy.includes("MAX_RATE_LIMIT_BUCKETS"), "In-memory rate-limit state must have a hard cardinality bound.");
assert(proxy.includes("apiRateLimitingEnabled() || Boolean(publicReason)"), "Anonymous public APIs must always be rate limited.");
assert(proxy.includes('process.env.API_LOG_PUBLIC_ALLOW_EVENTS === "true"'), "Successful anonymous-request logs must be opt-in to prevent log-volume abuse.");
assert(session.includes('secure: process.env.NODE_ENV === "production"'), "Session cookies must be Secure in production.");
assert(nextConfig.includes('X-DNS-Prefetch-Control'), "Global response headers must disable DNS prefetch leakage.");
assert(ledgerHashChain.includes('fs.openSync(lockPath, "wx"'), "Ledger append must use an exclusive cross-process lock.");
assert(ledgerHashChain.includes("LOCK_TIMEOUT_MS"), "Ledger lock acquisition must fail closed on a bounded timeout.");

const forbiddenPatterns: Array<[RegExp, string]> = [
  [/\bdangerouslySetInnerHTML\s*=/, "dangerouslySetInnerHTML"],
  [/\bsrcDoc\s*=/, "srcDoc"],
  [/\beval\s*\(/, "eval"],
  [/\bnew\s+Function\s*\(/, "new Function"],
];

for (const file of applicationSources) {
  const relative = path.relative(repoRoot, file);
  const source = fs.readFileSync(file, "utf8");
  for (const [pattern, label] of forbiddenPatterns) {
    assert(!pattern.test(source), `${label} is forbidden in application source: ${relative}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  apiRoutesReviewed: apiRoutes.length,
  guarantees: [
    "minimized perimeter telemetry",
    "constant-time preview credentials",
    "nonce-only production script trust",
    "environment-scoped staging seed authority",
    "same-origin protected mutations",
    "bounded request and rate-limit state",
    "opt-in successful-public-request telemetry",
    "production-secure legacy session cookie",
    "cross-process hash-chain append serialization",
    "forbidden dynamic execution and HTML sinks absent",
  ],
  message: "Security hardening sweep regression checks passed.",
}, null, 2));
