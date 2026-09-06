/**
 * farmAnswerEngine — answers the farm-lane "questions farmers actually ask" FOR
 * THE SPECIFIC PROPERTY (founder direction 2026-07-19: the analysis must answer
 * these per-property, or say honestly WHY it can't — too small, we can't see
 * zoning, confirm at X). The lane PAGE keeps its generic educational cards; this
 * engine adds the property-specific layer inside the analysis + PDF.
 *
 * Data we reason from: verified acreage when available, county/state context,
 * USDA NASS rents/yields, NRCS soil facts, and exact jurisdiction/zoning
 * interpretation only where Furlong has a source-cited rule. Missing zoning,
 * market/offtake, water or other controlling evidence remains explicit instead
 * of being guessed. Facts and enterprise economics only; never an appraisal,
 * eligibility finding, or credit decision.
 */

export const FARM_USE_INTEGRITY_VERSION = "farm-use-integrity-v1.0.0" as const;

export interface FarmPropertyFacts {
  /** Parcel acreage in acres, when the source feed carries it (often null). */
  acres: number | null;
  county: string | null;
  state: string | null;
  /** County-average cropland cash rent, $/acre/yr (USDA NASS), when resolved. */
  croplandRentPerAcre: number | null;
  pastureRentPerAcre: number | null;
  /** State average farm real-estate value, $/acre (USDA), when resolved. */
  stateFarmlandPerAcre: number | null;
  /** Straight-line miles to the nearest MAJOR (metro) airport — a proxy for
      metro/market proximity, which drives direct-market specialty, agritourism,
      and developer interest. Null when unresolved. */
  nearestMetroMiles?: number | null;
  /** USDA-NRCS SSURGO dominant-soil facts (public), when resolved. */
  primeFarmland?: string | null; // e.g. "All areas are prime farmland" | "Not prime farmland"
  /** Non-irrigated land-capability class 1–8 (1–4 = arable cropland; 5–8 = pasture/limited). */
  capabilityClass?: number | null;
  /** NRCS drainage class, e.g. "Well drained" | "Poorly drained" — steers
      orchard/vineyard (need drainage) vs hay/pasture (tolerate wet ground). */
  drainageClass?: string | null;
  /** USDA plant-hardiness zone, e.g. "7b". */
  hardinessZone?: string | null;
  /** County-average crop yields, bu/acre (USDA NASS Survey), when resolved — a
      productivity benchmark for the parcel's county, never a parcel guarantee. */
  cornYieldPerAcre?: number | null;
  soybeanYieldPerAcre?: number | null;
  wheatYieldPerAcre?: number | null;
  /** Survey year the county yields are drawn from. */
  yieldYear?: number | null;
  /** Parcel-record land use and zoning. Zoning semantics are attached only when
      Furlong has an exact, source-cited jurisdiction interpretation. */
  landUse?: string | null;
  zoningCode?: string | null;
  zoningLabel?: string | null;
  zoningSummary?: string | null;
  zoningSource?: string | null;
  zoningSourceUrl?: string | null;
  propertyWideCandidates?: string[];
  developmentNote?: string | null;
  energyNote?: string | null;
  publicWater?: boolean | null;
  publicSewer?: boolean | null;
}

export interface BestUseOption {
  name: string;
  /** This is an AGRICULTURAL enterprise screen, not a property-wide HBU verdict. */
  tier: "leading-screen" | "strong" | "possible" | "marginal" | "needs-evidence";
  /** Kept for payload compatibility. The text itself states gross/net/unpriced. */
  grossPerAcre: string;
  economicsBasis: "gross" | "net" | "mixed" | "unpriced";
  why: string;
}

export interface FarmBestUse {
  /** Explicit scope prevents a crop ranking from masquerading as highest-and-best use. */
  scope: "agricultural-enterprise-screen";
  evidenceStatus: "insufficient" | "screening" | "supported-screen";
  missingCriticalInputs: string[];
  headline: string;
  options: BestUseOption[];
  propertyWideContext: {
    currentUse: string | null;
    zoning: string | null;
    zoningSummary: string | null;
    source: string | null;
    sourceUrl: string | null;
    candidates: string[];
    note: string;
  };
  /** Single-enterprise vs diversified AGRICULTURAL screen only. */
  portfolioAdvice: {
    verdict: "single-anchor" | "diversify" | "not-yet-ranked";
    title: string;
    reasons: string[];
  };
}

export interface FarmPropertyAnswer {
  id: string;
  /** Property-specific answer — leads with what we can say about THIS parcel. */
  propertyAnswer: string;
  /** Honest "we can't see X — confirm at Y" note when parcel data is missing. */
  confirm: string | null;
}

const CONFIRM_ZONING =
  "We cannot see this parcel's zoning, water rights, or soil map — confirm ag use is permitted (county zoning), that you have adequate water, and pull the NRCS Web Soil Survey before committing.";

function acreLabel(county: string | null, state: string | null): string {
  // County names from the FIPS table already end in "County"/"Parish" etc. —
  // only append when the name is bare (fixes "Sussex County County").
  const countyLabel = county && county !== "Unknown"
    ? (/\b(county|parish|borough|census area|municipality|city)\b/i.test(county) ? county : `${county} County`)
    : null;
  const where = [countyLabel, state].filter(Boolean).join(", ");
  return where ? ` in ${where}` : "";
}

/** Answer every enterprise question for this parcel. Deterministic + pure. */
export function answerFarmQuestions(f: FarmPropertyFacts): FarmPropertyAnswer[] {
  const a = f.acres;
  const where = acreLabel(f.county, f.state);
  const acresKnown = typeof a === "number" && a > 0;
  const acreText = acresKnown ? `~${a!.toLocaleString("en-US")} acres` : "an unconfirmed acreage";
  const out: FarmPropertyAnswer[] = [];

  // Which enterprises fit THIS parcel's size — the spine most answers lean on.
  const sizeFit = (() => {
    if (!acresKnown) return null;
    if (a! < 2) return "well under the ~2 acres even intensive produce/flowers need — this reads as a homestead or specialty micro-plot, not a working farm";
    if (a! <= 10) return "in the intensive range: cut flowers, market produce, or eggs can support a household here IF the sales channel exists — too small for pasture livestock at scale or row crops";
    if (a! <= 30) return "a small mixed parcel: intensive produce plus a few head of livestock or hay — below the 30–100 acres pastured livestock with direct sales usually wants";
    if (a! <= 100) return "in the pastured-livestock / diversified range (30–100 acres) — direct-sale beef, sheep/goats, or hay fit; still well below row-crop scale";
    if (a! <= 500) return "a mid-size parcel: hay, livestock, or a rented-acre row-crop base — most row-crop operations rent more ground to reach a full living";
    return "at row-crop scale (500+ acres) where conventional grain can pay a living — though most operations still rent additional ground";
  })();

  out.push({
    id: "acreage",
    propertyAnswer: acresKnown
      ? `This parcel is ${acreText}${where}, which is ${sizeFit}.`
      : `We don't have a confirmed acreage for this parcel${where}, so the honest answer is size-dependent: 2–10 acres suits intensive produce/flowers, 30–100 pastured livestock, 500+ conventional row crops. Pull the exact acreage first, then match the enterprise to it.`,
    confirm: acresKnown ? null : "Confirm the parcel's acreage on the county parcel/GIS viewer (linked in the brief's unknowns).",
  });

  out.push({
    id: "livestock",
    propertyAnswer: acresKnown
      ? a! < 5
        ? `At ~1.5–2 acres per cow-calf pair, ${acreText} supports maybe 1–2 pairs — better suited to sheep, goats, or pastured poultry than a cattle herd. Fencing and water are the real startup cost.`
        : `At ~1.5–2 acres per cow-calf pair on decent Eastern pasture, ${acreText} carries roughly ${Math.max(1, Math.floor(a! / 1.75))} pairs (fewer on poor or dry ground, more with rotational grazing); sheep/goats run ~5–7 head per cow-equivalent. Budget fencing + water before the first animal.`
      : `Cattle math is ~1.5–2 acres per cow-calf pair on decent pasture (far more on dry range) — so the stocking here depends entirely on the acreage and pasture quality. Sheep/goats suit smaller parcels.`,
    confirm: CONFIRM_ZONING,
  });

  out.push({
    id: "flowers",
    propertyAnswer: acresKnown
      ? a! <= 10
        ? `Cut flowers pencil on 2–10 acres, so ${acreText}${where} is a genuine fit on size — extension budgets show $25,000–$35,000 gross/acre at intensive scale. The crop is the easy part; the selling (florists, weddings, markets, subscriptions) is the job, and a cooler is the big startup cost.`
        : `Cut flowers pencil on just 2–10 intensively-worked acres, so on ${acreText} you'd farm only a fraction for flowers and use the rest otherwise. Profit is about the sales channel, not the acres.`
      : `Cut flowers are viable on very little land (2–10 acres) with strong marketing — so this parcel's size is rarely the limit; the sales channel is. Confirm the acreage and, more importantly, whether florists/markets are reachable.`,
    confirm: CONFIRM_ZONING,
  });

  out.push({
    id: "equestrian",
    propertyAnswer: acresKnown
      ? a! < 5
        ? `${acreText} is tight for horses kept on pasture (a rough rule is ~2 acres of grazing per horse) — workable as a small boarding/lesson facility on dry lots with bought-in hay, but plan the manure and turnout carefully.`
        : `At a rough ~2 acres of grazing per horse, ${acreText} could turn out roughly ${Math.max(1, Math.floor(a! / 2))} horses on pasture — boarding commonly bills $300–$800/horse/month. Facility capital (safe fencing, barn, water to paddocks, maybe an arena) and equine liability insurance are the real gates.`
      : `Horse stocking runs roughly ~2 acres of grazing per horse — so acreage sets the ceiling. Boarding bills $300–$800/horse/month, but liability insurance and facility capital are the real hurdles.`,
    confirm: CONFIRM_ZONING,
  });

  out.push({
    id: "diversified",
    propertyAnswer: acresKnown
      ? `On ${acreText}${where}, a workable diversified stack is: ${
          a! <= 10
            ? "one intensive cash acre (produce/flowers/eggs) as the anchor, plus a small livestock or agritourism line — three to five enterprises is the sweet spot even at this size"
            : a! <= 100
              ? "a hay or grazing base, a livestock enterprise on the ground that shouldn't be tilled, one high-value intensive acre for weekly cash, and one off-farm/agritourism line"
              : "a row-crop or hay base for the acreage, livestock on marginal ground, one intensive high-value acre, and an agritourism or off-farm income line"
        }. Each enterprise needs its own budget; cut the ones that can't show a path to profit.`
      : `The classic structure stacks 3–5 enterprises so cash arrives in different seasons — a crop/hay base, livestock on un-tillable ground, one intensive cash acre, and an off-farm line. The mix depends on this parcel's acreage.`,
    confirm: null,
  });

  // Expansion / rent — grounded in the ACTUAL county cash rent when we have it.
  out.push({
    id: "expansion-rent",
    propertyAnswer:
      f.croplandRentPerAcre != null
        ? `Cropland cash rent${where} runs about $${f.croplandRentPerAcre.toLocaleString("en-US")}/acre/yr (USDA NASS)${
            f.pastureRentPerAcre != null ? `, pasture ~$${f.pastureRentPerAcre.toLocaleString("en-US")}/acre` : ""
          } — a fair lease negotiation starts there, adjusted for this parcel's soils, drainage, and access. The discipline: a rented acre that won't clear that rent in a normal year isn't expansion, it's a hobby.`
        : `Renting is how most acreage moves; a fair rent starts from the county's USDA cash-rent average${where} (not yet resolved for this county) plus the parcel's real soils and access. Flexible-rent leases split weather risk — worth proposing in writing.`,
    confirm: null,
  });

  // County productivity — grounded in the ACTUAL USDA county yield when we have it.
  // A benchmark to underwrite against, never a parcel guarantee.
  const yieldParts = [
    f.cornYieldPerAcre != null ? `corn ~${f.cornYieldPerAcre.toLocaleString("en-US")} bu/ac` : null,
    f.soybeanYieldPerAcre != null ? `soybeans ~${f.soybeanYieldPerAcre.toLocaleString("en-US")} bu/ac` : null,
    f.wheatYieldPerAcre != null ? `wheat ~${f.wheatYieldPerAcre.toLocaleString("en-US")} bu/ac` : null,
  ].filter(Boolean);
  if (yieldParts.length > 0) {
    out.push({
      id: "productivity",
      propertyAnswer: `Row-crop ground${where} averages ${yieldParts.join(", ")} (USDA NASS${
        f.yieldYear ? ` ${f.yieldYear}` : ""
      } county average). Your parcel's real number swings with its own soils, drainage, and management — but that county figure is the benchmark to underwrite any commodity or cash-rent math against, not a promise for this ground.`,
      confirm:
        "County averages blend every farm in the county. Pull this parcel's soils on the NRCS Web Soil Survey to see whether it runs above or below that benchmark.",
    });
  }

  out.push({
    id: "usda-number",
    propertyAnswer: `Yes — if you'll operate this as a farm, get a USDA farm number: it's free, it does NOT dictate what you grow, and it's the key to FSA loans, disaster programs, and most USDA cost-share. Take a deed or lease for this parcel to your ${
      f.county && f.county !== "Unknown" ? `${f.county} County` : "local"
    } USDA Service Center (FSA) and ask them to establish farm and tract numbers. You can absolutely farm without one — you just can't access the programs.`,
    confirm: null,
  });

  return out;
}

/**
 * Agricultural enterprise screen for this parcel.
 *
 * IMPORTANT: this is deliberately NOT a property-wide highest-and-best-use
 * conclusion. Current county use classification is not the same thing as best
 * economic use, and crop suitability is only one branch of land feasibility.
 * Property-wide alternatives (development, agritourism, energy/storage,
 * conservation, etc.) must be tested through zoning, infrastructure,
 * entitlement and market evidence before Furlong names a highest/best use.
 */
export function farmBestUse(f: FarmPropertyFacts): FarmBestUse {
  const a = f.acres;
  const acresKnown = typeof a === "number" && Number.isFinite(a) && a > 0;
  const small = acresKnown && a! < 30;
  const mid = acresKnown && a! >= 30 && a! <= 120;
  const midsize = acresKnown && a! > 120 && a! < 500;
  const commodityScale = acresKnown && a! >= 500;

  const m = f.nearestMetroMiles ?? null;
  const marketKnown = m != null && Number.isFinite(m);
  const metroNear = marketKnown && m! <= 40;
  const metroMid = marketKnown && m! <= 90;

  const rent = f.croplandRentPerAcre;
  const goodCropland = rent != null && rent >= 180;
  const poorCropland = rent != null && rent < 130;
  const cap = f.capabilityClass ?? null;
  const isPrime = /prime farmland/i.test(f.primeFarmland ?? "") && !/not prime/i.test(f.primeFarmland ?? "");
  const soilKnown = Boolean(f.primeFarmland) || cap != null;
  const goodSoil = isPrime || (cap != null && cap <= 3);
  const limitedSoil = cap != null && cap >= 5;

  const cornY = f.cornYieldPerAcre ?? null;
  const soyY = f.soybeanYieldPerAcre ?? null;
  const strongYield = cornY != null ? cornY >= 175 : soyY != null ? soyY >= 58 : false;
  const goodYield = cornY != null ? cornY >= 150 : soyY != null ? soyY >= 50 : false;
  const weakYield = cornY != null ? cornY < 120 : soyY != null ? soyY < 38 : false;
  const countyEconomicsKnown = rent != null || cornY != null || soyY != null || f.wheatYieldPerAcre != null;
  const where = acreLabel(f.county, f.state).replace(/^ in /, "");

  const missingCriticalInputs = [
    !acresKnown ? "verified acreage" : null,
    !soilKnown ? "parcel soil/capability evidence" : null,
    !countyEconomicsKnown ? "county production/rent benchmark" : null,
    !marketKnown ? "verified market/offtake access" : null,
    !f.zoningCode ? "zoning code and current use-table interpretation" : null,
  ].filter((x): x is string => Boolean(x));

  const rowScaleAdjustment = !acresKnown
    ? -24
    : commodityScale
      ? 28
      : a! >= 250
        ? 8
        : midsize
          ? -8
          : mid
            ? -26
            : -38;

  type Candidate = {
    name: string;
    score: number;
    grossPerAcre: string;
    economicsBasis: BestUseOption["economicsBasis"];
    why: string;
    marketSensitive?: boolean;
    evidenceSensitive?: boolean;
  };

  const raw: Candidate[] = [
    {
      name: "Hay / forage / alfalfa",
      score: 52 + (mid ? 19 : midsize ? 12 : commodityScale ? 4 : small ? 2 : 0) + (goodSoil ? 8 : 0) + (poorCropland ? 5 : 0),
      grossPerAcre: "Gross and net vary sharply by hay type, yield, bale format, storage and seasonal market - model this parcel before relying on a number",
      economicsBasis: "mixed",
      why:
        acresKnown && a! <= 120
          ? `${a!.toLocaleString("en-US", { maximumFractionDigits: 1 })} acres is a workable forage/hay scale; soil, drainage, yield, storage and the local horse/livestock market determine whether premium hay beats commodity production`
          : "forage and hay can monetize agricultural ground without requiring commodity-grain scale, but the actual bale/yield/market model controls",
    },
    {
      name: "Pasture livestock (cattle, sheep, goats)",
      score: 50 + (mid ? 18 : midsize ? 12 : commodityScale ? 6 : 0) + (poorCropland ? 10 : 0) + (limitedSoil ? 12 : 0) - (small ? 15 : 0),
      grossPerAcre: "Net/acre depends on stocking rate, fencing, water, winter feed, animal class and direct-sale versus commodity marketing",
      economicsBasis: "net",
      why: limitedSoil
        ? `class ${cap} ground that will not pay as cropland can screen better under managed grazing`
        : mid
          ? "this acreage is in the diversified pasture/livestock range; fencing, water and market strategy control the real result"
          : "a lower-intensity agricultural use whose economics turn on stocking rate, infrastructure and market channel",
    },
    {
      name: "Specialty crops / cut flowers / market produce",
      score: 43 + (small ? 20 : mid ? 14 : midsize ? 5 : -8) + (goodSoil ? 6 : 0) + (metroNear ? 18 : metroMid ? 8 : marketKnown ? 0 : -10),
      grossPerAcre: "Potential gross/acre can be high, but labor, irrigation, pack/handling loss and the sales channel dominate net return",
      economicsBasis: "gross",
      why: marketKnown
        ? "higher-value intensive production can outperform commodity acres when a real buyer channel is close enough and labor/water are workable"
        : "high revenue density is possible, but Furlong will not rank this as best without verified buyer/market access and water",
      marketSensitive: true,
    },
    {
      name: "Orchard / fruit",
      score: 40 + (mid ? 14 : midsize ? 9 : 0) + (metroMid ? 10 : marketKnown ? 0 : -8),
      grossPerAcre: "Multi-year establishment before mature revenue; variety, yield, labor, storage and direct-market strategy determine net return",
      economicsBasis: "gross",
      why: marketKnown
        ? "tree fruit can create strong long-run value where drainage, variety, labor and direct-market access line up"
        : "the soil may support tree fruit, but a multi-year establishment decision should not outrank other uses until the market and water are verified",
      marketSensitive: true,
    },
    {
      name: "Greenhouse / nursery / controlled environment",
      score: 34 + (mid ? 12 : small ? 16 : 4) + (metroNear ? 14 : metroMid ? 7 : marketKnown ? 0 : -10) - (f.publicWater === false ? 3 : 0),
      grossPerAcre: "High revenue density but capital, power, water, structures and contracted/verified demand dominate the economics",
      economicsBasis: "gross",
      why: "this is an infrastructure-and-market business more than an acreage business; do not credit the upside until utilities, water, structures and demand are evidenced",
      marketSensitive: true,
    },
    {
      name: "Vineyard / winery",
      score: 33 + (mid ? 8 : midsize ? 5 : 0) + (metroMid ? 12 : marketKnown ? 0 : -9),
      grossPerAcre: "Capital-heavy and slow to cash; tasting-room/direct-sales economics matter more than grape revenue alone",
      economicsBasis: "gross",
      why: marketKnown
        ? "a vineyard/winery is an experience and direct-sales model; drainage, permitting and visitor access matter as much as the crop"
        : "the agronomic ceiling may exist, but Furlong will not treat it as a leading use without market, visitor-access and permit evidence",
      marketSensitive: true,
    },
    {
      name: "Agritourism / farm experience",
      score: 31 + (mid ? 11 : midsize ? 8 : 0) + (metroNear ? 22 : metroMid ? 10 : marketKnown ? 0 : -8) + ((f.propertyWideCandidates ?? []).some((x) => /agricultural tourism/i.test(x)) ? 10 : 0),
      grossPerAcre: "Project-specific - revenue comes from the experience, events, direct sales or lodging, not a generic per-acre yield",
      economicsBasis: "unpriced",
      why: (f.propertyWideCandidates ?? []).some((x) => /agricultural tourism/i.test(x))
        ? "the current zoning interpretation includes agricultural tourism as a candidate use, but access, parking, sanitation, structures, event rules and market demand still control"
        : "agritourism can multiply farm revenue, but zoning/use-table permission and a real visitor market must be verified first",
      marketSensitive: true,
    },
    {
      name: "Commodity row crops (corn/soy/wheat)",
      score:
        42 + rowScaleAdjustment + (goodCropland ? 8 : 0) - (poorCropland ? 12 : 0) +
        (goodSoil ? 12 : 0) - (limitedSoil ? 20 : 0) +
        (strongYield ? 10 : goodYield ? 5 : 0) - (weakYield ? 10 : 0),
      grossPerAcre: "Thin-margin commodity system - evaluate full cost, rent/equipment, basis, yield and rotation; do not infer value from prime-soil status alone",
      economicsBasis: "net",
      why: !acresKnown
        ? "acreage is not confirmed, so Furlong will not treat prime soil as enough evidence to call commodity grain the best use"
        : commodityScale
          ? "the parcel has commodity scale; soil, county yield, basis, equipment and full-cost economics still decide whether grain should be the anchor"
          : a! >= 120
            ? `at ~${a!.toLocaleString("en-US", { maximumFractionDigits: 1 })} acres, row crops can be a rotation, lease or component, but the tract is still below stand-alone commodity scale`
            : `at ~${a!.toLocaleString("en-US", { maximumFractionDigits: 1 })} acres, the soil may grow grain well but the parcel is well below stand-alone commodity scale; row crops can be a rotation or rental component, not an automatic best use`,
    },
    {
      name: "Forestry / Christmas trees",
      score: 30 + (mid ? 8 : midsize ? 8 : 0) + (metroMid ? 8 : marketKnown ? 0 : -5),
      grossPerAcre: "Long-cycle use - value depends on species, survival, harvest cycle and choose-and-cut/wholesale channel",
      economicsBasis: "gross",
      why: "a slower-cash land use that may fit portions of a tract, but it should not outrank faster or more productive uses without market and site evidence",
      marketSensitive: true,
    },
  ];

  const drainage = (f.drainageClass ?? "").trim();
  const wetGround = /poorly drained/i.test(drainage);
  const drained = /^(well|excessively|somewhat excessively) drained/i.test(drainage);
  const adjusted = raw.map((o) => {
    let score = o.score;
    let why = o.why;
    if (wetGround) {
      if (/^(Orchard|Vineyard|Forestry)/.test(o.name)) {
        score -= 16;
        why = `${why}; NRCS maps the dominant soil as ${drainage.toLowerCase()}, so deep-rooted/perennial plantings need drainage design before they earn a high rank`;
      } else if (/^(Pasture|Hay)/.test(o.name)) {
        score += 8;
      } else if (/^Commodity/.test(o.name)) {
        score -= 6;
      }
    } else if (drained && /^(Orchard|Vineyard)/.test(o.name)) {
      score += 7;
      why = `${why}; the ${drainage.toLowerCase()} dominant soil is favorable drainage evidence for tree/vine establishment`;
    }
    if (o.marketSensitive && !marketKnown) score = Math.min(score, 55);
    return { ...o, score: Math.max(0, Math.min(100, score)), why };
  });

  const sorted = [...adjusted].sort((x, y) => y.score - x.score);
  const evidenceStatus: FarmBestUse["evidenceStatus"] = !acresKnown
    ? "insufficient"
    : soilKnown && countyEconomicsKnown && marketKnown && Boolean(f.zoningCode)
      ? "supported-screen"
      : "screening";

  const options: BestUseOption[] = sorted.map((o, i) => ({
    name: o.name,
    tier: evidenceStatus === "insufficient"
      ? "needs-evidence"
      : evidenceStatus === "screening"
        ? o.score >= 42
          ? "possible"
          : "marginal"
        : i === 0
          ? "leading-screen"
          : o.score >= 60
            ? "strong"
            : o.score >= 42
              ? "possible"
              : "marginal",
    grossPerAcre: o.grossPerAcre,
    economicsBasis: o.economicsBasis,
    why: o.why,
  }));

  const top = sorted[0] ?? null;
  const commodity = sorted.find((o) => o.name.startsWith("Commodity")) ?? null;
  const parcel = acresKnown ? `this ~${a!.toLocaleString("en-US", { maximumFractionDigits: 1 })}-acre parcel` : "this parcel";
  const place = where ? ` in ${where}` : "";
  const soilNote = f.primeFarmland
    ? ` USDA soil: ${f.primeFarmland.toLowerCase()}${cap != null ? `, land-capability class ${cap}` : ""}.`
    : "";
  const yieldParts = [
    cornY != null ? `corn ~${cornY} bu/ac` : null,
    soyY != null ? `soybeans ~${soyY} bu/ac` : null,
    f.wheatYieldPerAcre != null ? `wheat ~${f.wheatYieldPerAcre} bu/ac` : null,
  ].filter(Boolean);
  const yieldNote = yieldParts.length
    ? ` County crop benchmarks (USDA NASS${f.yieldYear ? ` ${f.yieldYear}` : ""}): ${yieldParts.join(", ")}.`
    : "";

  const headline = evidenceStatus === "insufficient"
    ? `Agricultural enterprise screen only - NOT the property's highest-and-best-use conclusion. Furlong does not have verified acreage for ${parcel}${place}, so it is not naming a best agricultural enterprise. Prime-soil status by itself cannot make commodity row crops the answer.${soilNote}${yieldNote}`
    : evidenceStatus === "screening"
      ? `Agricultural enterprise screen only - NOT the property's highest-and-best-use conclusion. For ${parcel}${place}, the current evidence orders ${top ? `${top.name.toLowerCase()} first among the agricultural candidates` : "the agricultural candidates"}, but one or more controlling inputs are still missing, so Furlong is not labeling any agricultural enterprise the leading use yet.${soilNote}${yieldNote}${commodity && !commodityScale ? ` Commodity row crops are treated as a rotation, lease, or component rather than an automatic best use because this tract is below stand-alone commodity scale.` : ""}`
      : `Agricultural enterprise screen only - NOT the property's highest-and-best-use conclusion. For ${parcel}${place}, ${top ? `${top.name.toLowerCase()} currently leads the supported agricultural fit screen` : "no agricultural enterprise leads yet"}.${soilNote}${yieldNote}${commodity && !commodityScale ? ` Commodity row crops are treated as a rotation, lease, or component rather than an automatic best use because this tract is below stand-alone commodity scale.` : ""}`;

  const second = sorted[1] ?? null;
  const topThreeClustered = sorted.length >= 3 && sorted[0].score - sorted[2].score <= 12;
  const commodityDominates = Boolean(
    commodityScale && commodity && top && top.name === commodity.name &&
    goodSoil && (strongYield || goodCropland) &&
    (second == null || top.score - second.score >= 12)
  );

  const portfolioAdvice: FarmBestUse["portfolioAdvice"] = !acresKnown
    ? {
        verdict: "not-yet-ranked",
        title: "Do not choose one crop or a diversified mix until acreage is verified",
        reasons: [
          "Parcel size is a controlling agricultural-use input. The earlier behavior let prime-soil status outrank the missing acreage and could falsely elevate row crops.",
          "Once acreage is verified, Furlong can compare agricultural enterprises; property-wide highest/best use still requires zoning, infrastructure, entitlement and market feasibility.",
        ],
      }
    : commodityDominates
      ? {
          verdict: "single-anchor",
          title: "A commodity rotation can screen as the agricultural anchor at this scale",
          reasons: [
            "The parcel has commodity scale plus supporting soil/yield or rent evidence, and no other agricultural candidate is close enough to displace the rotation as the initial screen.",
            "One anchor system still means a rotation (corn/soy/wheat), not a permanent monoculture.",
            "This is an agricultural-enterprise conclusion only; nonagricultural alternatives remain a separate property feasibility question.",
          ],
        }
      : {
          verdict: "diversify",
          title: topThreeClustered
            ? "Several agricultural enterprises remain plausible - compare two or three before committing"
            : "The leading agricultural screen is not dominant - compare it with a complementary second enterprise",
          reasons: [
            topThreeClustered
              ? "No agricultural enterprise dominates the evidence enough to justify treating a single crop/use as the answer."
              : "The leading agricultural option has a fit advantage, but not enough to skip enterprise-specific budgets, market/offtake and site constraints.",
            "Use one economic basis at a time: gross revenue, net operating margin and startup capital are different measures and must not be ranked as though they were interchangeable.",
            "Before committing acreage, verify zoning/use-table treatment, water, actual buyers/offtake, enterprise-specific costs and site constraints.",
          ],
        };

  const genericCandidates = [
    "Agricultural production",
    "Agritourism / value-added agriculture",
    "Rural residential or subdivision potential where legally permitted",
    "Renewable energy / storage where zoning and interconnection support it",
    "Conservation / forestry / hold",
  ];
  const zoning = f.zoningLabel ?? f.zoningCode ?? null;
  const propertyWideContext: FarmBestUse["propertyWideContext"] = {
    currentUse: f.landUse ?? null,
    zoning,
    zoningSummary: f.zoningSummary ?? null,
    source: f.zoningSource ?? null,
    sourceUrl: f.zoningSourceUrl ?? null,
    candidates: (f.propertyWideCandidates?.length ? f.propertyWideCandidates : genericCandidates),
    note:
      `${f.developmentNote ? `${f.developmentNote} ` : ""}` +
      `${f.energyNote ? `${f.energyNote} ` : ""}` +
      "Furlong must test legal permissibility, physical feasibility, entitlement/infrastructure, market demand and economics before naming a property-wide highest/best-supported use.",
  };

  return {
    scope: "agricultural-enterprise-screen",
    evidenceStatus,
    missingCriticalInputs,
    headline,
    options,
    propertyWideContext,
    portfolioAdvice,
  };
}
