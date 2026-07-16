export type PropertyAnalysisContextInput = {
  propertyId: string;
  title: string;
  location: string;
  propertyType: string;
  priceLabel: string;
  vintage: string;
  sourceLabel: string;
  pathways: string[];
  town?: string | null;
  county?: string | null;
  state?: string | null;
  sourceId?: string | null;
  listingUrl?: string | null;
  exactAddress?: string | null;
  description?: string | null;
  categoryLabel?: string | null;
  currentLabel?: string | null;
  importScreeningStatus?: "normal" | "reroute" | null;
  importScreeningCategory?: "standard-property" | "special-asset" | "restricted-asset" | null;
  importScreeningSummary?: string | null;
  importScreeningReasons?: string[] | null;
  salePosture?: "listing-source-present" | "official-disposition-source" | "unverified-public-claim" | "not-for-sale-likely" | null;
  manualReviewRequired?: boolean | null;
  manualReviewSummary?: string | null;
  sourceVerificationStatus?: "matched-approved-source-record" | "verified-address-only" | null;
  matchedSourceRecordId?: string | null;
  listingSourceCandidate?: string | null;
  listingSourceCandidateStatus?:
    | "allowlisted-marketplace-source-detected"
    | "allowlisted-address-only"
    | "generic-quarantined"
    | null;
  listingSourceGovernanceStatus?:
    | "live-fetch-blocked-by-governance"
    | "not-in-governed-source-stack"
    | null;
  listingSourceMatchStatus?:
    | "approved-source-match-established"
    | "approved-source-match-not-yet-established"
    | null;
};

export function buildPropertyAnalysisHref(property: PropertyAnalysisContextInput): string {
  const params = new URLSearchParams({
    mode: "possibilities",
    entry: "property-brief",
    propertyId: property.propertyId,
    propertyType: property.propertyType,
    location: property.location,
    title: property.title,
    priceLabel: property.priceLabel,
    vintage: property.vintage,
    sourceLabel: property.sourceLabel,
    pathways: property.pathways.join(","),
  });
  if (property.town) params.set("town", property.town);
  if (property.county) params.set("county", property.county);
  if (property.state) params.set("state", property.state);
  if (property.sourceId) params.set("sourceId", property.sourceId);
  if (property.categoryLabel) params.set("categoryLabel", property.categoryLabel);
  if (property.currentLabel) params.set("currentLabel", property.currentLabel);
  if (property.exactAddress) params.set("exactAddress", property.exactAddress);
  if (property.description) params.set("description", property.description.slice(0, 280));
  if (property.listingUrl) params.set("listingUrl", property.listingUrl);
  if (property.importScreeningStatus) params.set("importScreeningStatus", property.importScreeningStatus);
  if (property.importScreeningCategory) params.set("importScreeningCategory", property.importScreeningCategory);
  if (property.importScreeningSummary) params.set("importScreeningSummary", property.importScreeningSummary);
  if (property.importScreeningReasons && property.importScreeningReasons.length > 0) {
    params.set("importScreeningReasons", property.importScreeningReasons.join("||"));
  }
  if (property.salePosture) params.set("salePosture", property.salePosture);
  if (property.manualReviewRequired) params.set("manualReviewRequired", "true");
  if (property.manualReviewSummary) params.set("manualReviewSummary", property.manualReviewSummary);
  if (property.sourceVerificationStatus) {
    params.set("sourceVerificationStatus", property.sourceVerificationStatus);
  }
  if (property.matchedSourceRecordId) {
    params.set("matchedSourceRecordId", property.matchedSourceRecordId);
  }
  if (property.listingSourceCandidate) {
    params.set("listingSourceCandidate", property.listingSourceCandidate);
  }
  if (property.listingSourceCandidateStatus) {
    params.set("listingSourceCandidateStatus", property.listingSourceCandidateStatus);
  }
  if (property.listingSourceGovernanceStatus) {
    params.set(
      "listingSourceGovernanceStatus",
      property.listingSourceGovernanceStatus
    );
  }
  if (property.listingSourceMatchStatus) {
    params.set("listingSourceMatchStatus", property.listingSourceMatchStatus);
  }
  return `/discover?${params.toString()}`;
}
