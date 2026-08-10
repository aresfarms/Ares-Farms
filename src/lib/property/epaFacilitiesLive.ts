/**
 * epaFacilitiesLive — EPA Facility Registry Service proximity screen (founder
 * request 2026-07-28: answer the Environmental tab's contamination question).
 *
 * Keyless public FRS REST service. Two queries:
 *   - Superfund (SEMS program) sites within 3 miles — the headline risk screen,
 *   - all EPA-registered facilities within 1 mile — regulated activity nearby.
 *
 * Copy discipline: these are facts about the AREA near the property, never a
 * determination about the property itself. An EPA registration is a permit or
 * program record, not a violation. Fail-safe: any error → null, no fact.
 */

export interface EpaFacilityScreen {
  /** SEMS (Superfund) sites within superfundRadiusMiles. */
  superfundCount: number;
  superfundNearestName: string | null;
  superfundRadiusMiles: number;
  /** All FRS-registered facilities within facilityRadiusMiles. */
  facilityCount: number;
  sampleFacilityNames: string[];
  facilityRadiusMiles: number;
  retrievedAt: string;
}

const FRS_URL =
  "https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities";
const FRS_TIMEOUT_MS = 12_000;
const SUPERFUND_RADIUS_MILES = 3;
const FACILITY_RADIUS_MILES = 1;

type FrsFacility = { FacilityName?: string };

async function frsQuery(
  lat: number,
  lon: number,
  radiusMiles: number,
  program: string | null,
): Promise<FrsFacility[] | null> {
  const params = new URLSearchParams({
    latitude83: lat.toFixed(5),
    longitude83: lon.toFixed(5),
    search_radius: String(radiusMiles),
    output: "JSON",
  });
  if (program) params.set("pgm_sys_acrnm", program);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FRS_TIMEOUT_MS);
  try {
    const request: RequestInit & { next: { revalidate: number } } = {
      signal: controller.signal,
      // Registry churn is slow — a 7-day cache is honest. The extension is
      // ignored by standard fetch runtimes and understood by Next.js.
      next: { revalidate: 604_800 },
    };
    const res = await fetch(`${FRS_URL}?${params.toString()}`, request);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      Results?: { FRSFacility?: FrsFacility | FrsFacility[] };
    };
    const raw = data.Results?.FRSFacility;
    if (raw == null) return [];
    return Array.isArray(raw) ? raw : [raw];
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchEpaFacilityScreen(
  lat: number,
  lon: number,
): Promise<EpaFacilityScreen | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const [superfund, facilities] = await Promise.all([
    frsQuery(lat, lon, SUPERFUND_RADIUS_MILES, "SEMS"),
    frsQuery(lat, lon, FACILITY_RADIUS_MILES, null),
  ]);
  // Both queries must SUCCEED (empty is fine, failure is not) before we assert
  // anything — a half-failed screen must not render as "0 nearby".
  if (superfund == null || facilities == null) return null;
  return {
    superfundCount: superfund.length,
    superfundNearestName: superfund[0]?.FacilityName ?? null,
    superfundRadiusMiles: SUPERFUND_RADIUS_MILES,
    facilityCount: facilities.length,
    sampleFacilityNames: facilities
      .map((f) => f.FacilityName)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3),
    facilityRadiusMiles: FACILITY_RADIUS_MILES,
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
}
