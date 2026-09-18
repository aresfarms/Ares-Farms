import type { LaneWorkspaceProps } from "@/components/property/lanes/GovernedLaneChassis";

export const FURLONG_ANSWER_VERSION = "furlong-answer-v1.0.0";
export const ANSWER_QUESTIONS = [
  ["possibilities", "What appears possible?"],
  ["numbers", "What do the available numbers support?"],
  ["constraints", "What could prevent it?"],
  ["unknowns", "What remains unverified?"],
  ["next", "What is the next useful action?"],
] as const;
export type AnswerSectionKey = typeof ANSWER_QUESTIONS[number][0];
export type EvidenceState = "VERIFIED" | "SUPPORTED" | "SCREENING" | "NEEDS EVIDENCE";
export type AnswerSection = { key: AnswerSectionKey; question: string; text: string; status: EvidenceState };
export type FurlongAnswer = {
  version: typeof FURLONG_ANSWER_VERSION;
  subjectId: string;
  title: string;
  sourceDate: string | null;
  sections: AnswerSection[];
  sources: Array<{ label: string; url: string | null; asOf: string | null }>;
  price: { amount: number | null; label: string; basis: string };
  intendedUse: string;
  scope: string;
};

/** TECH-PROV-001 / TECH-EXPORT-001 / PUBLIC-CLAIMS-001.
 * Pure display projection of existing governed findings. No new ranking,
 * valuation, credit decision or fabricated completion percentage. */
export function publicEvidenceUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function composeFurlongAnswer(input: Omit<FurlongAnswer, "version" | "sections"> & {
  answers: Record<AnswerSectionKey, { text: string; status: EvidenceState }>;
}): FurlongAnswer {
  const { answers, ...context } = input;
  return {
    ...context,
    version: FURLONG_ANSWER_VERSION,
    sources: input.sources.map(source => ({ ...source, url: publicEvidenceUrl(source.url) })),
    sections: ANSWER_QUESTIONS.map(([key, question]) => ({
      key, question, ...answers[key],
    })),
  };
}

export function propertyFurlongAnswer(props: LaneWorkspaceProps): FurlongAnswer {
  const record = props.propertyRecord;
  const farm = props.intelligence?.farmBestUse;
  const price = record?.price;
  const currentPrice = typeof price === "number" && Number.isFinite(price) && price > 0
    && record?.priceEvidence?.status === "current-asking-price"
    && Boolean(record.listingSourceAsOf && publicEvidenceUrl(record.listingSourceUrl));
  const currentUse = record?.landUse || record?.rawPropertyStyle || props.propertyType || "Use not established";
  const supportedFarm = farm?.evidenceStatus === "supported-screen";
  const missing = Array.from(new Set([
    ...(!currentPrice ? ["Current transaction price and its supporting evidence"] : []),
    ...(farm?.missingCriticalInputs ?? []),
    ...(props.intelligence?.unknowns ?? []).map(item => item.label),
  ]));
  const concerns = (props.intelligence?.verifiedFacts ?? []).filter(fact => fact.tone === "caution");
  const numbers = currentPrice
    ? "The listing snapshot reports an asking price of " + price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) + ". This is an asking price, not a market-value opinion. Income, operating costs and loan terms must be reconciled separately."
    : "Current price evidence is pending. No tax assessment, state average or unsupported estimate is substituted. Supply a current listing, contract, or intended offer for an explicitly labeled scenario.";
  return composeFurlongAnswer({
    subjectId: props.propertyId.startsWith("imported:") ? "address:" + (record?.exactAddress || props.title + ", " + props.location).trim().toLowerCase() : props.propertyId,
    title: record?.exactAddress || props.title,
    sourceDate: record?.listingSourceAsOf || record?.parcelSourceAsOf || null,
    price: { amount: currentPrice ? price : null, label: currentPrice ? "Source-backed asking price" : "Price evidence pending",
      basis: currentPrice ? record?.listingSourceName || "Listing snapshot" : "No assessment fallback" },
    intendedUse: currentUse,
    sources: [
      ...(record?.listingSourceName || record?.listingSourceUrl ? [{ label: record.listingSourceName || "Listing source", url: record.listingSourceUrl || null, asOf: record.listingSourceAsOf || null }] : []),
      ...(record?.parcelSourceName || record?.parcelSourceUrl ? [{ label: record.parcelSourceName || "Parcel source", url: record.parcelSourceUrl || null, asOf: record.parcelSourceAsOf || null }] : []),
    ],
    scope: "Preliminary property information, not an appraisal, environmental clearance, permitted-use determination, loan application or financing approval. Source dates are not guarantees of currentness.",
    answers: {
      possibilities: { text: props.factsPending ? "Property evidence is still arriving. No leading use is established."
        : supportedFarm ? farm!.headline + " This agricultural screen is not a property-wide highest-and-best-use determination."
        : "The available record describes " + currentUse + ". That classification does not establish the most profitable or permitted use. Property-specific feasibility remains to be tested.",
        status: !props.factsPending && supportedFarm ? "SUPPORTED" : "SCREENING" },
      numbers: { text: numbers, status: currentPrice ? "SUPPORTED" : "NEEDS EVIDENCE" },
      constraints: { text: concerns.length ? concerns.map(fact => fact.label + ": " + fact.value).join("; ")
        : "No complete constraint clearance has been established. Confirm permitted use, condition, infrastructure and applicable environmental constraints before committing.", status: "SCREENING" },
      unknowns: { text: missing.length ? missing.join("; ") + "." : "Legal use, condition, market demand and the assumptions behind any economics still require confirmation. Absence of a listed gap is not clearance.", status: "NEEDS EVIDENCE" },
      next: { text: !currentPrice ? "Confirm the current asking price, contract or intended offer and its source, then review the missing evidence below."
        : farm?.missingCriticalInputs.length ? "Resolve the agricultural inputs: " + farm.missingCriticalInputs.join("; ") + "."
        : props.pauseLine || "Review the evidence with the appropriate professional before committing. Pausing or not proceeding is a valid outcome.",
        status: "SCREENING" },
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

/** Portable, script-free snapshot. Exporting downloads a file; it does not
 * invite recipients, create a case room or change any sharing permission. */
export function furlongAnswerHtml(answer: FurlongAnswer, exportedAt: string): string {
  const esc = escapeHtml;
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Furlong Answer</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#162b40;max-width:850px;padding:28px;margin:auto}h1,h2{line-height:1.25}section{border-top:1px solid #ccd6df;padding:14px 0;break-inside:avoid}small{display:block;color:#415866}a{overflow-wrap:anywhere;color:#09685f}@media print{body{padding:0}a{color:inherit}}</style></head><body><header><p>FURLONG</p><h1>The Furlong Answer</h1><h2>' + esc(answer.title) + '</h2><small>Format ' + esc(answer.version) + ' · Exported ' + esc(exportedAt) + '</small><small>Source date: ' + esc(answer.sourceDate || "not supplied") + '</small></header>'
    + answer.sections.map(section => '<section><h2>' + esc(section.question) + '</h2><small>' + esc(section.status) + '</small><p>' + esc(section.text) + '</p></section>').join("")
    + '<section><h2>Evidence and source dates</h2>' + (answer.sources.length ? answer.sources.map(source => '<p>' + (publicEvidenceUrl(source.url) ? '<a href="' + esc(source.url!) + '" rel="noreferrer">' + esc(source.label) + '</a>' : esc(source.label)) + ' · ' + esc(source.asOf || "Source date not supplied") + '</p>').join("") : '<p>Source links have not been supplied with this snapshot.</p>')
    + '</section><p>' + esc(answer.scope) + '</p><p>This unsigned customer reference copy does not update automatically and is not the separately attested property report. It is not lender acceptance or a professional certification. No recipient has been authorized by downloading it. You control any subsequent distribution; a downloaded copy cannot be remotely revoked.</p></body></html>';
}
