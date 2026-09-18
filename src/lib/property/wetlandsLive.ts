/**
 * wetlandsLive — USFWS National Wetlands Inventory point query (founder
 * request 2026-07-28: answer the Environmental tab's wetlands question).
 *
 * Keyless public ArcGIS service. Point-in-polygon against the NWI wetlands
 * layer. Three honest outcomes:
 *   - a mapped wetland at the point (type + NWI code + polygon acreage),
 *   - NO mapped wetland at the point (a real, renderable negative — with the
 *     caveat that NWI is not exhaustive and field delineation governs),
 *   - query failed → null, and no fact renders (never fabricated).
 */

export type WetlandsResult =
  | {
      mapped: true;
      wetlandType: string;
      nwiCode: string | null;
      acres: number | null;
      retrievedAt: string;
    }
  | { mapped: false; retrievedAt: string };

const NWI_QUERY_URL =
  "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query";
const NWI_TIMEOUT_MS = 10_000;

export async function fetchWetlands(
  lat: number,
  lon: number,
): Promise<WetlandsResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const params = new URLSearchParams({
    geometry: `${lon.toFixed(5)},${lat.toFixed(5)}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NWI_TIMEOUT_MS);
  try {
    const request: RequestInit & { next: { revalidate: number } } = {
      signal: controller.signal,
      // NWI updates on multi-year mapping cycles — a 30-day cache is honest.
      next: { revalidate: 2_592_000 },
    };
    const res = await fetch(`${NWI_QUERY_URL}?${params.toString()}`, request);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      error?: unknown;
      features?: Array<{ attributes: Record<string, unknown> }>;
    };
    if (data.error || !Array.isArray(data.features)) return null;
    const retrievedAt = new Date().toISOString().slice(0, 10);
    if (data.features.length === 0) return { mapped: false, retrievedAt };
    // Field names arrive namespaced ("Wetlands.WETLAND_TYPE") — normalize.
    const attributes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data.features[0].attributes)) {
      attributes[key.split(".").pop() ?? key] = value;
    }
    const wetlandType =
      typeof attributes.WETLAND_TYPE === "string"
        ? attributes.WETLAND_TYPE
        : null;
    if (!wetlandType) return null;
    const acres =
      typeof attributes.ACRES === "number" && Number.isFinite(attributes.ACRES)
        ? Math.round(attributes.ACRES * 10) / 10
        : null;
    return {
      mapped: true,
      wetlandType,
      nwiCode:
        typeof attributes.ATTRIBUTE === "string" ? attributes.ATTRIBUTE : null,
      acres,
      retrievedAt,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
