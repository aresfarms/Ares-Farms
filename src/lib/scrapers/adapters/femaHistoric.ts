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

export async function queryFloodZone(lon: number, lat: number): Promise<FloodZoneFact | null> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,ZONE_SUBTY,SFHA_TF",
    returnGeometry: "false",
    f: "pjson",
  });
  const res = await fetch(`${FEMA_NFHL_URL}?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`FEMA NFHL HTTP ${res.status}`);
  const body = await res.json();
  const a = (body?.features ?? [])[0]?.attributes as Record<string, string> | undefined;
  if (!a?.FLD_ZONE) return null; // unmapped area → no determination (omit)
  return { floodZone: a.FLD_ZONE, zoneSubtype: a.ZONE_SUBTY?.trim() || null, isSfha: a.SFHA_TF === "T" };
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
