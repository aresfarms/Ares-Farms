import assert from "node:assert/strict";

import { evaluateProtectedPageRole } from "@/lib/auth/pageRolePolicy";
import { isInternalChromeRoute } from "@/lib/auth/protectedRoutes";

assert.equal(evaluateProtectedPageRole("/lender-desk", "broker").allowed, true);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "lender").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "sponsor").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "attorney").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "auditor").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "operator").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/lender-desk", "governance").allowed,
  true,
);

assert.equal(
  evaluateProtectedPageRole("/capital-network/onboarding", "user").allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/capital-network/onboarding", "lender").allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/capital-network/provider", "broker").allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/capital-network/provider", "lender").allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/capital-network/provider", "user").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/capital-network", "lender").allowed,
  false,
);
assert.equal(isInternalChromeRoute("/capital-network/provider"), false);
assert.equal(isInternalChromeRoute("/capital-network/onboarding"), false);

assert.equal(evaluateProtectedPageRole("/governance", "lender").allowed, false);
assert.equal(
  evaluateProtectedPageRole("/governance", "attorney").allowed,
  false,
);
assert.equal(
  evaluateProtectedPageRole("/audit-replay", "auditor").allowed,
  false,
);
assert.equal(evaluateProtectedPageRole("/sponsor", "sponsor").allowed, false);
assert.equal(
  evaluateProtectedPageRole("/governance", "operator").allowed,
  true,
);

assert.equal(evaluateProtectedPageRole("/portal", "user").allowed, true);
assert.equal(evaluateProtectedPageRole("/portal", "lender").allowed, false);

assert.equal(isInternalChromeRoute("/internal/synthetic-fixtures"), false);
assert.equal(
  isInternalChromeRoute("/internal/synthetic-fixtures/stripe"),
  false,
);
assert.equal(
  evaluateProtectedPageRole("/internal/synthetic-fixtures", "operator").allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/internal/synthetic-fixtures", "governance")
    .allowed,
  true,
);
assert.equal(
  evaluateProtectedPageRole("/internal/synthetic-fixtures", "lender").allowed,
  false,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      brokerSurfaceOnly: "/lender-desk",
      lenderSurfaceSeparated: true,
      capitalNetworkProviderWorkspace: "broker-or-lender",
      capitalNetworkOnboarding: "authenticated-applicant",
      buildingProfessionalLanesFailClosed: true,
      internalConsolesProfessionalDenied: true,
      syntheticFixtureChromeIsolated: true,
    },
    null,
    2,
  ),
);
