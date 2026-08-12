/**
 * Source Stack API Smoke Test
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
  { method: "GET", path: "/api/source-stack", expectOk: true },
  { method: "GET", path: "/api/source-stack/canonicalization", expectOk: true },
  { method: "GET", path: "/api/source-stack/failover", expectOk: true },
  { method: "GET", path: "/api/source-stack/conflicts", expectOk: true },
  { method: "GET", path: "/api/source-stack/freshness", expectOk: true },
  { method: "GET", path: "/api/source-stack/observability", expectOk: true },
  { method: "GET", path: "/api/programs/search", expectOk: true },
  { method: "GET", path: "/api/revenue/opportunities", expectOk: true },
  { method: "GET", path: "/api/market-signals", expectOk: true },
  { method: "GET", path: "/api/geo/suitability", expectOk: true },
  { method: "GET", path: "/api/public/grants", expectOk: true },
  { method: "GET", path: "/api/public/property-discovery", expectOk: true },
  { method: "GET", path: "/api/public/equipment", expectOk: true },
  { method: "GET", path: "/api/public/market-context", expectOk: true },
  { method: "GET", path: "/api/public/weather-risk", expectOk: true },
  {
    method: "POST",
    path: "/api/source-stack/failover",
    body: {
      liveFetchRequested: true,
      productionUseRequested: true,
      officialUseRequested: true,
      underwritingUseRequested: true,
      lenderCommitmentRequested: true,
      legalAdviceRequested: true,
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
        message: "Source stack API smoke test passed.",
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
