/**
 * americasJourneyImages — Build 53
 *
 * Canonical archival image registry for the America's Journey homepage
 * map experience. Keyed by stop id.
 *
 * Governance rules:
 *   - NEVER display an entry where needsConfirmation === true.
 *   - NEVER display an entry where src === null (image not yet downloaded).
 *   - src MUST be a /public/journey/ path — never an external URL (no hotlinking).
 *   - credit and sourceUrl MUST render visibly in the DOM when an image is shown.
 *   - Do NOT add a new entry with src populated until the image is physically
 *     downloaded to /public/journey/<stop-id>-then.jpg.
 *
 * Adding a new stop image (checklist):
 *   1. Open the sourceUrl catalog page and download a web-appropriate JPEG
 *      (≤1600px wide) from the institution's download option.
 *   2. Save to /public/journey/<stop-id>-then.jpg.
 *   3. Set src = '/journey/<stop-id>-then.jpg' in this file.
 *   4. Run: npm run verify:journey-image-credits
 *   5. Run: npx tsc --noEmit && npm run build
 *
 * Allensworth hold:
 *   'allensworth-1908' has needsConfirmation: true.
 *   Do NOT set src or display this image until California State Parks
 *   confirms rights on a specific image + catalog record.
 *   That stop runs with text + map only until cleared.
 *
 * "Public Alpha remains PENDING."
 * "The map reveals opportunities, not the visitor."
 * "We show pathways, not promises."
 */

import type { ArchivalImage } from "./americasJourneyStops";

// ── ImageEntry ─────────────────────────────────────────────────────────────────

/**
 * Extends ArchivalImage with two registry-only fields:
 *   needsConfirmation — blocks ALL display; gate fails if src is set while true.
 *   note — editorial note for maintainers; never rendered to public UI.
 */
export type ImageEntry = ArchivalImage & {
  needsConfirmation?: boolean;
  note?: string;
};

// ── IMAGES registry ────────────────────────────────────────────────────────────

/**
 * Keyed by stop id (matches JourneyStop.id).
 * PublicMapExperience resolves: `const imageThen = IMAGES[stop.id] ?? null;`
 *
 * All src values are null until the corresponding image is downloaded to
 * /public/journey/. The component must handle null src gracefully (text + map
 * only — no broken <img> element).
 */
export const IMAGES: Record<string, ImageEntry> = {

  // ── St. Augustine, 1565 ────────────────────────────────────────────────────
  "st-augustine-1565": {
    src: '/journey/st-augustine-1565-then.jpg',
    year: "c. 1930s",
    alt: "The masonry fort Castillo de San Marcos at St. Augustine",
    description: "Castillo de San Marcos (Historic American Buildings Survey)",
    institution: "Library of Congress, Prints & Photographs Division — HABS",
    sourceUrl: "https://www.loc.gov/item/fl0095/",
    credit: "Historic American Buildings Survey, Library of Congress, Prints & Photographs Division, HABS FL-17.",
    rights: "Public domain (U.S. Government work — no known restrictions).",
  },

  // ── Jamestown, 1607 ────────────────────────────────────────────────────────
  "jamestown-1607": {
    src: '/journey/jamestown-1607-then.jpg',
    year: 1612,
    alt: "John Smith's 1612 map of Virginia",
    description: "'[Map of Virginia]...by Captain John Smith,' engr. William Hole, 1612",
    institution: "Library of Congress, Geography & Map Division",
    sourceUrl: "https://www.loc.gov/item/2001695744/",
    credit: "Library of Congress, Geography and Map Division.",
    rights: "Public domain (no known restrictions on publication).",
  },

  // ── Wall Street / New Amsterdam, 1653 ─────────────────────────────────────
  "wall-street-1653": {
    src: '/journey/wall-street-1653-then.jpg',
    year: "c. 1650",
    alt: "Engraved view of New Amsterdam about 1650",
    description: "'New Amsterdam about 1650' — engraved view of the Dutch settlement",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2003664773/",
    credit: "Library of Congress, Prints and Photographs Division, LC-DIG-pga-12825.",
    rights: "Public domain (no known restrictions on publication).",
    note: "Depicts the Dutch waterfront, not the palisade itself.",
  },

  // ── Cumberland Gap, 1775 ───────────────────────────────────────────────────
  "cumberland-gap-1775": {
    src: '/journey/cumberland-gap-1775-then.jpg',
    year: 1872,
    alt: "1872 landscape engraving of the Cumberland Gap",
    description: "'Cumberland Gap,' 1872 engraving (H. Fenn / S. V. Hunt)",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/95513932/",
    credit: "Courtesy of the Library of Congress, Prints and Photographs Division.",
    rights: "Public domain by date (pre-1929 engraving). Do NOT use the Bingham painting (Kemper Art Museum restrictions).",
  },

  // ── Erie Canal / NY Harbor, 1825 ──────────────────────────────────────────
  "ny-harbor-erie-canal-1825": {
    src: '/journey/ny-harbor-erie-canal-1825-then.jpg',
    year: "c. 1880",
    alt: "The Erie Canal at Little Falls, New York — canal cut and a passing boat",
    description: "Erie Canal at Little Falls, New York (Detroit Publishing Co.)",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2016797468/",
    credit: "Erie Canal at Little Falls, New York. Detroit Publishing Co. Collection, Library of Congress, Prints & Photographs Division.",
    rights: "Public domain — no known restrictions on publication.",
  },

  // ── Cotton gin, 1793 ──────────────────────────────────────────────────────
  "cotton-gin-1793": {
    src: '/journey/cotton-gin-1793-then.jpg',
    year: 1794,
    alt: "Eli Whitney's 1794 cotton gin patent drawing",
    description: "Eli Whitney's original cotton gin patent drawing, March 14, 1794",
    institution: "National Archives — Records of the Patent and Trademark Office (RG 241)",
    sourceUrl: "https://www.archives.gov/milestone-documents/patent-for-cotton-gin",
    credit: "Patent drawing for Eli Whitney's cotton gin, 1794. National Archives, RG 241, National Archives Identifier 305886.",
    rights: "Public domain (U.S. Government record, 1794).",
  },

  // ── Nebraska homestead, 1863 ──────────────────────────────────────────────
  "nebraska-homestead-1863": {
    src: '/journey/nebraska-homestead-1863-then.jpg',
    year: 1886,
    alt: "The Rawding family before their Nebraska sod house, 1886",
    description: "Sylvester Rawding family in front of their sod house, Custer County, NE, 1886 (Solomon D. Butcher)",
    institution: "Library of Congress, Prints & Photographs Division (Butcher Collection)",
    sourceUrl: "https://www.loc.gov/item/2005693378/",
    credit: "Solomon D. Butcher, Rawding family sod house, Custer County, Nebraska, 1886. Library of Congress, Prints & Photographs Division, LC-DIG-ppmsca-08372.",
    rights: "Public domain (no known restrictions on publication).",
  },

  // ── Promontory / Transcontinental Railroad, 1869 ──────────────────────────
  "promontory-1869": {
    src: '/journey/promontory-1869-then.jpg',
    year: "c. 1866",
    alt: "Chinese railroad workers near the Summit Tunnel, c.1866",
    description: "'Laborers and rocks, near opening of Summit Tunnel' — Central Pacific crew, Alfred A. Hart, c.1866",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2005682913/",
    credit: "Alfred A. Hart, Laborers near the Summit Tunnel, c.1866. Library of Congress, Prints & Photographs Division.",
    rights: "Public domain (no known restrictions on publication).",
    note: "Deliberately the Chinese-laborers photo, not the golden-spike photo — the image IS the story.",
  },

  // ── Great Plains / Bison, 1880s ───────────────────────────────────────────
  "great-plains-bison-1880s": {
    src: '/journey/great-plains-bison-1880s-then.jpg',
    year: "c. 1871",
    alt: "Shooting buffalo from a train on the Kansas-Pacific Railroad",
    description: "'The far west — shooting buffalo on the line of the Kansas-Pacific Railroad'",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2004669992/",
    credit: "The far west — shooting buffalo on the line of the Kansas-Pacific Railroad. Library of Congress, Prints & Photographs Division, LC-USZ62-133890.",
    rights: "Public domain (no known restrictions on publication).",
    note: "Cleared LoC alternative chosen over the famous Detroit skull-pile photo, whose rights are not citably stated.",
  },

  // ── California Delta, 1882 ────────────────────────────────────────────────
  "california-delta-1882": {
    src: '/journey/california-delta-1882-then.jpg',
    year: "c. 1970s",
    alt: "The Chinese-built town of Locke in the Sacramento Delta",
    description: "Locke, Sacramento County, CA — Delta town built by Chinese immigrants (HABS)",
    institution: "Library of Congress, Prints & Photographs Division — HABS",
    sourceUrl: "https://www.loc.gov/resource/hhh.ca0469.photos",
    credit: "Historic American Buildings Survey, Locke, Sacramento County, California. Library of Congress, Prints & Photographs Division, HABS CA-2071.",
    rights: "Public domain (U.S. Government work — no known restrictions).",
    note: "Distinct from the Promontory image so the two stops never share a picture.",
  },

  // ── Mississippi Delta / Chinese community, 1870s ──────────────────────────
  "mississippi-delta-chinese-1870s": {
    src: '/journey/mississippi-delta-chinese-1870s-then.jpg',
    year: 1939,
    alt: "A Chinese-owned grocery in the Mississippi Delta, 1939",
    description: "Chinese grocer/merchant, Leland, Mississippi, Nov 1939 (Marion Post Wolcott, FSA)",
    institution: "Library of Congress, FSA/OWI Collection, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2017801700/",
    credit: "Marion Post Wolcott, FSA, Leland, Mississippi, 1939. Library of Congress, Prints & Photographs Division, FSA/OWI Collection, LC-USF34-052450-D.",
    rights: "Public domain (FSA/OWI; no known restrictions).",
  },

  // ── Nicodemus, 1877 ───────────────────────────────────────────────────────
  "nicodemus-1877": {
    src: '/journey/nicodemus-1877-then.jpg',
    year: "c. 1885",
    alt: "Washington Street, Nicodemus, Kansas, c.1885",
    description: "First Stone Church and Williams General Store, Nicodemus, c.1885 (HABS reproduction)",
    institution: "Library of Congress, Prints & Photographs Division — HABS",
    sourceUrl: "https://www.loc.gov/pictures/item/ks0077.photos.069504p/",
    credit: "Historic American Buildings Survey, Nicodemus Historic District, Graham County, Kansas. Library of Congress, Prints & Photographs Division, HABS KS-77.",
    rights: "HABS is U.S. Gov PD; underlying c.1885 photo PD by date. LoC caveat: copies of older sources may be restricted.",
    note: "For zero ambiguity, pair with NPS Nicodemus National Historic Site imagery.",
  },

  // ── Spindletop, 1901 ──────────────────────────────────────────────────────
  "spindletop-1901": {
    src: '/journey/spindletop-1901-then.jpg',
    year: 1901,
    alt: "The Lucas Gusher erupting at Spindletop, 1901",
    description: "Lucas gusher, Spindletop, Beaumont, Texas, c.1901",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2010649511/",
    credit: "Lucas gusher, Spindletop, Beaumont, Texas, c.1901. Library of Congress, Prints & Photographs Division, LC-USZ62-4716.",
    rights: "Public domain (no known restrictions on publication).",
  },

  // ── Yosemite, 1864 ────────────────────────────────────────────────────────
  "yosemite-1864": {
    src: '/journey/yosemite-1864-then.jpg',
    year: "c. 1865",
    alt: "Half Dome, Yosemite, photographed by Carleton Watkins, c.1865",
    description: "Half Dome, Yosemite — albumen print by Carleton E. Watkins, c.1865",
    institution: "Library of Congress, Prints & Photographs Division",
    repositoryName: "Library of Congress",
    repositoryUrl: "https://www.loc.gov/",
    repositoryType: "federal",
    sourceUrl: "https://www.loc.gov/item/95514294/",
    credit: "Carleton E. Watkins, Half Dome, Yosemite, c.1865. Library of Congress, Prints & Photographs Division.",
    rights: "Public domain (no known restrictions on publication).",
    note: "Watkins's 1860s Yosemite photographs helped win the 1864 protection campaign — the image is itself part of the story.",
  },

  // ── Barre granite quarries, 1880s ─────────────────────────────────────────
  "barre-granite-1880s": {
    src: '/journey/barre-granite-1880s-then.jpg',
    year: 1941,
    alt: "Granite quarry work in Barre, Vermont",
    description: "Barre, Vermont granite quarries, 1941 (Jack Delano, FSA) — the enduring industry",
    institution: "Library of Congress, FSA/OWI Collection, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2004678255/",
    credit: "Jack Delano, FSA, Barre, Vermont granite quarries, 1941. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
    rights: "Public domain (FSA/OWI; no known restrictions).",
    note: "Image is 1941 (industry continuation), not 1880s; an alt c.1908 Detroit Publishing quarry image exists (loc.gov/item/2016813993) if you prefer the earlier era.",
  },

  // ── Basque sheepherders, Boise, 1890s ─────────────────────────────────────
  "basque-boise-1890s": {
    src: '/journey/basque-boise-1890s-then.jpg',
    year: 1940,
    alt: "A Basque sheepherder in the Great Basin, 1940",
    description: "Basque sheepherder, Dangberg Ranch, Douglas County, Nevada, 1940 (Arthur Rothstein, FSA)",
    institution: "Library of Congress, FSA/OWI Collection, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2017774629/",
    credit: "Arthur Rothstein, FSA, Basque sheepherder, Douglas County, Nevada, 1940. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
    rights: "Public domain (FSA/OWI; no known restrictions).",
    note: "Explicitly captioned 'Basque' but located in Nevada (Great Basin region), not Idaho.",
  },

  // ── Greenwood / Tulsa, 1921 ───────────────────────────────────────────────
  "greenwood-tulsa-1921": {
    src: '/journey/greenwood-tulsa-1921-then.jpg',
    year: 1921,
    alt: "Ruins of the Greenwood district after the 1921 Tulsa Race Massacre",
    description: "Ruins after the race riots, Tulsa, Okla., June 1921 (American Red Cross)",
    institution: "Library of Congress, Prints & Photographs Division — American National Red Cross Collection",
    sourceUrl: "https://www.loc.gov/item/2017679760/",
    credit: "Ruins after the race riots, Tulsa, Okla., 1921. Library of Congress, Prints & Photographs Division, American National Red Cross Collection.",
    rights: "Public domain (no known restrictions on publication).",
    note: "Red Cross set chosen for explicit clearance over the rights-murky Krupnick-attributed images.",
  },

  // ── Dust Bowl, 1930s ──────────────────────────────────────────────────────
  "dust-bowl-1930s": {
    src: '/journey/dust-bowl-1930s-then.jpg',
    year: 1936,
    alt: "A farmer and his sons walking in a dust storm, Oklahoma, 1936",
    description: "Farmer and sons walking in the face of a dust storm, Cimarron County, OK, 1936 (Arthur Rothstein, FSA)",
    institution: "Library of Congress, FSA/OWI Collection, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/pictures/item/2017760335/",
    credit: "Arthur Rothstein, FSA, Cimarron County, Oklahoma, 1936. Library of Congress, Prints & Photographs Division, FSA/OWI Collection, LC-USF34-004052-E.",
    rights: "Public domain (FSA/OWI; no known restrictions).",
  },

  // ── Field Order No. 15, 1865 ──────────────────────────────────────────────
  "field-order-15-1865": {
    src: '/journey/field-order-15-1865-then.jpg',
    year: 1862,
    alt: "Freedpeople on a plantation near Beaufort, South Carolina, 1862",
    description: "View on Smith Plantation, near Beaufort, S.C., 1862 (Sea Islands / Port Royal)",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2015649007/",
    credit: "View on Smith Plantation, near Beaufort, S.C., 1862. Library of Congress, Prints & Photographs Division.",
    rights: "Public domain (no known restrictions on publication).",
  },

  // ════════════════════════════════════════════════════════════════════════
  // DE / PA Hidden Gems
  // ════════════════════════════════════════════════════════════════════════

  // ── Twelve-Mile Circle, Delaware ──────────────────────────────────────────
  "de-twelve-mile-circle": {
    src: '/journey/de-twelve-mile-circle-then.jpg',
    year: "c. 1930s",
    alt: "Old New Castle Courthouse, Delaware — origin of the Twelve-Mile Circle survey",
    description: "Old New Castle Courthouse, New Castle, DE (HABS DE-84)",
    institution: "Library of Congress, Prints & Photographs Division — HABS",
    sourceUrl: "https://www.loc.gov/item/de0084/",
    credit: "Historic American Buildings Survey, Library of Congress, Prints & Photographs Division, HABS DE-84.",
    rights: "Public domain (U.S. Government work — no known restrictions).",
    note: "The courthouse is the survey origin of Delaware's unique circular border. The image IS the story.",
  },

  // ── The Wedge, Delaware ───────────────────────────────────────────────────
  "de-the-wedge": {
    src: '/journey/de-the-wedge-then.jpg',
    year: 1768,
    alt: "1768 Mason–Dixon boundary plan showing the survey junction that created the Wedge",
    description: "Plan of the boundary lines between Maryland, Pennsylvania, and Delaware, 1768 (Mason & Dixon)",
    institution: "Library of Congress, Geography and Map Division",
    sourceUrl: "https://www.loc.gov/resource/g3841f.ct002075/",
    credit: "Charles Mason & Jeremiah Dixon, 1768. Library of Congress, Geography and Map Division.",
    rights: "Public domain by date (1768).",
    note: "Primary-source map showing the junction that left the Wedge unclaimed. Image IS the primary source.",
  },

  // ── Zwaanendael / Lewes, Delaware ────────────────────────────────────────
  // No clean 1631-era engraving confirmed. Commission or find a pre-1929 book plate.
  "de-zwaanendael-lewes": {
    src: null,
    needsConfirmation: true,
    alt: "Illustration of the 1631 Dutch settlement at Zwaanendael (Lewes, Delaware)",
    description: "No clean 1631-era engraving confirmed. Commission a period-appropriate illustration or find a pre-1929 published plate with full citation.",
    institution: "Commission / illustration needed",
    sourceUrl: "",
    credit: "Commission pending.",
    rights: "No clean PD then-image confirmed. Commission required. Do not pull from stock without verified rights.",
    note: "Zwaanendael was 1631 — pre-photography. Need either a pre-1929 published book illustration (cite volume + page) or commissioned art.",
  },

  // ── Pithole, Pennsylvania ─────────────────────────────────────────────────
  "pa-pithole": {
    src: '/journey/pa-pithole-then.jpg',
    year: "c. 1870s",
    alt: "The United States Well at Pithole, Pennsylvania, struck 1865 — stereograph c.1870s",
    description: "The United States Well at Pithole, Venango County, PA, c.1870s (Frank Robbins stereograph)",
    institution: "Library of Congress, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2008679000/",
    credit: "Frank Robbins, Oil City, PA. Library of Congress, Prints & Photographs Division.",
    rights: "Public domain (no known restrictions).",
    note: "The John Mather 1865 street-view images are held by Drake Well Museum — museum license, not open. This LoC stereograph is the clean alternative.",
  },

  // ── York, Pennsylvania (Continental Congress capital) ─────────────────────
  "pa-york-capital": {
    src: '/journey/pa-york-capital-then.jpg',
    year: 1914,
    alt: "Congress Hall at York, Pennsylvania — plate from Prowell 1914",
    description: "Illustration from G. R. Prowell, The Continental Congress at York, Pennsylvania (1914)",
    institution: "Library of Congress (digitized via Internet Archive)",
    sourceUrl: "https://www.loc.gov/resource/gdcmassbookdig.continentalcongr00prow/",
    credit: "G. R. Prowell, The Continental Congress at York, Pennsylvania and Its Work, 1914. Library of Congress.",
    rights: "Public domain by date (1914 publication, pre-1929).",
    note: "Cite the specific plate number when captioning if identifiable from the scan.",
  },

  // ── Centralia, Pennsylvania ───────────────────────────────────────────────
  // THEN sourcing research — Build 55:
  //
  //   DeKok archive (most dramatic early-fire shots, 1962–1980s): licensed, NOT PD.
  //
  //   USGS Fact Sheet 2009-3084 (pubs.usgs.gov/fs/2009/3084/) was checked:
  //     Figure 1 (cracked road + steam/smoke) → "Photograph by Janet Stracher"
  //       Individual copyright holder — NOT a U.S. Government work, NOT PD-USGov.
  //     Figure 3 (thermal aerial) → "Airborne Research Consultants, LLC. 2009"
  //       Commercial company — NOT PD-USGov.
  //     Figure 2 (temperature distribution map) → USGS-authored scientific figure
  //       PD-USGov, but a data visualization, not a compelling historical photo.
  //   Result: no usable photo from this fact sheet.
  //
  //   No other federal (LoC, NARA, OSMRE, EPA) Centralia mine-fire photographs
  //   found with confirmed PD-USGov status.
  //
  //   Resolution: commission original photography, or pay for a DeKok license.
  "pa-centralia": {
    src: null,
    needsConfirmation: true,
    alt: "Centralia, Pennsylvania — the underground mine fire",
    description: "Commission pending. No confirmed PD-USGov then-image. See note for full sourcing record.",
    institution: "Commission / license required",
    sourceUrl: "https://pubs.usgs.gov/fs/2009/3084/",
    credit: "Commission pending — do not publish without rights confirmation.",
    rights: "No PD-USGov photo confirmed. DeKok archive = paid license. USGS Fact Sheet photos credited to Janet Stracher (individual ©) and Airborne Research Consultants LLC (commercial ©) — neither is PD-USGov.",
    note: "USGS Fact Sheet 2009-3084 Figure 1 (the cracked road with steam) is 'Photograph by Janet Stracher', not a government work. Figure 3 is Airborne Research Consultants LLC 2009. Commission or pay DeKok license for launch with a THEN image.",
  },

  // ── Great Migration, 1916–1970 ────────────────────────────────────────────
  "great-migration-1916-1970": {
    src: '/journey/great-migration-1916-1970-then.jpg',
    year: 1941,
    alt: "Kitchenette apartments rented to Black migrants, Chicago South Side, 1941",
    description: "Kitchenette apartments on South Parkway, Chicago, 1941 (Russell Lee, FSA)",
    institution: "Library of Congress, FSA/OWI Collection, Prints & Photographs Division",
    sourceUrl: "https://www.loc.gov/item/2017789060/",
    credit: "Russell Lee, FSA, South Parkway, Chicago, Illinois, 1941. Library of Congress, Prints & Photographs Division, FSA/OWI Collection.",
    rights: "Public domain (FSA/OWI; no known restrictions). AVOID the Jacob Lawrence Migration Series (copyrighted).",
  },

};
