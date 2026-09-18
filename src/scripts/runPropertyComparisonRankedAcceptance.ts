import { createHash, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";

import { furlongPropertyComparisonItems, furlongPropertyComparisons } from "@/db/schema";
import { db } from "@/lib/db";

import {
  ECONOMIC_EVIDENCE_PACKAGE_VERSION,
  REQUIRED_ECONOMIC_EVIDENCE_DOMAINS,
  assessEnterpriseEconomicEvidencePackage,
  type EconomicMetricBasis,
  type EconomicMetricUnit,
  type EnterpriseEconomicEvidencePackage,
  type SupportedEconomicMetric,
} from "@/lib/intelligence/economicEvidencePackage";
import type { ExpenseCategory } from "@/lib/intelligence/enterpriseProjection";
import { processPropertyComparisonAnalysisBatch } from "@/lib/intelligence/propertyComparisonAnalysisWorker";
import { processPropertyComparisonVerificationBatch } from "@/lib/intelligence/propertyComparisonVerificationWorker";
import {
  createPropertyComparison,
  loadPropertyComparison,
} from "@/lib/intelligence/propertyComparisonStore";
import { parsePropertyComparisonIntake } from "@/lib/intelligence/propertyComparisonIntake";

const GENERATED_AT = new Date().toISOString();
const SOURCE_AS_OF = GENERATED_AT;
const FIXTURE_ACTOR = "system:staging-ranked-comparison-acceptance";
const FIXTURE_ADDRESSES = [
  "84 W Dodridge St, Columbus, OH 43202",
  "1131 N Dupont Hwy, Dover, DE 19901",
  "3835 Seippes Rd, Federalsburg, MD 21632",
] as const;
const BASE_REVENUE = new Map<string, number>([
  [FIXTURE_ADDRESSES[0], 760_000],
  [FIXTURE_ADDRESSES[1], 700_000],
  [FIXTURE_ADDRESSES[2], 640_000],
]);

function metric(
  value: number,
  unit: EconomicMetricUnit,
  sourceRef: string,
  basis: EconomicMetricBasis = "source-observed",
): SupportedEconomicMetric {
  return {
    value,
    unit,
    basis,
    sourceRefs: [sourceRef],
    confidenceScore: 88,
    method: "Governed staging acceptance fixture with deterministic source-supported values.",
  };
}

function expenses(sourceRef: string): Record<ExpenseCategory, SupportedEconomicMetric> {
  return {
    payroll: metric(120_000, "usd-per-year", sourceRef),
    employeeBenefits: metric(20_000, "usd-per-year", sourceRef),
    healthInsurance: metric(15_000, "usd-per-year", sourceRef),
    retirement: metric(10_000, "usd-per-year", sourceRef),
    utilities: metric(60_000, "usd-per-year", sourceRef),
    insurance: metric(20_000, "usd-per-year", sourceRef),
    propertyTax: metric(15_000, "usd-per-year", sourceRef),
    maintenance: metric(20_000, "usd-per-year", sourceRef),
    replacementReserve: metric(15_000, "usd-per-year", sourceRef),
    marketing: metric(10_000, "usd-per-year", sourceRef),
    materials: metric(100_000, "usd-per-year", sourceRef),
    professionalFees: metric(10_000, "usd-per-year", sourceRef),
    other: metric(5_000, "usd-per-year", sourceRef),
  };
}

function inflation(sourceRef: string): Record<ExpenseCategory, SupportedEconomicMetric> {
  return Object.fromEntries(
    Object.keys(expenses(sourceRef)).map((category) => [
      category,
      metric(3, "percent", sourceRef, "source-derived"),
    ]),
  ) as Record<ExpenseCategory, SupportedEconomicMetric>;
}

function evidencePackage(input: {
  propertyId: string;
  address: string;
  candidateId: string;
  role: "best-single-enterprise" | "best-mixed-use" | "best-distinct-alternative";
  title: string;
  components: string[];
  annualRevenue: number;
  traceId: string;
}): EnterpriseEconomicEvidencePackage {
  const sourceRef = `acceptance-source:${input.propertyId}`;
  const contentHash = "sha256:" + createHash("sha256")
    .update(`${input.propertyId}|${input.address}|${SOURCE_AS_OF}`)
    .digest("hex");
  const packageId = `acceptance-package:${input.propertyId}:${input.candidateId}`;
  const packageValue: EnterpriseEconomicEvidencePackage = {
    version: ECONOMIC_EVIDENCE_PACKAGE_VERSION,
    packageId,
    propertyId: input.propertyId,
    address: input.address,
    generatedAt: GENERATED_AT,
    classification: "CONFIDENTIAL",
    traceId: input.traceId,
    replayRef: `replay:${packageId}`,
    candidate: {
      id: `${input.propertyId}:${input.candidateId}`,
      candidateRole: input.role,
      title: input.title,
      enterpriseComponents: input.components,
    },
    findings: REQUIRED_ECONOMIC_EVIDENCE_DOMAINS.map((domain) => ({
      domain,
      status: domain === "grants-incentives" ? "not-applicable" as const : "supported" as const,
      summary: `Staging fixture support for ${domain}.`,
      sourceRefs: [sourceRef],
      confidenceScore: 88,
    })),
    sources: [{
      id: sourceRef,
      sourceId: "staging-ranked-comparison-acceptance",
      title: "Governed ranked-comparison acceptance fixture",
      authorityTier: "Tier 2 certified institutional/commercial",
      kind: "professional-analysis",
      reference: `fixture://ranked-comparison/${input.propertyId}`,
      jurisdiction: "Synthetic staging fixture — Maryland",
      asOf: SOURCE_AS_OF,
      capturedAt: GENERATED_AT,
      maxAgeDays: 30,
      reviewStatus: "reviewed",
      useRights: "approved",
      contentHash,
      replayRef: `replay:${sourceRef}`,
    }],
    projectCosts: {
      askingPrice: metric(525_000, "usd", sourceRef),
      proposedPurchasePrice: metric(500_000, "usd", sourceRef),
      closingCosts: metric(20_000, "usd", sourceRef),
      conversionCosts: metric(100_000, "usd", sourceRef),
      equipmentCosts: metric(200_000, "usd", sourceRef),
      workingCapital: metric(50_000, "usd", sourceRef),
      otherProjectCosts: metric(30_000, "usd", sourceRef),
    },
    operations: {
      baseAnnualRevenue: metric(input.annualRevenue, "usd-per-year", sourceRef),
      annualRevenueGrowthPct: metric(2, "percent", sourceRef, "source-derived"),
      annualExpenses: expenses(sourceRef),
      annualExpenseInflationPct: inflation(sourceRef),
      periodicCapitalCosts: [{
        year: 10,
        label: "Major equipment refresh",
        amount: metric(50_000, "usd", sourceRef, "vendor-quote"),
      }],
    },
    labor: {
      fullTimeEquivalentEmployees: metric(4, "count", sourceRef),
      ownerHoursPerWeek: metric(40, "hours-per-week", sourceRef),
      ownerLaborTreatment: "included-in-payroll",
      sourceRefs: [sourceRef],
    },
    financing: {
      programFamily: "SBA 7(a) staging comparison fixture",
      loanAmount: metric(720_000, "usd", sourceRef, "source-derived"),
      cashContribution: metric(180_000, "usd", sourceRef, "source-derived"),
      annualRatePct: metric(7, "percent", sourceRef, "source-derived"),
      amortizationYears: metric(25, "years", sourceRef, "source-derived"),
      termYears: metric(25, "years", sourceRef, "source-derived"),
      sourceRefs: [sourceRef],
      otherCapitalSources: [],
    },
    constraints: {
      environmental: {
        status: "conditioned",
        summary: "Synthetic environmental diligence condition satisfied for ranking acceptance.",
        conditions: ["Retain ordinary lender-scope environmental diligence before a real closing."],
        sourceRefs: [sourceRef],
      },
      zoning: {
        status: "clear",
        summary: "Synthetic legal-use evidence supports the fixture use.",
        conditions: [],
        sourceRefs: [sourceRef],
      },
      engineering: {
        status: "conditioned",
        summary: "Synthetic capacity review supports the fixture conversion budget.",
        conditions: ["Confirm final contractor scope for a real project."],
        sourceRefs: [sourceRef],
      },
      market: {
        status: "clear",
        summary: "Synthetic reviewed demand/competition evidence supports the fixture revenue case.",
        conditions: [],
        sourceRefs: [sourceRef],
      },
    },
    controls: {
      employeeBenefitsExcludeHealthInsuranceAndRetirement: true,
      maintenanceExcludesReplacementReserve: true,
      periodicCapitalCostsExcludeAnnualReplacementReserve: true,
      enterpriseComponentDoubleCountingReviewPassed: true,
    },
    professionalReview: {
      status: "reviewed",
      reviewerRole: "staging acceptance fixture reviewer",
      reviewedAt: GENERATED_AT,
      note: "Synthetic acceptance evidence only; never production property evidence.",
    },
  };
  const assessment = assessEnterpriseEconomicEvidencePackage(packageValue);
  assert.equal(assessment.status, "complete", assessment.missingEvidence.join("; "));
  return packageValue;
}

function packagesFor(propertyId: string, address: string, traceId: string) {
  const revenue = BASE_REVENUE.get(address);
  assert.ok(revenue, `No deterministic revenue fixture for ${address}`);
  return [
    evidencePackage({
      propertyId,
      address,
      candidateId: "single",
      role: "best-single-enterprise",
      title: "Single-enterprise fixture",
      components: ["Primary operating enterprise"],
      annualRevenue: revenue,
      traceId,
    }),
    evidencePackage({
      propertyId,
      address,
      candidateId: "mixed",
      role: "best-mixed-use",
      title: "Mixed-use fixture",
      components: ["Primary operating enterprise", "Secondary compatible enterprise"],
      annualRevenue: revenue - 30_000,
      traceId,
    }),
    evidencePackage({
      propertyId,
      address,
      candidateId: "alternative",
      role: "best-distinct-alternative",
      title: "Distinct-alternative fixture",
      components: ["Distinct alternative enterprise"],
      annualRevenue: revenue - 60_000,
      traceId,
    }),
  ];
}

async function main(): Promise<void> {
  if (process.env.DEPLOYMENT_ENVIRONMENT !== "staging" ||
      process.env.SYNTHETIC_FIXTURES_ENABLED !== "true" ||
      process.env.FURLONG_RANKED_ACCEPTANCE_FIXTURE !== "true") {
    throw new Error("Ranked comparison acceptance fixture is staging-only and requires explicit fixture authorization.");
  }

  const traceId = "ranked-comparison-acceptance-" + randomUUID();
  const intake = parsePropertyComparisonIntake({
    addressesText: FIXTURE_ADDRESSES.join("\n"),
    requestedResultCount: 3,
  });
  if (!intake.ok) throw new Error(intake.error);

  const created = await createPropertyComparison({
    intake: intake.value,
    ownerActorId: FIXTURE_ACTOR,
    traceId,
  });
  const verification = await processPropertyComparisonVerificationBatch({
    limit: 3,
    traceId,
    comparisonId: created.comparisonId,
  });
  assert.equal(verification.processed, 3, JSON.stringify(verification.results));
  assert.equal(
    verification.results.filter((item) => item.status === "VERIFIED").length,
    3,
    JSON.stringify(verification.results),
  );

  let loaded = await loadPropertyComparison({
    comparisonId: created.comparisonId,
    ownerActorId: FIXTURE_ACTOR,
    accessToken: created.accessToken,
  });
  assert.ok(loaded, "Acceptance comparison could not be reloaded after verification.");

  const parentMetadata = loaded.comparison.metadata && typeof loaded.comparison.metadata === "object"
    ? loaded.comparison.metadata as Record<string, unknown>
    : {};
  await db.update(furlongPropertyComparisons).set({
    metadata: {
      ...parentMetadata,
      syntheticAcceptance: true,
      realAddressVerification: true,
      syntheticEconomicsNeverCustomerEvidence: true,
      acceptanceVersion: "property-comparison-ranked-acceptance-v2",
    },
  }).where(eq(furlongPropertyComparisons.id, created.comparisonId));

  for (const item of loaded.items) {
    assert.equal(item.status, "VERIFIED", `Acceptance item did not verify: ${item.submittedAddress}`);
    assert.ok(item.propertyId, `Acceptance item lacks property ID: ${item.submittedAddress}`);
    const address = item.normalizedAddress ?? item.submittedAddress;
    const packages = packagesFor(item.propertyId!, address, traceId);
    const currentSnapshot = item.resultSnapshot && typeof item.resultSnapshot === "object" && !Array.isArray(item.resultSnapshot)
      ? item.resultSnapshot as Record<string, unknown>
      : {};
    const [updated] = await db.update(furlongPropertyComparisonItems).set({
      resultSnapshot: {
        ...currentSnapshot,
        economicEvidencePackages: packages,
        syntheticAcceptance: true,
        syntheticEconomicsNeverCustomerEvidence: true,
      },
      metadata: {
        rankingEligible: false,
        syntheticAcceptance: true,
        reason: "Real address verification complete; synthetic staging economics attached for ranking acceptance only.",
      },
      updatedAt: new Date(),
      traceId,
      replayRef: traceId,
    }).where(and(
      eq(furlongPropertyComparisonItems.id, item.id),
      eq(furlongPropertyComparisonItems.comparisonId, created.comparisonId),
      eq(furlongPropertyComparisonItems.status, "VERIFIED"),
    )).returning({ id: furlongPropertyComparisonItems.id });
    assert.ok(updated, `Acceptance evidence could not be attached for ${address}`);
  }

  const analysis = await processPropertyComparisonAnalysisBatch({
    limit: 3,
    traceId,
    comparisonId: created.comparisonId,
  });
  assert.equal(analysis.completed, 3, JSON.stringify(analysis.results));
  assert.equal(analysis.needsEvidence, 0, JSON.stringify(analysis.results));

  loaded = await loadPropertyComparison({
    comparisonId: created.comparisonId,
    ownerActorId: FIXTURE_ACTOR,
    accessToken: created.accessToken,
  });
  assert.ok(loaded, "Acceptance comparison could not be reloaded after analysis.");
  const metadata = loaded.comparison.metadata && typeof loaded.comparison.metadata === "object"
    ? loaded.comparison.metadata as Record<string, unknown>
    : {};
  const ranking = metadata.ranking as {
    status?: string;
    ranked?: Array<{ rank: number; address: string; annualNetAfterDebtAndCapital: number }>;
    excluded?: unknown[];
  } | undefined;
  assert.equal(loaded.comparison.status, "COMPLETED");
  assert.equal(ranking?.status, "completed");
  assert.equal(ranking?.ranked?.length, 3);
  assert.equal(ranking?.excluded?.length, 0);
  assert.deepEqual(
    ranking?.ranked?.map((entry) => entry.address),
    [...FIXTURE_ADDRESSES],
    "Ranked order must follow the deliberately descending synthetic economics after real address verification.",
  );
  for (let index = 1; index < (ranking?.ranked?.length ?? 0); index += 1) {
    assert.ok(
      ranking!.ranked![index - 1].annualNetAfterDebtAndCapital > ranking!.ranked![index].annualNetAfterDebtAndCapital,
      "Ranked annual net must descend strictly.",
    );
  }

  console.log(JSON.stringify({
    ok: true,
    rule: "PROPERTY-COMPARISON-LIVE-RANKED-ACCEPTANCE-002",
    traceId,
    comparisonId: created.comparisonId,
    status: loaded.comparison.status,
    realAddressVerification: true,
    syntheticEconomics: true,
    customerEvidence: false,
    analyzed: analysis.completed,
    verification: verification.results,
    ranking: ranking?.ranked?.map((entry) => ({
      rank: entry.rank,
      address: entry.address,
      annualNetAfterDebtAndCapital: entry.annualNetAfterDebtAndCapital,
    })),
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
