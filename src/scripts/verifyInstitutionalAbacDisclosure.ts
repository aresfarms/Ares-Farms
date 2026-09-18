import assert from "node:assert/strict";
import { evaluateInstitutionalAbac } from "@/lib/governance/institutionalAbacDisclosure";

const request = {
  principalId: "attorney-1",
  principalEmail: "attorney@example.test",
  role: "attorney" as const,
  credentialVerificationId: "cred-1",
  authorityVerificationId: "auth-1",
  matterId: "matter-1",
  tenantId: "tenant-1",
  subjectIds: ["borrower-1"],
  moduleIds: ["documents"],
  purpose: "litigation-review",
  action: "VIEW" as const,
  windowStart: "2026-01-01T00:00:00.000Z",
  windowEnd: "2026-01-02T00:00:00.000Z",
  now: "2026-01-01T12:00:00.000Z",
  stepUpAuthenticated: false,
};
const fields = [
  { name: "taxReturn", value: "allowed", classification: "RESTRICTED" as const, subjectId: "borrower-1", moduleId: "documents", purposes: ["litigation-review"] },
  { name: "unrelatedAsset", value: "blocked", classification: "CONFIDENTIAL" as const, subjectId: "borrower-2", moduleId: "documents", purposes: ["litigation-review"] },
];
const allowed = evaluateInstitutionalAbac({ request, fields, credentialValid: true, authorityValid: true });
assert.equal(allowed.allowed, true);
assert.deepEqual(allowed.disclosed.map((f) => f.name), ["taxReturn"]);
assert.deepEqual(allowed.withheld.map((f) => f.name), ["unrelatedAsset"]);
assert.ok(allowed.capabilityToken?.startsWith("cap_"));
assert.ok(Date.parse(allowed.expiresAt!) <= Date.parse(request.now) + 5 * 60_000);
const noAuthority = evaluateInstitutionalAbac({ request, fields, credentialValid: true, authorityValid: false });
assert.equal(noAuthority.allowed, false);
assert.equal(noAuthority.disclosed.length, 0);
const exportWithoutStepUp = evaluateInstitutionalAbac({ request: { ...request, action: "EXPORT" }, fields, credentialValid: true, authorityValid: true });
assert.equal(exportWithoutStepUp.allowed, false);
assert.ok(exportWithoutStepUp.reasonCodes.includes("STEP_UP_AUTH_REQUIRED"));
console.log(JSON.stringify({ ok: true, rule: "INSTITUTIONAL-ABAC-FIELD-DISCLOSURE-001", perRequestAbac: true, fieldFilteringBeforePayload: true, shortLivedCapability: true, exportStepUpRequired: true }, null, 2));
