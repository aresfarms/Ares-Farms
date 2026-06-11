/**
 * journeyPoolManifest — Living Map, Phase 3 (Pool Refresh)
 *
 * Weekly archive-mining output: NEW rights-clean candidates to grow each stop's
 * pool. This is the INPUT consumed by src/scripts/ingestJourneyPool.ts, which
 * resolves the largest IIIF/download image URL from each catalog page, downloads
 * it into /public/journey/, and writes americasJourneyPoolGenerated.ts.
 *
 * SOURCE (2026-06-06 run): Library of Congress only — every candidate is a
 * confirmed public-domain LoC item (FSA/OWI, Detroit Publishing Co., HABS/HAER,
 * Lawrence & Houseworth, the Carol M. Highsmith Archive, or pre-1929 prints).
 * Smithsonian Open Access (CC0) is available once SI_API_KEY is set; not used in
 * this run.
 *
 * `src` is deliberately omitted here — it is resolved at ingest from `sourceUrl`
 * (the real, openable LoC catalog page). No image URLs are fabricated.
 *
 * De-duplication: candidates that resolve to an image already present as a stop's
 * canonical then/now image (IMAGES / NOW_IMAGES) were dropped before encoding
 * (Nebraska ppmsca.08372, Spindletop 2010649511, Basque 2017774629, Barre
 * 2004678255) to avoid showing the same photo twice in a pool.
 *
 * RIGHTS DISCIPLINE: every entry is CC0 or public domain / no known restrictions.
 * The ingestion script re-checks rights and skips anything not clean.
 *
 * "The map reveals opportunities, not the visitor."
 * Public Alpha remains PENDING.
 */

export interface PoolCandidate {
  /** Stop id — matches TourPlace.id / the IMAGES & NOW_IMAGES keys. */
  stopId: string;
  /** TRUE date of the image. Numbers sort naturally; "c. 1870s" parses to 1870. */
  year: number | string;
  /** LoC catalog page. The image URL is resolved from here at ingest. */
  sourceUrl: string;
  /** Exact visible credit line. */
  credit: string;
  /** Rights status — must be CC0 / public domain / no known restrictions. */
  rights: string;
  /** Concise alt text for screen readers. */
  alt: string;
}

const PD = "Public domain — no known restrictions on publication.";
const PD_FSA = "Public domain (FSA/OWI — free to use and reuse).";
const PD_GOV = "Public domain — no known restrictions on this U.S. Government work.";
const PD_HIGHSMITH = "Public domain — no known restrictions on publication (Carol M. Highsmith gift).";

export const POOL_MANIFEST: PoolCandidate[] = [

  // ── St. Augustine ──────────────────────────────────────────────────────────
  {
    stopId: "st-augustine-1565", year: "c. 1865",
    sourceUrl: "https://www.loc.gov/item/2015649014/",
    credit: "“Interior of Castle St. Marcus, St. Augustine, Florida,” Sam A. Cooley, photographer. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Interior of the Castillo de San Marcos, St. Augustine, photographed in the 1860s",
  },
  {
    stopId: "st-augustine-1565", year: "c. 1925",
    sourceUrl: "https://www.loc.gov/resource/agc.7a03481/",
    credit: "“Walls and round tower by the water, Castillo de San Marcos,” Arnold Genthe. Genthe Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Walls and round tower of the Castillo de San Marcos by the water, c. 1920s",
  },

  // ── Jamestown ──────────────────────────────────────────────────────────────
  {
    stopId: "jamestown-1607", year: 2019,
    sourceUrl: "https://www.loc.gov/item/2020724678/",
    credit: "Commemoration Tower, Jamestown Settlement, Virginia. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Commemoration Tower at the Jamestown Settlement, Virginia",
  },
  {
    stopId: "jamestown-1607", year: 2019,
    sourceUrl: "https://www.loc.gov/item/2020724668/",
    credit: "Reconstructed fort buildings, Jamestown Settlement, Virginia. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Reconstructed fort buildings at the Jamestown Settlement, Virginia",
  },

  // ── Wall Street / New Amsterdam ────────────────────────────────────────────
  {
    stopId: "wall-street-1653", year: 1651,
    sourceUrl: "https://www.loc.gov/item/2020635594/",
    credit: "“New Amsterdam” — the Hartgers view, the earliest known depiction, 1651. Library of Congress, Prints & Photographs Division (LC-DIG-ppmsca-69361).",
    rights: PD,
    alt: "The 1651 Hartgers view of New Amsterdam, the earliest known depiction",
  },

  // ── Cumberland Gap ─────────────────────────────────────────────────────────
  {
    stopId: "cumberland-gap-1775", year: "c. 1870s",
    sourceUrl: "https://www.loc.gov/item/2013645292/",
    credit: "“View of Cumberland Gap, from the south.” Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Engraved view of the Cumberland Gap from the south, 19th century",
  },
  {
    stopId: "cumberland-gap-1775", year: 2017,
    sourceUrl: "https://www.loc.gov/item/2020722330/",
    credit: "View from “The Pinnacle,” Cumberland Gap National Historical Park, Kentucky. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Modern view from The Pinnacle overlook at Cumberland Gap National Historical Park",
  },

  // ── Erie Canal / NY Harbor (HAER — may not expose a JPEG; skipped if so) ────
  {
    stopId: "ny-harbor-erie-canal-1825", year: 1968,
    sourceUrl: "https://www.loc.gov/item/ny2322/",
    credit: "New York State Barge Canal (Erie Canal), Lock E34, Lockport, NY. Historic American Engineering Record, Library of Congress, Prints & Photographs Division.",
    rights: PD_GOV,
    alt: "Erie Canal Lock E34 at Lockport, New York",
  },
  {
    stopId: "ny-harbor-erie-canal-1825", year: 1968,
    sourceUrl: "https://www.loc.gov/item/ny2323/",
    credit: "New York State Barge Canal (Erie Canal), Lock E35, Lockport, NY. Historic American Engineering Record, Library of Congress, Prints & Photographs Division.",
    rights: PD_GOV,
    alt: "Erie Canal Lock E35 at Lockport, New York",
  },

  // ── Cotton gin ─────────────────────────────────────────────────────────────
  {
    stopId: "cotton-gin-1793", year: 1869,
    sourceUrl: "https://www.loc.gov/item/91784966/",
    credit: "“The First cotton-gin,” drawn by William L. Sheppard, 1869. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Engraving titled 'The First cotton-gin,' 1869",
  },
  {
    stopId: "cotton-gin-1793", year: "c. 1890",
    sourceUrl: "https://www.loc.gov/item/2016817588/",
    credit: "“A cotton gin,” Detroit Publishing Co. (photograph by W. H. Jackson). Detroit Publishing Co. Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "A cotton gin photographed by the Detroit Publishing Co., c. 1890s",
  },
  {
    stopId: "cotton-gin-1793", year: "c. 1900",
    sourceUrl: "https://www.loc.gov/item/2016796262/",
    credit: "“Cotton gin at Dahomey,” Detroit Publishing Co. Detroit Publishing Co. Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Cotton gin at Dahomey, Mississippi, c. 1900",
  },

  // ── Nebraska homestead (dropped ppmsca.08372 — same as canonical then) ──────
  {
    stopId: "nebraska-homestead-1863", year: 1936,
    sourceUrl: "https://www.loc.gov/item/2004674029/",
    credit: "Nebraska sod houses and farmyards, May–August 1936, Arthur Rothstein. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Nebraska sod houses and farmyards photographed by Arthur Rothstein, 1936",
  },

  // ── Promontory ─────────────────────────────────────────────────────────────
  {
    stopId: "promontory-1869", year: "c. 1866",
    sourceUrl: "https://www.loc.gov/item/2004681374/",
    credit: "Central Pacific Railroad construction, Alfred A. Hart, 1862–69. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Central Pacific Railroad construction, photographed by Alfred A. Hart",
  },
  {
    stopId: "promontory-1869", year: "c. 1866",
    sourceUrl: "https://www.loc.gov/item/2002724185/",
    credit: "“Central Pacific Railroad, Bloomer Cut, near Auburn, Placer County,” Alfred A. Hart. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Bloomer Cut on the Central Pacific Railroad near Auburn, California",
  },

  // ── Great Plains / bison ───────────────────────────────────────────────────
  {
    stopId: "great-plains-bison-1880s", year: "c. 1900",
    sourceUrl: "https://www.loc.gov/item/2016810375/",
    credit: "“Indians hunting bison on horses covered with bisonskins.” Detroit Publishing Co. Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Hunters on horseback pursuing bison, c. 1900",
  },
  {
    stopId: "great-plains-bison-1880s", year: 2014,
    sourceUrl: "https://www.loc.gov/resource/highsm.65234/",
    credit: "American bison, Joseph H. Williams Tallgrass Prairie Preserve, Osage County, Oklahoma. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "American bison on the Tallgrass Prairie Preserve, Oklahoma",
  },

  // ── California / Sacramento Delta ──────────────────────────────────────────
  {
    stopId: "california-delta-1882", year: "c. 1866",
    sourceUrl: "https://www.loc.gov/item/2002719823/",
    credit: "“Sacramento City — Central Pacific R.R. Works, at China Slough.” Lawrence & Houseworth Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Central Pacific Railroad works at China Slough, Sacramento, c. 1866",
  },
  {
    stopId: "california-delta-1882", year: 1877,
    sourceUrl: "https://www.loc.gov/item/93510092/",
    credit: "“Chinese immigrants at the San Francisco custom-house,” P. Frenzeny, wood engraving, 1877. Library of Congress, Prints & Photographs Division.",
    rights: "Public domain by date (pre-1929 published engraving).",
    alt: "Wood engraving of Chinese immigrants at the San Francisco custom-house, 1877",
  },

  // ── Mississippi Delta ──────────────────────────────────────────────────────
  {
    stopId: "mississippi-delta-chinese-1870s", year: 1939,
    sourceUrl: "https://www.loc.gov/item/2017801797/",
    credit: "Good Hope Plantation manager paying off a cotton picker, Mileston, Mississippi Delta, Marion Post Wolcott, 1939. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "A cotton picker being paid at a Mississippi Delta plantation store, 1939",
  },
  {
    stopId: "mississippi-delta-chinese-1870s", year: 1939,
    sourceUrl: "https://www.loc.gov/item/2017801816/",
    credit: "Cotton buyers office, Leland, Mississippi Delta, Marion Post Wolcott, 1939. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Cotton buyers office in Leland, Mississippi Delta, 1939",
  },

  // ── Nicodemus (HABS — may not expose a JPEG; skipped if so) ─────────────────
  {
    stopId: "nicodemus-1877", year: 1983,
    sourceUrl: "https://www.loc.gov/item/ks0077/",
    credit: "General view of townsite, Nicodemus Historic District, Graham County, Kansas. Historic American Buildings Survey (HABS KS-49), Library of Congress, Prints & Photographs Division.",
    rights: PD_GOV,
    alt: "General view of the Nicodemus townsite, Kansas (HABS survey)",
  },

  // ── Spindletop (dropped 2010649511 — same as canonical then) ────────────────
  {
    stopId: "spindletop-1901", year: "c. 1901",
    sourceUrl: "https://www.loc.gov/item/2010649512/",
    credit: "Spindletop oil field, Beaumont, Texas, c. 1901. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Oil derricks at the Spindletop field, Beaumont, Texas, c. 1901",
  },
  {
    stopId: "spindletop-1901", year: "c. 1901",
    sourceUrl: "https://www.loc.gov/item/2010649513/",
    credit: "“Queen of Waco” gusher, Spindletop, Beaumont, Texas, c. 1901. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "The 'Queen of Waco' gusher at Spindletop, c. 1901",
  },

  // ── Yosemite ───────────────────────────────────────────────────────────────
  {
    stopId: "yosemite-1864", year: "c. 1865",
    sourceUrl: "https://www.loc.gov/item/95514318/",
    credit: "“Lower Yosemite Falls,” Carleton E. Watkins, c. 1865. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Lower Yosemite Falls, photographed by Carleton Watkins, c. 1865",
  },
  {
    stopId: "yosemite-1864", year: "c. 1860",
    sourceUrl: "https://www.loc.gov/item/95514320/",
    credit: "“Mirror Lake, Yosemite,” Carleton E. Watkins, c. 1860. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Mirror Lake, Yosemite, photographed by Carleton Watkins, c. 1860",
  },

  // ── Barre granite (dropped 2004678255 — same as canonical then) ─────────────
  {
    stopId: "barre-granite-1880s", year: 2017,
    sourceUrl: "https://www.loc.gov/item/2017884079/",
    credit: "Decorative granite elements outside the Vermont Granite Museum, Barre, Vermont. Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Decorative granite outside the Vermont Granite Museum, Barre, Vermont",
  },

  // ── Basque / Boise (dropped 2017774629 — same as canonical then) ────────────
  {
    stopId: "basque-boise-1890s", year: 1939,
    sourceUrl: "https://www.loc.gov/item/2017773938/",
    credit: "Basque sheepherder leading a pack train down from summer camp, Adams County, Idaho, Dorothea Lange, 1939. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Basque sheepherder leading a pack train in Adams County, Idaho, 1939",
  },

  // ── Greenwood / Tulsa (dignified relief/rebuilding images only) ────────────
  {
    stopId: "greenwood-tulsa-1921", year: 1921,
    sourceUrl: "https://www.loc.gov/item/2011661526/",
    credit: "Headquarters staff, American Red Cross Disaster Relief, Tulsa, after the 1921 race massacre. American National Red Cross Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "American Red Cross disaster-relief headquarters staff, Tulsa, 1921",
  },
  {
    stopId: "greenwood-tulsa-1921", year: 1921,
    sourceUrl: "https://www.loc.gov/item/2017679774/",
    credit: "Red Cross hospital, Tulsa, Oklahoma, established for use after the 1921 race massacre. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Red Cross hospital established in Tulsa after the 1921 massacre",
  },

  // ── Dust Bowl ──────────────────────────────────────────────────────────────
  {
    stopId: "dust-bowl-1930s", year: 1936,
    sourceUrl: "https://www.loc.gov/item/2004674127/",
    credit: "Cimarron County, Oklahoma, April 1936 — Dust Bowl, Arthur Rothstein. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Dust Bowl landscape, Cimarron County, Oklahoma, 1936",
  },
  {
    stopId: "dust-bowl-1930s", year: 1935,
    sourceUrl: "https://www.loc.gov/item/2017759887/",
    credit: "Oklahoma Dust Bowl refugees, San Fernando, California, Dorothea Lange. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Oklahoma Dust Bowl refugees in San Fernando, California",
  },

  // ── Field Order No. 15 (Sea Islands / Port Royal) ──────────────────────────
  {
    stopId: "field-order-15-1865", year: 1862,
    sourceUrl: "https://www.loc.gov/resource/ppmsc.00057/",
    credit: "“Five generations on Smith’s Plantation, Beaufort, South Carolina,” Timothy H. O’Sullivan, 1862. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Five generations of a family on Smith's Plantation, Beaufort, South Carolina, 1862",
  },
  {
    stopId: "field-order-15-1865", year: "c. 1862",
    sourceUrl: "https://www.loc.gov/item/2013648995/",
    credit: "Freed children with their teachers, Port Royal / Beaufort, South Carolina, c. 1862. Library of Congress, Prints & Photographs Division.",
    rights: PD,
    alt: "Freed children with their teachers near Beaufort, South Carolina, c. 1862",
  },

  // ── Great Migration ────────────────────────────────────────────────────────
  {
    stopId: "great-migration-1916-1970", year: 1941,
    sourceUrl: "https://www.loc.gov/item/2017789025/",
    credit: "Children on Easter morning, South Side (Bronzeville), Chicago, Russell Lee, 1941. FSA/OWI Collection, Library of Congress, Prints & Photographs Division.",
    rights: PD_FSA,
    alt: "Children on Easter morning in Bronzeville, Chicago, 1941",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RECENT LAND IMAGERY (interim, 2026-06-07) — Carol M. Highsmith Archive at the
  // Library of Congress (public domain, no known restrictions; modern 1980–2022).
  // Closes the post-1940s "recent" gap as the MODERN half of a stop's pair:
  // state-level recent photos of real American farmland/land. Framed as recent
  // land only — never "for sale", no exact address, no owner identification.
  // (USDA listing photos were evaluated for this and REJECTED: not fetchable +
  // likely realtor third-party copyright — different premise, dropped.)
  // ══════════════════════════════════════════════════════════════════════════
  {
    stopId: "nebraska-homestead-1863", year: 2022,
    sourceUrl: "https://www.loc.gov/item/2021758067/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Recent photograph: a compact farmstead in the grasslands of Banner County, Nebraska (2022).",
  },
  {
    stopId: "nicodemus-1877", year: 1980,
    sourceUrl: "https://www.loc.gov/item/2011632245/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Recent photograph: a Kansas field of waving wheat (1980).",
  },
  {
    stopId: "dust-bowl-1930s", year: 2020,
    sourceUrl: "https://www.loc.gov/item/2020743272/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Recent photograph: rolls and furrows in an Osage County, Oklahoma, field (2020).",
  },
  {
    stopId: "cumberland-gap-1775", year: 2020,
    sourceUrl: "https://www.loc.gov/item/2020722453/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Recent photograph: Kentucky farm country, a barn near Elkton (2020).",
  },
  {
    stopId: "great-plains-bison-1880s", year: 2020,
    sourceUrl: "https://www.loc.gov/item/2020723918/",
    credit: "Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress, Prints & Photographs Division.",
    rights: PD_HIGHSMITH,
    alt: "Recent photograph: horses in a snowy field on the Nebraska Great Plains (2020).",
  },

];
