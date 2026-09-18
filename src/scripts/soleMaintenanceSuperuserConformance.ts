import assert from "node:assert/strict";

import { isSoleMaintenanceSuperuser, maintenanceSuperuserAuditContext } from "@/lib/auth/maintenanceSuperuser";
import { evaluateProtectedPageRole } from "@/lib/auth/pageRolePolicy";

assert.equal(isSoleMaintenanceSuperuser("chudson@aresfarmsinc.com"), true);
assert.equal(isSoleMaintenanceSuperuser("CHUDSON@ARESFARMSINC.COM"), true);
assert.equal(isSoleMaintenanceSuperuser("sfraas@aresfarmsinc.com"), false);
assert.equal(isSoleMaintenanceSuperuser("frances@aresfarmsinc.com"), false);
assert.equal(isSoleMaintenanceSuperuser("someone@example.com"), false);

// Caitlin is stamped to governance by the proxy before page/API policy checks.
assert.equal(evaluateProtectedPageRole("/governance", "governance").allowed, true);
assert.equal(evaluateProtectedPageRole("/lender-desk", "governance").allowed, true);
assert.equal(evaluateProtectedPageRole("/portal", "governance").allowed, true);

// Generic admin is not a cross-lane superuser.
assert.equal(evaluateProtectedPageRole("/lender-desk", "admin").allowed, false);
assert.equal(evaluateProtectedPageRole("/portal", "admin").allowed, false);

// Ordinary operators/professionals remain scoped.
assert.equal(evaluateProtectedPageRole("/governance", "operator").allowed, true);
assert.equal(evaluateProtectedPageRole("/lender-desk", "operator").allowed, false);
assert.equal(evaluateProtectedPageRole("/governance", "lender").allowed, false);

const audit = maintenanceSuperuserAuditContext("chudson@aresfarmsinc.com");
assert.equal(audit.active, true);
assert.equal(audit.policy, "SOLE-MAINTENANCE-SUPERUSER-001");

console.log(JSON.stringify({
  ok: true,
  soleSuperuser: "chudson@aresfarmsinc.com",
  otherFoundersInherit: false,
  genericAdminCrossLane: false,
  auditedOverride: true,
}, null, 2));
