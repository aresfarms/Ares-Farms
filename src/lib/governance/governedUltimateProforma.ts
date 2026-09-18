import { createHash } from "node:crypto";

import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import {
  buildUltimateProformaDocument,
  evaluateGenerationGate,
  type UltimateProformaInput,
} from "@/lib/pdf/ultimateProformaTemplate";
import type { LoanProformaInput } from "@/lib/pdf/generateLoanProformaPdf";

export const GOVERNED_ULTIMATE_PROFORMA_RULE =
  "GOVERNED-ULTIMATE-PROFORMA-001" as const;

export type ProformaEvidenceKind =
  | "OFFICIAL_SOURCE"
  | "THIRD_PARTY_VERIFIED"
  | "BORROWER_ATTESTED"
  | "CALCULATED"
  | "ASSUMPTION";

export type ProformaEvidenceItem = Readonly<{
  claimId: string;
  kind: ProformaEvidenceKind;
  sourceRef: string;
  asOf: string;
  description: string;
}>;

export type GovernedUltimateProformaInput = Readonly<{
  proforma: UltimateProformaInput;
  evidence: readonly ProformaEvidenceItem[];
  humanReviewerId: string;
  generatedAt: string;
}>;

export type GovernedUltimateProformaPacket = Readonly<{
  rule: typeof GOVERNED_ULTIMATE_PROFORMA_RULE;
  status: "READY_FOR_INTERNAL_REVIEW" | "BLOCKED";
  blockers: readonly string[];
  warnings: readonly string[];
  document: LoanProformaInput | null;
  evidenceManifestSha256: string;
  documentModelSha256: string | null;
  calculationSnapshotSha256: string;
  claimsPolicyVersion: string;
  humanReviewRequired: true;
  officialUseAllowed: false;
  externalDeliveryAllowed: false;
  packetSha256: string;
}>;

const REQUIRED_EVIDENCE = [
  "identity.goodStanding",
  "identity.ownership",
  "sourcesUses",
  "collateral",
  "guarantorPfs",
  "balanceSheet",
  "revenue",
  "workingCapital",
  "debtService",
  "yearModel",
  "laneAuthority",
] as const;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function money(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "—") return null;
  const negative = /^\(.*\)$/.test(trimmed) || /^-/.test(trimmed);
  const normalized = trimmed.replace(/[\$,%x()\s]/g, "").replace(/,/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

function ratio(value: string): number | null {
  return money(value);
}

function nearly(a: number, b: number, tolerance = 1): boolean {
  return Math.abs(a - b) <= tolerance;
}

function percentNearly(a: number, b: number, tolerance = 0.6): boolean {
  return Math.abs(a - b) <= tolerance;
}

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((child) => strings(child, out));
  else if (value && typeof value === "object")
    Object.values(value as Record<string, unknown>).forEach((child) => strings(child, out));
  return out;
}

function fullSensitiveIdentifier(text: string): boolean {
  return (
    /\b\d{3}-\d{2}-\d{4}\b/.test(text) ||
    /\b\d{2}-\d{7}\b/.test(text) ||
    /\b(?:SSN|TIN|EIN)\s*[:#-]?\s*\d{8,9}\b/i.test(text) ||
    /\b(?:routing|account)\s*(?:number|#)?\s*[:#-]?\s*\d{8,17}\b/i.test(text)
  );
}

function sumValues(values: string[], label: string, blockers: string[]): number | null {
  const parsed = values.map(money);
  if (parsed.some((value) => value === null)) {
    blockers.push(`${label}_UNPARSABLE`);
    return null;
  }
  return (parsed as number[]).reduce((total, value) => total + value, 0);
}

function validateCalculations(input: UltimateProformaInput): {
  blockers: string[];
  warnings: string[];
  snapshot: Record<string, unknown>;
} {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const p = input.partI;
  const tc = input.partIV.twoCase;

  const useSum = sumValues(p.sourcesAndUses.rows.map((row) => row.amount), "SOURCES_USES", blockers);
  const totalProjectCost = money(p.sourcesAndUses.totalProjectCost);
  if (useSum !== null && totalProjectCost !== null && !nearly(useSum, totalProjectCost))
    blockers.push("TOTAL_PROJECT_COST_MISMATCH");

  const collateralStated = sumValues(p.collateral.rows.map((row) => row.stated), "COLLATERAL_STATED", blockers);
  const collateralDiscounted = sumValues(p.collateral.rows.map((row) => row.discounted), "COLLATERAL_DISCOUNTED", blockers);
  const statedTotal = money(p.collateral.statedTotal);
  const discountedTotal = money(p.collateral.discountedTotal);
  const loanAmount = money(p.sourcesAndUses.loanAmount);
  const coveragePct = money(p.collateral.coveragePct);
  if (collateralStated !== null && statedTotal !== null && !nearly(collateralStated, statedTotal))
    blockers.push("COLLATERAL_STATED_TOTAL_MISMATCH");
  if (collateralDiscounted !== null && discountedTotal !== null && !nearly(collateralDiscounted, discountedTotal))
    blockers.push("COLLATERAL_DISCOUNTED_TOTAL_MISMATCH");
  if (discountedTotal !== null && loanAmount && coveragePct !== null) {
    const computed = (discountedTotal / loanAmount) * 100;
    if (!percentNearly(computed, coveragePct)) blockers.push("COLLATERAL_COVERAGE_MISMATCH");
  }

  const assetTotal = sumValues(p.guarantorPfs.assets.map((row) => row.value), "PFS_ASSETS", blockers);
  const liabilityRows = p.guarantorPfs.liabilitiesAndIncome.filter(
    (row) => !/income|wage|salary|consulting|distribution|rent/i.test(row.label),
  );
  const incomeRows = p.guarantorPfs.liabilitiesAndIncome.filter(
    (row) => /income|wage|salary|consulting|distribution|rent/i.test(row.label),
  );
  const liabilityTotal = sumValues(liabilityRows.map((row) => row.value), "PFS_LIABILITIES", blockers);
  const incomeTotal = sumValues(incomeRows.map((row) => row.value), "PFS_INCOME", blockers);
  const declaredAssets = money(p.guarantorPfs.totalAssets);
  const declaredLiabilities = money(p.guarantorPfs.totalLiabilities);
  const declaredNetWorth = money(p.guarantorPfs.netWorth);
  const declaredIncome = money(p.guarantorPfs.totalAnnualIncome);
  if (assetTotal !== null && declaredAssets !== null && !nearly(assetTotal, declaredAssets)) blockers.push("PFS_ASSET_TOTAL_MISMATCH");
  if (liabilityTotal !== null && declaredLiabilities !== null && !nearly(liabilityTotal, declaredLiabilities)) blockers.push("PFS_LIABILITY_TOTAL_MISMATCH");
  if (declaredAssets !== null && declaredLiabilities !== null && declaredNetWorth !== null && !nearly(declaredAssets - declaredLiabilities, declaredNetWorth))
    blockers.push("PFS_NET_WORTH_MISMATCH");
  if (incomeTotal !== null && declaredIncome !== null && !nearly(incomeTotal, declaredIncome)) blockers.push("PFS_INCOME_TOTAL_MISMATCH");

  const revenueConservative = p.revenueUnits.map((unit) => {
    const subtotal = sumValues(unit.lines.map((line) => line.conservative), `REVENUE_${unit.unitName}_CONSERVATIVE`, blockers);
    const declared = money(unit.subtotalConservative);
    if (subtotal !== null && declared !== null && !nearly(subtotal, declared)) blockers.push(`REVENUE_SUBTOTAL_MISMATCH:${unit.unitName}:CONSERVATIVE`);
    return declared;
  });
  const revenueStabilized = p.revenueUnits.map((unit) => {
    const subtotal = sumValues(unit.lines.map((line) => line.stabilized), `REVENUE_${unit.unitName}_STABILIZED`, blockers);
    const declared = money(unit.subtotalStabilized);
    if (subtotal !== null && declared !== null && !nearly(subtotal, declared)) blockers.push(`REVENUE_SUBTOTAL_MISMATCH:${unit.unitName}:STABILIZED`);
    return declared;
  });
  const revenueTotalConservative = revenueConservative.every((value) => value !== null)
    ? (revenueConservative as number[]).reduce((a, b) => a + b, 0)
    : null;
  const revenueTotalStabilized = revenueStabilized.every((value) => value !== null)
    ? (revenueStabilized as number[]).reduce((a, b) => a + b, 0)
    : null;
  const declaredRevenueConservative = money(tc.revenue.conservative);
  const declaredRevenueStabilized = money(tc.revenue.stabilized);
  if (revenueTotalConservative !== null && declaredRevenueConservative !== null && !nearly(revenueTotalConservative, declaredRevenueConservative))
    blockers.push("PART_IV_REVENUE_CONSERVATIVE_MISMATCH");
  if (revenueTotalStabilized !== null && declaredRevenueStabilized !== null && !nearly(revenueTotalStabilized, declaredRevenueStabilized))
    blockers.push("PART_IV_REVENUE_STABILIZED_MISMATCH");

  const opexConservative = Math.abs(money(tc.opex.conservative) ?? Number.NaN);
  const opexStabilized = Math.abs(money(tc.opex.stabilized) ?? Number.NaN);
  const noiConservative = money(tc.noi.conservative);
  const noiStabilized = money(tc.noi.stabilized);
  if (declaredRevenueConservative !== null && Number.isFinite(opexConservative) && noiConservative !== null && !nearly(declaredRevenueConservative - opexConservative, noiConservative))
    blockers.push("NOI_CONSERVATIVE_MISMATCH");
  if (declaredRevenueStabilized !== null && Number.isFinite(opexStabilized) && noiStabilized !== null && !nearly(declaredRevenueStabilized - opexStabilized, noiStabilized))
    blockers.push("NOI_STABILIZED_MISMATCH");

  const debtService = money(tc.debtService);
  const dscrConservative = ratio(tc.dscrStandalone.conservative);
  const dscrStabilized = ratio(tc.dscrStandalone.stabilized);
  if (noiConservative !== null && debtService && dscrConservative !== null && !nearly(noiConservative / debtService, dscrConservative, 0.015))
    blockers.push("DSCR_CONSERVATIVE_MISMATCH");
  if (noiStabilized !== null && debtService && dscrStabilized !== null && !nearly(noiStabilized / debtService, dscrStabilized, 0.015))
    blockers.push("DSCR_STABILIZED_MISMATCH");

  const marginConservative = money(tc.margins.conservative);
  const marginStabilized = money(tc.margins.stabilized);
  if (noiConservative !== null && declaredRevenueConservative && marginConservative !== null && !percentNearly((noiConservative / declaredRevenueConservative) * 100, marginConservative, 1))
    blockers.push("MARGIN_CONSERVATIVE_MISMATCH");
  if (noiStabilized !== null && declaredRevenueStabilized && marginStabilized !== null && !percentNearly((noiStabilized / declaredRevenueStabilized) * 100, marginStabilized, 1))
    blockers.push("MARGIN_STABILIZED_MISMATCH");

  const workingCapitalSum = sumValues(p.workingCapital.rows.map((row) => row.amount), "WORKING_CAPITAL", blockers);
  const workingCapitalTotal = money(p.workingCapital.total);
  if (workingCapitalSum !== null && workingCapitalTotal !== null && !nearly(workingCapitalSum, workingCapitalTotal))
    blockers.push("WORKING_CAPITAL_TOTAL_MISMATCH");

  for (const row of input.partIV.yearModel.rows) {
    if (row.values.length !== input.partIV.yearModel.yearLabels.length)
      blockers.push(`YEAR_MODEL_LENGTH_MISMATCH:${row.family}:${row.label}`);
  }

  if (/sba\s+(?:minimum|floor|required)|guaranteed approval|eligible for funding/i.test(strings(input).join(" ")))
    blockers.push("PROHIBITED_PROGRAM_OR_APPROVAL_OVERCLAIM");

  const generationDate = Date.parse(input.manifest.generationDate);
  const reviewedAt = Date.parse(input.authority.reviewedAt);
  if (!Number.isFinite(generationDate) || !Number.isFinite(reviewedAt)) blockers.push("PROGRAM_AUTHORITY_DATE_INVALID");
  else if (Math.abs(generationDate - reviewedAt) > 90 * 24 * 60 * 60 * 1000) blockers.push("PROGRAM_AUTHORITY_REVIEW_STALE");
  if (input.authority.officialSourceRefs.length === 0) blockers.push("OFFICIAL_PROGRAM_SOURCE_REQUIRED");
  for (const ref of input.authority.officialSourceRefs) {
    const boundHash = input.authority.reviewedContentHashes[ref];
    if (!boundHash || !/^[a-f0-9]{64}$/.test(boundHash)) blockers.push(`PROGRAM_AUTHORITY_HASH_REQUIRED:${ref}`);
  }
  if (!input.authority.formVersion.trim()) blockers.push("PROGRAM_FORM_VERSION_REQUIRED");
  if (!input.authority.coverageThresholdBasis.trim()) blockers.push("COVERAGE_THRESHOLD_BASIS_REQUIRED");

  if (p.upside.items.some((item) => !/excluded|not relied|never enters/i.test(item.basisAndExclusion)))
    warnings.push("UPSIDE_EXCLUSION_LANGUAGE_WEAK");

  return {
    blockers,
    warnings,
    snapshot: {
      useSum,
      totalProjectCost,
      collateralStated,
      collateralDiscounted,
      statedTotal,
      discountedTotal,
      coveragePct,
      assetTotal,
      liabilityTotal,
      incomeTotal,
      revenueTotalConservative,
      revenueTotalStabilized,
      noiConservative,
      noiStabilized,
      debtService,
      dscrConservative,
      dscrStabilized,
      workingCapitalSum,
      workingCapitalTotal,
    },
  };
}

export function composeGovernedUltimateProforma(
  input: GovernedUltimateProformaInput,
): GovernedUltimateProformaPacket {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.humanReviewerId.trim()) blockers.push("ATTRIBUTED_HUMAN_REVIEWER_REQUIRED");
  if (!Number.isFinite(Date.parse(input.generatedAt))) blockers.push("GENERATED_AT_INVALID");
  const generationFailures = evaluateGenerationGate(input.proforma);
  blockers.push(...generationFailures.map((failure) => `GENERATION_GATE:${failure.id}:${failure.item}`));

  const evidenceById = new Map(input.evidence.map((item) => [item.claimId, item]));
  for (const claimId of REQUIRED_EVIDENCE) {
    const item = evidenceById.get(claimId);
    if (!item) blockers.push(`EVIDENCE_REQUIRED:${claimId}`);
    else if (!item.sourceRef.trim() || !item.description.trim() || !Number.isFinite(Date.parse(item.asOf)))
      blockers.push(`EVIDENCE_INVALID:${claimId}`);
  }
  const laneEvidence = evidenceById.get("laneAuthority");
  if (laneEvidence && laneEvidence.kind !== "OFFICIAL_SOURCE") blockers.push("LANE_AUTHORITY_MUST_BE_OFFICIAL_SOURCE");

  const allText = strings(input.proforma).join("\n");
  if (fullSensitiveIdentifier(allText)) blockers.push("FULL_SENSITIVE_IDENTIFIER_PROHIBITED_IN_PDF");

  const calculations = validateCalculations(input.proforma);
  blockers.push(...calculations.blockers);
  warnings.push(...calculations.warnings);

  let document: LoanProformaInput | null = null;
  if (blockers.length === 0) document = buildUltimateProformaDocument(input.proforma);

  const claims = evaluateContentClaims({
    text: document ? strings(document) : strings(input.proforma),
    context: {
      officialDecisionAuthority: false,
      publicVerificationGatewayOperational: false,
      canonicalHashVerificationOperational: false,
      lenderReadyDisclosurePresent: false,
    },
  });
  if (!claims.ok) blockers.push(...claims.findings.filter((finding) => finding.severity === "BLOCK").map((finding) => `CONTENT_CLAIM:${finding.code}`));
  warnings.push(...claims.findings.filter((finding) => finding.severity === "REVIEW").map((finding) => `CONTENT_REVIEW:${finding.code}`));

  if (blockers.length > 0) document = null;
  const evidenceManifestSha256 = sha(input.evidence);
  const documentModelSha256 = document ? sha(document) : null;
  const calculationSnapshotSha256 = sha(calculations.snapshot);
  const core = {
    rule: GOVERNED_ULTIMATE_PROFORMA_RULE,
    status: (blockers.length === 0 ? "READY_FOR_INTERNAL_REVIEW" : "BLOCKED") as
      | "READY_FOR_INTERNAL_REVIEW"
      | "BLOCKED",
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    document,
    evidenceManifestSha256,
    documentModelSha256,
    calculationSnapshotSha256,
    claimsPolicyVersion: claims.policyVersion,
    humanReviewRequired: true as const,
    officialUseAllowed: false as const,
    externalDeliveryAllowed: false as const,
  };
  return { ...core, packetSha256: sha(core) };
}
