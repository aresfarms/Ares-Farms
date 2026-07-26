import assert from "node:assert/strict";

import {
  FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE_RULE,
  classifyFederalAuthorityChange,
} from "@/lib/governance/federalLoanAuthorityChangeTriage";

const base = "Farm Operating Loans provide credit to eligible family farmers. The maximum loan amount is $400,000. Applicants must provide FSA Form 2001. Interest rates are published monthly.";
const cosmetic = `Home | About FSA | Contact Us. ${base} Updated site navigation.`;
const cosmeticPrevious = `Home | Programs | News. ${base} Previous site navigation.`;
const cosmeticResult = classifyFederalAuthorityChange({ previousText: cosmeticPrevious, nextText: cosmetic });
assert.equal(cosmeticResult.materiality, "COSMETIC");
assert.equal(cosmeticResult.disposition, "AUTO_CLEARED");

const informational = classifyFederalAuthorityChange({
  previousText: "Welcome to the agency. Office locations are listed below.",
  nextText: "Welcome to the agency. A new regional office opened this summer.",
});
assert.equal(informational.materiality, "INFORMATIONAL");
assert.equal(informational.disposition, "AUTO_CLEARED");

const lending = classifyFederalAuthorityChange({
  previousText: "The maximum loan amount is $400,000. Interest rates are published monthly.",
  nextText: "The maximum loan amount is $500,000. Interest rates are published monthly.",
});
assert.equal(lending.materiality, "LENDING_RELEVANT");
assert.equal(lending.disposition, "REVIEW_REQUIRED");

const material = classifyFederalAuthorityChange({
  previousText: "Eligible applicants must operate a family farm.",
  nextText: "Eligible applicants must operate a family farm and provide additional collateral.",
});
assert.equal(material.materiality, "LEGALLY_MATERIAL");
assert.equal(material.disposition, "REVIEW_REQUIRED");

const noHistory = classifyFederalAuthorityChange({
  previousText: null,
  nextText: "Eligible applicants must provide collateral and a personal guaranty.",
});
assert.equal(noHistory.disposition, "REVIEW_REQUIRED");
assert.ok(noHistory.reasonCodes.includes("PRIOR_SEMANTIC_BASELINE_MISSING"));

console.log(JSON.stringify({
  ok: true,
  rule: FEDERAL_LOAN_AUTHORITY_CHANGE_TRIAGE_RULE,
  cosmeticChangesAutoCleared: true,
  informationalChangesIsolated: true,
  lendingChangesHeld: true,
  legallyMaterialChangesElevated: true,
  missingHistoryFailsClosed: true,
}, null, 2));
