import { createHash } from "node:crypto";

import type { PropertyFactsSnapshot } from "@/lib/property/propertyFactsService";
import { classifyPropertyProfile } from "@/lib/property/propertyProfile";
import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";
import { compilePropertyComparisonEconomicAnalysis } from "@/lib/intelligence/propertyComparisonEconomicAnalysis";
import { supportedReportChoices } from "@/lib/intelligence/storedEconomicEvidence";
import type { EnterpriseEconomicEvidencePackage } from "@/lib/intelligence/economicEvidencePackage";
import { buildMarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import { buildPreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import { generatePropertyEvaluationPdf } from "@/lib/pdf/generatePropertyEvaluationPdf";
import { buildReportBranding } from "@/lib/reports/reportBranding";
import { reportPolicy } from "@/lib/reports/reportPolicy";

export const AUTOMATED_PROPERTY_REPORT_VERSION = "automated-property-report-v1.0.0";
export const MAX_AUTOMATED_REPORT_BYTES = 25 * 1024 * 1024;
export class AutomatedReportNotReadyError extends Error {
  constructor(readonly reasons: string[]) {
    super("The report is not ready for purchase: " + reasons.join(" "));
    this.name = "AutomatedReportNotReadyError";
  }
}
export function reportSnapshotDigest(value: unknown): string {
  // JSONB may reorder keys. Canonicalize JSON-compatible values so the stored
  // source/model can be verified after a database round trip.
  const canonical = (item: unknown): string => {
    if (item === null || typeof item !== "object") return JSON.stringify(item);
    if (Array.isArray(item)) return `[${item.map(canonical).join(",")}]`;
    const object = item as Record<string, unknown>;
    return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
  };
  return createHash("sha256").update(canonical(JSON.parse(JSON.stringify(value)))).digest("hex");
}
// Full replay references remain in the immutable evidence snapshot. The PDF
// shows the source and date without long internal identifiers crowding its text.
const sourceLabel = (value: string | null | undefined) =>
  value?.replace(/; replay [^;]+/g, "").trim() || "Source not published";
const money = (n: number | null) => n === null ? "Not established" :
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Material claims come only from the server's evidence resolver. Missing
 * information remains missing; a county assessment is never a current price.
 * This is an automated screen. Template scores are not acquisition advice.
 */
export function buildAutomatedPropertyReport(input: {
  facts: PropertyFactsSnapshot;
  requestedAddress: string;
  customerVision: string | null;
  generatedAt: Date;
  selectedReportCandidateId?: string | null;
  economicEvidence?: { propertyId: string; comparisonItemId: string; packages: EnterpriseEconomicEvidencePackage[] } | null;
}) {
  const { facts } = input;
  if (!facts.ok || !("verification" in facts) || !facts.verification ||
      !facts.propertyRecord || !("recordBasis" in facts.propertyRecord) || !facts.placeIntelligence) {
    throw new AutomatedReportNotReadyError(["Verified property evidence is unavailable."]);
  }
  const property = facts.propertyRecord;
  const brief = facts.placeIntelligence;
  const verification = facts.verification;
  const reasons: string[] = [];
  if (!["verified", "partial"].includes(verification.status) || !verification.normalizedAddress) {
    reasons.push("The exact property identity has not been verified.");
  }
  // Fail closed on a conflicting propertyId/address pair. Do not silently sell
  // a report about the canonical ID when the customer selected another address.
  if (normalizedListingAddress(verification.normalizedAddress ?? "") !==
      normalizedListingAddress(input.requestedAddress)) {
    reasons.push("The verified address differs from the selected property. Confirm its full address first.");
  }
  if (property.recordBasis === "verified-address-only" || !property.parcelRefs?.length) {
    reasons.push("A matching parcel or approved property record is required; an address-only screen is free.");
  }
  if (!property.propertyType || !brief.verifiedFacts.some(f => f.provenance?.trim())) {
    reasons.push("Property classification and attributable evidence are required.");
  }
  if (verification.restrictions.length) reasons.push(...verification.restrictions);
  if (!Number.isFinite(input.generatedAt.getTime())) reasons.push("The report date is invalid.");
  if (reasons.length) throw new AutomatedReportNotReadyError(reasons);

  const profile = classifyPropertyProfile({ propertyType: property.propertyType,
    description: property.description, acreageText: property.acreageText });
  const programs = facts.verifiedPrograms;
  const currentPrice = "priceEvidence" in property && property.priceEvidence?.status === "current-asking-price"
    ? property.priceEvidence.amountUsd : null;
  // Transfer candidates are explicitly unadjusted in the evidence service.
  // They must not be promoted into reviewed acquisition comparables here.
  const marketPlan = buildMarketComparablePlan({ profileId: profile.id, comparables: [] });
  const capitalPlan = buildPreliminaryCapitalPlan({ profileId: profile.id, listedPrice: currentPrice,
    requestedAmount: null, pathwayNames: programs.map(p => p.name) });
  const scenarios = buildScenarioRankingPlan({ profileId: profile.id, marketPlan, capitalPlan,
    pathwayCount: programs.length, customerVision: input.customerVision });
  const unknowns = brief.unknowns.map(u => `${u.label}: ${u.howToFind}`);
  const warnings = [...verification.warnings, ...brief.verifiedFacts.filter(f => f.tone === "caution")
    .map(f => `${f.label}: ${f.value}. ${f.text}`)];
  const economic = input.economicEvidence;
  const economics = economic ? compilePropertyComparisonEconomicAnalysis({
    propertyId: economic.propertyId, comparisonItemId: economic.comparisonItemId,
    address: verification.normalizedAddress!,
    // Re-assess freshness at report generation, not at the old package date.
    packages: economic.packages.map(p => ({ ...p, generatedAt: input.generatedAt.toISOString() })),
  }) : null;
  const identityMatches = Boolean(economic && economic.propertyId === facts.propertyId);
  const selectedChoice = input.selectedReportCandidateId && economic
    ? supportedReportChoices(economic.packages).find(c => c.id === input.selectedReportCandidateId) : null;
  const selectedVisionMatches = input.selectedReportCandidateId
    ? Boolean(selectedChoice && selectedChoice.title === input.customerVision)
    : !input.customerVision;
  const saleReasons = !economics ? ["The property-specific use comparison does not yet have complete source-backed evidence."]
    : !economics.ok ? economics.missingEvidence : [];
  if (economic && !identityMatches) saleReasons.push("The economic evidence is for a different property identity.");
  if (!selectedVisionMatches) saleReasons.push("The selected customer vision has not been evaluated in this evidence package.");
  const saleReadiness = { allowed: Boolean(economics?.ok && identityMatches && selectedVisionMatches), reasons: saleReasons };
  const evidenceDigest = reportSnapshotDigest({ facts, economicEvidence: economic ?? null });
  const planLines = scenarios.scenarios.flatMap((scenario, index) => [
    `${index + 1}. ${scenario.candidateRole === "best-single-enterprise" ? "Single-enterprise option" : scenario.candidateRole === "best-mixed-use" ? "Whole-parcel combination" : scenario.candidateRole === "customer-vision" ? "Customer vision: " + input.customerVision : "Distinct alternative"} — preliminary investigation order.`,
    scenario.summary.replace(/The strongest /g, "Investigate a supported "),
    "The ordering uses preliminary planning rules. Property fit, market viability, financing and legal use have not been established sufficiently for a purchase recommendation.",
    `Conditions before reliance: ${scenario.conditions.join(" ")}`,
  ]);
  const capitalLines = capitalPlan.usesOfFunds.map(line =>
    `${line.label}: ${money(line.range.low)} / ${money(line.range.likely)} / ${money(line.range.high)} (low / planning / high). ${line.note}`);
  const laneAnswers = brief.farmEnterpriseAnswers?.map(a =>
    a.propertyAnswer + (a.confirm ? ` Confirm: ${a.confirm}` : "")) ??
    (brief.residentialAnswers ?? brief.commercialAnswers ?? []).map(a =>
      `${a.question} — ${a.answer}${a.confirm ? ` Confirm: ${a.confirm}` : ""}`);
  const model: Parameters<typeof generatePropertyEvaluationPdf>[0] = {
    branding: { ...buildReportBranding({ generatedAt: input.generatedAt,
      explorationPath: ["Property", "Evidence", "Preliminary use comparison"] }), reportTitle: reportPolicy.paid.name },
    tier: { id: "paid", label: reportPolicy.paid.name, shortLabel: "Property Report", description: reportPolicy.paid.description },
    context: { title: verification.normalizedAddress!, exactAddress: verification.normalizedAddress,
      location: [property.town, property.state, property.zip].filter(Boolean).join(", "),
      priceLabel: currentPrice === null ? "Current asking price not established" : `Current asking price: ${money(currentPrice)}`,
      propertyType: profile.label, sourceLabel: property.parcelSourceName ?? "Approved property evidence", currentLabel: property.listingStatus },
    verdict: { label: "Preliminary property screen",
      explanation: "Review the sourced facts, compare the candidate uses, and resolve the listed evidence gaps before committing to a purchase or financing." },
    executiveSummary: `This report evaluates ${verification.normalizedAddress} as ${profile.label.toLowerCase()}. ` +
      `The parcel references are ${property.parcelRefs.join(", ")}. ` +
      (input.customerVision ? `Your stated vision is: ${input.customerVision}. ` : "No candidate preference was supplied. ") +
      "The comparison is preliminary. Physical suitability, legal use, market demand and operating cash flow require the specific evidence listed below.",
    propertySummary: [
      `Evidence frozen: ${input.generatedAt.toISOString()}`,
      `Property type: ${profile.label}; source classification: ${property.rawPropertyStyle ?? "not published"}`,
      `Parcel references: ${property.parcelRefs.join(", ")}`,
      `Acreage: ${property.acreageText ?? "not established"}`,
      `Buildings: ${property.squareFeet == null ? "size not established" : property.squareFeet.toLocaleString("en-US") + " sq ft"}; year built: ${property.yearBuilt ?? "not established"}`,
      `Recorded land use: ${property.landUse ?? "not established"}; zoning: ${property.zoning ?? "not established"}`,
      `Assessment: ${money(property.assessedTotalValue)}; assessment date: ${property.assessmentAsOf ?? "not published"}. Assessment is not market value or the buyer's future tax bill.`,
      `Parcel source: ${property.parcelSourceName ?? "approved property record"}; source date: ${property.parcelSourceAsOf ?? "not published"}; ${property.parcelSourceUrl ?? "see source register"}`,
    ],
    propertyValueScreen: property.propertyValueScreen ?? undefined,
    scenarioComparison: [...planLines,
      ...(brief.farmBestUse ? [brief.farmBestUse.headline,
        ...brief.farmBestUse.options.map(option => `${option.name}: ${option.why} Economics basis: ${option.economicsBasis}; ${option.grossPerAcre}`),
        ...brief.farmBestUse.missingCriticalInputs.map(item => `Missing agricultural evidence: ${item}`)] : [])],
    conceptSummary: ["Preliminary capital requirements", ...capitalLines,
      ...capitalPlan.assumptions,
      "NOI, DSCR and long-range projections are withheld because verified scenario revenue, complete operating costs and debt terms are not present in this evidence package. Missing inputs are not treated as zero.",
      ...marketPlan.decisionRules],
    strengths: brief.verifiedFacts.filter(f => f.tone !== "caution").slice(0, 8).map(f => `${f.label}: ${f.value}. ${f.text}`),
    risks: [...warnings, "The candidate order uses the published preliminary planning rules; it is not a measured probability, appraisal, or purchase recommendation."],
    pathwayAnalysis: programs.map(p => `${p.name} (${p.administering_body}): ${p.verifiedStatement} ${p.personSideCaveat} Source: ${p.source_citation}; as of ${p.asOf}.`),
    propertyVerificationSummary: [`Identity status: ${verification.status}.`, ...verification.warnings],
    // Parcel facts belong in the place chapter, not the statutory tax-lever chapter.
    // Verified program facts remain in pathwayAnalysis with their citations.
    verifiedCriteria: [],
    readinessSectionNotes: ["Borrower financial eligibility and lender approval have not been evaluated."],
    keyQuestions: unknowns.slice(0, 8),
    nextMoves: unknowns.slice(0, 5),
    includedSections: [...reportPolicy.paid.includes],
    explainabilityNotes: [AUTOMATED_PROPERTY_REPORT_VERSION, `Source snapshot SHA-256:\n${evidenceDigest.slice(0, 32)}\n${evidenceDigest.slice(32)}`,
      "Source observation dates are listed separately from this report's generation date. Free warnings are never withheld behind purchase.",
      "Unadjusted transfers, county averages and assessments are context, not subject-property forecasts.",
      scenarios.rankingRule],
    customerRights: ["Your report is private to your order. Keep your order recovery token securely.",
      "Corrections and refunds follow the purchase terms accepted at checkout."],
    humanReviewBoundary: ["This report is automated and has not received human review.",
      "It is not an appraisal, legal or permitting determination, borrower underwriting, loan approval or guaranteed outcome."],
    buyingProcess: brief.mechanics?.paragraphs,
    honestUnknowns: unknowns,
    financingProse: brief.pathwaysProse,
    placeFacts: brief.verifiedFacts.map(f => ({ label: f.label, value: f.value, source: sourceLabel(f.provenance) })),
    diligenceCosts: brief.diligenceCosts,
    laneAnswers: laneAnswers.length ? { title: "Questions for this property", lines: laneAnswers } : null,
  };
  if (saleReadiness.allowed && economics?.ok && economic) {
    const candidates = [...economics.analysis.candidates].sort((a, b) => {
      const blocked = (c: typeof a) => Object.values(c.constraints).some(status => status === "blocked");
      if (blocked(a) !== blocked(b)) return blocked(a) ? 1 : -1;
      if (a.projection.status !== "complete" || b.projection.status !== "complete") return 0;
      return b.projection.annualYearOneNet - a.projection.annualYearOneNet ||
        b.projection.cumulativeNet.year5 - a.projection.cumulativeNet.year5 ||
        (b.dscr ?? 0) - (a.dscr ?? 0) || b.confidenceScore - a.confidenceScore || a.id.localeCompare(b.id);
    });
    model.scenarioComparison = candidates.flatMap((candidate, index) => [
      `${index + 1}. ${candidate.title}. ${Object.values(candidate.constraints).includes("blocked") ? "Cannot proceed under the documented constraints." : "Subject to the conditions below."}`,
      ...Object.entries(economic.packages.find(p => p.candidate.id === candidate.id)!.constraints)
        .map(([domain, finding]) => `${domain}: ${finding.summary} ${finding.conditions.join(" ")}`),
      `Total project cost: ${money(candidate.totalProjectCost)}. Property/project DSCR: ${candidate.dscr?.toFixed(2) ?? "not established"}.`,
      `Constraints: ${Object.entries(candidate.constraints).map(([domain, status]) => `${domain}: ${status}`).join("; ")}.`,
      `Sources: ${candidate.sourceRefs.join("; ")}`,
    ]);
    model.conceptSummary = candidates.flatMap(candidate => {
      if (candidate.projection.status !== "complete") return [];
      const projection = candidate.projection, year = projection.years[0];
      return [
        `${candidate.title}: first-year revenue ${money(year.revenue)}, operating costs ${money(year.operatingExpenses)}, NOI ${money(year.noi)}, annual debt service ${money(year.debtService)}.`,
        `Net after debt and periodic capital: monthly ${money(projection.monthlyYearOneNet)}, quarterly ${money(projection.quarterlyYearOneNet)}, first year ${money(projection.annualYearOneNet)}.`,
        `Cumulative net: 5 years ${money(projection.cumulativeNet.year5)}, 10 years ${money(projection.cumulativeNet.year10)}, 30 years ${money(projection.cumulativeNet.year30)}.`,
        ...projection.assumptions,
      ];
    });
    // The completed packages supersede the free screen's generic missing-input
    // text. Carry their actual findings and outstanding conditions into every
    // report section, so an evidenced budget is not later described as absent.
    const conditions = [...new Set(economic.packages.flatMap(p => Object.values(p.constraints)
      .flatMap(finding => finding.conditions.map(condition => `${p.candidate.title}: ${condition}`))))];
    const findings = economic.packages.flatMap(p => p.findings.map(finding =>
      `${p.candidate.title} — ${finding.domain}: ${finding.summary}`));
    // Keep the use comparison and costs ahead of the detailed source findings.
    // The latter belong in the report's evidence chapter, not three pages of
    // repeated domain text before the customer reaches the actual comparison.
    model.laneAnswers = null;
    model.scenarioEvidence = findings;
    model.honestUnknowns = [...conditions, "Borrower-specific financial eligibility and lender approval have not been evaluated."];
    model.keyQuestions = [...model.honestUnknowns];
    model.nextMoves = conditions.length ? conditions : ["Reconfirm source dates and the stated project terms before committing to a purchase."];
    model.executiveSummary = `This report evaluates ${verification.normalizedAddress} as ${profile.label.toLowerCase()}. ` +
      (selectedChoice ? `Your selected interest is ${selectedChoice.title}; all evaluated uses remain in the comparison. ` : "") +
      "Three preliminary scenarios have complete source-backed economic packages. Viable or conditional candidates appear before blocked uses; within each group, the order uses first-year net after debt and capital, then five-year cumulative net, DSCR and evidence confidence. Documented conditions still govern each use.";
    model.risks = [...warnings, ...economic.packages.flatMap(p => Object.values(p.constraints)
      .filter(finding => finding.status !== "clear").map(finding => `${p.candidate.title}: ${finding.summary} ${finding.conditions.join(" ")}`)),
      "Source-supported projections depend on the stated assumptions. They are not guaranteed outcomes or borrower underwriting."];
    model.explainabilityNotes = model.explainabilityNotes.filter(line => line !== scenarios.rankingRule);
    model.explainabilityNotes.push(...economic.packages.flatMap(p => p.sources.map(source =>
      `${source.title}: ${source.reference}; source date ${source.asOf}; captured ${source.capturedAt}; ${source.contentHash}`)));
  }
  return { model, evidenceDigest, modelDigest: reportSnapshotDigest(model), saleReadiness,
    quality: { identityMatched: true, parcelMatched: true, sourceAttributed: true,
      preliminaryComparison: true, economicsStatus: saleReadiness.allowed ? "SOURCE_SUPPORTED" : "MISSING_VERIFIED_INPUTS", warnings, unresolvedEvidence: saleReadiness.allowed ? model.honestUnknowns ?? [] : unknowns },
    scenarioPlan: scenarios, capitalPlan };
}

export async function renderAutomatedPropertyReport(model: Parameters<typeof generatePropertyEvaluationPdf>[0]): Promise<Buffer> {
  const document = generatePropertyEvaluationPdf(model);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of document) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_AUTOMATED_REPORT_BYTES) {
      document.destroy();
      throw new AutomatedReportNotReadyError(["The report exceeds the verified delivery size limit."]);
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}
