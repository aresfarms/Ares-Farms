/**
 * residentialGardenGuide — the residential lane's use of the parcel's soil
 * intelligence (founder direction 2026-07-29: "add in garden plants that
 * would grow well in their individual yards along with native plants for
 * the area" — the residential counterpart of the farm lane's best-use
 * engine, on the same live SSURGO soil profile).
 *
 * Deterministic, curated, and honest: garden guidance keys off the actual
 * drainage class and soil texture under the address; native-plant lists are
 * curated by broad region from state code. Screening guidance only — the
 * county extension office (free soil tests, region-exact plant lists) stays
 * the named next step, and nothing here is a landscaping prescription.
 *
 * Master Volume Governance: deterministic + versioned (no model calls, no
 * randomness); provenance carried in the rendered copy (USDA-NRCS soil
 * survey; curated regional lists).
 */

export interface GardenGuideSoil {
  mapUnitName: string | null;
  farmlandClass: string | null;
  drainageClass: string | null;
  slopePct: number | null;
  capabilityClass: number | null;
}

export interface GardenPick {
  name: string;
  why: string;
}

export interface ResidentialGardenGuide {
  headline: string;
  /** How to garden on THIS soil — bed style, amendments, watering posture. */
  soilNotes: string[];
  /** Edibles and garden plants matched to the soil's drainage/texture. */
  gardenPicks: GardenPick[];
  /** Region-native plants — low-input, pollinator-supporting, climate-fit. */
  nativePicks: GardenPick[];
  /** The honest boundary + free next step. */
  boundary: string;
}

type Region =
  | "northeast"
  | "mid-atlantic"
  | "southeast"
  | "midwest"
  | "plains"
  | "mountain-west"
  | "southwest"
  | "pacific-northwest"
  | "california"
  | "national";

const STATE_REGION: Record<string, Region> = {
  ME: "northeast", NH: "northeast", VT: "northeast", MA: "northeast",
  RI: "northeast", CT: "northeast", NY: "northeast", NJ: "northeast",
  PA: "northeast",
  DE: "mid-atlantic", MD: "mid-atlantic", VA: "mid-atlantic",
  WV: "mid-atlantic", DC: "mid-atlantic",
  NC: "southeast", SC: "southeast", GA: "southeast", FL: "southeast",
  AL: "southeast", MS: "southeast", TN: "southeast", KY: "southeast",
  LA: "southeast", AR: "southeast", PR: "southeast",
  OH: "midwest", IN: "midwest", IL: "midwest", MI: "midwest",
  WI: "midwest", MN: "midwest", IA: "midwest", MO: "midwest",
  ND: "plains", SD: "plains", NE: "plains", KS: "plains",
  OK: "plains", TX: "plains",
  MT: "mountain-west", ID: "mountain-west", WY: "mountain-west",
  CO: "mountain-west", UT: "mountain-west", NV: "mountain-west",
  AZ: "southwest", NM: "southwest",
  WA: "pacific-northwest", OR: "pacific-northwest", AK: "pacific-northwest",
  CA: "california", HI: "national",
};

/** Curated, widely recommended natives per region — deliberately common,
    nursery-available species, not a botanical inventory. */
const REGION_NATIVES: Record<Region, GardenPick[]> = {
  "northeast": [
    { name: "Eastern redbud", why: "Small native flowering tree; early-spring bloom for pollinators." },
    { name: "New England aster", why: "Late-season nectar; thrives in average yard soil." },
    { name: "Butterfly milkweed", why: "Monarch host plant; wants sun and drier ground." },
    { name: "Black-eyed Susan", why: "Reliable native perennial for nearly any sunny bed." },
    { name: "Highbush blueberry", why: "Native, edible, and ornamental — needs acidic soil." },
    { name: "Winterberry holly", why: "Tolerates wet spots; winter berries feed birds." },
  ],
  "mid-atlantic": [
    { name: "Eastern redbud", why: "Small native flowering tree; early-spring pollinator bloom." },
    { name: "Flowering dogwood", why: "The region's signature native understory tree." },
    { name: "Black-eyed Susan", why: "Reliable native perennial for nearly any sunny bed." },
    { name: "Butterfly milkweed", why: "Monarch host plant; happy in sandy, well-drained ground." },
    { name: "Joe-Pye weed", why: "Tall late-summer nectar plant; tolerates damp soil." },
    { name: "Inkberry holly", why: "Native evergreen shrub; handles poorly drained spots." },
    { name: "Switchgrass", why: "Native grass for structure; tolerates sand and wet feet alike." },
  ],
  "southeast": [
    { name: "Oakleaf hydrangea", why: "Showy native shrub for part shade." },
    { name: "American beautyberry", why: "Purple fall berries; easy in most yard soils." },
    { name: "Coral honeysuckle", why: "Native vine hummingbirds work all season." },
    { name: "Muhly grass", why: "Pink fall plumes; thrives in sandy, droughty ground." },
    { name: "Yaupon holly", why: "Tough native evergreen; wet or dry, sun or shade." },
    { name: "Black-eyed Susan", why: "Dependable native color for sunny beds." },
  ],
  "midwest": [
    { name: "Purple coneflower", why: "Prairie native; long bloom, drought-tough once established." },
    { name: "Wild bergamot (bee balm)", why: "Pollinator magnet for average-to-dry soil." },
    { name: "Butterfly milkweed", why: "Monarch host plant for sunny, drier ground." },
    { name: "Little bluestem", why: "Native prairie grass; excellent on poor or sandy soil." },
    { name: "Serviceberry", why: "Small native tree — spring bloom, edible June berries." },
    { name: "Prairie dropseed", why: "Tidy native grass for bed edges." },
  ],
  "plains": [
    { name: "Little bluestem", why: "Signature prairie grass; thrives on lean, dry ground." },
    { name: "Blanketflower", why: "Long-blooming native for hot, sunny, well-drained spots." },
    { name: "Purple prairie clover", why: "Native legume — feeds pollinators and the soil." },
    { name: "Mexican hat coneflower", why: "Tough prairie native; shrugs off drought." },
    { name: "Bur oak", why: "The Plains' anchor shade tree where there's room." },
  ],
  "mountain-west": [
    { name: "Rocky Mountain penstemon", why: "Showy native spikes; wants gritty, well-drained soil." },
    { name: "Blue flax", why: "Airy native perennial for dry, sunny ground." },
    { name: "Serviceberry", why: "Native shrub/small tree — bloom, berries, fall color." },
    { name: "Blanketflower", why: "Drought-tough native color all summer." },
    { name: "Rubber rabbitbrush", why: "Late-season gold bloom; thrives on poor dry soil." },
  ],
  "southwest": [
    { name: "Desert willow", why: "Small native tree with orchid-like summer bloom." },
    { name: "Desert marigold", why: "Nearly year-round native color on minimal water." },
    { name: "Globemallow", why: "Tough native perennial; pollinators love it." },
    { name: "Firecracker penstemon", why: "Hummingbird native for gravelly, well-drained ground." },
    { name: "Agave", why: "Sculptural native; no irrigation once established." },
  ],
  "pacific-northwest": [
    { name: "Red-flowering currant", why: "Early native bloom hummingbirds depend on." },
    { name: "Oregon grape", why: "Native evergreen; handles dry shade under conifers." },
    { name: "Salal", why: "The region's workhorse native groundcover shrub." },
    { name: "Western sword fern", why: "Evergreen native for shade and woodland edges." },
    { name: "Douglas aster", why: "Late-season native nectar for sunny spots." },
  ],
  "california": [
    { name: "California poppy", why: "The state flower — self-sows on dry, sunny ground." },
    { name: "Ceanothus (California lilac)", why: "Blue spring bloom; no summer water once established." },
    { name: "Toyon", why: "Native evergreen with winter berries for birds." },
    { name: "Manzanita", why: "Sculptural native shrub for well-drained slopes." },
    { name: "Common yarrow", why: "Tough native perennial; takes heat and lean soil." },
  ],
  "national": [
    { name: "Black-eyed Susan", why: "Native across most of the U.S.; reliable sunny-bed color." },
    { name: "Butterfly milkweed", why: "Monarch host plant native to most of the country." },
    { name: "Purple coneflower", why: "Widely native, widely available, pollinator-loved." },
    { name: "Local natives via your extension office", why: "The county extension office keeps the region-exact native list — the free authoritative source." },
  ],
};

type SoilShape = "droughty-sand" | "wet" | "sloped" | "loam";

function classifySoilShape(soil: GardenGuideSoil | null): SoilShape {
  if (!soil) return "loam";
  const drainage = (soil.drainageClass ?? "").toLowerCase();
  const name = (soil.mapUnitName ?? "").toLowerCase();
  if (/poorly drained/.test(drainage)) return "wet"; // covers "somewhat poorly" and "very poorly"
  if ((soil.slopePct ?? 0) >= 15) return "sloped";
  if (/excessively drained/.test(drainage) || /\bsand\b|loamy sand|sandy/.test(name)) return "droughty-sand";
  return "loam";
}

const SHAPE_SOIL_NOTES: Record<SoilShape, string[]> = {
  "droughty-sand": [
    "Sandy, fast-draining ground: water runs through before roots finish drinking. Work in 2–3 inches of compost each season and favor drip irrigation or soaker hoses over sprinklers.",
    "The upside of sand: root crops (carrots, radishes), Mediterranean herbs, and bulbs grow beautifully with far less rot risk.",
  ],
  "wet": [
    "This ground drains slowly — the classic fix is raised beds (10–12 inches) for vegetables, which lift roots out of the saturated zone entirely.",
    "Work with the moisture instead of fighting it: the wettest corner of the yard is a rain-garden opportunity, and several natives below thrive exactly there.",
  ],
  "sloped": [
    "On a noticeable slope, terraced or contour beds hold water and soil where roots can use them; deep-rooted natives below double as erosion control.",
  ],
  "loam": [
    "Workable, moderately drained ground — the widest menu: most vegetables, berries, and perennials establish well with a yearly inch or two of compost.",
  ],
};

const SHAPE_GARDEN_PICKS: Record<SoilShape, GardenPick[]> = {
  "droughty-sand": [
    { name: "Tomatoes & peppers", why: "Heat-lovers that hate wet feet — sand suits them with compost and drip water." },
    { name: "Carrots & radishes", why: "Root crops grow straight and clean in sandy ground." },
    { name: "Rosemary, thyme, lavender", why: "Mediterranean herbs that want exactly this drainage." },
    { name: "Melons & sweet potatoes", why: "Sprawlers that ripen well on warm, fast-draining soil." },
  ],
  "wet": [
    { name: "Raised-bed vegetables", why: "Tomatoes, greens, beans — nearly anything works once lifted into a raised bed." },
    { name: "Elderberry", why: "Native edible shrub that tolerates genuinely damp ground." },
    { name: "Blueberries (mounded)", why: "Planted on mounds or in beds, they like consistent moisture without standing water." },
    { name: "Mint & watercress (contained)", why: "Moisture-loving edibles — keep mint in a pot or it will take the yard." },
  ],
  "sloped": [
    { name: "Terraced herb beds", why: "Herbs take shallow terraces well and stabilize the cut." },
    { name: "Fruit trees on contour", why: "Planted on the contour with basins, trees catch and hold runoff." },
    { name: "Groundcover berries", why: "Creeping thyme or lowbush blueberry knit slopes together." },
  ],
  "loam": [
    { name: "Tomatoes, beans, squash, greens", why: "The core kitchen garden — this soil supports all of it." },
    { name: "Berries (blueberry, raspberry)", why: "Establish well in workable loam; blueberries want the soil acidified." },
    { name: "Fruit trees (apple, pear, fig by region)", why: "Loam with decent drainage is exactly what a young orchard tree wants." },
    { name: "Cut-flower bed (zinnias, sunflowers, dahlias)", why: "Easy annual color that thrives in garden loam." },
  ],
};

export function buildResidentialGardenGuide(args: {
  state: string | null;
  soil: GardenGuideSoil | null;
}): ResidentialGardenGuide {
  const region = STATE_REGION[(args.state ?? "").toUpperCase()] ?? "national";
  const shape = classifySoilShape(args.soil);
  const soilName = args.soil?.mapUnitName ?? null;
  const drainage = args.soil?.drainageClass ?? null;

  const headline = soilName
    ? `The soil survey maps this yard as ${soilName}${drainage ? ` (${drainage.toLowerCase()})` : ""} — the garden guidance below is matched to that ground, and the native list to this region.`
    : `Soil detail for this exact point hasn't resolved, so the garden guidance below is general — the native-plant list is still matched to this region, and a $10–$20 extension-office soil test replaces guesswork with numbers.`;

  return {
    headline,
    soilNotes: SHAPE_SOIL_NOTES[shape],
    gardenPicks: SHAPE_GARDEN_PICKS[shape],
    nativePicks: REGION_NATIVES[region],
    boundary:
      "Screening guidance from the USDA-NRCS soil survey and curated regional plant lists — not a landscaping plan or a guarantee anything thrives. Sun, microclimate, deer, and HOA rules still control. The county extension office runs inexpensive soil tests and keeps the region-exact native and variety lists — the free first call before buying plants.",
  };
}
