/**
 * stateNarrativeCurated — "what this state/region is known for," the NARRATIVE
 * layer above the GNIS geographic layer (founder direction 2026-07-17).
 *
 * TWO tiers, by source class:
 *   1. FIRST-PARTY notes (this file, LIVE now): written by the Furlong team
 *      from well-known public-domain geography, economy, and history. Same
 *      discipline as townCharacterCurated — verifiable facts only, never
 *      demographics, safety, or "who lives here" (fair-housing; scanned by
 *      verify:brief-copy).
 *   2. LICENSED state historical-society encyclopedias (Handbook of Texas,
 *      Encyclopedia of Arkansas, etc.) — the future ENRICHMENT layer, and
 *      deliberately NOT built here: their text is copyrighted, so it enters
 *      only through a signed license + Module 22/23 source review. The
 *      `licensedNarrative` slot below is where a reviewed feed attaches; it
 *      stays null until a license exists. We never copy their content, and
 *      we never fall back to publicly-editable sources (no Wikipedia).
 *
 * Key: two-letter state/territory code.
 */

export interface StateNarrativeNote {
  /** First-party, public-domain-sourced line. */
  line: string;
  /** Reserved for a REVIEWED, LICENSED encyclopedia excerpt — null until a
      license + Module 22/23 review lands. Never populated by scraping. */
  licensedNarrative?: null;
}

const STATE_NARRATIVE: Record<string, StateNarrativeNote> = {
  TX: {
    line:
      "Texas — the second-largest state by land and population, spanning Gulf Coast, Hill Country, plains, and desert; an economy built on energy, cattle, agriculture, and, increasingly, technology.",
  },
  KS: {
    line:
      "Kansas — the heart of the Great Plains and one of the nation's top wheat and cattle producers, with a farm economy, aviation manufacturing around Wichita, and wide-open prairie.",
  },
  PR: {
    line:
      "Puerto Rico — a U.S. territory of mountains and beaches in the Caribbean; residents are U.S. citizens, property is recorded in the Spanish-tradition registry (lots in square meters, parcels as 'fincas'), and federal programs like USDA rural housing apply.",
  },
  MD: {
    line:
      "Maryland — a compact Mid-Atlantic state defined by the Chesapeake Bay, from Eastern Shore farm and watermen country to the Baltimore–Washington corridor; known for blue crab, biosciences, and federal employment.",
  },
  AL: {
    line:
      "Alabama — a Deep South state running from the Appalachian foothills to the Gulf Coast, with a heritage of cotton and steel and a modern base in aerospace (Huntsville) and auto manufacturing.",
  },
  FL: {
    line:
      "Florida — a peninsula state known for its beaches, wetlands, and warm climate, with an economy anchored in tourism, agriculture (citrus), aerospace, and a large retiree population.",
  },
};

/** Brief-fact shape (structurally matches BriefFactLine — kept local). */
export function stateNarrativeFact(
  stateCode: string | null
): { label: string; value: string; text: string; provenance: string; tone: "neutral" } | null {
  if (!stateCode) return null;
  const note = STATE_NARRATIVE[stateCode.toUpperCase()];
  if (!note) return null;
  return {
    label: "The state, in brief",
    value: note.line.split("—")[1]?.trim().split(",")[0]?.trim() ?? note.line.slice(0, 48),
    text:
      `${note.line} Written by the Furlong team from public-domain geography, economy, and ` +
      `history — orientation context, never a recommendation.`,
    provenance: "Source: Furlong place note (curated, first-party)",
    tone: "neutral",
  };
}
