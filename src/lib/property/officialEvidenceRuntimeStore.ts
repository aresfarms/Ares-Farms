import * as fs from "node:fs";
import * as path from "node:path";

import { runtimeStatePath } from "./runtimeStatePath";
import type { OfficialEvidenceRefreshState } from "./officialEvidenceRefreshWriter";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

const DIR = runtimeStatePath("official-evidence");
const statePath = (sourceId: OfficialEvidenceSourceId) => runtimeStatePath("official-evidence", `${sourceId}.json`);

export function readOfficialEvidenceRefreshState<T>(sourceId: OfficialEvidenceSourceId): OfficialEvidenceRefreshState<T> | null {
  try {
    return JSON.parse(fs.readFileSync(statePath(sourceId), "utf8")) as OfficialEvidenceRefreshState<T>;
  } catch {
    return null;
  }
}

export function writeOfficialEvidenceRefreshState<T>(state: OfficialEvidenceRefreshState<T>): void {
  fs.mkdirSync(DIR, { recursive: true });
  const target = statePath(state.sourceId);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(state, null, 2) + "\n", "utf8");
  fs.renameSync(temp, target);
}

export function officialEvidenceStateFile(sourceId: OfficialEvidenceSourceId): string {
  return path.resolve(statePath(sourceId));
}
