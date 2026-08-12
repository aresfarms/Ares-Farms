/**
 * weeklyAgLive — runtime-state overlay for the WEEKLY-cadence ag facts:
 * drought severity (U.S. Drought Monitor, Thursdays) and corn/soybean crop
 * conditions (USDA NASS Crop Progress, weekly in season).
 *
 * Tier-1 activation 2026-07-28: these two sources previously refreshed only by
 * hand (`refresh:weekly-ag`), so the site's "local truth" lead — Delmarva's
 * drought, this week's crop ratings — quietly aged. The daily source-refresh
 * job now writes this overlay (weeklyAgRefresh.ts); the app reads it at
 * request time exactly like commodityPricesLive. If the overlay is missing,
 * stale, or unparseable, the committed snapshot serves — a figure is never
 * fabricated or blanked.
 *
 * Freshness is keyed on WHEN THE REFRESH RAN (fetchedAt): weekly products can
 * legitimately carry a mapDate/week a few days old; what must never happen is
 * silently serving a months-old snapshot as if it were current.
 */

import * as fs from "node:fs";

import { runtimeStatePath } from "./runtimeStatePath";
import {
  STATE_DROUGHT,
  STATE_DROUGHT_PROVENANCE,
  type StateDrought,
} from "./stateDroughtGenerated";
import {
  STATE_CROP_CONDITIONS,
  STATE_CROP_CONDITIONS_PROVENANCE,
  type StateCropConditions,
} from "./stateCropConditionsGenerated";

const LIVE_PATH = runtimeStatePath("weekly-ag-live.json");

/** Trust the overlay only if the refresh ran within this many days. */
const MAX_REFRESH_AGE_DAYS = 10;

export interface WeeklyAgLive {
  drought: Record<string, StateDrought>;
  /** Newest USDM map date across states (YYYY-MM-DD). */
  droughtMapDate: string | null;
  cropConditions: Record<string, StateCropConditions>;
  cropYear: number | null;
  cropLatestWeek: number | null;
  /** When the refresh wrote this overlay (ISO). */
  fetchedAt: string;
  sources: { drought: string; cropConditions: string };
}

export function readWeeklyAgLive(): WeeklyAgLive | null {
  try {
    const raw = fs.readFileSync(LIVE_PATH, "utf8");
    const data = JSON.parse(raw) as WeeklyAgLive;
    if (!data || typeof data.fetchedAt !== "string") return null;
    const ageDays = Math.round((Date.now() - new Date(data.fetchedAt).getTime()) / 86_400_000);
    if (!Number.isFinite(ageDays) || ageDays > MAX_REFRESH_AGE_DAYS) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeWeeklyAgLive(data: WeeklyAgLive): void {
  fs.writeFileSync(LIVE_PATH, JSON.stringify(data, null, 2), "utf8");
}

/** Drought by state — fresh overlay when present, else the committed snapshot. */
export function buildStateDrought(): Record<string, StateDrought> {
  const live = readWeeklyAgLive();
  return live && Object.keys(live.drought).length >= 40 ? live.drought : STATE_DROUGHT;
}

/** Drought provenance matching whatever buildStateDrought() serves. */
export function buildStateDroughtProvenance(): {
  asOf: string | null;
  mapDate: string | null;
  source: string;
  resolvedStates: number;
} {
  const live = readWeeklyAgLive();
  if (live && Object.keys(live.drought).length >= 40) {
    return {
      asOf: live.fetchedAt.slice(0, 10),
      mapDate: live.droughtMapDate,
      source: STATE_DROUGHT_PROVENANCE.source,
      resolvedStates: Object.keys(live.drought).length,
    };
  }
  return { ...STATE_DROUGHT_PROVENANCE };
}

/** Crop conditions by state — fresh overlay when present, else the snapshot. */
export function buildStateCropConditions(): Record<string, StateCropConditions> {
  const live = readWeeklyAgLive();
  return live && Object.keys(live.cropConditions).length >= 30
    ? live.cropConditions
    : STATE_CROP_CONDITIONS;
}

/** Crop-conditions provenance matching whatever the builder above serves. */
export function buildCropConditionsProvenance(): {
  asOf: string | null;
  source: string;
  year: number;
  latestWeek: number;
  resolvedStates: number;
} {
  const live = readWeeklyAgLive();
  if (live && Object.keys(live.cropConditions).length >= 30 && live.cropYear && live.cropLatestWeek) {
    return {
      asOf: live.fetchedAt.slice(0, 10),
      source: STATE_CROP_CONDITIONS_PROVENANCE.source,
      year: live.cropYear,
      latestWeek: live.cropLatestWeek,
      resolvedStates: Object.keys(live.cropConditions).length,
    };
  }
  return { ...STATE_CROP_CONDITIONS_PROVENANCE };
}
