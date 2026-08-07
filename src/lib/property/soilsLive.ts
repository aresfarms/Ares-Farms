/**
 * soilsLive — USDA NRCS Soil Data Access point query (founder request
 * 2026-07-28: "especially the soil type ... for this property").
 *
 * Keyless public service (sdmdataaccess.sc.egov.usda.gov) — the same SSURGO
 * data behind Web Soil Survey. Point-in-polygon against the survey map unit,
 * dominant component by representative percentage. Fail-safe: any error or
 * empty result → null, and the fact simply does not render. The NRCS survey
 * remains the authority; the fact carries that provenance.
 */

export interface SoilProfile {
  /** Map unit name, e.g. "Pepperbox-Rockawalkin complex, 0 to 2 percent slopes". */
  mapUnitName: string;
  /** NRCS farmland classification, e.g. "Prime farmland if irrigated". */
  farmlandClass: string | null;
  /** Dominant soil component (series) name. */
  dominantComponent: string | null;
  /** Dominant component share of the map unit, percent. */
  componentPct: number | null;
  /** Drainage class, e.g. "Moderately well drained". */
  drainageClass: string | null;
  /** Representative slope, percent. */
  slopePct: number | null;
  /** Non-irrigated land-capability class 1–8 (1–4 arable; 5–8 pasture/limited). */
  capabilityClass: number | null;
  retrievedAt: string;
}

const SDA_URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";
const SDA_TIMEOUT_MS = 10_000;

export async function fetchSoilProfile(lat: number, lon: number): Promise<SoilProfile | null> {
  // WKT is built from Number-validated coordinates only — never raw strings.
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const wkt = `point(${lon.toFixed(5)} ${lat.toFixed(5)})`;
  // niccdcd (nonirrigated capability class, dominant condition) lives in the
  // MUAGGATT map-unit aggregate table, NOT component — querying c.niccdcd was
  // an invalid-column error on every request (found 2026-07-29 by probing SDA
  // directly; the fail-safe null had been silently hiding it).
  const query =
    "SELECT TOP 1 mu.muname, mu.farmlndcl, c.compname, c.comppct_r, c.drainagecl, c.slope_r, mag.niccdcd " +
    "FROM mapunit mu JOIN component c ON c.mukey = mu.mukey " +
    "LEFT JOIN muaggatt mag ON mag.mukey = mu.mukey " +
    `WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${wkt}')) ` +
    "ORDER BY c.comppct_r DESC";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SDA_TIMEOUT_MS);
  try {
    const res = await fetch(SDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "JSON+COLUMNNAME", query }),
      signal: controller.signal,
      // Soil surveys change on multi-year cycles — a 30-day cache is honest.
      next: { revalidate: 2_592_000 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { Table?: string[][] };
    const rows = data.Table;
    if (!rows || rows.length < 2) return null;
    const header = rows[0];
    const row = rows[1];
    const col = (name: string) => {
      const idx = header.indexOf(name);
      return idx >= 0 ? row[idx] : null;
    };
    const num = (value: string | null) => {
      const parsed = Number(value);
      return value != null && value !== "" && Number.isFinite(parsed) ? parsed : null;
    };
    const mapUnitName = col("muname");
    if (!mapUnitName) return null;
    return {
      mapUnitName,
      farmlandClass: col("farmlndcl") || null,
      dominantComponent: col("compname") || null,
      componentPct: num(col("comppct_r")),
      drainageClass: col("drainagecl") || null,
      slopePct: num(col("slope_r")),
      capabilityClass: num(col("niccdcd")),
      retrievedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
