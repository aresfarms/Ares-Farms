import { annualLevelDebtService } from "@/lib/property/calculationMath";
import {
  projectEnterpriseEconomics,
  type EnterpriseProjection,
  type ExpenseCategory,
} from "@/lib/intelligence/enterpriseProjection";
import {
  MINIMUM_COMPARISON_CONFIDENCE,
  type ComparableEnterpriseCandidate,
  type ConstraintStatus,
  type EconomicEvidenceStatus,
} from "@/lib/intelligence/propertyComparisonRanking";
import type { ScenarioCandidateRole } from "@/lib/intelligence/scenarioRankingPlan";
import type { SourceAuthorityTier } from "@/lib/platform/authorities/source";

/**
 * Governed economic-evidence package for a property-specific enterprise.
 *
 * Authority: Vol III TECH-PROV-001; Vol III-B runtime, classification,
 * observability and replay controls; Vol V CANON-EXPL-001; FURLONG-VISION-001;
 * 2026-09-04 Property Intelligence amendment.
 *
 * A package may be complete, scenario-only, or awaiting evidence. Only complete
 * source-supported packages can become cross-property ranking candidates.
 */
export const ECONOMIC_EVIDENCE_PACKAGE_VERSION =
  "economic-evidence-package-v1.0.0" as const;

export const REQUIRED_ECONOMIC_EVIDENCE_DOMAINS = [
  "property-identity",
  "current-and-advertised-use",
  "acquisition-price",
  "physical-suitability",
  "legal-use",
  "environmental",
  "engineering",
  "market-demand",
  "competition",
  "revenue",
  "labor",
  "employee-benefits",
  "operating-costs",
  "insurance",
  "property-tax",
  "capital-costs",
  "financing",
  "grants-incentives",
  "inflation",
] as const;

export type EconomicEvidenceDomain =
  (typeof REQUIRED_ECONOMIC_EVIDENCE_DOMAINS)[number];

export type EconomicEvidenceSourceKind =
  | "official-record"
  | "regulated-filing"
  | "commercial-data"
  | "professional-analysis"
  | "vendor-quote"
  | "operator-record"
  | "customer-document";

export type EvidenceReviewStatus = "captured" | "reviewed" | "verified";
export type EvidenceUseRights = "approved" | "review-required" | "restricted";

export interface EconomicEvidenceSource {
  id: string;
  sourceId: string;
  title: string;
  authorityTier: SourceAuthorityTier;
  kind: EconomicEvidenceSourceKind;
  reference: string;
  jurisdiction: string;
  asOf: string;
  capturedAt: string;
  maxAgeDays: number;
  reviewStatus: EvidenceReviewStatus;
  useRights: EvidenceUseRights;
  contentHash: string;
  replayRef: string;
}

export type EconomicMetricBasis =
  | "source-observed"
  | "source-derived"
  | "professional-estimate"
  | "vendor-quote"
  | "operator-record"
  | "customer-assumption";

export type EconomicMetricUnit =
  | "usd"
  | "usd-per-year"
  | "percent"
  | "years"
  | "count"
  | "hours-per-week";

export interface SupportedEconomicMetric {
  value: number | null;
  unit: EconomicMetricUnit;
  basis: EconomicMetricBasis;
  sourceRefs: string[];
  confidenceScore: number;
  method: string;
}

export interface EconomicDomainFinding {
  domain: EconomicEvidenceDomain;
  status: "supported" | "not-applicable" | "missing";
  summary: string;
  sourceRefs: string[];
  confidenceScore: number;
}

export interface EconomicConstraintFinding {
  status: ConstraintStatus;
  summary: string;
  conditions: string[];
  sourceRefs: string[];
}

export interface EnterpriseEconomicEvidencePackage {
  version: typeof ECONOMIC_EVIDENCE_PACKAGE_VERSION;
  packageId: string;
  propertyId: string;
  address: string;
  generatedAt: string;
  classification: "CONFIDENTIAL";
  traceId: string;
  replayRef: string;
  candidate: {
    id: string;
    candidateRole: ScenarioCandidateRole;
    title: string;
    enterpriseComponents: string[];
  };
  findings: EconomicDomainFinding[];
  sources: EconomicEvidenceSource[];
  projectCosts: {
    askingPrice: SupportedEconomicMetric;
    proposedPurchasePrice: SupportedEconomicMetric;
    closingCosts: SupportedEconomicMetric;
    conversionCosts: SupportedEconomicMetric;
    equipmentCosts: SupportedEconomicMetric;
    workingCapital: SupportedEconomicMetric;
    otherProjectCosts: SupportedEconomicMetric;
  };
  operations: {
    baseAnnualRevenue: SupportedEconomicMetric;
    annualRevenueGrowthPct: SupportedEconomicMetric;
    annualExpenses: Record<ExpenseCategory, SupportedEconomicMetric>;
    annualExpenseInflationPct: Record<ExpenseCategory, SupportedEconomicMetric>;
    periodicCapitalCosts: Array<{
      year: number;
      label: string;
      amount: SupportedEconomicMetric;
    }>;
  };
  labor: {
    fullTimeEquivalentEmployees: SupportedEconomicMetric;
    ownerHoursPerWeek: SupportedEconomicMetric;
    ownerLaborTreatment:
      | "included-in-payroll"
      | "included-in-professional-fees"
      | "uncompensated-owner-labor";
    sourceRefs: string[];
  };
  financing: {
    programFamily: string;
    loanAmount: SupportedEconomicMetric;
    cashContribution: SupportedEconomicMetric;
    annualRatePct: SupportedEconomicMetric;
    amortizationYears: SupportedEconomicMetric;
    termYears: SupportedEconomicMetric;
    sourceRefs: string[];
    otherCapitalSources: Array<{
      label: string;
      status: "identified" | "conditional" | "verified";
      amount: SupportedEconomicMetric;
      sourceRefs: string[];
    }>;
  };
  constraints: {
    environmental: EconomicConstraintFinding;
    zoning: EconomicConstraintFinding;
    engineering: EconomicConstraintFinding;
    market: EconomicConstraintFinding;
  };
  controls: {
    employeeBenefitsExcludeHealthInsuranceAndRetirement: true;
    maintenanceExcludesReplacementReserve: true;
    periodicCapitalCostsExcludeAnnualReplacementReserve: true;
    enterpriseComponentDoubleCountingReviewPassed: true;
  };
  professionalReview: {
    status: "unreviewed" | "reviewed" | "verified";
    reviewerRole: string | null;
    reviewedAt: string | null;
    note: string | null;
  };
}

export interface EconomicEvidencePackageAssessment {
  version: typeof ECONOMIC_EVIDENCE_PACKAGE_VERSION;
  status: "complete" | "scenario-only" | "needs-evidence";
  evidenceStatus: EconomicEvidenceStatus;
  confidenceScore: number;
  sourceRefs: string[];
  missingEvidence: string[];
  warnings: string[];
  totalProjectCost: number | null;
  annualDebtService: number | null;
  dscr: number | null;
  projection: EnterpriseProjection;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "payroll",
  "employeeBenefits",
  "healthInsurance",
  "retirement",
  "utilities",
  "insurance",
  "propertyTax",
  "maintenance",
  "replacementReserve",
  "marketing",
  "materials",
  "professionalFees",
  "other",
];

type AssessmentCollector = {
  missing: Set<string>;
  warnings: Set<string>;
  sourceRefs: Set<string>;
  confidences: number[];
  assumptions: Set<string>;
};

const nonblank = (value: unknown): value is string =>
  typeof value === "string" && Boolean(value.trim());

const parseIso = (value: unknown): number | null => {
  if (!nonblank(value)) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function addRefs(
  collector: AssessmentCollector,
  refs: unknown,
  label: string,
  assumptionAllowed = false,
) {
  if (!Array.isArray(refs) || refs.some((ref) => !nonblank(ref))) {
    collector.missing.add(label + " has malformed source references.");
    return;
  }
  if (!refs.length && !assumptionAllowed) {
    collector.missing.add(label + " requires at least one evidence source.");
  }
  for (const ref of refs) collector.sourceRefs.add(ref);
}

function inspectMetric(
  collector: AssessmentCollector,
  metric: SupportedEconomicMetric | undefined,
  label: string,
  unit: EconomicMetricUnit,
  options: { min?: number; max?: number; integer?: boolean } = {},
) {
  if (!metric || metric.value == null || !Number.isFinite(metric.value)) {
    collector.missing.add(label + " is missing.");
    return;
  }
  if (metric.unit !== unit) {
    collector.missing.add(label + " must use " + unit + ".");
  }
  if (options.min != null && metric.value < options.min) {
    collector.missing.add(label + " is below the allowed minimum.");
  }
  if (options.max != null && metric.value > options.max) {
    collector.missing.add(label + " exceeds the allowed maximum.");
  }
  if (options.integer && !Number.isInteger(metric.value)) {
    collector.missing.add(label + " must be a whole number.");
  }
  if (!Number.isFinite(metric.confidenceScore) ||
      metric.confidenceScore < 0 || metric.confidenceScore > 100) {
    collector.missing.add(label + " requires confidence from 0 to 100.");
  } else {
    collector.confidences.push(metric.confidenceScore);
  }
  if (!nonblank(metric.method)) {
    collector.missing.add(label + " requires a method or basis note.");
  }
  const assumption = metric.basis === "customer-assumption";
  if (assumption) collector.assumptions.add(label);
  addRefs(collector, metric.sourceRefs, label, assumption);
}

function validatePackageIdentity(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  if (input.version !== ECONOMIC_EVIDENCE_PACKAGE_VERSION) {
    collector.missing.add("The economic evidence package version is unsupported.");
  }
  for (const [label, value] of [
    ["package ID", input.packageId],
    ["property ID", input.propertyId],
    ["property address", input.address],
    ["trace ID", input.traceId],
    ["replay reference", input.replayRef],
    ["candidate ID", input.candidate?.id],
    ["candidate title", input.candidate?.title],
  ] as const) {
    if (!nonblank(value)) collector.missing.add("A " + label + " is required.");
  }
  if (input.classification !== "CONFIDENTIAL") {
    collector.missing.add("The economic evidence package must be classified CONFIDENTIAL.");
  }
  if (parseIso(input.generatedAt) == null) {
    collector.missing.add("A valid package generation timestamp is required.");
  }
  const components = input.candidate?.enterpriseComponents ?? [];
  if (!components.length || components.some((item) => !nonblank(item))) {
    collector.missing.add("At least one named enterprise component is required.");
  }
  if (new Set(components.map((item) => item.trim().toLowerCase())).size !== components.length) {
    collector.missing.add("Enterprise components must be unique.");
  }
  if (input.candidate?.candidateRole === "best-single-enterprise" &&
      components.length !== 1) {
    collector.missing.add("The best single enterprise package must contain exactly one enterprise component.");
  }
  if (input.candidate?.candidateRole === "best-mixed-use" &&
      components.length < 2) {
    collector.missing.add("The best mixed-use package must contain at least two enterprise components.");
  }
}

function inspectFindings(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  for (const domain of REQUIRED_ECONOMIC_EVIDENCE_DOMAINS) {
    const matches = input.findings.filter((finding) => finding.domain === domain);
    if (matches.length !== 1) {
      collector.missing.add("Exactly one " + domain + " evidence finding is required.");
      continue;
    }
    const finding = matches[0];
    if (!nonblank(finding.summary)) {
      collector.missing.add(domain + " evidence requires a summary.");
    }
    if (!Number.isFinite(finding.confidenceScore) ||
        finding.confidenceScore < 0 || finding.confidenceScore > 100) {
      collector.missing.add(domain + " evidence requires confidence from 0 to 100.");
    } else {
      collector.confidences.push(finding.confidenceScore);
    }
    if (finding.status === "missing") {
      collector.missing.add(domain + " evidence is missing.");
    } else {
      addRefs(collector, finding.sourceRefs, domain + " evidence");
    }
  }
  const duplicateDomains = input.findings
    .map((finding) => finding.domain)
    .filter((domain, index, values) => values.indexOf(domain) !== index);
  if (duplicateDomains.length) {
    collector.missing.add("Duplicate evidence domains are not allowed.");
  }
}

function inspectProjectAndOperatingMetrics(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  for (const [label, metric] of Object.entries(input.projectCosts)) {
    inspectMetric(collector, metric, label, "usd", { min: 0 });
  }
  inspectMetric(
    collector,
    input.operations.baseAnnualRevenue,
    "base annual revenue",
    "usd-per-year",
    { min: 0 },
  );
  inspectMetric(
    collector,
    input.operations.annualRevenueGrowthPct,
    "annual revenue growth",
    "percent",
    { min: -50, max: 100 },
  );
  for (const category of EXPENSE_CATEGORIES) {
    inspectMetric(
      collector,
      input.operations.annualExpenses?.[category],
      category + " annual expense",
      "usd-per-year",
      { min: 0 },
    );
    inspectMetric(
      collector,
      input.operations.annualExpenseInflationPct?.[category],
      category + " annual inflation",
      "percent",
      { min: -50, max: 100 },
    );
  }
  for (const [index, cost] of input.operations.periodicCapitalCosts.entries()) {
    if (!Number.isInteger(cost.year) || cost.year < 1 || cost.year > 30) {
      collector.missing.add("Periodic capital cost " + (index + 1) + " requires a year from 1 to 30.");
    }
    if (!nonblank(cost.label)) {
      collector.missing.add("Periodic capital cost " + (index + 1) + " requires a label.");
    }
    inspectMetric(
      collector,
      cost.amount,
      "periodic capital cost " + (index + 1),
      "usd",
      { min: 0 },
    );
  }
}

function inspectLaborAndFinancing(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  inspectMetric(
    collector,
    input.labor.fullTimeEquivalentEmployees,
    "full-time-equivalent employees",
    "count",
    { min: 0 },
  );
  inspectMetric(
    collector,
    input.labor.ownerHoursPerWeek,
    "owner hours per week",
    "hours-per-week",
    { min: 0, max: 168 },
  );
  addRefs(collector, input.labor.sourceRefs, "labor model");

  if (!nonblank(input.financing.programFamily)) {
    collector.missing.add("A financing program family is required.");
  }
  inspectMetric(collector, input.financing.loanAmount, "loan amount", "usd", { min: 0 });
  inspectMetric(
    collector,
    input.financing.cashContribution,
    "project-side cash contribution assumption",
    "usd",
    { min: 0 },
  );
  inspectMetric(
    collector,
    input.financing.annualRatePct,
    "annual interest rate",
    "percent",
    { min: 0, max: 100 },
  );
  inspectMetric(
    collector,
    input.financing.amortizationYears,
    "amortization years",
    "years",
    { min: 1, max: 100, integer: true },
  );
  inspectMetric(
    collector,
    input.financing.termYears,
    "loan term years",
    "years",
    { min: 1, max: 30, integer: true },
  );
  addRefs(collector, input.financing.sourceRefs, "financing pathway");
  for (const [index, source] of input.financing.otherCapitalSources.entries()) {
    if (!nonblank(source.label)) {
      collector.missing.add("Other capital source " + (index + 1) + " requires a label.");
    }
    inspectMetric(
      collector,
      source.amount,
      "other capital source " + (index + 1),
      "usd",
      { min: 0 },
    );
    addRefs(
      collector,
      source.sourceRefs,
      "other capital source " + (index + 1),
    );
  }
}

function inspectConstraintsAndControls(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  for (const [kind, finding] of Object.entries(input.constraints)) {
    if (!["clear", "conditioned", "unknown", "blocked"].includes(finding.status)) {
      collector.missing.add(kind + " constraint status is invalid.");
    }
    if (!nonblank(finding.summary)) {
      collector.missing.add(kind + " constraint requires a summary.");
    }
    addRefs(collector, finding.sourceRefs, kind + " constraint");
    if (finding.status === "unknown") {
      collector.missing.add(kind + " feasibility remains unresolved.");
    }
    if (finding.status === "conditioned" && !finding.conditions.length) {
      collector.missing.add(kind + " conditioned feasibility requires explicit conditions.");
    }
  }
  if (input.controls.employeeBenefitsExcludeHealthInsuranceAndRetirement !== true ||
      input.controls.maintenanceExcludesReplacementReserve !== true ||
      input.controls.periodicCapitalCostsExcludeAnnualReplacementReserve !== true ||
      input.controls.enterpriseComponentDoubleCountingReviewPassed !== true) {
    collector.missing.add("Cost and enterprise double-counting controls must pass before reliance.");
  }
}

function inspectReferencedSources(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
) {
  const generatedAt = parseIso(input.generatedAt);
  const sourceMap = new Map<string, EconomicEvidenceSource>();
  for (const source of input.sources) {
    if (!nonblank(source.id)) {
      collector.missing.add("Every evidence source requires an ID.");
      continue;
    }
    if (sourceMap.has(source.id)) {
      collector.missing.add("Evidence source IDs must be unique.");
      continue;
    }
    sourceMap.set(source.id, source);
  }
  for (const ref of collector.sourceRefs) {
    const source = sourceMap.get(ref);
    if (!source) {
      collector.missing.add("Evidence source " + ref + " is not included in the package.");
      continue;
    }
    for (const [label, value] of [
      ["source ID", source.sourceId],
      ["title", source.title],
      ["reference", source.reference],
      ["jurisdiction", source.jurisdiction],
      ["replay reference", source.replayRef],
    ] as const) {
      if (!nonblank(value)) {
        collector.missing.add("Evidence source " + ref + " requires a " + label + ".");
      }
    }
    if (!/^sha256:[a-f0-9]{64}$/i.test(source.contentHash)) {
      collector.missing.add("Evidence source " + ref + " requires a SHA-256 content hash.");
    }
    const asOf = parseIso(source.asOf);
    const capturedAt = parseIso(source.capturedAt);
    if (asOf == null || capturedAt == null) {
      collector.missing.add("Evidence source " + ref + " requires valid as-of and capture timestamps.");
    }
    if (!Number.isInteger(source.maxAgeDays) ||
        source.maxAgeDays < 1 || source.maxAgeDays > 3650) {
      collector.missing.add("Evidence source " + ref + " requires a valid freshness window.");
    }
    if (source.reviewStatus === "captured") {
      collector.missing.add("Evidence source " + ref + " has not been reviewed.");
    }
    if (source.useRights !== "approved") {
      collector.missing.add("Evidence source " + ref + " is not approved for this use.");
    }
    if (generatedAt != null && asOf != null) {
      const ageDays = Math.floor((generatedAt - asOf) / 86_400_000);
      if (ageDays > source.maxAgeDays) {
        collector.missing.add("Evidence source " + ref + " is stale.");
      }
      if (ageDays < -1) {
        collector.missing.add("Evidence source " + ref + " has a future as-of date.");
      }
    }
  }
  for (const source of input.sources) {
    if (nonblank(source.id) && !collector.sourceRefs.has(source.id)) {
      collector.warnings.add("Unused evidence source " + source.id + " is retained but does not support this candidate.");
    }
  }
}

function metricValue(metric: SupportedEconomicMetric): number | null {
  return metric.value != null && Number.isFinite(metric.value)
    ? metric.value
    : null;
}

function totalProjectCost(
  input: EnterpriseEconomicEvidencePackage,
): number | null {
  const metrics = [
    input.projectCosts.proposedPurchasePrice,
    input.projectCosts.closingCosts,
    input.projectCosts.conversionCosts,
    input.projectCosts.equipmentCosts,
    input.projectCosts.workingCapital,
    input.projectCosts.otherProjectCosts,
  ];
  const values = metrics.map(metricValue);
  return values.every((value): value is number => value != null)
    ? values.reduce((total, value) => total + value, 0)
    : null;
}

function projectionInput(
  input: EnterpriseEconomicEvidencePackage,
  annualDebtService: number | null,
) {
  return {
    baseAnnualRevenue: metricValue(input.operations.baseAnnualRevenue) ?? Number.NaN,
    annualExpenses: Object.fromEntries(
      EXPENSE_CATEGORIES.map((category) => [
        category,
        metricValue(input.operations.annualExpenses[category]) ?? Number.NaN,
      ]),
    ) as Record<ExpenseCategory, number>,
    annualExpenseInflationPct: Object.fromEntries(
      EXPENSE_CATEGORIES.map((category) => [
        category,
        metricValue(input.operations.annualExpenseInflationPct[category]) ?? Number.NaN,
      ]),
    ) as Record<ExpenseCategory, number>,
    annualRevenueGrowthPct:
      metricValue(input.operations.annualRevenueGrowthPct) ?? Number.NaN,
    annualDebtService: annualDebtService ?? Number.NaN,
    debtTermYears: metricValue(input.financing.termYears) ?? Number.NaN,
    periodicCapitalCosts: input.operations.periodicCapitalCosts.map((cost) => ({
      year: cost.year,
      label: cost.label,
      amount: metricValue(cost.amount) ?? Number.NaN,
    })),
  };
}

function evidenceStatusFor(
  input: EnterpriseEconomicEvidencePackage,
  collector: AssessmentCollector,
): EconomicEvidenceStatus {
  if (collector.missing.size) return "needs-evidence";
  if (collector.assumptions.size) return "scenario-only";
  const operatingSourceRefs = new Set([
    ...input.operations.baseAnnualRevenue.sourceRefs,
    ...EXPENSE_CATEGORIES.flatMap(
      (category) => input.operations.annualExpenses[category].sourceRefs,
    ),
  ]);
  const operatingSources = input.sources.filter((source) =>
    operatingSourceRefs.has(source.id),
  );
  const verifiedOperatingRecords =
    input.professionalReview.status === "verified" &&
    operatingSources.some((source) =>
      ["operator-record", "regulated-filing"].includes(source.kind),
    );
  return verifiedOperatingRecords
    ? "verified-operating-evidence"
    : "source-supported";
}

export function assessEnterpriseEconomicEvidencePackage(
  input: EnterpriseEconomicEvidencePackage,
): EconomicEvidencePackageAssessment {
  const collector: AssessmentCollector = {
    missing: new Set(),
    warnings: new Set(),
    sourceRefs: new Set(),
    confidences: [],
    assumptions: new Set(),
  };
  validatePackageIdentity(input, collector);
  inspectFindings(input, collector);
  inspectProjectAndOperatingMetrics(input, collector);
  inspectLaborAndFinancing(input, collector);
  inspectConstraintsAndControls(input, collector);
  inspectReferencedSources(input, collector);

  const projectCost = totalProjectCost(input);
  const loanAmount = metricValue(input.financing.loanAmount);
  const rate = metricValue(input.financing.annualRatePct);
  const amortization = metricValue(input.financing.amortizationYears);
  const annualDebtService =
    loanAmount != null && loanAmount > 0 && rate != null && amortization != null
      ? annualLevelDebtService(loanAmount, rate, amortization, 12)
      : null;
  if (loanAmount == null || loanAmount <= 0) {
    collector.missing.add("A positive property/project financing scenario is required for DSCR comparison.");
  }
  if (annualDebtService == null) {
    collector.missing.add("Annual debt service could not be calculated from the financing evidence.");
  }

  const cashContribution = metricValue(input.financing.cashContribution);
  const verifiedOtherCapital = input.financing.otherCapitalSources
    .filter((source) => source.status === "verified")
    .reduce((total, source) => total + (metricValue(source.amount) ?? 0), 0);
  if (projectCost != null && loanAmount != null && cashContribution != null) {
    const capital = loanAmount + cashContribution + verifiedOtherCapital;
    const tolerance = Math.max(1, projectCost * 0.005);
    if (Math.abs(capital - projectCost) > tolerance) {
      collector.missing.add(
        "Loan, project-side cash, and verified other capital do not balance to total project cost.",
      );
    }
  }

  const projection = projectEnterpriseEconomics(
    projectionInput(input, annualDebtService),
  );
  if (projection.status === "needs-evidence") {
    for (const item of projection.missingInputs) collector.missing.add(item);
  }
  const dscr =
    projection.status === "complete" && annualDebtService != null &&
    annualDebtService > 0
      ? projection.years[0].noi / annualDebtService
      : null;
  const confidenceScore = collector.confidences.length
    ? Math.round(Math.min(...collector.confidences))
    : 0;
  if (confidenceScore < MINIMUM_COMPARISON_CONFIDENCE) {
    collector.missing.add(
      "Package confidence is below the " +
      MINIMUM_COMPARISON_CONFIDENCE +
      "/100 comparison floor.",
    );
  }
  for (const label of collector.assumptions) {
    collector.warnings.add(label + " is a customer assumption and cannot support paid ranking.");
  }

  const evidenceStatus = evidenceStatusFor(input, collector);
  return {
    version: ECONOMIC_EVIDENCE_PACKAGE_VERSION,
    status: collector.missing.size
      ? "needs-evidence"
      : collector.assumptions.size
        ? "scenario-only"
        : "complete",
    evidenceStatus,
    confidenceScore,
    sourceRefs: [...collector.sourceRefs].sort(),
    missingEvidence: [...collector.missing].sort(),
    warnings: [...collector.warnings].sort(),
    totalProjectCost: projectCost,
    annualDebtService,
    dscr,
    projection,
  };
}

export function buildComparableCandidateFromEconomicEvidence(
  input: EnterpriseEconomicEvidencePackage,
): ComparableEnterpriseCandidate {
  const assessment = assessEnterpriseEconomicEvidencePackage(input);
  return {
    id: input.candidate.id,
    candidateRole: input.candidate.candidateRole,
    title: input.candidate.title,
    evidenceStatus: assessment.evidenceStatus,
    confidenceScore: assessment.confidenceScore,
    sourceRefs: assessment.sourceRefs,
    missingEvidence: assessment.missingEvidence,
    constraints: {
      environmental: input.constraints.environmental.status,
      zoning: input.constraints.zoning.status,
      engineering: input.constraints.engineering.status,
      market: input.constraints.market.status,
    },
    totalProjectCost: assessment.totalProjectCost,
    dscr: assessment.dscr,
    projection: assessment.projection,
  };
}

const recordValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

function metricShape(value: unknown): boolean {
  const metric = recordValue(value);
  return Boolean(
    metric &&
    (metric.value === null || typeof metric.value === "number") &&
    typeof metric.unit === "string" &&
    typeof metric.basis === "string" &&
    Array.isArray(metric.sourceRefs) &&
    typeof metric.confidenceScore === "number" &&
    typeof metric.method === "string",
  );
}

function metricRecordShape(
  value: unknown,
  keys: readonly string[],
): boolean {
  const record = recordValue(value);
  return Boolean(
    record && keys.every((key) => metricShape(record[key])),
  );
}

export function isEnterpriseEconomicEvidencePackage(
  value: unknown,
): value is EnterpriseEconomicEvidencePackage {
  const input = recordValue(value);
  if (!input ||
      input.version !== ECONOMIC_EVIDENCE_PACKAGE_VERSION ||
      typeof input.packageId !== "string" ||
      typeof input.propertyId !== "string" ||
      typeof input.address !== "string" ||
      typeof input.generatedAt !== "string" ||
      input.classification !== "CONFIDENTIAL" ||
      typeof input.traceId !== "string" ||
      typeof input.replayRef !== "string" ||
      !Array.isArray(input.findings) ||
      !Array.isArray(input.sources)) {
    return false;
  }

  const candidate = recordValue(input.candidate);
  const projectCosts = recordValue(input.projectCosts);
  const operations = recordValue(input.operations);
  const labor = recordValue(input.labor);
  const financing = recordValue(input.financing);
  const constraints = recordValue(input.constraints);
  const controls = recordValue(input.controls);
  const review = recordValue(input.professionalReview);
  if (!candidate || !projectCosts || !operations || !labor ||
      !financing || !constraints || !controls || !review) {
    return false;
  }

  const projectCostKeys = [
    "askingPrice",
    "proposedPurchasePrice",
    "closingCosts",
    "conversionCosts",
    "equipmentCosts",
    "workingCapital",
    "otherProjectCosts",
  ] as const;
  if (!metricRecordShape(projectCosts, projectCostKeys) ||
      !metricShape(operations.baseAnnualRevenue) ||
      !metricShape(operations.annualRevenueGrowthPct) ||
      !metricRecordShape(operations.annualExpenses, EXPENSE_CATEGORIES) ||
      !metricRecordShape(
        operations.annualExpenseInflationPct,
        EXPENSE_CATEGORIES,
      ) ||
      !Array.isArray(operations.periodicCapitalCosts)) {
    return false;
  }
  if (!operations.periodicCapitalCosts.every((entry) => {
    const item = recordValue(entry);
    return Boolean(
      item &&
      typeof item.year === "number" &&
      typeof item.label === "string" &&
      metricShape(item.amount),
    );
  })) {
    return false;
  }

  if (!metricShape(labor.fullTimeEquivalentEmployees) ||
      !metricShape(labor.ownerHoursPerWeek) ||
      typeof labor.ownerLaborTreatment !== "string" ||
      !Array.isArray(labor.sourceRefs)) {
    return false;
  }
  const financingMetricKeys = [
    "loanAmount",
    "cashContribution",
    "annualRatePct",
    "amortizationYears",
    "termYears",
  ] as const;
  if (!metricRecordShape(financing, financingMetricKeys) ||
      typeof financing.programFamily !== "string" ||
      !Array.isArray(financing.sourceRefs) ||
      !Array.isArray(financing.otherCapitalSources)) {
    return false;
  }
  if (!financing.otherCapitalSources.every((entry) => {
    const item = recordValue(entry);
    return Boolean(
      item &&
      typeof item.label === "string" &&
      typeof item.status === "string" &&
      metricShape(item.amount) &&
      Array.isArray(item.sourceRefs),
    );
  })) {
    return false;
  }

  const constraintKinds = [
    "environmental",
    "zoning",
    "engineering",
    "market",
  ] as const;
  if (!constraintKinds.every((kind) => {
    const finding = recordValue(constraints[kind]);
    return Boolean(
      finding &&
      typeof finding.status === "string" &&
      typeof finding.summary === "string" &&
      Array.isArray(finding.conditions) &&
      Array.isArray(finding.sourceRefs),
    );
  })) {
    return false;
  }

  return typeof candidate.id === "string" &&
    typeof candidate.candidateRole === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.enterpriseComponents) &&
    input.findings.every((finding) => Boolean(recordValue(finding))) &&
    input.sources.every((source) => Boolean(recordValue(source))) &&
    typeof review.status === "string" &&
    (review.reviewerRole === null || typeof review.reviewerRole === "string") &&
    (review.reviewedAt === null || typeof review.reviewedAt === "string") &&
    (review.note === null || typeof review.note === "string");
}
