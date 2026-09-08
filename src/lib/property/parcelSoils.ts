/**
 * Maryland parcel-outline soil context. Existing government parcel authority,
 * no owner identities. TECH-PROV-001 / CANON-EXPL-001: lineage is content hashed.
 * Intersected map units are not acreage percentages or field soil tests.
 */
import { createHash } from "node:crypto";
import { governedFetch } from "@/lib/security/outboundRequestPolicy";
import { parseSoilRows, soilPointQuery, type SoilProfile } from "./soilsLive";
export const PARCEL_SOIL_VERSION = "md-parcel-soils-v1.0.0";
export const MD_BOUNDARY_SOURCE = "https://mdgeodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer/0";
const SDA = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";
type PolygonGeometry = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
const sha = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
export function polygonToWkt(geometry: PolygonGeometry): string | null {
  try {
    if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return null;
    let vertices = 0;
    const ring = (raw: unknown): string => {
      if (!Array.isArray(raw) || raw.length < 4) throw new Error("Invalid ring");
      const pts = raw.map(p => {
        if (!Array.isArray(p) || p.length !== 2 || !p.every(v => typeof v === "number" && Number.isFinite(v)) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) throw new Error("Invalid coordinate");
        vertices++; return [p[0], p[1]] as [number,number];
      });
      if (vertices > 10000 || pts[0][0] !== pts.at(-1)![0] || pts[0][1] !== pts.at(-1)![1]) throw new Error("Open or oversized ring");
      return "(" + pts.map(p => p.join(" ")).join(",") + ")";
    };
    const polygon = (raw: unknown): string => {
      if (!Array.isArray(raw) || !raw.length) throw new Error("Missing rings");
      return "(" + raw.map(ring).join(",") + ")";
    };
    if (geometry.type === "Polygon") return "POLYGON" + polygon(geometry.coordinates);
    if (!Array.isArray(geometry.coordinates) || !geometry.coordinates.length) return null;
    return "MULTIPOLYGON(" + geometry.coordinates.map(polygon).join(",") + ")";
  } catch { return null; }
}
export async function fetchMarylandParcelSoils(accountId: string): Promise<SoilProfile | null> {
  if (!/^\d{10,16}$/.test(accountId)) return null;
  try {
    const url = new URL(MD_BOUNDARY_SOURCE + "/query");
    url.search = new URLSearchParams({ f: "geojson", where: "ACCTID = '" + accountId + "'",
      outFields: "ACCTID,POLYDATE,POLYACRES", returnGeometry: "true", outSR: "4326", resultRecordCount: "2" }).toString();
    const response = await governedFetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const data = await response.json() as { exceededTransferLimit?: boolean; features?: Array<{ properties: { ACCTID: string; POLYDATE?: string }; geometry: PolygonGeometry }> };
    if (data.exceededTransferLimit || data.features?.length !== 1 || data.features[0].properties.ACCTID !== accountId) return null;
    const feature = data.features[0], wkt = polygonToWkt(feature.geometry);
    if (!wkt) return null;
    const query = soilPointQuery(0,0)!.replace("point(0.000000 0.000000)", wkt);
    const soilResponse = await fetch(SDA, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "JSON+COLUMNNAME", query }), signal: AbortSignal.timeout(12000) });
    if (!soilResponse.ok) return null;
    const soilData = await soilResponse.json() as { Table?: unknown };
    const profile = parseSoilRows(soilData.Table, new Date().toISOString());
    if (!profile || !Array.isArray(soilData.Table)) return null;
    const rows = soilData.Table as unknown[][], headers = rows[0].map(String);
    const mapUnits = new Map<string, { key: string; name: string; farmlandClass: string | null; capabilityClass: number | null }>();
    for (const row of rows.slice(1)) {
      const key = String(row[headers.indexOf("mukey")] ?? ""), name = String(row[headers.indexOf("muname")] ?? "");
      const cap = row[headers.indexOf("niccdcd")], n = cap == null || cap === "" ? NaN : Number(cap);
      if (key && name) mapUnits.set(key, { key, name, farmlandClass: row[headers.indexOf("farmlndcl")] == null ? null : String(row[headers.indexOf("farmlndcl")]), capabilityClass: Number.isFinite(n) && n >= 1 && n <= 8 ? n : null });
    }
    const units = [...mapUnits.values()].sort((a,b) => a.key.localeCompare(b.key));
    return { ...profile, spatialScope: "parcel-map-units", parcelCoveragePct: null, mapUnits: units,
      mapUnitName: units.map(u => u.name).join("; "), dominantComponent: null, componentPct: null,
      farmlandClass: null, drainageClass: null, capabilityClass: null, slopePct: null,
      boundaryEvidence: { parcelId: accountId, sourceUrl: url.toString(), sourceDate: feature.properties.POLYDATE ?? null, geometryHash: sha(feature.geometry), queryHash: sha(query) } };
  } catch { return null; }
}
