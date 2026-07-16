/**
 * Property Brief Intelligence — the free "Place Brief" data assembly
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15, build-order step 1).
 *
 * Master Volume Governance:
 * - Vol II / V: place FACTS with provenance and as-of dates — never eligibility,
 *   never characterizations (amenity-facts founder decision 2026-07-15).
 * - Vol V (source authority): reads FROZEN SNAPSHOTS only. No live fetches at
 *   render; live refresh stays behind the governed ingest commands.
 * - Render-time honesty: expired/unresolved facts degrade to explicit unknowns
 *   with "how you'd find out" guidance — the brief never implies coverage it
 *   does not have.
 *
 * Everything returned here is serializable (server component -> client safe).
 */

import {
  PROPERTY_FLOOD_HISTORIC_FACTS,
  PROPERTY_FLOOD_HISTORIC_PROVENANCE,
} from "./propertyFloodHistoricGenerated";
import {
  PROPERTY_OZ_FACTS,
  PROPERTY_OZ_PROVENANCE,
} from "./propertyOpportunityZonesGenerated";
import { designatedHubzoneForProperty } from "./propertyHubzones";
import { PROPERTY_HUBZONE_PROVENANCE } from "./propertyHubzonesGenerated";
import { nmtcForProperty } from "./propertyNmtc";
import { COUNTY_NAMES, COUNTY_NAMES_PROVENANCE } from "./countyNamesGenerated";
import {
  PROPERTY_TENURE_FACTS,
  PROPERTY_TENURE_PROVENANCE,
} from "./propertyTenureGenerated";
import { COUNTY_FMR, COUNTY_FMR_PROVENANCE } from "./countyFmrGenerated";
import {
  PROPERTY_FOOD_ACCESS_FACTS,
  PROPERTY_FOOD_ACCESS_PROVENANCE,
} from "./propertyFoodAccessGenerated";
import {
  PROPERTY_AMENITY_FACTS,
  PROPERTY_AMENITIES_PROVENANCE,
} from "./propertyAmenitiesGenerated";
import { COUNTY_SCHOOLS, COUNTY_SCHOOLS_PROVENANCE } from "./countySchoolsGenerated";
import {
  AMENITY_RADIUS_MILES,
  amenityLiveLookupEnabled,
  queryAmenitiesLive,
  type AmenityFacts,
} from "./amenityQuery";

export interface BriefFactLine {
  /** Short label, e.g. "Flood zone". */
  label: string;
  /** The fact sentence — facts + program context only, no eligibility. */
  text: string;
  /** Source + as-of provenance line. */
  provenance: string;
  /** "positive" renders emphasized; "neutral" renders plain. */
  tone: "positive" | "neutral" | "caution";
}

export interface BriefUnknownLine {
  /** What we cannot verify yet. */
  label: string;
  /** How the customer finds out (official path, no live fetch by us). */
  howToFind: string;
}

export interface ResolvedCounty {
  name: string;
  state: string;
  fips: string;
  /** The census tract the county was derived from. */
  tractId: string;
}

export interface PropertyBriefIntelligence {
  verifiedFacts: BriefFactLine[];
  unknowns: BriefUnknownLine[];
  /** Per-source "how buying this actually works" explainer paragraphs. */
  mechanics: { heading: string; paragraphs: string[] } | null;
  /** The prose replacement for the pathway chips (founder decision). */
  pathwaysProse: string | null;
  /** County derived from the property's census tract when the record lacked one. */
  resolvedCounty: ResolvedCounty | null;
}

/**
 * County from data we already hold: the OZ ingest geocoded every addressable
 * property to a census tract, and a tract id's first five digits are the
 * state+county FIPS. Joined against the Census county-name snapshot.
 */
export function countyForProperty(canonicalPropertyId: string): ResolvedCounty | null {
  const tractId = PROPERTY_OZ_FACTS[canonicalPropertyId]?.tractId ?? null;
  if (!tractId || tractId.length < 5) return null;
  const fips = tractId.slice(0, 5);
  const county = COUNTY_NAMES[fips];
  if (!county) return null;
  return { name: county.name, state: county.state, fips, tractId };
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

function stateName(code: string | null): string | null {
  if (!code) return null;
  return STATE_NAMES[code.trim().toUpperCase()] ?? null;
}

/** FEMA zone → plain-language flood fact. General program facts only. */
function floodFactLine(propertyId: string): BriefFactLine | null {
  const f = PROPERTY_FLOOD_HISTORIC_FACTS[propertyId];
  if (!f || !f.floodZone) return null;
  const asOf = PROPERTY_FLOOD_HISTORIC_PROVENANCE.asOf;
  if (f.isSfha) {
    return {
      label: "Flood zone",
      text:
        `This location maps to FEMA flood zone ${f.floodZone}, inside a Special Flood Hazard Area. ` +
        `Federally backed mortgages generally require flood insurance in this zone, which adds a real ` +
        `carrying cost — confirm the current map and get an insurance quote before you bid.`,
      provenance: `Source: FEMA National Flood Hazard Layer, snapshot ${asOf} · verify current maps at msc.fema.gov`,
      tone: "caution",
    };
  }
  if (f.floodZone === "D") {
    return {
      label: "Flood zone",
      text:
        `This location maps to FEMA flood zone D — an area where flood hazards are undetermined ` +
        `(no study has been completed). That is not the same as low risk; lenders and insurers treat ` +
        `zone D case-by-case.`,
      provenance: `Source: FEMA National Flood Hazard Layer, snapshot ${asOf} · verify current maps at msc.fema.gov`,
      tone: "caution",
    };
  }
  return {
    label: "Flood zone",
    text:
      `This location maps to FEMA flood zone ${f.floodZone}, outside the Special Flood Hazard Area. ` +
      `Flood insurance is typically optional here, though flooding can occur outside mapped zones.`,
    provenance: `Source: FEMA National Flood Hazard Layer, snapshot ${asOf} · verify current maps at msc.fema.gov`,
    tone: "positive",
  };
}

function historicFactLine(propertyId: string): BriefFactLine | null {
  const f = PROPERTY_FLOOD_HISTORIC_FACTS[propertyId];
  if (!f) return null;
  const asOf = PROPERTY_FLOOD_HISTORIC_PROVENANCE.asOf;
  if (f.inNationalRegisterArea) {
    return {
      label: "Historic status",
      text:
        `This location falls within a National Register of Historic Places area` +
        `${f.historicName ? ` (${f.historicName})` : ""}. Historic designation can constrain exterior ` +
        `changes and can also open preservation incentives — worth understanding before planning renovations.`,
      provenance: `Source: NPS National Register of Historic Places, snapshot ${asOf}`,
      tone: "caution",
    };
  }
  return {
    label: "Historic status",
    text: `No National Register historic-area overlap was found for this location in our snapshot.`,
    provenance: `Source: NPS National Register of Historic Places, snapshot ${asOf}`,
    tone: "neutral",
  };
}

function designationFactLines(propertyId: string): BriefFactLine[] {
  const lines: BriefFactLine[] = [];

  // Opportunity Zone — snapshot stores explicit negatives, so "checked" is known.
  const oz = PROPERTY_OZ_FACTS[propertyId];
  if (oz) {
    lines.push(
      oz.designated
        ? {
            label: "Opportunity Zone",
            text:
              `This location is in a census tract designated as a Qualified Opportunity Zone` +
              `${oz.rural ? " (flagged rural)" : ""}. This is a designation of the place — not ` +
              `eligibility, qualification, or a guaranteed tax benefit for any person.`,
            provenance: `Source: HUD GIS / Treasury (IRC §1400Z-1), snapshot ${PROPERTY_OZ_PROVENANCE.asOf}`,
            tone: "positive",
          }
        : {
            label: "Opportunity Zone",
            text: `This location's census tract is not a designated Opportunity Zone.`,
            provenance: `Source: HUD GIS / Treasury (IRC §1400Z-1), snapshot ${PROPERTY_OZ_PROVENANCE.asOf}`,
            tone: "neutral",
          }
    );
  }

  // HUBZone — render-if-positive snapshot; absence stays honest.
  const hub = designatedHubzoneForProperty(propertyId);
  if (hub) {
    lines.push({
      label: "HUBZone",
      text: hub.isCurrent
        ? `This location is in a designated SBA HUBZone (${hub.hubzoneType}). Relevant mainly if you ` +
          `would run a business here that pursues federal contracts. Designations change — verify ` +
          `current status with SBA.`
        : `This location had a HUBZone designation (${hub.hubzoneType}) that is now historical/expired ` +
          `— it should not be relied on as current. Verify with SBA.`,
      provenance: `Source: SBA HUBZone layer, snapshot ${hub.asOf} · verify at maps.certify.sba.gov`,
      tone: hub.isCurrent ? "positive" : "neutral",
    });
  } else {
    lines.push({
      label: "HUBZone",
      text: `No current HUBZone designation is on record for this location in our snapshot — verify current status with SBA.`,
      provenance: `Source: SBA HUBZone layer, snapshot ${PROPERTY_HUBZONE_PROVENANCE.asOf} · maps.certify.sba.gov`,
      tone: "neutral",
    });
  }

  // NMTC — render-if-positive.
  const nmtc = nmtcForProperty(propertyId);
  if (nmtc) {
    lines.push({
      label: "New Markets Tax Credit area",
      text:
        `This location's census tract qualifies as an NMTC low-income community — a designation that ` +
        `can matter for community-facility and business financing structures. A fact about the place, ` +
        `not eligibility for any person or project.`,
      provenance: `Source: CDFI Fund NMTC eligibility data, snapshot ${nmtc.asOf}`,
      tone: "positive",
    });
  }

  return lines;
}

/**
 * "Daily life nearby" fact line from an amenity fact set — shared by the frozen
 * property snapshot (offline OSM ingest) and the gated LIVE lookup for manually
 * typed addresses. Distance/count facts only; "not mapped" said plainly.
 */
function amenityFactLine(
  amenities: AmenityFacts,
  radiusMiles: number,
  provenance: string
): BriefFactLine {
  const part = (key: string, singular: string, plural: string): string => {
    const cat = amenities[key];
    if (!cat || cat.count === 0) return `no ${plural} mapped`;
    const nearest =
      cat.nearestMiles !== null
        ? ` (nearest${cat.nearestName ? ` ${cat.nearestName}` : ""} ~${cat.nearestMiles} mi)`
        : "";
    return cat.count === 1 ? `1 ${singular}${nearest}` : `${cat.count} ${plural}${nearest}`;
  };
  const parksCount = (amenities.park?.count ?? 0) + (amenities.playground?.count ?? 0);
  return {
    label: "Daily life nearby",
    text:
      `Within ~${radiusMiles} miles: ${part("grocery", "grocery/market", "groceries/markets")}; ` +
      `${part("dining", "restaurant/cafe", "restaurants/cafes/bars")}; ` +
      `${part("pharmacy", "pharmacy", "pharmacies")}; ` +
      `${part("healthcare", "clinic/hospital", "clinics/hospitals")}; ` +
      `${parksCount > 0 ? `${parksCount} parks/playgrounds` : "no parks/playgrounds mapped"}` +
      `${(amenities.dogPark?.count ?? 0) > 0 ? `; ${amenities.dogPark.count} dog park(s)` : ""}` +
      `${(amenities.vet?.count ?? 0) > 0 ? `; vet ~${amenities.vet.nearestMiles} mi` : "; no vet mapped"}. ` +
      `"Not mapped" means absent from OpenStreetMap — rural coverage can lag reality.`,
    provenance,
    tone: "neutral",
  };
}

function mechanicsForSource(
  sourceId: string | null,
  propertyType: string | null
): PropertyBriefIntelligence["mechanics"] {
  const isHome = /home|residential|house/i.test(propertyType ?? "");
  switch ((sourceId ?? "").toLowerCase()) {
    case "hud":
      return {
        heading: "How buying a HUD home actually works",
        paragraphs: [
          `HUD homes are FHA-foreclosed properties resold by the government through HUD Home Store. ` +
            `They are sold by sealed bid, not ordinary offer-and-counter: listings open with a bid ` +
            `period, and during the initial "exclusive" window only owner-occupant buyers (people who ` +
            `will live in the home), nonprofits, and government agencies may bid — investors wait. ` +
            `That window is a genuine structural advantage for a live-in buyer.`,
          `"Price on request" on our card means the current list price and bid deadline live on the ` +
            `HUD Home Store listing itself — they change as bid periods reset, so always read the ` +
            `listing before planning.`,
          `Every HUD home sells strictly as-is: HUD will not make repairs, and your inspection is for ` +
            `your own decision, not a repair negotiation. A general program fact worth knowing: FHA's ` +
            `203(k) loan type exists specifically to finance a purchase and its repairs together — a ` +
            `provider can explain whether that structure fits your situation.`,
          `You bid through a HUD-registered real-estate agent or broker — buyers do not submit bids ` +
            `directly. Earnest-money and timeline rules are stated on each listing.`,
        ],
      };
    case "usda":
      return {
        heading: "How USDA resale properties actually work",
        paragraphs: [
          `These are USDA Rural Development real-estate-owned (REO) properties being resold by the ` +
            `government. Sales run through USDA's process and its listing pages state the current ` +
            `price, condition notes, and offer instructions — always read the source listing.`,
          `Properties are generally sold as-is. Inspections inform your decision rather than a repair ` +
            `negotiation, so budget for condition up front.`,
        ],
      };
    case "gsa":
      return {
        heading: "How federal surplus property sales actually work",
        paragraphs: [
          `This is federal surplus real property offered through GSA auctions (realestatesales.gov). ` +
            `Sales are auction-style with registration, deposit, and bid-period rules stated on each ` +
            `listing — the auction page is the single source of truth for price and timing.`,
          `Surplus property sells strictly as-is, sometimes with special conditions (use restrictions, ` +
            `historic covenants, environmental notices) written into the sale terms. Read the full ` +
            `Invitation for Bids before committing${isHome ? "" : " — especially for former federal facilities"}.`,
        ],
      };
    default:
      return null;
  }
}

function buildUnknowns(args: {
  propertyId: string;
  county: string | null;
  resolvedCounty: ResolvedCounty | null;
  priceLabel: string | null;
  floodResolved: boolean;
  isHome: boolean;
  rentalContextAvailable: boolean;
  amenitiesAvailable: boolean;
  schoolsAvailable: boolean;
}): BriefUnknownLine[] {
  const unknowns: BriefUnknownLine[] = [];
  const countyKnown =
    (args.county && !/unknown/i.test(args.county)) || Boolean(args.resolvedCounty);

  if (!countyKnown) {
    unknowns.push({
      label: "County",
      howToFind:
        "The county determines property taxes, floodplain administration, and permits. The county " +
        "appears on the source listing and on the state's parcel/GIS viewer.",
    });
  }
  if (args.priceLabel && /price on request/i.test(args.priceLabel)) {
    unknowns.push({
      label: "Current price and bid deadline",
      howToFind:
        "Government listings publish price and bid timing on the source listing page, and both can " +
        "change as bid periods reset — check the listing before planning numbers.",
    });
  }
  if (!args.floodResolved) {
    unknowns.push({
      label: "Flood zone",
      howToFind:
        "We have not yet resolved this location against the FEMA flood map snapshot. Look up the " +
        "address at msc.fema.gov (FEMA Map Service Center) — it is free and official.",
    });
  }
  unknowns.push({
    label: "Condition and repair scope",
    howToFind:
      "Government sales are as-is and our snapshot cannot see inside the building. An independent " +
      "inspection (plus a contractor walk-through where repairs look likely) is the only real answer.",
  });
  const taxCounty = args.resolvedCounty
    ? `The ${args.resolvedCounty.name} treasurer/appraiser site`
    : "The county treasurer/appraiser site";
  unknowns.push({
    label: "Annual property taxes",
    howToFind:
      `${taxCounty} lists the parcel's current assessment and tax history — ` +
      "free public records, searchable by address.",
  });
  if (args.isHome && !args.rentalContextAvailable) {
    unknowns.push({
      label: "Rental context",
      howToFind:
        "HUD publishes Fair Market Rents by county and bedroom count — free at huduser.gov " +
        "(datasets → Fair Market Rents). Actual asking rents come from local listings.",
    });
  }
  if (args.isHome && !args.amenitiesAvailable) {
    unknowns.push({
      label: "Daily-life amenities",
      howToFind:
        "Grocery, dining, pharmacy, parks, and vet distances are checkable on any map app — and " +
        "worth an in-person drive at the times of day you'd actually use them.",
    });
  }
  if (args.isHome && !args.schoolsAvailable) {
    unknowns.push({
      label: "Schools",
      howToFind:
        "The NCES school locator (nces.ed.gov/ccd/schoolsearch) lists every public school by " +
        "address; the state Department of Education lists private and charter options and " +
        "publishes the official report cards.",
    });
  }
  if (args.isHome) {
    unknowns.push({
      label: "Private and alternative schools",
      howToFind:
        "Private, parochial, and co-op options are listed by the state Department of Education " +
        "and the NCES private-school survey (nces.ed.gov/surveys/pss) — coverage varies, so a " +
        "local ask often finds options directories miss.",
    });
  }
  if (args.isHome) {
    unknowns.push({
      label: "Water, sewer, and utilities",
      howToFind:
        "Rural homes may use a private well and septic system rather than municipal service. The " +
        "listing, the county health department, and a well/septic inspection establish which — and " +
        "their condition materially affects cost.",
    });
    unknowns.push({
      label: "HOA or covenants",
      howToFind:
        "Recorded covenants and any HOA appear in the county register of deeds records for the " +
        "parcel; the title search during purchase will surface them definitively.",
    });
  }
  return unknowns;
}

function buildPathwaysProse(args: {
  pathwayList: string[];
  stateCode: string | null;
  isHome: boolean;
}): string | null {
  const state = stateName(args.stateCode);
  const place = state ? `in ${state}` : "in this area";
  if (args.isHome) {
    const named =
      args.pathwayList.length > 0
        ? `${args.pathwayList.join(" and ")} came up as context for this listing; more broadly, homes like this`
        : `Homes like this`;
    return (
      `${named} ${place} are typically bought with FHA loans (often the 203(k) variant when repairs ` +
      `are part of the plan), conventional loans, or USDA rural programs. Which of those fits is a ` +
      `personal-situation question — a provider can walk you through it; nothing here is a ` +
      `qualification or approval.`
    );
  }
  const named =
    args.pathwayList.length > 0
      ? `${args.pathwayList.join(" and ")} came up as context for this listing; more broadly, properties like this`
      : `Properties like this`;
  return (
    `${named} ${place} are typically financed through conventional commercial loans, SBA programs, or ` +
    `USDA rural development programs depending on the intended use. A provider can walk you through ` +
    `which applies — nothing here is a qualification or approval.`
  );
}

export function buildPropertyBriefIntelligence(args: {
  propertyId: string | null;
  sourceId: string | null;
  propertyType: string | null;
  priceLabel: string | null;
  county: string | null;
  town: string | null;
  stateCode: string | null;
  pathwayList: string[];
}): PropertyBriefIntelligence {
  const id = args.propertyId ?? "";
  const isHome = /home|residential|house/i.test(args.propertyType ?? "");

  const verifiedFacts: BriefFactLine[] = [];

  // County first — it anchors taxes, floodplain administration, and permits.
  const recordCountyKnown = Boolean(args.county && !/unknown/i.test(args.county));
  const resolvedCounty = id && !recordCountyKnown ? countyForProperty(id) : null;
  if (resolvedCounty) {
    verifiedFacts.push({
      label: "County",
      text:
        `This property sits in ${resolvedCounty.name}, ${resolvedCounty.state} — derived from its ` +
        `census tract (${resolvedCounty.tractId}). The county is where property taxes, floodplain ` +
        `administration, and permits live.`,
      provenance: `Source: U.S. Census Bureau county codes, snapshot ${COUNTY_NAMES_PROVENANCE.asOf} · tract geocoded at OZ ingest ${PROPERTY_OZ_PROVENANCE.asOf}`,
      tone: "positive",
    });
  }

  const flood = id ? floodFactLine(id) : null;
  if (flood) verifiedFacts.push(flood);
  const historic = id ? historicFactLine(id) : null;
  if (historic) verifiedFacts.push(historic);
  if (id) verifiedFacts.push(...designationFactLines(id));

  // Owner-occupancy ("neighbor reality" reframed as an amenity fact — founder
  // decision 2026-07-15). Renders only once the owner-run ACS ingest fills the
  // snapshot; while empty, nothing is implied.
  const tenure = id ? PROPERTY_TENURE_FACTS[id] : undefined;
  if (tenure && isHome) {
    verifiedFacts.push({
      label: "Owner-occupancy",
      text:
        `About ${tenure.ownerOccupiedPct}% of the ${tenure.occupiedUnits.toLocaleString("en-US")} ` +
        `occupied homes in this census tract are owner-occupied. A tract-level Census estimate — ` +
        `useful context for how settled the immediate area is, not a statement about any neighbor.`,
      provenance: `Source: ${PROPERTY_TENURE_PROVENANCE.acsVintage}, snapshot ${PROPERTY_TENURE_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  // Rental context (market FACT with provenance — never a rent guarantee;
  // projections live in paid tiers under forecast labeling). County-keyed via
  // the tract-derived FIPS.
  const fmrFips =
    resolvedCounty?.fips ??
    (id ? PROPERTY_OZ_FACTS[id]?.tractId?.slice(0, 5) ?? null : null);
  // USDA food access — the grocery-access designation that matters most in
  // rural markets. Facts with methodology framing, never adjectives.
  const food = id ? PROPERTY_FOOD_ACCESS_FACTS[id] : undefined;
  if (food && isHome) {
    if (food.lila1And10) {
      verifiedFacts.push({
        label: "Grocery access",
        text:
          `USDA designates this census tract as low-income and low-access under its 1-mile urban / ` +
          `10-mile rural measure — the designation behind the term "food desert." Practically: plan ` +
          `for a real drive to a full grocery store and factor that into daily life here.`,
        provenance: `Source: ${PROPERTY_FOOD_ACCESS_PROVENANCE.source} (${PROPERTY_FOOD_ACCESS_PROVENANCE.atlasVintage}), snapshot ${PROPERTY_FOOD_ACCESS_PROVENANCE.asOf}`,
        tone: "caution",
      });
    } else {
      verifiedFacts.push({
        label: "Grocery access",
        text:
          `This census tract is not designated low-income-and-low-access by USDA's food-access ` +
          `measure${food.urban ? "" : " (rural 10-mile standard)"}.`,
        provenance: `Source: ${PROPERTY_FOOD_ACCESS_PROVENANCE.source} (${PROPERTY_FOOD_ACCESS_PROVENANCE.atlasVintage}), snapshot ${PROPERTY_FOOD_ACCESS_PROVENANCE.asOf}`,
        tone: "neutral",
      });
    }
  }

  // Daily-life amenities — distance/count facts within the snapshot radius.
  // OSM coverage in rural areas can lag; zero means "not mapped", said plainly.
  const amenities = id ? PROPERTY_AMENITY_FACTS[id] : undefined;
  if (amenities && isHome) {
    verifiedFacts.push(
      amenityFactLine(
        amenities,
        PROPERTY_AMENITIES_PROVENANCE.radiusMiles,
        `Source: ${PROPERTY_AMENITIES_PROVENANCE.source}, snapshot ${PROPERTY_AMENITIES_PROVENANCE.asOf} · ${PROPERTY_AMENITIES_PROVENANCE.license}`
      )
    );
  }

  // Schools — LIST + permitted data (enrollment, charter), never ratings
  // (founder decision 2026-07-15).
  const schoolsFips =
    resolvedCounty?.fips ?? (id ? PROPERTY_OZ_FACTS[id]?.tractId?.slice(0, 5) ?? null : null);
  const schools = schoolsFips ? COUNTY_SCHOOLS[schoolsFips] : undefined;
  if (schools && schools.length > 0 && isHome) {
    const townLower = (args.town ?? "").trim().toLowerCase();
    const inTown = townLower
      ? schools.filter((s) => s.city.toLowerCase() === townLower)
      : [];
    const sample = (inTown.length > 0 ? inTown : schools).slice(0, 4);
    const charterCount = schools.filter((s) => s.charter).length;
    verifiedFacts.push({
      label: "Schools",
      text:
        `${schools.length} public school${schools.length === 1 ? "" : "s"} serve this county` +
        `${charterCount > 0 ? ` (${charterCount} charter)` : ""}` +
        `${inTown.length > 0 ? `, including ${inTown.length} in ${args.town}` : ""}. ` +
        `Examples: ${sample
          .map((s) => `${s.name} (${s.city}${s.enrollment != null ? `, ${s.enrollment} students` : ""})`)
          .join("; ")}. ` +
        `Directory facts from federal data — Furlong does not rate schools; the state report card ` +
        `is the official quality source.`,
      provenance: `Source: ${COUNTY_SCHOOLS_PROVENANCE.source} (CCD ${COUNTY_SCHOOLS_PROVENANCE.ccdYear}), snapshot ${COUNTY_SCHOOLS_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  const fmr = fmrFips ? COUNTY_FMR[fmrFips] : undefined;
  if (fmr && isHome) {
    verifiedFacts.push({
      label: "Rental context",
      text:
        `HUD's ${COUNTY_FMR_PROVENANCE.fmrYear} Fair Market Rents for this county` +
        `${fmr.areaName ? ` (${fmr.areaName})` : ""}: about $${fmr.fmr2.toLocaleString("en-US")}/month ` +
        `for a 2-bedroom (1BR $${fmr.fmr1.toLocaleString("en-US")}, 3BR $${fmr.fmr3.toLocaleString("en-US")}). ` +
        `A program rent standard HUD publishes — market context, not a prediction of what this home would rent for.`,
      provenance: `Source: ${COUNTY_FMR_PROVENANCE.source}, ${COUNTY_FMR_PROVENANCE.fmrYear}, snapshot ${COUNTY_FMR_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  return {
    verifiedFacts,
    unknowns: buildUnknowns({
      propertyId: id,
      county: args.county,
      resolvedCounty,
      priceLabel: args.priceLabel,
      floodResolved: Boolean(flood),
      isHome,
      rentalContextAvailable: Boolean(fmr),
      amenitiesAvailable: Boolean(amenities),
      schoolsAvailable: Boolean(schools && schools.length > 0),
    }),
    mechanics: mechanicsForSource(args.sourceId, args.propertyType),
    pathwaysProse: buildPathwaysProse({
      pathwayList: args.pathwayList,
      stateCode: args.stateCode,
      isHome,
    }),
    resolvedCounty,
  };
}

// ── Manual-address ("typed into the portal") Place Brief ────────────────────
// Map-selected properties read frozen property-keyed snapshots; a manually
// typed address has no canonical id, so this async builder resolves the SAME
// living-here facts from the Census geocode instead:
//   • county / FMR / schools   → keyed by the 5-digit county FIPS (direct)
//   • OZ / NMTC / HUBZone / flood / historic → the LIVE verification placeFacts
//   • daily-life amenities     → gated live Overpass lookup (OFF by default)
// Tenure and USDA food-access are property-keyed with no stored tract linkage,
// so for typed addresses they stay honest-unknowns rather than being guessed.

export interface LocationBriefGeocode {
  tractId: string;
  countyFips: string;
  stateFips: string;
  lat: number | null;
  lon: number | null;
}

export interface LocationBriefPlaceFacts {
  opportunityZone?: { tractId: string; rural: boolean; asOf: string } | null;
  nmtc?: { tractId: string; asOf: string } | null;
  hubzone?: {
    hubzoneType: string;
    geoid: string;
    effective: string;
    expiration: string | null;
    isCurrent: boolean;
    asOf: string;
  } | null;
  flood?: { floodZone: string; asOf: string } | null;
  historic?: { historicName: string | null; asOf: string } | null;
}

/** FEMA zone letter → SFHA. A- and V-prefixed zones are Special Flood Hazard Areas. */
function floodFactFromLive(floodZone: string, asOf: string): BriefFactLine {
  const zone = floodZone.trim().toUpperCase();
  const provenance = `Source: FEMA National Flood Hazard Layer, verified ${asOf} · confirm at msc.fema.gov`;
  if (/^[AV]/.test(zone)) {
    return {
      label: "Flood zone",
      text:
        `This address maps to FEMA flood zone ${zone}, inside a Special Flood Hazard Area. ` +
        `Federally backed mortgages generally require flood insurance here, which adds a real ` +
        `carrying cost — get an insurance quote before you bid.`,
      provenance,
      tone: "caution",
    };
  }
  if (zone === "D") {
    return {
      label: "Flood zone",
      text:
        `This address maps to FEMA flood zone D — flood hazard undetermined (no study completed). ` +
        `That is not the same as low risk; lenders and insurers treat zone D case-by-case.`,
      provenance,
      tone: "caution",
    };
  }
  return {
    label: "Flood zone",
    text:
      `This address maps to FEMA flood zone ${zone}, outside the Special Flood Hazard Area. ` +
      `Flood insurance is typically optional here, though flooding can occur outside mapped zones.`,
    provenance,
    tone: "positive",
  };
}

export async function buildLocationBriefIntelligence(args: {
  geocode: LocationBriefGeocode | null;
  placeFacts: LocationBriefPlaceFacts;
  parsed: { street: string; city: string; state: string; zip: string } | null;
  propertyType?: string | null;
  amenityEnv?: NodeJS.ProcessEnv;
}): Promise<PropertyBriefIntelligence> {
  // Manual portal entry is residential-first; treat as a home unless a type
  // that clearly is not a home is supplied.
  const isHome = args.propertyType
    ? /home|residential|house/i.test(args.propertyType)
    : true;
  const geocode = args.geocode;
  const placeFacts = args.placeFacts;
  const stateCode = args.parsed?.state ?? null;
  const town = args.parsed?.city ?? null;

  const verifiedFacts: BriefFactLine[] = [];

  // County — anchors taxes, floodplain administration, permits.
  const countyFips = geocode?.countyFips ?? null;
  const county = countyFips ? COUNTY_NAMES[countyFips] : undefined;
  const resolvedCounty: ResolvedCounty | null =
    county && countyFips && geocode
      ? { name: county.name, state: county.state, fips: countyFips, tractId: geocode.tractId }
      : null;
  if (resolvedCounty) {
    verifiedFacts.push({
      label: "County",
      text:
        `This address sits in ${resolvedCounty.name}, ${resolvedCounty.state} — derived from its ` +
        `census tract (${resolvedCounty.tractId}). The county is where property taxes, floodplain ` +
        `administration, and permits live.`,
      provenance: `Source: U.S. Census Bureau geocoder + county codes, snapshot ${COUNTY_NAMES_PROVENANCE.asOf}`,
      tone: "positive",
    });
  }

  // Flood / historic / OZ / NMTC / HUBZone — from the LIVE verification lookups
  // (present only where the corresponding place-fact gate is activated).
  const floodResolved = Boolean(placeFacts.flood?.floodZone);
  if (placeFacts.flood?.floodZone) {
    verifiedFacts.push(floodFactFromLive(placeFacts.flood.floodZone, placeFacts.flood.asOf));
  }
  if (placeFacts.historic) {
    verifiedFacts.push({
      label: "Historic status",
      text:
        `This address falls within a National Register of Historic Places area` +
        `${placeFacts.historic.historicName ? ` (${placeFacts.historic.historicName})` : ""}. ` +
        `Historic designation can constrain exterior changes and can also open preservation ` +
        `incentives — worth understanding before planning renovations.`,
      provenance: `Source: NPS National Register of Historic Places, verified ${placeFacts.historic.asOf}`,
      tone: "caution",
    });
  }
  if (placeFacts.opportunityZone) {
    verifiedFacts.push({
      label: "Opportunity Zone",
      text:
        `This address is in a census tract designated as a Qualified Opportunity Zone` +
        `${placeFacts.opportunityZone.rural ? " (flagged rural)" : ""}. This is a designation of the ` +
        `place — not eligibility, qualification, or a guaranteed tax benefit for any person.`,
      provenance: `Source: HUD GIS / Treasury (IRC §1400Z-1), verified ${placeFacts.opportunityZone.asOf}`,
      tone: "positive",
    });
  }
  if (placeFacts.nmtc) {
    verifiedFacts.push({
      label: "New Markets Tax Credit area",
      text:
        `This address's census tract qualifies as an NMTC low-income community — a designation that ` +
        `can matter for community-facility and business financing structures. A fact about the place, ` +
        `not eligibility for any person or project.`,
      provenance: `Source: CDFI Fund NMTC eligibility data, verified ${placeFacts.nmtc.asOf}`,
      tone: "positive",
    });
  }
  if (placeFacts.hubzone) {
    verifiedFacts.push({
      label: "HUBZone",
      text: placeFacts.hubzone.isCurrent
        ? `This address is in a designated SBA HUBZone (${placeFacts.hubzone.hubzoneType}). Relevant ` +
          `mainly if you would run a business here that pursues federal contracts. Designations ` +
          `change — verify current status with SBA.`
        : `This address had a HUBZone designation (${placeFacts.hubzone.hubzoneType}) that is now ` +
          `historical/expired — do not rely on it as current. Verify with SBA.`,
      provenance: `Source: SBA HUBZone layer, verified ${placeFacts.hubzone.asOf} · maps.certify.sba.gov`,
      tone: placeFacts.hubzone.isCurrent ? "positive" : "neutral",
    });
  }

  // Daily-life amenities — GATED live Overpass lookup (OFF by default). When the
  // gate is closed or the query fails, amenities become an honest unknown.
  let amenities: AmenityFacts | null = null;
  if (
    isHome &&
    geocode?.lat != null &&
    geocode?.lon != null &&
    amenityLiveLookupEnabled(args.amenityEnv ?? process.env)
  ) {
    amenities = await queryAmenitiesLive(geocode.lat, geocode.lon);
    if (amenities) {
      verifiedFacts.push(
        amenityFactLine(
          amenities,
          AMENITY_RADIUS_MILES,
          `Source: OpenStreetMap via Overpass API (live lookup), © OpenStreetMap contributors (ODbL)`
        )
      );
    }
  }

  // Schools — county-keyed directory facts, list only, never ratings.
  const schools = countyFips ? COUNTY_SCHOOLS[countyFips] : undefined;
  if (schools && schools.length > 0 && isHome) {
    const townLower = (town ?? "").trim().toLowerCase();
    const inTown = townLower ? schools.filter((s) => s.city.toLowerCase() === townLower) : [];
    const sample = (inTown.length > 0 ? inTown : schools).slice(0, 4);
    const charterCount = schools.filter((s) => s.charter).length;
    verifiedFacts.push({
      label: "Schools",
      text:
        `${schools.length} public school${schools.length === 1 ? "" : "s"} serve this county` +
        `${charterCount > 0 ? ` (${charterCount} charter)` : ""}` +
        `${inTown.length > 0 && town ? `, including ${inTown.length} in ${town}` : ""}. ` +
        `Examples: ${sample
          .map((s) => `${s.name} (${s.city}${s.enrollment != null ? `, ${s.enrollment} students` : ""})`)
          .join("; ")}. ` +
        `Directory facts from federal data — Furlong does not rate schools; the state report card ` +
        `is the official quality source.`,
      provenance: `Source: ${COUNTY_SCHOOLS_PROVENANCE.source} (CCD ${COUNTY_SCHOOLS_PROVENANCE.ccdYear}), snapshot ${COUNTY_SCHOOLS_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  // Rental context — county-keyed HUD Fair Market Rents.
  const fmr = countyFips ? COUNTY_FMR[countyFips] : undefined;
  if (fmr && isHome) {
    verifiedFacts.push({
      label: "Rental context",
      text:
        `HUD's ${COUNTY_FMR_PROVENANCE.fmrYear} Fair Market Rents for this county` +
        `${fmr.areaName ? ` (${fmr.areaName})` : ""}: about $${fmr.fmr2.toLocaleString("en-US")}/month ` +
        `for a 2-bedroom (1BR $${fmr.fmr1.toLocaleString("en-US")}, 3BR $${fmr.fmr3.toLocaleString("en-US")}). ` +
        `A program rent standard HUD publishes — market context, not a prediction of what this home would rent for.`,
      provenance: `Source: ${COUNTY_FMR_PROVENANCE.source}, ${COUNTY_FMR_PROVENANCE.fmrYear}, snapshot ${COUNTY_FMR_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  return {
    verifiedFacts,
    unknowns: buildUnknowns({
      propertyId: "",
      county: resolvedCounty?.name ?? null,
      resolvedCounty,
      priceLabel: null,
      floodResolved,
      isHome,
      rentalContextAvailable: Boolean(fmr),
      amenitiesAvailable: Boolean(amenities),
      schoolsAvailable: Boolean(schools && schools.length > 0),
    }),
    mechanics: null,
    pathwaysProse: buildPathwaysProse({ pathwayList: [], stateCode, isHome }),
    resolvedCounty,
  };
}
