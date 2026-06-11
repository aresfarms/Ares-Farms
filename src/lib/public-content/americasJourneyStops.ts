/**
 * americasJourneyStops — Build 53
 *
 * Canonical data model and verified stop pool for the America's Journey
 * homepage map experience.
 *
 * PublicMapExperience imports from this file only. Stop data is NEVER
 * hardcoded in the component.
 *
 * All facts verified (NPS, Smithsonian/NMAAHC, Library of Congress,
 * National Archives, USGS/USDA, state historical societies).
 *
 * SINGLE SOURCE OF TRUTH FOR IMAGES:
 *   The `imageThen`/`imageNow` fields on JourneyStop are editorial reference
 *   copies only. The component reads from:
 *     IMAGES registry    → americasJourneyImages.ts   (then)
 *     NOW_IMAGES registry → americasJourneyNowImages.ts (now)
 *   Do NOT display stop.imageThen or stop.imageNow directly in the component.
 *
 * THE FURLONG WAY:
 *   imageThen.credit + link to imageThen.sourceUrl MUST render visibly
 *   with every image. Never show an archival image without its citation.
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 *   "We show pathways, not promises."
 *   "Public Alpha remains PENDING."
 */

// ── Tone ──────────────────────────────────────────────────────────────────────

/**
 * Documentary register for a stop's narrative.
 * Used by the component for typographic treatment and tone-based marker color.
 */
export type Tone =
  | "wonder"         // Awe-inspiring firsts and discoveries
  | "struggle"       // Hardship and survival
  | "opportunity"    // Access, land, economic opening
  | "sorrow"         // Tragedy, loss of life or culture
  | "injustice"      // Structural exclusion or exploitation
  | "resilience"     // Community rebuilt or sustained against odds
  | "hope"           // Possibility realized
  | "transformation" // Fundamental change in the national story
  | "aspiration"     // Ambition and vision
  | "craft"          // Skilled labor and its communities
  | "immigration"    // Migration, settlement, cultural transplant
  | "loss"           // Environmental or cultural destruction
  | "wit"            // Irony or unexpected historical twist
  | "movement"       // Mass migration or collective action
  | "betrayal";      // Broken promises or reversed gains

// ── ArchivalImage ─────────────────────────────────────────────────────────────

/**
 * An image from the historical record. Mandatory fields ensure credit is
 * always visible. The component must not display this if needsConfirmation
 * is true (gate enforced in americasJourneyImages.ts / verifyJourneyImageCredits.ts).
 *
 * credit and sourceUrl MUST render visibly in the DOM — not tooltip-only.
 * interactionModel.creditRequirement = "visible-always".
 */
export interface ArchivalImage {
  /** Relative path under /public/journey/ or null until downloaded. Never hotlink. */
  src: string | null;
  /** Concise alt text for screen readers. Do not start with "Image of". */
  alt: string;
  /** Full descriptive caption shown alongside the image. */
  description: string;
  /** Source institution name — shown as part of the credit block. */
  institution: string;
  /** Canonical catalog URL — rendered as the visible "Source ↗" link. */
  sourceUrl: string;
  /**
   * Exact visible credit line. MUST appear in the DOM adjacent to the image —
   * never aria-only or tooltip-only.
   */
  credit: string;
  /**
   * Free-text rights description. Use needsConfirmation gate to block display —
   * do not rely on parsing this string in component logic.
   */
  rights: string;
  /**
   * TRUE date of THIS image (not the historical era it depicts). Rendered on the
   * card so each phase is labeled by its real year — e.g. 1865, 1936, "c. 1870s",
   * "Present day". The living-map pool sorts by this to pick an earlier → later
   * pair. Numbers sort naturally; "c. 1870s" parses to its leading digits;
   * "Present day" / undefined sort as the latest.
   */
  year?: number | string;

  // ── Source repository (first-class partner fields) ──────────────────────────
  // Populated for state archives, regional museums, and institutional partners.
  /** Formal name of the source repository or archive. */
  repositoryName?: string;
  /** URL to the repository's main page, finding aid, or collection. */
  repositoryUrl?: string;
  /** Repository type — governs rights discipline and credit format. */
  repositoryType?: "federal" | "state" | "university" | "museum" | "commission";
  /** Institution's preferred attribution string (use verbatim in credit). */
  creditPreference?: string;
  /** Rights status as formally reported by the institution. */
  rightsStatus?: string;
}

// ── JourneyStop ───────────────────────────────────────────────────────────────

export interface JourneyStop {
  /**
   * Unique stable identifier. Never change after a stop has been published —
   * rotation logs and analytics key on this value.
   */
  id: string;

  /** Display place name (city, district, or landmark). */
  place: string;

  /**
   * State or region label. May be multi-state (e.g. "Kentucky / Tennessee / Virginia").
   * Used for map highlighting — the component extracts the primary state for GeoJSON.
   */
  region: string;

  /**
   * Geographic coordinates for marker placement.
   * This is a regional indicator, not a precise address.
   * "The map reveals opportunities, not the visitor."
   */
  coords: { lng: number; lat: number };

  /**
   * Documentary era label shown in the lower-third (e.g. "1787", "1825", "1880s").
   */
  era: string;

  /** Tone governing typographic and marker-color treatment. */
  tone: Tone;

  /**
   * ≤9-word caption for the map lower-third overlay.
   * Format: "Place, State · Era · Hook."
   * This is the primary label visible on the map.
   */
  caption: string;

  /**
   * "Then" narrative — 1–2 concise sentences. Historical framing; third-person;
   * factual. No living-person names. No precise modern addresses.
   * No approval, guarantee, eligibility, or official-determination language.
   */
  then: string;

  /**
   * "Now" narrative — 1–2 concise sentences connecting the historical moment
   * to today's landscape.
   */
  now: string;

  /**
   * 2–3 sentence focus text. The analytical layer — why it matters.
   * Shown as a pull-quote or story panel below the then/now text.
   */
  story: string;

  /** Primary fact citation for this stop's historical claims. */
  source: { name: string; url: string };

  /**
   * Editorial reference copy of the "then" archival image.
   * AUTHORITATIVE SOURCE IS americasJourneyImages.ts (IMAGES registry).
   * The component reads IMAGES[stop.id], not this field.
   */
  imageThen: ArchivalImage | null;

  /**
   * Editorial reference copy of the "now" present-day image.
   * AUTHORITATIVE SOURCE IS americasJourneyNowImages.ts (NOW_IMAGES registry).
   * The component reads NOW_IMAGES[stop.id], not this field.
   */
  imageNow: ArchivalImage | null;

  /**
   * Free-text publishing cautions — editorial notes for the publisher.
   * These are NOT machine-readable flags; they do not block rotation.
   * Review these before the stop's rotation week.
   */
  flags?: string[];
}

// ── Interaction model ─────────────────────────────────────────────────────────

/**
 * Governs all homepage map behavior. Import into PublicMapExperience.
 * Do NOT hardcode these values in the component.
 *
 * Map loads complete + static; motion is the visitor's choice.
 */
export const interactionModel = {
  /** Full US + featured stop's then/now + caption visible on load. */
  defaultState:    "static-complete",
  /** Never moves just because they arrived. */
  autoplayOnLoad:  false,
  /** Comet thread + auto-advance only after "Begin the journey ▶". */
  motion:          "on-demand",
  controls:        ["play", "pause", "next", "prev"] as const,
  /** prefers-reduced-motion: no thread, step manually. */
  reducedMotion:   "static-with-manual-stepthrough",
  cta:             "Begin the journey ▶",
  /** Source credit is in the visible DOM whenever an archival image renders. */
  creditRequirement: "visible-always",
} as const;

export type InteractionModel = typeof interactionModel;

// ── Rotation ──────────────────────────────────────────────────────────────────

/**
 * Reveal one stop at a time; rotation = gradual discovery, fresh on return.
 * Rotation cycles through all publishable stops — no hard publish/block flags
 * in the new model. All stops are rotation-eligible (editorial notes in `flags`
 * should be reviewed before that stop's rotation week, not enforced by code).
 */
export const rotation = {
  strategy:      "deterministic-by-iso-week", // identical for everyone in a given week
  formula:       "featuredIndex = isoWeekNumber(today) % STOPS.length",
  toneBalancing: "Do not feature sorrow/injustice/betrayal stops in consecutive weeks; interleave with wonder/opportunity/wit.",
} as const;

// ── Rotation helpers ──────────────────────────────────────────────────────────

/** ISO week number (1–52 or 53) for a given date. */
function isoWeekNumber(date: Date = new Date()): number {
  const d   = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

/**
 * All stops eligible for rotation. The new model has no machine-readable
 * publish/block gates — all STOPS are rotation-eligible. Editorial cautions
 * live in stop.flags (free text) and are for human review only.
 */
export function getPublishableStops(stops: JourneyStop[] = STOPS): JourneyStop[] {
  return stops;
}

/**
 * Deterministic weekly rotation using ISO week number.
 * formula: stops[ isoWeekNumber(today) % stops.length ]
 * Stable across server renders and client hydration.
 */
export function getFeaturedStop(stops: JourneyStop[] = STOPS): JourneyStop {
  const week = isoWeekNumber();
  return stops[week % stops.length];
}

/** Returns the next stop after currentId (wraps). */
export function getNextStop(currentId: string, stops: JourneyStop[] = STOPS): JourneyStop {
  const idx = stops.findIndex(s => s.id === currentId);
  return stops[(idx + 1) % stops.length];
}

/** Returns the previous stop before currentId (wraps). */
export function getPrevStop(currentId: string, stops: JourneyStop[] = STOPS): JourneyStop {
  const idx = stops.findIndex(s => s.id === currentId);
  return stops[(idx - 1 + stops.length) % stops.length];
}

// ── STOPS ─────────────────────────────────────────────────────────────────────

/**
 * America's Journey verified stop pool — 20 stops.
 *
 * All facts verified via NPS, Smithsonian/NMAAHC, Library of Congress,
 * National Archives, USGS/USDA, and state historical societies (2026-06-06).
 *
 * Editorial rules:
 *   1. Add stops here only — never in the component.
 *   2. imageThen / imageNow are editorial reference only; IMAGES and NOW_IMAGES
 *      registries are the live sources used by the component.
 *   3. Do not remove stops once published — set a flag and leave a comment.
 *   4. No living-person names. No precise modern addresses.
 */
export const STOPS: JourneyStop[] = [

  // ── 1. St. Augustine, 1565 ─────────────────────────────────────────────────
  {
    id:      "st-augustine-1565",
    place:   "St. Augustine",
    region:  "Florida",
    coords:  { lng: -81.31, lat: 29.90 },
    era:     "1565",
    tone:    "wonder",
    caption: "St. Augustine, FL · 1565 · America's first city wasn't English.",
    then: "Spanish settlers raise the first permanent European town in the land that becomes America — decades before the English arrive.",
    now:  "The oldest continuously occupied city in the continental U.S., its colonial streets still walked today.",
    story: "Founded in 1565, St. Augustine predates Jamestown by 42 years and Plymouth by 55. America's story doesn't start where the textbook opens it.",
    source: { name: "National Park Service", url: "https://www.nps.gov/places/st-augustine-town-plan-historic-district-st-augustine-florida.htm" },
    imageThen: {
      src: null,
      alt: "The masonry fort Castillo de San Marcos at St. Augustine",
      description: "Castillo de San Marcos (Historic American Buildings Survey documentation photo)",
      institution: "Library of Congress, Prints & Photographs Division — HABS",
      sourceUrl: "https://www.loc.gov/item/fl0095/",
      credit: "Historic American Buildings Survey, Library of Congress, Prints & Photographs Division, HABS FL-17.",
      rights: "Public domain (U.S. Government work — no known restrictions).",
    },
    imageNow: null,
  },

  // ── 2. Jamestown, 1607 ─────────────────────────────────────────────────────
  {
    id:      "jamestown-1607",
    place:   "Jamestown",
    region:  "Virginia",
    coords:  { lng: -76.78, lat: 37.21 },
    era:     "1607",
    tone:    "struggle",
    caption: "Jamestown, VA · 1607 · Saved not by gold, but by a crop.",
    then: "The 'Starving Time' of 1609–10 kills roughly two-thirds of the colonists; John Rolfe's tobacco gives Virginia its first profitable export.",
    now:  "A preserved archaeological site where America's first cash economy took root.",
    story: "Jamestown nearly collapsed twice. What saved it was not gold but tobacco — the first American fortune was agricultural.",
    source: { name: "NPS / Britannica", url: "https://www.nps.gov/jame/learn/historyculture/john-rolfe.htm" },
    imageThen: {
      src: null,
      alt: "John Smith's 1612 map of Virginia",
      description: "'[Map of Virginia] discovered and discribed by Captain John Smith,' engraved by William Hole, 1612",
      institution: "Library of Congress, Geography & Map Division",
      sourceUrl: "https://www.loc.gov/item/2001695744/",
      credit: "Library of Congress, Geography and Map Division.",
      rights: "Public domain (no known restrictions on publication).",
    },
    imageNow: null,
    flags: ["Death toll is an estimate — say 'roughly two-thirds.'"],
  },

  // ── 3. Wall Street, 1653 ───────────────────────────────────────────────────
  {
    id:      "wall-street-1653",
    place:   "Wall Street",
    region:  "Manhattan, New York",
    coords:  { lng: -74.01, lat: 40.71 },
    era:     "1653",
    tone:    "wonder",
    caption: "Wall Street, NY · 1653 · Named for a wall, not a market.",
    then: "Dutch settlers build a defensive wall across the tip of New Amsterdam; a dirt lane runs beside it.",
    now:  "That lane is the center of global finance.",
    story: "Wall Street is named for an actual wall — a palisade the Dutch built in 1653. The world's money grew up along a colonial fortification.",
    source: { name: "Library of Congress", url: "https://guides.loc.gov/wall-street-history/wall-street" },
    imageThen: {
      src: null,
      alt: "Engraved view of New Amsterdam about 1650",
      description: "'New Amsterdam about 1650' — engraved view of the Dutch settlement at the tip of Manhattan",
      institution: "Library of Congress, Prints & Photographs Division",
      sourceUrl: "https://www.loc.gov/item/2003664773/",
      credit: "Library of Congress, Prints and Photographs Division, LC-DIG-pga-12825.",
      rights: "Public domain (no known restrictions on publication).",
    },
    imageNow: null,
    flags: ["Depicts the Dutch waterfront, not the palisade itself; the 1660 Castello Plan is an alternative if the wall must be shown."],
  },

  // ── 4. Cumberland Gap, 1775 ────────────────────────────────────────────────
  {
    id:      "cumberland-gap-1775",
    place:   "Cumberland Gap",
    region:  "Kentucky / Tennessee / Virginia",
    coords:  { lng: -83.66, lat: 36.60 },
    era:     "1775",
    tone:    "opportunity",
    caption: "Cumberland Gap · 1775 · A country went west through one notch.",
    then: "Daniel Boone blazes the Wilderness Road; an estimated 200,000–300,000 settlers funnel west through a single notch in the mountains.",
    now:  "A national park preserving the doorway to the continent.",
    story: "The Appalachians walled the coast off from the interior. A single gap was the doorway — America expanded through the eye of a needle.",
    source: { name: "National Park Service", url: "https://www.nps.gov/places/cumberland-gap.htm" },
    imageThen: {
      src: null,
      alt: "1872 landscape engraving of the Cumberland Gap",
      description: "'Cumberland Gap,' 1872 engraving (artist H. Fenn, engraver S. V. Hunt)",
      institution: "Library of Congress, Prints & Photographs Division",
      sourceUrl: "https://www.loc.gov/item/95513932/",
      credit: "Courtesy of the Library of Congress, Prints and Photographs Division.",
      rights: "Public domain by date (pre-1929 published engraving).",
    },
    imageNow: null,
    flags: ["PD by date, not an explicit LoC 'no known restrictions' line — use 'Courtesy of the Library of Congress.' Do NOT use the Bingham painting (reproduction restricted by Kemper Art Museum)."],
  },

  // ── 5. New York Harbor / Erie Canal, 1825 ─────────────────────────────────
  {
    id:      "ny-harbor-erie-canal-1825",
    place:   "New York Harbor",
    region:  "New York",
    coords:  { lng: -74.02, lat: 40.70 },
    era:     "1825",
    tone:    "opportunity",
    caption: "New York Harbor · 1825 · The money followed the grain.",
    then: "A 363-mile 'ditch' — the Erie Canal — links the Great Lakes to the Atlantic, making New York the cheapest route for the nation's grain.",
    now:  "The financial capital the canal built; Lady Liberty rises at the harbor mouth in 1886.",
    story: "New York became the money capital because of a canal: it followed the grain. (The Statue of Liberty's immigrant-beacon meaning grew after dedication, with Ellis Island and the Lazarus poem.)",
    source: { name: "Smithsonian NMAH / Britannica", url: "https://americanhistory.si.edu/explore/exhibitions/on-the-water/online/inland-waterways/river-towns-networks/artificial-river-erie-canal" },
    imageThen: {
      src: null,
      alt: "Engraving of the Erie Canal locks at Lockport, New York",
      description: "'Lockport, Erie Canal' — engraving of the double flight of locks at Lockport, NY",
      institution: "Library of Congress, Prints & Photographs Division",
      sourceUrl: "https://www.loc.gov/item/cph12522/",
      credit: "Courtesy of the Library of Congress, Prints and Photographs Division.",
      rights: "Public domain by date (19th-century published engraving).",
    },
    imageNow: null,
    flags: ["Statue of Liberty: do NOT say it was built to greet immigrants — that meaning developed after 1886 (NPS 'The French Connection')."],
  },

  // ── 6. The Cotton Gin, 1793 ────────────────────────────────────────────────
  {
    id:      "cotton-gin-1793",
    place:   "The Deep South",
    region:  "Georgia",
    coords:  { lng: -81.09, lat: 32.08 },
    era:     "1793",
    tone:    "sorrow",
    caption: "The Cotton Gin · 1793 · The machine that deepened slavery.",
    then: "Eli Whitney's cotton gin, meant to ease labor, instead makes short-staple cotton wildly profitable.",
    now:  "A sobering lesson in a machine that backfired — it entrenched and expanded slavery across the South.",
    story: "Invented to reduce labor, the cotton gin did the opposite: by making cotton hugely profitable, it dramatically expanded and entrenched slavery.",
    source: { name: "National Archives", url: "https://www.archives.gov/education/lessons/cotton-gin-patent" },
    imageThen: null,
    imageNow: null,
    flags: ["Handle with dignity — somber. Possible image: the 1794 cotton-gin patent drawing (National Archives)."],
  },

  // ── 7. Nebraska Homestead, 1863 ────────────────────────────────────────────
  {
    id:      "nebraska-homestead-1863",
    place:   "Beatrice",
    region:  "Nebraska",
    coords:  { lng: -96.75, lat: 40.27 },
    era:     "1863",
    tone:    "opportunity",
    caption: "Nebraska · 1863 · The first homestead, claimed at midnight.",
    then: "Minutes after midnight on Jan 1, 1863, Daniel Freeman files the first claim under the Homestead Act.",
    now:  "The breadbasket — rich wind-laid loess soil irrigated from the ancient Ogallala Aquifer beneath.",
    story: "Nebraska's corn country was set by geology and a land law, not luck: loess soil, the vast Ogallala Aquifer, and the Homestead Act's very first claim.",
    source: { name: "NPS / USGS / National Archives", url: "https://www.nps.gov/people/daniel-freeman.htm" },
    imageThen: null,
    imageNow: null,
    flags: ["Soil is loess (wind-laid), NOT glacial. Possible image: NPS Homestead National Historical Park / LoC homesteading photos."],
  },

  // ── 8. Promontory Summit, 1869 ─────────────────────────────────────────────
  {
    id:      "promontory-1869",
    place:   "Promontory Summit",
    region:  "Utah",
    coords:  { lng: -112.55, lat: 41.62 },
    era:     "1869",
    tone:    "injustice",
    caption: "Promontory, UT · 1869 · Built by the hands not in the photo.",
    then: "Chinese workers — about 90% of the Central Pacific force — blast through the Sierra Nevada by hand; their dead are never officially counted.",
    now:  "A national historic site that finally tells whose hands built the railroad.",
    story: "The hardest, deadliest miles of the transcontinental railroad were built largely by Chinese laborers — who are absent from the famous golden-spike photograph.",
    source: { name: "National Park Service", url: "https://www.nps.gov/gosp/learn/historyculture/chinese-labor-and-the-iron-road.htm" },
    imageThen: {
      src: null,
      alt: "Central Pacific construction crew (largely Chinese laborers) near the Summit Tunnel, c.1865–67",
      description: "'Laborers and rocks, near opening of Summit Tunnel' — Central Pacific crew, by Alfred A. Hart, c.1865–1867",
      institution: "Library of Congress, Prints & Photographs Division",
      sourceUrl: "https://www.loc.gov/item/2005682913/",
      credit: "Library of Congress, Prints and Photographs Division.",
      rights: "Public domain (no known restrictions on publication).",
    },
    imageNow: null,
    flags: ["Say 'absent from' the photo, NEVER 'excluded' (NPS: likely not deliberate). Hedge worker count (~90% / 12,000–15,000) and death toll ('never fully counted')."],
  },

  // ── 9. Great Plains / Bison, 1880s ─────────────────────────────────────────
  {
    id:      "great-plains-bison-1880s",
    place:   "The Great Plains",
    region:  "Central Plains",
    coords:  { lng: -101.5, lat: 43.5 },
    era:     "1880s",
    tone:    "loss",
    caption: "The Great Plains · 1880s · From 30 million to fewer than 1,000.",
    then: "An estimated 30–60 million bison fall to fewer than 1,000 — through hide-hunting and a deliberate slaughter aimed at subjugating Plains nations.",
    now:  "Slowly restored on protected lands.",
    story: "In a single generation the bison were driven from tens of millions to near-extinction — partly to starve the Plains nations off their land.",
    source: { name: "National Park Service", url: "https://www.nps.gov/articles/000/what-happened-to-the-bison.htm" },
    imageThen: null,
    imageNow: null,
    flags: ["Figures estimated (30–60M → fewer than 1,000). Somber."],
  },

  // ── 10. California Delta, 1860s–1882 ───────────────────────────────────────
  {
    id:      "california-delta-1882",
    place:   "The Sacramento Delta",
    region:  "California",
    coords:  { lng: -121.51, lat: 38.25 },
    era:     "1860s–1882",
    tone:    "injustice",
    caption: "California's Delta · 1860s · The valley built by the banned.",
    then: "Chinese laborers build the Delta levees that reclaim ~500,000 acres of farmland.",
    now:  "The Central Valley feeds the nation — but the Chinese Exclusion Act of 1882 became the first U.S. law to bar a nationality.",
    story: "The richest farm economy in the country was built in part by Chinese laborers — who were then repaid with the first U.S. law to ban a people by nationality.",
    source: { name: "NPS / National Archives", url: "https://www.archives.gov/milestone-documents/chinese-exclusion-act" },
    imageThen: null,
    imageNow: null,
  },

  // ── 11. Mississippi Delta / Chinese community, 1870s–1970s ─────────────────
  {
    id:      "mississippi-delta-chinese-1870s",
    place:   "The Mississippi Delta",
    region:  "Mississippi",
    coords:  { lng: -90.7, lat: 33.5 },
    era:     "1870s–1970s",
    tone:    "resilience",
    caption: "Mississippi Delta · 1870s · From cotton fields to corner stores.",
    then: "Chinese immigrants recruited to pick cotton instead build family grocery networks serving Black sharecropper communities.",
    now:  "A small, storied community — six surnames once made up ~80% of it.",
    story: "Brought to the Delta to pick cotton, Chinese immigrants built a network of family grocery stores between the color lines of the segregated South.",
    source: { name: "Mississippi History Now (MS Dept. of Archives & History)", url: "https://www.mshistorynow.mdah.ms.gov/issue/mississippi-chinese-an-ethnic-people-in-a-biracial-society" },
    imageThen: null,
    imageNow: null,
  },

  // ── 12. Nicodemus, 1877 ────────────────────────────────────────────────────
  {
    id:      "nicodemus-1877",
    place:   "Nicodemus",
    region:  "Kansas",
    coords:  { lng: -99.62, lat: 39.39 },
    era:     "1877",
    tone:    "hope",
    caption: "Nicodemus, KS · 1877 · Freedom, homesteaded on the plains.",
    then: "Formerly enslaved 'Exodusters' found an all-Black town on the open Kansas plains.",
    now:  "The oldest surviving Black town west of the Mississippi — a national historic site.",
    story: "Formerly enslaved families left the South to homestead their own town on the plains — and Nicodemus still stands.",
    source: { name: "National Park Service", url: "https://www.nps.gov/places/nicodemus-national-historic-site.htm" },
    imageThen: null,
    imageNow: null,
  },

  // ── 13. Spindletop, 1901 ───────────────────────────────────────────────────
  {
    id:      "spindletop-1901",
    place:   "Spindletop, Beaumont",
    region:  "Texas",
    coords:  { lng: -94.07, lat: 29.98 },
    era:     "1901",
    tone:    "transformation",
    caption: "Spindletop, TX · 1901 · The gusher that made modern oil.",
    then: "A gusher erupts; Beaumont swells from 10,000 to 50,000 in a year; Texaco, Gulf, and Exxon are born.",
    now:  "The birthplace of the modern oil age.",
    story: "One gusher in 1901 launched the modern petroleum industry and three of the largest companies in American history.",
    source: { name: "Texas State Historical Association", url: "https://www.tshaonline.org/handbook/entries/spindletop-oilfield" },
    imageThen: null,
    imageNow: null,
  },

  // ── 14. Yosemite, 1864 ─────────────────────────────────────────────────────
  {
    id:      "yosemite-1864",
    place:   "Yosemite",
    region:  "California",
    coords:  { lng: -119.59, lat: 37.75 },
    era:     "1864",
    tone:    "wonder",
    caption: "Yosemite, CA · 1864 · Where the idea of saving land began.",
    then: "In the middle of the Civil War, President Lincoln signs the Yosemite Grant — the first time the U.S. sets aside land purely to be preserved for the public.",
    now:  "The valley that taught a nation to protect its wild places, visited by millions.",
    story: "Lincoln's 1864 Yosemite Grant protected the valley 'for public use, resort, and recreation' — inventing the idea behind every national park, eight years before Yellowstone. Carleton Watkins's photographs helped win the argument; the Ahwahneechee who had lived there for generations had already been driven out.",
    source: { name: "National Park Service", url: "https://www.nps.gov/yose/learn/management/yosemite-grant-act-of-1864.htm" },
    imageThen: null,
    imageNow: null,
    flags: ["Watkins/Congress link is 'rumored' per NPS — say 'helped influence,' not 'presented to Congress.' Ahwahneechee = Southern Sierra Miwok; displacement began 1851. Yosemite became a national park in 1890."],
  },

  // ── 15. Barre, Vermont, 1880s ──────────────────────────────────────────────
  {
    id:      "barre-granite-1880s",
    place:   "Barre",
    region:  "Vermont",
    coords:  { lng: -72.50, lat: 44.20 },
    era:     "1880s",
    tone:    "craft",
    caption: "Barre, VT · 1880s · Scotland and Italy, carved in granite.",
    then: "A rail spur turns tiny Barre into America's granite capital, drawing Scottish then Italian stonecutters.",
    now:  "Still the granite center; the immigrant heritage is carved into the town (and a hard silicosis toll into its history).",
    story: "A single railroad spur made Barre the granite capital of America and pulled the stonecutters of Scotland and Italy to a Vermont hill town.",
    source: { name: "Vermont Historical Society", url: "https://vermonthistory.org/journal/74/05_Richards.pdf" },
    imageThen: null,
    imageNow: null,
  },

  // ── 16. Boise / Basque, 1890s ──────────────────────────────────────────────
  {
    id:      "basque-boise-1890s",
    place:   "Boise",
    region:  "Idaho",
    coords:  { lng: -116.20, lat: 43.62 },
    era:     "1890s",
    tone:    "immigration",
    caption: "Boise, ID · 1890s · The Pyrenees, herding the Great Basin.",
    then: "Basque shepherds from the Pyrenees build the open-range sheep industry across the Great Basin.",
    now:  "Boise holds one of the largest Basque communities outside Europe.",
    story: "The American West's sheep country was built by Basque immigrants — and Boise is now one of the great centers of Basque culture on Earth.",
    source: { name: "Smithsonian Folklife Festival", url: "https://festival.si.edu/2016/basque-diaspora-in-the-united-states/smithsonian" },
    imageThen: null,
    imageNow: null,
  },

  // ── 17. Greenwood, Tulsa, 1921 ─────────────────────────────────────────────
  {
    id:      "greenwood-tulsa-1921",
    place:   "Greenwood, Tulsa",
    region:  "Oklahoma",
    coords:  { lng: -95.98, lat: 36.16 },
    era:     "1921",
    tone:    "sorrow",
    caption: "Greenwood, Tulsa · 1921 · Black Wall Street — prosperity, erased.",
    then: "'Black Wall Street' — one of America's wealthiest Black communities — is burned by white mobs on May 31–June 1, 1921.",
    now:  "A district remembering and rebuilding what was erased — and left out of the history books for decades.",
    story: "Greenwood was the wealthiest Black community in America, with its own banks and theaters, until a white mob destroyed it in 1921.",
    source: { name: "Smithsonian NMAAHC", url: "https://nmaahc.si.edu/explore/stories/remembering-tulsa-before-massacre" },
    imageThen: null,
    imageNow: null,
    flags: ["Death toll uncertain — 'as many as 300.' Handle factually and with dignity."],
  },

  // ── 18. The Dust Bowl, 1930s ───────────────────────────────────────────────
  {
    id:      "dust-bowl-1930s",
    place:   "The Great Plains",
    region:  "Oklahoma / Texas Panhandle",
    coords:  { lng: -101.5, lat: 36.5 },
    era:     "1930s",
    tone:    "struggle",
    caption: "The Dust Bowl · 1930s · How we learned to keep the soil.",
    then: "Drought and the plowing-up of native grassland strip the plains into black blizzards.",
    now:  "The root of American soil stewardship — the Soil Conservation Service was born in 1935.",
    story: "The Dust Bowl was a failure of land stewardship that reshaped American farming and created the soil-conservation movement.",
    source: { name: "USDA NRCS", url: "https://www.nrcs.usda.gov/about/history/brief-history-nrcs" },
    imageThen: null,
    imageNow: null,
    flags: ["Strong public-domain imagery available: LoC FSA/OWI photos (Dorothea Lange, Arthur Rothstein). Ties to Furlong stewardship theme."],
  },

  // ── 19. Field Order No. 15, 1865 ───────────────────────────────────────────
  {
    id:      "field-order-15-1865",
    place:   "Coastal Georgia & South Carolina",
    region:  "Georgia / South Carolina",
    coords:  { lng: -81.1, lat: 31.8 },
    era:     "1865",
    tone:    "betrayal",
    caption: "Coastal Georgia · 1865 · The promise of forty acres, unmade.",
    then: "Sherman's Special Field Orders No. 15 set aside ~400,000 acres in 40-acre plots for freed families.",
    now:  "A phrase — '40 acres and a mule' — that still names an unkept American promise.",
    story: "For a few months, freed families were granted land of their own. President Andrew Johnson reversed the order that same year and restored it to former owners.",
    source: { name: "Britannica / NPS", url: "https://www.britannica.com/topic/Field-Order-No-15" },
    imageThen: null,
    imageNow: null,
    flags: ["The 'mule' was an informal Army addition, not in the order text. Somber."],
  },

  // ── 20. The Great Migration, 1916–1970 ─────────────────────────────────────
  {
    id:      "great-migration-1916-1970",
    place:   "The American South → North",
    region:  "South to North/Midwest/West",
    coords:  { lng: -88.0, lat: 38.0 }, // representative midpoint
    era:     "1916–1970",
    tone:    "movement",
    caption: "The Great Migration · 1916–1970 · Six million journeys north.",
    then: "An estimated 6 million Black Americans leave the South for cities in the North, Midwest, and West.",
    now:  "The cultural map of modern America.",
    story: "The largest internal migration in U.S. history remade the country's cities, music, and politics — six million journeys, mostly unnamed at the time.",
    source: { name: "National Archives / U.S. Census Bureau", url: "https://www.archives.gov/research/african-americans/migrations/great-migration" },
    imageThen: null,
    imageNow: null,
    flags: ["This is a movement, not a point — best rendered as an animated South→North flow. AVOID Jacob Lawrence Migration Series imagery (copyrighted); use LoC photos or the Census visualization."],
  },

];
