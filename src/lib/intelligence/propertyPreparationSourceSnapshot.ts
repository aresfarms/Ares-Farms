import { normalizedListingAddress } from "@/lib/property/listingPriceEvidence";

export type PropertyPreparationSourceSnapshot = {
  version: "property-preparation-source-snapshot-v2";
  capturedAt: string;
  facts: Array<{ label: string; value: string; source: string }>;
  warnings: Array<{ summary: string; detail: string | null; source: string | null }>;
  unknowns: Array<{ label: string; action: string }>;
};

const record = (value: unknown): Record<string, unknown> => value !== null &&
  typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const strings = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : [];

/** Vol III TECH-PROV-001 / V CANON-EXPL-001: display the worker's retained
 * source observations without upgrading their authority or erasing their age.
 * This read-only projection never changes evidence readiness or authorizes sale.
 * Identity and capture-time checks prevent another property's findings, malformed
 * captures or future-dated observations from appearing in the customer's view.
 */
export function propertyPreparationSourceSnapshot(item: {
  propertyId: string | null; normalizedAddress: string | null;
  submittedAddress: string; resultSnapshot: unknown;
}, asOf: Date): PropertyPreparationSourceSnapshot | null {
  const capture = record(record(item.resultSnapshot).evidenceCapture);
  const facts = record(capture.facts);
  const verification = record(facts.verification);
  const capturedAt = text(capture.capturedAt);
  const date = Date.parse(capturedAt);
  if (capture.version !== "property-evidence-capture-v1" || facts.ok !== true ||
      !item.propertyId || facts.propertyId !== item.propertyId || !Number.isFinite(date) ||
      !Number.isFinite(asOf.getTime()) || date > asOf.getTime() ||
      !["verified", "partial"].includes(text(verification.status)) ||
      !text(verification.normalizedAddress) ||
      normalizedListingAddress(text(verification.normalizedAddress)) !==
      normalizedListingAddress(item.normalizedAddress || item.submittedAddress)) return null;

  const property = record(facts.propertyRecord);
  const brief = record(facts.placeIntelligence);
  const source = [text(property.parcelSourceName), text(property.parcelSourceAsOf),
    text(property.parcelSourceUrl)].filter(Boolean).join(" · ");
  const observations: PropertyPreparationSourceSnapshot["facts"] = [];
  for (const [label, value] of [
    ["Property type", text(property.propertyType)],
    ["Reported land use", text(property.landUse)],
    ["Reported acreage", text(property.acreageText)],
    ["Parcel references", strings(property.parcelRefs).join(", ")],
    ["Reported zoning", text(property.zoning)],
  ]) {
    if (value && source) observations.push({ label, value, source });
  }
  if (typeof property.squareFeet === "number" && Number.isFinite(property.squareFeet) && property.squareFeet > 0 && source) {
    observations.push({ label: "Reported building area", value: `${property.squareFeet.toLocaleString("en-US")} sq ft`, source });
  }
  const warnings: PropertyPreparationSourceSnapshot["warnings"] = [...strings(verification.warnings), ...strings(verification.restrictions)]
    .map(summary => ({ summary, detail: null, source: null }));
  for (const value of Array.isArray(brief.verifiedFacts) ? brief.verifiedFacts : []) {
    const fact = record(value);
    const label = text(fact.label), detail = text(fact.value), provenance = text(fact.provenance);
    if (!label || !detail || !provenance) continue;
    observations.push({ label, value: [detail, text(fact.text)].filter(Boolean).join(". "), source: provenance });
    if (fact.tone === "caution") warnings.push({
      summary: `${label}: ${detail}`, detail: text(fact.text) || null, source: provenance,
    });
  }
  const unknowns = (Array.isArray(brief.unknowns) ? brief.unknowns : []).flatMap(value => {
    const unknown = record(value), label = text(unknown.label), action = text(unknown.howToFind);
    return label && action ? [{ label, action }] : [];
  });
  return { version: "property-preparation-source-snapshot-v2", capturedAt,
    facts: observations.filter((value, index) => observations.findIndex(other =>
      other.label === value.label && other.value === value.value && other.source === value.source) === index),
    warnings: warnings.filter((value, index) => warnings.findIndex(other =>
      other.summary === value.summary && other.detail === value.detail && other.source === value.source) === index), unknowns };
}
