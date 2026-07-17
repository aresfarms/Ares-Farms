/**
 * Shared OpenStreetMap amenity query (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15).
 *
 * ONE implementation of the Overpass "daily-life amenities within radius" query,
 * used by BOTH the offline ingest (ingestOsmAmenities) and the gated LIVE lookup
 * for manually-typed addresses (property-facts API). LICENSE: ODbL — rendered
 * facts must credit "© OpenStreetMap contributors".
 *
 * GATE: the live path is governed by amenityLiveLookupEnabled(). External fetches
 * for arbitrary user-typed coordinates stay OFF until the Module 22/23 live-
 * activation switch is set, so the public endpoint is never an un-throttled
 * Overpass proxy (founder decision 2026-07-16: "live query, gated").
 */

export interface AmenityCategoryFact {
  count: number;
  nearestName: string | null;
  nearestMiles: number | null;
}
export type AmenityFacts = Record<string, AmenityCategoryFact>;

export const AMENITY_RADIUS_MILES = 10;
const RADIUS_M = 16000; // ~10 miles
// overpass-api.de throttles shared cloud egress IPs; kumi.systems runs a
// high-capacity public mirror (same API, same ODbL data). Try in order.
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const USER_AGENT = "FurlongPlaceBrief/1.0 (property amenity lookup; chudson@aresfarmsinc.com)";

export const AMENITY_CATEGORIES: Record<string, (t: Record<string, string>) => boolean> = {
  grocery: (t) => /^(supermarket|greengrocer|convenience)$/.test(t.shop ?? ""),
  park: (t) => t.leisure === "park",
  playground: (t) => t.leisure === "playground",
  dogPark: (t) => t.leisure === "dog_park",
  vet: (t) => t.amenity === "veterinary",
  // Bars/pubs are deliberately EXCLUDED: a bar headlining "Dinner out" is a
  // mischaracterization (founder-reported 2026-07-17 — a biker bar rendered
  // as the nearest restaurant). Dining = places whose primary tag is food.
  dining: (t) => /^(restaurant|cafe|fast_food)$/.test(t.amenity ?? ""),
  pharmacy: (t) =>
    t.amenity === "pharmacy" || t.healthcare === "pharmacy" || t.shop === "chemist",
  healthcare: (t) => /^(hospital|clinic|doctors)$/.test(t.amenity ?? ""),
  // Getting around (founder direction 2026-07-17): can you live here without
  // a car? Bus stops and rail/metro stations as the map community tagged them.
  busStop: (t) => t.highway === "bus_stop" || t.amenity === "bus_station",
  railStation: (t) => /^(station|halt|tram_stop)$/.test(t.railway ?? ""),
};

/** Live-lookup gate — OFF by default; set AMENITY_LIVE_LOOKUP_ENABLED=true to activate. */
export function amenityLiveLookupEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.AMENITY_LIVE_LOOKUP_ENABLED?.trim().toLowerCase() === "true";
}

function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Query Overpass for amenities within ~10mi of (lat, lon). Returns null on failure. */
export async function queryAmenitiesLive(
  lat: number,
  lon: number,
  timeoutMs = 40000
): Promise<AmenityFacts | null> {
  const q = `[out:json][timeout:25];
(
  nwr(around:${RADIUS_M},${lat},${lon})["shop"~"^(supermarket|convenience|greengrocer|chemist)$"];
  nwr(around:${RADIUS_M},${lat},${lon})["leisure"~"^(park|playground|dog_park)$"];
  nwr(around:${RADIUS_M},${lat},${lon})["healthcare"="pharmacy"];
  nwr(around:${RADIUS_M},${lat},${lon})["amenity"~"^(veterinary|restaurant|cafe|fast_food|pharmacy|hospital|clinic|doctors|bus_station)$"];
  nwr(around:${RADIUS_M},${lat},${lon})["highway"="bus_stop"];
  nwr(around:${RADIUS_M},${lat},${lon})["railway"~"^(station|halt|tram_stop)$"];
);
out center tags 400;`;
  let res: Response | null = null;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const attempt = await fetch(mirror, {
        method: "POST",
        headers: { "User-Agent": USER_AGENT },
        body: new URLSearchParams({ data: q }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (attempt.ok) {
        res = attempt;
        break;
      }
    } catch {
      // fall through to the next mirror
    }
  }
  if (!res) return null;
  const data = (await res.json().catch(() => null)) as {
    elements?: Array<{ lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>;
  } | null;
  if (!data) return null;

  const facts: AmenityFacts = {};
  for (const key of Object.keys(AMENITY_CATEGORIES)) {
    facts[key] = { count: 0, nearestName: null, nearestMiles: null };
  }
  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const eLat = el.lat ?? el.center?.lat;
    const eLon = el.lon ?? el.center?.lon;
    if (typeof eLat !== "number" || typeof eLon !== "number") continue;
    const miles = haversineMiles(lat, lon, eLat, eLon);
    for (const [key, match] of Object.entries(AMENITY_CATEGORIES)) {
      if (!match(tags)) continue;
      const cat = facts[key];
      cat.count += 1;
      if (cat.nearestMiles === null || miles < cat.nearestMiles) {
        cat.nearestMiles = Math.round(miles * 10) / 10;
        cat.nearestName = tags.name ?? null;
      }
    }
  }
  return facts;
}
