/**
 * propertyFrontDoor — SERVER-side grouped front door (founder direction
 * 2026-07-17: the platform should read as one cohesive whole — groups of
 * cards by property kind, real groups only, never an empty shelf pretending).
 *
 * Groups come from the canonical property-profile classifier — the same
 * taxonomy that drives question banks, cost lanes, and reports — so a
 * visitor who clicks "Commercial" lands on commercial charts asking
 * commercial questions. A profile with zero live inventory simply does not
 * render; it appears the day inventory (or an import path) makes it true.
 */

import { buildPropertyAnalysisHref } from "./propertyAnalysisHref";
import { listExploreDetail } from "./propertyData";
import { classifyPropertyProfile, type PropertyProfileId } from "./propertyProfile";
import type { ExploreDetailProperty } from "./propertyTypes";

export interface FrontDoorListing {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  href: string;
}

export interface FrontDoorGroup {
  profileId: PropertyProfileId;
  /** Group heading as a buyer would say it. */
  label: string;
  count: number;
  featured: FrontDoorListing[];
  /** Explore-hub link, pre-filtered where the hub supports it. */
  browseHref: string;
}

const GROUP_ORDER: PropertyProfileId[] = [
  "residential",
  "farm",
  "commercial",
  "land",
  "hospitality",
  "mobile-home-park",
];

const GROUP_LABELS: Record<PropertyProfileId, string> = {
  residential: "Homes to live in",
  farm: "Farms & ranches",
  commercial: "Commercial properties",
  land: "Land",
  hospitality: "Lodging & hospitality",
  "mobile-home-park": "Mobile home parks",
};

const BROWSE_HREFS: Record<PropertyProfileId, string> = {
  residential: "/explore?category=homes",
  farm: "/explore",
  commercial: "/explore?category=commercial",
  land: "/explore?category=land",
  hospitality: "/explore",
  "mobile-home-park": "/explore",
};

const SOURCE_LABELS: Record<string, string> = {
  hud: "HUD Home Store",
  treasury: "U.S. Treasury auctions",
  "gsa-realestate": "GSA realestatesales.gov",
  usda: "USDA resales portal",
};

function toFrontDoorListing(listing: ExploreDetailProperty): FrontDoorListing {
  const typeTitle = `${listing.propertyType[0]?.toUpperCase() ?? ""}${listing.propertyType.slice(1)}`;
  const title = `${typeTitle} in ${listing.town}`;
  const location = `${listing.town}, ${listing.state}`;
  const priceLabel = listing.price != null ? `$${listing.price.toLocaleString("en-US")}` : listing.priceBand;
  return {
    id: listing.id,
    title,
    location,
    priceLabel,
    href: buildPropertyAnalysisHref({
      propertyId: listing.id,
      title,
      location: `${listing.town}${listing.county && listing.county !== "Unknown" ? `, ${listing.county} County` : ""}, ${listing.state}`,
      propertyType: listing.propertyType,
      priceLabel,
      vintage: listing.vintageStamp,
      sourceLabel: SOURCE_LABELS[listing.sourceId] ?? listing.sourceId,
      pathways: [],
      town: listing.town,
      county: listing.county,
      state: listing.state,
      sourceId: listing.sourceId,
      // Description travels so the chart classifies the SAME profile the
      // front door grouped by (e.g. a "commercial" record that is a motel).
      description: listing.description,
      currentLabel: listing.isCurrent ? "Current government listing" : `${listing.vintageStamp} · historical example`,
    }),
  };
}

/** Real groups only — a group renders only when live inventory exists. */
export function buildFrontDoorGroups(featuredPerGroup = 3): FrontDoorGroup[] {
  const { listings } = listExploreDetail({});
  const buckets = new Map<PropertyProfileId, ExploreDetailProperty[]>();
  for (const listing of listings) {
    const profileId = classifyPropertyProfile({
      propertyType: listing.propertyType,
      description: listing.description,
    }).id;
    const bucket = buckets.get(profileId) ?? [];
    bucket.push(listing);
    buckets.set(profileId, bucket);
  }

  return GROUP_ORDER.filter((profileId) => (buckets.get(profileId)?.length ?? 0) > 0).map(
    (profileId) => {
      const bucket = buckets.get(profileId) as ExploreDetailProperty[];
      const current = bucket.filter((listing) => listing.isCurrent);
      const pool = current.length > 0 ? current : bucket;
      return {
        profileId,
        label: GROUP_LABELS[profileId],
        count: bucket.length,
        featured: pool.slice(0, featuredPerGroup).map(toFrontDoorListing),
        browseHref: BROWSE_HREFS[profileId],
      };
    }
  );
}
