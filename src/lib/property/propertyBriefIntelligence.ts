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
import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "./commodityPricesGenerated";
import { COUNTY_BROADBAND, COUNTY_BROADBAND_PROVENANCE } from "./countyBroadbandGenerated";
import { STATE_CROP_CONDITIONS, STATE_CROP_CONDITIONS_PROVENANCE } from "./stateCropConditionsGenerated";
import { STATE_DROUGHT, STATE_DROUGHT_PROVENANCE } from "./stateDroughtGenerated";
import { STATE_FARMLAND, STATE_FARMLAND_PROVENANCE } from "./stateFarmlandGenerated";
import { STATE_GRAIN_BIDS, STATE_GRAIN_BIDS_PROVENANCE } from "./stateGrainBidsGenerated";
import { COUNTY_COLLEGES, COUNTY_COLLEGES_PROVENANCE } from "./countyCollegesGenerated";
import { PROPERTY_AIRPORTS, PROPERTY_AIRPORTS_PROVENANCE, type PropertyAirportFact } from "./propertyAirportsGenerated";
import { US_AIRPORTS } from "./usAirportsGenerated";
import {
  PROPERTY_MILITARY_BASES,
  PROPERTY_MILITARY_BASES_PROVENANCE,
  type PropertyMilitaryBaseFact,
} from "./propertyMilitaryBasesGenerated";
import { US_MILITARY_BASES } from "./usMilitaryBasesGenerated";
import { PROPERTY_SOIL } from "./propertySoilGenerated";
import { PROPERTY_GEO_SETTING, PROPERTY_GEO_SETTING_PROVENANCE } from "./propertyGeoSettingGenerated";
import { COUNTY_NAMES, COUNTY_NAMES_PROVENANCE } from "./countyNamesGenerated";
import { findCanonicalPropertyById } from "./propertyData";
import { townCharacterFact } from "./townCharacterCurated";
import { stateNarrativeFact } from "./stateNarrativeCurated";
import { broadbandLiveLookupEnabled, queryBroadbandLive } from "./broadbandLookup";
import {
  classifyPropertyProfile,
  profileCostLines,
  profileQuestionLines,
  type PropertyProfile,
} from "./propertyProfile";
import { parseAcres } from "./propertyTypes";
import {
  answerFarmQuestions,
  farmBestUse,
  type FarmBestUse,
  type FarmPropertyAnswer,
} from "./farmAnswerEngine";
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
import { COUNTY_CASH_RENTS, COUNTY_CASH_RENTS_PROVENANCE } from "./countyCashRentsGenerated";
import { COUNTY_YIELDS } from "./countyYieldsGenerated";
import {
  answerResidentialQuestions,
  answerCommercialQuestions,
  type LaneAnswer,
} from "./laneAnswerEngine";
import { COUNTY_PRIVATE_SCHOOLS, COUNTY_PRIVATE_SCHOOLS_PROVENANCE } from "./countyPrivateSchoolsGenerated";
import { COUNTY_HAZARD_RISK, COUNTY_HAZARD_RISK_PROVENANCE } from "./countyHazardRiskGenerated";
import { STATE_ELECTRICITY, STATE_ELECTRICITY_PROVENANCE } from "./stateElectricityGenerated";
import {
  AMENITY_RADIUS_MILES,
  amenityLiveLookupEnabled,
  queryAmenitiesLive,
  type AmenityFacts,
} from "./amenityQuery";

export interface BriefFactLine {
  /** Short label, e.g. "Flood zone". */
  label: string;
  /**
   * The scannable headline value ("Zone X — outside hazard area"). Redesign
   * round 2 (2026-07-17): the page must SCAN, not read — the value carries
   * the answer; the sentence and provenance sit behind an expand.
   */
  value: string;
  /** The full fact sentence — facts + program context only, no eligibility. */
  text: string;
  /** Source + as-of provenance line. */
  provenance: string;
  /** "positive" renders emphasized; "neutral" renders plain. */
  tone: "positive" | "neutral" | "caution";
}

export interface BriefUnknownLine {
  /** What we cannot verify yet. */
  label: string;
  /** Short pointer to the official source ("County treasurer site"). */
  pointer: string;
  /** Stable official URL for the pointer, when one exists nationally. County
      offices have no stable national URL scheme — those stay text. */
  url?: string;
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

/**
 * A compact Answer-card chip: `short` is the at-a-glance text, `fact` is the
 * full verified line (with provenance) it expands to. Chips are ALWAYS backed
 * by a verified fact — interpretation never gets a chip (redesign rule:
 * Verified / Inferred / Unknown stay visually separate).
 */
export interface BriefChip {
  short: string;
  fact: BriefFactLine;
}

/** One row of the "living here" distance strip — distances and counts only. */
export interface LivingHereItem {
  label: string;
  value: string;
}

export interface LivingHereStrip {
  radiusMiles: number;
  items: LivingHereItem[];
  /** ODbL requires attribution wherever these render. */
  attribution: string;
}

/**
 * A typical diligence cost line — PLAIN-LANGUAGE GUIDANCE, never a fact:
 * national ballpark ranges so a buyer can budget the answers to the
 * unknowns. Always rendered under a guidance label with the negotiation
 * note; never sourced, never a quote.
 */
export interface DiligenceCostLine {
  label: string;
  range: string;
  note: string | null;
}

export interface PropertyBriefIntelligence {
  verifiedFacts: BriefFactLine[];
  unknowns: BriefUnknownLine[];
  /**
   * Per-source "how buying this actually works" explainer. stepTitles align
   * 1:1 with paragraphs — the title scans, the paragraph explains on expand.
   */
  mechanics: { heading: string; paragraphs: string[]; stepTitles: string[] } | null;
  /** The prose replacement for the pathway chips (founder decision). */
  pathwaysProse: string | null;
  /**
   * Farm-lane "questions farmers actually ask", answered FOR THIS PROPERTY
   * (acreage/county/cash-rent-grounded, with honest "confirm at X" fallbacks).
   * Null for non-farm-shaped properties. The lane PAGE keeps its generic cards;
   * this is the per-property answer layer inside the analysis + PDF.
   */
  farmEnterpriseAnswers: FarmPropertyAnswer[] | null;
  /** Highest-and-best-USE ranking for a farm/land parcel — every realistic
      enterprise scored for THIS parcel, the best named, incl. change-of-use,
      solar, and developer-friendliness. Null for non-farm-shaped properties. */
  farmBestUse: FarmBestUse | null;
  /** Residential lane "burning questions" answered FOR THIS property (cost-to-own,
      flood, schools, rent, daily life, resale) from the facts we hold, with honest
      "confirm at X" fallbacks. Null unless the property is residential-shaped. */
  residentialAnswers: LaneAnswer[] | null;
  /** Commercial lane "burning questions" answered FOR THIS property (use/zoning,
      income, financing fit, deal-killers, location). Null unless commercial. */
  commercialAnswers: LaneAnswer[] | null;
  /** County derived from the property's census tract when the record lacked one. */
  resolvedCounty: ResolvedCounty | null;
  /** Up to four verified-fact chips for the Answer card (flood, grocery, schools, rent). */
  chips: BriefChip[];
  /** Amenity distances for the "living here" strip; null until amenities resolve. */
  livingHere: LivingHereStrip | null;
  /** Typical costs of answering the unknowns — guidance, not quotes. */
  diligenceCosts: DiligenceCostLine[];
  /** Canonical property profile (axis 1 of the tailoring philosophy) —
      drives the per-type question bank; optional for payload back-compat. */
  profile?: PropertyProfile | null;
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
      value: `Zone ${f.floodZone} — inside hazard area`,
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
      value: "Zone D — hazard undetermined",
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
    value: `Zone ${f.floodZone} — outside hazard area`,
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
      value: "In a National Register area",
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
    value: "No overlap found",
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
            value: `Designated QOZ${oz.rural ? " (rural)" : ""}`,
            text:
              `This location is in a census tract designated as a Qualified Opportunity Zone` +
              `${oz.rural ? " (flagged rural)" : ""}. This is a designation of the place — not ` +
              `eligibility, qualification, or a guaranteed tax benefit for any person.`,
            provenance: `Source: HUD GIS / Treasury (IRC §1400Z-1), snapshot ${PROPERTY_OZ_PROVENANCE.asOf}`,
            tone: "positive",
          }
        : {
            label: "Opportunity Zone",
            value: "Not designated",
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
      value: hub.isCurrent ? `Designated — ${hub.hubzoneType}` : `Expired — ${hub.hubzoneType}`,
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
      value: "None on record",
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
      value: "Qualifies — low-income community",
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
  const shortBits = [
    amenities.grocery?.nearestMiles != null ? `grocery ${amenities.grocery.nearestMiles} mi` : "no grocery mapped",
    amenities.dining?.nearestMiles != null ? `dining ${amenities.dining.nearestMiles} mi` : null,
    amenities.pharmacy?.nearestMiles != null ? `pharmacy ${amenities.pharmacy.nearestMiles} mi` : null,
  ].filter(Boolean).join(" · ");
  return {
    label: "Daily life nearby",
    value: shortBits.charAt(0).toUpperCase() + shortBits.slice(1),
    text:
      `Within ~${radiusMiles} miles: ${part("grocery", "grocery/market", "groceries/markets")}; ` +
      `${part("dining", "restaurant/cafe", "restaurants/cafes")}; ` +
      `${part("pharmacy", "pharmacy", "pharmacies")}; ` +
      `${part("healthcare", "clinic/hospital", "clinics/hospitals")}; ` +
      `${parksCount > 0 ? `${parksCount} parks/playgrounds` : "no parks/playgrounds mapped"}` +
      `${(amenities.dogPark?.count ?? 0) > 0 ? `; ${amenities.dogPark.count} dog park(s)` : ""}` +
      `${(amenities.vet?.count ?? 0) > 0 ? `; vet ~${amenities.vet.nearestMiles} mi` : "; no vet mapped"}. ` +
      `"Not mapped" means absent from OpenStreetMap — rural coverage can lag reality, and ` +
      `venue names and categories are as the map community tagged them; check a place before ` +
      `you count on it.`,
    provenance,
    tone: "neutral",
  };
}

/**
 * "Living here" strip from an amenity fact set — the same distances the
 * amenity sentence carries, re-cut as scannable rows (eye-tracking: distances
 * beat prose). Fair-housing rule: labels are activities, values are distances
 * and counts — never characterizations of the area or its people.
 */
function livingHereStrip(amenities: AmenityFacts, radiusMiles: number): LivingHereStrip {
  const items: LivingHereItem[] = [];
  const nearest = (key: string): string | null => {
    const cat = amenities[key];
    if (!cat || cat.count === 0 || cat.nearestMiles === null) return null;
    return `${cat.nearestName ? `${cat.nearestName} · ` : ""}${cat.nearestMiles} mi`;
  };
  const grocery = nearest("grocery");
  if (grocery) items.push({ label: "Grocery run", value: grocery });
  const dining = nearest("dining");
  if (dining) items.push({ label: "Dinner out", value: dining });
  const pharmacy = nearest("pharmacy");
  if (pharmacy) items.push({ label: "Pharmacy", value: pharmacy });
  const healthcare = nearest("healthcare");
  if (healthcare) items.push({ label: "Clinic or hospital", value: healthcare });
  const parksCount = (amenities.park?.count ?? 0) + (amenities.playground?.count ?? 0);
  if (parksCount > 0) {
    items.push({ label: "Parks & playgrounds", value: `${parksCount} within ${radiusMiles} mi` });
  }
  // Getting around (founder direction 2026-07-17): can you live here without
  // a car? Renders only when the snapshot carries the transit categories
  // (older snapshots predate them and simply omit the line).
  const bus = amenities.busStop;
  const rail = amenities.railStation;
  if (bus || rail) {
    const bits: string[] = [];
    if (bus && bus.count > 0 && bus.nearestMiles !== null) bits.push(`bus stop ${bus.nearestMiles} mi`);
    if (rail && rail.count > 0 && rail.nearestMiles !== null) bits.push(`rail/metro ${rail.nearestMiles} mi`);
    items.push({
      label: "Getting around",
      value: bits.length > 0 ? bits.join(" · ") : `no transit mapped within ${radiusMiles} mi — plan on a car`,
    });
  }
  // Right-next-door checks (founder 2026-07-17): active tracks close enough
  // to hear, and whether a mapped road reaches the parcel at all.
  const railLine = amenities.railLine;
  if (railLine && railLine.count > 0 && railLine.nearestMiles !== null && railLine.nearestMiles <= 0.5) {
    items.push({
      label: "Rail line",
      value: `active tracks ~${railLine.nearestMiles} mi — visit and listen`,
    });
  }
  const road = amenities.roadNearby;
  if (road && road.count === 0) {
    items.push({
      label: "Road access",
      value: "no mapped road within ~800 ft — confirm how you legally get there",
    });
  }
  const vet = nearest("vet");
  const dogParks = amenities.dogPark?.count ?? 0;
  if (vet || dogParks > 0) {
    items.push({
      label: "Pets",
      value: [vet ? `vet ${vet}` : null, dogParks > 0 ? `${dogParks} dog park${dogParks === 1 ? "" : "s"}` : null]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return {
    radiusMiles,
    items,
    attribution: "© OpenStreetMap contributors (ODbL) — \"not mapped\" means absent from OpenStreetMap; names and categories are as the map community tagged them, so check a place before you count on it.",
  };
}

/** Find a verified fact by label and pair it with chip-length text. */
function chipFrom(
  facts: BriefFactLine[],
  label: string,
  short: string | null
): BriefChip | null {
  if (!short) return null;
  const fact = facts.find((f) => f.label === label);
  return fact ? { short, fact } : null;
}

/**
 * The four Answer-card chips: flood posture, nearest grocery, schools, and
 * rent context — the four questions a first-look buyer asks before anything
 * else. Every chip is backed by the verified fact it expands to.
 */
function buildChips(args: {
  verifiedFacts: BriefFactLine[];
  floodZone: string | null;
  floodSfha: boolean | null;
  amenities: AmenityFacts | null;
  schoolsCount: number | null;
  schoolsInTown: number | null;
  town: string | null;
  fmr2: number | null;
  fmr4: number | null;
}): BriefChip[] {
  const chips: (BriefChip | null)[] = [];
  if (args.floodZone) {
    const posture =
      args.floodSfha === true
        ? "flood insurance likely required"
        : args.floodZone.toUpperCase() === "D"
          ? "hazard undetermined"
          : "outside hazard area";
    chips.push(chipFrom(args.verifiedFacts, "Flood zone", `Flood zone ${args.floodZone} — ${posture}`));
  }
  const groceryMiles = args.amenities?.grocery?.nearestMiles ?? null;
  if (groceryMiles !== null) {
    chips.push(chipFrom(args.verifiedFacts, "Daily life nearby", `Grocery ${groceryMiles} mi`));
  }
  if (args.schoolsCount) {
    const short =
      args.schoolsInTown && args.town
        ? `${args.schoolsInTown} school${args.schoolsInTown === 1 ? "" : "s"} in ${args.town}`
        : `${args.schoolsCount} public school${args.schoolsCount === 1 ? "" : "s"} in the county`;
    chips.push(chipFrom(args.verifiedFacts, "Schools", short));
  }
  if (args.fmr2) {
    chips.push(
      chipFrom(
        args.verifiedFacts,
        "Rental context",
        `Rent context $${args.fmr2.toLocaleString("en-US")}–$${(args.fmr4 ?? args.fmr2).toLocaleString("en-US")}/mo (2–4BR)`
      )
    );
  }
  return chips.filter((c): c is BriefChip => c !== null).slice(0, 4);
}

/**
 * Private/parochial school directory fact — LIST + permitted data only,
 * never ratings (same founder rule as public schools). Count is the county
 * total; examples are the largest by enrollment.
 */
function privateSchoolsFact(countyFips: string | null): BriefFactLine | null {
  if (!countyFips) return null;
  const entry = COUNTY_PRIVATE_SCHOOLS[countyFips];
  if (!entry || entry.count === 0) return null;
  const sample = entry.schools.slice(0, 3);
  return {
    label: "Private & parochial schools",
    value: `${entry.count} in the county`,
    text:
      `${entry.count} private or parochial school${entry.count === 1 ? "" : "s"} on the federal ` +
      `survey for this county. Example${sample.length === 1 ? "" : "s"}: ${sample
        .map((s) => `${s.name}${s.city ? ` (${s.city}${s.enrollment != null ? `, ${s.enrollment} students` : ""})` : s.enrollment != null ? ` (${s.enrollment} students)` : ""}`)
        .join("; ")}. ` +
      `Survey coverage varies — a local ask often finds options directories miss. Directory facts ` +
      `only; Furlong does not rate schools.`,
    provenance: `Source: ${COUNTY_PRIVATE_SCHOOLS_PROVENANCE.source} (${COUNTY_PRIVATE_SCHOOLS_PROVENANCE.pssYear}), snapshot ${COUNTY_PRIVATE_SCHOOLS_PROVENANCE.asOf}`,
    tone: "neutral",
  };
}

/**
 * Airports & flight paths (founder direction 2026-07-17: an airport next
 * door — or a 90-minute drive to the nearest one — matters BEFORE you visit,
 * for any property type). Straight-line miles from the CC0 OurAirports data;
 * within ~6 miles the tone flips to caution and points at FAA noise maps.
 */
function airportsFactFromData(d: PropertyAirportFact | null): BriefFactLine | null {
  if (!d) return null;
  const close = d.nearestMiles <= 6;
  const sameAsMajor = d.nearestName === d.majorName;
  return {
    label: "Airports & flight paths",
    // Lead with the genuinely NEAREST airport of any kind — regional fields and
    // military airfields (e.g. an Air Force base) are the real closest for many
    // properties; the nearest major/scheduled-service hub is shown after it when
    // they differ. (Fix 2026-07-19: the block previously headlined only the
    // nearest major, hiding closer regional/military fields.)
    value: sameAsMajor
      ? `${d.nearestName} ~${d.nearestMiles} mi${close ? " — noise check advised" : ""}`
      : `${d.nearestName} ~${d.nearestMiles} mi${close ? " — noise check advised" : ""} · nearest major ${d.majorName} ~${d.majorMiles} mi`,
    text:
      `The nearest airport is ${d.nearestName}, about ${d.nearestMiles} miles straight-line` +
      `${
        sameAsMajor
          ? ""
          : `; the nearest major (scheduled-service) hub is ${d.majorName}, ~${d.majorMiles} miles`
      }. ` +
      (close
        ? "An airport this close can mean regular overhead traffic — the FAA publishes noise-exposure maps, and an hour on-site at different times of day tells you more. "
        : "") +
      "Convenience and noise are the two sides of this fact — drive time is a map-app check.",
    provenance: `Source: ${PROPERTY_AIRPORTS_PROVENANCE.source}, snapshot ${PROPERTY_AIRPORTS_PROVENANCE.asOf}`,
    tone: close ? "caution" : "neutral",
  };
}

/** Same fact computed live from a geocode (imported addresses). */
function airportsFactFromCoords(lat: number, lon: number): BriefFactLine | null {
  let nearestAny: { name: string; miles: number; size: string } | null = null;
  let nearestMajor: { name: string; miles: number } | null = null;
  for (const airport of US_AIRPORTS) {
    const dLat = ((airport.lat - lat) * Math.PI) / 180;
    const dLon = ((airport.lon - lon) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) * Math.cos((airport.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const miles = 2 * 3958.8 * Math.asin(Math.sqrt(s));
    if (!nearestAny || miles < nearestAny.miles) nearestAny = { name: airport.name, miles, size: airport.size };
    if (airport.size === "major" && (!nearestMajor || miles < nearestMajor.miles)) {
      nearestMajor = { name: airport.name, miles };
    }
  }
  if (!nearestAny || !nearestMajor) return null;
  return airportsFactFromData({
    nearestName: nearestAny.name,
    nearestMiles: Math.round(nearestAny.miles),
    nearestSize: nearestAny.size,
    majorName: nearestMajor.name,
    majorMiles: Math.round(nearestMajor.miles),
  });
}

/**
 * Military installations (founder direction 2026-07-19: base proximity matters
 * BEFORE you visit — especially for service members and military families who
 * relocate on orders). Nearest DoD installation (Air Force / Army / Navy / Marine
 * Corps + WHS) from the HIFLD/DoD MIRTA dataset; straight-line miles. Facilities
 * and distances only — never a demographic or steering frame.
 */
function militaryFactFromData(d: PropertyMilitaryBaseFact | null): BriefFactLine | null {
  if (!d) return null;
  return {
    label: "Military installations",
    value: `${d.nearestName} (${d.nearestBranch}) ~${d.nearestMiles} mi`,
    text:
      `The nearest military installation is ${d.nearestName} (${d.nearestBranch}), about ` +
      `${d.nearestMiles} miles straight-line. Base proximity affects commute, on-base ` +
      `access, and relocation logistics for anyone with military ties — drive time is a ` +
      `map-app check. (DoD sites: Air Force, Army, Navy, and Marine Corps. Coast Guard air ` +
      `stations appear under Airports & flight paths.)`,
    provenance: `Source: ${PROPERTY_MILITARY_BASES_PROVENANCE.source}, snapshot ${PROPERTY_MILITARY_BASES_PROVENANCE.asOf}`,
    tone: "neutral",
  };
}

/** Same fact computed live from a geocode (imported addresses). */
function militaryFactFromCoords(lat: number, lon: number): BriefFactLine | null {
  let best: { name: string; branch: string; miles: number } | null = null;
  for (const base of US_MILITARY_BASES) {
    const dLat = ((base.lat - lat) * Math.PI) / 180;
    const dLon = ((base.lon - lon) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) * Math.cos((base.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const miles = 2 * 3958.8 * Math.asin(Math.sqrt(s));
    if (!best || miles < best.miles) best = { name: base.name, branch: base.branch, miles };
  }
  if (!best) return null;
  return militaryFactFromData({
    nearestName: best.name,
    nearestBranch: best.branch,
    nearestMiles: Math.round(best.miles),
  });
}

/**
 * Geographic setting (founder direction 2026-07-17: "a beach town on X Bay"
 * — from an authority that is NOT publicly editable). Nearest named
 * identity-making features from USGS GNIS (the federal naming authority).
 * Distance facts, never characterizations.
 */
function geoSettingFact(propertyId: string): BriefFactLine | null {
  if (!propertyId || PROPERTY_GEO_SETTING_PROVENANCE.asOf === null) return null;
  const features = PROPERTY_GEO_SETTING[propertyId] ?? [];
  if (features.length === 0) return null;
  const phrase = (f: { name: string; cls: string; miles: number }) =>
    `${f.name} (${f.cls.toLowerCase()}) ~${f.miles} mi`;
  return {
    label: "The lay of the land",
    value: features.slice(0, 3).map((f) => `${f.name} ~${f.miles} mi`).join(" · "),
    text:
      `The named landscape around this property, from the USGS geographic names authority: ${features
        .map(phrase)
        .join("; ")}. These are the features that give a place its character — a bay, a beach, a ` +
      `summit, a forest — as officially named by the U.S. Board on Geographic Names, not as marketed.`,
    provenance: `Source: ${PROPERTY_GEO_SETTING_PROVENANCE.source}, snapshot ${PROPERTY_GEO_SETTING_PROVENANCE.asOf}`,
    tone: "neutral",
  };
}

/**
 * Broadband area fact (founder direction 2026-07-17: "can I even get WiFi
 * here, or do I need Starlink?"). County-level share of locations with
 * 100/20 Mbps service from the FCC's own data — the area picture; the
 * FCC-map link (an unknown) carries the per-address truth. Renders only
 * once the owner-keyed ingest has populated the snapshot.
 */
function broadbandAreaFact(countyFips: string | null): BriefFactLine | null {
  if (!countyFips || COUNTY_BROADBAND_PROVENANCE.asOf === null) return null;
  const b = COUNTY_BROADBAND[countyFips];
  if (!b) return null;
  const gap = 100 - b.pctServed;
  return {
    label: "Broadband (area)",
    value:
      b.pctServed >= 85
        ? `${b.pctServed}% of the county has 100/20 broadband (${b.pctWired}% wired)`
        : `Only ${b.pctServed}% served — a ${gap}% broadband gap`,
    text:
      `Across this county, ${b.pctServed}% of locations have fixed broadband at 100/20 Mbps or better ` +
      `(${b.pctWired}% with a wired connection — fiber or cable), per the FCC's National Broadband Map. ` +
      (b.pctServed < 70
        ? "A gap this size means many parcels here rely on satellite (Starlink-class) or cellular — check the exact address on the FCC map before you count on wired internet. "
        : "") +
      "An area share, not a promise for one address — the FCC map gives the per-address answer.",
    provenance: `Source: ${COUNTY_BROADBAND_PROVENANCE.source}, BDC ${COUNTY_BROADBAND_PROVENANCE.bdcAsOf}, snapshot ${COUNTY_BROADBAND_PROVENANCE.asOf}`,
    tone: b.pctServed < 70 ? "caution" : "neutral",
  };
}

/**
 * Higher-education directory fact (founder direction 2026-07-17: a
 * university or community college in the county is a fact some buyers want
 * and others avoid — say so either way). Directory facts only.
 */
function collegesFact(countyFips: string | null): BriefFactLine | null {
  if (!countyFips || COUNTY_COLLEGES_PROVENANCE.asOf === null) return null;
  const list = COUNTY_COLLEGES[countyFips] ?? [];
  if (list.length === 0) {
    return {
      label: "Higher education",
      value: "No college campus in the county",
      text:
        "No degree-granting college or university campus sits in this county on the federal " +
        "directory — commuting distance to campuses in neighboring counties is a map-app check. " +
        "Some buyers want a college town, others prefer the quiet; either way it is a fact worth " +
        "knowing up front.",
      provenance: `Source: ${COUNTY_COLLEGES_PROVENANCE.source}, snapshot ${COUNTY_COLLEGES_PROVENANCE.asOf}`,
      tone: "neutral",
    };
  }
  const fourYear = list.filter((c) => c.level === "4-year").length;
  const twoYear = list.length - fourYear;
  const sample = list.slice(0, 3);
  const valueBits = [
    fourYear > 0 ? `${fourYear} four-year` : null,
    twoYear > 0 ? `${twoYear} two-year/community` : null,
  ].filter(Boolean);
  return {
    label: "Higher education",
    value: `${valueBits.join(" · ")} in the county`,
    text:
      `${list.length} degree-granting institution${list.length === 1 ? "" : "s"} in this county on the ` +
      `federal directory: ${sample.map((c) => `${c.name} (${c.level}, ${c.city})`).join("; ")}` +
      `${list.length > sample.length ? ` and ${list.length - sample.length} more` : ""}. ` +
      `A campus nearby shapes rentals, dining, and season rhythms — a fact some buyers seek out ` +
      `and others avoid. Directory facts only; Furlong does not rate institutions.`,
    provenance: `Source: ${COUNTY_COLLEGES_PROVENANCE.source}, snapshot ${COUNTY_COLLEGES_PROVENANCE.asOf}`,
    tone: "neutral",
  };
}

/**
 * Typical out-of-pocket costs for the inspections that answer the unknowns
 * (founder direction 2026-07-17). National ballpark ranges, deliberately
 * round — local quotes vary, and outside as-is government sales many of
 * these are negotiable as seller credits. GUIDANCE ONLY, never a quote.
 * `conditional` items state their own applicability ("if the home has…").
 */
function diligenceCostLines(args: {
  isHome: boolean;
  farmShaped: boolean;
}): DiligenceCostLine[] {
  if (!args.isHome && !args.farmShaped) return [];
  const lines: DiligenceCostLine[] = [
    { label: "Homeowners insurance (annual)", range: "$1,500–$3,000", note: "typical nationally; wind, wildfire, and flood-exposed areas run higher — get local quotes" },
    { label: "General property inspection", range: "$300–$500", note: "larger or rural properties can run more" },
    { label: "Pest / termite inspection", range: "$75–$150", note: "some loan types require it" },
    { label: "Septic inspection", range: "$250–$500", note: "if not on municipal sewer; pumping adds ~$300–$600" },
    { label: "Well inspection", range: "$300–$500", note: "if the property has a well" },
    { label: "Well water testing", range: "$150–$350", note: "basic potability panel; full panels cost more" },
    { label: "Solar panel inspection", range: "$150–$300", note: "if panels are present" },
  ];
  if (args.farmShaped) {
    lines.push({
      label: "Irrigation well flow / yield test",
      range: "quote-based, often $300–$800",
      note: "local well contractors quote by depth and pump setup",
    });
  }
  return lines;
}

/**
 * State-average electric cost context (EIA) — how cheap or expensive power
 * runs where the property sits. State AVERAGES with provenance; the serving
 * utility's rate sheet decides actuals (founder direction 2026-07-17).
 */
function electricCostFact(stateCode: string | null): BriefFactLine | null {
  if (!stateCode || STATE_ELECTRICITY_PROVENANCE.asOf === null) return null;
  const state = STATE_ELECTRICITY[stateCode.trim().toUpperCase()];
  if (!state) return null;
  const bill = state.resAvgMonthlyBill;
  return {
    label: "Electric cost context",
    value: `~${state.resPriceCentsKwh.toFixed(1)}¢/kWh${bill ? ` · avg bill ~$${bill.toLocaleString("en-US")}/mo` : ""} (state avg)`,
    text:
      `EIA's ${STATE_ELECTRICITY_PROVENANCE.year} state averages: residential power runs about ` +
      `${state.resPriceCentsKwh.toFixed(1)}¢/kWh${bill ? `, a typical residential bill about $${bill.toLocaleString("en-US")}/month` : ""}` +
      `${state.comPriceCentsKwh ? `; commercial about ${state.comPriceCentsKwh.toFixed(1)}¢/kWh` : ""}. ` +
      `State averages — the serving utility's published rate sheet and your usage decide the ` +
      `actual bill.`,
    provenance: `Source: ${STATE_ELECTRICITY_PROVENANCE.source}, ${STATE_ELECTRICITY_PROVENANCE.year}, snapshot ${STATE_ELECTRICITY_PROVENANCE.asOf}`,
    tone: "neutral",
  };
}

const HAZARD_SEVERITY = ["Very Low", "Relatively Low", "Relatively Moderate", "Relatively High", "Very High"];
const hazardRank = (rating: string | null) => (rating ? HAZARD_SEVERITY.indexOf(rating) : -1);

/**
 * County natural-hazard profile from FEMA's National Risk Index — the
 * published relative ratings, verbatim, plus the insurance conversations
 * they imply (founder direction 2026-07-17). A fact about the place with
 * provenance; NEVER a prediction, a premium, or an insurability call —
 * the rider list is framed as questions for a licensed agent.
 */
function hazardRiskFact(countyFips: string | null): BriefFactLine | null {
  if (!countyFips) return null;
  const risk = COUNTY_HAZARD_RISK[countyFips];
  if (!risk || !risk.overall) return null;
  const hazards: { name: string; rating: string | null; rider: string }[] = [
    { name: "Hurricane", rating: risk.hurricane, rider: "a windstorm/hurricane deductible or rider" },
    { name: "Wildfire", rating: risk.wildfire, rider: "wildfire coverage terms" },
    { name: "Tornado", rating: risk.tornado, rider: "the wind/hail deductible" },
    { name: "Earthquake", rating: risk.earthquake, rider: "a separate earthquake policy (never in standard homeowners)" },
    { name: "Inland flooding", rating: risk.floodInland, rider: "an NFIP or private flood policy (never in standard homeowners)" },
    { name: "Coastal flooding", rating: risk.floodCoastal, rider: "an NFIP or private flood policy (never in standard homeowners)" },
  ];
  const elevated = hazards.filter((h) => hazardRank(h.rating) >= 2); // Relatively Moderate+
  const valueBits =
    elevated.length > 0
      ? elevated.map((h) => `${h.name.toLowerCase()} ${h.rating}`).join(" · ")
      : "no hazard rated above Relatively Low";
  const riders = [...new Set(elevated.map((h) => h.rider))];
  const rated = hazards.filter((h) => h.rating !== null);
  return {
    label: "Natural hazard profile",
    value: `Overall ${risk.overall} — ${valueBits}`,
    text:
      `FEMA's National Risk Index rates this county ${risk.overall} overall relative to all U.S. ` +
      `counties. By hazard: ${rated.map((h) => `${h.name.toLowerCase()} ${h.rating}`).join(", ")}. ` +
      (riders.length > 0
        ? `Worth asking a licensed insurance agent about ${riders.join("; ")}. `
        : "") +
      `Relative ratings of the place — not a prediction, a premium, or an insurability determination.`,
    provenance: `Source: ${COUNTY_HAZARD_RISK_PROVENANCE.source}, snapshot ${COUNTY_HAZARD_RISK_PROVENANCE.asOf}`,
    tone: elevated.some((h) => hazardRank(h.rating) >= 3) ? "caution" : "neutral",
  };
}

/**
 * Agricultural conditions for a FARM/RANCH analysis (founder direction
 * 2026-07-17: the newsletter's regional ag intelligence belongs in the
 * advanced analysis for farms and ranches too). State-keyed drought, crop
 * conditions, local grain-buyer cash bids, and commodity prices — the same
 * authoritative, dated, sourced data that leads The Furlong Compass.
 * Facts, never predictions or characterizations.
 */
function agConditionsFacts(stateCode: string | null): BriefFactLine[] {
  const st = stateCode?.toUpperCase() ?? null;
  if (!st) return [];
  const facts: BriefFactLine[] = [];

  const drought = STATE_DROUGHT[st];
  if (drought && STATE_DROUGHT_PROVENANCE.mapDate && drought.severePlus >= 5) {
    facts.push({
      label: "Drought status",
      value: `${drought.severePlus}% of the state in severe drought or worse`,
      text:
        `As of the ${drought.mapDate} U.S. Drought Monitor, ${drought.severePlus}% of this state sits in ` +
        `severe drought or worse (D2–D4), ${drought.extremePlus}% in extreme drought (D3+). The water ` +
        `reality behind this year's yields, irrigation demand, and ground economics.`,
      provenance: `Source: U.S. Drought Monitor (USDA/NOAA/NDMC), map ${drought.mapDate}`,
      tone: drought.severePlus >= 40 ? "caution" : "neutral",
    });
  }

  const crop = STATE_CROP_CONDITIONS[st];
  if (crop && STATE_CROP_CONDITIONS_PROVENANCE.asOf && (crop.corn || crop.soybeans)) {
    const bits = [
      crop.corn ? `corn ${crop.corn.goodExcellent}% good-or-excellent (${crop.corn.poorVeryPoor}% poor-or-worse)` : null,
      crop.soybeans ? `soybeans ${crop.soybeans.goodExcellent}% good-or-excellent` : null,
    ].filter(Boolean);
    const cornPvp = crop.corn?.poorVeryPoor ?? 0;
    facts.push({
      label: "Crop conditions",
      value: crop.corn ? `Corn ${crop.corn.goodExcellent}% good-or-excellent statewide` : bits[0] ?? "",
      text:
        `USDA's week-${STATE_CROP_CONDITIONS_PROVENANCE.latestWeek} Crop Progress rates this state's ${bits.join(", ")}. ` +
        `A statewide condition read — this parcel's ground can run better or worse, but it frames the season.`,
      provenance: `Source: USDA NASS Crop Progress ${STATE_CROP_CONDITIONS_PROVENANCE.year}, week ${STATE_CROP_CONDITIONS_PROVENANCE.latestWeek}`,
      tone: cornPvp >= 25 || (crop.corn && crop.corn.goodExcellent <= 35) ? "caution" : "neutral",
    });
  }

  const farmland = STATE_FARMLAND[st];
  if (farmland && STATE_FARMLAND_PROVENANCE.asOf) {
    const yoy = farmland.yoyPct;
    facts.push({
      label: "Farmland value (state)",
      value: `$${farmland.dollarsPerAcre.toLocaleString("en-US")}/acre` + (yoy != null ? `, ${yoy >= 0 ? "+" : ""}${yoy}% YoY` : ""),
      text:
        `USDA's ${farmland.year} average farm real-estate value for this state is $${farmland.dollarsPerAcre.toLocaleString("en-US")} per acre ` +
        `(land and buildings)` + (yoy != null ? `, ${yoy >= 0 ? "up" : "down"} ${Math.abs(yoy)}% year-over-year` : "") +
        `. The state collateral and equity benchmark for ground — a parcel's price turns on its own soil, water, and improvements. ` +
        `Farm purchases run on FSA, USDA Rural Development, Farm Credit, and SBA programs, not consumer mortgages.`,
      provenance: `Source: USDA NASS Ag Land Asset Value, ${farmland.year}`,
      tone: "neutral",
    });
  }

  const bids = STATE_GRAIN_BIDS[st];
  if (bids && STATE_GRAIN_BIDS_PROVENANCE.asOf) {
    const arrow = (d: string | null) => (d === "UP" ? " ▲" : d === "DOWN" ? " ▼" : "");
    const parts = (["corn", "soybeans", "wheat"] as const)
      .map((k) => (bids.bids[k] ? `${k[0].toUpperCase()}${k.slice(1)} $${bids.bids[k]!.avg.toFixed(2)}${arrow(bids.bids[k]!.direction)}` : null))
      .filter(Boolean);
    if (parts.length > 0) {
      facts.push({
        label: "Local grain bids",
        value: parts.join(" · "),
        text:
          `Average local grain-buyer cash bid in this state (USDA Market News, ${bids.reportDate}): ` +
          `${parts.join(", ")} per bushel — the public record of what nearby elevators are paying, arrows show ` +
          `the day-over-day move. Your buyer's board is the exact number; this is the regional benchmark.`,
        provenance: `Source: USDA AMS Market News grain bids, ${bids.reportDate}`,
        tone: "neutral",
      });
    }
  }

  if (COMMODITY_PRICES_PROVENANCE.asOf && (COMMODITY_PRICES.corn || COMMODITY_PRICES.soybeans)) {
    const p = (k: string) => (COMMODITY_PRICES[k] ? `${k[0].toUpperCase()}${k.slice(1)} $${COMMODITY_PRICES[k].pricePerBushel.toFixed(2)}` : null);
    const parts = ["corn", "soybeans", "wheat"].map(p).filter(Boolean);
    const stamp = COMMODITY_PRICES.corn ? `${COMMODITY_PRICES.corn.month} ${COMMODITY_PRICES.corn.year}` : "";
    facts.push({
      label: "Commodity prices (national)",
      value: parts.join(" · "),
      text:
        `USDA national average price received (${stamp}): ${parts.join(", ")} per bushel — the benchmark ` +
        `the local bid moves around, and the revenue side of any operating plan for this ground.`,
      provenance: `Source: USDA NASS Price Received, ${stamp}`,
      tone: "neutral",
    });
  }

  return facts;
}

/** Farm/land-shaped property types get ground-rent context automatically.
    (Ground rent applies to open acreage on BOTH farm and land profiles, so
    this stays broader than the farm profile alone — classifyPropertyProfile
    is the canonical taxonomy for everything else.) */
function isFarmShaped(propertyType: string | null): boolean {
  return /farm|ranch|land|acre|agric|crop|pasture|homestead/i.test(propertyType ?? "");
}

/**
 * Honest lot-size display from the source feed's free-text field (data-bug
 * fix 2026-07-17: a bare "600" from a Puerto Rico record — 600 SQUARE METERS
 * — was being rendered "600 acres"). The USDA feed's lot field carries mixed
 * units: acres, square meters ("sm"), square feet, and — for 88% of records —
 * a BARE NUMBER with no unit, ranging from 28 to 35 million. A wrong acreage
 * is a material misstatement on a listing, so we render a size ONLY when the
 * unit is explicit or safely inferable (Puerto Rico municipio records are
 * square meters). A bare number with no unit and no PR context yields NULL —
 * the "Size, lot, and what conveys" unknown then routes to the parcel viewer.
 */
export function lotSizeDisplay(raw: string | null, state: string | null): string | null {
  if (!raw) return null;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const t = raw.toLowerCase();
  const acreLot = (acres: number, unitLabel: string) =>
    `${acres < 0.1 ? acres.toFixed(3) : acres.toFixed(2)}-acre lot (${Math.round(n).toLocaleString("en-US")} ${unitLabel})`;
  if (/acre/.test(t)) return `${n} acres`;
  // Square meters — explicit "sm"/"sq m"/"m2"/"metros", or a Puerto Rico
  // record (the municipio land registry records lots in square meters).
  if (/\bsm\b|sq\.?\s*m|m2|metros/.test(t) || state === "PR") {
    return acreLot(n * 0.000247105, "m²");
  }
  if (/sq\.?\s*ft|sf\b/.test(t)) return acreLot(n / 43560, "sq ft");
  // Bare number, mainland — unit genuinely unknown; do NOT guess.
  return null;
}

/** Append the profile's question bank, skipping labels the base set covers. */
function withProfileQuestions(
  unknowns: BriefUnknownLine[],
  profile: PropertyProfile
): BriefUnknownLine[] {
  const seen = new Set(unknowns.map((line) => line.label.toLowerCase()));
  const additions = profileQuestionLines(profile.id).filter(
    (line) => !seen.has(line.label.toLowerCase())
  );
  return [...unknowns, ...additions];
}

/**
 * Ground-rent context for open acreage — county-average cash rents from the
 * USDA NASS survey. `conditional` framing is used when the property type is
 * unknown (manual imports): the fact states its own applicability honestly.
 * County averages only — never an appraisal, an offer, or a parcel rate.
 */
function groundRentFact(countyFips: string | null, conditional: boolean): BriefFactLine | null {
  if (!countyFips || COUNTY_CASH_RENTS_PROVENANCE.asOf === null) return null;
  const rent = COUNTY_CASH_RENTS[countyFips];
  if (!rent || (rent.cropland === null && rent.pasture === null)) return null;
  const bits = [
    rent.cropland !== null ? `cropland ~$${rent.cropland.toLocaleString("en-US")}/acre` : null,
    rent.pasture !== null ? `pasture ~$${rent.pasture.toLocaleString("en-US")}/acre` : null,
  ].filter((bit): bit is string => bit !== null);
  const lead = conditional
    ? "If the parcel includes open cropland or pasture: county-average cash rents run about "
    : "County-average cash rents for open ground run about ";
  return {
    label: "Ground rent context",
    value: `${bits.join(" · ")} (county avg/yr)`,
    text:
      lead +
      bits.join(" and ") +
      " per year in this county (USDA NASS survey). Negotiation context for ground you might " +
      "rent out — a county average, not an appraisal, an offer, or a parcel-specific rate.",
    provenance: `Source: ${COUNTY_CASH_RENTS_PROVENANCE.source}, ${COUNTY_CASH_RENTS_PROVENANCE.year} survey, snapshot ${COUNTY_CASH_RENTS_PROVENANCE.asOf}`,
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
        stepTitles: [
          "Sealed bid — owner-occupants get the first window",
          "The price lives on the HUD listing, not here",
          "Sold strictly as-is — inspect for yourself",
          "You bid through a HUD-registered agent",
        ],
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
        stepTitles: [
          "USDA runs the sale from its own listing page",
          "Sold as-is — budget for condition up front",
        ],
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
        stepTitles: [
          "Auction-style — the auction page is the source of truth",
          "As-is, sometimes with special sale conditions",
        ],
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
  /** Farm-shaped or type-unknown property with NO resolved county cash-rent data. */
  groundRentNeeded: boolean;
  privateSchoolsAvailable: boolean;
  electricAvailable: boolean;
}): BriefUnknownLine[] {
  const unknowns: BriefUnknownLine[] = [];
  const countyKnown =
    (args.county && !/unknown/i.test(args.county)) || Boolean(args.resolvedCounty);

  // County-specific official resources (parcel viewer, treasurer, recorder, DOT
  // planning) have NO stable national URL scheme. Rather than leave these as dead
  // text (founder 2026-07-19: "useless without links"), we hand the customer a
  // one-click, pre-filled search scoped to their county/state — it lands on the
  // right official page far faster than typing it cold. National deep links (FCC,
  // FEMA, FBI CDE, EIA) stay direct.
  const countyLabel = args.resolvedCounty
    ? `${args.resolvedCounty.name} County ${args.resolvedCounty.state}`
    : args.county && !/unknown/i.test(args.county)
      ? args.county
      : null;
  const officialSearch = (terms: string): string | undefined =>
    countyLabel
      ? `https://www.google.com/search?q=${encodeURIComponent(`${countyLabel} ${terms}`)}`
      : undefined;

  if (!countyKnown) {
    unknowns.push({
      label: "County",
      pointer: "State parcel/GIS viewer",
      howToFind:
        "The county determines property taxes, floodplain administration, and permits. The county " +
        "appears on the source listing and on the state's parcel/GIS viewer.",
    });
  }
  if (args.priceLabel && /price on request/i.test(args.priceLabel)) {
    unknowns.push({
      label: "Current price and bid deadline",
      pointer: "The source listing page",
      howToFind:
        "Government listings publish price and bid timing on the source listing page, and both can " +
        "change as bid periods reset — check the listing before planning numbers.",
    });
  }
  if (!args.floodResolved) {
    unknowns.push({
      label: "Flood zone",
      pointer: "msc.fema.gov",
      url: "https://msc.fema.gov/portal/home",
      howToFind:
        "We have not yet resolved this location against the FEMA flood map snapshot. Look up the " +
        "address at msc.fema.gov (FEMA Map Service Center) — it is free and official.",
    });
  }
  unknowns.push({
    label: "Condition and repair scope",
    pointer: "Independent inspection",
    url: "https://www.nachi.org/find-an-inspector",
    howToFind:
      "Government sales are as-is and our snapshot cannot see inside the building. An independent " +
      "inspection (plus a contractor walk-through where repairs look likely) is the only real answer.",
  });
  // What you'd actually OWN (founder direction 2026-07-17): lot size, and
  // whether the ground conveys or only the building — commercial deals and
  // some homes separate them, and leasehold ground carries rent.
  unknowns.push({
    label: "Size, lot, and what conveys",
    pointer: "County parcel viewer + deed/title search",
    url: officialSearch("parcel viewer GIS lot size acreage property search"),
    howToFind:
      "The county parcel/GIS viewer shows the lot's exact dimensions and acreage free. The deed " +
      "and title search confirm precisely what conveys — the ground AND the building, or the " +
      "building only — and how you legally GET there: a few rural, island, and waterfront parcels " +
      "are reachable only by boat or across someone else's land (an easement the title search " +
      "reveals). Where the ground is leased rather than owned, the recorded ground lease states " +
      "the rent and term; for open acreage, the county cash-rent averages above are the " +
      "negotiation context.",
  });
  // Connectivity (founder direction 2026-07-17): broadband, cell coverage,
  // and delivery are the facts people discover AFTER moving in — the FCC map
  // answers the first two at address level, free.
  unknowns.push({
    label: "Broadband, cell service, and delivery",
    pointer: "FCC National Broadband Map",
    url: "https://broadbandmap.fcc.gov/",
    howToFind:
      "Type the exact address into the FCC's National Broadband Map — it lists every provider " +
      "claiming wired or wireless internet service at that location, plus mobile coverage by " +
      "carrier. Rural parcels (and some beach communities) can be dead zones where satellite " +
      "service (Starlink-class) is the only real option, so check before you commit, not after. " +
      "While you're at it, open a delivery app for the address too — whether anyone will bring a " +
      "pizza out here is an address-level truth people usually discover after moving in.",
  });
  // Planned public works & eminent domain (founder direction 2026-07-17):
  // approved road-widenings, new hospitals, bridge closures, and transit
  // changes that a seller need not disclose but will reshape the block for
  // years. The state DOT's STIP and the local MPO's TIP are the public
  // record of what is already funded and coming.
  unknowns.push({
    label: "Planned construction and public works nearby",
    pointer: "State DOT project map + county planning + local MPO (TIP/STIP)",
    url: officialSearch("DOT STIP project map + county planning pending rezoning MPO TIP"),
    howToFind:
      "Approved-but-unbuilt projects — a widened highway, a new hospital or subdivision behind " +
      "the lot, a multi-year bridge closure, an added or removed transit stop — can reshape " +
      "traffic, noise, and value for years, and a seller is rarely required to disclose them. " +
      "The state DOT's project map and STIP, the county or city planning department's pending " +
      "rezonings and permits, and the regional planning organization's TIP are the free public " +
      "record. Where a project needs land, eminent domain can take part of a parcel at " +
      "government-set compensation — worth knowing before you fall for the view.",
  });
  // Access & easements (founder direction 2026-07-17): shared roads and
  // driveways, and automatic utility easements — the pros AND cons.
  unknowns.push({
    label: "Shared access and easements",
    pointer: "Title search + recorded easement/road-maintenance agreement",
    url: officialSearch("county recorder clerk recorded easements deeds search"),
    howToFind:
      "A shared road or driveway can lower cost and build neighborliness — but who plows, repairs, " +
      "and pays is governed by a recorded road-maintenance agreement (or, too often, a handshake); " +
      "ask for it in writing before closing. Utility easements are near-universal and usually " +
      "harmless: they let the power, water, or pipeline company cross a strip to reach equipment, " +
      "but they can limit where you build a fence, shed, or addition, and the utility may enter to " +
      "maintain lines. The title search lists every recorded easement; read what each one actually " +
      "allows.",
  });
  // Mineral & subsurface rights (founder direction 2026-07-17): severed
  // estates — you can own the surface and not what's under it.
  unknowns.push({
    label: "Mineral and subsurface rights",
    pointer: "Title search + county deed records",
    url: officialSearch("county deed records mineral rights severed estate search"),
    howToFind:
      "Owning the surface does not automatically mean owning the oil, gas, coal, metals, or stone " +
      "beneath it. In much of the country — especially energy and mining regions — the mineral " +
      "estate was legally 'severed' from the surface by a prior owner and may belong to someone " +
      "else entirely, who can hold the right to access and extract. A full title search and the " +
      "county deed records show whether minerals convey with this sale, are reserved, or were long " +
      "ago separated; if minerals matter to you, make conveying them an explicit term of the " +
      "contract rather than an assumption.",
  });
  // Crime: official statistics only — Furlong links sources and never
  // characterizes an area (fair-housing doctrine).
  unknowns.push({
    label: "Crime statistics",
    pointer: "FBI Crime Data Explorer + local police",
    url: "https://cde.ucr.cjis.gov/",
    howToFind:
      "Furlong links official statistics and never characterizes an area. The FBI's Crime Data " +
      `Explorer publishes agency-level figures — search it for ${
        args.resolvedCounty ? `${args.resolvedCounty.name} agencies` : "the county's agencies"
      } — and the local police or sheriff's office publishes local reports. Read them alongside ` +
      "your own visits at different times of day.",
  });
  const taxCounty = args.resolvedCounty
    ? `The ${args.resolvedCounty.name} treasurer/appraiser site`
    : "The county treasurer/appraiser site";
  unknowns.push({
    label: "Annual property taxes",
    pointer: "County treasurer/appraiser site",
    url: officialSearch("treasurer appraiser property tax assessment parcel search"),
    howToFind:
      `${taxCounty} lists the parcel's current assessment and tax history — ` +
      "free public records, searchable by address.",
  });
  if (!args.electricAvailable) {
    unknowns.push({
      label: "Electric and utility rates",
      pointer: "EIA state profiles + the serving utility",
      url: "https://www.eia.gov/electricity/state/",
      howToFind:
        "Monthly electric bills vary widely by state and usage — EIA publishes official state " +
        "averages (price and typical bill), and the serving utility publishes its exact rate " +
        "sheet. Water/sewer rates come from the local utility or the town office.",
    });
  }
  if (args.groundRentNeeded) {
    unknowns.push({
      label: "Ground rent for open acreage",
      pointer: "USDA NASS cash rents survey",
      url: "https://quickstats.nass.usda.gov/",
      howToFind:
        "USDA NASS publishes county-average cropland and pasture cash rents " +
        "(quickstats.nass.usda.gov) — free and official; the county extension office knows the " +
        "parcel-level market.",
    });
  }
  if (args.isHome && !args.rentalContextAvailable) {
    unknowns.push({
      label: "Rental context",
      pointer: "huduser.gov (Fair Market Rents)",
      url: "https://www.huduser.gov/portal/datasets/fmr.html",
      howToFind:
        "HUD publishes Fair Market Rents by county and bedroom count — free at huduser.gov " +
        "(datasets → Fair Market Rents). Actual asking rents come from local listings.",
    });
  }
  if (args.isHome && !args.amenitiesAvailable) {
    unknowns.push({
      label: "Daily-life amenities",
      pointer: "Any map app + a drive-by",
      howToFind:
        "Grocery, dining, pharmacy, parks, and vet distances are checkable on any map app — and " +
        "worth an in-person drive at the times of day you'd actually use them.",
    });
  }
  if (args.isHome && !args.schoolsAvailable) {
    unknowns.push({
      label: "Schools",
      pointer: "NCES school locator",
      url: "https://nces.ed.gov/ccd/schoolsearch/",
      howToFind:
        "The NCES school locator (nces.ed.gov/ccd/schoolsearch) lists every public school by " +
        "address; the state Department of Education lists private and charter options and " +
        "publishes the official report cards.",
    });
  }
  if (args.isHome && !args.privateSchoolsAvailable) {
    unknowns.push({
      label: "Private and alternative schools",
      pointer: "State Dept. of Education",
      url: "https://nces.ed.gov/surveys/pss/privateschoolsearch/",
      howToFind:
        "Private, parochial, and co-op options are listed by the state Department of Education " +
        "and the NCES private-school survey (nces.ed.gov/surveys/pss) — coverage varies, so a " +
        "local ask often finds options directories miss.",
    });
  }
  if (args.isHome) {
    unknowns.push({
      label: "Water, sewer, and utilities",
      pointer: "Well/septic inspection",
      howToFind:
        "Rural homes may use a private well and septic system rather than municipal service. The " +
        "listing, the county health department, and a well/septic inspection establish which — and " +
        "their condition materially affects cost. On municipal service, the utility or town office " +
        "publishes the water/sewer rate schedule.",
    });
    unknowns.push({
      label: "HOA or covenants",
      pointer: "Seller disclosure + title search",
      howToFind:
        "Ask the seller or listing agent for any HOA and recorded covenants up front; the title " +
        "search during purchase surfaces them definitively.",
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
      `are part of the plan), conventional loans, or USDA rural programs. One hard boundary to know: ` +
      `if the property is a working farm or the land is the main value — large acreage, ` +
      `income-producing ground — FHA and USDA Rural Development home loans generally will NOT ` +
      `underwrite it; that purchase lives in the agricultural lanes (FSA farm loans, Farm Credit) ` +
      `instead. Which lane fits is a personal-situation question — a provider can walk you through ` +
      `it; nothing here is a qualification or approval.`
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
  /** Listing description — sharpens profile classification (a "commercial"
      record whose description says "vacant motel" charts as hospitality). */
  description?: string | null;
}): PropertyBriefIntelligence {
  const id = args.propertyId ?? "";
  // Canonical profile (axis 1) — classified ONCE here, drives the home-shaped
  // gating and the per-type question bank. The old bare regex called a
  // "mobile home park" a home because it contains the word "home".
  const profile = classifyPropertyProfile({
    propertyType: args.propertyType,
    description: args.description ?? null,
  });
  const isHome = profile.id === "residential";

  const verifiedFacts: BriefFactLine[] = [];

  // Size & shape — from the source listing record where the source publishes
  // it (founder direction 2026-07-17: "exactly how big is this property?").
  // HUD/GSA feeds publish no size fields; the "what conveys" unknown carries
  // the pointer for those.
  const sourceRecord = id && !id.startsWith("imported:") ? findCanonicalPropertyById(id)?.source_records[0] : null;
  if (sourceRecord) {
    const acreageBit = lotSizeDisplay(
      sourceRecord.acreageText,
      (args.stateCode ?? sourceRecord.state ?? null)?.toUpperCase() ?? null
    );
    const sizeBits = [
      sourceRecord.bedrooms ? `${sourceRecord.bedrooms}BR` : null,
      sourceRecord.squareFeet ? `${sourceRecord.squareFeet.toLocaleString("en-US")} sq ft` : null,
      acreageBit,
      // Source feeds occasionally carry junk years ("9"); only a plausible
      // four-digit year renders.
      sourceRecord.yearBuilt && sourceRecord.yearBuilt >= 1700 && sourceRecord.yearBuilt <= 2100
        ? `built ${sourceRecord.yearBuilt}`
        : null,
    ].filter((bit): bit is string => Boolean(bit));
    if (sizeBits.length > 0) {
      verifiedFacts.push({
        label: "Size",
        value: sizeBits.join(" · "),
        text:
          `Per the source listing record: ${sizeBits.join(", ")}. The county parcel record and an ` +
          `appraisal confirm official dimensions — and the deed confirms exactly what land conveys.`,
        provenance: "Source: the source listing record, as published",
        tone: "neutral",
      });
    }
  }

  // County first — it anchors taxes, floodplain administration, and permits.
  const recordCountyKnown = Boolean(args.county && !/unknown/i.test(args.county));
  const resolvedCounty = id && !recordCountyKnown ? countyForProperty(id) : null;
  if (resolvedCounty) {
    verifiedFacts.push({
      label: "County",
      value: `${resolvedCounty.name}, ${resolvedCounty.state}`,
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
      value: `${tenure.ownerOccupiedPct}% owner-occupied (tract)`,
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
        value: "USDA low-income & low-access tract",
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
        value: "No USDA low-access designation",
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
  if (amenities) {
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
      value: `${schools.length} in the county${inTown.length > 0 ? ` · ${inTown.length} in ${args.town}` : ""}`,
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

  const privateSchools = isHome ? privateSchoolsFact(schoolsFips) : null;
  if (privateSchools) verifiedFacts.push(privateSchools);

  // Higher education renders for EVERY profile — a campus shapes rentals and
  // commerce (hospitality/commercial care too), not just family life.
  const colleges = collegesFact(fmrFips);
  if (colleges) verifiedFacts.push(colleges);

  const broadbandArea = broadbandAreaFact(fmrFips);
  if (broadbandArea) verifiedFacts.push(broadbandArea);

  // The town, in a line — curated first-party place note; renders only when
  // an entry exists (no entry, no line — the chart never pretends).
  const townNote = townCharacterFact(args.stateCode, args.town);
  if (townNote) verifiedFacts.push(townNote);

  // The state, in brief — first-party narrative layer above GNIS geography.
  const stateNote = stateNarrativeFact(args.stateCode);
  if (stateNote) verifiedFacts.push(stateNote);

  const geoSetting = geoSettingFact(id);
  if (geoSetting) verifiedFacts.push(geoSetting);

  const airports = airportsFactFromData(id ? PROPERTY_AIRPORTS[id] ?? null : null);
  if (airports) verifiedFacts.push(airports);

  const military = militaryFactFromData(id ? PROPERTY_MILITARY_BASES[id] ?? null : null);
  if (military) verifiedFacts.push(military);

  const hazardRisk = hazardRiskFact(fmrFips);
  if (hazardRisk) verifiedFacts.push(hazardRisk);

  const electric = electricCostFact(args.stateCode);
  if (electric) verifiedFacts.push(electric);

  const fmr = fmrFips ? COUNTY_FMR[fmrFips] : undefined;
  if (fmr && isHome) {
    verifiedFacts.push({
      label: "Rental context",
      value: `2BR $${fmr.fmr2.toLocaleString("en-US")} · 3BR $${fmr.fmr3.toLocaleString("en-US")} · 4BR $${fmr.fmr4.toLocaleString("en-US")}/mo (HUD FMR)`,
      text:
        `HUD's ${COUNTY_FMR_PROVENANCE.fmrYear} Fair Market Rents for this county` +
        `${fmr.areaName ? ` (${fmr.areaName})` : ""}: 1BR $${fmr.fmr1.toLocaleString("en-US")}, ` +
        `2BR $${fmr.fmr2.toLocaleString("en-US")}, 3BR $${fmr.fmr3.toLocaleString("en-US")}, ` +
        `4BR $${fmr.fmr4.toLocaleString("en-US")} per month. ` +
        `A program rent standard HUD publishes — market context, not a prediction of what this home would rent for.`,
      provenance: `Source: ${COUNTY_FMR_PROVENANCE.source}, ${COUNTY_FMR_PROVENANCE.fmrYear}, snapshot ${COUNTY_FMR_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  // Ground rent for open acreage — automatic for farm/land-shaped types.
  const farmShaped = isFarmShaped(args.propertyType);
  const groundRent = farmShaped ? groundRentFact(fmrFips, false) : null;
  if (groundRent) verifiedFacts.push(groundRent);

  // Advanced ag analysis for farms/ranches — regional conditions by state.
  if (profile.id === "farm" || farmShaped) {
    for (const f of agConditionsFacts(args.stateCode)) verifiedFacts.push(f);
  }

  const floodRecord = id ? PROPERTY_FLOOD_HISTORIC_FACTS[id] : undefined;
  const townLowerForChips = (args.town ?? "").trim().toLowerCase();
  const schoolsInTown =
    schools && townLowerForChips
      ? schools.filter((s) => s.city.toLowerCase() === townLowerForChips).length
      : 0;

  return {
    verifiedFacts,
    unknowns: withProfileQuestions(
      buildUnknowns({
        propertyId: id,
        county: args.county,
        resolvedCounty,
        priceLabel: args.priceLabel,
        floodResolved: Boolean(flood),
        isHome,
        rentalContextAvailable: Boolean(fmr),
        amenitiesAvailable: Boolean(amenities),
        schoolsAvailable: Boolean(schools && schools.length > 0),
        groundRentNeeded: farmShaped && !groundRent,
        privateSchoolsAvailable: Boolean(privateSchools),
        electricAvailable: Boolean(electric),
      }),
      profile
    ),
    mechanics: mechanicsForSource(args.sourceId, args.propertyType),
    pathwaysProse: buildPathwaysProse({
      pathwayList: args.pathwayList,
      stateCode: args.stateCode,
      isHome,
    }),
    farmEnterpriseAnswers: farmShaped
      ? answerFarmQuestions({
          acres: parseAcres(sourceRecord?.acreageText ?? null),
          county: resolvedCounty?.name ?? null,
          state: resolvedCounty?.state ?? args.stateCode ?? null,
          croplandRentPerAcre: fmrFips ? COUNTY_CASH_RENTS[fmrFips]?.cropland ?? null : null,
          pastureRentPerAcre: fmrFips ? COUNTY_CASH_RENTS[fmrFips]?.pasture ?? null : null,
          stateFarmlandPerAcre:
            (args.stateCode ? STATE_FARMLAND[args.stateCode.toUpperCase()]?.dollarsPerAcre : null) ?? null,
          nearestMetroMiles: id ? PROPERTY_AIRPORTS[id]?.majorMiles ?? null : null,
          cornYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.corn ?? null : null,
          soybeanYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.soybeans ?? null : null,
          wheatYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.wheat ?? null : null,
          yieldYear: fmrFips ? COUNTY_YIELDS[fmrFips]?.year ?? null : null,
        })
      : null,
    farmBestUse: farmShaped
      ? farmBestUse({
          acres: parseAcres(sourceRecord?.acreageText ?? null),
          county: resolvedCounty?.name ?? null,
          state: resolvedCounty?.state ?? args.stateCode ?? null,
          croplandRentPerAcre: fmrFips ? COUNTY_CASH_RENTS[fmrFips]?.cropland ?? null : null,
          pastureRentPerAcre: fmrFips ? COUNTY_CASH_RENTS[fmrFips]?.pasture ?? null : null,
          stateFarmlandPerAcre:
            (args.stateCode ? STATE_FARMLAND[args.stateCode.toUpperCase()]?.dollarsPerAcre : null) ?? null,
          nearestMetroMiles: id ? PROPERTY_AIRPORTS[id]?.majorMiles ?? null : null,
          primeFarmland: id ? PROPERTY_SOIL[id]?.primeFarmland ?? null : null,
          capabilityClass: id ? PROPERTY_SOIL[id]?.capabilityClass ?? null : null,
          hardinessZone: id ? PROPERTY_SOIL[id]?.hardinessZone ?? null : null,
          cornYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.corn ?? null : null,
          soybeanYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.soybeans ?? null : null,
          wheatYieldPerAcre: fmrFips ? COUNTY_YIELDS[fmrFips]?.wheat ?? null : null,
          yieldYear: fmrFips ? COUNTY_YIELDS[fmrFips]?.year ?? null : null,
        })
      : null,
    residentialAnswers:
      profile.id === "residential"
        ? answerResidentialQuestions({
            county: resolvedCounty?.name ?? null,
            state: resolvedCounty?.state ?? args.stateCode ?? null,
            town: args.town ?? null,
            floodZone: floodRecord?.floodZone ?? null,
            inFloodHazard: floodRecord?.floodZone
              ? /^[AV]/.test(floodRecord.floodZone.trim().toUpperCase())
              : null,
            schoolsCount: schools ? schools.length : null,
            schoolsInTown: schoolsInTown || null,
            rent2BR: fmr?.fmr2 ?? null,
            rent3BR: fmr?.fmr3 ?? null,
            nearestGroceryMiles: amenities?.grocery?.nearestMiles ?? null,
            diningNearby: amenities ? amenities.dining?.nearestMiles != null : null,
            parksNearby: amenities
              ? (amenities.park?.count ?? 0) + (amenities.playground?.count ?? 0) > 0
              : null,
            collegeNearby: fmrFips ? (COUNTY_COLLEGES[fmrFips]?.length ?? 0) > 0 : null,
          })
        : null,
    commercialAnswers:
      profile.id === "commercial"
        ? answerCommercialQuestions({
            county: resolvedCounty?.name ?? null,
            state: resolvedCounty?.state ?? args.stateCode ?? null,
            town: args.town ?? null,
            propertyType: args.propertyType ?? null,
            floodZone: floodRecord?.floodZone ?? null,
            inFloodHazard: floodRecord?.floodZone
              ? /^[AV]/.test(floodRecord.floodZone.trim().toUpperCase())
              : null,
            nearestMetroMiles: id ? PROPERTY_AIRPORTS[id]?.majorMiles ?? null : null,
          })
        : null,
    resolvedCounty,
    chips: buildChips({
      verifiedFacts,
      floodZone: floodRecord?.floodZone ?? null,
      floodSfha: floodRecord?.isSfha ?? null,
      amenities: (isHome ? amenities : null) ?? null,
      schoolsCount: isHome && schools ? schools.length : null,
      schoolsInTown,
      town: args.town,
      fmr2: isHome && fmr ? fmr.fmr2 : null,
      fmr4: isHome && fmr ? fmr.fmr4 : null,
    }),
    livingHere: amenities
      ? livingHereStrip(amenities, PROPERTY_AMENITIES_PROVENANCE.radiusMiles)
      : null,
    diligenceCosts: [...diligenceCostLines({ isHome, farmShaped }), ...profileCostLines(profile.id)],
    profile,
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
      value: `Zone ${zone} — inside hazard area`,
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
      value: "Zone D — hazard undetermined",
      text:
        `This address maps to FEMA flood zone D — flood hazard undetermined (no study completed). ` +
        `That is not the same as low risk; lenders and insurers treat zone D case-by-case.`,
      provenance,
      tone: "caution",
    };
  }
  return {
    label: "Flood zone",
    value: `Zone ${zone} — outside hazard area`,
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
  // Manual portal entry is residential-first; treat as a home unless the
  // canonical classifier says the supplied type is something else.
  const locProfile = classifyPropertyProfile({ propertyType: args.propertyType ?? null });
  const isHome = args.propertyType ? locProfile.id === "residential" : true;
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
      value: `${resolvedCounty.name}, ${resolvedCounty.state}`,
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
      value: "In a National Register area",
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
      value: `Designated QOZ${placeFacts.opportunityZone.rural ? " (rural)" : ""}`,
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
      value: "Qualifies — low-income community",
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
      value: placeFacts.hubzone.isCurrent
        ? `Designated — ${placeFacts.hubzone.hubzoneType}`
        : `Expired — ${placeFacts.hubzone.hubzoneType}`,
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
      value: `${schools.length} in the county${inTown.length > 0 && town ? ` · ${inTown.length} in ${town}` : ""}`,
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

  const privateSchools = isHome ? privateSchoolsFact(countyFips) : null;
  if (privateSchools) verifiedFacts.push(privateSchools);

  const colleges = collegesFact(countyFips);
  if (colleges) verifiedFacts.push(colleges);

  const broadbandArea = broadbandAreaFact(countyFips);
  if (broadbandArea) verifiedFacts.push(broadbandArea);

  const locTownNote = townCharacterFact(stateCode, town);
  if (locTownNote) verifiedFacts.push(locTownNote);

  const locStateNote = stateNarrativeFact(stateCode);
  if (locStateNote) verifiedFacts.push(locStateNote);

  if (geocode?.lat != null && geocode?.lon != null) {
    const locAirports = airportsFactFromCoords(Number(geocode.lat), Number(geocode.lon));
    if (locAirports) verifiedFacts.push(locAirports);

    const locMilitary = militaryFactFromCoords(Number(geocode.lat), Number(geocode.lon));
    if (locMilitary) verifiedFacts.push(locMilitary);
  }

  // Broadband — GATED live FCC lookup (OFF by default; activates behind
  // Module 22/23 + an FCC credential). When the gate is closed or the lookup
  // fails, the FCC-map UNKNOWN carries the answer — the always-current link.
  if (
    geocode?.lat != null &&
    geocode?.lon != null &&
    broadbandLiveLookupEnabled(args.amenityEnv ?? process.env)
  ) {
    const broadband = await queryBroadbandLive(Number(geocode.lat), Number(geocode.lon), args.amenityEnv ?? process.env);
    if (broadband) {
      verifiedFacts.push({
        label: "Broadband",
        value: broadband.chip,
        text:
          `The FCC National Broadband Map shows ${broadband.providerCount} fixed-broadband ` +
          `provider${broadband.providerCount === 1 ? "" : "s"} claiming service at this address, best ` +
          `technology ${broadband.bestTech.replace(/-/g, " ")} (as of ${broadband.asOf}). Provider ` +
          `CLAIMS, not a guarantee — confirm the actual plan and speed with the provider, and open the ` +
          `FCC map for the current picture.`,
        provenance: `Source: FCC National Broadband Map (broadbandmap.fcc.gov), lookup ${broadband.asOf}`,
        tone: broadband.bestTech === "satellite-only" || broadband.bestTech === "none" ? "caution" : "neutral",
      });
    }
  }

  const hazardRisk = hazardRiskFact(countyFips);
  if (hazardRisk) verifiedFacts.push(hazardRisk);

  const electric = electricCostFact(stateCode);
  if (electric) verifiedFacts.push(electric);

  // Ground rent — manual imports rarely carry a reliable property type, so
  // Ground rent (cropland/pasture cash rents) is FARM/LAND ONLY — it must never
  // appear on residential or unknown-type properties (founder-reported 2026-07-19:
  // "cropland shouldn't show up in residential at all"). Matches the committed
  // path's farm-shaped gate; the conditional framing is retired.
  const locFarmShaped = isFarmShaped(args.propertyType ?? null);
  const groundRent = locFarmShaped ? groundRentFact(countyFips, false) : null;
  if (groundRent) verifiedFacts.push(groundRent);

  // Advanced ag analysis for farms/ranches — regional conditions by state.
  if (locProfile.id === "farm" || locFarmShaped) {
    for (const f of agConditionsFacts(stateCode)) verifiedFacts.push(f);
  }

  // Rental context — county-keyed HUD Fair Market Rents.
  const fmr = countyFips ? COUNTY_FMR[countyFips] : undefined;
  if (fmr && isHome) {
    verifiedFacts.push({
      label: "Rental context",
      value: `2BR $${fmr.fmr2.toLocaleString("en-US")} · 3BR $${fmr.fmr3.toLocaleString("en-US")} · 4BR $${fmr.fmr4.toLocaleString("en-US")}/mo (HUD FMR)`,
      text:
        `HUD's ${COUNTY_FMR_PROVENANCE.fmrYear} Fair Market Rents for this county` +
        `${fmr.areaName ? ` (${fmr.areaName})` : ""}: 1BR $${fmr.fmr1.toLocaleString("en-US")}, ` +
        `2BR $${fmr.fmr2.toLocaleString("en-US")}, 3BR $${fmr.fmr3.toLocaleString("en-US")}, ` +
        `4BR $${fmr.fmr4.toLocaleString("en-US")} per month. ` +
        `A program rent standard HUD publishes — market context, not a prediction of what this home would rent for.`,
      provenance: `Source: ${COUNTY_FMR_PROVENANCE.source}, ${COUNTY_FMR_PROVENANCE.fmrYear}, snapshot ${COUNTY_FMR_PROVENANCE.asOf}`,
      tone: "neutral",
    });
  }

  return {
    verifiedFacts,
    unknowns: withProfileQuestions(
      buildUnknowns({
        propertyId: "",
        county: resolvedCounty?.name ?? null,
        resolvedCounty,
        priceLabel: null,
        floodResolved,
        isHome,
        rentalContextAvailable: Boolean(fmr),
        amenitiesAvailable: Boolean(amenities),
        schoolsAvailable: Boolean(schools && schools.length > 0),
        groundRentNeeded: !groundRent,
        privateSchoolsAvailable: Boolean(privateSchools),
        electricAvailable: Boolean(electric),
      }),
      locProfile
    ),
    mechanics: null,
    pathwaysProse: buildPathwaysProse({ pathwayList: [], stateCode, isHome }),
    farmEnterpriseAnswers: locFarmShaped
      ? answerFarmQuestions({
          acres: null,
          county: resolvedCounty?.name ?? null,
          state: resolvedCounty?.state ?? stateCode ?? null,
          croplandRentPerAcre: countyFips ? COUNTY_CASH_RENTS[countyFips]?.cropland ?? null : null,
          pastureRentPerAcre: countyFips ? COUNTY_CASH_RENTS[countyFips]?.pasture ?? null : null,
          stateFarmlandPerAcre:
            (stateCode ? STATE_FARMLAND[stateCode.toUpperCase()]?.dollarsPerAcre : null) ?? null,
          cornYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.corn ?? null : null,
          soybeanYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.soybeans ?? null : null,
          wheatYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.wheat ?? null : null,
          yieldYear: countyFips ? COUNTY_YIELDS[countyFips]?.year ?? null : null,
        })
      : null,
    farmBestUse: locFarmShaped
      ? farmBestUse({
          acres: null,
          county: resolvedCounty?.name ?? null,
          state: resolvedCounty?.state ?? stateCode ?? null,
          croplandRentPerAcre: countyFips ? COUNTY_CASH_RENTS[countyFips]?.cropland ?? null : null,
          pastureRentPerAcre: countyFips ? COUNTY_CASH_RENTS[countyFips]?.pasture ?? null : null,
          stateFarmlandPerAcre:
            (stateCode ? STATE_FARMLAND[stateCode.toUpperCase()]?.dollarsPerAcre : null) ?? null,
          nearestMetroMiles: null,
          cornYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.corn ?? null : null,
          soybeanYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.soybeans ?? null : null,
          wheatYieldPerAcre: countyFips ? COUNTY_YIELDS[countyFips]?.wheat ?? null : null,
          yieldYear: countyFips ? COUNTY_YIELDS[countyFips]?.year ?? null : null,
        })
      : null,
    residentialAnswers:
      locProfile.id === "residential"
        ? answerResidentialQuestions({
            county: resolvedCounty?.name ?? null,
            state: resolvedCounty?.state ?? stateCode ?? null,
            town,
            floodZone: placeFacts.flood?.floodZone ?? null,
            inFloodHazard: placeFacts.flood?.floodZone
              ? /^[AV]/.test(placeFacts.flood.floodZone.trim().toUpperCase())
              : null,
            schoolsCount: schools ? schools.length : null,
            schoolsInTown:
              schools && town
                ? schools.filter((s) => s.city.toLowerCase() === town.trim().toLowerCase()).length
                : null,
            rent2BR: fmr?.fmr2 ?? null,
            rent3BR: fmr?.fmr3 ?? null,
            nearestGroceryMiles: amenities?.grocery?.nearestMiles ?? null,
            diningNearby: amenities ? amenities.dining?.nearestMiles != null : null,
            parksNearby: amenities
              ? (amenities.park?.count ?? 0) + (amenities.playground?.count ?? 0) > 0
              : null,
            collegeNearby: countyFips ? (COUNTY_COLLEGES[countyFips]?.length ?? 0) > 0 : null,
          })
        : null,
    commercialAnswers:
      locProfile.id === "commercial"
        ? answerCommercialQuestions({
            county: resolvedCounty?.name ?? null,
            state: resolvedCounty?.state ?? stateCode ?? null,
            town,
            propertyType: args.propertyType ?? null,
            floodZone: placeFacts.flood?.floodZone ?? null,
            inFloodHazard: placeFacts.flood?.floodZone
              ? /^[AV]/.test(placeFacts.flood.floodZone.trim().toUpperCase())
              : null,
            nearestMetroMiles: null,
          })
        : null,
    resolvedCounty,
    chips: buildChips({
      verifiedFacts,
      floodZone: placeFacts.flood?.floodZone ?? null,
      floodSfha: placeFacts.flood?.floodZone ? /^[AV]/.test(placeFacts.flood.floodZone.trim().toUpperCase()) : null,
      amenities,
      schoolsCount: isHome && schools ? schools.length : null,
      schoolsInTown:
        schools && town
          ? schools.filter((s) => s.city.toLowerCase() === town.trim().toLowerCase()).length
          : 0,
      town,
      fmr2: isHome && fmr ? fmr.fmr2 : null,
      fmr4: isHome && fmr ? fmr.fmr4 : null,
    }),
    livingHere: amenities ? livingHereStrip(amenities, AMENITY_RADIUS_MILES) : null,
    diligenceCosts: [
      ...diligenceCostLines({ isHome, farmShaped: locFarmShaped || !args.propertyType }),
      ...profileCostLines(locProfile.id),
    ],
    profile: locProfile,
  };
}
