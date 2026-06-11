/**
 * americasJourneyNowImages — Build 53
 *
 * Present-day "now" image registry for the America's Journey then→now dissolve.
 * Keyed by stop id. Pairs with IMAGES (then) from americasJourneyImages.ts.
 *
 * In the component:
 *     const imageNow = NOW_IMAGES[stop.id] ?? null;
 *
 * THREE TIERS:
 *
 *   'pd'         — Public domain / CC0 from a trusted federal institution
 *                  (NPS, Smithsonian, USFS). Cleanest — matches the archival
 *                  image standard. Download from the gallery/sourceUrl, pick an
 *                  institution-credited image with no third-party photographer
 *                  copyright. Save to /public/journey/<id>-now.jpg, set src,
 *                  render its credit.
 *
 *   'cc-verify'  — Creative Commons candidate (primarily Wikimedia). USABLE,
 *                  but: open the file page, confirm the exact license version +
 *                  required attribution string. CC-BY-SA carries a share-alike
 *                  obligation. Lower provenance than 'then' images. All cc-verify
 *                  entries start with needsConfirmation: true — clear it to
 *                  exactly false (not undefined) only after verifying:
 *                    1. Exact license version
 *                    2. Author name
 *                    3. Attribution string copied verbatim into credit field
 *
 *   'commission' — No clean trusted-source image found. Recommend original /
 *                  commissioned photography: clean rights (Furlong owns it),
 *                  consistent visual look, no attribution/share-alike strings.
 *                  src stays null until shot. Stop runs then-image + text until
 *                  the now-image lands.
 *
 * DUAL CREDIT:
 *   In the then→now display, each image renders its own visible ArchivalCredit.
 *   Do not show one credit for both. The imageThen credit and imageNow credit
 *   are separate, independent DOM elements.
 *
 * ALLENSWORTH:
 *   Both the then-image (CA State Parks) AND any now-image from the same
 *   collection are blocked (needsConfirmation: true) until rights are confirmed.
 *   See ALLENSWORTH_IMAGE_RIGHTS_REQUEST.md.
 *
 * RECOMMENDATION:
 *   The 'pd' now-images are ingested (NPS/Smithsonian/USFS/LoC — no verification
 *   overhead). Build 57 resolved the former 'cc-verify' set by sourcing public-
 *   domain Carol M. Highsmith Archive images (Library of Congress, "no known
 *   restrictions on publication") for Wall Street, Locke (California Delta), and
 *   Greenwood/Tulsa, and downgrading York (no clean PD/CC source) to commission.
 *   The remaining 'commission' stops await original photography for a consistent
 *   modern aesthetic and clean rights.
 *
 * "The map reveals opportunities, not the visitor."
 * "We show pathways, not promises."
 * "Public Alpha remains PENDING."
 */

import type { ArchivalImage } from "./americasJourneyStops";

// ── NowImage ───────────────────────────────────────────────────────────────────

/**
 * Extends ArchivalImage with three registry-only fields:
 *   tier            — sourcing tier (pd / cc-verify / commission).
 *   needsConfirmation — blocks ALL display. For cc-verify, must be set to
 *                       exactly `false` (not undefined) after license is verified.
 *   note            — editorial note for maintainers; never rendered to public UI.
 */
export type NowImage = ArchivalImage & {
  tier: "pd" | "cc-verify" | "commission";
  needsConfirmation?: boolean;
  note?: string;
};

// ── NOW_IMAGES registry ────────────────────────────────────────────────────────

/**
 * Keyed by stop id (matches JourneyStop.id).
 *
 * All src values are null until the corresponding image is downloaded to
 * /public/journey/<id>-now.jpg. The component must handle null gracefully
 * (then-image + text only — no broken img element).
 *
 * 'pd' entries: download from the NPS/Smithsonian/USFS gallery at sourceUrl.
 *   Pick an NPS-credited image with no third-party photographer copyright.
 *
 * 'cc-verify' entries: verify the file page before setting src. Must have:
 *   - Exact license version confirmed
 *   - Author name confirmed and populated in credit
 *   - needsConfirmation set to exactly false (not just left undefined)
 *
 * 'commission' entries: src stays null until original photography is delivered.
 */
export const NOW_IMAGES: Record<string, NowImage> = {

  // ── St. Augustine, 1565 — Castillo de San Marcos today ──────────────────
  "st-augustine-1565": {
    tier: "pd",
    src: '/journey/st-augustine-1565-now.jpg',
    year: "Present day",
    alt: "Castillo de San Marcos today, St. Augustine",
    description: "The coquina fort, present day",
    institution: "National Park Service — Castillo de San Marcos NM",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/casa/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/casa/learn/photosmultimedia/index.htm",
    credit: "National Park Service (public domain).",
    rights: "Public domain — NPS. Pick an NPS-credited image (no third-party copyright).",
    note: "Verify subject is the St. Augustine, FL fort (a same-named fort exists in Spain).",
  },

  // ── Jamestown, 1607 — Historic Jamestowne today ──────────────────────────
  "jamestown-1607": {
    tier: "pd",
    src: '/journey/jamestown-1607-now.jpg',
    year: "Present day",
    alt: "Historic Jamestowne today — church tower and fort site",
    description: "Present-day Jamestown site",
    institution: "National Park Service — Colonial NHP",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/jame/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/jame/learn/photosmultimedia/photogallery.htm",
    credit: "National Park Service / Colonial National Historical Park (public domain).",
    rights: "Public domain — NPS.",
  },

  // ── Wall Street / New Amsterdam, 1653 — NYSE trading floor (Highsmith / LoC, pd) ─
  // Build 57: replaced the cc-verify Wikimedia candidate with a public-domain
  // Carol M. Highsmith Archive image from the Library of Congress (no known
  // restrictions on publication) — same provenance standard as the 'then' set.
  "wall-street-1653": {
    tier: "pd",
    src: '/journey/wall-street-1653-now.jpg',
    year: 1980,
    alt: "New York Stock Exchange trading floor on Wall Street, New York",
    description: "The NYSE trading floor — the institution Wall Street became",
    institution: "Library of Congress, Prints & Photographs Division — Carol M. Highsmith Archive",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/item/2011634218/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division (no known restrictions on publication).",
    rights: "Public domain (no known restrictions on publication) — Library of Congress, Carol M. Highsmith Archive.",
    note: "Highsmith NYSE trading floor (LoC 2011634218), dated 1980. Public domain — no attribution/share-alike obligation.",
  },

  // ── Cumberland Gap, 1775 — Gap / vista today ─────────────────────────────
  "cumberland-gap-1775": {
    tier: "pd",
    src: '/journey/cumberland-gap-1775-now.jpg',
    year: "Present day",
    alt: "Cumberland Gap National Historical Park today",
    description: "Present-day gap / vista",
    institution: "National Park Service — Cumberland Gap NHP",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/cuga/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/cuga/learn/photosmultimedia/index.htm",
    credit: "National Park Service (public domain).",
    rights: "Public domain — NPS. (CC alt: Warren LeMay, CC BY-SA 2.0.)",
  },

  // ── Erie Canal / NY Harbor, 1825 — Statue of Liberty today ───────────────
  // Carol M. Highsmith photo (LC-DIG-highsm-13921). The Highsmith Archive is
  // dedicated to the public domain — "no known restrictions on publication."
  // Replaces the earlier NPS file, which rendered as a dark, unrecognizable
  // silhouette. 948×1200, clear daytime view of the statue.
  "ny-harbor-erie-canal-1825": {
    tier: "pd",
    src: '/journey/ny-harbor-erie-canal-1825-now.jpg',
    year: "Present day",
    alt: "The Statue of Liberty in New York Harbor, present day",
    description: "Statue of Liberty, New York Harbor, present day",
    institution: "Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/pictures/collection/highsm/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/resource/highsm.13921/",
    credit: "Carol M. Highsmith, Library of Congress (LC-DIG-highsm-13921). No known restrictions on publication.",
    rights: "Public domain — Carol M. Highsmith Archive, Library of Congress; no known restrictions on publication.",
  },

  // ── Cotton gin, 1793 — preserved cotton gin (Smithsonian CC0) ────────────
  "cotton-gin-1793": {
    tier: "pd",
    src: '/journey/cotton-gin-1793-now.jpg',
    year: "Present day",
    alt: "A preserved historic cotton gin",
    description: "Cotton gin object (40-saw, wooden gearing)",
    institution: "Smithsonian, National Museum of American History (Open Access)",
    repositoryName: "Smithsonian Institution",
    repositoryUrl: "https://americanhistory.si.edu/",
    repositoryType: "federal",
    sourceUrl: "https://americanhistory.si.edu/collections/object/nmah_872995",
    credit: "Cotton gin, National Museum of American History, Smithsonian Institution (CC0).",
    rights: "CC0 (Smithsonian Open Access). Cleanest in the set.",
  },

  // ── Nebraska homestead, 1863 — Homestead NHP today ───────────────────────
  "nebraska-homestead-1863": {
    tier: "pd",
    src: '/journey/nebraska-homestead-1863-now.jpg',
    year: "Present day",
    alt: "Homestead National Historical Park today",
    description: "Palmer-Epard Cabin / Heritage Center, or a present-day cornfield",
    institution: "National Park Service — Homestead NHP",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/home/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/home/learn/photosmultimedia/index.htm",
    credit: "National Park Service (public domain).",
    rights: "Public domain — NPS.",
  },

  // ── Promontory / Railroad, 1869 — Golden Spike NHP today ─────────────────
  "promontory-1869": {
    tier: "pd",
    src: '/journey/promontory-1869-now.jpg',
    year: "Present day",
    alt: "Golden Spike National Historical Park today — replica locomotives",
    description: "Present-day site / replica Jupiter & 119 locomotives",
    institution: "National Park Service — Golden Spike NHP",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/gosp/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/gosp/learn/photosmultimedia/index.htm",
    credit: "National Park Service (public domain).",
    rights: "Public domain — NPS.",
  },

  // ── Great Plains / Bison, 1880s — wild bison in Yellowstone today ─────────
  "great-plains-bison-1880s": {
    tier: "pd",
    src: '/journey/great-plains-bison-1880s-now.jpg',
    year: "Present day",
    alt: "Wild bison in Yellowstone today",
    description: "Bison on protected land, present day",
    institution: "National Park Service — Yellowstone",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/yell/",
    repositoryType: "federal",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cowbirds_on_bison_(7545304160).jpg",
    credit: "Bison, Yellowstone National Park — National Park Service (public domain).",
    rights: "Public domain (PD-US-NPS, from Yellowstone NPS).",
  },

  // ── California Delta, 1882 — Locke Historic District today (Highsmith / LoC, pd) ─
  // Build 57: replaced the cc-verify Wikimedia candidate with a public-domain
  // Carol M. Highsmith Archive streetscape of Locke from the Library of Congress.
  "california-delta-1882": {
    tier: "pd",
    src: '/journey/california-delta-1882-now.jpg',
    year: 2012,
    alt: "Buildings in Locke, California today — the Delta town built by Chinese immigrants",
    description: "Locke Historic District streetscape, present day",
    institution: "Library of Congress, Prints & Photographs Division — Carol M. Highsmith Archive",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/item/2013633560/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division (no known restrictions on publication).",
    rights: "Public domain (no known restrictions on publication) — Library of Congress, Carol M. Highsmith Archive.",
    note: "Highsmith Locke streetscape (LoC 2013633560), dated 2012. Public domain — no attribution/share-alike obligation.",
  },

  // ── Mississippi Delta / Chinese community, 1870s — commission ────────────
  "mississippi-delta-chinese-1870s": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "The Mississippi Delta today",
    description: "A present-day Delta town or landscape",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No clean confirmed present-day file from a trusted source. Recommend commissioning.",
    note: "Clarksdale streetscape exists on Commons but no confirmed clean file; original is cleaner + on-brand. Delta Chinese Heritage Museum (deltastate.edu archives) is the relationship play for the historical context.",
  },

  // ── Nicodemus, 1877 — Nicodemus NHS today ────────────────────────────────
  "nicodemus-1877": {
    tier: "pd",
    src: '/journey/nicodemus-1877-now.jpg',
    year: "Present day",
    alt: "Nicodemus National Historic Site today",
    description: "Township church / town view, present day",
    institution: "National Park Service — Nicodemus NHS",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/nico/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/nico/learn/photosmultimedia/index.htm",
    credit: "National Park Service (public domain).",
    rights: "Public domain — NPS. (CC alt: Nicodemus.JPG, CC BY-SA 2.5.)",
  },

  // ── Spindletop, 1901 — commission ────────────────────────────────────────
  "spindletop-1901": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "Spindletop / Gladys City Boomtown today",
    description: "Re-created boomtown / oil derrick at the museum",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "Category-only on Commons, no confirmed clean file. Recommend commissioning (or verify a Gladys City museum file).",
    note: "Portal to Texas History (UT-Arlington) has Spindletop materials; check per-item rights before using.",
  },

  // ── Yosemite, 1864 — Tunnel View today (pd, NPS) ─────────────────────────
  "yosemite-1864": {
    tier: "pd",
    src: '/journey/yosemite-1864-now.jpg',
    year: "Present day",
    alt: "Tunnel View, Yosemite Valley today",
    description: "Tunnel View — El Capitan, Half Dome, and Bridalveil Fall, present day",
    institution: "National Park Service — Yosemite National Park",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/yose/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/places/000/tunnel-view.htm",
    credit: "National Park Service / C. Jacoby (public domain).",
    rights: "Public domain — NPS (NPS-credited staff photo, no third-party copyright).",
  },

  // ── Barre granite, 1880s — commission ────────────────────────────────────
  "barre-granite-1880s": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "Barre, Vermont granite today — Hope Cemetery monuments",
    description: "Sculpted granite monuments / Rock of Ages quarry",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "Sparse on Commons; modern monument close-ups may carry sculptor copyright. Recommend original photography of older (public-domain-design) stones or the quarry.",
    note: "Vermont Historical Society (library@vermonthistory.org) for research/educational permission on their holdings — consider as a relationship-building contact.",
  },

  // ── Basque sheepherders / Boise, 1890s — commission ──────────────────────
  "basque-boise-1890s": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "The Basque Block, Boise today",
    description: "Basque Center / Basque Block streetscape",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "Thin Commons coverage. Recommend commissioning (CC candidate 'Basque center in Boise' exists but author/license unverified).",
    note: "Basque Museum and Cultural Center, Boise (basquemuseum.eus) is a mission-aligned partner — consider a permission request + credit-back relationship.",
  },

  // ── Greenwood / Tulsa, 1921 — Oaklawn Cemetery today (Highsmith / LoC, pd) ──
  // Build 57: replaced the cc-verify Wikimedia candidate with a public-domain
  // Carol M. Highsmith Archive image of Oaklawn Cemetery — the burial ground
  // where, in 2020, scientists began locating the unmarked graves of victims of
  // the 1921 Tulsa Race Massacre. A direct, dignified present-day reckoning.
  "greenwood-tulsa-1921": {
    tier: "pd",
    src: '/journey/greenwood-tulsa-1921-now.jpg',
    year: 2020,
    alt: "Oaklawn Cemetery, Tulsa today — where the 1921 massacre's unmarked graves are being recovered",
    description: "Oaklawn Cemetery, Tulsa — site of the search for the 1921 massacre's mass graves",
    institution: "Library of Congress, Prints & Photographs Division — Carol M. Highsmith Archive",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/item/2020743572/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division (no known restrictions on publication).",
    rights: "Public domain (no known restrictions on publication) — Library of Congress, Carol M. Highsmith Archive.",
    note: "Highsmith Oaklawn Cemetery (LoC 2020743572), dated 2020. Public domain — no attribution/share-alike obligation.",
  },

  // ── Dust Bowl, 1930s — restored grassland / national grassland today ──────
  "dust-bowl-1930s": {
    tier: "pd",
    src: '/journey/dust-bowl-1930s-now.jpg',
    year: "Present day",
    alt: "Restored shortgrass prairie / national grassland today",
    description: "A national grassland landscape, present day",
    institution: "U.S. Forest Service (or NPS)",
    repositoryName: "U.S. Forest Service",
    repositoryUrl: "https://www.fs.usda.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.fs.usda.gov/",
    credit: "U.S. Forest Service (public domain).",
    rights: "Public domain — USFS (preferred). CC alt: Pawnee National Grassland.JPG, CC BY-SA 3.0 (verify author).",
    note: "Use a USFS/NPS public-domain national-grassland image to mirror 'how we learned to keep the soil.'",
  },

  // ── Field Order No. 15, 1865 — Reconstruction Era NHP today ──────────────
  "field-order-15-1865": {
    tier: "pd",
    src: '/journey/field-order-15-1865-now.jpg',
    year: "Present day",
    alt: "Reconstruction Era National Historical Park today, Beaufort SC",
    description: "Brick Baptist Church / Darrah Hall, present day",
    institution: "National Park Service — Reconstruction Era NHP",
    repositoryName: "National Park Service",
    repositoryUrl: "https://www.nps.gov/reer/",
    repositoryType: "federal",
    sourceUrl: "https://www.nps.gov/reer/learn/photosmultimedia/index.htm",
    credit: "National Park Service / Reconstruction Era National Historical Park (public domain).",
    rights: "Public domain — NPS.",
  },

  // ── DE: Twelve-Mile Circle — commission (present-day New Castle County Courthouse) ─
  "de-twelve-mile-circle": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "New Castle County Courthouse, Delaware today",
    description: "Present-day New Castle Courthouse — the center point of the Twelve-Mile Circle",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No confirmed clean PD or CC present-day courthouse photo. Recommend commissioning.",
    note: "The New Castle Courthouse is the surveyed center of the arc. A present-day exterior shot from the public sidewalk cleans easily.",
  },

  // ── DE: The Wedge — commission (present-day survey monument) ────────────
  "de-the-wedge": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "The Wedge boundary marker, Delaware today",
    description: "Present-day survey monument at the Delaware–Maryland–Pennsylvania tri-point",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No confirmed clean PD or CC present-day monument photo. Recommend commissioning.",
    note: "The Wedge is a small disputed triangle; the boundary stone is accessible and photogenic.",
  },

  // ── DE: Zwaanendael / Lewes — Margolies/LoC (pd) ────────────────────────
  "de-zwaanendael-lewes": {
    tier: "pd",
    src: '/journey/de-zwaanendael-lewes-now.jpg',
    year: "c. 1980s",
    alt: "Lewes, Delaware today — historic waterfront town",
    description: "Present-day Lewes streetscape (Margolies Roadside America collection)",
    institution: "Library of Congress, Prints & Photographs Division — Roadside America / John Margolies",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/item/2017702554/",
    credit: "John Margolies, Roadside America Archive, Library of Congress, Prints & Photographs Division (no known copyright restrictions).",
    rights: "Public domain (no known copyright restrictions) — Library of Congress Margolies collection.",
    note: "Downloaded from LoC IIIF tile service. Shows the Lewes waterfront / historic district.",
  },

  // ── PA: Pithole — commission (present-day empty site / Drake Well Museum) ─
  "pa-pithole": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "Pithole City site, Pennsylvania today",
    description: "Present-day Pithole — a grassy field where the boomtown stood",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No confirmed clean PD or CC present-day site photo. Drake Well Museum images are museum-licensed. Recommend commissioning.",
    note: "The site is maintained by the Commonwealth of Pennsylvania as part of Oil Creek State Park. A drone shot of the empty field reads as a powerful now image.",
  },

  // ── PA: York (Continental Congress capital) — commission ───────────────────
  // Build 57: downgraded from cc-verify to commission. The Carol M. Highsmith
  // Archive at LoC has no clean present-day downtown-York streetscape (its "York"
  // results are Gettysburg "New York" monuments or a single chainsaw-carving
  // item), and no other trusted PD/CC0 source was confirmed. Runs then-image +
  // text until original photography of Continental Square is delivered.
  "pa-york-capital": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "York, Pennsylvania — Continental Square today",
    description: "Present-day York, Pennsylvania — Continental Square / historic center",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No confirmed clean PD or CC present-day York streetscape. Recommend commissioning a Continental Square exterior from the public sidewalk.",
    note: "Highsmith Archive has no downtown-York image. A present-day Continental Square / Old York County Courthouse exterior cleans easily as original photography.",
  },

  // ── PA: Centralia — NOW image commission ─────────────────────────────────
  // Build 55 sourcing decision:
  //   REJECTED: NASA/METI ASTER satellite image sourced via Wikimedia Commons.
  //     Reason: Furlong standard is LoC/USGS direct sources, not Wikimedia.
  //     The ASTER program is a joint U.S.–Japan collaboration; the specific
  //     "ASTER Science Team" image on Wikimedia carries a joint-agency notice
  //     that does not map cleanly to a simple PD-USGov declaration.
  //   USGS NAIP orthoimagery (EarthExplorer): confirmed PD-USGov source.
  //     Requires interactive login at earthexplorer.usgs.gov — not scriptable.
  //     Pull the Centralia, PA NAIP tile when ready and ingest directly from USGS.
  //     Credit: "U.S. Geological Survey." Rights: "Public domain (U.S. Government)."
  //   FALLBACK: commission original aerial/site photography (Furlong owns the rights).
  "pa-centralia": {
    tier: "pd",
    src: '/journey/pa-centralia-now.jpg',
    year: "Present day",
    alt: "Aerial view of Centralia, Pennsylvania today — the abandoned street grid reclaimed by forest",
    description: "Present-day NAIP aerial of Centralia — the empty street grid where the town stood",
    institution: "U.S. Department of Agriculture — National Agriculture Imagery Program (NAIP)",
    repositoryName: "U.S. Department of Agriculture",
    repositoryUrl: "https://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/",
    repositoryType: "federal",
    sourceUrl: "https://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/",
    credit: "U.S. Department of Agriculture, National Agriculture Imagery Program (NAIP).",
    rights: "Public domain (U.S. Government work — USDA NAIP).",
    note: "Pulled from the USDA NAIP ImageServer (exportImage) at the Centralia, PA coordinates. PD-USGov. No clean PD 'then' photo exists (USGS Fact Sheet 2009-3084 photos are individually/commercially copyrighted), so this stop runs as a single present-day image.",
  },

  // ── Great Migration, 1916–1970 — Bronzeville today — commission ──────────
  "great-migration-1916-1970": {
    tier: "commission",
    needsConfirmation: true,
    src: null,
    alt: "Bronzeville, Chicago today",
    description: "Bronzeville district / 'Monument to the Great Northern Migration'",
    institution: "Commission / original photography",
    repositoryType: "commission",
    sourceUrl: "",
    credit: "Original photography — Furlong.",
    rights: "No confirmed clean Bronzeville file. Recommend commissioning, or verify a CC file of the 'Monument to the Great Northern Migration' (Bronzeville's signature landmark).",
    note: "Chicago Public Library Vivian Harsh Collection (harshcollection@chipublib.org) for in-copyright materials — mission-aligned relationship. The monument itself may have sculptor-copyright considerations if in a commissioned photo.",
  },

};
