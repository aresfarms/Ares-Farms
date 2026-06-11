/**
 * Live property overlay — SERVER-ONLY (source-intelligence unit).
 *
 * The daily auto-refresh writes freshly-pulled listings here
 * (data/property-live/<sourceId>.json, git-ignored runtime state). The property
 * data layer PREFERS this overlay over the committed snapshot, so a successful
 * live pull serves genuinely current listings without a rebuild. Absent an
 * overlay (or on a failed pull), the committed snapshot is served (last-good).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type { CanonicalProperty } from "./propertyTypes";

const DIR = path.join(process.cwd(), "data", "property-live");
const filePath = (sourceId: string) => path.join(DIR, `${sourceId}.json`);

export interface LiveOverlay {
  sourceId: string;
  fetchedAt: string;
  records: CanonicalProperty[];
}

export function readLiveRecords(sourceId: string): LiveOverlay | null {
  try {
    return JSON.parse(fs.readFileSync(filePath(sourceId), "utf8")) as LiveOverlay;
  } catch {
    return null;
  }
}

export function writeLiveRecords(sourceId: string, records: CanonicalProperty[], fetchedAt: string): void {
  fs.mkdirSync(DIR, { recursive: true });
  const payload: LiveOverlay = { sourceId, fetchedAt, records };
  fs.writeFileSync(filePath(sourceId), JSON.stringify(payload), "utf8");
}
