/**
 * agriculturalAllocationPlan — the diversified, sustainability-weighted acre
 * allocation for a parcel (founder direction 2026-08-14).
 *
 * THE PROBLEM THIS FIXES: the enterprise optimizer scores each use on its OWN
 * suitable share of the parcel, INDEPENDENTLY. Listed together those rows overlap
 * and sum past the parcel size (21 ac alfalfa + 21 ac hay + 17 ac livestock on a
 * 30-acre farm is impossible), and ranking by total net simply rewards whichever
 * enterprise was pre-assigned the most land. That is not a plan.
 *
 * THIS module allocates the ACTUAL parcel acres across a compatible mix, summing
 * to the parcel (never past it), so the answer is a real farm plan:
 *   - acres are ALLOCATED, not overlapped — Σ allocated + conservation ≤ parcel;
 *   - the objective is a BLEND of net income AND sustainability (soil health,
 *     rotation/diversification, water demand, runoff/nutrient risk, climate fit),
 *     so a profitable-but-degrading monoculture is penalized (founder choice
 *     2026-08-14: "sustainability-weighted");
 *   - it DIVERSIFIES unless a single enterprise is VASTLY superior — beats the
 *     best mix's total net by more than a set margin — in which case it recommends
 *     the single use and says why (founder choice 2026-08-14);
 *   - a conservation buffer (riparian/pollinator/runoff set-aside) is reserved and
 *     named, because runoff and water rules are real constraints;
 *   - the customer can OVERRIDE any enterprise's acres and everything recomputes.
 *
 * Deterministic screening only — no AI, no sales comps. Enterprise budgets, the
 * NRCS soil map, water-use law, contracts, and market evidence all govern before
 * a single acre is committed. Master Volume: Vol II (sources/limits stated), Vol V
 * (versioned, every input named, replay-safe).
 */

import type { optimizeAgriculturalOpportunities } from "@/lib/property/agriculturalOpportunityOptimizer";

type RankedEnterprise = ReturnType<typeof optimizeAgriculturalOpportunities>["ranked"][number];

/** Per-enterprise SUSTAINABILITY profile (screening, founder-reviewable). Score is
 *  0–1: soil-building perennials/managed grazing high; tillage/nutrient-loading
 *  uses low. The note is the plain-language WHY shown to the customer. */
const SUSTAINABILITY: Record<string, { score: number; note: string }> = {
  "hay-pasture":          { score: 0.90, note: "Perennial forage — builds soil organic matter, low input, minimal runoff." },
  "livestock":            { score: 0.82, note: "Managed grazing builds soil and keeps land in perennial cover; stocking rate and water access must be right." },
  "agrivoltaics":         { score: 0.85, note: "Dual-use energy + grazing/crops with low ground disturbance; keeps the land productive." },
  "alfalfa-small-square": { score: 0.75, note: "Perennial nitrogen-fixing legume — soil-building and rotation-friendly, though irrigated water use counts against it." },
  "specialty-crops":      { score: 0.62, note: "Diverse plantings and pollinator habitat (flowers/orchard), but intensive inputs and irrigation; rotation and cover-cropping matter." },
  "cash-rent":            { score: 0.55, note: "Sustainability depends entirely on the tenant's practices — require conservation terms in the lease." },
  "solar-lease":          { score: 0.58, note: "Takes land out of cultivation with low ongoing inputs; site ecology and decommissioning terms govern." },
  "row-crops":            { score: 0.45, note: "Tillage and fertilizer/pesticide load — higher erosion and nutrient-runoff risk; cover crops and no-till raise this." },
  "greenhouse":           { score: 0.50, note: "Land-light but water- and energy-intensive controlled environment; offtake and utilities dominate." },
  "poultry":              { score: 0.38, note: "Litter and ammonia load with real nutrient-management and runoff obligations; integrator-dependent." },
  "battery-storage":      { score: 0.50, note: "Low-footprint grid infrastructure; entirely site- and interconnection-specific." },
};

export interface AllocationSlice {
  key: string;
  label: string;
  acres: number;
  netPerAcre: number;
  netTotal: number;
  sharePct: number;
  sustainability: number;
  sustainabilityNote: string;
}

export interface AllocationPlan {
  status: "planned" | "insufficient";
  parcelAcres: number;
  slices: AllocationSlice[];
  conservationAcres: number;
  allocatedAcres: number;
  totalNet: number;
  /** Acre-weighted sustainability of the productive allocation, 0–100. */
  sustainabilityScore: number | null;
  recommendation: "mix" | "single";
  isDiversified: boolean;
  /** Plain-language allocation, e.g. "8 ac flowers + 12 ac alfalfa + 8 ac pasture". */
  headline: string;
  rationale: string;
  /** The best single-enterprise plan, for the "vastly superior" comparison. */
  bestSingle: { key: string; label: string; acres: number; netTotal: number } | null;
  /** EVERY allocable enterprise (net-positive, eligible) with its ceiling and the
   *  acres the recommended plan gave it (0 if unallocated) — drives the editable
   *  toggle table so the customer can add acres to a use the mix left out. */
  allocable: Array<{
    key: string; label: string; netPerAcre: number; maxAcres: number;
    sustainability: number; sustainabilityNote: string; recommendedAcres: number;
  }>;
  cautions: string[];
}

export interface AllocationOptions {
  /** 0–1 weight on income vs. sustainability in the objective (founder:
   *  sustainability-weighted → income 0.6 / sustainability 0.4). */
  incomeWeight?: number;
  sustainabilityWeight?: number;
  /** A single use must beat the best mix's net by ≥ this multiple to override
   *  diversification (founder: "vastly superior", >40% → 1.4). */
  vastlySuperiorMultiple?: number;
  /** Fraction of the parcel reserved as a named conservation/runoff buffer. */
  conservationBufferPct?: number;
  /** Manual per-enterprise acre allocations (customer toggles). When present the
   *  plan honors them (clamped to each enterprise's ceiling and the parcel). */
  overrides?: Record<string, number> | null;
  /** Enterprise keys excluded by soil/topography (from the coverage solver). */
  excludedKeys?: string[];
}

const round = (n: number, dp = 0) => { const f = 10 ** dp; return Math.round(n * f) / f; };

/** Candidate ready for allocation: positive net, eligible, not soil-excluded. */
interface Candidate {
  key: string; label: string;
  netPerAcre: number;
  maxAcres: number;      // this enterprise's realistic ceiling on THIS parcel
  minAcres: number;      // viability floor below which it isn't worth counting
  sustainability: number;
  sustainabilityNote: string;
  score: number;         // blended income + sustainability, for allocation order
}

export function planAllocation(
  model: ReturnType<typeof optimizeAgriculturalOpportunities>,
  parcelAcres: number,
  opts: AllocationOptions = {},
): AllocationPlan {
  const incomeWeight = opts.incomeWeight ?? 0.6;
  const sustainabilityWeight = opts.sustainabilityWeight ?? 0.4;
  const vastly = opts.vastlySuperiorMultiple ?? 1.4;
  const bufferPct = opts.conservationBufferPct ?? 0.06;
  const excluded = new Set(opts.excludedKeys ?? []);

  const empty = (msg: string): AllocationPlan => ({
    status: "insufficient", parcelAcres, slices: [], conservationAcres: 0, allocatedAcres: 0,
    totalNet: 0, sustainabilityScore: null, recommendation: "mix", isDiversified: false,
    headline: "No feasible enterprise mix", rationale: msg, bestSingle: null, allocable: [], cautions: [msg],
  });

  if (!(parcelAcres > 0)) return empty("Enter the parcel's acreage to build an allocation plan.");

  // Build allocable candidates from the optimizer: eligible, not soil-excluded,
  // and net-positive per acre (never allocate land to a money-losing use).
  const raw: RankedEnterprise[] = model.ranked.filter(
    (r) => r.eligible && !excluded.has(r.key) && r.usedAcres > 0 && r.noi / r.usedAcres > 0,
  );
  if (!raw.length) return empty("No modeled enterprise nets a positive return on this ground at these assumptions — the parcel does not support a self-supporting ag plan without documented history or amendments the screen doesn't assume.");

  // Normalize income against a fixed reference ($/ac), NOT the max — otherwise a
  // single capital-intensive outlier (greenhouse ~$30k/ac) crushes every other
  // enterprise's income signal to near-zero and sustainability alone decides,
  // which wrongly ranks bulk forage above high-value crops like cut flowers.
  const NET_REFERENCE_PER_ACRE = 5000;
  const candidates: Candidate[] = raw.map((r) => {
    const netPerAcre = r.noi / r.usedAcres;
    const sus = SUSTAINABILITY[r.key] ?? { score: 0.5, note: "Sustainability profile not characterized for this use." };
    const normNet = Math.min(1, Math.max(0, netPerAcre / NET_REFERENCE_PER_ACRE));
    return {
      key: r.key, label: r.label,
      netPerAcre,
      maxAcres: r.usedAcres,                          // acres × acresShare = realistic ceiling
      minAcres: Math.min(r.usedAcres, Math.max(0.25, parcelAcres * 0.02)),
      sustainability: sus.score,
      sustainabilityNote: sus.note,
      score: incomeWeight * normNet + sustainabilityWeight * sus.score,
    };
  }).sort((a, b) => b.score - a.score);

  const byKey = new Map(candidates.map((c) => [c.key, c]));
  const conservationAcres = round(parcelAcres * bufferPct, 1);
  const productiveAcres = Math.max(0, parcelAcres - conservationAcres);

  // ── MANUAL OVERRIDE PATH: honor the customer's acre entries. ──────────────
  if (opts.overrides && Object.keys(opts.overrides).length) {
    let remaining = parcelAcres;
    const slices: AllocationSlice[] = [];
    for (const [key, wantRaw] of Object.entries(opts.overrides)) {
      const c = byKey.get(key);
      if (!c || !(wantRaw > 0)) continue;
      const acres = round(Math.min(wantRaw, c.maxAcres, remaining), 1);
      if (acres <= 0) continue;
      remaining -= acres;
      slices.push({ key: c.key, label: c.label, acres, netPerAcre: round(c.netPerAcre), netTotal: round(acres * c.netPerAcre), sharePct: 0, sustainability: c.sustainability, sustainabilityNote: c.sustainabilityNote });
    }
    return finalize(slices, parcelAcres, Math.max(0, round(remaining, 1)) >= conservationAcres ? conservationAcres : 0, candidates, vastly, true);
  }

  // ── AUTO ALLOCATION (two-phase, so no single use dominates) ───────────────
  // Phase 1: seed every viable enterprise up to a DIVERSIFICATION CAP (a share
  // ceiling), highest blended score first — this forces a real mix instead of
  // one enterprise eating the parcel. Phase 2: distribute any leftover to the
  // best uses up to their real ceiling, so land isn't left idle when only a few
  // enterprises are viable.
  const DIVERSIFICATION_CAP = 0.45; // no use gets more than 45% of productive land in phase 1
  const capAcres = productiveAcres * DIVERSIFICATION_CAP;
  const alloc = new Map<string, number>();
  let available = productiveAcres;
  for (const c of candidates) {
    if (available <= 0.25) break;
    const acres = round(Math.min(c.maxAcres, capAcres, available), 1);
    if (acres < c.minAcres) continue;
    alloc.set(c.key, acres);
    available -= acres;
  }
  for (const c of candidates) {
    if (available <= 0.25) break;
    const cur = alloc.get(c.key) ?? 0;
    const room = round(Math.min(c.maxAcres - cur, available), 1);
    if (room <= 0) continue;
    alloc.set(c.key, cur + room);
    available -= room;
  }
  const slices: AllocationSlice[] = candidates
    .filter((c) => (alloc.get(c.key) ?? 0) > 0)
    .map((c) => {
      const acres = round(alloc.get(c.key)!, 1);
      return { key: c.key, label: c.label, acres, netPerAcre: round(c.netPerAcre), netTotal: round(acres * c.netPerAcre), sharePct: 0, sustainability: c.sustainability, sustainabilityNote: c.sustainabilityNote };
    });

  return finalize(slices, parcelAcres, conservationAcres, candidates, vastly, false);
}

function finalize(
  mixSlices: AllocationSlice[],
  parcelAcres: number,
  conservationAcres: number,
  candidates: Candidate[],
  vastly: number,
  isOverride: boolean,
): AllocationPlan {
  const mixNet = round(mixSlices.reduce((s, x) => s + x.netTotal, 0));

  // Best SINGLE enterprise (its ceiling acres × net/ac), for the vastly-superior test.
  const bestSingleCand = candidates.reduce<Candidate | null>((best, c) => {
    const net = c.maxAcres * c.netPerAcre;
    return best == null || net > best.maxAcres * best.netPerAcre ? c : best;
  }, null);
  const bestSingle = bestSingleCand
    ? { key: bestSingleCand.key, label: bestSingleCand.label, acres: round(bestSingleCand.maxAcres, 1), netTotal: round(bestSingleCand.maxAcres * bestSingleCand.netPerAcre) }
    : null;

  // "Diversify unless vastly superior": a single use replaces the mix only when
  // it beats the mix's total net by more than the margin (founder choice).
  const singleBeatsMix = !isOverride && bestSingleCand != null && mixNet > 0 && (bestSingleCand.maxAcres * bestSingleCand.netPerAcre) > mixNet * vastly;
  const recommendation: "mix" | "single" = singleBeatsMix ? "single" : "mix";

  // When one use is vastly superior, the PLAN IS that single use (say why) —
  // otherwise the diversified allocation.
  const slices: AllocationSlice[] = singleBeatsMix && bestSingleCand
    ? [{
        key: bestSingleCand.key, label: bestSingleCand.label, acres: round(bestSingleCand.maxAcres, 1),
        netPerAcre: round(bestSingleCand.netPerAcre), netTotal: round(bestSingleCand.maxAcres * bestSingleCand.netPerAcre),
        sharePct: 100, sustainability: bestSingleCand.sustainability, sustainabilityNote: bestSingleCand.sustainabilityNote,
      }]
    : mixSlices;

  const allocatedAcres = round(slices.reduce((s, x) => s + x.acres, 0), 1);
  const totalNet = round(slices.reduce((s, x) => s + x.netTotal, 0));
  for (const s of slices) s.sharePct = allocatedAcres > 0 ? Math.round((s.acres / allocatedAcres) * 100) : 0;
  const sustainabilityScore = allocatedAcres > 0
    ? Math.round((slices.reduce((s, x) => s + x.sustainability * x.acres, 0) / allocatedAcres) * 100)
    : null;

  const isDiversified = slices.length >= 2;

  const allocMap = new Map(slices.map((s) => [s.key, s.acres]));
  const allocable = candidates.map((c) => ({
    key: c.key, label: c.label, netPerAcre: round(c.netPerAcre), maxAcres: round(c.maxAcres, 1),
    sustainability: c.sustainability, sustainabilityNote: c.sustainabilityNote,
    recommendedAcres: allocMap.get(c.key) ?? 0,
  }));

  const headline = slices.length
    ? slices.map((s) => `${s.acres} ac ${shortLabel(s.label)}`).join("  +  ") + (conservationAcres > 0 ? `  +  ${conservationAcres} ac conservation buffer` : "")
    : "No feasible enterprise mix";

  const rationale = singleBeatsMix && bestSingle
    ? `A single use — ${bestSingle.label} — is recommended here: at ${bestSingle.acres} ac it nets about $${bestSingle.netTotal.toLocaleString("en-US")}/yr, more than ${Math.round((vastly - 1) * 100)}% above the best diversified mix ($${mixNet.toLocaleString("en-US")}/yr). It is genuinely superior on this ground, so the plan does not dilute it — but a rotation or buffer strip still protects soil and water.`
    : isOverride
      ? `Your allocation across ${slices.length} use${slices.length === 1 ? "" : "s"}: about $${totalNet.toLocaleString("en-US")}/yr net on ${allocatedAcres} of ${parcelAcres} ac${conservationAcres > 0 ? `, with a ${conservationAcres}-ac conservation buffer` : ""}.`
      : `A diversified plan spreads ${allocatedAcres} of ${parcelAcres} ac across ${slices.length} compatible use${slices.length === 1 ? "" : "s"} for soil health, rotation, and market resilience — about $${totalNet.toLocaleString("en-US")}/yr net${conservationAcres > 0 ? `, keeping ${conservationAcres} ac in a conservation/runoff buffer` : ""}. No single use was profitable enough to justify a monoculture.`;

  const cautions = [
    "Screening allocation from county economics and this parcel's soil/climate signals — NOT an agronomic plan, a permit, or a guarantee. Enterprise budgets, the NRCS soil map, state water-use and runoff rules, and buyer commitments govern before any acre is committed.",
    "Acre ceilings per enterprise reflect realistic scale on a parcel this size (buildings, capital, labor, and market depth), not just what will physically fit.",
  ];

  return {
    status: slices.length ? "planned" : "insufficient",
    parcelAcres, slices, conservationAcres, allocatedAcres, totalNet,
    sustainabilityScore, recommendation, isDiversified, headline, rationale, bestSingle, allocable, cautions,
  };
}

function shortLabel(label: string): string {
  const map: Record<string, string> = {
    "Irrigated alfalfa — premium small squares": "alfalfa",
    "Bulk hay and managed pasture": "hay/pasture",
    "Lease tillable acreage": "leased tillable",
    "Commodity row crops": "row crops",
    "Grazing livestock enterprise": "grazing livestock",
    "Contract or independent poultry": "poultry",
    "Vegetables, berries, flowers, or orchard": "vegetables/flowers",
    "Greenhouse / controlled environment": "greenhouse",
    "Utility or community solar lease": "solar",
    "Agrivoltaics with grazing or crops": "agrivoltaics",
    "Battery energy storage site": "battery storage",
  };
  return map[label] ?? label.toLowerCase();
}
