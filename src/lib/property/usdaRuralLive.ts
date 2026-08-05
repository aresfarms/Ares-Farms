/**
 * usdaRuralLive — LIVE USDA Rural Development area-eligibility point query
 * (founder direction 2026-08-05: the B&I wedge's geographic gate, and the one
 * address check whose dataset was never wired — programRegistry fed-usda-rural
 * is marked "NOT yet wired"; this wires it).
 *
 * Source: USDA RD's own public ArcGIS MapServer (the service behind
 * eligibility.sc.egov.usda.gov). The service is SUBTRACTIVE — its polygons are
 * INELIGIBLE areas per program — so a point intersecting zero polygons is in
 * an eligible rural area. Keyless. Fail-safe: any error returns null and the
 * platform renders an honest unknown, never a guess.
 *
 * Layers used:
 *   0  BUS          — business programs (USDA B&I / OneRD business family)
 *   4  RHS SFH MFH  — Rural Housing Service single/multi-family (RD 502 etc.)
 *
 * Honesty boundary carried by every consumer: this is the AREA designation
 * only — program eligibility for a person or project is a separate, licensed
 * determination.
 */

const ELIGIBILITY_BASE =
  "https://rdgdwe.sc.egov.usda.gov/arcgis/rest/services/Eligibility/Eligibility/MapServer";
const LAYER_BUSINESS = 0;
const LAYER_HOUSING = 4;
const USDA_TIMEOUT_MS = 10_000;

export interface UsdaRuralEligibility {
  /** True = the point is in a USDA-eligible rural area for BUSINESS programs (B&I family). */
  businessEligible: boolean | null;
  /** True = eligible area for RD HOUSING programs (502 family). */
  housingEligible: boolean | null;
  retrievedAt: string; // YYYY-MM-DD
}

async function pointInIneligibleArea(
  lat: number,
  lon: number,
  layer: number,
  signal: AbortSignal
): Promise<boolean | null> {
  const url =
    `${ELIGIBILITY_BASE}/${layer}/query?geometry=${lon.toFixed(6)},${lat.toFixed(6)}` +
    `&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` +
    `&returnGeometry=false&outFields=OBJECTID&f=json`;
  const res = await fetch(url, {
    signal,
    // Designations change on census cycles — a 7-day cache is honest.
    next: { revalidate: 604_800 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: unknown[]; error?: unknown };
  if (data.error || !Array.isArray(data.features)) return null;
  return data.features.length > 0;
}

export async function fetchUsdaRuralEligibility(
  lat: number,
  lon: number
): Promise<UsdaRuralEligibility | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), USDA_TIMEOUT_MS);
  try {
    const [businessIneligible, housingIneligible] = await Promise.all([
      pointInIneligibleArea(lat, lon, LAYER_BUSINESS, controller.signal),
      pointInIneligibleArea(lat, lon, LAYER_HOUSING, controller.signal),
    ]);
    if (businessIneligible == null && housingIneligible == null) return null;
    return {
      businessEligible: businessIneligible == null ? null : !businessIneligible,
      housingEligible: housingIneligible == null ? null : !housingIneligible,
      retrievedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
