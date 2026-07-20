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

  out.push({
    id: "usda-number",
    propertyAnswer: `Yes — if you'll operate this as a farm, get a USDA farm number: it's free, it does NOT dictate what you grow, and it's the key to FSA loans, disaster programs, and most USDA cost-share. Take a deed or lease for this parcel to your ${
      f.county && f.county !== "Unknown" ? `${f.county} County` : "local"
    } USDA Service Center (FSA) and ask them to establish farm and tract numbers. You can absolutely farm without one — you just can't access the programs.`,
    confirm: null,
  });

  return out;
}
