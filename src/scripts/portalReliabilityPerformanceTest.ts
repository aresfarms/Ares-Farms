/**
 * Bounded portal load and sustained-reliability test.
 *
 * Master Volume alignment:
 * - Vol III-B: emits reproducible latency, error, and availability evidence.
 * - Vol IV: provides an operator-safe, read-only readiness check.
 * - Vol V: never exercises approval, publication, payment, or other live-action
 *   authority; only GET requests to public/readiness surfaces are permitted.
 */

type Result = {
  route: string;
  status: number | null;
  elapsedMs: number;
  ok: boolean;
  error?: string;
};

export {};

const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const durationSeconds = Number(process.env.PORTAL_TEST_SECONDS ?? "60");
const concurrency = Number(process.env.PORTAL_TEST_CONCURRENCY ?? "8");
const timeoutMs = Number(process.env.PORTAL_TEST_TIMEOUT_MS ?? "10000");
const allowNotReady = process.env.PORTAL_ALLOW_NOT_READY === "true";
const routes = (process.env.PORTAL_TEST_ROUTES ?? "/,/navigator,/explore,/trust,/health/live,/health/ready")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

if (!Number.isFinite(durationSeconds) || durationSeconds < 10 || durationSeconds > 3600) {
  throw new Error("PORTAL_TEST_SECONDS must be between 10 and 3600.");
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) {
  throw new Error("PORTAL_TEST_CONCURRENCY must be an integer between 1 and 100.");
}
if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) {
  throw new Error("PORTAL_TEST_TIMEOUT_MS must be between 100 and 60000.");
}

const results: Result[] = [];
const deadline = Date.now() + durationSeconds * 1000;
let cursor = 0;

async function exercise(): Promise<void> {
  while (Date.now() < deadline) {
    const route = routes[cursor % routes.length];
    cursor += 1;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": "FurlongPortalReliabilityGate/1.0" },
      });
      await response.arrayBuffer();
      const expectedReadyFailure = allowNotReady && route === "/health/ready" && response.status === 503;
      results.push({
        route,
        status: response.status,
        elapsedMs: performance.now() - started,
        ok: response.status < 500 || expectedReadyFailure,
      });
    } catch (error) {
      results.push({
        route,
        status: null,
        elapsedMs: performance.now() - started,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

async function main(): Promise<void> {
  await Promise.all(Array.from({ length: concurrency }, () => exercise()));

  const failures = results.filter((result) => !result.ok);
  const readinessFailures = results.filter(
    (result) => result.route === "/health/ready" && result.status === 503
  );
  const latencies = results.map((result) => result.elapsedMs);
  const summary = {
  schemaVersion: "furlong-portal-reliability-v1",
  testedAt: new Date().toISOString(),
  baseUrl,
  durationSeconds,
  concurrency,
  allowNotReady,
  routes,
  requests: results.length,
  successRate: results.length === 0 ? 0 : (results.length - failures.length) / results.length,
  failures: failures.length,
  readinessReady: readinessFailures.length === 0,
  readinessFailures: readinessFailures.length,
  latencyMs: {
    p50: Math.round(percentile(latencies, 0.5)),
    p95: Math.round(percentile(latencies, 0.95)),
    p99: Math.round(percentile(latencies, 0.99)),
    max: Math.round(Math.max(0, ...latencies)),
  },
  statuses: Object.fromEntries(
    [...new Set(results.map((result) => String(result.status ?? "network-error")))].map((status) => [
      status,
      results.filter((result) => String(result.status ?? "network-error") === status).length,
    ])
  ),
  sampleFailures: failures.slice(0, 10),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0 || results.length === 0) {
    process.exitCode = 1;
  }
}

void main();
