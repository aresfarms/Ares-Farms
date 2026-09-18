/**
 * Canonical agronomic evidence gate. TECH-PROV-001 / CANON-EXPL-001:
 * mapped soil estimates, field measurements and management assumptions remain
 * different evidence classes. Pure, versioned and replayable with explicit asOf.
 */
export const CROP_SUITABILITY_VERSION = "crop-suitability-v1.0.0" as const;
export const ALFALFA_PH_SOURCE = "https://stage.extension.umd.edu/resource/importance-ph-and-liming-material";
export const INGLESIDE_SOURCE = "https://soilseries.sc.egov.usda.gov/OSD_Docs/I/INGLESIDE.html";

export interface SoilHorizon {
  horizonKey: string;
  topCm: number | null;
  bottomCm: number | null;
  phLow: number | null;
  phRepresentative: number | null;
  phHigh: number | null;
}
export interface SoilComponentEvidence {
  mapUnitKey: string;
  componentKey: string;
  name: string;
  componentPct: number | null;
  drainageClass: string | null;
  slopePct: number | null;
  horizons: SoilHorizon[];
}
export interface AgronomicSoilEvidence {
  mapUnitName: string | null;
  farmlandClass: string | null;
  drainageClass: string | null;
  slopePct: number | null;
  capabilityClass: number | null;
  dominantComponent?: string | null;
  spatialScope?: "point-map-unit" | "parcel-map-units" | "parcel-intersection";
  boundaryEvidence?: { parcelId: string; sourceUrl: string; sourceDate: string | null; geometryHash: string; queryHash: string };
  mapUnits?: Array<{ key: string; name: string; farmlandClass: string | null; capabilityClass: number | null }>;
  parcelCoveragePct?: number | null;
  components?: SoilComponentEvidence[];
  sourceUrl?: string;
  retrievedAt?: string;
  /** A field result must identify the tested field and sampling date. Never
   * populate this from SSURGO or the name of a soil series. */
  cropReview?: { crop: "alfalfa"; sourceRef: string; reviewedAt: string; coversProposedAcres: boolean; waterVerified: boolean; climateVerified: boolean; nutrientsVerified: boolean; establishmentVerified: boolean; marketVerified: boolean } | null;
  fieldPh?: { value: number; sampledAt: string; sourceRef: string; coversProposedAcres: boolean } | null;
}
export interface CropSuitability {
  version: typeof CROP_SUITABILITY_VERSION;
  status: "needs-evidence" | "constraint" | "supported-screen";
  reasons: string[];
  requiredEvidence: string[];
  sources: string[];
}
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Alfalfa is separate from grass hay. Passing pH is necessary, not sufficient
 * for crop suitability or profitability. No geographic blanket exclusion. */
export function assessAlfalfaSuitability(soil: AgronomicSoilEvidence | null | undefined, asOf?: string): CropSuitability {
  const reasons: string[] = [];
  const requiredEvidence: string[] = [];
  const sources = [ALFALFA_PH_SOURCE];
  let constrained = false;
  const field = soil?.fieldPh;
  const date = field ? Date.parse(field.sampledAt) : NaN;
  const evaluationDate = asOf ? Date.parse(asOf) : NaN;
  const currentField = field && finite(field.value) && field.value > 0 && field.value <= 14 &&
    field.sourceRef.trim() && field.coversProposedAcres && Number.isFinite(date) &&
    Number.isFinite(evaluationDate) && date <= evaluationDate && evaluationDate - date <= 365 * 86400000;
  if (currentField) {
    sources.push(field.sourceRef);
    if (field.value < 6.5 || field.value > 7) {
      constrained = true;
      reasons.push(`The supplied field pH (${field.value}) is outside the Maryland Extension alfalfa target of 6.5–7.0. A site-specific agronomic review and amendment budget are required; lime application is not assumed.`);
    } else reasons.push(`Supplied field pH ${field.value} meets the 6.5–7.0 alfalfa target; that alone does not establish crop fit.`);
  } else {
    requiredEvidence.push("current field soil test covering the proposed alfalfa acreage, including pH and amendment history");
    reasons.push("Current field pH is unverified. SSURGO and a prime-farmland label cannot establish alfalfa suitability.");
  }
  const components = soil?.components ?? [];
  const mappedAcid = components.some(c => c.horizons.some(h =>
    h.topCm != null && h.topCm < 30 && ((finite(h.phHigh) && h.phHigh < 6.5) ||
      (finite(h.phRepresentative) && h.phRepresentative < 6.5))));
  if (mappedAcid) reasons.push("SSURGO maps acidic surface-soil estimates in at least one component. These are survey estimates, not measurements of the field's current managed pH.");
  const ingleside = /\bingleside\b/i.test([soil?.dominantComponent, soil?.mapUnitName, ...components.map(c => c.name)].join(" "));
  if (ingleside) {
    sources.push(INGLESIDE_SOURCE);
    reasons.push("USDA describes Ingleside as naturally extremely to strongly acid unless limed. This is a soil-series warning, not a measured parcel pH or evidence that liming has occurred.");
  }
  const drainages = [soil?.drainageClass, ...components.map(c => c.drainageClass)].filter(Boolean) as string[];
  if (drainages.some(d => /poorly drained/i.test(d))) {
    constrained = true;
    reasons.push("Mapped poorly drained ground conflicts with alfalfa establishment. Do not assume drainage improvements or assign alfalfa to that ground.");
  }
  if (!drainages.length) requiredEvidence.push("drainage and seasonal water-table evidence for the proposed acreage");
  if (soil?.slopePct == null) requiredEvidence.push("field topography and equipment-access evidence");
  if (soil?.capabilityClass != null && soil.capabilityClass >= 5) {
    constrained = true;
    reasons.push(`Mapped nonirrigated land-capability class ${soil.capabilityClass} requires agronomic review before a cultivated alfalfa plan.`);
  }
  // A map-unit component percentage is never the percentage of this parcel.
  if (soil?.spatialScope !== "parcel-intersection" || !finite(soil.parcelCoveragePct) || soil.parcelCoveragePct < 99 || soil.parcelCoveragePct > 100) {
    requiredEvidence.push("parcel-boundary soil map, component limitations and proposed field allocation");
  }
  const review = soil?.cropReview;
  const reviewedAt = Date.parse(review?.reviewedAt ?? "");
  const reviewCurrent = review?.crop === "alfalfa" && review.sourceRef.trim() && review.coversProposedAcres &&
    review.waterVerified && review.climateVerified && review.nutrientsVerified && review.establishmentVerified && review.marketVerified &&
    Number.isFinite(reviewedAt) && Number.isFinite(evaluationDate) && reviewedAt <= evaluationDate && evaluationDate - reviewedAt <= 365 * 86400000;
  if (!reviewCurrent) requiredEvidence.push("current source-backed crop-specific water, climate, nutrient, establishment and market review covering the proposed acreage");
  else sources.push(review!.sourceRef);
  return { version: CROP_SUITABILITY_VERSION, status: constrained ? "constraint" : requiredEvidence.length ? "needs-evidence" : "supported-screen", reasons, requiredEvidence, sources: [...new Set(sources)] };
}
