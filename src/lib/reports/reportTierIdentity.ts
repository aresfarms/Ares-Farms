/**
 * Report Tier Identity — the visual + narrative personality of each report tier
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15 value ladder; Caitlin direction
 * 2026-07-16: each tier must LOOK and FEEL different, and the free report must
 * make a customer want to come back for the paid ones).
 *
 * Design intent:
 *   free          — clean, generous, trustworthy. Navy/teal. The document a
 *                   customer keeps AND shares. Ends with an honest, named
 *                   preview of what the paid tiers add (no prices — tier
 *                   economics remain founder-gated; the teaser sells substance,
 *                   not a checkout).
 *   paid          — the "Institutional Coordination Report": gold-on-navy,
 *                   double-ruled, denser sections — reads like a banker's
 *                   package, because that's what it feeds.
 *   environmental — the "Environmental Documentation Readiness" review: field
 *                   green, checklist cadence, engineering-report tone.
 *
 * This module is the SINGLE source of tier look/feel for the PDF generator,
 * the HTML export, and the on-screen preview — the three must never drift.
 */

export type ReportTierId = "free" | "paid" | "environmental";

export interface ReportTierIdentity {
  id: ReportTierId;
  /** Customer-facing product name on the cover. */
  displayName: string;
  /** One-line promise under the title. */
  tagline: string;
  /** Cover corner badge text. */
  coverBadge: string;
  /** Primary accent (section headings, rules, tier chip). */
  accent: string;
  /** Soft tint for cards/chips derived from the accent. */
  accentSoft: string;
  /** Heading ink. */
  ink: string;
  /** Horizontal-rule treatment under the header. */
  ruleStyle: "single" | "double" | "thick";
  /** Closing footer line — tier-specific voice. */
  footerLine: string;
  /**
   * FREE TIER ONLY: the honest upgrade preview — named locked sections with
   * one-line substance descriptions. No prices, no checkout language (tier
   * economics are founder-gated). Sells the substance, invites the return.
   */
  nextTierTeaser: {
    heading: string;
    intro: string;
    items: Array<{ name: string; adds: string }>;
    closing: string;
  } | null;
}

const IDENTITIES: Record<ReportTierId, ReportTierIdentity> = {
  free: {
    id: "free",
    displayName: "Furlong Place Brief",
    tagline: "The facts of this place — sourced, dated, and honest about what isn't known yet.",
    coverBadge: "COMPLIMENTARY PLACE BRIEF",
    accent: "#0f766e",
    accentSoft: "#e8f4f2",
    ink: "#162033",
    ruleStyle: "single",
    footerLine:
      "This Place Brief is free, and always will be. It is the beginning of the file — not the end of it.",
    nextTierTeaser: {
      heading: "Where the file goes next",
      intro:
        "This brief established the place facts. Two deeper reviews build on it when you are ready — " +
        "each picks up exactly where this document stops:",
      items: [
        {
          name: "Institutional Coordination Report",
          adds:
            "The full ranked financing-lane analysis with fit reasons and missing-item lists, the " +
            "complete question set a lender will ask (answered in advance), county-records pulls " +
            "(taxes, liens, recorded covenants), and packaging formatted for handing directly to a " +
            "lender or institution.",
        },
        {
          name: "Environmental Documentation Readiness Review",
          adds:
            "The site-side review this property has not had yet: water/well/septic screening " +
            "framework, environmental red-flag desk review, documentation checklist mapped to what " +
            "agencies and lenders actually request, and a pathway to professional-engineer review.",
        },
      ],
      closing:
        "Both reviews stay anchored to this property and this county — nothing generic, nothing " +
        "resold. Every tier above the free brief also includes the Furlong newsletter automatically " +
        "— no separate signup. When tier access opens, your Place Brief carries forward into them " +
        "unchanged.",
    },
  },
  paid: {
    id: "paid",
    displayName: "Institutional Coordination Report",
    tagline: "The property file, packaged the way an institution expects to receive it.",
    coverBadge: "INSTITUTIONAL COORDINATION",
    accent: "#9c6b1b",
    accentSoft: "#faf3e6",
    ink: "#12233d",
    ruleStyle: "double",
    footerLine:
      "Prepared for institutional coordination — advisory analysis; human review remains required " +
      "before any decision-grade use.",
    nextTierTeaser: null,
  },
  environmental: {
    id: "environmental",
    displayName: "Environmental Documentation Readiness Review",
    tagline: "Site-side reality, documented before it becomes a surprise.",
    coverBadge: "ENVIRONMENTAL READINESS",
    accent: "#2f6b3a",
    accentSoft: "#ecf4ed",
    ink: "#1a2b1e",
    ruleStyle: "thick",
    footerLine:
      "Prepared under Furlong's environmental documentation framework — advisory desk review; " +
      "professional-engineer review is a separate, explicit engagement.",
    nextTierTeaser: null,
  },
};

export function reportTierIdentity(tierId: string): ReportTierIdentity {
  return IDENTITIES[(tierId as ReportTierId) in IDENTITIES ? (tierId as ReportTierId) : "free"];
}
