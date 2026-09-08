/**
 * USDA NRCS SSURGO point context. All components/horizons are retained; no
 * component is extrapolated to the whole parcel. TECH-PROV-001 / CANON-EXPL-001.
 */
import type { AgronomicSoilEvidence, SoilComponentEvidence } from "./cropSuitability";
export interface SoilProfile extends AgronomicSoilEvidence {
  mapUnitName: string;
  dominantComponent: string | null;
  componentPct: number | null;
  retrievedAt: string;
}
const SDA_URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";
export function soilPointQuery(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const wkt = "point(" + lon.toFixed(6) + " " + lat.toFixed(6) + ")";
  return "SELECT mu.mukey, mu.muname, mu.farmlndcl, c.cokey, c.compname, c.comppct_r, c.drainagecl, c.slope_r, mag.niccdcd, h.chkey, h.hzdept_r, h.hzdepb_r, h.ph1to1h2o_l, h.ph1to1h2o_r, h.ph1to1h2o_h " +
    "FROM mapunit mu JOIN component c ON c.mukey = mu.mukey " +
    "LEFT JOIN muaggatt mag ON mag.mukey = mu.mukey " +
    "LEFT JOIN chorizon h ON h.cokey = c.cokey " +
    "WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('" + wkt + "')) " +
    "ORDER BY c.comppct_r DESC, mu.mukey, c.cokey, h.hzdept_r, h.chkey";
}
export function parseSoilRows(rows: unknown, retrievedAt: string): SoilProfile | null {
  if (!Array.isArray(rows) || rows.length < 2 || !Array.isArray(rows[0])) return null;
  const headers = rows[0].map(String);
  const components = new Map<string, SoilComponentEvidence>();
  let first: ((name: string) => string | null) | null = null;
  const num = (v: string | null, low = 0, high = Infinity) => {
    if (v == null || !v.trim()) return null;
    const n = Number(v); return Number.isFinite(n) && n >= low && n <= high ? n : null;
  };
  for (const row of rows.slice(1)) {
    if (!Array.isArray(row)) continue;
    const col = (name: string) => { const v = row[headers.indexOf(name)]; return v == null ? null : String(v); };
    if (!col("muname") || !col("mukey") || !col("cokey")) continue;
    first ??= col;
    const key = col("mukey") + ":" + col("cokey");
    const component: SoilComponentEvidence = components.get(key) ?? {
      mapUnitKey: col("mukey")!, componentKey: col("cokey")!, name: col("compname") ?? "Unnamed component",
      componentPct: num(col("comppct_r"), 0, 100), drainageClass: col("drainagecl"),
      slopePct: num(col("slope_r")), horizons: [],
    };
    if (col("chkey") && !component.horizons.some(h => h.horizonKey === col("chkey"))) component.horizons.push({
      horizonKey: col("chkey")!, topCm: num(col("hzdept_r")), bottomCm: num(col("hzdepb_r")),
      phLow: num(col("ph1to1h2o_l"), 0, 14), phRepresentative: num(col("ph1to1h2o_r"), 0, 14), phHigh: num(col("ph1to1h2o_h"), 0, 14),
    });
    components.set(key, component);
  }
  if (!first) return null;
  return {
    mapUnitName: first("muname")!, farmlandClass: first("farmlndcl"),
    dominantComponent: first("compname"), componentPct: num(first("comppct_r"), 0, 100),
    drainageClass: first("drainagecl"), slopePct: num(first("slope_r")),
    capabilityClass: num(first("niccdcd"), 1, 8),
    spatialScope: "point-map-unit", parcelCoveragePct: null, components: [...components.values()],
    sourceUrl: SDA_URL, fieldPh: null, retrievedAt,
  };
}
export async function fetchSoilProfile(lat: number, lon: number): Promise<SoilProfile | null> {
  const query = soilPointQuery(lat, lon);
  if (!query) return null;
  try {
    const res = await fetch(SDA_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "JSON+COLUMNNAME", query }),
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json() as { Table?: unknown };
    return parseSoilRows(data.Table, new Date().toISOString());
  } catch { return null; }
}
