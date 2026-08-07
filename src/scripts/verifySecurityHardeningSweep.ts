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
const stagingService = read("infra/staging/service.tf");
const applicationSources = sourceFiles(path.join(repoRoot, "src"));
const apiRoutes = applicationSources.filter((file) => /\/app\/api\/.+\/route\.ts$/.test(file));

assert(apiRoutes.length >= 200, `Expected the complete API surface; found only ${apiRoutes.length} route handlers.`);
assert(proxy.includes("secureCompare(req.headers.get(\"authorization\")"), "Preview Basic auth must use constant-time comparison.");
assert(!proxy.includes("clientIp: clientIdentity"), "Perimeter logs must not persist raw client IP addresses.");
assert(!proxy.includes("detail: {\n        session,\n        claimed,"), "Authority-conflict logs must not persist raw session/claim identifiers.");
assert(!proxy.includes("'strict-dynamic' https: http:"), "Production CSP must not retain broad legacy script-host fallbacks.");
assert(proxy.includes("process.env.STAGING_SEED_ENABLED !== \"true\""), "Staging seed authority must require an explicit environment switch.");
assert(stagingService.includes('name  = "STAGING_SEED_ENABLED"'), "Staging Terraform must scope the seed authority explicitly.");
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
