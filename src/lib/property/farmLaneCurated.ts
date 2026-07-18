/**
 * farmLaneCurated — the Farms, Agriculture & Land module's own content
 * (founder direction 2026-07-18: this page must answer the questions only
 * agricultural people actually ask — can I grow flowers profitably, what does
 * a diversified farm look like, how many acres is viable, is solar worth the
 * hassle, easements/CREP/state programs, seed-company trial plots — plus a
 * commodity ticker, farm equipment with costs and supplier links, and links
 * to the environmental and financing modules).
 *
 * Discipline (Vol VI REVENUE-INTEL-001 / SELLABLE-CATALOG-001 posture): every
 * figure is a RANGE sourced to USDA/extension norms and labeled illustrative —
 * never a guarantee, never "your result." First-party curated; maintained by
 * the team. Scanned by verify:brief-copy.
 */

import { COMMODITY_PRICES, COMMODITY_PRICES_PROVENANCE } from "@/lib/property/commodityPricesGenerated";
import { FSA_RATES, FSA_RATES_PROVENANCE } from "@/lib/property/fsaRatesGenerated";
import { INPUT_COSTS, INPUT_COSTS_PROVENANCE } from "@/lib/property/inputCostsGenerated";
import { STATE_GRAIN_BIDS, STATE_GRAIN_BIDS_PROVENANCE } from "@/lib/property/stateGrainBidsGenerated";

// ── Commodity ticker ─────────────────────────────────────────────────────────

export interface TickerItem {
  label: string;
  value: string;
  /** "up" | "down" | null — day/period direction where the source carries one. */
  direction: "up" | "down" | null;
  asOf: string;
}

/**
 * The ticker strip — USDA-published prices from the committed snapshots
 * (weekly refresh). HONEST LABEL: these are USDA cash prices/bids, refreshed
 * weekly — not a live exchange feed; true real-time futures quotes require a
 * licensed market-data feed (flagged to the founder).
 */
export function buildCommodityTicker(): { items: TickerItem[]; note: string } {
  const items: TickerItem[] = [];
  const label: Record<string, string> = { corn: "Corn", soybeans: "Soybeans", wheat: "Wheat" };

  for (const key of ["corn", "soybeans", "wheat"]) {
    const p = COMMODITY_PRICES[key];
    if (p) {
      items.push({
        label: label[key],
        value: `$${p.pricePerBushel.toFixed(2)}/bu`,
        direction: null,
        asOf: `USDA ${p.month} ${p.year}`,
      });
    }
  }
  // Local elevator bids (Delmarva anchor: MD) with day-over-day direction.
  const md = STATE_GRAIN_BIDS.MD;
  if (md && STATE_GRAIN_BIDS_PROVENANCE.asOf !== null) {
    for (const key of ["corn", "soybeans", "wheat"] as const) {
      const b = md.bids[key];
      if (b) {
        items.push({
          label: `${label[key]} (MD bid)`,
          value: `$${b.avg.toFixed(2)}`,
          direction: b.direction === "UP" ? "up" : b.direction === "DOWN" ? "down" : null,
          asOf: `USDA AMS ${md.reportDate}`,
        });
      }
    }
  }
  if (INPUT_COSTS_PROVENANCE.asOf !== null) {
    for (const [key, lbl] of [["fertilizer", "Fertilizer"], ["fuel", "Fuel"], ["feed", "Feed"]] as const) {
      const c = INPUT_COSTS[key];
      if (c?.yoyPct != null) {
        items.push({
          label: `${lbl} y/y`,
          value: `${c.yoyPct >= 0 ? "+" : ""}${Math.round(c.yoyPct)}%`,
          direction: c.yoyPct > 0 ? "up" : c.yoyPct < 0 ? "down" : null,
          asOf: `USDA ${c.period} ${c.year}`,
        });
      }
    }
  }
  items.push({
    label: "FSA Farm Ownership rate",
    value: `${FSA_RATES.ownershipDirect}%`,
    direction: null,
    asOf: FSA_RATES_PROVENANCE.effective ? `effective ${FSA_RATES_PROVENANCE.effective}` : "current",
  });

  return {
    items,
    note:
      `USDA-published prices and bids, refreshed weekly — not a live exchange feed. ` +
      `Sources: USDA NASS (${COMMODITY_PRICES_PROVENANCE.asOf ? "prices received" : "prices"}), USDA AMS Market News, USDA Prices Paid, USDA FSA.`,
  };
}

// ── Farmer questions — enterprise economics ─────────────────────────────────

export interface FarmBrief {
  id: string;
  question: string;
  answer: string;
  pointer: string;
  url?: string;
  /** Highlighted liability & insurance warning — rendered in its own callout
      (founder direction 2026-07-18: people think it's a great idea until they
      get sued). Present on every visitor/animal/paying-guest use. */
  liability?: string;
  /** Highlighted financing note — for enterprises whose lending is unusual
      (e.g. equestrian: sometimes USDA RD/SBA finance it, sometimes not). */
  financing?: string;
}

export const ENTERPRISE_BRIEFS: FarmBrief[] = [
  {
    id: "flowers",
    question: "Can I buy a farm to grow flowers — and is it even profitable?",
    answer:
      "Cut flowers are one of the highest revenue-per-acre crops legal everywhere: extension budgets commonly " +
      "show $25,000–$35,000 GROSS per acre at intensive scale — but the honest other half is labor (several " +
      "hundred hours per acre: planting, succession seeding, harvesting at dawn, bunching) and a market you " +
      "must build yourself (florists, weddings, farmers markets, subscriptions). Startup runs a few thousand " +
      "dollars per acre (plugs/seed, irrigation, a cooler is the big one). One to three acres well-marketed can " +
      "out-earn a hundred acres of corn — IF the sales channel exists. The crop is easy; the selling is the job.",
    pointer: "Extension cut-flower enterprise budgets; Association of Specialty Cut Flower Growers (ASCFG)",
    url: "https://www.ascfg.org/",
  },
  {
    id: "livestock",
    question: "What about livestock?",
    answer:
      "Cattle math starts with land: roughly 1.5–2 acres per cow-calf pair on decent Eastern pasture (far more " +
      "on dry Western range). A cow-calf operation historically nets anywhere from a loss to a couple hundred " +
      "dollars per cow per year depending on the cattle cycle — it rewards low-cost operators with paid-off " +
      "land. Sheep and goats run ~5–7 head per cow-equivalent and suit smaller parcels; pastured poultry and " +
      "eggs turn cash fastest but take daily labor and processing logistics. Fencing and water are the real " +
      "startup costs people forget — plan several dollars per foot of fence before the first animal arrives.",
    pointer: "State extension livestock enterprise budgets; USDA NASS cattle reports",
  },
  {
    id: "equestrian",
    question: "An equestrian operation — boarding, lessons, or breeding?",
    answer:
      "Horses are a business people fall in love with before they run the numbers. Full board commonly bills " +
      "$300–$800 per horse per month, and lessons, training, and hauling add more — but the hidden costs are " +
      "relentless and year-round: hay and grain through the winter, a farrier every 6–8 weeks per horse, " +
      "routine and emergency vet, dental and vaccinations, bedding, and a real manure-management plan. The " +
      "facility is capital-heavy: safe horse fencing runs several dollars a foot, plus a barn or run-in sheds, " +
      "water to every paddock, and — for anyone riding in winter — an indoor arena that can cost as much as a " +
      "house. Many barns roughly break even on board and actually earn on lessons and training. Plan the " +
      "facility and the manure plan before the first horse arrives.",
    liability:
      "Equestrian is one of the highest-liability rural enterprises there is — a thrown or kicked rider, a " +
      "boarder's horse, a lesson student. Most states have an Equine Activity Liability Act that limits your " +
      "exposure IF you post the required signage and use written liability releases, but that protection is " +
      "only partial, and boarding, lessons, or any public riding still need serious commercial equine " +
      "liability plus care-custody-and-control coverage for horses in your care. A standard farm policy almost " +
      "never covers a horse business — budget for a real equine commercial policy from day one.",
    financing:
      "Financing is its own hurdle. Lenders often read a horse operation as recreational rather than " +
      "agricultural, and specialized arenas and barns are hard to appraise (special-purpose improvements), so " +
      "a conventional ag loan may not fit. Sometimes USDA Rural Development or SBA WILL finance an equestrian " +
      "facility — especially boarding or training run as a genuine, documented business — and sometimes they " +
      "won't, treating it as recreational. Go in with a business plan and clean books; the Financing & Capital " +
      "module below covers which lanes actually apply.",
    pointer: "Your state's Equine Activity Liability Act + required signage; an equine-experienced insurance agent; state extension horse program",
  },
  {
    id: "diversified",
    question: "What does a diversified farm actually look like?",
    answer:
      "The classic working structure stacks enterprises so cash arrives in different seasons and one failure " +
      "can't sink the year: row crops or hay for the acreage base, a livestock enterprise grazing the ground " +
      "that shouldn't be tilled, one high-value intensive acre (produce, flowers, or eggs) for weekly cash flow, " +
      "and one off-farm or agritourism income line. The rule of thumb from farm-management studies: three to " +
      "five enterprises is the sweet spot — fewer concentrates risk, more spreads the operator too thin. Each " +
      "enterprise needs its own budget; the ones that can't show a path to profit get cut.",
    pointer: "USDA SARE whole-farm planning resources; extension farm-management programs",
    url: "https://www.sare.org/resources/",
  },
  {
    id: "acreage",
    question: "How many acres do I need for a viable, profitable working farm?",
    answer:
      "There is no single number — the enterprise decides. Intensive produce or cut flowers: 2–10 acres can " +
      "support a household IF the marketing works. Pastured livestock with direct sales: often 30–100 acres. " +
      "Conventional row crops at today's margins (see the truckload math in the newsletter): commonly 500+ " +
      "acres before the operation pays a full living, which is why most row-crop operations rent most of what " +
      "they farm. The honest reframe: don't ask how many acres — ask which enterprise fits the acres, the " +
      "labor, and the market you can actually reach. A small parcel with a strong sales channel beats a big " +
      "parcel without one.",
    pointer: "USDA ERS farm typology & Commodity Costs and Returns; extension enterprise budgets",
    url: "https://www.ers.usda.gov/data-products/commodity-costs-and-returns",
  },
  {
    id: "expansion-rent",
    question: "I already farm — expanding, or renting more ground?",
    answer:
      "Renting is how most acreage actually moves: cropland cash rent shows up county-by-county in USDA's " +
      "survey (it's built into every parcel chart on this platform), and a fair rent negotiation starts from " +
      "that number plus the parcel's real soils, drainage, and access. Expansion math is the same truckload " +
      "arithmetic as ownership — over cash costs AND after land and equipment — plus one discipline: a rented " +
      "acre that doesn't clear its rent in a normal year isn't expansion, it's a hobby. Flexible-rent leases " +
      "(base + bonus tied to yield or price) split weather risk between owner and operator and are worth " +
      "proposing in writing.",
    pointer: "USDA NASS county cash rents; extension farmland-leasing guides (e.g. Ag Lease 101)",
    url: "https://aglease101.org/",
  },
  {
    id: "trials",
    question: "How do I get seed companies to run trials on my land?",
    answer:
      "Seed companies place test and demo plots through their district sales agronomists — the path in is the " +
      "regional seed dealer or the company's district agronomist, not a headquarters form. Plots are typically " +
      "planted and tracked by the company; the host gets seed, data, and often a per-acre plot payment or " +
      "product credit, in exchange for field access and signage. University extension variety-trial programs " +
      "are the second door and carry more independence. What makes ground attractive: uniform soils, honest " +
      "records, road frontage (they want the sign seen), and an operator who'll actually follow the protocol.",
    pointer: "Your regional seed dealer / district agronomist; state extension variety-trial programs",
  },
];

// ── Land-money questions — solar, easements, selling, programs ──────────────

export const LAND_OPTION_BRIEFS: FarmBrief[] = [
  {
    id: "solar-battery",
    question: "Is putting solar or battery storage on my land worth the hassle?",
    answer:
      "The draw is real: utility-scale solar leases commonly pay several hundred to $2,000+ per acre per year " +
      "(mid-Atlantic offers often land near $1,000–$1,500) on 20–40 year terms — far above crop rent, fixed, " +
      "and drought-proof. The hassle is also real: the land leaves production for decades, the option period " +
      "can tie ground up for years before a shovel turns, decommissioning and soil-restoration terms decide " +
      "what you get back, and county zoning fights are common. Battery storage uses a smaller footprint at " +
      "higher per-acre rates but siting depends on grid interconnection, not your soil. Never sign an option " +
      "without an attorney who has done solar leases — the fine print IS the deal.",
    pointer: "Extension solar-leasing guides; an ag attorney with energy-lease experience; county zoning office",
  },
  {
    id: "developer",
    question: "What about selling to a developer?",
    answer:
      "Development value is a one-time harvest of everything the ground will ever be worth to farming — which " +
      "is exactly why the decision deserves slow math: compare the offer against the farm's income capitalized " +
      "over your horizon, the tax bill (capital gains; a 1031 exchange into other land can defer it), and what " +
      "the sale does to the rest of the operation (losing the base acres, the manure ground, or the access " +
      "parcel can quietly break what remains). Sell-and-lease-back and phased closings exist and are " +
      "negotiable. If the answer is 'not while I'm alive but maybe after,' that's an estate-planning " +
      "conversation, not a listing.",
    pointer: "An ag-experienced attorney and CPA before any letter of intent; your lender if ground is pledged",
  },
  {
    id: "easement-crep",
    question: "Easements, CREP, and programs that pay me to conserve?",
    answer:
      "Three different tools that get confused: (1) A PERMANENT conservation easement sells the development " +
      "rights forever — one-time payment and/or a significant tax deduction; the land stays yours and stays " +
      "farmable, but the decision binds every future owner. (2) CREP (the state-enhanced version of CRP) pays " +
      "ANNUAL rent plus cost-share to put buffers, wetlands, or sensitive ground into conservation cover on " +
      "10–15 year contracts — on marginal or wet acres the CREP rent often beats what the acre actually nets " +
      "in crop. (3) Working-lands programs (EQIP, CSP) cost-share practices on ground you keep farming. The " +
      "county FSA/NRCS office runs the federal side; the state agriculture department runs the state layer.",
    pointer: "County USDA Service Center (FSA + NRCS); state department of agriculture conservation programs",
    url: "https://www.fsa.usda.gov/resources/programs/conservation-reserve-enhancement-program-crep",
  },
  {
    id: "camping-agritourism",
    question: "Camping, glamping, and agritourism (Hipcamp and the like)?",
    answer:
      "Booking platforms (Hipcamp, and Airbnb for a farm stay) turn an unused corner into cash without breaking " +
      "ground: hosts commonly clear a few thousand dollars a season, more when the parcel sits near a park, " +
      "beach, wine trail, or festival draw — the platform handles booking and takes a cut (Hipcamp is around " +
      "10%). Glamping (outfitted tents, cabins, a dome) raises the nightly rate but turns it into a hospitality " +
      "business with permits, insurance, and guest management. VIABLE ONLY IF the parcel actually supports it: a " +
      "real attraction within a reasonable drive, legal road access, county zoning that allows short-term " +
      "camping or a farm-stay use, and workable water/toilet arrangements.",
    liability:
      "Paying guests create premises liability the moment they set foot on your land. Hipcamp includes host " +
      "liability coverage up to a stated limit — confirm the amount and exactly what it excludes — and a " +
      "standard FARM policy usually will NOT cover paying overnight guests. Carry a host or short-term-rental " +
      "liability policy, and tell your insurance agent before you list, not after a claim.",
    pointer: "Hipcamp host resources; county zoning/short-term-use rules; your liability insurer",
    url: "https://www.hipcamp.com/en-US/l/hosts",
  },
  {
    id: "storage-parking",
    question: "Storage — RV/boat, containers, or self-storage?",
    answer:
      "Outdoor storage is the low-lift version: a graded, fenced lot for RVs, boats, and trailers commonly rents " +
      "at $50–$150 per space per month, and shipping-container or equipment storage is similar — modest per " +
      "unit, but real income from ground that grows nothing, with low startup if access and a gravel pad " +
      "already exist. Built self-storage is a different animal: a genuine construction project with real " +
      "capital, but strong per-square-foot returns where demand is underserved. VIABLE ONLY IF the parcel has " +
      "good road access, is near enough to town or a boating/RV corridor to draw renters, and the zoning allows " +
      "a commercial storage use — rural-residential zoning often does not without a special-use permit.",
    liability:
      "Storing other people's property makes you responsible when something happens to it — fire, theft, " +
      "water, wind. Require renters to insure their own goods in the rental agreement, and carry a commercial " +
      "policy for the operation; a farm policy will not respond to a storage business. Have the lease terms " +
      "and the coverage reviewed before you take the first RV.",
    pointer: "County zoning (commercial storage / special-use permit); a local self-storage feasibility study before building",
  },
  {
    id: "dog-recreation",
    question: "A dog park, pet boarding, or recreation business?",
    answer:
      "Dog-focused uses fit farmland well: fenced off-leash \"sniff parks\" rented by the hour to one dog or one " +
      "household at a time (the Sniffspot model) turn a fenced acre into bookings, and boarding/daycare or an " +
      "agility field is a bigger step into a licensed animal business. Other low-footprint recreation leases — " +
      "paintball, disc golf, an events field, a model-aircraft strip — work on the same logic. Income is modest " +
      "to moderate and depends entirely on being close enough to a population that will drive to you. VIABLE " +
      "ONLY IF the parcel is within reach of enough people, the zoning permits a commercial recreation or animal " +
      "use.",
    liability:
      "This is the one people underestimate: dogs bite, visitors trip, and both sue. Any operation with " +
      "paying visitors and animals needs commercial general liability, and boarding or daycare needs " +
      "care-custody-and-control coverage for the animals themselves. Waivers help but do NOT replace " +
      "insurance — line up the policy before you take a single booking.",
    pointer: "Sniffspot / booking platforms; county zoning for commercial recreation or kennel use; liability insurer",
    url: "https://www.sniffspot.com/",
  },
  {
    id: "government-military",
    question: "Leasing to government — police, fire, or military training?",
    answer:
      "Public agencies do lease private land: a National Guard or reserve unit may want acreage for periodic " +
      "field training or staging, a sheriff's office or fire academy may need ground for K-9 work, a driving " +
      "track, or live burn-house practice, and public-safety agencies lease sites for communications towers. " +
      "These are relationship-and-procurement deals — you reach them through the agency's facilities or " +
      "logistics office, not a listing — and they tend to be episodic rather than steady rent. VIABLE ONLY IF a " +
      "unit or department is actually looking near you and the parcel fits their need (size, buffer from " +
      "neighbors for noise, road access, and zoning that tolerates the activity). Worth a direct inquiry to the " +
      "nearest installation or department; don't count on it as base income.",
    liability:
      "The agency usually carries its own coverage, but get indemnification and the insurance requirements IN " +
      "WRITING in the lease — training activity (vehicles, K-9, live fire, burns) carries real risk, and an " +
      "ambiguous agreement is exactly what you don't want when something goes wrong. Have an attorney review " +
      "any government lease before you sign.",
    pointer: "Nearest National Guard/reserve installation facilities office; county sheriff/fire academy logistics; an attorney on any government lease",
  },
  {
    id: "hunting-tower-billboard",
    question: "Hunting leases, cell towers, and billboards?",
    answer:
      "Three classic passive uses, each gated by geography: a HUNTING/recreation lease pays roughly $5–$50+ per " +
      "acre per year depending on region and game, needs almost no work, and mainly asks that you sort out " +
      "liability and access rules in writing. A CELL TOWER ground lease can pay hundreds to a few thousand " +
      "dollars a month — but ONLY if a carrier has a coverage gap at your spot; you can't create the demand, the " +
      "tower company finds you. A BILLBOARD pays a few hundred to a few thousand a year but needs highway " +
      "frontage and sign-permit eligibility, which many roads don't have. VIABLE ONLY IF the specific condition " +
      "is met — game and huntable ground, a real coverage gap, or permitted highway frontage. Never sign a " +
      "tower or billboard lease (often 20–30 years) without an attorney; the escalation and buyout clauses are " +
      "where the money is.",
    liability:
      "For hunting, liability is the classic worry — but many states have recreational-use statutes that " +
      "limit a landowner's liability when access isn't sold purely for profit, and a written lease that " +
      "REQUIRES hunters to carry liability insurance naming you as an additional insured closes most of the " +
      "rest of the gap. A tower or billboard puts a contractor on your land for decades; put their coverage " +
      "and indemnification in the contract.",
    pointer: "State wildlife agency lease guides; a telecom-lease attorney for tower/billboard terms; state DOT for outdoor-advertising permits",
  },
];

// ── Farm equipment — costs + suppliers ──────────────────────────────────────

export interface EquipmentLine {
  category: string;
  typicalCost: string;
  note: string;
}

export const EQUIPMENT_LINES: EquipmentLine[] = [
  { category: "Compact / utility tractor (25–75 hp)", typicalCost: "$25,000–$75,000 new", note: "The small-farm workhorse; strong used market at roughly half of new." },
  { category: "Row-crop tractor (150–300 hp)", typicalCost: "$150,000–$450,000 new", note: "The big line item after land; most operations buy used or lease." },
  { category: "Combine + heads", typicalCost: "$400,000–$800,000 new", note: "Why custom harvesting exists — hiring the combine often beats owning under ~1,000 acres." },
  { category: "Planter / drill", typicalCost: "$50,000–$300,000", note: "Width and tech (section control, monitors) drive the spread." },
  { category: "Sprayer (pull-type → self-propelled)", typicalCost: "$40,000–$400,000", note: "Custom application is the common alternative below scale." },
  { category: "Hay line (mower, rake, baler)", typicalCost: "$60,000–$200,000 for the set", note: "Round balers $30,000–$70,000 new; the used market is deep." },
];

export interface SupplierLink {
  name: string;
  role: string;
  url: string;
}

export const SUPPLIER_LINKS: SupplierLink[] = [
  { name: "John Deere", role: "Equipment (dealer network)", url: "https://www.deere.com/" },
  { name: "Case IH", role: "Equipment (dealer network)", url: "https://www.caseih.com/" },
  { name: "New Holland", role: "Equipment (dealer network)", url: "https://www.newholland.com/" },
  { name: "Kubota", role: "Compact & utility equipment", url: "https://www.kubotausa.com/" },
  { name: "AGCO (Massey Ferguson · Fendt)", role: "Equipment (dealer network)", url: "https://www.agcocorp.com/" },
  { name: "TractorHouse", role: "Used-equipment marketplace", url: "https://www.tractorhouse.com/" },
  { name: "Machinery Pete", role: "Used-equipment marketplace & auction prices", url: "https://www.machinerypete.com/" },
  { name: "AgDirect", role: "Equipment financing (Farm Credit)", url: "https://www.agdirect.com/" },
];

export const EQUIPMENT_NOTE =
  "Ranges are list-price norms, illustrative — configuration, tech, and the deep used market move every " +
  "number. Equipment loans and leases run through dealers, AgDirect/Farm Credit, and FSA microloans; the " +
  "honest scale rule: custom hire (planting, spraying, harvest) usually beats owning until the acres justify " +
  "the iron. Supplier links are independent companies — Furlong has no affiliation and earns nothing from them.";
