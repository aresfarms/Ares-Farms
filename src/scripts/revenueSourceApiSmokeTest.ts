/**
 * Revenue Source Intelligence API Smoke Test
 *
 * Requires a local Next dev server, usually:
 * npm run dev
 */

export {};

type SmokeRoute = {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  expectOk: boolean;
};

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const routes: SmokeRoute[] = [
  { method: "GET", path: "/api/revenue-intelligence/opportunities", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/catalog", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/programs", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/marketplace", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/operating-costs", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/market-signals", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/geospatial", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/state-registry", expectOk: true },
  {
    method: "GET",
    path: "/api/revenue-intelligence/customer-eligibility",
    expectOk: true,
  },
  { method: "GET", path: "/api/revenue-intelligence/fusion", expectOk: true },
  { method: "GET", path: "/api/revenue-intelligence/claims", expectOk: true },
  { method: "GET", path: "/api/customer-revenue/advisory", expectOk: true },
  {
    method: "POST",
    path: "/api/revenue-intelligence/opportunities",
    body: {
      liveSourceRefreshRequested: true,
      productionUseRequested: true,
      legalAdviceRequested: true,
      guaranteedClaimRequested: true,
    },
    expectOk: false,
  },
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function callRoute(route: SmokeRoute) {
  const response = await fetch(`${baseUrl}${route.path}`, {
    method: route.method,
    headers:
      route.method === "POST"
        ? {
            "content-type": "application/json",
          }
        : undefined,
    body: route.method === "POST" ? JSON.stringify(route.body ?? {}) : undefined,
  });
  const json = (await response.json()) as Record<string, unknown>;

  assert(response.status === 200, `${route.path} returned ${response.status}.`);
  assert(json.ok === route.expectOk, `${route.path} returned unexpected ok state.`);
  assert(Boolean(json.data), `${route.path} did not return classified data.`);
  assert(Boolean(json.governance), `${route.path} did not return governance.`);

  const governance = json.governance as Record<string, unknown>;

  assert(Boolean(governance.traceId), `${route.path} missing traceId.`);
  assert(
    JSON.stringify(governance).includes("runtimeGuard"),
    `${route.path} missing runtime guard.`
  );
  assert(
    JSON.stringify(governance).includes("versionRuntime"),
    `${route.path} missing version runtime.`
  );

  return {
    path: route.path,
    ok: json.ok,
  };
}

async function main() {
  // Confirm the target is THIS app (200 + brand marker) before smoke assertions:
  // a foreign/stale server yields confusing API-404 failures and no server yields
  // opaque connection errors. Fail CLEARLY instead — a smoke gate must never pass
  // vacuously, so this is a loud exit 1, not a skip.
  const smokeHome = await fetch(`${baseUrl}/`).then(async (r) => ({ status: r.status, body: await r.text().catch(() => "") })).catch(() => null);
  if (!smokeHome || smokeHome.status !== 200 || !/Furlong/.test(smokeHome.body)) {
    console.error(`✗ ${baseUrl} is not a confirmed Furlong server (status ${smokeHome?.status ?? "unreachable"}) — refusing to smoke-test a foreign/stale/absent server.`);
    process.exit(1);
  }
  const results = [];

  for (const route of routes) {
    results.push(await callRoute(route));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        baseUrl,
        routes: results.length,
        expectedControlledBlocks: results.filter((result) => result.ok === false)
          .length,
        message: "Revenue source intelligence API smoke test passed.",
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
