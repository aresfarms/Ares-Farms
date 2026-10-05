import {
  assessEnterpriseEconomicEvidencePackage,
  buildComparableCandidateFromEconomicEvidence,
  type EconomicEvidencePackageAssessment,
  type EnterpriseEconomicEvidencePackage,
} from "@/lib/intelligence/economicEvidencePackage";
import type {
  ComparablePropertyAnalysis,
} from "@/lib/intelligence/propertyComparisonRanking";
import { assessCandidateExclusion, candidateRoleCoverageProblems, type CandidateExclusionEvidence } from "./candidateExclusionEvidence";
import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";

export const PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION =
  "property-comparison-economic-analysis-v1.1.0" as const;

export type PropertyComparisonEconomicAnalysisCompilation =
  | {
      ok: true;
      version: typeof PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION;
      analysis: ComparablePropertyAnalysis;
      assessments: EconomicEvidencePackageAssessment[];
      evidenceRefs: string[];
    }
  | {
      ok: false;
      version: typeof PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION;
      missingEvidence: string[];
      assessments: EconomicEvidencePackageAssessment[];
    };

function packageIdentityProblems(input: {
  comparisonItemId: string;
  propertyId: string;
  address: string;
  packages: EnterpriseEconomicEvidencePackage[];
  exclusions?: CandidateExclusionEvidence[];
  asOf?: string;
}): string[] {
  const problems: string[] = [];
  const exclusions = input.exclusions ?? [];
  if (input.packages.length > 3 || exclusions.length > 3) problems.push("At most three decision roles may be completed.");
  const packageIds = input.packages.map((item) => item.packageId);
  if (new Set(packageIds).size !== packageIds.length) {
    problems.push("Economic evidence package IDs must be unique.");
  }
  const candidateIds = input.packages.map((item) => item.candidate.id);
  if (new Set(candidateIds).size !== candidateIds.length) {
    problems.push("Enterprise candidate IDs must be unique.");
  }
  const expectedAddress = normalizedListingAddress(input.address);
  for (const item of input.packages) {
    if (item.propertyId !== input.propertyId) {
      problems.push(
        "Package " + item.packageId + " does not match the comparison property ID.",
      );
    }
    if (normalizedListingAddress(item.address) !== expectedAddress) {
      problems.push(
        "Package " + item.packageId + " does not match the comparison address.",
      );
    }
  }

  problems.push(...candidateRoleCoverageProblems([
    ...input.packages.map(p => p.candidate.candidateRole), ...exclusions.map(e => e.candidateRole),
  ]));
  const recordIds = [...packageIds, ...exclusions.map(e => e.exclusionId)];
  if (new Set(recordIds).size !== recordIds.length) problems.push("Economic package and exclusion IDs must be unique.");
  if (!input.comparisonItemId.trim()) {
    problems.push("A comparison item ID is required.");
  }
  if (!input.propertyId.trim()) {
    problems.push("A property ID is required.");
  }
  if (!expectedAddress) {
    problems.push("A normalized comparison address is required.");
  }
  return problems;
}

export function compilePropertyComparisonEconomicAnalysis(input: {
  comparisonItemId: string;
  propertyId: string;
  address: string;
  packages: EnterpriseEconomicEvidencePackage[];
  exclusions?: CandidateExclusionEvidence[];
  asOf?: string;
}): PropertyComparisonEconomicAnalysisCompilation {
  const exclusions = input.exclusions ?? [];
  const latestDate = Math.max(...[...input.packages, ...exclusions].map(item => Date.parse(item.generatedAt)));
  const asOf = input.asOf ?? (Number.isFinite(latestDate) ? new Date(latestDate).toISOString() : "invalid");
  const currentPackages = input.packages.map(item => ({ ...item, generatedAt: asOf }));
  const assessments = currentPackages.map(assessEnterpriseEconomicEvidencePackage);
  const missingEvidence = packageIdentityProblems(input);
  if (!Number.isFinite(Date.parse(asOf))) missingEvidence.push("A valid assessment date is required.");
  for (const item of input.packages) {
    if (!Number.isFinite(Date.parse(item.generatedAt)) || Date.parse(item.generatedAt) > Date.parse(asOf)) {
      missingEvidence.push("Package " + item.packageId + " has an invalid or future generation date.");
    }
  }
  for (const exclusion of exclusions) {
    const assessment = assessCandidateExclusion(exclusion, { propertyId: input.propertyId, address: input.address, asOf });
    missingEvidence.push(...assessment.missingEvidence.map(problem => `${exclusion.exclusionId}: ${problem}`));
  }

  for (let index = 0; index < assessments.length; index += 1) {
    const assessment = assessments[index];
    const item = input.packages[index];
    if (assessment.status !== "complete") {
      missingEvidence.push(
        "Package " + item.packageId + " is " + assessment.status + ".",
      );
    }
    for (const missing of assessment.missingEvidence) {
      missingEvidence.push(item.candidate.title + ": " + missing);
    }
    if (assessment.evidenceStatus === "scenario-only") {
      missingEvidence.push(
        item.candidate.title +
        ": customer assumptions cannot enter paid comparative ranking.",
      );
    }
  }

  if (missingEvidence.length) {
    return {
      ok: false,
      version: PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
      missingEvidence: [...new Set(missingEvidence)].sort(),
      assessments,
    };
  }

  const evidenceRefs = new Set<string>();
  for (const item of input.packages) {
    evidenceRefs.add(item.replayRef);
    for (const source of item.sources) {
      evidenceRefs.add(source.replayRef);
    }
  }

  for (const exclusion of exclusions) {
    evidenceRefs.add(exclusion.replayRef);
    for (const source of exclusion.sources) evidenceRefs.add(source.replayRef);
  }
  return {
    ok: true,
    version: PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
    analysis: {
      comparisonItemId: input.comparisonItemId,
      propertyId: input.propertyId,
      address: input.address,
      status: "completed",
      assessmentAsOf: asOf,
      exclusions,
      candidates: currentPackages.map((item) =>
        buildComparableCandidateFromEconomicEvidence(item),
      ),
    },
    assessments,
    evidenceRefs: [...evidenceRefs].sort(),
  };
}
