/**
 * Scraper, Source Ingestion, and Property Discovery API Smoke Test
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
  { method: "GET", path: "/api/scrapers", expectOk: true },
  {
    method: "GET",
    path: "/api/scrapers/status?scraperId=county-gis-scraper",
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/scrapers/run",
    body: { scraperId: "crexi-scraper", sourceUrl: "https://example.invalid/listing" },
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/scrapers/run",
    body: { scraperId: "crexi-scraper", liveFetchRequested: true },
    expectOk: false,
  },
  {
    method: "POST",
    path: "/api/scrapers/replay",
    body: { scraperId: "county-gis-scraper" },
    expectOk: true,
  },
  {
    method: "GET",
    path: "/api/scrapers/provenance?scraperId=county-gis-scraper",
    expectOk: true,
  },
  {
    method: "GET",
    path: "/api/scrapers/classification?scraperId=county-gis-scraper",
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/scrapers/escalate",
    body: { scraperId: "crexi-scraper", reason: "smoke-test-review" },
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/source-ingestion/submit",
    body: { scraperId: "crexi-scraper", sourceUrl: "https://example.invalid/listing" },
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/source-ingestion/review",
    body: { ingestionRecordId: "source-ingestion-smoke" },
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/source-ingestion/classify",
    body: { scraperId: "county-gis-scraper", ingestionRecordId: "source-ingestion-smoke" },
    expectOk: true,
  },
  {
    method: "POST",
    path: "/api/source-ingestion/reject",
    body: { ingestionRecordId: "source-ingestion-smoke" },
    expectOk: true,
  },
  { method: "GET", path: "/api/properties/discovery", expectOk: true },
  { method: "GET", path: "/api/properties/canonical", expectOk: true },
  { method: "GET", path: "/api/properties/replay", expectOk: true },
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
        message: "Scraper/source intelligence API smoke test passed.",
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
