import type { ScenarioCandidateRole } from "@/lib/intelligence/scenarioRankingPlan";
import {
  ENTERPRISE_PROJECTION_VERSION,
  type EnterpriseProjection,
} from "@/lib/intelligence/enterpriseProjection";

export const PROPERTY_COMPARISON_RANKING_VERSION = "property-comparison-ranking-v1.0.0" as const;
export const MINIMUM_COMPARISON_CONFIDENCE = 60;

export type ConstraintStatus = "clear" | "conditioned" | "unknown" | "blocked";
export type EconomicEvidenceStatus =
  | "verified-operating-evidence"
  | "source-supported"
  | "scenario-only"
  | "needs-evidence";

export type ComparableEnterpriseCandidate = {
  id: string;
  candidateRole: ScenarioCandidateRole;
  title: string;
  evidenceStatus: EconomicEvidenceStatus;
  confidenceScore: number;
  sourceRefs: string[];
  missingEvidence: string[];
  constraints: {
    environmental: ConstraintStatus;
    zoning: ConstraintStatus;
    engineering: ConstraintStatus;
    market: ConstraintStatus;
  };
  totalProjectCost: number | null;
  dscr: number | null;
  projection: EnterpriseProjection;
};

export type ComparablePropertyAnalysis = {
  comparisonItemId: string;
  propertyId: string;
  address: string;
  status: "completed" | "needs-evidence" | "unverifiable" | "failed";
  candidates: ComparableEnterpriseCandidate[];
};

export type RankedComparisonProperty = {
  rank: number;
  comparisonItemId: string;
  propertyId: string;
  address: string;
  candidate: ComparableEnterpriseCandidate;
  annualNetAfterDebtAndCapital: number;
  monthlyNetAfterDebtAndCapital: number;
  fiveYearCumulativeNet: number;
  tenYearCumulativeNet: number;
  thirtyYearCumulativeNet: number;
  verdict: "PROCEED_WITH_CONDITIONS" | "RENEGOTIATE" | "NOT_SELF_SUPPORTING";
};

export type PropertyComparisonRankingResult = {
  version: typeof PROPERTY_COMPARISON_RANKING_VERSION;
  status: "pending" | "completed" | "partial" | "needs-evidence";
  requestedResultCount: number;
  ranked: RankedComparisonProperty[];
  excluded: Array<{ comparisonItemId: string; address: string; reasons: string[] }>;
  portfolioVerdict: "VIABLE_OPTIONS_FOUND" | "RUN_FROM_ALL" | "NOT_READY_TO_RANK";
  releaseRule: string;
};

function candidateExclusionReasons(candidate: ComparableEnterpriseCandidate): string[] {
  const reasons: string[] = [];
  if (candidate.evidenceStatus === "scenario-only" || candidate.evidenceStatus === "needs-evidence") {
    reasons.push("Property economics are not supported by sufficient evidence.");
  }
  if (!Number.isFinite(candidate.confidenceScore) ||
      candidate.confidenceScore < MINIMUM_COMPARISON_CONFIDENCE) {
    reasons.push(`Confidence is below the ${MINIMUM_COMPARISON_CONFIDENCE}/100 comparison floor.`);
  }
  if (!candidate.sourceRefs.length) reasons.push("No economic source references are attached.");
  if (candidate.missingEvidence.length) reasons.push(...candidate.missingEvidence);
  for (const [kind, status] of Object.entries(candidate.constraints)) {
    if (status === "blocked") reasons.push(`${kind} feasibility is blocked.`);
    if (status === "unknown") reasons.push(`${kind} feasibility is unresolved.`);
  }
  if (candidate.totalProjectCost == null || !Number.isFinite(candidate.totalProjectCost)) {
    reasons.push("Total project cost is unresolved.");
  }
  if (candidate.dscr == null || !Number.isFinite(candidate.dscr)) {
    reasons.push("Property/project DSCR is unresolved.");
  }
  if (candidate.projection.status !== "complete") {
    reasons.push(...candidate.projection.missingInputs);
  }
  return [...new Set(reasons)];
}

function bestEligibleCandidate(analysis: ComparablePropertyAnalysis) {
  const assessed = analysis.candidates.map((candidate) => ({
    candidate,
    reasons: candidateExclusionReasons(candidate),
  }));
  const eligible = assessed.filter((entry) => entry.reasons.length === 0)
    .map((entry) => entry.candidate)
    .filter((candidate) => candidate.projection.status === "complete")
    .sort((a, b) => {
      if (a.projection.status !== "complete" || b.projection.status !== "complete") return 0;
      return b.projection.annualYearOneNet - a.projection.annualYearOneNet ||
        b.projection.cumulativeNet.year5 - a.projection.cumulativeNet.year5 ||
        (b.dscr ?? 0) - (a.dscr ?? 0) ||
        b.confidenceScore - a.confidenceScore ||
        a.id.localeCompare(b.id);
    });
  return { candidate: eligible[0] ?? null, assessed };
}

export function rankPropertyComparisonAnalyses(input: {
  analyses: ComparablePropertyAnalysis[];
  expectedPropertyCount: number;
  requestedResultCount: number;
}): PropertyComparisonRankingResult {
  const releaseRule =
    "Rank only completed property analyses with sourced economics, complete lifecycle projections, resolved feasibility constraints, total project cost, and property/project DSCR. Never substitute scenario-only numbers.";
  const requestedResultCount = Math.min(Math.max(Math.trunc(input.requestedResultCount), 1), 5);
  if (input.analyses.length < input.expectedPropertyCount) {
    return {
      version: PROPERTY_COMPARISON_RANKING_VERSION, status: "pending",
      requestedResultCount, ranked: [], excluded: [],
      portfolioVerdict: "NOT_READY_TO_RANK", releaseRule,
    };
  }

  const excluded: PropertyComparisonRankingResult["excluded"] = [];
  const qualifying: Array<{
    analysis: ComparablePropertyAnalysis;
    candidate: ComparableEnterpriseCandidate;
  }> = [];
  for (const analysis of input.analyses) {
    if (analysis.status !== "completed") {
      excluded.push({
        comparisonItemId: analysis.comparisonItemId,
        address: analysis.address,
        reasons: [analysis.status === "unverifiable"
          ? "The property address could not be verified."
          : analysis.status === "failed"
            ? "Property analysis failed and requires review."
            : "Material property or economic evidence is still missing."],
      });
      continue;
    }
    const roles = new Set(analysis.candidates.map((candidate) => candidate.candidateRole));
    const threeCandidateContractPresent =
      roles.has("best-single-enterprise") &&
      roles.has("best-mixed-use") &&
      (roles.has("customer-vision") || roles.has("best-distinct-alternative"));
    if (!threeCandidateContractPresent) {
      excluded.push({
        comparisonItemId: analysis.comparisonItemId,
        address: analysis.address,
        reasons: ["The required single-enterprise, mixed-use, and customer-vision/distinct-alternative comparison is incomplete."],
      });
      continue;
    }
    const best = bestEligibleCandidate(analysis);
    if (!best.candidate) {
      excluded.push({
        comparisonItemId: analysis.comparisonItemId,
        address: analysis.address,
        reasons: [...new Set(best.assessed.flatMap((entry) => entry.reasons))],
      });
      continue;
    }
    qualifying.push({ analysis, candidate: best.candidate });
  }

  const viable = qualifying.filter(({ candidate }) =>
    candidate.projection.status === "complete" &&
    candidate.projection.annualYearOneNet > 0 &&
    (candidate.dscr ?? 0) >= 1,
  ).sort((a, b) => {
    if (a.candidate.projection.status !== "complete" || b.candidate.projection.status !== "complete") return 0;
    return b.candidate.projection.annualYearOneNet - a.candidate.projection.annualYearOneNet ||
      b.candidate.projection.cumulativeNet.year5 - a.candidate.projection.cumulativeNet.year5 ||
      (b.candidate.dscr ?? 0) - (a.candidate.dscr ?? 0) ||
      a.analysis.address.localeCompare(b.analysis.address);
  });

  const ranked = viable.slice(0, requestedResultCount).map(({ analysis, candidate }, index) => {
    if (candidate.projection.status !== "complete") throw new Error("Eligible comparison projection became incomplete.");
    const verdict = (candidate.dscr ?? 0) >= 1.25
      ? "PROCEED_WITH_CONDITIONS" as const
      : "RENEGOTIATE" as const;
    return {
      rank: index + 1,
      comparisonItemId: analysis.comparisonItemId,
      propertyId: analysis.propertyId,
      address: analysis.address,
      candidate,
      annualNetAfterDebtAndCapital: candidate.projection.annualYearOneNet,
      monthlyNetAfterDebtAndCapital: candidate.projection.monthlyYearOneNet,
      fiveYearCumulativeNet: candidate.projection.cumulativeNet.year5,
      tenYearCumulativeNet: candidate.projection.cumulativeNet.year10,
      thirtyYearCumulativeNet: candidate.projection.cumulativeNet.year30,
      verdict,
    };
  });

  return {
    version: PROPERTY_COMPARISON_RANKING_VERSION,
    status: ranked.length
      ? excluded.length || ranked.length < requestedResultCount ? "partial" : "completed"
      : excluded.length ? "needs-evidence" : "completed",
    requestedResultCount,
    ranked,
    excluded,
    portfolioVerdict: ranked.length ? "VIABLE_OPTIONS_FOUND" : "RUN_FROM_ALL",
    releaseRule,
  };
}

const objectRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const stringList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string" && Boolean(item.trim()));

function validProjection(value: unknown): boolean {
  const projection = objectRecord(value);
  if (!projection ||
      projection.version !== ENTERPRISE_PROJECTION_VERSION ||
      !["complete", "needs-evidence"].includes(String(projection.status))) {
    return false;
  }
  if (projection.status === "needs-evidence") {
    return stringList(projection.missingInputs);
  }
  const cumulative = objectRecord(projection.cumulativeNet);
  if (!cumulative ||
      !finite(projection.monthlyYearOneNet) ||
      !finite(projection.quarterlyYearOneNet) ||
      !finite(projection.annualYearOneNet) ||
      !finite(cumulative.year5) ||
      !finite(cumulative.year10) ||
      !finite(cumulative.year30) ||
      !stringList(projection.assumptions) ||
      !Array.isArray(projection.years) ||
      projection.years.length !== 30) {
    return false;
  }
  const numericYearFields = [
    "revenue",
    "operatingExpenses",
    "noi",
    "debtService",
    "periodicCapitalCosts",
    "netAfterDebtAndCapital",
    "outsideIncomeRequired",
    "cumulativeNet",
  ] as const;
  return projection.years.every((value, index) => {
    const year = objectRecord(value);
    return Boolean(
      year &&
      year.year === index + 1 &&
      numericYearFields.every((field) => finite(year[field])),
    );
  });
}

function validCandidate(value: unknown): boolean {
  const candidate = objectRecord(value);
  const constraints = objectRecord(candidate?.constraints);
  const roles: ScenarioCandidateRole[] = [
    "best-single-enterprise",
    "best-mixed-use",
    "customer-vision",
    "best-distinct-alternative",
  ];
  const evidenceStatuses: EconomicEvidenceStatus[] = [
    "verified-operating-evidence",
    "source-supported",
    "scenario-only",
    "needs-evidence",
  ];
  const constraintStatuses: ConstraintStatus[] = [
    "clear",
    "conditioned",
    "unknown",
    "blocked",
  ];
  return Boolean(
    candidate &&
    typeof candidate.id === "string" &&
    Boolean(candidate.id.trim()) &&
    typeof candidate.title === "string" &&
    Boolean(candidate.title.trim()) &&
    roles.includes(candidate.candidateRole as ScenarioCandidateRole) &&
    evidenceStatuses.includes(
      candidate.evidenceStatus as EconomicEvidenceStatus,
    ) &&
    finite(candidate.confidenceScore) &&
    candidate.confidenceScore >= 0 &&
    candidate.confidenceScore <= 100 &&
    stringList(candidate.sourceRefs) &&
    Array.isArray(candidate.missingEvidence) &&
    candidate.missingEvidence.every((item) => typeof item === "string") &&
    constraints &&
    ["environmental", "zoning", "engineering", "market"].every(
      (kind) => constraintStatuses.includes(
        constraints[kind] as ConstraintStatus,
      ),
    ) &&
    (candidate.totalProjectCost === null ||
      finite(candidate.totalProjectCost)) &&
    (candidate.dscr === null || finite(candidate.dscr)) &&
    validProjection(candidate.projection),
  );
}

export function isComparablePropertyAnalysis(
  value: unknown,
): value is ComparablePropertyAnalysis {
  const analysis = objectRecord(value);
  if (!analysis ||
      typeof analysis.comparisonItemId !== "string" ||
      !analysis.comparisonItemId.trim() ||
      typeof analysis.propertyId !== "string" ||
      !analysis.propertyId.trim() ||
      typeof analysis.address !== "string" ||
      !analysis.address.trim() ||
      !["completed", "needs-evidence", "unverifiable", "failed"].includes(
        String(analysis.status),
      ) ||
      !Array.isArray(analysis.candidates)) {
    return false;
  }
  if (analysis.status === "completed" &&
      analysis.candidates.length !== 3) {
    return false;
  }
  return analysis.candidates.every(validCandidate);
}
