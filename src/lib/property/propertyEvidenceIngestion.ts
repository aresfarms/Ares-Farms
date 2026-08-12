import type { BriefFactLine, BriefUnknownLine } from "@/lib/property/propertyBriefIntelligence";
import { buildPublicActionRiskImpact, buildWaterInsuranceRiskImpact, type ExtendedPropertyRiskEvidence, type OfficialEvidenceSource, type PublicProjectRiskEvidence, type GovernmentActionRiskEvidence, type WaterRiskEvidence, type InsuranceRiskEvidence } from "@/lib/property/propertyRiskEvidence";
import type { PropertyInfrastructureRiskImpact, ScenarioInfrastructureAdjustment } from "@/lib/intelligence/scenarioRankingPlan";


export interface OfficialPropertyEvidenceRecord {
  recordId: string;
  domain: "tax" | "title" | "water" | "insurance" | "public-project" | "government-action";
  status: string;
  sourceId: string;
  sourceName: string;
  authority: string;
  jurisdiction: string;
  reference: string;
  retrievedAt: string;
  asOf: string;
  effectiveDate?: string | null;
  replayRef: string;
  canonicalPropertyId: string;
  parcelMatchMethod: "canonical-id" | "parcel-id" | "normalized-address" | "geospatial";
  parcelMatchConfidence: "exact" | "high" | "review-required";
  affectedScenarioIds?: string[];
  notes?: string[];
  annualCost?: number | null;
  oneTimeCost?: number | null;
  currentAnnualTax?: number | null;
  transferContinuityVerified?: boolean;
}

export function structuredTaxRecord(records: OfficialPropertyEvidenceRecord[]): OfficialPropertyEvidenceRecord | null {
  return records.find((record) => record.domain === "tax") ?? null;
}

export function ingestStructuredPropertyEvidence(records: OfficialPropertyEvidenceRecord[]): ExtendedPropertyRiskEvidence[] {
  return records.filter((record) => record.domain !== "tax" && record.domain !== "title").map((record) => {
    if (!record.recordId || !record.sourceId || !record.sourceName || !record.authority || !record.jurisdiction || !record.reference || !record.retrievedAt || !record.asOf || !record.replayRef || !record.canonicalPropertyId) {
      throw new Error("Structured official evidence is missing required provenance or parcel-match fields.");
    }
    if (record.parcelMatchConfidence === "review-required") {
      throw new Error("Structured official evidence requiring parcel review cannot be treated as verified.");
    }
    const source: OfficialEvidenceSource = {
      authority: record.authority,
      jurisdiction: record.jurisdiction,
      reference: `${record.sourceName} · ${record.reference} · source ${record.sourceId} · retrieved ${record.retrievedAt} · parcel ${record.canonicalPropertyId} via ${record.parcelMatchMethod}`,
      asOf: record.asOf,
      effectiveDate: record.effectiveDate ?? null,
      replayRef: record.replayRef,
    };
    const base = { confidence: "verified" as const, source, affectedScenarioIds: record.affectedScenarioIds ?? [], notes: record.notes ?? [], annualCost: record.annualCost, oneTimeCost: record.oneTimeCost };
    if (record.domain === "water") return { ...base, kind: "water" as const, status: record.status as WaterRiskEvidence["status"] };
    if (record.domain === "insurance") return { ...base, kind: "insurance" as const, status: record.status as InsuranceRiskEvidence["status"] };
    if (record.domain === "public-project") return { ...base, kind: "public-project" as const, status: record.status as PublicProjectRiskEvidence["status"], projectName: record.reference };
    return { ...base, kind: "government-action" as const, status: record.status as GovernmentActionRiskEvidence["status"], governmentBody: record.authority, officialTitle: record.reference, lastOfficialAction: record.notes?.[0] ?? record.status, geographicScope: record.jurisdiction };
  });
}

function sourceFromFact(fact: BriefFactLine): OfficialEvidenceSource | null {
  const asOf = fact.provenance.match(/(?:as of|dated|updated)\s+([0-9]{4}-[0-9]{2}-[0-9]{2})/i)?.[1] ?? null;
  const authority = fact.provenance.split(/[·|—]/)[0]?.trim() || null;
  if (!authority || !asOf) return null;
  return { authority, jurisdiction: "Property jurisdiction", reference: fact.provenance, asOf };
}

function affected(profileId: string): string[] {
  if (profileId === "farm") return ["operating-agriculture", "residential-passive-acreage", "specialty-direct-market"];
  if (profileId === "land") return ["productive-land", "residential-homestead", "hold-lease-pass"];
  if (["commercial", "hospitality", "mobile-home-park"].includes(profileId)) return ["owner-operated", "income-property", "adaptive-mixed-use"];
  return ["primary-residential", "residential-income", "renovate-renegotiate-pass"];
}

export function ingestPropertyEvidence(args: {
  facts: BriefFactLine[];
  unknowns: BriefUnknownLine[];
  profileId: string;
  location: string;
}): ExtendedPropertyRiskEvidence[] {
  const ids = affected(args.profileId);
  const result: ExtendedPropertyRiskEvidence[] = [];
  const find = (pattern: RegExp) => args.facts.find((fact) => pattern.test(`${fact.label} ${fact.value} ${fact.text}`));

  const water = find(/\b(well|water service|water capacity|irrigation|aquifer|public water)\b/i);
  if (water) {
    const source = sourceFromFact(water);
    result.push({ kind: "water", status: /unavailable|insufficient|constrained|restriction/i.test(`${water.value} ${water.text}`) ? "capacity-constrained" : /municipal|public water/i.test(`${water.value} ${water.text}`) ? "adequate-public-service" : "adequate-private-source", confidence: source ? "verified" : "supported", source, affectedScenarioIds: ids, notes: [water.text] });
  }

  const insurance = find(/\b(insurance|insurability|premium|carrier quote)\b/i);
  if (insurance) {
    const source = sourceFromFact(insurance);
    result.push({ kind: "insurance", status: /uninsurable|no coverage/i.test(`${insurance.value} ${insurance.text}`) ? "materially-uninsurable" : /specialty|surplus/i.test(`${insurance.value} ${insurance.text}`) ? "specialty-market-only" : /condition|high premium|burdensome/i.test(`${insurance.value} ${insurance.text}`) ? "insurable-with-conditions" : "normally-insurable", confidence: source ? "verified" : "supported", source, affectedScenarioIds: ids, notes: [insurance.text] });
  }

  const project = find(/\b(DOT|right[- ]of[- ]way|road widening|highway|condemnation|public project|transmission corridor|pipeline corridor)\b/i);
  if (project) {
    const source = sourceFromFact(project);
    const text = `${project.value} ${project.text}`;
    result.push({ kind: "public-project", projectName: project.label, status: /active acquisition|condemnation/i.test(text) ? "active-acquisition-condemnation" : /right[- ]of[- ]way|acquisition anticipated/i.test(text) ? "right-of-way-anticipated" : /preliminary design/i.test(text) ? "preliminary-design" : /funded/i.test(text) ? "funded-planning" : /no identified|none identified/i.test(text) ? "no-identified-exposure" : "long-range-conceptual", confidence: source ? "verified" : "supported", source, affectedScenarioIds: ids, notes: [project.text] });
  }

  const action = find(/\b(bill|ordinance|regulation|rulemaking|government action|implementation)\b/i);
  if (action) {
    const source = sourceFromFact(action);
    const text = `${action.value} ${action.text}`;
    const status = /failed|defeated/i.test(text) ? "failed" : /vetoed/i.test(text) ? "vetoed" : /active|effective now/i.test(text) ? "active" : /implementation pending/i.test(text) ? "effective-implementation-pending" : /enacted|not yet effective/i.test(text) ? "enacted-not-yet-effective" : /awaiting signature/i.test(text) ? "awaiting-signature" : /passed legislature/i.test(text) ? "passed-legislature" : /passed one chamber/i.test(text) ? "passed-one-chamber" : /committee/i.test(text) ? "in-committee" : "proposed";
    result.push({ kind: "government-action", status, confidence: source ? "verified" : "supported", source, governmentBody: source?.authority ?? "Government body not parsed", officialTitle: action.label, lastOfficialAction: action.value, geographicScope: args.location, affectedScenarioIds: ids, notes: [action.text] });
  }

  return result;
}

export function mergeWithDefaultPropertyEvidence(args: { ingested: ExtendedPropertyRiskEvidence[]; location: string }): ExtendedPropertyRiskEvidence[] {
  const byKind = new Map(args.ingested.map((item) => [item.kind, item]));
  const defaults: ExtendedPropertyRiskEvidence[] = [
    { kind: "water", status: "unresolved", confidence: "unresolved", notes: ["Water source, tested capacity, rights, and lifecycle cost have not yet been verified for this property."] },
    { kind: "insurance", status: "unknown-pending-quote", confidence: "unresolved", notes: ["A property- and use-specific insurance indication or quote is still required."] },
    { kind: "public-project", status: "unknown", confidence: "unresolved", notes: ["Current DOT and other public-project records have not yet been resolved for this parcel."] },
    { kind: "government-action", status: "proposed", confidence: "unresolved", governmentBody: "Unresolved", officialTitle: "Formal government action review", lastOfficialAction: "Not yet searched", geographicScope: args.location, notes: ["Official pending and implementation-stage government actions have not yet been resolved."] },
  ];
  return defaults.map((item) => byKind.get(item.kind) ?? item);
}

export function buildInfrastructureRiskFromEvidence(evidence: ExtendedPropertyRiskEvidence[]): PropertyInfrastructureRiskImpact {
  const water = evidence.find((item): item is WaterRiskEvidence => item.kind === "water");
  const insurance = evidence.find((item): item is InsuranceRiskEvidence => item.kind === "insurance");
  const publicProject = evidence.find((item): item is PublicProjectRiskEvidence => item.kind === "public-project");
  const governmentAction = evidence.find((item): item is GovernmentActionRiskEvidence => item.kind === "government-action");
  const utility = buildWaterInsuranceRiskImpact({ water, insurance });
  const publicAction = buildPublicActionRiskImpact({ publicProject, governmentAction });
  const ids = new Set([
    ...Object.keys(utility.scenarioAdjustments ?? {}),
    ...Object.keys(publicAction.scenarioAdjustments ?? {}),
  ]);
  const scenarioAdjustments: Record<string, ScenarioInfrastructureAdjustment> = {};
  for (const id of ids) {
    const a = utility.scenarioAdjustments?.[id];
    const b = publicAction.scenarioAdjustments?.[id];
    scenarioAdjustments[id] = {
      waterPenalty: a?.waterPenalty,
      waterBenefit: a?.waterBenefit,
      insurancePenalty: a?.insurancePenalty,
      publicProjectPenalty: b?.publicProjectPenalty,
      governmentActionPenalty: b?.governmentActionPenalty,
      verified: (a?.verified ?? true) && (b?.verified ?? true),
      notes: [...(a?.notes ?? []), ...(b?.notes ?? [])],
    };
  }
  return {
    water: utility.water,
    insurance: utility.insurance,
    publicProject: publicAction.publicProject,
    governmentAction: publicAction.governmentAction,
    scenarioAdjustments,
  };
}
