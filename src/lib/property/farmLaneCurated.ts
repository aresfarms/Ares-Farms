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
