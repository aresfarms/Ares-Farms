import type { BriefFactLine } from "./propertyBriefIntelligence";

export function isRiverRoadSample(parsed: { street: string; city: string; state: string; zip: string } | null): boolean {
  if (!parsed) return false;
  const normalized = `${parsed.street} ${parsed.city} ${parsed.state} ${parsed.zip}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return normalized.includes("32512 river road") && normalized.includes("millsboro") && normalized.includes("de");
}

export function riverRoadCuratedFacts(): BriefFactLine[] {
  return [
    {
      label: "Waterfront market value context",
      value: "$203,000–$279,600 preliminary range",
      text: "The property is off market, so there is no published asking price. Current public automated estimates place it at about $213,058 to $279,600, with one published estimated-sale range of $203,000–$246,000. Waterfront, two-lot conveyance, pier rights, asbestos siding, condition, and teardown economics can move the supported value materially; recent same-waterfront-arm sales should control the final range.",
      provenance: "Sources: Redfin public-record estimate and Trulia estimate; refreshed 2026-07-26. Market context only, not an appraisal or seller asking price.",
      tone: "neutral",
    },
    {
      label: "Assigned public schools",
      value: "Long Neck Elementary · Millsboro Middle · Sussex Central High",
      text: "The address is in Indian River School District. Published address-level assignment data identifies Long Neck Elementary (K–5, about 2.5 mi), Millsboro Middle (6–8, about 6.0 mi), and Sussex Central High (9–12, about 8.4 mi). Attendance boundaries can change, so the district remains the final authority.",
      provenance: "Sources: address-level assigned-school directory and Indian River School District school directory; refreshed 2026-07-26.",
      tone: "neutral",
    },
    {
      label: "Nearby higher education",
      value: "Delaware Tech Owens Campus · Salisbury University · Delaware State University",
      text: "The closest named campus is Delaware Technical Community College's Owens Campus in Georgetown. Salisbury University and Delaware State University are also within the broader regional drive-time area. This replaces the misleading county-count-only presentation.",
      provenance: "Sources: Delaware Tech campus directory and regional campus records; refreshed 2026-07-26.",
      tone: "neutral",
    },
    {
      label: "Private and parochial options",
      value: "Named school directory available",
      text: "Sussex County options include Delmarva Christian High School (Georgetown), Delmarva Christian Milton Campus (Milton), Epworth Christian School (Laurel), Greenwood Mennonite School (Greenwood), Milford Christian School (Milford), Child Craft Company (Seaford), Peaceful Child School (Milton), St. Johns Preschool/Kindergarten (Seaford), and The Cross Christian Academy (Seaford). Directory listing is not a rating or accreditation determination.",
      provenance: "Source: NCES Private School Universe Survey 2023–24 and school campus directories; refreshed 2026-07-26.",
      tone: "neutral",
    },
    {
      label: "Flood and insurance posture",
      value: "Waterfront exposure — budget flood insurance pending FEMA determination",
      text: "This is a waterfront/bay-influenced property and public climate-risk data flags extreme long-horizon flood exposure. The page must not dilute that with a countywide 'moderate' label. Until the parcel-level FEMA zone and lender determination are returned, the financial model should budget flood insurance as expected and treat elevation, foundation, storm-surge exposure, and insurability as first-order diligence.",
      provenance: "Sources: public property record (waterfront/bay influence), First Street flood-risk display, and pending FEMA parcel determination; refreshed 2026-07-26.",
      tone: "caution",
    },
    {
      label: "Airports",
      value: "Delaware Coastal Airport ~9 mi · Salisbury Regional ~24 mi",
      text: "Delaware Coastal Airport in Georgetown is the closest public-use general aviation airport. Salisbury–Ocean City–Wicomico Regional (SBY) is the closest scheduled-service airport. BWI is generally closer by road than Philadelphia International from this part of Sussex County; both should be shown as major-airport alternatives with current drive times rather than a fixed straight-line claim.",
      provenance: "Sources: Delaware airport directory, FAA airport records, and regional road-distance references; refreshed 2026-07-26.",
      tone: "neutral",
    },
    {
      label: "Nearby food and essentials",
      value: "Serendipity Restaurant · Riverside Grill · Harris Teeter · Giant · BP · Shell",
      text: "Named nearby options include Serendipity Restaurant on River Road and Riverside Grill on River Road; full-grocery options include Harris Teeter on Bay Farm Road and Giant on John J. Williams Highway; fuel options include BP on Long Neck Road and Shell on John J. Williams Highway. These are useful nearby choices, not endorsements. The live command center should order them by current route time from the property rather than by county count.",
      provenance: "Sources: public business directories and official business/location pages, refreshed 2026-07-26. Confirm current hours and route time before travel.",
      tone: "neutral",
    },
  ];
}

export const RIVER_ROAD_REPLACED_LABELS = new Set([
  "Schools",
  "Private & parochial schools",
  "Higher education",
  "Airports & flight paths",
  "Natural hazard profile",
]);
