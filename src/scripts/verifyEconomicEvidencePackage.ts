import { strict as assert } from "node:assert";

import {
  ECONOMIC_EVIDENCE_PACKAGE_VERSION,
  assessEnterpriseEconomicEvidencePackage,
  buildComparableCandidateFromEconomicEvidence,
  isEnterpriseEconomicEvidencePackage,
} from "@/lib/intelligence/economicEvidencePackage";
import { compilePropertyComparisonEconomicAnalysis } from "@/lib/intelligence/propertyComparisonEconomicAnalysis";

import { basePackage, metric } from "./fixtures/economicEvidence";

const complete = assessEnterpriseEconomicEvidencePackage(basePackage);
assert.equal(complete.status, "complete");
assert.equal(complete.evidenceStatus, "source-supported");
assert.equal(complete.totalProjectCost, 900_000);
assert.equal(complete.missingEvidence.length, 0);
assert.ok((complete.annualDebtService ?? 0) > 0);
assert.ok((complete.dscr ?? 0) > 1.25);
assert.equal(complete.projection.status, "complete");

// A short term must not erase outstanding principal from long-range returns.
const balloonPackage = structuredClone(basePackage);
balloonPackage.financing.annualRatePct.value = 0;
balloonPackage.financing.amortizationYears.value = 30;
balloonPackage.financing.termYears.value = 5;
const balloon = assessEnterpriseEconomicEvidencePackage(balloonPackage);
assert.equal(balloon.status, "complete");
assert.equal(balloon.projection.status, "complete");
if (balloon.projection.status === "complete") {
  const principal = balloonPackage.financing.loanAmount.value!;
  assert.equal(balloon.projection.years[4].debtService, Math.round(principal / 30 + principal * 25 / 30));
  assert.equal(balloon.projection.years[5].debtService, 0);
  assert(balloon.projection.assumptions.some(line => line.includes("outstanding-principal payoff")));
}

const candidate = buildComparableCandidateFromEconomicEvidence(basePackage);
assert.equal(candidate.evidenceStatus, "source-supported");
assert.equal(candidate.totalProjectCost, 900_000);
assert.equal(candidate.missingEvidence.length, 0);

const mixedPackage = structuredClone(basePackage);
mixedPackage.packageId = "economic-package:test-property:mixed";
mixedPackage.candidate = {
  id: "test-property:mixed",
  candidateRole: "best-mixed-use",
  title: "Laundromat with upper-floor apartments",
  enterpriseComponents: ["Laundromat", "Upper-floor apartments"],
};
const alternativePackage = structuredClone(basePackage);
alternativePackage.packageId = "economic-package:test-property:alternative";
alternativePackage.candidate = {
  id: "test-property:alternative",
  candidateRole: "best-distinct-alternative",
  title: "Professional office",
  enterpriseComponents: ["Professional office"],
};
const compilation = compilePropertyComparisonEconomicAnalysis({
  comparisonItemId: "comparison-item:test-property",
  propertyId: basePackage.propertyId,
  address: basePackage.address,
  packages: [basePackage, mixedPackage, alternativePackage],
});
assert.equal(compilation.ok, true);
assert.equal(isEnterpriseEconomicEvidencePackage(basePackage), true);
assert.equal(isEnterpriseEconomicEvidencePackage({ version: ECONOMIC_EVIDENCE_PACKAGE_VERSION }), false);
if (compilation.ok) {
  assert.equal(compilation.analysis.candidates.length, 3);
  assert.ok(compilation.evidenceRefs.includes("replay:fixture-source"));
}
const wrongAddress = structuredClone(alternativePackage);
wrongAddress.address = "999 Different Street, Testville, MD 21601";
const mismatchedCompilation = compilePropertyComparisonEconomicAnalysis({
  comparisonItemId: "comparison-item:test-property",
  propertyId: basePackage.propertyId,
  address: basePackage.address,
  packages: [basePackage, mixedPackage, wrongAddress],
});
assert.equal(mismatchedCompilation.ok, false);

const operatingRecord = structuredClone(basePackage);
operatingRecord.sources[0].kind = "operator-record";
operatingRecord.professionalReview.status = "verified";
const verified = assessEnterpriseEconomicEvidencePackage(operatingRecord);
assert.equal(verified.status, "complete");
assert.equal(verified.evidenceStatus, "verified-operating-evidence");

const assumption = structuredClone(basePackage);
assumption.operations.baseAnnualRevenue =
  metric(600_000, "usd-per-year", "customer-assumption");
const scenarioOnly = assessEnterpriseEconomicEvidencePackage(assumption);
assert.equal(scenarioOnly.status, "scenario-only");
assert.equal(scenarioOnly.evidenceStatus, "scenario-only");
assert.ok(scenarioOnly.warnings.some((warning) =>
  warning.includes("cannot support paid ranking"),
));

const stale = structuredClone(basePackage);
stale.sources[0].asOf = "2025-01-01T00:00:00.000Z";
const staleAssessment = assessEnterpriseEconomicEvidencePackage(stale);
assert.equal(staleAssessment.status, "needs-evidence");
assert.ok(staleAssessment.missingEvidence.some((item) =>
  item.includes("is stale"),
));

const incomplete = structuredClone(basePackage);
incomplete.findings = incomplete.findings.filter(
  (finding) => finding.domain !== "competition",
);
const incompleteAssessment =
  assessEnterpriseEconomicEvidencePackage(incomplete);
assert.equal(incompleteAssessment.status, "needs-evidence");
assert.ok(incompleteAssessment.missingEvidence.some((item) =>
  item.includes("competition"),
));

const unbalanced = structuredClone(basePackage);
unbalanced.financing.cashContribution.value = 10_000;
const unbalancedAssessment =
  assessEnterpriseEconomicEvidencePackage(unbalanced);
assert.equal(unbalancedAssessment.status, "needs-evidence");
assert.ok(unbalancedAssessment.missingEvidence.some((item) =>
  item.includes("do not balance"),
));

const mixed = structuredClone(basePackage);
mixed.candidate.candidateRole = "best-mixed-use";
const mixedAssessment = assessEnterpriseEconomicEvidencePackage(mixed);
assert.equal(mixedAssessment.status, "needs-evidence");
assert.ok(mixedAssessment.missingEvidence.some((item) =>
  item.includes("at least two enterprise components"),
));

const blocked = structuredClone(basePackage);
blocked.constraints.zoning.status = "blocked";
blocked.constraints.zoning.summary = "The proposed use is prohibited.";
const blockedAssessment = assessEnterpriseEconomicEvidencePackage(blocked);
assert.equal(blockedAssessment.status, "complete");
assert.equal(
  buildComparableCandidateFromEconomicEvidence(blocked).constraints.zoning,
  "blocked",
);

console.log("Economic evidence package governance verified.");
