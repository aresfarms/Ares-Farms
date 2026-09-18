import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FarmLaneWorkspace } from "@/components/property/lanes/FarmLaneWorkspace";
import type { LaneWorkspaceProps } from "@/components/property/lanes/GovernedLaneChassis";

import {
  buildScenarioFinancingMatrix,
  evaluateProgramFit,
  type ProgramFitContext,
} from "@/lib/property/financingProgramFit";

const base: ProgramFitContext = {
  laneId: "farm",
  asOf: "2026-09-07",
  screeningPrice: 400_000,
  noiAnnual: 80_000,
  noiBasis: "verified whole-parcel operating scenario",
  rates: {
    mortgage30Pct: 6.5,
    fsaOwnershipDirectPct: 4,
  },
  usdaRural: {
    businessEligible: true,
    housingEligible: true,
  },
};

const usdaBi = evaluateProgramFit("USDA Business & Industry financing", base);
const sba504 = evaluateProgramFit("SBA 504 financing", base);
const sba7a = evaluateProgramFit("SBA 7(a) financing", base);
const fsaDirect = evaluateProgramFit(
  "FSA direct farm ownership financing",
  base,
);
const fsaGuaranteed = evaluateProgramFit(
  "FSA guaranteed farm ownership financing",
  base,
);
const housing = evaluateProgramFit(
  "USDA Rural Development housing financing",
  base,
);

for (const [name, fit] of Object.entries({
  usdaBi,
  sba504,
  sba7a,
  fsaDirect,
  fsaGuaranteed,
})) {
  assert(fit, `${name} must receive a farm-lane property-fit evaluation`);
  assert.equal(
    fit.excluded,
    undefined,
    `${name} should remain eligible in the supported scenario`,
  );
}

assert(
  (fsaDirect?.score ?? -1) > (usdaBi?.score ?? -1),
  "FSA must be allowed to rank first when its property-side structure produces the strongest fit",
);
assert.equal(housing?.score, -1);
assert.match(
  housing?.excluded ?? "",
  /owner-occupied residence.*Rural geography alone is not enough/i,
);

const aboveDirectLimit = evaluateProgramFit(
  "FSA direct farm ownership financing",
  {
    ...base,
    screeningPrice: 1_000_000,
  },
);
assert.equal(aboveDirectLimit?.excluded, undefined, "Purchase price is not a loan-limit exclusion");
assert.match(aboveDirectLimit?.line ?? "", /Loan structure pending/);
const aboveLoanLimit = evaluateProgramFit("FSA direct farm ownership financing", { ...base, screeningPrice: 1_000_000, proposedLoanAmount: 700_000 });
assert.match(aboveLoanLimit?.excluded ?? "", /Proposed FSA loan/);
const belowLoanLimit = evaluateProgramFit("FSA direct farm ownership financing", { ...base, screeningPrice: 1_000_000, proposedLoanAmount: 500_000 });
assert.equal(belowLoanLimit?.excluded, undefined);
assert.match(belowLoanLimit?.line ?? "", /500,000 proposed loan/);
const expired = evaluateProgramFit("FSA guaranteed farm ownership financing", { ...base, asOf: "2026-10-01" });
assert.match(expired?.line ?? "", /requires refresh/);

assert.equal(fsaDirect?.calculation?.loanAmount, 400_000);
assert.equal(fsaDirect?.calculation?.paymentsPerYear, 12);
assert.equal(fsaDirect?.calculation?.annualNoi, 80_000);
assert.equal(fsaDirect?.calculation?.annualDebtService, (fsaDirect?.calculation?.monthlyPayment ?? 0) * 12);
assert.equal(belowLoanLimit?.calculation?.loanAmount, 500_000);
assert.equal(usdaBi?.calculation?.loanAmount, 320_000, "Eligibility copy must not discard structured calculation inputs");
assert.equal(evaluateProgramFit("FSA direct farm-purchase loan — borrow directly from USDA", { ...base, screeningPrice: null, noiAnnual: null })?.calculation, undefined);
assert.equal(evaluateProgramFit("FSA direct farm ownership financing", { ...base, noiAnnual: null })?.calculation, undefined);
assert.equal(evaluateProgramFit("FSA direct farm ownership financing", { ...base, noiAnnual: -1000 })?.calculation?.annualNoi, -1000);
assert.match(fsaDirect?.line ?? "", /illustrative 1.25x comparison target/);
const chassis = readFileSync("src/components/property/lanes/GovernedLaneChassis.tsx", "utf8");
assert.match(chassis, /financing-calculation-inputs/);
assert.match(chassis, /We cannot calculate loan coverage yet/);
assert.match(chassis, /No loan program is being recommended/);
assert.doesNotMatch(chassis, /leadProgramLine\?\.match|ranked\[0\].*null|Clears the 1.25x|Best first path to test/);
const workspace = readFileSync("src/components/property/PropertyEvaluationWorkspace.tsx", "utf8");
assert.doesNotMatch(workspace, /primary-production transaction requires the farm-credit lane/);
assert.doesNotMatch(workspace, /effectiveListedPrice \?\? facts\?\.propertyRecord\?\.assessedTotalValue/);

const matrix = buildScenarioFinancingMatrix({
  baseContext: base,
  programs: ["USDA Business & Industry financing", "SBA 504 financing", "FSA direct farm ownership financing"],
  scenarios: [
    { id: "supported", label: "Verified whole-parcel plan", noiAnnual: 80_000, basis: "verified operating evidence", evidenceStatus: "supported" },
    { id: "speculative", label: "Unverified specialty crop", noiAnnual: 200_000, basis: "unverified customer idea", evidenceStatus: "needs-evidence" },
  ],
});
assert.equal(matrix.best?.scenario.id, "supported", "Supported economics must outrank a larger but unverified profitability claim");
assert.equal(matrix.best?.program, "FSA direct farm ownership financing", "The strongest executable program must lead without agency preference");
assert.match(matrix.note, /not a financing approval, closing assurance, or promise of keys/i);

Object.assign(globalThis, { React });
const renderProgram = "FSA direct farm-purchase loan — borrow directly from USDA";
const renderProps: LaneWorkspaceProps = {
  propertyId: "regression-not-a-deal", title: "Seippes display regression", location: "Federalsburg, MD",
  sourceLabel: "Test fixture", propertyType: "farm", priceLabel: "Price pending", fileNo: null, tierLabel: "Test",
  headline: "Test", readiness: [], fitLine: null, pauseLine: "Evidence pending", intelligence: null,
  financingLanes: [renderProgram],
};
const pendingMarkup = renderToStaticMarkup(React.createElement(FarmLaneWorkspace, renderProps));
assert.match(pendingMarkup, /We cannot calculate loan coverage yet/);
assert.doesNotMatch(pendingMarkup, /2\.14|9,922|4,639|Financing to test first/);
const knownMarkup = renderToStaticMarkup(React.createElement(FarmLaneWorkspace, {
  ...renderProps, priceLabel: "$400,000",
  financingFit: { [renderProgram]: evaluateProgramFit(renderProgram, base)! },
}));
assert.match(knownMarkup, /Show exactly where these numbers come from/);
assert.match(knownMarkup, /Transaction price: \$400,000/);
assert.match(knownMarkup, /Loan amount: \$400,000/);
assert.match(knownMarkup, /Annual net operating income: \$80,000/);

console.log(
  JSON.stringify(
    {
      ok: true,
      rule: "PROPERTY-FIRST-FINANCING-001",
      agencyPreferenceForbidden: true,
      fsaMayLeadWhenStrongest: true,
      usdaAndSbaFarmProjectPathsEvaluated: true,
      ruralHousingRequiresConfirmedResidentialUse: true,
      profitabilityFinancingMatrix: true,
      supportedEvidenceOutranksSpeculativeRevenue: true,
      noClosingOrKeysGuarantee: true,
    },
    null,
    2,
  ),
);
