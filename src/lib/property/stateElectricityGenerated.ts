/**
 * stateElectricityGenerated — GENERATED FILE (placeholder until first ingest).
 *
 * State-average electricity prices and typical residential bills from the
 * U.S. Energy Information Administration (EIA) — public domain. Keyed by
 * two-letter state code. Context facts only: state averages, never the
 * serving utility's actual tariff.
 *
 * Populate/refresh: EIA_API_KEY=<free key> npm run ingest:eia-electricity
 * (key signup: eia.gov/opendata/register.php — free, immediate)
 */

export const STATE_ELECTRICITY_PROVENANCE = {
  asOf: null as string | null,
  source: "U.S. EIA electricity retail sales (api.eia.gov)",
  year: null as number | null,
  resolvedStates: 0,
} as const;

export interface StateElectricity {
  /** Average residential price, cents/kWh. */
  resPriceCentsKwh: number;
  /** Average residential monthly bill, dollars (revenue / customers / 12). */
  resAvgMonthlyBill: number | null;
  /** Average commercial price, cents/kWh. */
  comPriceCentsKwh: number | null;
}

export const STATE_ELECTRICITY: Record<string, StateElectricity> = {};
