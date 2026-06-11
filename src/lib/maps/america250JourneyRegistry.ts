/**
 * America 250 Journey Registry — Build 49-B
 *
 * Multi-stop journey entries for the America 250 living-history series.
 * A Journey expands a featured state story into a stop-by-stop historical
 * sequence with founder-authored narrative per stop — deeper detail than
 * the three-node FeaturedStory entries in america250StoryRegistry.ts.
 *
 * Journeys registered here:
 *   1. newYorkErieCanalJourney
 *      NY Harbor → Albany → Boomtown Corridor → Buffalo
 *      1609 → 1817 → 1825 → Today
 *
 * Governance:
 *   - No geolocation. No visitor identification. No personal data.
 *   - "The map reveals opportunities, not the visitor."
 *   - Historical copy is editorial, informed by public-domain records.
 *   - No approval / guarantee / determination language.
 *   - Public Alpha remains PENDING.
 *
 * @see src/lib/maps/america250StoryRegistry.ts (top-level state stories)
 * @see src/components/customer/LivingOpportunityMap.tsx (map renderer)
 */

// ── Types ──────────────────────────────────────────────────────────────────────

/** A single waypoint in a multi-stop America 250 Journey. */
export type JourneyStop = {
  /** Unique identifier within the journey. */
  id: string;
  /** Short display label — map-friendly, used in pathway chips. */
  label: string;
  /** Geographic position for map marker rendering.
   *  Coordinates are illustrative and refer to a named public location,
   *  not any individual address or property. */
  latLon: { lat: number; lon: number };
  /** Historical era tag — shown as a subheading in story cards. */
  period: string;
  /** Founder-authored narrative for this stop. */
  narrative: string;
  /** One-sentence note connecting this stop's history to present-day opportunity patterns.
   *  Advisory only. No approval, guarantee, or determination language. */
  modernRelevance: string;
  /** Hex color for this stop's map marker and story chip. */
  color: string;
};

/** A named, ordered, multi-stop journey within the America 250 series. */
export type America250Journey = {
  /** Canonical machine identifier — kebab-case, stable across builds. */
  id: string;
  /** Founder-authored display title. */
  headline: string;
  /** One-line summary shown in map overlays and selector chips. */
  subheadline: string;
  /** Primary state this journey covers. */
  state: string;
  /** Series classification — all journeys in this file belong to america-250. */
  seriesId: "america-250";
  /** Era span for display — e.g. "1609 → Today". */
  period: string;
  /** Ordered stop sequence. Rendered left-to-right on the pathway. */
  stops: JourneyStop[];
  /** Governance note — displayed in the disclosure region. */
  governanceNote: string;
};

// ── Color tokens ───────────────────────────────────────────────────────────────
// Each stop in this journey has a distinct color marking its role in the canal story.

const HARBOR_BLUE  = "#1a5fa8"; // NY Harbor — Atlantic gateway
const CANAL_GREEN  = "#2e7a5c"; // Albany — canal origin, same as NY_GREEN in story registry
const COMMERCE_GOLD = "#c9a84c"; // Boomtown Corridor — trade and prosperity
const LAKES_TEAL   = "#2a7a8c"; // Buffalo — Great Lakes terminus

// ─────────────────────────────────────────────────────────────────────────────
// NY ERIE CANAL JOURNEY
//
// Four stops tracing the 363-mile waterway that opened the American interior.
// NY Harbor → Albany → Boomtown Corridor → Buffalo
//
// Source context: public-domain U.S. government and historical society records.
// Coordinates are illustrative public landmarks — not individual properties.
// ─────────────────────────────────────────────────────────────────────────────

const NY_HARBOR_STOP: JourneyStop = {
  id:     "ny-harbor",
  label:  "NY Harbor",
  latLon: { lat: 40.702, lon: -74.014 },
  period: "1609 · 1789 · The Atlantic Gateway",
  color:  HARBOR_BLUE,
  narrative:
    "Henry Hudson sailed into this harbor in 1609 looking for a passage to Asia. " +
    "He found instead the most strategically significant natural harbor on the Atlantic " +
    "coast — deep water accessible to oceangoing ships, sheltered by Staten Island and " +
    "Long Island, and connected by the Hudson River to the interior of the continent. " +
    "The Dutch paid sixty guilders for Manhattan in 1626 and named their settlement New " +
    "Amsterdam. The British took it in 1664, renamed it New York, and understood " +
    "immediately what they had. By April 30, 1789, George Washington stood on the " +
    "balcony of Federal Hall on Wall Street and took the first presidential oath under " +
    "the new Constitution. The harbor that Hudson found by accident became the gateway " +
    "through which the continent would be opened — and the Erie Canal was the lever " +
    "that made it happen on a scale no one had yet imagined.",
  modernRelevance:
    "The Hudson Valley and New York Harbor region carry layered infrastructure, " +
    "land use, and financing histories that continue to shape program eligibility, " +
    "conservation obligations, and commercial development patterns across New York today.",
};

const ALBANY_STOP: JourneyStop = {
  id:     "albany",
  label:  "Albany",
  latLon: { lat: 42.652, lon: -73.756 },
  period: "1624 · 1817 · Canal Origin",
  color:  CANAL_GREEN,
  narrative:
    "Albany was already nearly two hundred years old when the Erie Canal was proposed. " +
    "Fort Orange was built here by the Dutch in 1624 — two years before they bought " +
    "Manhattan. Albany sat at the natural head of Hudson River navigation: the last point " +
    "where oceangoing vessels could reach before the river narrowed and shallowed, and " +
    "the natural starting point for any route into the continental interior. " +
    "DeWitt Clinton, Governor of New York, made the case before the state legislature " +
    "that has since been called the most consequential infrastructure argument in American " +
    "history: spend seven million dollars, dig a ditch 363 miles long, 40 feet wide, " +
    "4 feet deep, and connect the Great Lakes to New York Harbor. The skeptics called it " +
    "Clinton's Ditch and Clinton's Folly. Ground broke at Rome, New York, on July 4, 1817 — " +
    "forty-one years to the day after the Declaration of Independence.",
  modernRelevance:
    "Albany's position as the administrative and political center of New York State " +
    "means that agricultural programs, conservation easements, infrastructure financing, " +
    "and land use regulations governing the entire Erie Canal corridor originate here.",
};

const BOOMTOWN_CORRIDOR_STOP: JourneyStop = {
  id:     "boomtown-corridor",
  label:  "Boomtown Corridor",
  latLon: { lat: 43.048, lon: -76.147 },
  period: "1817–1838 · The Canal Towns",
  color:  COMMERCE_GOLD,
  narrative:
    "Nothing in America happened to cities as fast as the Erie Canal happened to Utica, " +
    "Rome, Syracuse, and Rochester. Rome was the site of the very first sod turned on the " +
    "canal — July 4, 1817. Utica went from a small farming village to a regional commercial " +
    "center in five years. Syracuse was a salt marsh when the canal was proposed; within a " +
    "decade it was shipping millions of bushels of salt to eastern markets, and its location " +
    "at the midpoint of the canal made it the natural distribution hub of the interior. " +
    "Rochester became the largest inland wheat market on the continent by 1838. The corridor " +
    "between Albany and Buffalo was the fastest-growing stretch of industrial and agricultural " +
    "commerce in the world for twenty years. Those infrastructure decisions — where the canal " +
    "ran, where the locks were placed, where the warehouses concentrated — still define the " +
    "pattern of towns, farms, and commercial opportunity across upstate New York.",
  modernRelevance:
    "The Erie Canal corridor contains some of the oldest continuously farmed land in " +
    "New York State. Agricultural heritage programs, conservation easements, historic " +
    "infrastructure financing, and rural development pathways reflect nearly two centuries " +
    "of layered land use along this 363-mile stretch.",
};

const BUFFALO_STOP: JourneyStop = {
  id:     "buffalo",
  label:  "Buffalo",
  latLon: { lat: 42.886, lon: -78.878 },
  period: "1825 · The Wedding of the Waters",
  color:  LAKES_TEAL,
  narrative:
    "Buffalo was a village of five hundred people when construction of the Erie Canal " +
    "began in 1817. When the canal reached it on October 26, 1825, everything changed. " +
    "On November 4, 1825, Governor DeWitt Clinton boarded a packet boat in Buffalo, " +
    "carrying a keg of Lake Erie water. Nine days later he stood in New York Harbor and " +
    "poured the keg into the Atlantic. The ceremony was called the Wedding of the Waters, " +
    "and it marked the moment the American interior became economically connected to the " +
    "Atlantic world. Within a decade Buffalo was the second-busiest port in the United States. " +
    "Grain from Ohio, lumber from Michigan, furs from the Great Lakes — all of it poured " +
    "through Buffalo's grain elevators and warehouses before moving east to New York Harbor " +
    "and out to the world. Those infrastructure decisions still define the land values, " +
    "development patterns, and commercial opportunity visible across western New York today.",
  modernRelevance:
    "Buffalo's position as a Great Lakes port and grain hub created industrial and " +
    "agricultural land patterns that continue to shape conservation program eligibility, " +
    "financing pathways, and brownfield development opportunities across western New York.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Canonical journey export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * newYorkErieCanalJourney — the 363-mile story of America's continental opening.
 *
 * Stop sequence: NY Harbor → Albany → Boomtown Corridor → Buffalo
 * Era: 1609 → Today · DeWitt Clinton · America 250
 *
 * Narrative sourced from public-domain historical records. No individual
 * properties, addresses, or living persons are identified. The journey
 * reveals historical opportunity patterns, not the visitor.
 */
export const newYorkErieCanalJourney: America250Journey = {
  id:          "new-york-erie-canal",
  headline:    "The Erie Canal Journey: How America Opened the Continent.",
  subheadline: "363 miles. 7 million dollars. One determined governor. The ditch that made New York the Gateway of America.",
  state:       "New York",
  seriesId:    "america-250",
  period:      "1609 → Today · DeWitt Clinton's Erie Canal",
  stops:       [
    NY_HARBOR_STOP,
    ALBANY_STOP,
    BOOMTOWN_CORRIDOR_STOP,
    BUFFALO_STOP,
  ],
  governanceNote:
    "This journey is illustrative and educational — part of the America 250 " +
    "living-history series. No geolocation is used. No visitor is identified. " +
    "Historical context is sourced from public-domain U.S. government and " +
    "historical society records. Modern relevance notes are advisory only and " +
    "are not an approval, guarantee, or official determination. " +
    "The map reveals opportunities, not the visitor.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry — all America 250 journeys
// Add future journeys to this array in the order they should appear.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AMERICA_250_JOURNEYS — canonical ordered registry.
 *
 * Current entries:
 *   1. newYorkErieCanalJourney — NY Harbor → Albany → Boomtown Corridor → Buffalo
 *
 * Future candidates:
 *   - pennsylvaniaMainLineJourney      — Philadelphia → Columbia → Pittsburgh
 *   - chesapeakeOhioCanalJourney       — Georgetown → Cumberland → Alleghenies
 *   - massachusettsMercantileJourney   — Salem Harbor → Boston → Lexington
 *   - virginiaGreatWagonRoadJourney    — Philadelphia → Shenandoah → Carolina Frontier
 */
export const AMERICA_250_JOURNEYS: America250Journey[] = [
  newYorkErieCanalJourney,
];
