/**
 * America 250 Story Registry — Build 52
 *
 * Canonical, founder-authored exploration stories for the America 250
 * Featured Exploration series on the Living Opportunity Map.
 *
 * Sequence:
 *   1. Intro           — national overview, stayNational (no zoom)
 *   2. Capital Road-Trip — Philadelphia → Princeton → New York, PA zoom
 *   3. Delaware        — "The Real Delaware Story"
 *   4. Pennsylvania    — "The Epic Pennsylvania Story"
 *   5. New York        — "The Real New York Story: The Gateway of America"
 *   6. Massachusetts   — "The Real Massachusetts Story"
 *   7. Virginia        — placeholder, in development
 *   8. Maine           — placeholder, in development
 *
 * Governance:
 *   - Stories are illustrative — not personalized, not location-based.
 *   - No geolocation. No visitor identification. No personal data.
 *   - "The map reveals opportunities, not the visitor."
 *   - Historical copy is editorial, informed by public-domain records.
 *   - No approval / guarantee / determination language.
 *   - Public Alpha remains PENDING.
 *
 * Do not summarize founder-authored narrative into generic
 * economic-development blurbs. Do not replace narrative with pathway chips.
 * Pathway chips support the story; the story is primary.
 */

import type { FeaturedStory } from "@/lib/customer-landing/featuredExplorationStories";

// ── Color palette ──────────────────────────────────────────────────────────────
// Each story has a distinct color for map markers, state highlight, and path chips.

const A250_GOLD    = "#c9a84c"; // Furlong gold — intro / overview
const A250_BLUE    = "#2563a8"; // Patriot blue — capital road-trip
const DE_BLUE      = "#3d6fa8"; // Delaware blue
const PA_GOLD      = "#b07e2e"; // Pennsylvania gold
const NY_GREEN     = "#2e7a5c"; // New York canal green
const MA_PURPLE    = "#5e4d96"; // Massachusetts purple
const VA_RED       = "#a84030"; // Virginia red
const ME_TEAL      = "#2a7a8c"; // Maine coastal teal

// ─────────────────────────────────────────────────────────────────────────────
// 1. AMERICA 250 INTRO
//    stayNational: true — holds full national view, no state zoom.
//    Nodes are spread east-coast to symbolise the founding thirteen.
// ─────────────────────────────────────────────────────────────────────────────
const INTRO: FeaturedStory = {
  state: "Pennsylvania",
  stateAbbr: "IN",
  county: "National Overview",
  headline: "America 250: Every Journey Starts Somewhere.",
  selectorLabel: "Intro",
  opportunity: "America 250 · Overview",
  pathway: "13 Colonies → Continental Union → American Republic",
  story:
    "Somewhere in these 250 years, every American family has a starting point — " +
    "a farm, a port, a factory, a crossroads. The thirteen original colonies that " +
    "became fifty states built an infrastructure of land, law, capital, and community " +
    "that continues to define what is possible today. This map is not about surveillance. " +
    "It is not about where you are. It is about where things have been and where they " +
    "can go — the patterns of opportunity that 250 years of American growth, innovation, " +
    "stewardship, and discovery have created. Every journey starts somewhere.",
  focusPoint: { x: 80, y: 40 },
  latLon: { lat: 39.95, lon: -75.17 },
  color: A250_GOLD,
  stayNational: true,
  theme: "evolution",
  seriesId: "america-250",
  period: "1776 → 2026 · 250 Years",
  historicalContext:
    "These stories are illustrative — they represent real places with real historical " +
    "context. They are not based on your location, not personalized to your visit, and " +
    "do not record or identify any visitor. " +
    "The map reveals opportunities, not the visitor. Explore freely.",
  connectedNodes: [
    { x: 84, y: 32, type: "13 Colonies",        latLon: { lat: 42.36,  lon: -71.06  } }, // Boston
    { x: 78, y: 39, type: "Continental Congress", latLon: { lat: 39.95,  lon: -75.17  } }, // Philadelphia
    { x: 79, y: 58, type: "American Republic",   latLon: { lat: 32.08,  lon: -81.10  } }, // Savannah
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CAPITAL ROAD-TRIP
//    stayNational: false — zooms to Pennsylvania (Philadelphia).
//    Nodes trace Philadelphia → Princeton → New York City.
// ─────────────────────────────────────────────────────────────────────────────
const CAPITAL_ROAD_TRIP: FeaturedStory = {
  state: "Pennsylvania",
  stateAbbr: "RT",
  county: "Philadelphia · Princeton · New York",
  headline: "The Revolutionary Capital: America's Itinerant Government.",
  selectorLabel: "Capitals",
  opportunity: "Revolutionary Capital Road-Trip",
  pathway: "Philadelphia → Princeton → New York",
  story:
    "Philadelphia was not supposed to be a permanent capital. When the British " +
    "threatened the city in December 1776, the Continental Congress fled to Baltimore. " +
    "When the British occupied Philadelphia in 1777–78, Congress fled again — this time " +
    "to York, Pennsylvania, where they signed the Articles of Confederation, the first " +
    "governing document of the United States. The capital then bounced through Princeton, " +
    "Annapolis, Trenton, and New York before George Washington took the oath of office " +
    "at Federal Hall on Wall Street on April 30, 1789. Then it moved to Philadelphia " +
    "for ten more years. Then, by compromise brokered over dinner, to a swamp on the " +
    "Potomac that no one yet called Washington, D.C.",
  focusPoint: { x: 78, y: 39 },
  latLon: { lat: 39.95, lon: -75.17 },
  color: A250_BLUE,
  theme: "evolution",
  seriesId: "america-250",
  period: "1775 → 1800 · The Traveling Capital",
  historicalContext:
    "The compromise that created Washington, D.C. was brokered in 1790 by Alexander " +
    "Hamilton, Thomas Jefferson, and James Madison — Hamilton's financial plan for " +
    "assuming state debts, in exchange for a Southern capital on the Potomac. " +
    "Eight cities held the American government in its first thirty years: Philadelphia, " +
    "Baltimore, York, Lancaster, Princeton, Annapolis, Trenton, and New York. " +
    "The story of where America chose to govern itself — always moving, always " +
    "negotiating, always building toward something permanent — is the story of " +
    "the republic itself.",
  connectedNodes: [
    { x: 78, y: 39, type: "Philadelphia",  latLon: { lat: 39.95,  lon: -75.17  } },
    { x: 79, y: 37, type: "Princeton",     latLon: { lat: 40.36,  lon: -74.67  } },
    { x: 80, y: 35, type: "New York",      latLon: { lat: 40.71,  lon: -74.01  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELAWARE — "The Real Delaware Story"
// ─────────────────────────────────────────────────────────────────────────────
const DELAWARE: FeaturedStory = {
  state: "Delaware",
  stateAbbr: "DE",
  county: "New Castle County",
  headline: "The Real Delaware Story.",
  opportunity: "The First State · 1787",
  pathway: "Port Christina → First Ratification → Delaware Bay",
  story:
    "Delaware did not become the First State by accident. William Penn's dispute " +
    "over the Lower Three Counties — Delaware, Chester, and Philadelphia — set the " +
    "stage for a separate colony that had different interests, different industries, " +
    "and different instincts than its neighbors. The Swedes built Fort Christina here " +
    "in 1638. The Dutch took it. The English took it from the Dutch. By the time the " +
    "Constitutional Convention met in Philadelphia in 1787, Delaware's delegates " +
    "understood something their larger neighbors did not: a small state needed the " +
    "Constitution more than a large one. They ratified it first. December 7, 1787. " +
    "Unanimous. They did not hesitate.",
  focusPoint: { x: 78, y: 40 },
  latLon: { lat: 39.745, lon: -75.547 },
  color: DE_BLUE,
  theme: "evolution",
  seriesId: "america-250",
  period: "1638 → Today · The First State",
  historicalContext:
    "The DuPont Company founded its first black-powder mill on the Brandywine Creek " +
    "in 1802, fueling American expansion westward, American industry forward, and " +
    "eventually American military dominance through two World Wars. Delaware's " +
    "incorporation laws — shaped over generations to attract capital and protect " +
    "shareholders — made Wilmington the legal home of more than half the companies " +
    "in the Fortune 500. The First State built its relevance by being first: in " +
    "ratification, in industry, in corporate law. That instinct for strategic " +
    "positioning continues to define how opportunity moves through Delaware today.",
  connectedNodes: [
    { x: 77, y: 41, type: "Port Christina",   latLon: { lat: 39.73,  lon: -75.55  } },
    { x: 78, y: 40, type: "First Ratification", latLon: { lat: 39.745, lon: -75.547 } },
    { x: 79, y: 42, type: "Delaware Bay",     latLon: { lat: 38.72,  lon: -75.08  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. PENNSYLVANIA — "The Epic Pennsylvania Story"
// ─────────────────────────────────────────────────────────────────────────────
const PENNSYLVANIA: FeaturedStory = {
  state: "Pennsylvania",
  stateAbbr: "PA",
  county: "Philadelphia County",
  headline: "The Epic Pennsylvania Story.",
  opportunity: "The Keystone State · 1776",
  pathway: "Philadelphia → Valley Forge → Lancaster County",
  story:
    "Philadelphia was the largest city in the British colonies when the Second " +
    "Continental Congress convened there in 1775. It was there that Benjamin Franklin " +
    "flew his kite, that Thomas Jefferson wrote the Declaration of Independence in a " +
    "rented room on Market Street, that George Washington's army held together at " +
    "Valley Forge eighteen miles away by sheer will through the winter of 1777–78. " +
    "Pennsylvania's founding by William Penn — a Quaker who believed in religious " +
    "freedom and fair dealing with the native peoples — gave it a different soul than " +
    "Virginia's plantation economy or Massachusetts's Puritan strictness. That soul " +
    "made Philadelphia the birthplace of American democracy and made Pennsylvania the " +
    "commercial and industrial engine of the early republic.",
  focusPoint: { x: 77, y: 39 },
  latLon: { lat: 39.95, lon: -75.17 },
  color: PA_GOLD,
  theme: "evolution",
  seriesId: "america-250",
  period: "1681 → Today · The Keystone State",
  historicalContext:
    "The Pennsylvania Main Line Canal, completed in 1834, and the Pennsylvania Railroad, " +
    "which became the largest corporation in America by the 1870s, turned the state into " +
    "the backbone of American commerce. Chester County and Lancaster County fed the " +
    "Continental Army at Valley Forge. The steel mills of Pittsburgh powered the Union " +
    "through the Civil War and America through two World Wars. Today, Pennsylvania's " +
    "layers of agricultural heritage, industrial infrastructure, and institutional history " +
    "create a complex landscape of conservation programs, financing pathways, and land-use " +
    "opportunities that reflect nearly two and a half centuries of continuous economic evolution.",
  connectedNodes: [
    { x: 78, y: 39, type: "Philadelphia",    latLon: { lat: 39.95,  lon: -75.17  } },
    { x: 76, y: 39, type: "Valley Forge",    latLon: { lat: 40.10,  lon: -75.39  } },
    { x: 74, y: 39, type: "Lancaster County", latLon: { lat: 40.04,  lon: -76.31  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. NEW YORK — "The Real New York Story: The Gateway of America"
// ─────────────────────────────────────────────────────────────────────────────
const NEW_YORK: FeaturedStory = {
  state: "New York",
  stateAbbr: "NY",
  county: "Albany County",
  headline: "The Real New York Story: The Gateway of America.",
  opportunity: "The Gateway of America",
  pathway: "Albany → Erie Canal → Buffalo",
  story:
    "Henry Hudson sailed into New York Harbor in 1609 looking for a passage to Asia " +
    "and found instead the most strategically significant natural harbor on the Atlantic " +
    "coast. The Dutch built Fort Amsterdam at the tip of Manhattan in 1626 and traded " +
    "for the island that became the commercial center of the Western Hemisphere. " +
    "By the time the Constitution was ratified, New York City became the first capital " +
    "of the United States under the new government — George Washington took the oath " +
    "of office at Federal Hall on Wall Street on April 30, 1789. The canal towns that " +
    "grew along 363 miles of the Erie Canal — Utica, Rome, Syracuse, Rochester, " +
    "Buffalo — became the economic backbone of interior New York, and the gateway " +
    "through which the American continent was opened.",
  focusPoint: { x: 78, y: 31 },
  latLon: { lat: 42.652, lon: -73.756 },
  color: NY_GREEN,
  theme: "evolution",
  seriesId: "america-250",
  period: "1626 → Today · The Gateway of America",
  historicalContext:
    "The Erie Canal was completed in 1825 after seven years of construction and the " +
    "relentless advocacy of Governor DeWitt Clinton. It connected the Great Lakes to " +
    "the Hudson River and New York Harbor, reduced freight costs by ninety percent, and " +
    "opened the American interior to commerce and settlement. Grain from Ohio, lumber " +
    "from Michigan, furs from the Great Lakes — all of it poured through New York. " +
    "Those infrastructure decisions, made by one determined governor and thousands of " +
    "laborers, still define the land values, regional development patterns, and " +
    "commercial opportunities visible across New York today.",
  connectedNodes: [
    { x: 79, y: 31, type: "Albany",     latLon: { lat: 42.65,  lon: -73.76  } },
    { x: 75, y: 29, type: "Erie Canal", latLon: { lat: 43.10,  lon: -75.23  } },
    { x: 68, y: 29, type: "Buffalo",    latLon: { lat: 42.89,  lon: -78.88  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. MASSACHUSETTS — "The Real Massachusetts Story"
// ─────────────────────────────────────────────────────────────────────────────
const MASSACHUSETTS: FeaturedStory = {
  state: "Massachusetts",
  stateAbbr: "MA",
  county: "Suffolk County",
  headline: "The Real Massachusetts Story.",
  opportunity: "The Cradle of Liberty · 1620",
  pathway: "Salem Harbor → Boston → Lexington",
  story:
    "The Pilgrims landed at Plymouth in November 1620, having missed their intended " +
    "destination in Virginia. They stayed because they had to. A hundred and two " +
    "passengers had survived the Mayflower crossing, and they needed to build shelters " +
    "before winter killed them. What they built instead was a different kind of society " +
    "— one governed by the Mayflower Compact, the first written framework for " +
    "self-government in North America. The shot heard round the world was fired at " +
    "Lexington on April 19, 1775. Paul Revere rode through the night. The farmers at " +
    "Concord stood their ground. The British retreated. Everything that followed — " +
    "Valley Forge, Yorktown, the Constitution — began on that Tuesday morning in April " +
    "on a farm field in Lexington, Massachusetts.",
  focusPoint: { x: 84, y: 32 },
  latLon: { lat: 42.36, lon: -71.06 },
  color: MA_PURPLE,
  theme: "evolution",
  seriesId: "america-250",
  period: "1620 → Today · The Cradle of Liberty",
  historicalContext:
    "Salem's global trade networks — reaching India, China, and West Africa before the " +
    "Revolution — made Massachusetts the commercial center of early America. Essex " +
    "County's harbors launched fleets that defined American maritime commerce for two " +
    "centuries. Harvard College, founded in 1636, was the first institution of higher " +
    "learning in the colonies. That combination of maritime commerce, civic " +
    "institution-building, and political leadership created the educational, financial, " +
    "and industrial infrastructure that made Massachusetts one of the most consequential " +
    "laboratories of American possibility in every era since.",
  connectedNodes: [
    { x: 85, y: 30, type: "Salem Harbor", latLon: { lat: 42.52,  lon: -70.90  } },
    { x: 83, y: 32, type: "Boston",       latLon: { lat: 42.36,  lon: -71.06  } },
    { x: 83, y: 31, type: "Lexington",    latLon: { lat: 42.45,  lon: -71.23  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. VIRGINIA — Placeholder (in development)
// ─────────────────────────────────────────────────────────────────────────────
const VIRGINIA: FeaturedStory = {
  state: "Virginia",
  stateAbbr: "VA",
  county: "Augusta County",
  headline: "Virginia: The Old Dominion.",
  opportunity: "The Old Dominion · In Development",
  pathway: "Williamsburg → Richmond → Shenandoah",
  story:
    "Virginia's story is in development. The colony that gave America Washington, " +
    "Jefferson, Madison, and Monroe; the Shenandoah Valley that sheltered farmers " +
    "who brought their agricultural traditions to the frontier; the Appalachian ridge " +
    "that defined the American westward character — this story is being written now " +
    "and will be available soon. Virginia's agricultural heritage, land stewardship " +
    "traditions, and layered history of land use from colonial grants through the " +
    "present day make it one of the most historically textured states in the series.",
  focusPoint: { x: 74, y: 49 },
  latLon: { lat: 38.149, lon: -79.071 },
  color: VA_RED,
  theme: "evolution",
  seriesId: "america-250",
  period: "1607 → Today · Coming Soon",
  historicalContext:
    "Augusta County was settled in the 1730s and 1740s, primarily by German and " +
    "Scots-Irish immigrants who brought distinctive farming traditions to the Shenandoah " +
    "Valley. Their approach to land stewardship — careful management of soil, water, " +
    "and forest resources — created agricultural patterns that persist today. " +
    "Full founder-authored narrative for Virginia is in development.",
  connectedNodes: [
    { x: 78, y: 50, type: "Williamsburg",  latLon: { lat: 37.27,  lon: -76.71  } },
    { x: 76, y: 47, type: "Richmond",      latLon: { lat: 37.54,  lon: -77.43  } },
    { x: 73, y: 47, type: "Shenandoah",   latLon: { lat: 38.149, lon: -79.071 } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. MAINE — Placeholder (in development)
// ─────────────────────────────────────────────────────────────────────────────
const MAINE: FeaturedStory = {
  state: "Maine",
  stateAbbr: "ME",
  county: "Sagadahoc County",
  headline: "Maine: The Pine Tree State.",
  opportunity: "The Pine Tree State · In Development",
  pathway: "Popham 1607 → Portland → Bath Shipyards",
  story:
    "Maine's story is in development. The first English settlement in North America " +
    "was at Popham Colony, Maine, in 1607 — thirteen years before Plymouth, and the " +
    "same year as Jamestown. The timber that built the British Royal Navy came from " +
    "Maine's white pines, marked with the King's Broad Arrow. The fishing communities " +
    "of the Maine coast have sustained themselves for four centuries. Maine's land, " +
    "water, and maritime heritage make it one of the most foundational states in the " +
    "America 250 series — full founder-authored narrative is being written now.",
  focusPoint: { x: 85, y: 24 },
  latLon: { lat: 43.912, lon: -69.820 },
  color: ME_TEAL,
  theme: "evolution",
  seriesId: "america-250",
  period: "1607 → Today · Coming Soon",
  historicalContext:
    "Bath, Maine, built more wooden ships than any other city in America during the " +
    "nineteenth century. The Bath Iron Works continues building ships today. Maine's " +
    "timber, fishing, and agricultural heritage created land use and stewardship " +
    "patterns that shape conservation program eligibility and financing options across " +
    "the state. Full founder-authored narrative for Maine is in development.",
  connectedNodes: [
    { x: 84, y: 26, type: "Popham 1607",   latLon: { lat: 43.74,  lon: -69.79  } },
    { x: 83, y: 27, type: "Portland",      latLon: { lat: 43.66,  lon: -70.26  } },
    { x: 84, y: 25, type: "Bath Shipyards", latLon: { lat: 43.91,  lon: -69.82  } },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Canonical export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AMERICA_250_STORIES — canonical ordered sequence for the Living Opportunity Map.
 *
 * Sequence: Intro → Capital Road-Trip → Delaware → Pennsylvania →
 *           New York → Massachusetts → Virginia → Maine
 *
 * Do not reorder without founder review. The intro and road-trip entries
 * carry stayNational: true / false respectively and must remain first.
 *
 * Deprecated copy that MUST return zero grep hits:
 *   "natural trading hub"
 *   "Port → Commerce → Trade Route"
 *   "Trade Hub"
 *   "Innovation Hub"
 *   "Canal Commerce" (as a connectedNode type)
 *
 * @see src/lib/customer-landing/featuredExplorationStories.ts (re-export)
 * @see src/components/customer/LivingOpportunityMap.tsx (renderer)
 */
export const AMERICA_250_STORIES: FeaturedStory[] = [
  INTRO,
  CAPITAL_ROAD_TRIP,
  DELAWARE,
  PENNSYLVANIA,
  NEW_YORK,
  MASSACHUSETTS,
  VIRGINIA,
  MAINE,
];
