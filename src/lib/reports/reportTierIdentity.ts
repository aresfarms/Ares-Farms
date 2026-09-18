/**
 * Report Tier Identity — the visual + narrative personality of each report tier
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15 value ladder; Caitlin direction
 * 2026-07-16: each tier must LOOK and FEEL different, and the free report must
 * make a customer want to come back for the paid ones).
 *
 * Design intent:
 *   free          — the useful Furlong Property Snapshot.
 *   paid          — legacy internal id for the automated Furlong Property Report.
 *   environmental — legacy internal id for the human-reviewed Furlong Property
 *                   Decision Report. Environmental review remains one section,
 *                   not a separate public report tier.
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
  /** OPEN SNAPSHOT ONLY: the exact next-layer preview. */
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
    displayName: "Furlong Property Snapshot",
    tagline:
      "The useful first screen — sourced, dated, and honest about what is not known yet.",
    coverBadge: "FURLONG FREE PROPERTY SNAPSHOT",
    accent: "#0f766e",
    accentSoft: "#e8f4f2",
    ink: "#162033",
    ruleStyle: "single",
    footerLine:
      "This snapshot is free. Known hazards, uncertainty, and material missing evidence are never hidden behind payment.",
    nextTierTeaser: {
      heading: "Choose only the next answer you need",
      intro:
        "The snapshot established the first property facts. Furlong offers two paid report levels — no overlapping middle tier:",
      items: [
        {
          name: "Furlong Property Report — proposed $49 one-time price",
          adds: "An immediate, version-frozen automated report with preliminary use, economics, financing, sources, assumptions, confidence, and missing evidence.",
        },
        {
          name: "Furlong Property Decision Report — proposed $249 base-scope price",
          adds: "Human review, ranked scenarios, acquisition and offer boundaries, sensitivities, long-range projections, and an explicit proceed, renegotiate, investigate, or walk-away verdict.",
        },
      ],
      closing:
        "The portal recommends the smallest sufficient level and may say not to buy. Known hazards and uncertainty stay visible for free. Professional field, laboratory, environmental, and engineering work is separately scoped. Furlong never earns based on a loan outcome.",
    },
  },
  paid: {
    id: "paid",
    displayName: "Furlong Property Report",
    tagline:
      "The automated property and enterprise screen — complete, sourced, and frozen at delivery.",
    coverBadge: "FURLONG PROPERTY REPORT",
    accent: "#9c6b1b",
    accentSoft: "#faf3e6",
    ink: "#12233d",
    ruleStyle: "double",
    footerLine:
      "Automated advisory analysis — not an appraisal, professional report, borrower underwriting, or guaranteed outcome.",
    nextTierTeaser: null,
  },
  environmental: {
    id: "environmental",
    displayName: "Furlong Property Decision Report",
    tagline:
      "The reviewed acquisition decision — what works, at what boundary, and what must happen next.",
    coverBadge: "HUMAN-REVIEWED DECISION REPORT",
    accent: "#2f6b3a",
    accentSoft: "#ecf4ed",
    ink: "#1a2b1e",
    ruleStyle: "thick",
    footerLine:
      "Human-reviewed advisory analysis — professional field services, official determinations, lender approval, and stamped plans remain separate engagements.",
    nextTierTeaser: null,
  },
};

export function reportTierIdentity(tierId: string): ReportTierIdentity {
  return IDENTITIES[
    (tierId as ReportTierId) in IDENTITIES ? (tierId as ReportTierId) : "free"
  ];
}
