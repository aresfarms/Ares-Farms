/**
 * Program Registry — the "see everything" inventory (FINANCING-INTELLIGENCE unit).
 *
 * Two jobs (spec 2026-06-10, approved by Caitlin):
 *   1. INVENTORY — enumerate every program a property could be checked against,
 *      so the full universe is reviewable before free-vs-paywall is decided
 *      (paywall_candidate ships null on every entry — decided AFTER review).
 *   2. ENGINE SUBSTRATE — each program decomposed into property-side criteria
 *      (which Furlong can verify and be definitive about) vs person-side factors
 *      (which Furlong NEVER scores or asserts — "we facilitate, we do not decide").
 *
 * THE LOCKED LANGUAGE STANDARD lives in programVerification.ts. The hard rule:
 * "the property qualifies ≠ you qualify." Person-eligibility statements are a
 * licensed act made only by a licensed professional under their own license on
 * their own page — never on a Furlong surface (Module 45; PROVIDER_PORTAL_MODEL).
 *
 * Status semantics:
 *   - "property-verifiable": EVERY property-side criterion is machine-checkable
 *     against a WIRED, cited dataset → can produce a VERIFIED match.
 *   - "cataloged": has property-side criteria but the dataset is not wired yet
 *     (or some criterion is not machine-checkable) → never rendered as a match.
 *   - "person-only": no meaningful property-side gate → informational only.
 */

export type ProgramLevel = "federal" | "state" | "grant" | "philanthropic";
export type ProgramStatus = "cataloged" | "property-verifiable" | "person-only";

export interface PropertySideCriterion {
  rule: string;
  dataset: string;
  /** Machine-checkable against a wired, cited dataset right now. */
  verifiable: boolean;
  geo_basis: "census_tract" | "county" | "address" | "state" | "property_attributes" | "n/a";
  current_rules_asOf: string;
  expiration: string | null;
}

export interface PersonSideFactor {
  factor: string;
  verifiable_by_furlong: false; // ALWAYS false — Furlong never verifies person-side
}

export interface ProgramRegistryEntry {
  program_id: string;
  name: string;
  level: ProgramLevel;
  administering_body: string;
  tranche: "A" | "B" | "C";
  property_side_criteria: PropertySideCriterion[];
  person_side_criteria: PersonSideFactor[];
  source_citation: string;
  freshness_cadence: string;
  /** FREE | PAID | null — null until Caitlin + Stuart review the catalog. */
  paywall_candidate: "FREE" | "PAID" | null;
  status: ProgramStatus;
}

export const PROGRAM_REGISTRY_VERSION = "program-registry-v0.1.0";

export const PROGRAM_REGISTRY: ProgramRegistryEntry[] = [
  // ── Tranche A — federal, property-verifiable TODAY (datasets wired) ─────────
  {
    program_id: "fed-oz",
    name: "Opportunity Zones",
    level: "federal",
    administering_body: "U.S. Treasury / CDFI Fund (IRC §1400Z-1)",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "census tract is on the designated Opportunity Zone list",
        dataset: "HUD GIS / Treasury designated-tract layer (GEOID10) — wired (property OZ snapshot)",
        verifiable: true,
        geo_basis: "census_tract",
        current_rules_asOf: "2018 designation, locked through 2028",
        expiration: "2028-12-31",
      },
    ],
    person_side_criteria: [
      { factor: "investor has eligible capital gains to deploy via a Qualified Opportunity Fund", verifiable_by_furlong: false },
      { factor: "investment structure/timing meets IRS QOF rules", verifiable_by_furlong: false },
    ],
    source_citation: "IRC §1400Z-1; HUD GIS Opportunity_Zones layer; 8,765 designated tracts",
    freshness_cadence: "static (locked designations) — re-verify at 2028 sunset",
    paywall_candidate: null,
    status: "property-verifiable",
  },
  {
    program_id: "fed-hubzone",
    name: "SBA HUBZone",
    level: "federal",
    administering_body: "U.S. Small Business Administration (13 CFR §126)",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "location is in a designated HUBZone area (QCT / non-metro county / redesignated / governor-designated / Indian land / disaster)",
        dataset: "SBA HUBZone designation layer (effective 2023-07-01) — wired (property HUBZone snapshot); expirations evaluated at render time",
        verifiable: true,
        geo_basis: "census_tract",
        current_rules_asOf: "2023-07-01",
        expiration: null, // per-area; time-limited categories carry their own expirations
      },
    ],
    person_side_criteria: [
      { factor: "business principal office located in a HUBZone", verifiable_by_furlong: false },
      { factor: "≥35% of employees reside in a HUBZone", verifiable_by_furlong: false },
      { factor: "SBA small-business certification", verifiable_by_furlong: false },
    ],
    source_citation: "13 CFR §126 / 15 U.S.C. §657a; SBA HUBZone Map (maps.certify.sba.gov)",
    freshness_cadence: "periodic SBA updates; expirations evaluated at render time; verify current with SBA",
    paywall_candidate: null,
    status: "property-verifiable",
  },

  // ── Tranche A — federal, cataloged (real property-side gate; dataset NOT wired yet) ──
  {
    program_id: "fed-usda-rural",
    name: "USDA Rural Area Eligibility",
    level: "federal",
    administering_body: "USDA Rural Development",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "property is within a USDA-eligible rural area",
        dataset: "USDA RD eligibility map — registered source, NOT yet wired as a property snapshot",
        verifiable: false,
        geo_basis: "address",
        current_rules_asOf: "reviewed periodically with census updates",
        expiration: null,
      },
    ],
    person_side_criteria: [{ factor: "household income within USDA limits", verifiable_by_furlong: false }],
    source_citation: "USDA RD eligibility (eligibility.sc.egov.usda.gov)",
    freshness_cadence: "periodic — wire dataset before promoting to property-verifiable",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-nmtc",
    name: "New Markets Tax Credit (low-income community)",
    level: "federal",
    administering_body: "CDFI Fund / U.S. Treasury",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "census tract qualifies as a low-income community (poverty/income thresholds)",
        dataset: "NMTC Qualified Tracts 2020 (CDFI 2016\u20132020 ACS) \u2014 WIRED (property NMTC snapshot)",
        verifiable: true,
        geo_basis: "census_tract",
        current_rules_asOf: "ACS-based; updated with census releases",
        expiration: null,
      },
    ],
    person_side_criteria: [{ factor: "investment via a certified CDE with NMTC allocation", verifiable_by_furlong: false }],
    source_citation: "CDFI Fund NMTC program (cdfifund.gov)",
    freshness_cadence: "with ACS updates — refresh snapshot with the property ingest",
    paywall_candidate: null,
    status: "property-verifiable",
  },
  {
    program_id: "fed-fema-flood",
    name: "FEMA Flood Zone determination",
    level: "federal",
    administering_body: "FEMA",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "property location's flood-zone designation (informational/insurance-relevant fact)",
        dataset: "FEMA NFHL layer 28 — WIRED (property flood snapshot); renders as a place-fact badge, NOT a program match (informational, not a benefit gate)",
        verifiable: true,
        geo_basis: "address",
        current_rules_asOf: "per-community map effective dates",
        expiration: null,
      },
    ],
    person_side_criteria: [{ factor: "insurance/lender requirements based on the determination", verifiable_by_furlong: false }],
    source_citation: "FEMA National Flood Hazard Layer",
    freshness_cadence: "per FIRM updates — wire dataset before promoting",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-historic",
    name: "Historic district / National Register (rehab tax credit property gate)",
    level: "federal",
    administering_body: "NPS / SHPO",
    tranche: "A",
    property_side_criteria: [
      {
        rule: "property is within a National Register listed area",
        dataset: "NPS NRHP polygons (mapservices.nps.gov) — WIRED (property flood/historic snapshot)",
        verifiable: true,
        geo_basis: "address",
        current_rules_asOf: "rolling listings",
        expiration: null,
      },
    ],
    person_side_criteria: [{ factor: "qualified rehabilitation expenditures + Part 1/2/3 approvals", verifiable_by_furlong: false }],
    source_citation: "36 CFR §60; NPS National Register",
    freshness_cadence: "rolling — refresh snapshot with the property ingest",
    paywall_candidate: null,
    status: "property-verifiable",
  },

  // ── Tranche A — financing programs with PARTIAL property-side gates ─────────
  // Property type is machine-checkable, but each also carries property-side
  // condition/appraisal standards that are NOT machine-checkable → they cannot
  // produce a definitive verified match; cataloged (renders only as the existing
  // illustrative "may fit" hedge, never as "verified").
  {
    program_id: "fed-fha-203b",
    name: "FHA 203(b) (property-side gate)",
    level: "federal",
    administering_body: "HUD / FHA",
    tranche: "A",
    property_side_criteria: [
      { rule: "1–4 unit residential property", dataset: "listing propertyType (wired)", verifiable: true, geo_basis: "property_attributes", current_rules_asOf: "HUD 4000.1", expiration: null },
      { rule: "meets FHA minimum property standards (appraisal/condition)", dataset: "FHA appraisal — not machine-checkable", verifiable: false, geo_basis: "property_attributes", current_rules_asOf: "HUD 4000.1", expiration: null },
    ],
    person_side_criteria: [{ factor: "borrower credit/income/occupancy per FHA underwriting", verifiable_by_furlong: false }],
    source_citation: "HUD Handbook 4000.1",
    freshness_cadence: "per HUD handbook updates",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-fha-203k",
    name: "FHA 203(k) rehab (property-side gate)",
    level: "federal",
    administering_body: "HUD / FHA",
    tranche: "A",
    property_side_criteria: [
      { rule: "1–4 unit residential property eligible for rehab financing", dataset: "listing propertyType (wired)", verifiable: true, geo_basis: "property_attributes", current_rules_asOf: "HUD 4000.1", expiration: null },
      { rule: "rehab scope within 203(k) program limits", dataset: "scope-dependent — not machine-checkable", verifiable: false, geo_basis: "property_attributes", current_rules_asOf: "HUD 4000.1", expiration: null },
    ],
    person_side_criteria: [{ factor: "borrower qualification per FHA underwriting", verifiable_by_furlong: false }],
    source_citation: "HUD Handbook 4000.1 (203(k))",
    freshness_cadence: "per HUD handbook updates",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-usda-502",
    name: "USDA Section 502 (property-side gate)",
    level: "federal",
    administering_body: "USDA Rural Development",
    tranche: "A",
    property_side_criteria: [
      { rule: "property in USDA-eligible rural area", dataset: "USDA RD eligibility map — NOT yet wired", verifiable: false, geo_basis: "address", current_rules_asOf: "periodic", expiration: null },
      { rule: "modest single-family dwelling standards", dataset: "appraisal — not machine-checkable", verifiable: false, geo_basis: "property_attributes", current_rules_asOf: "7 CFR 3550", expiration: null },
    ],
    person_side_criteria: [{ factor: "household income within program limits", verifiable_by_furlong: false }],
    source_citation: "7 CFR Part 3550",
    freshness_cadence: "with USDA map updates",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-usda-504",
    name: "USDA Section 504 repair (property-side gate)",
    level: "federal",
    administering_body: "USDA Rural Development",
    tranche: "A",
    property_side_criteria: [
      { rule: "property in USDA-eligible rural area", dataset: "USDA RD eligibility map — NOT yet wired", verifiable: false, geo_basis: "address", current_rules_asOf: "periodic", expiration: null },
    ],
    person_side_criteria: [{ factor: "very-low-income owner-occupant; age 62+ for grants", verifiable_by_furlong: false }],
    source_citation: "7 CFR Part 3550 (504)",
    freshness_cadence: "with USDA map updates",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-sba-504",
    name: "SBA 504 (property-side gate)",
    level: "federal",
    administering_body: "U.S. Small Business Administration",
    tranche: "A",
    property_side_criteria: [
      { rule: "owner-occupied commercial real estate / major fixed assets", dataset: "listing propertyType (wired) — occupancy not machine-checkable", verifiable: false, geo_basis: "property_attributes", current_rules_asOf: "13 CFR 120", expiration: null },
    ],
    person_side_criteria: [{ factor: "small-business size standards; job-creation/public-policy goals", verifiable_by_furlong: false }],
    source_citation: "13 CFR Part 120 (504)",
    freshness_cadence: "per SBA SOP updates",
    paywall_candidate: null,
    status: "cataloged",
  },
  {
    program_id: "fed-sba-7a",
    name: "SBA 7(a) (property-side gate)",
    level: "federal",
    administering_body: "U.S. Small Business Administration",
    tranche: "A",
    property_side_criteria: [
      { rule: "business-use real estate (when financing real property)", dataset: "listing propertyType (wired) — use not machine-checkable", verifiable: false, geo_basis: "property_attributes", current_rules_asOf: "13 CFR 120", expiration: null },
    ],
    person_side_criteria: [{ factor: "small-business eligibility + lender credit decision", verifiable_by_furlong: false }],
    source_citation: "13 CFR Part 120 (7(a))",
    freshness_cadence: "per SBA SOP updates",
    paywall_candidate: null,
    status: "cataloged",
  },

  // ── Tranche B — state programs (50-state research PENDING; structure only) ──
  {
    program_id: "state-incentives-template",
    name: "State incentive programs (per-state research pending)",
    level: "state",
    administering_body: "varies by state (HFA / economic development agencies)",
    tranche: "B",
    property_side_criteria: [
      { rule: "varies — often county/zone/use-based; research per state", dataset: "per-state — NOT researched yet", verifiable: false, geo_basis: "state", current_rules_asOf: "n/a (pending)", expiration: null },
    ],
    person_side_criteria: [{ factor: "varies by program (first-time-buyer, income, occupancy)", verifiable_by_furlong: false }],
    source_citation: "Tranche B — 50-state research deliverable, not yet performed",
    freshness_cadence: "per state",
    paywall_candidate: null,
    status: "cataloged",
  },

  // ── Tranche C — grants + philanthropic (mostly person-only; research PENDING) ──
  {
    program_id: "grants-philanthropic-template",
    name: "Federal/state grants + philanthropic programs (research pending)",
    level: "grant",
    administering_body: "varies (agencies, foundations)",
    tranche: "C",
    property_side_criteria: [],
    person_side_criteria: [{ factor: "mission/person-based eligibility — agency or foundation decision", verifiable_by_furlong: false }],
    source_citation: "Tranche C — research deliverable, not yet performed",
    freshness_cadence: "per program",
    paywall_candidate: null,
    status: "person-only",
  },
];

/**
 * Registry validation (the verify gate):
 *  - every entry has a source citation + current-rules date on each criterion,
 *  - "property-verifiable" ⇢ ≥1 criterion AND every criterion machine-checkable,
 *  - person-side factors are never Furlong-verifiable,
 *  - paywall_candidate is null until the catalog review (this build never sets it).
 */
export function validateProgramRegistry(): string[] {
  const errs: string[] = [];
  for (const e of PROGRAM_REGISTRY) {
    if (!e.source_citation) errs.push(`${e.program_id}: missing source_citation`);
    for (const c of e.property_side_criteria) {
      if (!c.current_rules_asOf) errs.push(`${e.program_id}: criterion missing current_rules_asOf`);
      if (!c.dataset) errs.push(`${e.program_id}: criterion missing dataset`);
    }
    if (e.status === "property-verifiable") {
      if (e.property_side_criteria.length === 0)
        errs.push(`${e.program_id}: property-verifiable but no property-side criteria`);
      if (!e.property_side_criteria.every((c) => c.verifiable))
        errs.push(`${e.program_id}: property-verifiable but has non-machine-checkable criteria — must be "cataloged"`);
    }
    if (e.status === "person-only" && e.property_side_criteria.some((c) => c.verifiable))
      errs.push(`${e.program_id}: person-only but has a verifiable property-side criterion`);
    for (const p of e.person_side_criteria) {
      if ((p.verifiable_by_furlong as boolean) !== false)
        errs.push(`${e.program_id}: person-side factor marked Furlong-verifiable — never allowed`);
    }
    if (e.paywall_candidate !== null)
      errs.push(`${e.program_id}: paywall_candidate set — decided only AFTER catalog review`);
  }
  return errs;
}
