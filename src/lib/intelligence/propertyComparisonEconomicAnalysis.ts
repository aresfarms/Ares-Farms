import {
  assessEnterpriseEconomicEvidencePackage,
  buildComparableCandidateFromEconomicEvidence,
  type EconomicEvidencePackageAssessment,
  type EnterpriseEconomicEvidencePackage,
} from "@/lib/intelligence/economicEvidencePackage";
import type {
  ComparablePropertyAnalysis,
} from "@/lib/intelligence/propertyComparisonRanking";
import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";

export const PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION =
  "property-comparison-economic-analysis-v1.0.0" as const;

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
}): string[] {
  const problems: string[] = [];
  if (input.packages.length !== 3) {
    problems.push("Exactly three economic evidence packages are required.");
  }
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

  const roles = new Set(
    input.packages.map((item) => item.candidate.candidateRole),
  );
  if (!roles.has("best-single-enterprise")) {
    problems.push("The best single-enterprise package is missing.");
  }
  if (!roles.has("best-mixed-use")) {
    problems.push("The best mixed-use package is missing.");
  }
  const thirdCount = input.packages.filter((item) =>
    ["customer-vision", "best-distinct-alternative"].includes(
      item.candidate.candidateRole,
    ),
  ).length;
  if (thirdCount !== 1) {
    problems.push(
      "Exactly one customer-vision or best-distinct-alternative package is required.",
    );
  }
  if (roles.size !== 3) {
    problems.push("Each economic evidence package must fill a distinct candidate role.");
  }
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
}): PropertyComparisonEconomicAnalysisCompilation {
  const assessments = input.packages.map((item) =>
    assessEnterpriseEconomicEvidencePackage(item),
  );
  const missingEvidence = packageIdentityProblems(input);

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

  return {
    ok: true,
    version: PROPERTY_COMPARISON_ECONOMIC_ANALYSIS_VERSION,
    analysis: {
      comparisonItemId: input.comparisonItemId,
      propertyId: input.propertyId,
      address: input.address,
      status: "completed",
      candidates: input.packages.map((item) =>
        buildComparableCandidateFromEconomicEvidence(item),
      ),
    },
    assessments,
    evidenceRefs: [...evidenceRefs].sort(),
  };
}
