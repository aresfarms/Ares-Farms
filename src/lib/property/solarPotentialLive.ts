/**
 * solarPotentialLive — NREL PVWatts v8 modeled solar estimate (Tier 3,
 * founder-approved 2026-07-28: "yes proceed" on solar via the DATA_GOV key).
 *
 * Honesty posture (same as every live lookup): gated on the DATA_GOV_API_KEY
 * secret being mounted; when the key is absent or the call fails, the fact is
 * simply not rendered — never fabricated. The estimate is a MODELED climate
 * figure for a fixed reference array, presented as a fact about the place's
 * solar resource, never as a production guarantee or project recommendation.
 *
 * Deterministic reference system (replay-safe: same location → same answer
 * for a given PVWatts dataset vintage): 10 kW DC, fixed open-rack ground
 * mount (farm/land context), standard modules, 20° tilt, south-facing,
 * PVWatts default 14.08% losses.
 */

export interface SolarPotentialEstimate {
  /** Modeled AC output of the 10 kW reference array, kWh per year. */
  acAnnualKwh: number;
  /** Annual average solar resource, kWh/m²/day. */
  solradAnnual: number;
  /** Reference system size in kW DC. */
  capacityKw: number;
  /** Date the estimate was retrieved (YYYY-MM-DD). */
  retrievedAt: string;
}

const REFERENCE_CAPACITY_KW = 10;
const PVWATTS_TIMEOUT_MS = 8_000;

export async function fetchSolarPotential(
  lat: number,
  lon: number,
  env: NodeJS.ProcessEnv = process.env,
): Promise<SolarPotentialEstimate | null> {
  const apiKey = env.DATA_GOV_API_KEY?.trim();
  if (!apiKey) return null;
  const params = new URLSearchParams({
    api_key: apiKey,
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    system_capacity: String(REFERENCE_CAPACITY_KW),
    module_type: "0",
    array_type: "0",
    tilt: "20",
    azimuth: "180",
    losses: "14.08",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PVWATTS_TIMEOUT_MS);
  try {
    // developer.nrel.gov was retired 2026-05-29; the lab's APIs now live at
    // developer.nlr.gov (National Laboratory of the Rockies). Same api.data.gov keys.
    const request: RequestInit & { next: { revalidate: number } } = {
      signal: controller.signal,
      // Solar resource is climatological — a week-long cache is honest.
      next: { revalidate: 604_800 },
    };
    const res = await fetch(
      `https://developer.nlr.gov/api/pvwatts/v8.json?${params.toString()}`,
      request,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      outputs?: { ac_annual?: number; solrad_annual?: number };
      errors?: string[];
    };
    if (data.errors?.length) return null;
    const acAnnual = data.outputs?.ac_annual;
    const solrad = data.outputs?.solrad_annual;
    if (
      typeof acAnnual !== "number" ||
      !Number.isFinite(acAnnual) ||
      acAnnual <= 0
    )
      return null;
    return {
      acAnnualKwh: Math.round(acAnnual),
      solradAnnual:
        typeof solrad === "number" && Number.isFinite(solrad)
          ? Math.round(solrad * 100) / 100
          : 0,
      capacityKw: REFERENCE_CAPACITY_KW,
      retrievedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
