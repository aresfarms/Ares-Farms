/**
 * climateNormalsLive — NOAA NCEI Climate Data Online annual climate normals
 * (founder request 2026-07-28: "especially the ... climate for this property").
 *
 * Gated on NOAA_CDO_TOKEN (already in Secret Manager; mounted via the gated
 * terraform pattern). Two-step lookup: nearest station carrying the annual
 * normals dataset inside a ~±0.35° box around the property, then the annual
 * temperature / precipitation / snowfall normals for that station. Fail-safe:
 * missing token, no station, or any error → null, and the fact simply does
 * not render. Normals are 30-year official climatology — presented as a fact
 * about the place's climate, never a forecast.
 */

export interface ClimateNormals {
  stationName: string;
  /** Annual average temperature, °F. */
  avgTempF: number | null;
  /** Annual precipitation normal, inches. */
  precipInches: number | null;
  /** Annual snowfall normal, inches. */
  snowInches: number | null;
  retrievedAt: string;
}

const CDO_BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2";
const CDO_TIMEOUT_MS = 10_000;
const STATION_BOX_DEG = 0.35;

async function cdoGet(path: string, token: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CDO_TIMEOUT_MS);
  try {
    const res = await fetch(`${CDO_BASE}${path}`, {
      headers: { token },
      signal: controller.signal,
      // Normals are a fixed 30-year product — a 30-day cache is honest.
      next: { revalidate: 2_592_000 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchClimateNormals(
  lat: number,
  lon: number,
  env: NodeJS.ProcessEnv = process.env
): Promise<ClimateNormals | null> {
  const token = env.NOAA_CDO_TOKEN?.trim();
  if (!token) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const extent = [
    (lat - STATION_BOX_DEG).toFixed(3),
    (lon - STATION_BOX_DEG).toFixed(3),
    (lat + STATION_BOX_DEG).toFixed(3),
    (lon + STATION_BOX_DEG).toFixed(3),
  ].join(",");
  const stations = (await cdoGet(
    `/stations?datasetid=NORMAL_ANN&extent=${extent}&limit=5&sortfield=name`,
    token
  )) as { results?: Array<{ id: string; name: string; latitude: number; longitude: number }> } | null;
  const candidates = stations?.results ?? [];
  if (candidates.length === 0) return null;
  // Nearest candidate by simple squared-degree distance — good enough at
  // county scale, deterministic for replay.
  const station = [...candidates].sort(
    (a, b) =>
      (a.latitude - lat) ** 2 + (a.longitude - lon) ** 2 -
      ((b.latitude - lat) ** 2 + (b.longitude - lon) ** 2)
  )[0];
  const data = (await cdoGet(
    `/data?datasetid=NORMAL_ANN&stationid=${encodeURIComponent(station.id)}` +
      `&startdate=2010-01-01&enddate=2010-01-01` +
      `&datatypeid=ANN-TAVG-NORMAL&datatypeid=ANN-PRCP-NORMAL&datatypeid=ANN-SNOW-NORMAL` +
      `&units=standard&limit=10`,
    token
  )) as { results?: Array<{ datatype: string; value: number }> } | null;
  const readings = data?.results ?? [];
  if (readings.length === 0) return null;
  const value = (datatype: string) => {
    const hit = readings.find((r) => r.datatype === datatype);
    return hit && Number.isFinite(hit.value) ? hit.value : null;
  };
  const avgTempF = value("ANN-TAVG-NORMAL");
  const precipInches = value("ANN-PRCP-NORMAL");
  const snowInches = value("ANN-SNOW-NORMAL");
  if (avgTempF == null && precipInches == null) return null;
  return {
    stationName: station.name,
    avgTempF,
    precipInches,
    snowInches,
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
}
