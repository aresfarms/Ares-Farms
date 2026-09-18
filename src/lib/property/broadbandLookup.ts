/**
 * broadbandLookup — governed, GATED address-level broadband lookup against the
 * FCC National Broadband Map (founder direction 2026-07-17: a computed
 * "fiber available" vs "satellite-only" chip, behind the same gate as the
 * live amenity lookup — with the customer-facing FCC LINK always present so
 * information is never stale).
 *
 * API REALITY (validated live 2026-07-17 with the owner's credential): the
 * FCC's PUBLIC BDC API is a BULK-DOWNLOAD service — whole-state coverage
 * files keyed by BDC location_id / H3 hexagon — with NO per-address lookup
 * endpoint. (The instant address search on the map website uses a separate,
 * non-public internal service.) So a per-address "fiber available" chip is
 * NOT a lightweight live call; it needs a batch pipeline: download a state's
 * availability + location files, aggregate to COUNTY level, and ship a
 * committed snapshot (see ingest:fcc-broadband, build-later). Per-address
 * pinpoint accuracy stays on the FCC-map LINK — always current, zero infra.
 *
 * This queryBroadbandLive path is retained as a gated hook but returns null:
 * there is no public per-lat/lon endpoint to call. The area-level chip comes
 * from the county snapshot, and the FCC-map UNKNOWN link carries per-address.
 *
 * Never a guarantee of service — FCC data reflects PROVIDER CLAIMS.
 */

export interface BroadbandSummary {
  /** Count of distinct fixed-broadband providers claiming service. */
  providerCount: number;
  /** Best residential technology found: "fiber" | "cable" | "fixed-wireless" | "satellite-only" | "none". */
  bestTech: string;
  /** Short chip label, e.g. "Fiber available" / "Satellite-only — check before you rely on it". */
  chip: string;
  /** Point-in-time stamp, ISO date. */
  asOf: string;
}

/** Gate — OFF by default; set BROADBAND_LIVE_LOOKUP_ENABLED=true after review + credential. */
export function broadbandLiveLookupEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BROADBAND_LIVE_LOOKUP_ENABLED?.trim().toLowerCase() === "true";
}

const FCC_API_BASE = "https://broadbandmap.fcc.gov/nbm/map/api";

/** Map FCC technology codes to a residential-plain best-tech + chip label. */
function summarize(techCodes: Set<number>, providerCount: number, asOf: string): BroadbandSummary {
  // FCC tech codes: 50=fiber, 40=cable, 70=fixed wireless, 60=satellite,
  // 10/11=copper/DSL. Best-to-worst for a household.
  const bestTech = techCodes.has(50)
    ? "fiber"
    : techCodes.has(40)
      ? "cable"
      : techCodes.has(70)
        ? "fixed-wireless"
        : techCodes.has(10) || techCodes.has(11)
          ? "dsl"
          : techCodes.has(60)
            ? "satellite-only"
            : "none";
  const chip =
    bestTech === "fiber"
      ? "Fiber available"
      : bestTech === "cable"
        ? "Cable broadband available"
        : bestTech === "fixed-wireless"
          ? "Fixed-wireless available — confirm speeds"
          : bestTech === "dsl"
            ? "DSL only — confirm speeds before you rely on it"
            : bestTech === "satellite-only"
              ? "Satellite-only — plan on Starlink-class service"
              : "No fixed broadband on the FCC map — plan on satellite/cellular";
  return { providerCount, bestTech, chip, asOf };
}

/**
 * Query the FCC National Broadband Map for fixed-broadband availability at a
 * point. Returns null when the gate is OFF, on any failure, or when the API
 * is unauthorized — the caller then shows the FCC-map link instead. Best
 * effort by design: the link is the source of truth, this is a convenience.
 */
export async function queryBroadbandLive(
  lat: number,
  lon: number,
  env: NodeJS.ProcessEnv = process.env,
  timeoutMs = 15000
): Promise<BroadbandSummary | null> {
  if (!broadbandLiveLookupEnabled(env)) return null;
  const token = env.FCC_BROADBAND_API_TOKEN?.trim();
  const username = env.FCC_BROADBAND_API_USERNAME?.trim();
  if (!token || !username) return null;
  try {
    // The authorized availability-by-location endpoint (activated with the
    // provisioned credential). Shape parsing is defensive so an API change
    // degrades to the link rather than to a wrong chip.
    const res = await fetch(
      `${FCC_API_BASE}/location/availability?latitude=${lat}&longitude=${lon}`,
      {
        headers: { username, hash_value: token, "User-Agent": "FurlongPlaceBrief/1.0" },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as {
      data?: Array<{ technology_code?: number; provider_id?: number; residential?: boolean }>;
    } | null;
    const rows = (body?.data ?? []).filter((r) => r.residential !== false);
    if (rows.length === 0) return null;
    const techCodes = new Set<number>();
    const providers = new Set<number>();
    for (const r of rows) {
      if (typeof r.technology_code === "number") techCodes.add(r.technology_code);
      if (typeof r.provider_id === "number") providers.add(r.provider_id);
    }
    const asOf = new Date().toISOString().slice(0, 10);
    return summarize(techCodes, providers.size, asOf);
  } catch {
    return null; // any failure → the customer uses the FCC link
  }
}
