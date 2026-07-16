/**
 * FEMA flood-zone + NPS National Register place-fact adapters (CORE leaf —
 * global fetch only, imports nothing).
 *
 * FEMA NFHL (hazards.fema.gov, layer 28 Flood Hazard Zones): point-in-polygon →
 * { FLD_ZONE, ZONE_SUBTY, SFHA_TF }. SFHA_TF "T" = Special Flood Hazard Area.
 * INFORMATIONAL place-fact (insurance/lender-relevant), NOT a benefit program —
 * rendered as a fact badge; never as a program match.
 *
 * NPS National Register (mapservices.nps.gov nrhp_locations, layer 1 polygons):
 * point-in-polygon → listed/contributing National Register area. This IS the
 * property-side gate of the federal rehab tax credit (36 CFR §60).
 *
 * Both are U.S. Government works (public domain). Live fetch is used by the
 * OFFLINE property ingest only; public render reads the frozen snapshot.
 */

import { get as httpsGet } from "node:https";

export const FEMA_NFHL_URL =
  "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";
export const NPS_NR_URL =
  "https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/1/query";

export const FEMA_HISTORIC_ADAPTER_VERSION = "fema-historic-adapter-v0.1.0";

export interface FloodZoneFact {
  floodZone: string; // e.g. "AE", "X", "VE"
  zoneSubtype: string | null;
  isSfha: boolean; // Special Flood Hazard Area
}

export interface HistoricFact {
  inNationalRegisterArea: boolean;
  resourceName: string | null;
}

interface CacheEntry<T> {
  value: T | null;
  verifiedAtMs: number;
}

const FLOOD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const floodLookupCache = new Map<string, CacheEntry<FloodZoneFact>>();

function floodCacheKey(lon: number, lat: number): string {
  return `${lon.toFixed(6)},${lat.toFixed(6)}`;
}

function readFloodCache(lon: number, lat: number): CacheEntry<FloodZoneFact> | null {
  const cached = floodLookupCache.get(floodCacheKey(lon, lat));
  if (!cached) return null;
  if (Date.now() - cached.verifiedAtMs > FLOOD_CACHE_TTL_MS) {
    floodLookupCache.delete(floodCacheKey(lon, lat));
    return null;
  }
  return cached;
}

function writeFloodCache(lon: number, lat: number, value: FloodZoneFact | null): void {
  floodLookupCache.set(floodCacheKey(lon, lat), {
    value,
    verifiedAtMs: Date.now(),
  });
}

function fetchJsonViaHttps(url: string, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 FurlongPlaceFacts/1.0",
          Connection: "close",
        },
      },
      (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTPS request returned ${res.statusCode ?? "unknown status"}`));
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(
              error instanceof Error
                ? error
                : new Error("HTTPS response was not valid JSON.")
            );
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("HTTPS request timed out."));
    });
    req.on("error", (error) => {
      reject(error);
    });
  });
}

async function fetchJsonViaHttpsWithRetry(
  url: string,
  timeoutMs: number,
  attempts = 6,
): Promise<unknown> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt % 2 === 1) {
        return await fetchJsonViaHttps(url, timeoutMs);
      }
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 FurlongPlaceFacts/1.0",
        },
      });
      if (!res.ok) {
        throw new Error(`Fetch request returned ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("HTTPS request failed after multiple attempts.");
}

export async function queryFloodZone(lon: number, lat: number): Promise<FloodZoneFact | null> {
  const cached = readFloodCache(lon, lat);
  if (cached) {
    return cached.value;
  }

  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "false",
    f: "pjson",
  });
  try {
    const body = (await fetchJsonViaHttpsWithRetry(
      `${FEMA_NFHL_URL}?${params}`,
      15_000
    )) as { features?: Array<{ attributes?: Record<string, string> }> };
    const a = (body?.features ?? [])[0]?.attributes as Record<string, string> | undefined;
    if (!a?.FLD_ZONE) {
      writeFloodCache(lon, lat, null);
      return null; // unmapped area → no determination (omit)
    }
    const result = {
      floodZone: a.FLD_ZONE,
      zoneSubtype: a.ZONE_SUBTY?.trim() || null,
      isSfha: a.SFHA_TF === "T",
    };
    writeFloodCache(lon, lat, result);
    return result;
  } catch (error) {
    const stale = floodLookupCache.get(floodCacheKey(lon, lat));
    if (stale) {
      return stale.value;
    }
    throw error;
  }
}

export async function queryNationalRegister(lon: number, lat: number): Promise<HistoricFact | null> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "RESNAME",
    returnGeometry: "false",
    f: "pjson",
  });
  const res = await fetch(`${NPS_NR_URL}?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`NPS NR HTTP ${res.status}`);
  const body = await res.json();
  const feat = (body?.features ?? [])[0];
  if (!feat) return { inNationalRegisterArea: false, resourceName: null };
  return { inNationalRegisterArea: true, resourceName: (feat.attributes?.RESNAME as string) ?? null };
}
