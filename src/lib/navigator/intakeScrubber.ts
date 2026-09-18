/**
 * Intake scrubber — the ARCHITECTURAL lock of CONST-PROPERTY-PRIVACY-001.
 *
 * Every property/area record entering the Navigator pipeline passes through
 * scrubPropertyRecord() at the boundary, BEFORE storage and BEFORE any model
 * context is assembled. It strips, recursively and case-insensitively:
 *
 *  - G-1 owner identity: assessor/parcel feeds routinely carry owner name,
 *    mailing address, taxpayer identity → removed at intake. Can't leak what
 *    isn't there.
 *  - G-2 protected-class/demographic fields: Census/area joins routinely carry
 *    race/ethnicity/religion/national-origin/familial/disability/sex fields →
 *    removed at intake. (HOPA: the boolean 55+/senior DESIGNATION survives —
 *    it is a lawful property/community designation, not a demographic profile.)
 *
 * The scrub REPORTS what it removed (field names only, never values) so the
 * verifier can prove the lock fires, and so ingest observability can count it.
 */

export const SCRUBBER_VERSION = "intake-scrubber-v0.1.0";

/** Owner/identity field names (substring match, case-insensitive). */
const OWNER_FIELD_PATTERNS: RegExp[] = [
  /owner/i,            // owner_name, ownerName, owner_mailing_address, deeded_owner…
  /taxpayer/i,
  /deed_?holder/i,
  /title_?holder/i,
  /grantee/i,
  /grantor/i,
  /resident_?name/i,
  /occupant/i,
  /landlord/i,
  /borrower/i,
  /mortgagor/i,
  /care_?of/i,         // "c/o" mailing lines
];

/** Protected-class / demographic field names. */
const DEMOGRAPHIC_FIELD_PATTERNS: RegExp[] = [
  /race/i,
  /ethnic/i,
  /hispanic/i,
  /latino/i,
  /national_?origin/i,
  /ancestry/i,
  /religion/i,
  /\bsex\b/i,
  /gender/i,
  /familial/i,
  /household_?composition/i,
  /disabilit/i,
  /minority/i,
  /demographic/i,
  /foreign_?born/i,
  /language_?spoken/i,
];

/**
 * HOPA designation fields that must SURVIVE the scrub (designation in,
 * profiling out). Checked before the demographic patterns.
 */
const HOPA_KEEP_PATTERNS: RegExp[] = [
  /senior_?community/i,
  /age_?restricted/i,
  /55_?plus|fifty_?five/i,
  /hopa/i,
];

function isOwnerField(key: string): boolean {
  return OWNER_FIELD_PATTERNS.some((re) => re.test(key));
}
function isDemographicField(key: string): boolean {
  if (HOPA_KEEP_PATTERNS.some((re) => re.test(key))) return false; // lawful designation
  return DEMOGRAPHIC_FIELD_PATTERNS.some((re) => re.test(key));
}

export interface ScrubReport {
  /** Field paths removed (names only — values are gone and never logged). */
  removedOwnerFields: string[];
  removedDemographicFields: string[];
  keptHopaFields: string[];
}

/**
 * Deep-scrub a record. Returns a NEW object with banned fields removed at every
 * depth, plus the report. Arrays and nested objects are traversed.
 */
export function scrubPropertyRecord<T extends Record<string, unknown>>(record: T): { scrubbed: Record<string, unknown>; report: ScrubReport } {
  const report: ScrubReport = { removedOwnerFields: [], removedDemographicFields: [], keptHopaFields: [] };

  function walk(value: unknown, path: string): unknown {
    if (Array.isArray(value)) return value.map((v, i) => walk(v, `${path}[${i}]`));
    if (value !== null && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const p = path ? `${path}.${k}` : k;
        if (isOwnerField(k)) { report.removedOwnerFields.push(p); continue; }
        if (isDemographicField(k)) { report.removedDemographicFields.push(p); continue; }
        if (HOPA_KEEP_PATTERNS.some((re) => re.test(k))) report.keptHopaFields.push(p);
        out[k] = walk(v, p);
      }
      return out;
    }
    return value;
  }

  return { scrubbed: walk(record, "") as Record<string, unknown>, report };
}

/** Assert (post-scrub) that no banned field survived — the data-layer check. */
export function assertNoBannedFields(record: Record<string, unknown>): { ok: boolean; survivors: string[] } {
  const survivors: string[] = [];
  function walk(value: unknown, path: string): void {
    if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const p = path ? `${path}.${k}` : k;
        if (isOwnerField(k) || isDemographicField(k)) survivors.push(p);
        walk(v, p);
      }
    }
  }
  walk(record, "");
  return { ok: survivors.length === 0, survivors };
}
