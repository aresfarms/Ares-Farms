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

function boundedPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Weekly agricultural percentage is outside 0-100.");
  return Math.round(n * 10) / 10;
}

function boundedWeek(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? Math.round(value) : Number.NaN;
  if (!Number.isFinite(n) || n < 1 || n > 53) throw new Error("Weekly agricultural week is invalid.");
  return n;
}

function boundedYear(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? Math.round(value) : Number.NaN;
  if (!Number.isFinite(n) || n < 2000 || n > 2200) throw new Error("Weekly agricultural year is invalid.");
  return n;
}

function normalizedDate(value: unknown): string {
  if (typeof value !== "string" || value.length > 40) throw new Error("Weekly agricultural date is invalid.");
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error("Weekly agricultural date is invalid.");
  return new Date(time).toISOString();
}

function normalizedDay(value: unknown): string | null {
  if (value == null) return null;
  const iso = normalizedDate(value);
  return iso.slice(0, 10);
}

function normalizedStateCode(value: string): string {
  if (value.length !== 2) throw new Error("Weekly agricultural state code is invalid.");
  const upper = value.toUpperCase();
  for (const char of upper) {
    const code = char.charCodeAt(0);
    if (code < 65 || code > 90) throw new Error("Weekly agricultural state code is invalid.");
  }
  return upper;
}

function normalizeWeeklyAgLive(data: WeeklyAgLive): WeeklyAgLive {
  const drought: Record<string, StateDrought> = {};
  for (const [rawState, row] of Object.entries(data.drought ?? {})) {
    const state = normalizedStateCode(rawState);
    drought[state] = {
      mapDate: normalizedDay(row?.mapDate) ?? "",
      d0: boundedPercent(row?.d0), d1: boundedPercent(row?.d1), d2: boundedPercent(row?.d2),
      d3: boundedPercent(row?.d3), d4: boundedPercent(row?.d4),
      severePlus: boundedPercent(row?.severePlus),
      extremePlus: boundedPercent(row?.extremePlus),
    };
  }

  const cropConditions: Record<string, StateCropConditions> = {};
  for (const [rawState, row] of Object.entries(data.cropConditions ?? {})) {
    const state = normalizedStateCode(rawState);
    const normalizeCrop = (crop: StateCropConditions["corn"]) => crop ? {
      week: boundedWeek(crop.week) ?? 1,
      goodExcellent: boundedPercent(crop.goodExcellent),
      poorVeryPoor: boundedPercent(crop.poorVeryPoor),
    } : null;
    cropConditions[state] = { corn: normalizeCrop(row?.corn ?? null), soybeans: normalizeCrop(row?.soybeans ?? null) };
  }

  return {
    drought,
    droughtMapDate: normalizedDay(data.droughtMapDate),
    cropConditions,
    cropYear: boundedYear(data.cropYear),
    cropLatestWeek: boundedWeek(data.cropLatestWeek),
    fetchedAt: normalizedDate(data.fetchedAt),
    sources: {
      drought: STATE_DROUGHT_PROVENANCE.source,
      cropConditions: STATE_CROP_CONDITIONS_PROVENANCE.source,
    },
  };
}

export function writeWeeklyAgLive(data: WeeklyAgLive): void {
  // This file is a bounded JSON cache, never executable source. Normalize the
  // official-source payload into the declared schema before it crosses the
  // network-to-disk boundary, then replace atomically to avoid partial state.
  const normalized = normalizeWeeklyAgLive(data);
  const serialized = JSON.stringify(normalized, null, 2);
  if (Buffer.byteLength(serialized, "utf8") > 2_000_000) throw new Error("Weekly agricultural overlay exceeds the bounded cache size.");
  const tempPath = `${LIVE_PATH}.tmp`;
  fs.writeFileSync(tempPath, serialized, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(tempPath, LIVE_PATH);
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
