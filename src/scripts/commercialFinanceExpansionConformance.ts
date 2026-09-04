import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assessCommercialFinanceAuthority,
  requiresSbaForm159,
} from "@/lib/financing/commercialFinanceGovernance";
import { evaluateFinancingIntake } from "@/lib/financing/intakeRuntime";
import {
  LENDER_NETWORK_CANDIDATES,
  routableLenderPartners,
} from "@/lib/financing/lenderNetworkRegistry";
import { affiliateReadinessSummary } from "@/lib/financing/lendingAffiliateReadiness";
import { federalLenderRoadmapSummary } from "@/lib/financing/federalLenderApprovalRoadmap";
import { PROFESSIONAL_GRANTS } from "@/lib/auth/professionalRegistry";
import { canonicalProviderAuthority } from "@/lib/platform/authorities/provider";

const ROOT = process.cwd();
const findings: string[] = [];
const assert = (condition: boolean, message: string) => {
  if (!condition) findings.push(message);
};
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const baseIntake = {
  contactName: "Test Borrower",
  contactEmail: "test@example.com",
  contactPhone: null,
  contactAddress: null,
  contactCity: null,
  contactState: "DE",
  contactPostalCode: null,
  financingPurpose: "purchase_property",
  programInterest: "fsa" as const,
  estimatedProjectCost: 500000,
  financingAmount: 450000,
  estimatedEquityAvailable: 50000,
  propertyDescriptor: "Test agricultural property",
  location: { state: "DE", county: "Sussex" },
  scopeSummary: "Test governed intake",
  businessName: "Test Farm",
  businessAgeYears: 5,
  annualRevenue: 400000,
  creditRange: "good",
  timeline: "3-6 months",
  feeDisclosureAcknowledged: true,
  consentAcknowledged: true,
};

const intake = evaluateFinancingIntake(baseIntake);
assert(
  intake.routedTo === "furlong-capital-desk",
  "New financing intake must route to the owner-controlled Furlong Capital Desk.",
);
assert(
  intake.networkNote?.includes("no candidate receives your information") === true,
  "FSA/network intake must disclose that candidates receive no data before a governed handoff.",
);

const navigation = assessCommercialFinanceAuthority({
  state: "DE",
  activity: "program_navigation",
  program: "sba_7a",
});
assert(navigation.allowed, "Program navigation should remain active coordination-only work.");

const paidSba = assessCommercialFinanceAuthority({
  state: "DE",
  activity: "compensated_brokerage_or_referral",
  program: "sba_7a",
});
assert(!paidSba.allowed, "Paid SBA brokerage/referral must fail closed before legal clearance and written engagement.");
assert(paidSba.form159Required, "Paid SBA 7(a) broker/referral activity must carry the Form 159 control.");
assert(
  requiresSbaForm159("compensated_packaging", "sba_504"),
  "Paid SBA 504 packaging must carry the Form 159 control.",
);

assert(
  LENDER_NETWORK_CANDIDATES.length >= 4,
  "Step 3 should seed a diversified initial lender-network discovery set.",
);
assert(
  routableLenderPartners().length === 0,
  "Discovery candidates must not become routable partners without certification.",
);

const affiliate = affiliateReadinessSummary();
assert(!affiliate.productionReady, "The unformed lending affiliate must not be production-ready.");
assert(!affiliate.posture.mayFundLoans, "The unformed lending affiliate must not be allowed to fund loans.");

const federal = federalLenderRoadmapSummary();
assert(federal.directFederalApprovalsHeld === 0, "No direct SBA/USDA/FSA lender approval may be claimed yet.");

const stuartGrant = PROFESSIONAL_GRANTS.find((grant) =>
  grant.email.toLowerCase().includes("sfraas"),
);
assert(stuartGrant?.role === "broker", "Retained Stuart access must remain broker-only.");
assert(
  stuartGrant?.basis.includes("legacy or explicitly assigned") === true,
  "Retained broker grant must be explicitly limited to legacy/assigned cases.",
);
assert(
  canonicalProviderAuthority.all.every((provider) => !/five borough|stuart|fraass/i.test(`${provider.name} ${provider.slug}`)),
  "Retained external broker must not remain a public Furlong provider listing.",
);

const dealDeskApi = read("src/app/api/lender/deal-desk/route.ts");
assert(
  dealDeskApi.includes("externalBrokerMayAccessApplication"),
  "Broker Deal Desk API must enforce case-level external-broker scope.",
);
assert(
  dealDeskApi.includes("listLenderDealsForProvider") &&
    dealDeskApi.includes("providerMayAccessServiceRequest") &&
    dealDeskApi.includes("retainedExternalBrokerProviderId"),
  "Broker Deal Desk list/reminder operations must be provider-scoped; the retained broker may keep legacy broker-spoke cases plus explicitly consented Capital Network assignments.",
);

const intakeApi = read("src/app/api/financing/intake/route.ts");
assert(
  intakeApi.includes("NOT") || intakeApi.includes("furlong-capital-desk"),
  "Financing intake API must carry the Capital Desk route.",
);
assert(
  !intakeApi.includes('intakeResult.routedTo === "licensed-lending-spoke"'),
  "New intake API must not automatically branch into the retained external-broker spoke.",
);

const feeSchedule = read("src/lib/financing/financingFeeSchedule.ts");
assert(
  feeSchedule.includes("Not activated") && feeSchedule.includes("SBA Form 159"),
  "Fee posture must keep paid agent activity off and preserve SBA Form 159 control.",
);
assert(
  !/NMLS|FHA|jumbo|non-QM|fiduciary duty/i.test(feeSchedule),
  "Commercial Capital Desk fee posture must not make residential-mortgage licensing/service claims.",
);

console.log(
  JSON.stringify(
    {
      ok: findings.length === 0,
      step2: {
        intakeRoute: intake.routedTo,
        paidBrokerageActive: paidSba.allowed,
        sbaForm159Control: paidSba.form159Required,
      },
      step3: {
        candidates: LENDER_NETWORK_CANDIDATES.length,
        certifiedRoutablePartners: routableLenderPartners().length,
      },
      step4: {
        entityStatus: affiliate.posture.entityStatus,
        productionReady: affiliate.productionReady,
        verifiedGates: affiliate.verifiedGateCount,
        requiredGates: affiliate.requiredGateCount,
      },
      step5: federal,
      findings,
    },
    null,
    2,
  ),
);

if (findings.length) process.exit(1);
