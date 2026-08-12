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

import { COUNTY_TAX_CONTEXT } from "./countyTaxContextGenerated";
import { buildPropertyAnalysisHref } from "./propertyAnalysisHref";
import { countyForProperty } from "./propertyBriefIntelligence";
import { PROPERTY_AMENITY_FACTS } from "./propertyAmenitiesGenerated";
import { findCanonicalPropertyById, listExploreDetail } from "./propertyData";
import { PROPERTY_FLOOD_HISTORIC_FACTS } from "./propertyFloodHistoricGenerated";
import { classifyPropertyProfile } from "./propertyProfile";
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
  /** What we can VERIFY about this alternative from here (founder feedback
      2026-07-17: a bare card tells the reader nothing) — flood posture
      compared to the subject, nearest grocery, county tax rate and median.
      Price and condition live on each listing; the card says so. */
  signals: string[];
  isCurrent: boolean;
  vintage: string;
  sourceLabel: string;
  href: string;
}

/** Verifiable differentiators for a candidate, phrased against the subject. */
function candidateSignals(candidateId: string, subjectId: string): string[] {
  const signals: string[] = [];
  const flood = PROPERTY_FLOOD_HISTORIC_FACTS[candidateId];
  const subjectFlood = PROPERTY_FLOOD_HISTORIC_FACTS[subjectId];
  if (flood?.floodZone) {
    let compare = "";
    if (subjectFlood?.floodZone) {
      compare =
        flood.isSfha === subjectFlood.isSfha
          ? " — same flood posture as this one"
          : flood.isSfha
            ? " — IN the flood hazard area, unlike this one"
            : " — outside the flood hazard area, unlike this one";
    } else if (flood.isSfha) {
      compare = " — inside the flood hazard area";
    }
    signals.push(`Flood zone ${flood.floodZone}${compare}`);
  }
  const grocery = PROPERTY_AMENITY_FACTS[candidateId]?.grocery;
  if (grocery?.nearestMiles != null) {
    signals.push(`grocery ~${grocery.nearestMiles} mi`);
  }
  const fips = countyForProperty(candidateId)?.fips;
  const tax = fips ? COUNTY_TAX_CONTEXT[fips] : undefined;
  if (tax) {
    signals.push(
      `county: taxes ~${tax.effectiveRatePct}%/yr, typical home $${Math.round(tax.medianHomeValue / 1000)}k`
    );
  }
  return signals;
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

function toCard(
  listing: ExploreDetailProperty,
  subjectPrice: number | null,
  distanceMiles: number | null,
  subjectId: string
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
    signals: candidateSignals(listing.id, subjectId),
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
  const subjectProfile = classifyPropertyProfile({ propertyType: subjectRecord.propertyType }).id;

  const { listings } = listExploreDetail({ state: subjectRecord.state });
  const scored: Array<{ card: SimilarPropertyCard; score: number }> = [];

  for (const listing of listings) {
    if (listing.id === subjectListing.id) continue;
    // Similar means similar in kind — same canonical property profile
    // (homes against homes, farms against farms, commercial against
    // commercial), via the one classifier every surface shares.
    if (classifyPropertyProfile({ propertyType: listing.propertyType }).id !== subjectProfile) continue;

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

    scored.push({ card: toCard(listing, subjectPrice, distanceMiles, subjectListing.id), score });
  }

  scored.sort((a, b) => b.score - a.score || a.card.id.localeCompare(b.card.id));
  return scored.slice(0, limit).map((entry) => entry.card);
}
