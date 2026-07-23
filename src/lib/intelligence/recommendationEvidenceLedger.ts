import type { DecisionSynthesisPlan } from "@/lib/intelligence/decisionSynthesisPlan";
import type { FinancialCapacityPlan } from "@/lib/intelligence/financialCapacityPlan";
import type { MarketComparablePlan } from "@/lib/intelligence/marketComparablePlan";
import type { PreliminaryCapitalPlan } from "@/lib/intelligence/preliminaryCapitalPlan";
import type { TransactionTimelinePlan } from "@/lib/intelligence/transactionTimelinePlan";

export type EvidenceLedgerKind = "verified-fact" | "modeled-assumption" | "unresolved-unknown" | "human-decision";

export interface EvidenceLedgerEntry {
  id: string;
  kind: EvidenceLedgerKind;
  label: string;
  detail: string;
  status: "supporting" | "caution" | "blocking" | "pending";
  source: string;
}

export interface RecommendationEvidenceLedger {
  recommendation: DecisionSynthesisPlan["decision"];
  entries: EvidenceLedgerEntry[];
  counts: Record<EvidenceLedgerKind, number>;
  reviewRule: string;
}

export function buildRecommendationEvidenceLedger(args: {
  decision: DecisionSynthesisPlan;
  verifiedFacts: Array<{ label: string; value: string; tone?: string }>;
  unknowns: Array<{ label: string; pointer: string }>;
  financialCapacity: FinancialCapacityPlan;
  timeline: TransactionTimelinePlan;
  market: MarketComparablePlan;
  capital: PreliminaryCapitalPlan;
}): RecommendationEvidenceLedger {
  const entries: EvidenceLedgerEntry[] = [];

  args.verifiedFacts.slice(0, 8).forEach((fact, index) => entries.push({
    id: `fact-${index + 1}`, kind: "verified-fact", label: fact.label, detail: fact.value,
    status: fact.tone === "caution" ? "caution" : "supporting", source: "Verified place/property evidence",
  }));

  [
    `Capital need remains a planning range; price known: ${args.capital.priceKnown ? "yes" : "no"}.`,
    `Market evidence posture is ${args.market.status} with ${args.market.alternativePropertyCount} lower- or similarly-priced alternative(s).`,
    `Transaction compatibility is ${args.timeline.compatibility}; modeled financing timing is pathway dependent.`,
    `Customer capacity posture is ${args.financialCapacity.posture}.`,
  ].forEach((detail, index) => entries.push({
    id: `assumption-${index + 1}`, kind: "modeled-assumption", label: ["Capital model", "Market model", "Timing model", "Capacity model"][index],
    detail, status: "caution", source: "Furlong planning model",
  }));

  args.unknowns.slice(0, 8).forEach((unknown, index) => entries.push({
    id: `unknown-${index + 1}`, kind: "unresolved-unknown", label: unknown.label, detail: `${unknown.pointer} is the official path to resolution.`,
    status: "pending", source: "Open evidence gap",
  }));

  [
    ["Borrower authorization", args.financialCapacity.authorization === "authorized" ? "Authorized" : "Customer authorization is still required before borrower-specific conclusions."],
    ["Contract strategy", args.timeline.compatibility === "compatible" ? "Current timing is compatible." : "A human must approve extension rights, contingency, alternate structure, phased closing, or walk-away."],
    ["Environmental and diligence acceptance", args.capital.phaseIRequired ? "A human reviewer must confirm lender-acceptable Phase I scope, provider, reliance, and follow-up." : "A human reviewer must confirm whether environmental triggers require further work."],
    ["Final recommendation approval", `A named reviewer must accept, modify, or reject the ${args.decision.decision.replace(/-/g, " ")} recommendation after reviewing the evidence ledger.`],
  ].forEach((item, index) => entries.push({
    id: `decision-${index + 1}`, kind: "human-decision", label: item[0], detail: item[1], status: item[1].includes("still required") || item[1].includes("must") ? "pending" : "supporting", source: "Human decision surface",
  }));

  const kinds: EvidenceLedgerKind[] = ["verified-fact", "modeled-assumption", "unresolved-unknown", "human-decision"];
  return {
    recommendation: args.decision.decision, entries,
    counts: Object.fromEntries(kinds.map(kind => [kind, entries.filter(entry => entry.kind === kind).length])) as Record<EvidenceLedgerKind, number>,
    reviewRule: "A recommendation may be explained by this ledger, but it may not be treated as final when a blocking fact, unresolved material unknown, or required human decision remains open.",
  };
}
