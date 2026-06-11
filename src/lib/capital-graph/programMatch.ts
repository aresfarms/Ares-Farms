/**
 * Property → program matching — PROPERTY-DRIVEN, illustrative, cited.
 *
 * Built fresh on the capital-graph taxonomy. Matches a PROPERTY's public
 * attributes (type, source, state) to capital-graph categories it MAY fit — it
 * does NOT score an applicant's credit/finances. (The orphaned applicant credit
 * scorer in src/services/eligibility, which emits "supports lending approval",
 * is deliberately NOT used — that would be an eligibility determination Furlong
 * never makes.)
 *
 * Output is strictly "may fit": each match cites the program category + the
 * exact property criteria it matched on + a condition where applicability is
 * location/use dependent. Never approval / eligible / qualified / guaranteed.
 *
 * Input is OPAQUE (no import of the property unit's types) so financing-
 * intelligence stays separable from source-intelligence.
 */

import { CAPITAL_CATEGORY_GOVERNANCE, type CapitalCategoryId } from "./capitalGraphRuntime";

export interface PropertyMatchInput {
  propertyType: string;
  state: string;
  sourceId: string; // "usda" | "hud" | …
  priceBand?: string;
  /**
   * VERIFIED place-fact determination, passed opaquely by the property surface
   * (from its frozen OZ snapshot). When present (an 11-digit tract GEOID), the
   * property's census tract IS a designated Opportunity Zone — the OZ program
   * renders as a positive fact. When absent (not designated, OR geocode/lookup
   * uncertain), the OZ program is OMITTED ENTIRELY — never a category-level
   * "only if your tract qualifies" conditional (Caitlin directive 2026-06-10).
   */
  verifiedOzTractId?: string | null;
  /** As-of date of the OZ place-fact snapshot the determination came from. */
  ozAsOf?: string | null;
}

export interface ProgramMatch {
  categoryId: string;
  label: string;
  /** The property criteria that produced this match — the "why it's matched". */
  matchedOn: string[];
  /** Illustrative rationale, from the category's own description. */
  mayFit: string;
  /** Present when applicability depends on location/use we can't confirm here. */
  condition?: string;
  /** Program + controlling doctrine reference. */
  citation: string;
}

export const PROGRAM_MATCH_DISCLAIMER =
  "Illustrative only — these are programs a property like this may fit. Furlong does not " +
  "determine eligibility, approve, or guarantee anything. Confirm with the agency or lender.";

const BY_ID = new Map(CAPITAL_CATEGORY_GOVERNANCE.map((c) => [c.id, c]));

function describe(id: CapitalCategoryId): { label: string; mayFit: string; citation: string } | null {
  const c = BY_ID.get(id);
  if (!c) return null;
  return {
    label: c.label,
    mayFit: `May fit ${c.label}: ${c.description}`,
    citation: `${c.label} · ${c.doctrineRefs[0] ?? "capital-graph"}`,
  };
}

/**
 * Programs a property MAY fit, from its public attributes. Deterministic,
 * property-driven, capped to the most relevant few.
 */
export function matchPropertyToPrograms(input: PropertyMatchInput): ProgramMatch[] {
  const t = (input.propertyType || "").toLowerCase();
  const src = (input.sourceId || "").toLowerCase();
  const isAg = /farm|ranch|agric|land|lot|vacant/.test(t);
  const isHome = /home|house|multi|resid/.test(t);
  const state = input.state || "your state";

  const out: ProgramMatch[] = [];
  const add = (id: CapitalCategoryId, matchedOn: string[], condition?: string) => {
    const d = describe(id);
    if (d && !out.some((o) => o.categoryId === id)) {
      out.push({ categoryId: id, label: d.label, matchedOn, mayFit: d.mayFit, condition, citation: d.citation });
    }
  };

  if (src === "usda") {
    add("USDA", ["listed by USDA Rural Development / FSA", "rural-development source"]);
    add("FSA", ["USDA / FSA source"], isAg ? undefined : "for any land or operating component");
  }
  if (isAg) {
    add("FSA", ["agricultural / land property"]);
    add("REAP", ["agricultural / rural property"], "for on-site renewable-energy or efficiency work");
  }
  if (src === "hud" || isHome) {
    add(
      "STATE_INCENTIVE_PROGRAMS",
      ["single-family home", `state: ${state}`],
      "state first-time-buyer / rehab incentives vary by state",
    );
  }
  // Zone/place program — POSITIVE VERIFIED DETERMINATION ONLY (2026-06-10
  // directive). Renders solely when the property surface passed a verified
  // tract GEOID from its place-fact snapshot; omitted entirely otherwise
  // (not designated, or geocode/lookup uncertain). The legacy category-level
  // "only if the tract qualifies" conditional is REMOVED — an unverified zone
  // must not appear at all.
  const tract = (input.verifiedOzTractId ?? "").trim();
  if (/^\d{11}$/.test(tract)) {
    add("OPPORTUNITY_ZONES", [
      `in a designated Opportunity Zone — census tract ${tract}` +
        (input.ozAsOf ? ` · as of ${input.ozAsOf}` : ""),
    ]);
  }

  return out.slice(0, 4);
}
