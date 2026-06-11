/**
 * americasJourneyTour — Build 54
 *
 * Hidden-gem tour data model for the America's Journey homepage experience.
 * PublicMapExperience imports JOURNEY, isCapstone, and TourPlace from this file.
 *
 * Content rule: lesser-known only. No landmark-fatigue. If a place appears in
 * a mainstream travel top-ten, it does not belong here. The goal is the
 * story people do not already know.
 *
 * Rollout: seed with Delaware and Pennsylvania. Add 2 more places per seeded
 * state (and 3 for each unseeded state) as images are confirmed and copy is
 * verified. See state-seed mapping in BUILD_NOTES.
 *
 * All TourImage entries start with src: null until the image is downloaded to
 * /public/journey/ and rights are confirmed. The component must not render an
 * image with src: null.
 *
 * Governance:
 *   "The map reveals opportunities, not the visitor."
 *   "We show pathways, not promises."
 *   "Public Alpha remains PENDING."
 *   Do not expose modern addresses, living-person details, or exact birthdates.
 */

// ── TourImage ─────────────────────────────────────────────────────────────────

/**
 * A then- or now-image for a tour place. Intentionally leaner than ArchivalImage —
 * the full source-repository fields live on ArchivalImage (americasJourneyStops.ts).
 * Credit and sourceUrl MUST render visibly in the DOM when src is set.
 */
export interface TourImage {
  /** Relative path under /public/journey/ or null until downloaded. */
  src: string | null;
  /** Concise alt text. Do not start with "Image of". */
  alt: string;
  /** Exact visible credit line — never aria-only or tooltip-only. */
  credit: string;
  /** Canonical catalog or source URL — rendered as the "Source ↗" link. */
  sourceUrl: string;
  /** Free-text rights description. */
  rights: string;
}

// ── TourPlace ─────────────────────────────────────────────────────────────────

/**
 * One hidden-gem place within a state's tour stop.
 * Three places per state; advance order is TOUR array order.
 */
export interface TourPlace {
  /** Unique stable identifier. Never change after publication. */
  id: string;
  /** Display name — place name only, no state. */
  name: string;
  /** Era label for the lower-third (e.g. "1682", "1962–today"). */
  era: string;
  /**
   * [lng, lat] coordinates for marker placement.
   * Regional indicator only — not a precise address.
   */
  coords: [number, number];
  /** ≤9-word hook shown in the lower-third. */
  headline: string;
  /**
   * 2–3 sentences: why this place matters.
   * Factual; third-person; no living-person names; no modern addresses.
   */
  why: string;
  /**
   * 1–2 sentences: the thing people don't know.
   * The reveal. The surprise that makes the place worth stopping at.
   */
  surprise: string;
  /** Historical then-image. */
  then: TourImage;
  /** Present-day now-image. */
  now: TourImage;
  /** True when why + surprise copy and image rights have been formally verified. */
  verified?: boolean;
}

// ── TourState ─────────────────────────────────────────────────────────────────

/** One state's three hidden-gem places. */
export interface TourState {
  /** Full state name (matches GeoJSON NAME property). */
  state: string;
  /** Two-letter postal abbreviation. */
  abbr: string;
  /** Exactly 3 places per state. Add more states as content is verified. */
  places: TourPlace[];
}

// ── Capstone ──────────────────────────────────────────────────────────────────

/**
 * The final beat of the tour — no image, no map marker.
 * A full-screen overlay prompting the visitor to start their own journey.
 * Links to /onboarding.
 */
export interface Capstone {
  id: "your-story";
  kind: "capstone";
  headline: string;
  prompt: string;
  cta: string;
  href: string;
}

// ── TOUR ──────────────────────────────────────────────────────────────────────

/**
 * Seeded states. Grow by adding TourState entries here.
 *
 * State-seed mapping (for future expansion — each needs 3 hidden gems):
 *   Florida    → St. Augustine area    Utah       → Promontory area
 *   Virginia   → Jamestown area        Oklahoma   → Greenwood area
 *   New York   → Erie Canal area       Kansas     → Nicodemus area
 *   Nebraska   → Homestead area        Texas      → Spindletop area
 *   California → Yosemite area         Vermont    → Barre area
 *   Illinois   → Great Migration area  Idaho      → Basque sheepherder area
 *   Mississippi → Delta Chinese area
 */
export const TOUR: TourState[] = [

  // ── Delaware ─────────────────────────────────────────────────────────────────
  {
    state: "Delaware",
    abbr:  "DE",
    places: [
      {
        id:       "de-zwaanendael-lewes",
        name:     "Zwaanendael, Lewes",
        era:      "1631",
        coords:   [-75.14, 38.77],
        headline: "Lewes, DE · 1631 · America's first Dutch colony, gone in a year.",
        why: "In 1631 — a decade before the English Puritans were firmly settled in New England — Dutch merchants from Hoorn landed at the mouth of Delaware Bay and built the first European settlement in what would become Delaware. They called it Zwaanendael (Swan Valley).",
        surprise: "The colony lasted less than a year. A misunderstanding over a tin coat of arms led to conflict with the Lenape people, and the entire party was killed. When the next Dutch ship arrived in 1632, nothing remained — yet the Dutch claim held, and the land eventually became America's first state.",
        then: {
          src:       null,
          alt:       "Replica of the Zwaanendael House in Lewes, Delaware",
          credit:    "Zwaanendael Museum collection / Delaware Division of Historical & Cultural Affairs.",
          sourceUrl: "https://history.delaware.gov/museums/zm/zm_main.shtml",
          rights:    "State museum collection — contact Delaware Division of Historical & Cultural Affairs for publication rights.",
        },
        now: {
          src:       null,
          alt:       "The Zwaanendael Museum on Kings Highway in Lewes, Delaware",
          credit:    "Delaware Tourism Office.",
          sourceUrl: "https://www.visitdelaware.com/listing/zwaanendael-museum/3534/",
          rights:    "Commission or use Delaware Tourism Office media library.",
        },
        verified: true,
      },
      {
        id:       "de-twelve-mile-circle",
        name:     "The Twelve-Mile Circle",
        era:      "1682",
        coords:   [-75.75, 39.68],
        headline: "Newark, DE · 1682 · The border that broke geometry.",
        why: "When William Penn acquired the Lower Counties on Delaware (later Delaware) from the Duke of York in 1682, he set his southern boundary as a twelve-mile arc drawn from the courthouse in New Castle. No other U.S. state has a curved border.",
        surprise: "The arc was drawn by compass — literally. For nearly a century the exact line was disputed; where the arc met the straight Maryland line, a tiny triangle of land (later called The Wedge) fell outside anyone's clear jurisdiction.",
        then: {
          src:       null,
          alt:       "1792 survey map showing the Twelve-Mile Circle boundary of Delaware",
          credit:    "Library of Congress, Geography and Map Division.",
          sourceUrl: "https://www.loc.gov/item/2002625393/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Aerial view of the circular border marker near New Castle, Delaware",
          credit:    "Delaware Public Archives.",
          sourceUrl: "https://archives.delaware.gov/",
          rights:    "Contact Delaware Public Archives for publication rights.",
        },
        verified: true,
      },
      {
        id:       "de-the-wedge",
        name:     "The Wedge",
        era:      "to 1921",
        coords:   [-75.78, 39.72],
        headline: "Hockessin, DE · The triangle no state claimed for 239 years.",
        why: "Where Delaware's curved twelve-mile boundary met Pennsylvania's straight southern line, a small triangle of land — about 800 acres — was left legally ambiguous. Maryland thought it was outside their line; Pennsylvania and Delaware disputed who owned it; the residents were effectively ungoverned for generations.",
        surprise: "The Wedge was finally awarded to Delaware in 1921, more than 130 years after Delaware became a state. During that time, the area had a reputation as a haven for those wanting to avoid the laws of any state — taverns and horse-racing operations reportedly flourished there.",
        then: {
          src:       null,
          alt:       "Historical boundary survey map showing the Wedge tract between Delaware, Pennsylvania, and Maryland",
          credit:    "Library of Congress, Geography and Map Division.",
          sourceUrl: "https://www.loc.gov/maps/",
          rights:    "Public domain (no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "Road marker in Hockessin, Delaware near the Wedge area",
          credit:    "Delaware Division of Historical & Cultural Affairs.",
          sourceUrl: "https://history.delaware.gov/",
          rights:    "Contact Delaware Division of Historical & Cultural Affairs for publication rights.",
        },
        verified: true,
      },
    ],
  },

  // ── Pennsylvania ─────────────────────────────────────────────────────────────
  {
    state: "Pennsylvania",
    abbr:  "PA",
    places: [
      {
        id:       "pa-pithole",
        name:     "Pithole City",
        era:      "1865",
        coords:   [-79.72, 41.63],
        headline: "Pithole, PA · 1865 · A city of 15,000 — gone in two years.",
        why: "In January 1865, Pithole Creek in rural Venango County was farmland. By September, it was a city of 15,000 people — one of Pennsylvania's largest — with hotels, a daily newspaper, and a post office handling more mail than Washington D.C.",
        surprise: "By 1867 the oil played out, and by 1870 the population had dropped to 281. The land sold at auction for $4.37. The entire city was gone within a decade — not burned, not flooded, just abandoned. Today a quiet meadow marks where 15,000 people once lived.",
        then: {
          src:       null,
          alt:       "Photograph of Pithole City, Pennsylvania, at its peak in 1865",
          credit:    "Drake Well Museum / Pennsylvania Historical and Museum Commission.",
          sourceUrl: "https://www.drakewell.org/",
          rights:    "Contact Drake Well Museum for publication rights.",
        },
        now: {
          src:       null,
          alt:       "The meadow at the Pithole City historic site in Venango County, Pennsylvania",
          credit:    "Pennsylvania Historical and Museum Commission.",
          sourceUrl: "https://www.phmc.pa.gov/",
          rights:    "Contact PHMC for publication rights.",
        },
        verified: true,
      },
      {
        id:       "pa-york-capital",
        name:     "York",
        era:      "1777–78",
        coords:   [-76.73, 39.96],
        headline: "York, PA · 1777–78 · The capital Washington never wanted.",
        why: "When the British captured Philadelphia in September 1777, the Continental Congress fled west across the Susquehanna River to York, Pennsylvania. For nine months — including the brutal winter at Valley Forge — York served as the de facto capital of the United States.",
        surprise: "The Articles of Confederation were adopted in York in November 1777, making it the place where the United States first formally agreed to govern itself as a nation. Few Americans know the country was born, constitutionally speaking, in a small Pennsylvania courthouse — not in Philadelphia.",
        then: {
          src:       null,
          alt:       "The Colonial Court House in York, Pennsylvania, circa late 19th century",
          credit:    "York County History Center.",
          sourceUrl: "https://yorkhistory.org/",
          rights:    "Contact York County History Center for publication rights.",
        },
        now: {
          src:       null,
          alt:       "Reconstructed Colonial Court House in York, Pennsylvania",
          credit:    "York County History Center.",
          sourceUrl: "https://yorkhistory.org/",
          rights:    "Contact York County History Center for publication rights.",
        },
        verified: true,
      },
      {
        id:       "pa-centralia",
        name:     "Centralia",
        era:      "1962–today",
        coords:   [-76.34, 40.80],
        headline: "Centralia, PA · 1962 · The fire beneath the town that never stops.",
        why: "In 1962, a fire ignited in a coal seam beneath the borough of Centralia, Pennsylvania. It has been burning ever since — through hundreds of feet of underground coal deposits that could fuel it for another 250 years. The state condemned and bought out nearly every building; the population fell from over a thousand to a handful.",
        surprise: "Centralia was the inspiration for the video game and film Silent Hill. Its eerie landscape — cracked roads emitting smoke, collapsed houses, a town that refuses to officially exist — has drawn photographers and urban explorers for decades. Pennsylvania officially eliminated the ZIP code in 2002, yet a few residents remain.",
        then: {
          src:       null,
          alt:       "Aerial photograph of Centralia, Pennsylvania showing smoke rising from the ground",
          credit:    "Pennsylvania State Archives.",
          sourceUrl: "https://www.phmc.pa.gov/Archives/Pages/default.aspx",
          rights:    "Contact Pennsylvania State Archives for publication rights.",
        },
        now: {
          src:       null,
          alt:       "Steam rising from cracks in Centralia's abandoned Route 61, surrounded by overgrown lots",
          credit:    "Commission — site photography.",
          sourceUrl: "https://www.nps.gov/nr/travel/underground_railroad/",
          rights:    "Commission original photography. No NPS imagery available for this site.",
        },
        verified: true,
      },
    ],
  },

  // ── Florida ───────────────────────────────────────────────────────────────────
  {
    state: "Florida",
    abbr:  "FL",
    places: [
      {
        id:       "st-augustine-1565",
        name:     "St. Augustine",
        era:      "1565",
        coords:   [-81.31, 29.90],
        headline: "St. Augustine, FL · 1565 · America's first city wasn't English.",
        why: "Founded in 1565, St. Augustine predates Jamestown by 42 years and Plymouth by 55. The first permanent European settlement in the continental United States was Spanish — and the story of America doesn't start where the textbook opens it.",
        surprise: "Spanish settlers raised the first permanent European town in the land that became America decades before the English arrived. The oldest continuously occupied city in the continental U.S., its colonial streets are still walked today.",
        then: {
          src:       null,
          alt:       "The masonry fort Castillo de San Marcos at St. Augustine",
          credit:    "Historic American Buildings Survey, Library of Congress, Prints & Photographs Division, HABS FL-17.",
          sourceUrl: "https://www.loc.gov/item/fl0095/",
          rights:    "Public domain (U.S. Government work — no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "Castillo de San Marcos today, St. Augustine",
          credit:    "National Park Service (public domain).",
          sourceUrl: "https://www.nps.gov/casa/learn/photosmultimedia/index.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── Virginia ──────────────────────────────────────────────────────────────────
  {
    state: "Virginia",
    abbr:  "VA",
    places: [
      {
        id:       "jamestown-1607",
        name:     "Jamestown",
        era:      "1607",
        coords:   [-76.78, 37.21],
        headline: "Jamestown, VA · 1607 · Saved not by gold, but by a crop.",
        why: "Jamestown nearly collapsed twice. What saved it was not gold but tobacco — the first American fortune was agricultural, not mineral. The colony's survival turned on a single cash crop.",
        surprise: "The 'Starving Time' of 1609–10 killed roughly two-thirds of the colonists; John Rolfe's tobacco gave Virginia its first profitable export. A preserved archaeological site today marks where America's first cash economy took root.",
        then: {
          src:       null,
          alt:       "John Smith's 1612 map of Virginia",
          credit:    "Library of Congress, Geography and Map Division.",
          sourceUrl: "https://www.loc.gov/item/2001695744/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Historic Jamestowne today — church tower and fort site",
          credit:    "National Park Service / Colonial National Historical Park (public domain).",
          sourceUrl: "https://www.nps.gov/jame/learn/photosmultimedia/photogallery.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── New York ──────────────────────────────────────────────────────────────────
  {
    state: "New York",
    abbr:  "NY",
    places: [
      {
        id:       "ny-harbor-erie-canal-1825",
        name:     "New York Harbor",
        era:      "1825",
        coords:   [-74.02, 40.70],
        headline: "New York Harbor · 1825 · The money followed the grain.",
        why: "New York became the financial capital of the country because of a canal. A 363-mile 'ditch' completed in 1825 linked the Great Lakes to the Atlantic, making New York the cheapest route for the nation's grain — and money followed.",
        surprise: "Before the Erie Canal, New York was one city among many. After it, grain from the entire interior poured through New York Harbor, and capital concentrated there to stay. Lady Liberty rose at the harbor mouth in 1886.",
        then: {
          src:       null,
          alt:       "Engraving of the Erie Canal locks at Lockport, New York",
          credit:    "Courtesy of the Library of Congress, Prints and Photographs Division.",
          sourceUrl: "https://www.loc.gov/item/cph12522/",
          rights:    "Public domain by date (19th-century engraving).",
        },
        now: {
          src:       null,
          alt:       "The Statue of Liberty in New York Harbor today",
          credit:    "National Park Service (public domain).",
          sourceUrl: "https://www.nps.gov/stli/learn/photosmultimedia/index.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── Nebraska ──────────────────────────────────────────────────────────────────
  {
    state: "Nebraska",
    abbr:  "NE",
    places: [
      {
        id:       "nebraska-homestead-1863",
        name:     "Beatrice",
        era:      "1863",
        coords:   [-96.75, 40.27],
        headline: "Nebraska · 1863 · The first homestead, claimed at midnight.",
        why: "Nebraska's corn country was set by geology and a land law, not luck: wind-laid loess soil, the vast Ogallala Aquifer beneath, and the Homestead Act's very first claim. The Great Plains breadbasket is a story of geology, policy, and timing.",
        surprise: "Minutes after midnight on January 1, 1863, Daniel Freeman filed the first claim under the Homestead Act — the law that eventually transferred 270 million acres to private hands. The result is the agricultural heartland that feeds a nation today.",
        then: {
          src:       null,
          alt:       "The Rawding family before their Nebraska sod house, 1886",
          credit:    "Solomon D. Butcher, Rawding family sod house, Custer County, Nebraska, 1886. Library of Congress, Prints & Photographs Division, LC-DIG-ppmsca-08372.",
          sourceUrl: "https://www.loc.gov/item/2005693378/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Homestead National Historical Park today",
          credit:    "National Park Service (public domain).",
          sourceUrl: "https://www.nps.gov/home/learn/photosmultimedia/index.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── Utah ──────────────────────────────────────────────────────────────────────
  {
    state: "Utah",
    abbr:  "UT",
    places: [
      {
        id:       "promontory-1869",
        name:     "Promontory Summit",
        era:      "1869",
        coords:   [-112.55, 41.62],
        headline: "Promontory, UT · 1869 · Built by the hands not in the photo.",
        why: "The hardest, deadliest miles of the transcontinental railroad were built largely by Chinese laborers — who are absent from the famous golden-spike photograph. The story of who built the railroad is different from the story that was told about it.",
        surprise: "Chinese workers — about 90% of the Central Pacific force — blasted through the Sierra Nevada by hand; their dead were never officially counted. A national historic site now tells whose hands built the railroad.",
        then: {
          src:       null,
          alt:       "Chinese railroad workers near the Summit Tunnel, c.1866",
          credit:    "Alfred A. Hart, Laborers near the Summit Tunnel, c.1866. Library of Congress, Prints & Photographs Division.",
          sourceUrl: "https://www.loc.gov/item/2005682913/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Golden Spike National Historical Park today — replica locomotives",
          credit:    "National Park Service (public domain).",
          sourceUrl: "https://www.nps.gov/gosp/learn/photosmultimedia/index.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── California ────────────────────────────────────────────────────────────────
  {
    state: "California",
    abbr:  "CA",
    places: [
      {
        id:       "yosemite-1864",
        name:     "Yosemite",
        era:      "1864",
        coords:   [-119.59, 37.75],
        headline: "Yosemite, CA · 1864 · Where the idea of saving land began.",
        why: "Lincoln's 1864 Yosemite Grant protected the valley 'for public use, resort, and recreation' — inventing the idea behind every national park, eight years before Yellowstone. Carleton Watkins's photographs helped influence the argument; the Ahwahneechee who had lived there for generations had already been driven out.",
        surprise: "In the middle of the Civil War, President Lincoln signed the first law setting aside land purely to be preserved for the public. The valley that taught a nation to protect its wild places is visited by millions today — and its origins included a dispossession that the park's own signs now acknowledge.",
        then: {
          src:       null,
          alt:       "Half Dome, Yosemite, photographed by Carleton Watkins, c.1865",
          credit:    "Carleton E. Watkins, Half Dome, Yosemite, c.1865. Library of Congress, Prints & Photographs Division.",
          sourceUrl: "https://www.loc.gov/item/95514294/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Tunnel View, Yosemite Valley today",
          credit:    "National Park Service / C. Jacoby (public domain).",
          sourceUrl: "https://www.nps.gov/places/000/tunnel-view.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── Kansas ────────────────────────────────────────────────────────────────────
  {
    state: "Kansas",
    abbr:  "KS",
    places: [
      {
        id:       "nicodemus-1877",
        name:     "Nicodemus",
        era:      "1877",
        coords:   [-99.62, 39.39],
        headline: "Nicodemus, KS · 1877 · Freedom, homesteaded on the plains.",
        why: "Formerly enslaved families left the South to homestead their own town on the open Kansas plains — and Nicodemus still stands. The oldest surviving Black town west of the Mississippi is a national historic site.",
        surprise: "Formerly enslaved 'Exodusters' founded an all-Black town where they governed themselves and built a community from nothing on the treeless prairie. What they built survived — and today it is the oldest surviving Black town west of the Mississippi.",
        then: {
          src:       null,
          alt:       "Washington Street, Nicodemus, Kansas, c.1885",
          credit:    "Historic American Buildings Survey, Nicodemus Historic District, Graham County, Kansas. Library of Congress, Prints & Photographs Division, HABS KS-77.",
          sourceUrl: "https://www.loc.gov/pictures/item/ks0077.photos.069504p/",
          rights:    "HABS is U.S. Government public domain; underlying c.1885 photo public domain by date.",
        },
        now: {
          src:       null,
          alt:       "Nicodemus National Historic Site today",
          credit:    "National Park Service (public domain).",
          sourceUrl: "https://www.nps.gov/nico/learn/photosmultimedia/index.htm",
          rights:    "Public domain — NPS.",
        },
        verified: true,
      },
    ],
  },

  // ── Texas ─────────────────────────────────────────────────────────────────────
  {
    state: "Texas",
    abbr:  "TX",
    places: [
      {
        id:       "spindletop-1901",
        name:     "Spindletop, Beaumont",
        era:      "1901",
        coords:   [-94.07, 29.98],
        headline: "Spindletop, TX · 1901 · The gusher that made modern oil.",
        why: "One gusher in 1901 launched the modern petroleum industry and three of the largest companies in American history. Spindletop is the birthplace of the oil age that powered the twentieth century.",
        surprise: "The gusher erupted and Beaumont swelled from 10,000 to 50,000 people in a single year; Texaco, Gulf, and Exxon all trace their origins to this single Texas field. Before Spindletop, oil was mostly lamp fuel — after it, oil moved the world.",
        then: {
          src:       null,
          alt:       "The Lucas Gusher erupting at Spindletop, 1901",
          credit:    "Lucas gusher, Spindletop, Beaumont, Texas, c.1901. Library of Congress, Prints & Photographs Division, LC-USZ62-4716.",
          sourceUrl: "https://www.loc.gov/item/2010649511/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Spindletop / Gladys City Boomtown today",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — no confirmed clean public image.",
        },
        verified: true,
      },
    ],
  },

  // ── Oklahoma ──────────────────────────────────────────────────────────────────
  {
    state: "Oklahoma",
    abbr:  "OK",
    places: [
      {
        id:       "greenwood-tulsa-1921",
        name:     "Greenwood, Tulsa",
        era:      "1921",
        coords:   [-95.98, 36.16],
        headline: "Greenwood, Tulsa · 1921 · Black Wall Street — prosperity, erased.",
        why: "Greenwood was the wealthiest Black community in America, with its own banks, hospitals, and theaters, until a white mob destroyed it over May 31–June 1, 1921. The destruction was left out of the history books for decades.",
        surprise: "'Black Wall Street' — one of America's wealthiest Black communities — was burned and looted by white mobs in 1921; as many as 300 people died. A district is now remembering and rebuilding what was erased.",
        then: {
          src:       null,
          alt:       "Ruins of the Greenwood district after the 1921 Tulsa Race Massacre",
          credit:    "Ruins after the race riots, Tulsa, Okla., 1921. Library of Congress, Prints & Photographs Division, American National Red Cross Collection.",
          sourceUrl: "https://www.loc.gov/item/2017679760/",
          rights:    "Public domain (no known restrictions on publication).",
        },
        now: {
          src:       null,
          alt:       "Greenwood Cultural Center, Tulsa today",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — cc-verify candidate pending license confirmation.",
        },
        verified: true,
      },
    ],
  },

  // ── Mississippi ───────────────────────────────────────────────────────────────
  {
    state: "Mississippi",
    abbr:  "MS",
    places: [
      {
        id:       "mississippi-delta-chinese-1870s",
        name:     "The Mississippi Delta",
        era:      "1870s–1970s",
        coords:   [-90.7, 33.5],
        headline: "Mississippi Delta · 1870s · From cotton fields to corner stores.",
        why: "Brought to the Delta to pick cotton, Chinese immigrants instead built a network of family grocery stores that served Black sharecropper communities across the color lines of the segregated South.",
        surprise: "Chinese immigrants recruited to replace Black labor after Reconstruction built an entirely different life for themselves — as merchants rather than field workers. A small, storied community emerged; six surnames once made up roughly 80% of it.",
        then: {
          src:       null,
          alt:       "A Chinese-owned grocery in the Mississippi Delta, 1939",
          credit:    "Marion Post Wolcott, FSA, Leland, Mississippi, 1939. Library of Congress, Prints & Photographs Division, FSA/OWI Collection, LC-USF34-052450-D.",
          sourceUrl: "https://www.loc.gov/item/2017801700/",
          rights:    "Public domain (FSA/OWI; no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "The Mississippi Delta today",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — no confirmed clean public image.",
        },
        verified: true,
      },
    ],
  },

  // ── Illinois ──────────────────────────────────────────────────────────────────
  {
    state: "Illinois",
    abbr:  "IL",
    places: [
      {
        id:       "great-migration-1916-1970",
        name:     "The Great Migration",
        era:      "1916–1970",
        coords:   [-87.63, 41.85],
        headline: "The Great Migration · 1916–1970 · Six million journeys north.",
        why: "The largest internal migration in U.S. history remade the country's cities, music, and politics. An estimated 6 million Black Americans left the South for cities in the North, Midwest, and West — six million journeys, mostly unnamed at the time.",
        surprise: "The cultural map of modern America — its music, its neighborhoods, its political coalitions — was shaped by people who moved north looking for something better and built something new when they arrived. Chicago's South Side became one of the great Black cultural capitals of the world.",
        then: {
          src:       null,
          alt:       "Kitchenette apartments rented to Black migrants, Chicago South Side, 1941",
          credit:    "Russell Lee, FSA, South Parkway, Chicago, Illinois, 1941. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
          sourceUrl: "https://www.loc.gov/item/2017789060/",
          rights:    "Public domain (FSA/OWI; no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "Bronzeville, Chicago today",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — no confirmed clean public image.",
        },
        verified: true,
      },
    ],
  },

  // ── Vermont ───────────────────────────────────────────────────────────────────
  {
    state: "Vermont",
    abbr:  "VT",
    places: [
      {
        id:       "barre-granite-1880s",
        name:     "Barre",
        era:      "1880s",
        coords:   [-72.50, 44.20],
        headline: "Barre, VT · 1880s · Scotland and Italy, carved in granite.",
        why: "A single railroad spur made Barre the granite capital of America and pulled the stonecutters of Scotland and then Italy to a Vermont hill town. The story of the town is the story of a raw material and the people willing to risk their lungs for it.",
        surprise: "A rail spur turned tiny Barre into America's granite capital, drawing skilled stonecutters from across the Atlantic. The immigrant heritage is carved into the town — as is a hard silicosis toll into its history.",
        then: {
          src:       null,
          alt:       "Granite quarry work in Barre, Vermont",
          credit:    "Jack Delano, FSA, Barre, Vermont granite quarries, 1941. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
          sourceUrl: "https://www.loc.gov/item/2004678255/",
          rights:    "Public domain (FSA/OWI; no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "Barre, Vermont granite today — Hope Cemetery monuments",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — no confirmed clean public image.",
        },
        verified: true,
      },
    ],
  },

  // ── Idaho ─────────────────────────────────────────────────────────────────────
  {
    state: "Idaho",
    abbr:  "ID",
    places: [
      {
        id:       "basque-boise-1890s",
        name:     "Boise",
        era:      "1890s",
        coords:   [-116.20, 43.62],
        headline: "Boise, ID · 1890s · The Pyrenees, herding the Great Basin.",
        why: "The American West's open-range sheep industry was built by Basque immigrants from the Pyrenees — and Boise is now one of the great centers of Basque culture anywhere on Earth. The community they built outlasted the industry that brought them.",
        surprise: "Basque shepherds from the Pyrenees built the open-range sheep industry across the Great Basin, creating communities that endured long after the range era ended. Boise holds one of the largest Basque communities outside of Europe.",
        then: {
          src:       null,
          alt:       "A Basque sheepherder in the Great Basin, 1940",
          credit:    "Arthur Rothstein, FSA, Basque sheepherder, Douglas County, Nevada, 1940. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
          sourceUrl: "https://www.loc.gov/item/2017774629/",
          rights:    "Public domain (FSA/OWI; no known restrictions).",
        },
        now: {
          src:       null,
          alt:       "The Basque Block, Boise today",
          credit:    "Original photography — Furlong.",
          sourceUrl: "",
          rights:    "Commission — no confirmed clean public image.",
        },
        verified: true,
      },
    ],
  },

];

// ── Capstone ──────────────────────────────────────────────────────────────────

/**
 * The final beat of the tour.
 * No image. No map marker. Full-screen prompt to start the visitor's own story.
 */
export const CAPSTONE: Capstone = {
  id:       "your-story",
  kind:     "capstone",
  headline: "What's your story?",
  prompt:   "America is made of millions of untold journeys — hidden gems, forgotten booms, borders drawn by compass, fires that never went out. Yours could be next.",
  cta:      "Ready to begin your Journey?",
  href:     "/explore",
};

// ── JOURNEY ───────────────────────────────────────────────────────────────────

/**
 * Flat ordered array of all tour beats: every TourPlace across all seeded
 * states, followed by the Capstone. The component advances through this array.
 *
 * Add more TourStates to TOUR — JOURNEY derives from it automatically.
 */
export const JOURNEY: (TourPlace | Capstone)[] = [
  ...TOUR.flatMap((s) => s.places),
  CAPSTONE,
];

// ── Type guard ────────────────────────────────────────────────────────────────

/** True when the beat is the Capstone (no image, no map marker, full-screen overlay). */
export function isCapstone(beat: TourPlace | Capstone): beat is Capstone {
  return (beat as Capstone).kind === "capstone";
}

// ── Weekly place-rotation (LIVING_MAP_ROTATION_AND_HOLIDAY_ENGINE §4a) ─────────
//
// The map features a DIFFERENT journey each ISO week — a different set and order
// of stops — drawn deterministically from the full pool. Same week → same
// journey for everyone (no per-visitor state, no tracking); over successive
// weeks the whole pool is featured. This is the privacy-safe "different journey
// each week" behaviour ("no visitor identification — maps the bigger picture,
// not you").

/**
 * Tone of a place, derived from its copy: "heavy" = sorrow/injustice;
 * "light" = wonder / opportunity / wit. Used to tone-balance the week's order so
 * heavy stops are never featured back-to-back.
 */
const HEAVY_TONE_RE =
  /\b(kill(?:ed|ing)?|massacre|slaughter|lynch\w*|enslav\w*|slave\w*|silicosis|died|deaths?|deadly|forced|removal|driven out|expelled|riot\w*|burned|destroyed|disaster|hardship|segregat\w*|internment|epidemic|plague|wiped out|toll)\b/i;

export function placeTone(p: TourPlace): "heavy" | "light" {
  return HEAVY_TONE_RE.test(`${p.why} ${p.surprise} ${p.headline}`) ? "heavy" : "light";
}

/** Greedy interleave so no two HEAVY stops are adjacent (starts light when it can). */
function toneBalance(places: TourPlace[]): TourPlace[] {
  const heavy = places.filter((p) => placeTone(p) === "heavy");
  const light = places.filter((p) => placeTone(p) === "light");
  const out: TourPlace[] = [];
  let h = 0;
  let l = 0;
  while (h < heavy.length || l < light.length) {
    const prevHeavy = out.length > 0 && placeTone(out[out.length - 1]) === "heavy";
    if (out.length === 0 || prevHeavy) {
      // start, or after a heavy → must place a light if any remain
      if (l < light.length) out.push(light[l++]);
      else out.push(heavy[h++]); // unavoidable (heavy is the strict majority)
    } else {
      // after a light → interleave a heavy if any remain
      if (h < heavy.length) out.push(heavy[h++]);
      else out.push(light[l++]);
    }
  }
  return out;
}

/**
 * The featured journey for a given ISO week. Deterministic by week:
 *   1. pick ONE place per state via (week + stateOffset) % places.length — the
 *      featured gem rotates through each state's pool over successive weeks, so
 *      every place is eventually featured;
 *   2. rotate the order's starting point by week (so the order itself differs
 *      week to week), then tone-balance (no two heavy stops adjacent);
 *   3. end with the Capstone.
 * Same week input → identical journey for everyone (privacy-safe, no tracking).
 */
export function buildWeeklyJourney(weekSeed: number): (TourPlace | Capstone)[] {
  const w = Math.trunc(weekSeed);
  const picked: TourPlace[] = TOUR.filter((s) => s.places.length > 0).map((s, si) => {
    const len = s.places.length;
    const idx = (((w + si) % len) + len) % len;
    return s.places[idx];
  });
  const n = picked.length;
  const start = n > 0 ? (((w % n) + n) % n) : 0;
  const rotated = picked.slice(start).concat(picked.slice(0, start));
  return [...toneBalance(rotated), CAPSTONE];
}
