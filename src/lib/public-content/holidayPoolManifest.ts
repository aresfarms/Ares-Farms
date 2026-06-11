/**
 * holidayPoolManifest — Living Map, Phase 4 (Holiday engine)
 *
 * Themed earlier→later image candidates for holiday takeovers, sourced and
 * gated exactly like journeyPoolManifest.ts (CC0 / public domain only). The
 * ingestion script (ingestJourneyPool.ts) resolves each LoC catalog page to its
 * largest image, downloads it into /public/journey/, and writes the resolved
 * records into GENERATED_HOLIDAY_POOL (keyed by holidayId).
 *
 * This run seeds the two acceptance holidays (Independence Day, Memorial Day).
 * The weekly photo run grows the rest (Labor Day, Veterans Day, Halloween,
 * Thanksgiving, Christmas, Hanukkah, Kwanzaa, Lunar New Year, New Year's,
 * Easter, MLK Day, Grandparents Day) by appending here.
 *
 * Tone discipline: remembrance holidays (Memorial Day, Veterans Day, MLK Day)
 * use dignified, non-combat imagery and a quieter visual treatment.
 *
 * "The map reveals opportunities, not the visitor."
 * Public Alpha remains PENDING.
 */

export interface HolidayCandidate {
  /** Holiday id — matches Holiday.id / HOLIDAY_POOLS key in holidayCalendar.ts. */
  holidayId: string;
  /** TRUE date of the image. Numbers sort naturally; "Present day" sorts last. */
  year: number | string;
  /** LoC catalog page. The image URL is resolved from here at ingest. */
  sourceUrl: string;
  /** Exact visible credit line. */
  credit: string;
  /** Rights status — must be CC0 / public domain / no known restrictions. */
  rights: string;
  /** Concise alt text. */
  alt: string;
}

const PD_FSA = "Public domain (FSA/OWI — free to use and reuse).";
const PD_HIGHSMITH = "Public domain — no known restrictions on publication (Carol M. Highsmith gift).";

export const HOLIDAY_MANIFEST: HolidayCandidate[] = [

  // ── Independence Day — vintage celebration → modern fireworks ───────────────
  {
    holidayId: "independence-day", year: 1941,
    sourceUrl: "https://www.loc.gov/item/2017789893/",
    credit: "Tug of war, Fourth of July celebration, Vale, Oregon, Russell Lee, 1941. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Tug of war at a Fourth of July celebration in Vale, Oregon, 1941",
  },
  {
    holidayId: "independence-day", year: 2007,
    sourceUrl: "https://www.loc.gov/item/2010630446/",
    credit: "July 4th fireworks, Washington, D.C. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Fourth of July fireworks over Washington, D.C.",
  },

  // ── Memorial Day — early observance → quiet remembrance today (no combat) ───
  {
    holidayId: "memorial-day", year: 1943,
    sourceUrl: "https://www.loc.gov/item/2017855283/",
    credit: "Arlington Cemetery, Arlington, Virginia — the Stars and Stripes at the Memorial Day observance, 1943. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "The flag at a Memorial Day observance, Arlington Cemetery, 1943",
  },
  {
    holidayId: "memorial-day", year: "Present day",
    sourceUrl: "https://www.loc.gov/item/2011632173/",
    credit: "Spring at Arlington National Cemetery, Arlington, Virginia. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "A quiet spring view across Arlington National Cemetery today",
  },

];
