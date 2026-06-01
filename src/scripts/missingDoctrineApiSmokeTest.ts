/**
 * Missing Doctrine API Smoke Test
 *
 * Requires the local Next dev server to be running. Verifies that the
 * supplemental doctrine APIs respond through the governed route envelope.
 */

export {};

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

type SmokeCase = {
  name: string;
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  expectTopLevelOk?: boolean;
};

const cases: SmokeCase[] = [
  { name: "runtime-state", method: "GET", path: "/api/runtime/state" },
  {
    name: "runtime-transition",
    method: "POST",
    path: "/api/runtime/transition",
    body: {
      fromState: "DEVELOPMENT",
      toState: "SANDBOX",
    },
  },
  { name: "runtime-restrictions", method: "GET", path: "/api/runtime/restrictions" },
  {
    name: "runtime-emergency-mode",
    method: "POST",
    path: "/api/runtime/emergency-mode",
    body: {
      fromState: "DEGRADED_OPERATION",
      authorityRef: "authority://smoke-test",
    },
  },
  { name: "features", method: "GET", path: "/api/features" },
  {
    name: "feature-activate-blocked",
    method: "POST",
    path: "/api/features/activate",
    expectTopLevelOk: false,
    body: {
      featureId: "public-surface-gateway",
      productionRequested: true,
    },
  },
  {
    name: "feature-deactivate",
    method: "POST",
    path: "/api/features/deactivate",
    body: {
      featureId: "public-surface-gateway",
    },
  },
  {
    name: "feature-rollback",
    method: "POST",
    path: "/api/features/rollback",
    body: {
      featureId: "public-surface-gateway",
    },
  },
  {
    name: "claims-validate",
    method: "POST",
    path: "/api/claims/validate",
    body: {
      text: "Furlong facilitates governed coordination and advisory guidance only.",
    },
  },
  { name: "claims-public", method: "GET", path: "/api/claims/public" },
  { name: "claims-escalate", method: "POST", path: "/api/claims/escalate" },
  {
    name: "incidents-create",
    method: "POST",
    path: "/api/incidents/create",
    body: {
      incidentClass: "operational",
    },
  },
  {
    name: "incidents-escalate",
    method: "POST",
    path: "/api/incidents/escalate",
    body: {
      incidentClass: "constitutional",
      severity: "CRITICAL",
    },
  },
  { name: "incidents-status", method: "GET", path: "/api/incidents/status" },
  { name: "incidents-resolve", method: "POST", path: "/api/incidents/resolve" },
  { name: "config", method: "GET", path: "/api/config" },
  {
    name: "config-change",
    method: "POST",
    path: "/api/config/change",
    body: {
      configType: "deployment modes",
      changesConstitutionalBehavior: true,
      rollbackRef: "rollback://smoke",
      promotionRef: "promotion://smoke",
    },
  },
  { name: "config-rollback", method: "POST", path: "/api/config/rollback" },
  { name: "ux-governance", method: "GET", path: "/api/ux/governance" },
  {
    name: "ux-validate",
    method: "POST",
    path: "/api/ux/validate",
    body: {
      text: "Your document was received. Human review is pending. More information may be needed.",
      disclosureVisible: true,
      workflowVisible: true,
      escalationVisible: true,
      humanReviewVisible: true,
      accessibilityEvidence: true,
    },
  },
  { name: "ux-escalate", method: "POST", path: "/api/ux/escalate" },
  { name: "implementation-manifest", method: "GET", path: "/api/implementation/manifest" },
  { name: "implementation-coverage", method: "GET", path: "/api/implementation/coverage" },
  { name: "implementation-validate", method: "POST", path: "/api/implementation/validate" },
  {
    name: "implementation-certify-blocked",
    method: "POST",
    path: "/api/implementation/certify",
    expectTopLevelOk: false,
  },
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function runCase(input: SmokeCase) {
  const response = await fetch(`${baseUrl}${input.path}`, {
    method: input.method,
    headers:
      input.method === "POST"
        ? {
            "content-type": "application/json",
          }
        : undefined,
    body:
      input.method === "POST"
        ? JSON.stringify(input.body ?? {})
        : undefined,
  });
  const body = (await response.json()) as {
    ok?: boolean;
    data?: Record<string, unknown>;
    governance?: {
      traceId?: string;
      runtimeGuard?: {
        allowed?: boolean;
      };
      versionRuntime?: {
        ok?: boolean;
      };
    };
  };
  const expectedTopLevelOk = input.expectTopLevelOk ?? true;

  assert(response.status === 200, `${input.name} returned ${response.status}.`);
  assert(
    body.ok === expectedTopLevelOk,
    `${input.name} top-level ok posture was unexpected.`
  );
  assert(Boolean(body.data), `${input.name} response data missing.`);
  assert(
    body.governance?.runtimeGuard?.allowed === true,
    `${input.name} runtime guard was not allowed.`
  );
  assert(
    body.governance?.versionRuntime?.ok === true,
    `${input.name} version runtime did not pass.`
  );

  return {
    name: input.name,
    status: response.status,
    ok: body.ok,
    traceId: body.governance?.traceId,
  };
}

async function main() {
  const results = [];

  for (const testCase of cases) {
    results.push(await runCase(testCase));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        baseUrl,
        routeCount: results.length,
        results,
        message: "Missing doctrine API smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
