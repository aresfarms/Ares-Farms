/**
 * similarNearbyProperties — "other homes in the same area, a little less or a
 * little more, that might be better options" (founder direction 2026-07-17).
 *
 * SERVER-ONLY selection over the government-listing inventory Furlong already
 * tracks — never a market feed, never a scrape. Coordinates stay server-side
 * (propertyTypes doctrine: captured for provenance, NEVER projected); only a
 * rounded distance-in-miles number ships to the page, which reveals nothing a
 * town name doesn't.
 *
 * Honest label obligation for every rendering surface: these come from the
 * government-listing inventory Furlong tracks (HUD, USDA, Treasury, GSA) —
 * not the whole market. A local agent sees more; this is the slice we can
 * verify.
 */

import { buildPropertyAnalysisHref } from "./propertyAnalysisHref";
import { findCanonicalPropertyById, listExploreDetail } from "./propertyData";
import { priceBand, toExploreDetail, type CanonicalProperty, type ExploreDetailProperty } from "./propertyTypes";

export interface SimilarPropertyCard {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  price: number | null;
  /** Relative to the subject's price when both are known. */
  comparison: "lower" | "similar" | "higher" | null;
  /** Straight-line miles, rounded — only when both records carry coordinates. */
  distanceMiles: number | null;
  isCurrent: boolean;
  vintage: string;
  sourceLabel: string;
  href: string;
}

const SOURCE_LABELS: Record<string, string> = {
  hud: "HUD Home Store",
  treasury: "U.S. Treasury auctions",
  "gsa-realestate": "GSA realestatesales.gov",
  usda: "USDA resales portal",
};

function pathwaysFor(listing: ExploreDetailProperty): string[] {
  const type = listing.propertyType.toLowerCase();
  if (listing.sourceId === "usda") return ["USDA"];
  if (listing.sourceId === "hud") return ["Conventional", "FHA context"];
  if (/commercial|business|hospitality/.test(type)) return ["SBA", "Conventional"];
  if (/land|farm|ranch/.test(type)) return ["USDA", "Conventional"];
  return ["Conventional"];
}

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

function coordsOf(c: CanonicalProperty): { lat: number; lon: number } | null {
  const r = c.source_records[0];
  return r.latitude != null && r.longitude != null ? { lat: r.latitude, lon: r.longitude } : null;
}

const HOME_SHAPED = /home|house|resid|multi|cottage|cabin/i;

function toCard(
  listing: ExploreDetailProperty,
  subjectPrice: number | null,
  distanceMiles: number | null
): SimilarPropertyCard {
  const typeTitle = `${listing.propertyType[0]?.toUpperCase() ?? ""}${listing.propertyType.slice(1)}`;
  const location = `${listing.town}${listing.county && listing.county !== "Unknown" ? `, ${listing.county} County` : ""}, ${listing.state}`;
  const sourceLabel = SOURCE_LABELS[listing.sourceId] ?? listing.sourceId;
  let comparison: SimilarPropertyCard["comparison"] = null;
  if (subjectPrice != null && listing.price != null) {
    const ratio = listing.price / subjectPrice;
    comparison = ratio < 0.85 ? "lower" : ratio > 1.15 ? "higher" : "similar";
  }
  return {
    id: listing.id,
    title: `${typeTitle} in ${listing.town}`,
    location,
    priceLabel:
      listing.price != null ? `$${listing.price.toLocaleString("en-US")}` : priceBand(listing.price),
    price: listing.price,
    comparison,
    distanceMiles,
    isCurrent: listing.isCurrent,
    vintage: listing.vintageStamp,
    sourceLabel,
    href: buildPropertyAnalysisHref({
      propertyId: listing.id,
      title: `${typeTitle} in ${listing.town}`,
      location,
      propertyType: listing.propertyType,
      priceLabel: listing.price != null ? `$${listing.price.toLocaleString("en-US")}` : listing.priceBand,
      vintage: listing.vintageStamp,
      sourceLabel,
      pathways: pathwaysFor(listing),
      town: listing.town,
      county: listing.county,
      state: listing.state,
      sourceId: listing.sourceId,
      currentLabel: listing.isCurrent
        ? "Current government listing"
        : `${listing.vintageStamp} · historical example`,
    }),
  };
}

/**
 * Ranked alternatives for a subject property in the canonical inventory.
 * Ranking: same county beats same state; nearer (when measurable) beats
 * farther; a price in the subject's neighborhood (roughly half to 1.6×)
 * beats a distant one; current listings beat historical snapshots.
 */
export function similarNearbyProperties(
  subjectId: string,
  limit = 4
): SimilarPropertyCard[] {
  const subject = findCanonicalPropertyById(subjectId);
  if (!subject) return [];
  const subjectRecord = subject.source_records[0];
  const subjectListing = toExploreDetail(subject);
  const subjectPrice = subjectRecord.price;
  const subjectCoords = coordsOf(subject);
  const subjectHomeShaped = HOME_SHAPED.test(subjectRecord.propertyType);

  const { listings } = listExploreDetail({ state: subjectRecord.state });
  const scored: Array<{ card: SimilarPropertyCard; score: number }> = [];

  for (const listing of listings) {
    if (listing.id === subjectListing.id) continue;
    // Similar means similar in kind: home-shaped subjects compare against
    // home-shaped alternatives; land/farm subjects against land/farm.
    if (subjectHomeShaped !== HOME_SHAPED.test(listing.propertyType)) continue;

    let distanceMiles: number | null = null;
    if (subjectCoords) {
      const candidate = findCanonicalPropertyById(listing.id);
      const candidateCoords = candidate ? coordsOf(candidate) : null;
      if (candidateCoords) {
        distanceMiles = Math.round(
          haversineMiles(subjectCoords.lat, subjectCoords.lon, candidateCoords.lat, candidateCoords.lon)
        );
      }
    }

    let score = 0;
    if (listing.county === subjectRecord.county && listing.county !== "Unknown") score += 40;
    if (distanceMiles != null) score += Math.max(0, 40 - Math.min(distanceMiles, 40));
    if (subjectPrice != null && listing.price != null) {
      const ratio = listing.price / subjectPrice;
      if (ratio >= 0.5 && ratio <= 1.6) score += 30 - Math.round(Math.abs(Math.log(ratio)) * 40);
    } else if (listing.price != null) {
      score += 10; // a knowable price is worth something when the subject has none
    }
    if (listing.isCurrent) score += 15;
    if (listing.propertyType === subjectRecord.propertyType) score += 10;

    scored.push({ card: toCard(listing, subjectPrice, distanceMiles), score });
  }

  scored.sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
  return scored.slice(0, limit).map((entry) => entry.card);
}
