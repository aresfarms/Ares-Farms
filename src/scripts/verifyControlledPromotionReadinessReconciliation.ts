import assert from "node:assert/strict";
import { reconcileControlledPromotionReadiness } from "../lib/governance/controlledPromotionReadinessReconciliation";

const current = reconcileControlledPromotionReadiness({
  masterVolumeConformancePassed: true,
  buildSelfReportPassed: true,
  buildSelfReportFailedModules: 0,
  buildSelfReportConflicts: 0,
  humanAuthorityPassed: true,
  publicAlphaStatus: "PENDING_SIGNOFF",
  publicAlphaPendingDecisions: 5,
  controlledPromotionRequirements: 3,
  developmentSecurityBlocks: ["external-secret-rotation-evidence"],
  productionSecurityBlocks: [
    "external-secret-rotation-evidence",
    "nextauth-secret",
    "nextauth-url",
    "production-api-auth-enforcement",
    "production-rate-limiting",
  ],
  externalEvidenceBlocks: ["third-party-penetration-test"],
  commit: "synthetic-current",
  checkedAt: "2026-07-26T12:00:00.000Z",
});
assert.equal(current.engineeringStatus, "PASS");
assert.equal(current.publicAlphaStatus, "PENDING_SIGNOFF");
assert.equal(current.productionStatus, "BLOCKED");
assert.equal(current.productionAuthorized, false);
assert.match(current.evidenceSnapshotHash, /^[a-f0-9]{64}$/);

const clean = reconcileControlledPromotionReadiness({
  masterVolumeConformancePassed: true,
  buildSelfReportPassed: true,
  buildSelfReportFailedModules: 0,
  buildSelfReportConflicts: 0,
  humanAuthorityPassed: true,
  publicAlphaStatus: "PASS",
  publicAlphaPendingDecisions: 0,
  controlledPromotionRequirements: 0,
  developmentSecurityBlocks: [],
  productionSecurityBlocks: [],
  externalEvidenceBlocks: [],
  commit: "synthetic-clean",
  checkedAt: "2026-07-26T12:00:00.000Z",
});
assert.equal(clean.engineeringStatus, "PASS");
assert.equal(clean.publicAlphaStatus, "PASS");
assert.equal(clean.productionStatus, "PASS");
assert.equal(clean.productionAuthorized, false);

console.log(JSON.stringify({
  ok: true,
  rule: "CONTROLLED-PROMOTION-READINESS-RECONCILIATION-001",
  predecessor: "4C_EXTERNAL_NOTIFICATION_INSTITUTIONAL_CLOSURE",
  engineeringStatus: current.engineeringStatus,
  publicAlphaStatus: current.publicAlphaStatus,
  productionStatus: current.productionStatus,
  productionAuthorizationRemainsHuman: true,
}, null, 2));
