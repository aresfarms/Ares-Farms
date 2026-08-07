import { isOwnershipProbe, isSteeringProbe } from "@/lib/navigator/propertyPrivacyDoctrine";
import { isPlaceFactLiveFetchActivatedRuntime } from "@/lib/place-facts/placeFactActivationStore";
import { lookupOpportunityZone } from "@/lib/scrapers/adapters/opportunity-zones";
import {
  CENSUS_GEOCODER_URL,
  geocodeToCensusTract,
  type CensusGeocodeResult,
} from "@/lib/scrapers/adapters/censusGeocoder";
import { queryFloodZone, queryNationalRegister } from "@/lib/scrapers/adapters/femaHistoric";
import { lookupHubzone } from "@/lib/scrapers/adapters/hubzone";
import { lookupNmtcQualifiedTract } from "@/lib/scrapers/adapters/nmtc";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";

/**
 * Place-facts handed to the financing program matcher. Declared LOCALLY
 * (structurally identical to capital-graph's VerifiedPlaceFacts) so this
 * source-intelligence file holds no financing-intelligence import — the CORE
 * routes run verifyPropertyPrograms on this. (verify:module-separability)
 */
export interface ImportedPlaceFacts {
  propertyId?: string | null;
  ozTractId?: string | null;
  ozAsOf?: string | null;
  nmtcTractId?: string | null;
  nmtcAsOf?: string | null;
  hubzone?: {
    hubzoneType: string;
    geoid: string;
    effective: string;
    expiration: string | null;
    isCurrent: boolean;
  } | null;
  hubzoneAsOf?: string | null;
  historic?: {
    historicName: string | null;
  } | null;
  historicAsOf?: string | null;
}

export type ImportedVerificationRequest = {
  propertyId?: string | null;
  exactAddress?: string | null;
  location?: string | null;
  stateCode?: string | null;
  rawInput?: string | null;
  notes?: string | null;
  /**
   * Fires the moment the geocode resolves (before the geocode-dependent
   * federal checks finish) so the caller can overlap coordinate-only work.
   * Pure observer — exceptions are swallowed, verification is unaffected.
   */
  onGeocode?: (geocode: CensusGeocodeResult | null) => void;
};

export type ImportedVerificationResult = {
  status: "verified" | "partial" | "blocked" | "unverifiable";
  normalizedAddress: string | null;
  parsedAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  restrictions: string[];
  warnings: string[];
  placeFacts: {
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
  };
  /**
   * The place-facts to run through the financing program matcher. The CORE
   * route calls verifyPropertyPrograms(placeFactsForPrograms) — this file no
   * longer imports the financing unit.
   */
  placeFactsForPrograms: ImportedPlaceFacts;
  /**
   * Census geocode of the typed address, when it resolved. Exposed so the
   * public property-facts route can build the same Place Brief (tenure, food
   * access, county mechanics, gated live amenities) for manually-entered
   * addresses that map-selected properties get. `null` when geocoding did not
   * run or did not resolve.
   */
  geocode: {
    tractId: string; // 11-digit GEOID (state+county+tract)
    countyFips: string; // 5-digit county FIPS (state+county)
    stateFips: string;
    lat: number | null;
    lon: number | null;
  } | null;
  liveChecks: {
    opportunityZoneActivated: boolean;
    nmtcActivated: boolean;
    hubzoneActivated: boolean;
    floodActivated: boolean;
    historicActivated: boolean;
  };
  lookupOutcomes: {
    opportunityZone: "matched" | "no-match" | "error" | "not-run" | "gated";
    nmtc: "matched" | "no-match" | "error" | "not-run" | "gated";
    hubzone: "matched" | "no-match" | "error" | "not-run" | "gated";
    flood: "matched" | "no-match" | "error" | "not-run" | "gated";
    historic: "matched" | "no-match" | "error" | "not-run" | "gated";
  };
};

type ParsedAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

/**
 * Reduce a raw Census geocode to the geocode block on ImportedVerificationResult.
 * countyFips on CensusGeocodeResult is the 3-digit county; the 5-digit county
 * FIPS the Place Brief snapshots are keyed by is state(2)+county(3).
 */
function toGeocodeOut(g: CensusGeocodeResult | null): ImportedVerificationResult["geocode"] {
  if (!g?.geoid) return null;
  const lat = Number(g.lat);
  const lon = Number(g.lon);
  return {
    tractId: g.geoid,
    countyFips: `${g.stateFips}${g.countyFips}`,
    stateFips: g.stateFips,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
  };
}

function cleanPart(value: string): string {
  return value.trim().replace(/^[,\s]+|[,\s]+$/g, "");
}

const STREET_SUFFIX =
  "(?:st|street|ave|avenue|rd|road|ln|lane|dr|drive|blvd|boulevard|way|ct|court|pl|place|trl|trail|hwy|highway|pike|ter|terrace)";
const STREET_DIRECTIONAL = "(?:n|s|e|w|ne|nw|se|sw)";

function isDirectionalOnly(value: string): boolean {
  return new RegExp(`^${STREET_DIRECTIONAL}$`, "i").test(value.trim());
}

function parseAddress(value: string): ParsedAddress | null {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return null;

  const commaMatch = compact.match(
    new RegExp(`^(.*?\\b${STREET_SUFFIX}\\b(?:\\s+${STREET_DIRECTIONAL})?),\\s*([^,]+),\\s*([A-Z]{2})(?:,?\\s+(\\d{5}(?:-\\d{4})?))?$`, "i"),
  );
  if (commaMatch) {
    return {
      street: cleanPart(commaMatch[1]),
      city: cleanPart(commaMatch[2]),
      state: commaMatch[3].toUpperCase(),
      zip: commaMatch[4] ?? "",
    };
  }

  const plainMatch = compact.match(
    new RegExp(`^(.*?\\b${STREET_SUFFIX}\\b(?:\\s+${STREET_DIRECTIONAL})?)\\s+(.+?)\\s+([A-Z]{2})(?:\\s+(\\d{5}(?:-\\d{4})?))?$`, "i"),
  );
  if (plainMatch) {
    const city = cleanPart(plainMatch[2]);
    if (isDirectionalOnly(city)) {
      return null;
    }
    return {
      street: cleanPart(plainMatch[1]),
      city,
      state: plainMatch[3].toUpperCase(),
      zip: plainMatch[4] ?? "",
    };
  }

  return null;
}

function normalizeStateCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function lookupAddressCandidates(input: ImportedVerificationRequest): string[] {
  const exactAddress = input.exactAddress?.trim() ?? "";
  const location = input.location?.trim() ?? "";
  const stateCode = normalizeStateCode(input.stateCode);
  const candidates = new Set<string>();

  if (exactAddress) {
    candidates.add(exactAddress);
    if (stateCode && !new RegExp(`\\b${stateCode}\\b`, "i").test(exactAddress)) {
      candidates.add(`${exactAddress}, ${stateCode}`);
    }
    if (location) {
      candidates.add(`${exactAddress}, ${location}`);
      if (stateCode && !new RegExp(`\\b${stateCode}\\b`, "i").test(location)) {
        candidates.add(`${exactAddress}, ${location}, ${stateCode}`);
      }
    }
  }

  if (location) {
    candidates.add(location);
  }

  return Array.from(candidates)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

async function geocodeFreeformAddress(
  address: string,
): Promise<CensusGeocodeResult | null> {
  const params = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Census Tracts",
    format: "json",
  });

  const res = await governedFetch(
    `${CENSUS_GEOCODER_URL.replace("/address", "/onelineaddress")}?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!res.ok) {
    throw new Error(`Census one-line geocoder HTTP ${res.status}`);
  }

  const body = await res.json();
  const matches: unknown[] = body?.result?.addressMatches ?? [];
  if (matches.length === 0) {
    return null;
  }

  const match = matches[0] as Record<string, unknown>;
  const tracts = ((match.geographies as Record<string, unknown[]> | undefined)?.[
    "Census Tracts"
  ] ?? []) as Array<Record<string, string>>;
  if (tracts.length === 0) {
    return null;
  }

  const tract = tracts[0];
  const coords = match.coordinates as Record<string, string> | undefined;
  return {
    geoid: tract.GEOID,
    tractName: tract.NAME,
    stateFips: tract.STATE,
    countyFips: tract.COUNTY,
    tractFips: tract.TRACT,
    matchedAddress: (match.matchedAddress as string) ?? address,
    lat: coords?.y ?? "",
    lon: coords?.x ?? "",
  };
}

function restrictionFlags(input: ImportedVerificationRequest): string[] {
  const corpus = [input.rawInput, input.notes, input.exactAddress, input.location]
    .filter(Boolean)
    .join(" ");
  const flags: string[] = [];
  if (isOwnershipProbe(corpus)) {
    flags.push("Ownership-identification intent is restricted and cannot be processed through the public property flow.");
  }
  if (isSteeringProbe(corpus)) {
    flags.push("Neighborhood demographic or steering intent is restricted and cannot be processed through the public property flow.");
  }
  return flags;
}

export async function verifyImportedPropertyAddress(input: ImportedVerificationRequest): Promise<ImportedVerificationResult> {
  const candidates = lookupAddressCandidates(input);
  const normalizedAddress = candidates[0] ?? input.exactAddress?.trim() ?? input.location?.trim() ?? null;
  let parsed = candidates
    .map((candidate) => parseAddress(candidate))
    .find((candidate): candidate is ParsedAddress => Boolean(candidate)) ?? null;
  const restrictions = restrictionFlags(input);
  const warnings: string[] = [];
  const ozActivated = isPlaceFactLiveFetchActivatedRuntime("hud-opportunity-zones");
  const nmtcActivated = isPlaceFactLiveFetchActivatedRuntime("cdfi-nmtc");
  const hubzoneActivated = isPlaceFactLiveFetchActivatedRuntime("sba-hubzone");
  const floodActivated = isPlaceFactLiveFetchActivatedRuntime("fema-flood");
  const historicActivated = isPlaceFactLiveFetchActivatedRuntime("nps-historic");
  let freeformGeocode: CensusGeocodeResult | null = null;

  if (restrictions.length > 0) {
    return {
      status: "blocked",
      normalizedAddress,
      parsedAddress: parsed,
      restrictions,
      warnings,
      placeFacts: {},
      placeFactsForPrograms: {},
      geocode: null,
      liveChecks: {
        opportunityZoneActivated: ozActivated,
        nmtcActivated,
        hubzoneActivated: hubzoneActivated,
        floodActivated,
        historicActivated,
      },
      lookupOutcomes: {
        opportunityZone: "not-run",
        nmtc: "not-run",
        hubzone: "not-run",
        flood: "not-run",
        historic: "not-run",
      },
    };
  }

  if (!parsed) {
    for (const candidate of candidates) {
      try {
        freeformGeocode = await geocodeFreeformAddress(candidate);
      } catch (error) {
        warnings.push(
          error instanceof Error
            ? `Address verification fallback could not complete: ${error.message}.`
            : "Address verification fallback could not complete."
        );
      }

      if (freeformGeocode?.matchedAddress) {
        parsed = parseAddress(freeformGeocode.matchedAddress);
        if (parsed) {
          break;
        }
      }
    }
  }

  if (!parsed) {
    return {
      status: "unverifiable",
      normalizedAddress: freeformGeocode?.matchedAddress ?? normalizedAddress,
      parsedAddress: null,
      restrictions,
      warnings: [
        "The imported property could not be parsed into a verifiable street/city/state address yet.",
        ...warnings,
      ],
      placeFacts: {},
      placeFactsForPrograms: {},
      geocode: toGeocodeOut(freeformGeocode),
      liveChecks: {
        opportunityZoneActivated: ozActivated,
        nmtcActivated,
        hubzoneActivated: hubzoneActivated,
        floodActivated,
        historicActivated,
      },
      lookupOutcomes: {
        opportunityZone: "not-run",
        nmtc: "not-run",
        hubzone: "not-run",
        flood: "not-run",
        historic: "not-run",
      },
    };
  }

  const facts: ImportedPlaceFacts = {
    propertyId: input.propertyId ?? null,
  };
  const placeFacts: ImportedVerificationResult["placeFacts"] = {};
  const lookupOutcomes: ImportedVerificationResult["lookupOutcomes"] = {
    opportunityZone: "not-run",
    nmtc: "not-run",
    hubzone: "not-run",
    flood: "not-run",
    historic: "not-run",
  };

  // PARALLEL live checks (founder-reported slowness 2026-07-29): OZ, HUBZone,
  // and the geocode are independent — run together; NMTC/flood/historic need
  // only the geocode — run together after it. Same outcomes, same honesty,
  // roughly half the cold wall-clock. Mutations of the shared facts/warnings
  // objects are safe: JS is single-threaded and each block owns its keys.
  const geocodePromise: Promise<CensusGeocodeResult | null> = freeformGeocode
    ? Promise.resolve(freeformGeocode)
    : geocodeToCensusTract(parsed.street, parsed.city, parsed.state, parsed.zip).catch(() => null);

  const ozTask = (async () => {
  if (ozActivated) {
    const oz = await lookupOpportunityZone(parsed.street, parsed.city, parsed.state, parsed.zip);
    if (!oz.error && oz.designated && oz.tractId) {
      facts.ozTractId = oz.tractId;
      facts.ozAsOf = oz.fetchedAt.slice(0, 10);
      placeFacts.opportunityZone = {
        tractId: oz.tractId,
        rural: oz.rural,
        asOf: oz.fetchedAt.slice(0, 10),
      };
      lookupOutcomes.opportunityZone = "matched";
    } else if (oz.error) {
      warnings.push(`Opportunity Zone verification could not be completed: ${oz.error}.`);
      lookupOutcomes.opportunityZone = "error";
    } else {
      lookupOutcomes.opportunityZone = "no-match";
    }
  } else {
    lookupOutcomes.opportunityZone = "gated";
  }
  })();
  const hubzoneTask = (async () => {
  if (hubzoneActivated) {
    const hubzone = await lookupHubzone(parsed.street, parsed.city, parsed.state, parsed.zip);
    if (!hubzone.error && hubzone.designated && hubzone.hubzoneType && hubzone.geoid) {
      facts.hubzone = {
        hubzoneType: hubzone.hubzoneType,
        geoid: hubzone.geoid,
        effective: hubzone.effective ?? "",
        expiration: hubzone.expiration,
        isCurrent: hubzone.isCurrent,
      };
      facts.hubzoneAsOf = hubzone.fetchedAt.slice(0, 10);
      placeFacts.hubzone = {
        hubzoneType: hubzone.hubzoneType,
        geoid: hubzone.geoid,
        effective: hubzone.effective ?? "",
        expiration: hubzone.expiration,
        isCurrent: hubzone.isCurrent,
        asOf: hubzone.fetchedAt.slice(0, 10),
      };
      lookupOutcomes.hubzone = "matched";
    } else if (hubzone.error) {
      warnings.push(`HUBZone verification could not be completed: ${hubzone.error}.`);
      lookupOutcomes.hubzone = "error";
    } else {
      lookupOutcomes.hubzone = "no-match";
    }
  } else {
    lookupOutcomes.hubzone = "gated";
  }
  })();

  const geocode = await geocodePromise;
  // Early-geocode observer (perf, founder-reported lag 2026-07-29): lets the
  // caller start coordinate-only lookups (soils/climate/wetlands/EPA) while
  // the remaining federal checks below are still in flight. Observer only —
  // it can never alter or break verification.
  try {
    input.onGeocode?.(geocode);
  } catch {
    /* observer errors are the caller's problem, never verification's */
  }
  const nmtcTask = (async () => {
  if (nmtcActivated) {
    if (geocode?.geoid) {
      const nmtc = await lookupNmtcQualifiedTract(geocode.geoid).catch(() => undefined);
      if (nmtc?.tractId) {
        facts.nmtcTractId = nmtc.tractId;
        facts.nmtcAsOf = new Date().toISOString().slice(0, 10);
        placeFacts.nmtc = {
          tractId: nmtc.tractId,
          asOf: facts.nmtcAsOf,
        };
        lookupOutcomes.nmtc = "matched";
      } else if (nmtc === null) {
        lookupOutcomes.nmtc = "no-match";
      } else {
        warnings.push("NMTC verification could not be completed because the CDFI tract lookup failed unexpectedly.");
        lookupOutcomes.nmtc = "error";
      }
    } else if (geocode === null) {
      warnings.push("NMTC verification could not be completed because the imported address did not geocode cleanly enough for tract lookup.");
      lookupOutcomes.nmtc = "error";
    }
  } else {
    lookupOutcomes.nmtc = "gated";
  }
  })();
  const floodTask = (async () => {
  if (floodActivated) {
    if (geocode?.lat && geocode?.lon) {
      const flood = await queryFloodZone(Number(geocode.lon), Number(geocode.lat)).catch(() => undefined);
      if (flood?.floodZone) {
        // Symmetric honesty: a non-SFHA zone (e.g. X) is a FACT the buyer
        // needs ("outside hazard area"), not a no-match — record it either
        // way (founder-reported gap 2026-07-17).
        placeFacts.flood = {
          floodZone: flood.floodZone,
          asOf: new Date().toISOString().slice(0, 10),
        };
        lookupOutcomes.flood = "matched";
      } else if (flood === null) {
        lookupOutcomes.flood = "no-match";
      } else {
        warnings.push("Flood verification could not be completed because the FEMA lookup failed unexpectedly.");
        lookupOutcomes.flood = "error";
      }
    } else if (geocode === null) {
      warnings.push("Flood verification could not be completed because the imported address did not geocode cleanly enough for FEMA lookup.");
      lookupOutcomes.flood = "error";
    }
  } else {
    lookupOutcomes.flood = "gated";
  }
  })();
  const historicTask = (async () => {
  if (historicActivated) {
    if (geocode?.lat && geocode?.lon) {
      const historic = await queryNationalRegister(Number(geocode.lon), Number(geocode.lat)).catch(() => undefined);
      if (historic?.inNationalRegisterArea) {
        facts.historic = {
          historicName: historic.resourceName,
        };
        facts.historicAsOf = new Date().toISOString().slice(0, 10);
        placeFacts.historic = {
          historicName: historic.resourceName,
          asOf: facts.historicAsOf,
        };
        lookupOutcomes.historic = "matched";
      } else if (historic?.inNationalRegisterArea === false) {
        lookupOutcomes.historic = "no-match";
      } else {
        warnings.push("Historic verification could not be completed because the NPS lookup failed unexpectedly.");
        lookupOutcomes.historic = "error";
      }
    } else if (geocode === null) {
      warnings.push("Historic verification could not be completed because the imported address did not geocode cleanly enough for NPS lookup.");
      lookupOutcomes.historic = "error";
    }
  } else {
    lookupOutcomes.historic = "gated";
  }
  })();
  await Promise.all([ozTask, hubzoneTask, nmtcTask, floodTask, historicTask]);

  const gatedChecks = Object.entries(lookupOutcomes)
    .filter(([, outcome]) => outcome === "gated")
    .map(([source]) => source);
  if (gatedChecks.length > 0) {
    warnings.push("Some property-specific jurisdiction and hazard checks are still pending verification. Furlong will identify them as open items without treating them as negative findings.");
  }

  const anyLiveFact = Boolean(placeFacts.opportunityZone || placeFacts.nmtc || placeFacts.hubzone || placeFacts.flood || placeFacts.historic);
  const anyGateOpen = ozActivated || nmtcActivated || hubzoneActivated || floodActivated || historicActivated;

  return {
    status: restrictions.length > 0
      ? "blocked"
      : anyLiveFact
        ? "verified"
        : anyGateOpen
          ? "partial"
          : "partial",
    normalizedAddress,
    parsedAddress: parsed,
    restrictions,
    warnings,
    placeFacts,
    placeFactsForPrograms: facts,
    geocode: toGeocodeOut(geocode ?? freeformGeocode),
    liveChecks: {
      opportunityZoneActivated: ozActivated,
      nmtcActivated,
      hubzoneActivated: hubzoneActivated,
      floodActivated,
      historicActivated,
    },
    lookupOutcomes,
  };
}
