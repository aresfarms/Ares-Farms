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
      value: "FEMA Zone AE · Special Flood Hazard Area",
      text: "The live FEMA National Flood Hazard Layer lookup places this property in Zone AE, inside a Special Flood Hazard Area. The financial model should therefore budget flood insurance as expected for financed acquisition and treat elevation, foundation, storm-surge exposure, and property-specific insurability as first-order diligence. The lender determination and insurance quote remain closing-verification items; the FEMA zone itself is resolved.",
      provenance: "Source: FEMA National Flood Hazard Layer live address lookup, verified 2026-07-27; lender flood determination and property-specific insurance pricing remain pending.",
      tone: "caution",
    },
    {
      label: "Land, lots, and tax-parcel profile",
      value: "0.4091 acres / 17,820 sq ft · Lots 23 & 24 · one tax parcel · Riverdale Park",
      text: "The public property record describes 17,820 square feet (0.4091 acres) in the Riverdale Park subdivision. Its legal description is Lots 23 and 24, while both lots are carried under one assessor parcel number, 234-34.12-56.00, for assessment and tax-record purposes. The site is waterfront. The customer reports a deeded pier; the deed, legal description, recorded plat, and applicable pier or riparian permits still control whether both lots and the claimed pier rights convey.",
      provenance: "Sources: Sussex County-derived public property records, legal description LOTS 23 24 RIVERDALE PK W/IMP, APN 234-34.12-56.00; refreshed 2026-07-27. Deed, plat, and pier/riparian rights remain document-level verification.",
      tone: "caution",
    },
    {
      label: "Annual property taxes",
      value: "$1,287 for 2025 · assessed value $301,250",
      text: "Current public-record feeds report 2025 property taxes of $1,287 and a 2025 assessed value of $301,250 for parcel 234-34.12-56.00. The assessment changed materially from the prior cycle, so the county tax portal should remain the final pre-closing refresh source rather than treating taxes as unknown.",
      provenance: "Sources: Sussex County-derived public property records reported by Redfin and Zillow; refreshed 2026-07-27. County portal remains controlling for the current bill and any later reassessment.",
      tone: "neutral",
    },
    {
      label: "Access and recorded easement posture",
      value: "River Road frontage identified · recorded easements still require deed review",
      text: "The parcel is addressed directly on River Road and current property-record feeds do not identify a shared-road or HOA-maintained access obligation. That resolves the generic shared-driveway warning. Any utility, drainage, access, or riparian easement recorded against Lots 23 and 24 still belongs in the deed and title review.",
      provenance: "Sources: Sussex County parcel/address mapping and public property-record feeds; refreshed 2026-07-27. Recorded easements remain document-level title evidence.",
      tone: "neutral",
    },
    {
      label: "HOA and covenant posture",
      value: "No HOA dues identified in current public-record feeds",
      text: "Current public property feeds identify no HOA dues for this address. Furlong should report that result rather than asking the customer to start from zero, while still requiring the deed and title commitment to confirm whether any recorded subdivision or waterfront covenants apply.",
      provenance: "Sources: Redfin and Trulia public property records; refreshed 2026-07-27. Recorded covenants remain subject to deed/title confirmation.",
      tone: "neutral",
    },
    {
      label: "Known condition and repair posture",
      value: "Major rehabilitation or teardown analysis warranted",
      text: "The existing residence has been described as a possible teardown, with asbestos exterior shingles reported. That is enough to model the property as a major-repair or replacement scenario now. An inspection, asbestos survey, contractor scope, demolition estimate, and as-completed appraisal refine cost and financing; they do not make the current condition posture unknown.",
      provenance: "Source: customer-provided property condition information, recorded 2026-07-26; professional inspection and hazardous-material verification remain required before reliance.",
      tone: "caution",
    },
    {
      label: "Nearby public works screening",
      value: "Regional US 113 projects identified · no direct River Road parcel impact confirmed",
      text: "DelDOT identifies active or planned Millsboro-area US 113 corridor work, including the US 113 at SR 20 grade-separated intersection and widening from Dagboro Road to Hardscrabble Road. The current screening did not identify a project specifically taking or rebuilding this River Road parcel. Furlong should show the regional projects and the absence of a confirmed direct parcel impact, then refresh the check before contract or closing.",
      provenance: "Sources: Delaware Department of Transportation US 113 North/South Study and Corridor Capacity Preservation Program, checked 2026-07-27; parcel-specific impact not confirmed.",
      tone: "neutral",
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
  "Shared access and easements",
  "Annual property taxes",
  "HOA or covenants",
]);
