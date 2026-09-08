import assert from "node:assert/strict";

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
