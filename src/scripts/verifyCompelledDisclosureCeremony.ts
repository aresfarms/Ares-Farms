import assert from "node:assert/strict";
import { authorizeCompelledDisclosure, selectorPermitted } from "@/lib/governance/compelledDisclosureCeremony";

const base = {
  processType: "COURT_ORDER" as const,
  authorityVerificationId: "authority-1",
  authorityVerified: true,
  issuer: "Example Court",
  jurisdiction: "Example State",
  matterId: "matter-1",
  subjectIds: ["borrower-1"],
  moduleIds: ["documents"],
  recordSelectors: ["tax-year-2023"],
  holdStartedAt: "2026-01-01T00:00:00.000Z",
  disclosureStartsAt: "2026-01-02T00:00:00.000Z",
  disclosureEndsAt: "2026-01-03T00:00:00.000Z",
  noticePosture: "NOTICE_REQUIRED" as const,
  legalApproverId: "legal-1",
  securityApproverId: "security-1",
};
assert.throws(() => authorizeCompelledDisclosure({ ...base, securityApproverId: "legal-1" }), /independent/i);
assert.throws(() => authorizeCompelledDisclosure({ ...base, holdStartedAt: "2026-01-02T01:00:00.000Z" }), /hold/i);
assert.throws(() => authorizeCompelledDisclosure({ ...base, noticePosture: "NOTICE_PROHIBITED", noticeReviewAt: null }), /review/i);
const ceremony = authorizeCompelledDisclosure(base);
assert.equal(selectorPermitted(ceremony, "tax-year-2023", "2026-01-02T12:00:00.000Z"), true);
assert.equal(selectorPermitted(ceremony, "tax-year-2024", "2026-01-02T12:00:00.000Z"), false);
assert.equal(selectorPermitted(ceremony, "tax-year-2023", "2026-01-04T00:00:00.000Z"), false);
console.log(JSON.stringify({ ok: true, rule: "COMPELLED-DISCLOSURE-DUAL-CONTROL-001", dualControl: true, legalHoldBeforeDisclosure: true, selectorBoundRelease: true, noticeRestrictionReview: true }, null, 2));
