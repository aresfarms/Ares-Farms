/**
 * farmAnswerEngine — answers the farm-lane "questions farmers actually ask" FOR
 * THE SPECIFIC PROPERTY (founder direction 2026-07-19: the analysis must answer
 * these per-property, or say honestly WHY it can't — too small, we can't see
 * zoning, confirm at X). The lane PAGE keeps its generic educational cards; this
 * engine adds the property-specific layer inside the analysis + PDF.
 *
 * Data we reason from (all we reliably have per property): acreage (when the feed
 * carries it), county + state, county cash rents (USDA NASS), state farmland
 * value. Data we do NOT have at the parcel level — zoning, soil survey, water
 * rights — yields an explicit "confirm at …" note rather than a guess. Facts and
 * enterprise economics only; never a promise, an appraisal, or a credit decision.
 */

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
  /** USDA plant-hardiness zone, e.g. "7b". */
  hardinessZone?: string | null;
  /** County-average crop yields, bu/acre (USDA NASS Survey), when resolved — a
      productivity benchmark for the parcel's county, never a parcel guarantee. */
  cornYieldPerAcre?: number | null;
  soybeanYieldPerAcre?: number | null;
  wheatYieldPerAcre?: number | null;
  /** Survey year the county yields are drawn from. */
  yieldYear?: number | null;
}

export interface BestUseOption {
  name: string;
  /** best | strong | possible | marginal — a ranked verdict for THIS parcel. */
  tier: "best" | "strong" | "possible" | "marginal";
  grossPerAcre: string;
  why: string;
}

export interface FarmBestUse {
  headline: string;
  options: BestUseOption[];
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
  const where = [county && county !== "Unknown" ? `${county} County` : null, state]
    .filter(Boolean)
    .join(", ");
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
 * Highest-and-best-USE for this parcel (founder direction 2026-07-19): don't just
 * answer "can I grow commodity" — rank EVERY realistic enterprise by the numbers
 * for THIS parcel and name the best, including outside-the-box changes of use
 * (flowers, orchard, vineyard/winery, Christmas trees, agritourism), passive
 * income (solar/battery land lease), and whether it reads developer-friendly.
 * Heuristic + honest — a starting rank a real budget refines, never a promise.
 * Grounded in acreage + region + county cash rent + metro proximity; soil (NRCS
 * SSURGO) + climate zone are the next data wires to sharpen it.
 */
export function farmBestUse(f: FarmPropertyFacts): FarmBestUse {
  const a = f.acres;
  const acresKnown = typeof a === "number" && a > 0;
  const small = acresKnown && a! < 20;
  const mid = acresKnown && a! >= 20 && a! <= 120;
  const large = acresKnown && a! > 120;
  const m = f.nearestMetroMiles ?? null;
  const metroNear = m != null && m <= 40;
  const metroMid = m != null && m <= 90;
  const rent = f.croplandRentPerAcre;
  const goodCropland = rent != null && rent >= 180;
  const poorCropland = rent != null && rent < 130;
  // Soil signals (USDA-NRCS): capability class 1–4 = arable cropland, 5–8 =
  // pasture/limited; prime-farmland is the strongest "grow commodity here" flag.
  const cap = f.capabilityClass ?? null;
  const isPrime = /prime farmland/i.test(f.primeFarmland ?? "") && !/not prime/i.test(f.primeFarmland ?? "");
  const goodSoil = isPrime || (cap != null && cap <= 3);
  const limitedSoil = cap != null && cap >= 5;
  // County yield signal (USDA NASS): corn is the most widely reported county
  // crop, so it's the primary read; fall back to soybeans. US county corn
  // averages ~175 bu/ac — >175 strong, >150 healthy, <120 weak ground.
  const cornY = f.cornYieldPerAcre ?? null;
  const soyY = f.soybeanYieldPerAcre ?? null;
  const strongYield = cornY != null ? cornY >= 175 : soyY != null ? soyY >= 58 : false;
  const goodYield = cornY != null ? cornY >= 150 : soyY != null ? soyY >= 50 : false;
  const weakYield = cornY != null ? cornY < 120 : soyY != null ? soyY < 38 : false;
  const where = acreLabel(f.county, f.state).replace(/^ in /, "");

  const raw: Array<{ name: string; score: number; grossPerAcre: string; why: string }> = [
    {
      name: "Commodity row crops (corn/soy/wheat)",
      score:
        40 + (large && goodCropland ? 30 : 0) - (small ? 30 : 0) - (poorCropland ? 18 : 0) +
        (goodSoil ? 18 : 0) - (limitedSoil ? 22 : 0) +
        (strongYield ? 12 : goodYield ? 6 : 0) - (weakYield ? 12 : 0),
      grossPerAcre: "~$0–$150 net/ac — often a loss on FULL cost at today's prices",
      why:
        (limitedSoil
          ? `USDA soil here is land-capability class ${cap} — better suited to pasture or specialty than row crops`
          : goodSoil
            ? large
              ? "prime / high-capability cropland at scale — a commodity base genuinely fits here"
              : "the soil is prime cropland, but the parcel is small for commodity to pay a living"
            : large
              ? goodCropland
                ? "the acreage and county cash rent both support a commodity base"
                : "big enough for commodity, but average ground means thin margins"
              : "this parcel is too small for commodity crops to pay a living") +
        (cornY != null
          ? weakYield
            ? ` — and county corn yields run light (~${cornY} bu/ac), thinning margins further`
            : strongYield
              ? ` — and county corn yields run strong (~${cornY} bu/ac), which helps commodity pencil`
              : ` (county corn ~${cornY} bu/ac)`
          : ""),
    },
    {
      name: "Pasture livestock (cattle, sheep, goats)",
      score:
        52 + (mid || large ? 15 : 0) + (poorCropland ? 10 : 0) + (limitedSoil ? 12 : 0) -
        (small && a! < 10 ? 15 : 0),
      grossPerAcre: "~$50–$200 net/ac on good pasture; rewards paid-off land",
      why: limitedSoil
        ? `class ${cap} ground that won't pay as cropland often pencils better under grazing`
        : poorCropland
          ? "cheaper ground that underperforms for crops often pencils better under grazing"
          : "a solid, lower-labor base that fits most mid-to-large parcels",
    },
    {
      name: "Cut flowers / market produce (intensive)",
      score: 46 + (small || mid ? 28 : 0) + (metroNear ? 26 : metroMid ? 12 : 0) - (large ? 18 : 0),
      grossPerAcre: "$25k–$35k GROSS/ac at intensive scale — labor-heavy, market is the job",
      why: metroNear
        ? "a nearby metro is the buyer (florists, restaurants, markets, CSAs) — 2–10 intensive acres here can out-earn 100 of commodity"
        : "highest revenue per acre by far, but you must build the sales channel yourself",
    },
    {
      name: "Orchard / fruit",
      score: 42 + (mid ? 15 : 0) + (metroMid ? 16 : 0),
      grossPerAcre: "$5k–$20k+ gross/ac at maturity — 3–5 yr to bear, then decades",
      why: metroMid
        ? "pick-your-own + farm-stand demand from the metro rewards fruit near a market"
        : "high long-run value, but a multi-year establishment cost before the first crop",
    },
    {
      name: "Vineyard / winery",
      score: 36 + (metroMid ? 22 : 0) + (mid ? 10 : 0),
      grossPerAcre: "$8k–$25k+ gross/ac — heavy capital + 3–4 yr, tasting-room margin is the prize",
      why: metroMid
        ? "agritourism + a tasting room turns a mid-size parcel near a metro into an experience business, not just a crop"
        : "high ceiling, but capital- and expertise-intensive and slow to return",
    },
    {
      name: "Christmas trees",
      score: 34 + (metroMid ? 16 : 0) + (mid ? 10 : 0),
      grossPerAcre: "$10k–$25k gross/ac at harvest — a 7–10 yr cycle, choose-and-cut is the margin",
      why: metroMid
        ? "choose-and-cut demand from a nearby metro pays a premium and stacks with agritourism"
        : "steady long-cycle income on ground that doesn't need to be prime",
    },
    {
      name: "Agritourism (pick-your-own, events, glamping)",
      score: 30 + (metroNear ? 34 : metroMid ? 15 : 0),
      grossPerAcre: "highly variable — the margin is in the experience, not the acre",
      why: metroNear
        ? "close to a metro is the whole game for agritourism — weekend visitors are the revenue"
        : "works best paired with a crop or animals as a second income line",
    },
    {
      name: "Solar / battery land lease (passive)",
      score: 30 + (large ? 25 : mid ? 10 : 0),
      grossPerAcre: "$500–$2,000/ac/yr passive — depends entirely on grid/substation access",
      why: large
        ? "a large parcel with transmission access can earn more leasing to solar than farming — zero-labor income"
        : "possible on smaller acreage, but developers want scale and a nearby substation",
    },
    {
      name: "Sell or hold for development",
      score: 18 + (metroNear ? 40 : metroMid ? 15 : 0),
      grossPerAcre: "one-time land sale — value tracks metro demand + zoning",
      why: metroNear
        ? "close enough to a metro to read developer-friendly now or soon — worth knowing what the ground is worth as future lots, not just as a farm"
        : "rural enough that development isn't the near-term play",
    },
  ];

  const sorted = raw
    .map((o) => ({ ...o, score: Math.max(0, Math.min(100, o.score)) }))
    .sort((x, y) => y.score - x.score);

  const options: BestUseOption[] = sorted.map((o, i) => ({
    name: o.name,
    tier: i === 0 ? "best" : o.score >= 55 ? "strong" : o.score >= 42 ? "possible" : "marginal",
    grossPerAcre: o.grossPerAcre,
    why: o.why,
  }));

  const top = sorted[0];
  const commodity = sorted.find((o) => o.name.startsWith("Commodity"))!;
  const beatsCommodity = top.name !== commodity.name && top.score > commodity.score + 8;
  const parcel = acresKnown ? `this ~${a!.toLocaleString("en-US")}-acre parcel` : "this parcel";
  const place = where ? ` in ${where}` : "";
  const soilNote = f.primeFarmland
    ? ` USDA soil: ${f.primeFarmland.toLowerCase()}${cap != null ? `, land-capability class ${cap}` : ""}${f.hardinessZone ? `, hardiness zone ${f.hardinessZone}` : ""}.`
    : f.hardinessZone
      ? ` Plant-hardiness zone ${f.hardinessZone}.`
      : "";
  const yieldParts = [
    cornY != null ? `corn ~${cornY} bu/ac` : null,
    soyY != null ? `soybeans ~${soyY} bu/ac` : null,
    f.wheatYieldPerAcre != null ? `wheat ~${f.wheatYieldPerAcre} bu/ac` : null,
  ].filter(Boolean);
  const yieldNote =
    yieldParts.length > 0
      ? ` County row-crop yields (USDA NASS${f.yieldYear ? ` ${f.yieldYear}` : ""}): ${yieldParts.join(", ")} — a county benchmark, not this parcel's guarantee.`
      : "";
  const headline = beatsCommodity
    ? `For ${parcel}${place}, the numbers lean toward ${top.name.replace(/\s*\(.*\)/, "").toLowerCase()} over commodity row crops — ${top.why}.${soilNote}${yieldNote} Read the ranked options below as "possible here if the zoning, water, and market line up," and price your top one or two before committing.`
    : `For ${parcel}${place}, the ranked options below weigh real per-acre economics for this ground.${soilNote}${yieldNote} Read each as "possible here if the zoning, water, and market line up," and price your top one or two before committing.`;

  return { headline, options };
}
