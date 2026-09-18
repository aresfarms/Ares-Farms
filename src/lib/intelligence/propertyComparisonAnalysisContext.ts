import { isEnterpriseEconomicEvidencePackage, type EnterpriseEconomicEvidencePackage } from "@/lib/intelligence/economicEvidencePackage";
import { findCanonicalPropertyByExactAddress } from "@/lib/property/propertyData";
import { findGovernedListingSnapshot } from "@/lib/property/governedListingSnapshot";
import { resolveJurisdictionParcel } from "@/lib/property/jurisdictionParcelResolver";
import { classifyPropertyProfile } from "@/lib/property/propertyProfile";

export interface PropertyComparisonAnalysisItem {
  id: string;
  comparisonId: string;
  submittedAddress: string;
  normalizedAddress: string | null;
  propertyId: string | null;
  resultSnapshot: unknown;
}

export interface PropertyComparisonAnalysisContext {
  version: "property-comparison-analysis-context-v1.0.0";
  propertyId: string;
  address: string;
  profileId: ReturnType<typeof classifyPropertyProfile>["id"];
  profileLabel: string;
  propertyType: string | null;
  currentUse: string | null;
  askingPrice: number | null;
  squareFeet: number | null;
  acreageText: string | null;
  zoning: string | null;
  county: string | null;
  state: string | null;
  parcelAccountId: string | null;
  sourceRefs: string[];
}

export interface PropertyComparisonAnalysisReadiness {
  context: PropertyComparisonAnalysisContext;
  evidencePackages: EnterpriseEconomicEvidencePackage[] | null;
  missingEvidence: string[];
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function embeddedPackages(snapshot: unknown): EnterpriseEconomicEvidencePackage[] | null {
  const root = record(snapshot);
  const candidates = root?.economicEvidencePackages;
  if (!Array.isArray(candidates) || candidates.length !== 3) return null;
  return candidates.every(isEnterpriseEconomicEvidencePackage)
    ? candidates as EnterpriseEconomicEvidencePackage[]
    : null;
}

export async function buildPropertyComparisonAnalysisReadiness(
  item: PropertyComparisonAnalysisItem,
): Promise<PropertyComparisonAnalysisReadiness> {
  const address = item.normalizedAddress?.trim() || item.submittedAddress.trim();
  const snapshot = record(item.resultSnapshot);
  const parsed = record(snapshot?.parsedAddress);
  const geocode = record(snapshot?.geocode);
  const canonical = findCanonicalPropertyByExactAddress(address);
  const source = canonical?.source_records?.[0] ?? null;
  const listing = findGovernedListingSnapshot(address);

  const parsedStreet = string(parsed?.street);
  const parsedCity = string(parsed?.city);
  const parsedState = string(parsed?.state);
  const parcel = parsedStreet && parsedCity && parsedState
    ? await resolveJurisdictionParcel({
        street: parsedStreet,
        city: parsedCity,
        state: parsedState,
        zip: string(parsed?.zip),
        parcelId: listing?.parcelId ?? null,
        lat: geocode?.lat as string | number | null | undefined,
        lon: geocode?.lon as string | number | null | undefined,
      }).catch(() => null)
    : null;

  const propertyType =
    source?.rawPropertyStyle ??
    listing?.propertyType ??
    parcel?.buildingType ??
    parcel?.landUse ??
    null;
  const acreageText =
    listing?.offeredAcreage != null
      ? `${listing.offeredAcreage} acres`
      : source?.acreageText ?? parcel?.acreageText ?? null;
  const profile = classifyPropertyProfile({
    propertyType,
    description: source?.description ?? listing?.description ?? parcel?.legalDescription ?? null,
    acreageText,
  });
  const askingPrice =
    finite(listing?.askingPrice) ?? finite(source?.price) ?? null;
  const squareFeet =
    finite(listing?.squareFeet) ?? finite(source?.squareFeet) ?? finite(parcel?.squareFeet) ?? null;
  const sourceRefs = [
    canonical?.source_url ? `canonical:${canonical.source_url}` : null,
    listing?.sourceUrl ? `listing:${listing.sourceUrl}` : null,
    parcel?.sourceUrl ? `parcel:${parcel.sourceUrl}` : null,
  ].filter((value): value is string => Boolean(value));

  const context: PropertyComparisonAnalysisContext = {
    version: "property-comparison-analysis-context-v1.0.0",
    propertyId: item.propertyId ?? canonical?.canonical_property_id ?? `unresolved:${item.id}`,
    address,
    profileId: profile.id,
    profileLabel: profile.label,
    propertyType,
    currentUse: parcel?.landUse ?? source?.rawPropertyStyle ?? listing?.propertyType ?? null,
    askingPrice,
    squareFeet,
    acreageText,
    zoning: parcel?.zoning ?? null,
    county: source?.county ?? null,
    state: source?.state ?? parsedState ?? null,
    parcelAccountId: parcel?.accountId ?? listing?.parcelId ?? null,
    sourceRefs: [...new Set(sourceRefs)],
  };

  const packages = embeddedPackages(item.resultSnapshot);
  if (packages) return { context, evidencePackages: packages, missingEvidence: [] };

  const missing = new Set<string>();
  if (!item.propertyId || !address) missing.add("Verified property identity and normalized address are required.");
  if (!propertyType) missing.add("Current or advertised property use is not source-supported.");
  if (askingPrice == null || askingPrice <= 0) missing.add("A current acquisition price or supported proposed purchase price is required.");
  if (squareFeet == null && !acreageText) missing.add("Physical suitability evidence requires building area, parcel acreage, or both as applicable.");
  if (!context.zoning) missing.add("Source-cited zoning and proposed-use permissibility are required.");
  missing.add("Environmental feasibility evidence is required for each proposed enterprise.");
  missing.add("Engineering/code/capacity evidence is required for each proposed enterprise.");
  missing.add("Verified market demand and competition evidence is required for each proposed enterprise.");
  missing.add("Source-supported revenue, labor, employee-benefit, operating-cost, insurance, tax, capital-cost, and inflation evidence is required.");
  missing.add("A source-supported property/project financing scenario is required for DSCR comparison.");
  missing.add("Three distinct governed enterprise evidence packages are required: best single enterprise, best mixed use, and customer vision or distinct alternative.");

  return {
    context,
    evidencePackages: null,
    missingEvidence: [...missing],
  };
}
