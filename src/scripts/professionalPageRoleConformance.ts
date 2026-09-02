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
      buildingProfessionalLanesFailClosed: true,
      internalConsolesProfessionalDenied: true,
      syntheticFixtureChromeIsolated: true,
    },
    null,
    2,
  ),
);
