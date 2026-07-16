# Property Brief Intelligence Spec — "The Analysis You Didn't Know to Ask For"

**Date:** 2026-07-15 · **Author:** Code session from Caitlin's product direction · **Status:** DRAFT for founder review
**Governs:** the `/discover?entry=property-brief` surface (free tier) + the paid-tier ladder (BUILD-LATER)
**Master Volume traceability:** Vol II (regulatory: fair housing, claims), Vol V (source authority, controlled disclosure,
place-facts-not-eligibility), COP-001 posture (intelligence-not-listings), forecast-labeling doctrine.

---

## 1. The organizing question (Caitlin, 2026-07-15)

> *"If you are a new customer and picked a property off the map on the main page, what would you be
> hoping to learn, and what would you need to know but wouldn't know to ask?"*

Every section of the brief answers one of those two questions for a specific customer lens. The free
tier answers them with facts we hold plus an honest **"what we can't verify yet — and how you'd find
out"** block. Paid tiers go deeper on the same questions, never sideways into filler.

**Value rule:** each tier must deliver more value than its price to *that* customer, even where parts
are generic — generic content must always be anchored to THIS property's geography and source.

**Tier economics are FOUNDER-GATED** (membership-tiers hold): this spec defines tier *content* only.
No pricing, no checkout, no tier UI ships before founders + counsel set economics.

---

## 2. Non-discrimination design principles (LOAD-BEARING — read first)

The "living here" content class is exactly where Zillow and Redfin withdrew crime data (2021–22)
because neighborhood characterization enables steering. Furlong's differentiator is doing this
**honestly and lawfully** where others simply deleted the category. Binding rules:

1. **Facts about places and documents, never scores of people or neighborhoods.** We display
   measurable, source-attributed facts (distances, counts, designations, ordinances, documents).
   We NEVER publish composite "neighborhood quality," "safety," "friendliness," or school
   letter-grade scores of our own.
2. **Symmetric display.** Every brief shows the same section skeleton for every property. We never
   selectively surface or suppress a data class by area — selective display is steering.
3. **No protected-class proxies.** Nothing that characterizes who lives somewhere (demographics,
   "family area," "quiet neighbors"). Familial status is a protected class: "kid-considerations"
   are amenity facts (playgrounds, sidewalks, speed limits), never "good for families" claims.
4. **Link, don't redistribute, for restricted registries.** Sex-offender registry data is public
   but most state registries prohibit commercial redistribution and misuse carries liability.
   Pattern: a "Check the official registry" action that deep-links NSOPW.gov / the state registry
   so the USER runs the search on the official site. We never scrape, cache, or display it.
5. **Crime data = official sources, coarse geography, methodology notes, counsel-approved.** If
   shown at all: county/agency-level trends from FBI CDE / state repositories with collection
   caveats, plus a link to the local agency dashboard. Never block-level, never mapped as a heat
   layer, never adjectivized. **Gate LEGAL-FHA-001 (counsel sign-off) blocks launch of this item.**
6. **Rental/STR content is market fact, not investment advice.** Current HUD Fair Market Rents,
   ordinance status, seasonality facts. Revenue *projections* only in paid tiers, under the
   forecast-labeling doctrine (labeled assumptions, not promises), advisory-only disclosures on.
7. **Every fact carries provenance + as-of date** (existing source-authority doctrine) and expired
   data auto-degrades to historical (existing render-time honesty pattern).

New gate proposed: **`verify:fair-housing-surface`** — greps the brief surface for banned
characterization vocabulary (like the place-fact claims gate) + asserts section symmetry.

---

## 3. Free tier — the Place Brief (all lenses)

Header block (every property): what it is, where it is (resolved county — fix "Unknown county"),
source mechanics explainer (how HUD/USDA/GSA sales actually work: bid windows, owner-occupant
priority, as-is), price reality ("price on request" decoded), freshness stamp, provenance.

Replaces the pathway buttons with one prose line (financing kept generic while the financing node
is gated): *"Homes like this in rural Kansas are typically bought with FHA loans (often 203(k)
where repairs are needed), conventional loans, or USDA rural programs — a provider can tell you
which fits your situation."*

Core "wouldn't know to ask" block (every property):
- **Water/flood:** FEMA NFHL zone (HAVE: `queryFloodZone`), county disaster-declaration history
  (HAVE: `ingest:property-flood-historic`), flood-insurance requirement fact for A/V zones.
- **Designations:** USDA-rural eligibility, HUBZone, Opportunity Zone, NMTC tract (HAVE: all four
  lookups). Facts, not eligibility.
- **Historic status:** National Register proximity/listing (HAVE: `queryNationalRegister`) and what
  it changes.
- **As-is reality + 203(k) fact** for repair-heavy government listings.
- **Honest unknowns:** structured list of what we could not verify, each with "how you'd find out."

## 4. Lens: LIVE-IN RESIDENTIAL — "What would it be like to live here?"

| They hope to learn | We show (fact pattern) | Source (status) |
|---|---|---|
| Is the area safe? | County/agency-level reported-crime trends + link to official dashboards; NO scores/maps | FBI CDE, state repository (BUILD, **LEGAL-FHA-001 gate**) |
| Do tracked offenders live nearby? | "Check the official registry" deep-link (user-run, official site); we never display results | NSOPW.gov + state registry (LINK-ONLY, counsel-reviewed wording) |

**FOUNDER DECISION (Caitlin, 2026-07-15) — crime + offender routing:**
- **Free tier (DECIDED):** both items render as one-click deep-links routed from the brief — the
  official crime dashboard(s) and the official registry search — so the CUSTOMER runs the lookup
  on the official site and makes their own decision. Furlong produces nothing, stores nothing,
  displays nothing. This ships without waiting on the aggregate-count question below (link wording
  still passes through LEGAL-FHA-001).
- **Paid tiers (OPEN — counsel question):** Caitlin's working hypothesis: generalized aggregates
  ("25 registered X within 5 miles") are probably defensible, while any identification ("Joe S
  lives at 123 Main St, four doors away") is clearly out. **Session counterpoint recorded for
  counsel:** the two data classes carry different risk even when aggregated —
  1. *Crime aggregates* (FBI CDE / state UCR) are public-domain federal data with no use
     restrictions: county-level counts in a paid report are LOW risk.
  2. *Offender-registry aggregates* are HIGH risk even without names: (a) producing the count
     requires querying/geocoding registry data, and several state statutes prohibit "use" of
     registry information — with **housing/accommodations among the specifically enumerated
     prohibited purposes** (e.g., California Penal Code §290.46(l)) — a derived aggregate in a
     property report is still "use in connection with housing"; (b) registry terms commonly bar
     commercial redistribution, and a computed radius count is a derived redistribution; (c)
     offender density correlates with protected-class geography, so a per-property count can
     function as a steering proxy under fair-housing analysis regardless of anonymity.
  - **Viable middle paths for counsel to weigh:** (i) licensed commercial registry data + a
    state-by-state permitted-use matrix (only where statute allows housing-adjacent use); (ii) the
    "worksheet pattern" — the paid report includes the official links, instructions, and a blank
    section the customer fills from their own official search (customer produces it; we never
    touch the data). Path (ii) is available immediately at zero legal risk.
  - No offender-count feature is built, in any tier, before counsel signs a written determination.
| Kid considerations | Playgrounds/parks within X mi, sidewalk presence, school walk distance, posted speed / road class | OSM/municipal GIS (BUILD), state DOT (BUILD) |
| Pet considerations | Municipal animal ordinances (breed rules are code facts), dog parks, nearest vet | Municipal code (BUILD), OSM (BUILD) |
| "Neighbor" reality — reframed | Lot size/density, owner-occupancy rate (tract-level Census fact), adjacent land uses, noise sources | Census ACS (BUILD), zoning/GIS (BUILD) |

**FOUNDER DECISION (Caitlin, 2026-07-15) — amenity-facts pattern APPROVED:** the three rows above
ship as objective amenity/context facts (playgrounds within a mile, sidewalks, speed limits, lot
density, owner-occupancy rate from Census) and NEVER as characterizations ("great for families,"
"quiet neighbors"). Same information, litigation-proof form. This is the binding presentation
pattern for the entire living-here section and is enforceable by the proposed
`verify:fair-housing-surface` gate (banned-vocabulary grep + section symmetry).
| HOA — and is it well-run? | HOA existence + fee + covenant highlights from recorded docs; HOA litigation count (public dockets); a "CC&R warning-signs checklist" + questions to ask the board | County records (TIER-1 pull), courts (TIER-1), checklist (HAVE: write once) |
| Traffic/noise | Adjacent road class + AADT count, rail line proximity, airport distance + flight-path fact | State DOT AADT (BUILD), FAA (BUILD) |
| Daily life | Nearest grocery (+ USDA food-access tract fact — powerful in rural KS), restaurants/bars count within X mi, parks | USDA Food Access Atlas (BUILD, free), OSM (BUILD) |
| Schools "really" | State report-card link + NCES facts (enrollment, student-teacher ratio) + nearby private/charter/co-op list; NO ratings of our own | NCES/state DOE (BUILD, free) |
| Could I grow old here? | Distance to hospital/clinic/pharmacy, broadband availability (FCC), single-story flag when known | FCC BDC (BUILD, free), OSM/HRSA (BUILD) |

## 5. Lens: RENTAL INVESTOR (long-term + short-term)

Hope to learn: what would it rent for (HUD Fair Market Rent by county/bedroom — free, official);
local vacancy/tenancy context (Census); property-management availability distance.
Wouldn't know to ask: **does the town even allow short-term rentals?** (ordinance/permit-cap status
— the STR killer question); state landlord-tenant basics as linked facts; utility split norms;
insurance class differences; seasonal demand pattern for the region.

**STR Permit Reality Profile (Caitlin add, 2026-07-15)** — allowance alone isn't the answer; the
permit's cost and friction change the math. Presented as a factual process profile, never an
"easy/hard" score:
- **Allowed?** ordinance status: permitted by right / conditional / prohibited / silent (silence
  itself flagged as a risk fact).
- **What it costs:** application fee, annual permit/renewal fee, business-license fee, lodging/
  occupancy tax rate the operator must collect, required inspection fees — each cited to the
  municipal fee schedule with as-of date.
- **How hard it is, in facts:** number of application steps; documented processing time; permit
  **cap status** (cap reached → waitlist/lottery = the deal-changer); owner-occupancy requirement;
  minimum-night rules; parking/occupancy limits; inspection + insurance minimums; renewal cadence
  and revocation triggers; neighbor-notification or public-hearing requirement (a hearing
  requirement is the single biggest friction fact).
- Free tier: allowed/conditional/prohibited/silent status + fee headline where already held.
  Tier 1: full profile with the ordinance/fee-schedule documents pulled. Tier 2: the profile
  applied to THIS property's zoning + a labeled-assumption revenue model net of permit costs and
  lodging tax (forecast doctrine).
- Sourcing: municipal code libraries (Municode/American Legal — link/licensing check), town clerk
  fee schedules; each town profiled once, cached with as-of dating and re-verified on staleness
  (render-time honesty pattern).

Paid tiers: labeled-assumption cash-flow model (forecast doctrine), comparable dispositions,
ordinance document pull.

## 6. Lens: FARM / AG OPERATOR (registry: agricultural producer, beginning farmer, rancher, agritourism)

Hope to learn: soil productivity class (HAVE: soil-map ingest), water/irrigation rights posture,
acreage usability, outbuilding reality.
Wouldn't know to ask: FSA tract/base-acre history, well/water-right transferability in that state,
broadband for precision ag (FCC), distance to elevator/co-op/large-animal vet/processor, USDA
program geography already on the parcel (HAVE), flood/drainage history (HAVE), conservation
easement encumbrances.

## 7. Lens: RURAL BUSINESS OPERATOR (registry: rural small business, OZ business, NMTC business, veteran/women/minority-owned)

Hope to learn: zoning permission for intended use, traffic counts (customers), broadband, parking.
Wouldn't know to ask: HUBZone status (HAVE) and what it wins them in federal contracting; OZ/NMTC
capital-attraction facts (HAVE); utility three-phase availability; workforce commute-shed (Census
LODES); signage/home-occupation ordinances.

## 8. Lens: COMMUNITY / NONPROFIT SPONSOR (registry: community facility sponsor, nonprofit, cooperative, tribe, historic preservation owner)

Hope to learn: eligible-use posture for community facility programs, condition/ADA reality.
Wouldn't know to ask: USDA Community Facilities geography, historic-register constraints AND
credits (HAVE: register query), environmental review triggers (NEPA-adjacent — Caitlin's domain),
prior public use / deed restrictions in disposition documents.

## 9. Tier ladder (content only — economics founder-gated)

- **Free — Place Brief:** Sections 3 + the customer's lens (self-selected, never inferred), from
  data we hold or free official sources. Unique promise: the "wouldn't know to ask" list + honest
  unknowns.
- **Tier 1 — Property Dossier:** parcel/GIS + county-records pull (taxes, HOA docs, liens),
  services/distance profile, comparable government dispositions, Navigator-guided narrative.
- **Tier 2 — Site Feasibility Desk Review:** the un-copyable tier — water/septic/well screening,
  environmental red-flag desk review, cost-to-own model (labeled assumptions), renovation scope
  framing, lens-specific deep module (STR ordinance file, ag water rights memo, HUBZone strategy).
- **Tier 3 — PE-reviewed report:** human-reviewed, signed feasibility opinion, custom questions.

## 10. Sourcing + governance

Every NEW external source above enters through the existing certified-connector / source-legal-review
gates (no ad-hoc scraping): OSM (ODbL attribution), Census/ACS, NCES, FCC BDC, USDA Food Access,
state DOT AADT, FBI CDE, county records. Google Places is display-restricted — prefer OSM.
GreatSchools et al. are licensed products — link only unless licensed.

**Blocking gates before launch:** LEGAL-FHA-001 (crime/registry/schools wording + steering review by
counsel) · forecast-labeling on any rental math · `verify:fair-housing-surface` (new) ·
place-fact-claims + disclosures (existing) must stay green on the new surface.

## 11. Build order

1. Wire what we HAVE into the free brief (flood, disasters, 4 designations, historic register,
   county resolution, source-mechanics explainers, honest-unknowns block, prose pathways line).
2. Free official sources, connector-governed: Census owner-occupancy, NCES/state DOE links, FCC
   broadband, USDA Food Access, OSM amenity distances, DOT AADT, HUD FMR.
3. Counsel package for LEGAL-FHA-001 (crime trends, registry link pattern, schools wording).
4. Lens selector + per-lens sections (user self-selects lens; default = core brief only).
5. Tier 1–3 modules behind founder-gated flags.
