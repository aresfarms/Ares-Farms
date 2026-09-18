/**
 * townCharacterCurated — "what makes this town special," CURATED (founder
 * direction 2026-07-17: a beach town known for its fishing, a town near a
 * city known for ABC — the line a local would say first).
 *
 * FIRST-PARTY EDITORIAL, deliberately small: every entry is written or
 * approved by the Furlong team and must be verifiable geography, economy, or
 * civic fact — never demographics, safety, school quality, or "who lives
 * here" (fair-housing doctrine; this file is scanned by verify:brief-copy).
 *
 * Scaling path: bulk town descriptions would come from a licensed or
 * attribution-bound source (e.g. Wikipedia/Wikidata under CC BY-SA), which
 * is a NEW non-government source class — that activation goes through the
 * standard source review (Module 22/23) before any ingest is written. Until
 * then: no entry, no line — the chart never pretends.
 *
 * Key: "ST/town name" lowercase.
 */

export interface TownCharacterNote {
  /** One line, as a local would say it. Verifiable facts only. */
  line: string;
}

const TOWN_CHARACTER: Record<string, TownCharacterNote> = {
  "tx/port lavaca": {
    line:
      "A Gulf Coast town on Lavaca Bay, known for its fishing piers, bay seafood, and working waterfront — about half an hour from the Matagorda Bay beaches.",
  },
  "ks/galva": {
    line:
      "A small farm town on the Kansas plains between McPherson and Hutchinson, in a county known for wheat ground and small private colleges.",
  },
  "ks/mcpherson": {
    line:
      "A county-seat town known for its small private colleges and steady manufacturing base, off I-135 between Wichita and Salina.",
  },
  "md/federalsburg": {
    line:
      "An Eastern Shore town on Marshyhope Creek in Maryland's farm country, within an hour of the Chesapeake Bay and the Delaware beaches.",
  },
};

/** Brief-fact shape (structurally matches BriefFactLine — kept local to avoid a cycle). */
export function townCharacterFact(
  stateCode: string | null,
  town: string | null
): { label: string; value: string; text: string; provenance: string; tone: "neutral" } | null {
  if (!stateCode || !town) return null;
  const note = TOWN_CHARACTER[`${stateCode.toLowerCase()}/${town.trim().toLowerCase()}`];
  if (!note) return null;
  return {
    label: "The town, in a line",
    value: note.line.split("—")[0].trim().replace(/,$/, ""),
    text:
      `${note.line} Written and verified by the Furlong team from public geographic and civic ` +
      `sources — character context, never a recommendation.`,
    provenance: "Source: Furlong place note (curated, first-party)",
    tone: "neutral",
  };
}
