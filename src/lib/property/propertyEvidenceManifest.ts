import type { PostSaleTaxScenario } from "@/lib/property/ownershipCostModel";
import type { ExtendedPropertyRiskEvidence, EvidenceConfidence } from "@/lib/property/propertyRiskEvidence";

export type ManifestStatus =
  | "verified"
  | "supported"
  | "inferred"
  | "unresolved"
  | "stale"
  | "professional-confirmation-required";

export type EvidenceDomain = "tax" | "water" | "insurance" | "public-project" | "government-action";

export interface PropertyEvidenceManifestItem {
  id: string;
  domain: EvidenceDomain;
  label: string;
  status: ManifestStatus;
  summary: string;
  authority?: string | null;
  jurisdiction?: string | null;
  reference?: string | null;
  asOf?: string | null;
  effectiveDate?: string | null;
  replayRef?: string | null;
  affectedScenarioIds: string[];
  annualCost?: number | null;
  oneTimeCost?: number | null;
  requiresProfessionalConfirmation: boolean;
  warnings: string[];
}

export interface PropertyEvidenceManifest {
  generatedAt: string;
  items: PropertyEvidenceManifestItem[];
  counts: Record<ManifestStatus, number>;
  relianceAllowed: boolean;
  unresolvedDomains: EvidenceDomain[];
}

const ALL_STATUSES: ManifestStatus[] = ["verified", "supported", "inferred", "unresolved", "stale", "professional-confirmation-required"];

function ageDays(asOf: string | null | undefined, now: Date): number | null {
  if (!asOf) return null;
  const value = new Date(asOf);
  if (Number.isNaN(value.getTime())) return null;
  return Math.floor((now.getTime() - value.getTime()) / 86_400_000);
}

function evidenceStatus(confidence: EvidenceConfidence, asOf: string | null | undefined, staleAfterDays: number, now: Date, professional: boolean): ManifestStatus {
  if (professional) return "professional-confirmation-required";
  const age = ageDays(asOf, now);
  if (age != null && age > staleAfterDays) return "stale";
  if (confidence === "verified") return "verified";
  if (confidence === "supported") return "supported";
  if (confidence === "preliminary") return "inferred";
  return "unresolved";
}

export function riskEvidenceManifestItem(evidence: ExtendedPropertyRiskEvidence, now = new Date()): PropertyEvidenceManifestItem {
  const source = evidence.source ?? null;
  const professional = evidence.kind === "insurance" && evidence.status === "unknown-pending-quote";
  const status = evidenceStatus(evidence.confidence, source?.asOf, 365, now, professional);
  return {
    id: `${evidence.kind}:${source?.reference ?? evidence.status}`,
    domain: evidence.kind,
    label: evidence.kind === "government-action" ? evidence.officialTitle : evidence.kind === "public-project" ? evidence.projectName ?? "Public project exposure" : evidence.kind === "water" ? "Water capacity and source" : "Insurance availability",
    status,
    summary: `${evidence.kind}: ${evidence.status}`,
    authority: source?.authority,
    jurisdiction: source?.jurisdiction,
    reference: source?.reference,
    asOf: source?.asOf,
    effectiveDate: source?.effectiveDate,
    replayRef: source?.replayRef,
    affectedScenarioIds: evidence.affectedScenarioIds ?? [],
    annualCost: evidence.annualCost,
    oneTimeCost: evidence.oneTimeCost,
    requiresProfessionalConfirmation: professional,
    warnings: [...(evidence.notes ?? []), ...(status === "stale" ? ["Evidence is older than the permitted reliance window and must be refreshed."] : [])],
  };
}

export function taxManifestItem(tax: PostSaleTaxScenario): PropertyEvidenceManifestItem {
  const unresolved = tax.status !== "transfer-verified";
  return {
    id: "tax:post-sale",
    domain: "tax",
    label: "Post-sale property tax",
    status: unresolved ? "professional-confirmation-required" : "verified",
    summary: `Seller ${tax.sellerCurrentAnnual == null ? "unknown" : `$${tax.sellerCurrentAnnual.toLocaleString("en-US")}`}; stabilized buyer $${tax.stabilizedAnnual.toLocaleString("en-US")}; adverse $${tax.adverseAnnual.toLocaleString("en-US")}.`,
    reference: tax.rule,
    affectedScenarioIds: [],
    annualCost: tax.qualificationAnnual,
    requiresProfessionalConfirmation: unresolved,
    warnings: [tax.warning],
  };
}

export function buildPropertyEvidenceManifest(args: { tax: PostSaleTaxScenario; evidence: ExtendedPropertyRiskEvidence[]; generatedAt?: string }): PropertyEvidenceManifest {
  const now = args.generatedAt ? new Date(args.generatedAt) : new Date();
  const items = [taxManifestItem(args.tax), ...args.evidence.map((item) => riskEvidenceManifestItem(item, now))];
  const counts = Object.fromEntries(ALL_STATUSES.map((status) => [status, items.filter((item) => item.status === status).length])) as Record<ManifestStatus, number>;
  const blocking: ManifestStatus[] = ["unresolved", "stale", "professional-confirmation-required"];
  return {
    generatedAt: now.toISOString(),
    items,
    counts,
    relianceAllowed: !items.some((item) => blocking.includes(item.status)),
    unresolvedDomains: [...new Set(items.filter((item) => blocking.includes(item.status)).map((item) => item.domain))],
  };
}
