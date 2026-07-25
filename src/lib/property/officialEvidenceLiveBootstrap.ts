import { buildMarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import { buildPreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import { evaluateFinancingIntake } from "@/lib/financing/intakeRuntime";
import { buildPostSaleTaxScenario } from "./ownershipCostModel";
import { buildPropertyBriefIntelligence } from "./propertyBriefIntelligence";
import { captureGeneratedEvidenceArtifact } from "./officialEvidenceGenerationCapture";
import { ensureProductionRecomputationBindings } from "./officialEvidenceProductionRecomputationHandlers";
import { listEvidenceReplayPackets } from "./officialEvidenceReplayPacketStore";

const PROPERTY_ID = "furlong-live-replay-review";
const IDS = {
  tax: "live-review:tax-scenario:v1",
  top: "live-review:top-three:v1",
  qualification: "live-review:qualification-result:v1",
  report: "live-review:property-report:v1",
} as const;

export function bootstrapLiveEvidenceReplayReview(
  at = new Date().toISOString(),
) {
  ensureProductionRecomputationBindings(at);
  const existing = new Set(
    listEvidenceReplayPackets().map((packet) => packet.artifactId),
  );
  const created: string[] = [];
  const taxInput = {
    price: 425000,
    sellerCurrentAnnualTax: 1800,
    currentTaxTransfersUnchanged: false,
    ownershipContext: {
      rates: { weekOf: "2026-07-23", rate30: 6.2, rate15: null },
      taxContext: {
        medianAnnualTax: 3200,
        medianHomeValue: 290000,
        effectiveRatePct: 1.1,
      },
      electricity: null,
      hpi: null,
    },
  };
  const taxOutput = buildPostSaleTaxScenario(
    {
      price: taxInput.price,
      sellerCurrentAnnualTax: taxInput.sellerCurrentAnnualTax,
      currentTaxTransfersUnchanged: false,
    },
    taxInput.ownershipContext,
  );
  const marketPlan = buildMarketComparablePlan({
    profileId: "farm",
    comparables: [],
  });
  const capitalPlan = buildPreliminaryCapitalPlan({
    profileId: "farm",
    listedPrice: 425000,
    requestedAmount: null,
    pathwayNames: ["FSA Direct Farm Ownership"],
  });
  const topInput = {
    profileId: "farm" as const,
    marketPlan,
    capitalPlan,
    pathwayCount: 1,
    taxImpact: {
      acquisitionPrice: 425000,
      stabilizedAnnual: 4675,
      adverseAnnual: 5844,
    },
    infrastructureRisk: null,
  };
  const qualificationInput = {
    applicationId: "live-review-application",
    purpose: "acquisition" as const,
    programInterest: "fsa" as const,
    contactName: "Governed Replay Review",
    contactEmail: "replay-review@example.test",
    propertyDescriptor: "Governed Review Farm",
    location: { state: "MD", county: "Caroline" },
    estimatedProjectCost: 425000,
    scopeSummary: "Production replay review bootstrap",
    timeline: "12 months",
    feeDisclosureAcknowledged: true,
    consentAcknowledged: true,
  };
  const qualificationOutput = evaluateFinancingIntake(qualificationInput);
  const briefInput = {
    propertyId: null,
    sourceId: null,
    propertyType: "farm",
    priceLabel: "$425,000",
    county: "Caroline County",
    town: "Federalsburg",
    stateCode: "MD",
    pathwayList: ["FSA Direct Farm Ownership"],
    description: "Governed production replay review property",
  };
  const fixtures = [
    {
      kind: "tax-scenario" as const,
      artifactId: IDS.tax,
      replayInput: taxInput,
      replayOutput: taxOutput,
      generatedAt: at,
    },
    {
      kind: "top-three" as const,
      artifactId: IDS.top,
      replayInput: topInput,
      replayOutput: buildScenarioRankingPlan(topInput),
      generatedAt: at,
    },
    {
      kind: "qualification-result" as const,
      artifactId: IDS.qualification,
      replayInput: qualificationInput,
      replayOutput: qualificationOutput,
      generatedAt: qualificationOutput.generatedAt,
    },
    {
      kind: "property-report" as const,
      artifactId: IDS.report,
      replayInput: briefInput,
      replayOutput: buildPropertyBriefIntelligence(briefInput),
      generatedAt: at,
    },
  ];
  for (const fixture of fixtures) {
    if (existing.has(fixture.artifactId)) continue;
    captureGeneratedEvidenceArtifact({ ...fixture, propertyId: PROPERTY_ID });
    created.push(fixture.artifactId);
  }
  return {
    propertyId: PROPERTY_ID,
    created,
    totalAvailable: listEvidenceReplayPackets().filter((packet) =>
      Object.values(IDS).includes(packet.artifactId as never),
    ).length,
  };
}
