/**
 * environmentalLaneCurated — the Environmental module's content (founder
 * direction 2026-07-18: a real module, and the founder's own domain — she's an
 * environmental engineer, so this must be authoritative). The site-side reality
 * a property buyer needs before they close: Phase I, water/well/septic,
 * wetlands & floodplain, contamination liability, permits, and when to bring in
 * a licensed PE.
 *
 * Discipline (same as farm/commercial): honest, ranged, sourced, illustrative —
 * never a guarantee, never a substitute for a site-specific professional
 * assessment. Scanned by verify:brief-copy.
 */

export interface EnvBrief {
  id: string;
  question: string;
  answer: string;
  pointer: string;
  url?: string;
  /** Highlighted deal-killer / liability warning. */
  watch?: string;
}

export const ENVIRONMENTAL_BRIEFS: EnvBrief[] = [
  {
    id: "phase-one",
    question: "Do I need a Phase I Environmental Site Assessment?",
    answer:
      "For almost any commercial or income-producing purchase with a loan — yes. A Phase I ESA is a records + " +
      "history + site-walk review by an environmental professional (no sampling) that screens for " +
      "'recognized environmental conditions' — signs the site may be contaminated. It runs a few thousand " +
      "dollars, and it does two things: it satisfies the lender, and it establishes your 'innocent landowner / " +
      "bona fide prospective purchaser' defense under CERCLA — which is what protects you from inheriting " +
      "someone else's cleanup. If the Phase I flags a condition, a Phase II (actual soil/groundwater sampling) " +
      "follows. Make the purchase contingent on a clean Phase I, and never waive it to win a bid.",
    pointer: "A qualified environmental professional (ASTM E1527 Phase I); your lender's requirements; the EPA All Appropriate Inquiries rule",
    watch:
      "Any site that ever held a gas station, dry cleaner, auto shop, machine shop, or heavy chemical/ag use is a " +
      "red flag — that's where contamination hides, and the liability transfers to YOU at closing, not the seller.",
  },
  {
    id: "well-septic",
    question: "Buying rural — what do I need to know about the well and septic?",
    answer:
      "No public water/sewer means the well and septic ARE your utilities, and they're yours to fix. WELL: test " +
      "for bacteria (coliform/E. coli), nitrates, and any local concern (arsenic, radon, ag chemicals), and check " +
      "the yield/recovery so it actually supplies your use — a low-producing well limits everything. SEPTIC: get " +
      "it inspected and pumped, confirm the permit and drainfield condition, and verify the capacity fits your " +
      "intended use (a house septic won't serve a commercial kitchen or a full farm operation). Lenders often " +
      "require both tests before closing.",
    pointer: "A licensed well driller / water-testing lab; a septic inspector; the county health department for permits",
    watch:
      "A failed septic system or a dry/contaminated well is a $10,000–$40,000+ surprise. Test before you close — " +
      "'it's always worked' is not a test result.",
  },
  {
    id: "wetlands-floodplain",
    question: "Wetlands and floodplain — what can I actually build?",
    answer:
      "Both quietly decide what's possible on the ground. WETLANDS are federally regulated under the Clean Water " +
      "Act (Army Corps of Engineers): a delineation maps where they are, and filling or building in them needs a " +
      "permit that is often denied or requires expensive mitigation. FLOODPLAIN (FEMA flood maps) drives " +
      "mandatory flood insurance, building restrictions, and elevation requirements — and a property can be " +
      "partly buildable and partly off-limits. Get a wetland delineation and pull the FEMA flood map BEFORE you " +
      "plan a building, a pond, or a drainage change — after you've bought is the expensive time to learn the " +
      "back forty can't be touched.",
    pointer: "A wetland scientist for a delineation; the FEMA flood map service center; the Army Corps district office",
    url: "https://msc.fema.gov/portal/home",
  },
  {
    id: "contamination-tanks",
    question: "Contamination and old tanks — the liability that comes with the deed",
    answer:
      "This is the one that ends deals. Environmental liability runs with the LAND, not the seller — under CERCLA " +
      "('Superfund'), an owner can be responsible for cleanup regardless of who caused it. If a site is " +
      "contaminated, remediation can cost more than the property is worth, and lenders won't finance it. " +
      "Underground storage tanks are the classic hidden version: old farm fuel tanks, a former filling station, a " +
      "buried heating-oil tank. The Phase I is your screen; a clean Phase I plus the innocent-landowner defense is " +
      "your protection. The remedy is process, not optimism — do the assessment, don't assume.",
    pointer: "The Phase I environmental professional; an environmental attorney if a condition is found; the state cleanup/UST program",
    watch:
      "Waiving the environmental contingency to win a deal is how buyers inherit six- and seven-figure cleanups. " +
      "The contingency IS the protection — keep it.",
  },
  {
    id: "permits-compliance",
    question: "What environmental permits and compliance will the property need?",
    answer:
      "It depends entirely on the use, and change-of-use often triggers new requirements. Common ones: stormwater " +
      "(construction and industrial sites), air permits (certain equipment), wastewater discharge (NPDES), and a " +
      "wetland permit (Corps) for any work near water. AGRICULTURE adds its own layer: nutrient-management plans, " +
      "and CAFO permits for concentrated animal feeding operations above size thresholds. The honest move is to " +
      "call the state environmental agency (DEQ/DNR/DEP) and ask what THIS property and THIS use actually require " +
      "— before closing, not during a violation.",
    pointer: "Your state DEQ/DNR/DEP; the county for local ordinances; NRCS for ag nutrient-management + conservation compliance",
  },
  {
    id: "water-rights",
    question: "Do I actually own the water? (water rights)",
    answer:
      "Not always — and for irrigated ground it can matter more than the dirt. In much of the WEST (prior " +
      "appropriation), water is a SEPARATE right from the land: you can own the ground and not the water, or hold " +
      "a right with a priority date that can be forfeited if it goes unused ('use it or lose it'). In the EAST " +
      "(riparian), rights generally attach to the land, but large withdrawals may still need a permit. For any " +
      "farm that depends on irrigation, verify the water right, its seniority, and whether it transfers with the " +
      "sale — a senior right is a real, valuable, and separable asset.",
    pointer: "The state water-rights / engineer's office; a water-rights attorney in Western states; the seller's documented right",
  },
  {
    id: "when-pe",
    question: "When do I need an environmental engineer or PE?",
    answer:
      "When the desk review turns into a real question. Bring in a licensed environmental/professional engineer " +
      "when: a Phase I flags a condition (you need a Phase II/III sampling and remediation plan), you're building " +
      "in or near a wetland or floodplain, a permit requires an engineered design (stormwater, wastewater, a " +
      "septic system for real capacity), or a lender or agency requires a stamped, sealed report. A PE turns " +
      "'there might be a problem' into a defensible, permit-ready plan an agency and a lender will accept — which " +
      "is exactly the site-side review Furlong's environmental readiness package points toward.",
    pointer: "A licensed PE / environmental consultant in your state; your lender's or agency's report requirements",
  },
];

export const ENVIRONMENTAL_NOTE =
  "This is an educational site-side overview, illustrative and general — it is NOT a Phase I, a delineation, a " +
  "water test, or a substitute for a site-specific assessment by a qualified professional. Costs and requirements " +
  "vary by state, use, and the specific property. Furlong reports the framework; the licensed assessment is the " +
  "official answer.";
