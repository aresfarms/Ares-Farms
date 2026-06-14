/**
 * CURATED-OPPORTUNITY-PIPELINE-001 (COP-001) — registry + governance contract
 * (doctrine-only, Build-Later / Governance Approved Concept).
 * Doc: docs/doctrine/CURATED_OPPORTUNITY_PIPELINE_001.md
 *
 * Owner: Caitlin.  Reviewers: Stuart Fraass, Frances Fraass.
 * Target surface: Furlong Hub (the [[furlong-module-spine]] discovery layer).
 *
 * CORE PRINCIPLE: Furlong is NOT a listing platform — it is a Decision
 * Intelligence Platform. The Curated Opportunity Pipeline surfaces interesting
 * opportunities and EXPLAINS them (what they are, why they matter, what they
 * could become, what risks exist, what ownership really looks like). The
 * property is the starting point; the intelligence is the product.
 *
 * CONSTITUTIONAL LOCK (verbatim, §10):
 *   "Listing platforms show opportunities. Furlong explains them.
 *    The property begins the conversation. The intelligence creates the value."
 *
 * HUMAN SELECTION RULE (§3): automation may DISCOVER opportunities; humans
 * decide what becomes FEATURED. No candidate becomes a Furlong Featured
 * Opportunity without human review — at every automation phase.
 *
 * NOTHING in this module is activated. COP_PIPELINE_LIVE stays false. This is
 * the contract any future curated-opportunity build must satisfy; it composes
 * with — and never weakens — discovery honesty, the anti-portal stance
 * (browse stays secondary; listing feeds are licensed partnership, not
 * scraping), the membership-shelving rule (no monetization before the founders
 * + counsel set economics), and the financing-node gating.
 */

export const COP_DOCTRINE_ID = "CURATED-OPPORTUNITY-PIPELINE-001";

/** Master-gate: no curated-opportunity feature flow may render while false. */
export const COP_PIPELINE_LIVE = false;

/** §1 — what the platform IS / IS NOT. */
export const COP_CORE_PRINCIPLE = {
  isNot: "a listing platform",
  is: "a Decision Intelligence Platform",
  productIsThe: "intelligence",
  startingPointIsThe: "property",
  explains: [
    "what they are",
    "why they matter",
    "what they could become",
    "what risks exist",
    "what ownership may actually look like",
  ],
} as const;

/** §2 — candidate source families (DISCOVERY ONLY; attribution required §8). */
export const COP_OPPORTUNITY_SOURCES = {
  public: [
    "broker websites", "Realtor", "Zillow", "Redfin", "Crexi", "LoopNet",
    "LandWatch", "Land.com", "Lands of America", "auction platforms",
    "county surplus sales", "public notices",
  ],
  government: [
    "USDA", "FSA", "SBA", "EDA", "state economic-development agencies",
    "state land banks", "tax sales", "historic-preservation registries",
  ],
  community: [
    "user submissions", "broker submissions", "lender submissions",
    "professional module referrals",
  ],
  internalDiscovery: [
    "AI-assisted opportunity detection", "watchlists", "saved searches",
    "program-specific discovery feeds",
  ],
} as const;

/** §3 — automation discovers; humans decide what is featured. Non-negotiable. */
export const COP_HUMAN_SELECTION_RULE =
  "Automation may discover opportunities. Humans decide what becomes featured. " +
  "No candidate becomes a Furlong Featured Opportunity without human review.";

/** §4 — weekly curation model: who reviews for what, and the volume targets. */
export const COP_WEEKLY_CURATION = {
  reviewers: {
    Caitlin: [
      "environmental", "compliance", "agricultural", "unusual opportunities",
      "adaptive reuse", "stewardship potential",
    ],
    Stuart: [
      "financing pathways", "capital stack", "business viability",
      "lender attractiveness", "transaction feasibility",
    ],
    Frances: [
      "public appeal", "community value", "story potential",
      "communications impact", "audience interest",
    ],
  },
  perReviewerNominationsPerWeek: { min: 5, max: 10 },
  reviewedPipelinePerWeek: { min: 15, max: 30 },
  featuredPublishedPerWeek: { min: 5, max: 15 },
} as const;

/** §5 — required structure of every Featured Opportunity card. */
export const COP_OPPORTUNITY_CARD_SECTIONS = [
  "Property Snapshot",      // title, state, county, asking price (if known),
                            // asset category, source attribution, source link
  "Why It Caught Our Attention", // human-written
  "What It Could Become",
  "What Could Go Wrong",
  "Ownership Reality",
  "Opportunity Cost",
  "Financing Pathways",     // general pathway discussion only; NO qualification claims
  "Due Diligence Questions",
  "Similar Alternatives",
  "Who This May Fit",
  "Who Should Pause",
] as const;

export const COP_PROPERTY_SNAPSHOT_FIELDS = [
  "title", "state", "county", "asking price (if known)", "asset category",
  "source attribution", "source link",
] as const;

/** §6 — automation roadmap. Humans approve at EVERY phase. */
export const COP_AUTOMATION_ROADMAP = [
  { phase: 1, mode: "Human curation only", humansApprove: true },
  { phase: 2, mode: "AI-assisted candidate queue — automation proposes, humans approve", humansApprove: true },
  { phase: 3, mode: "Scoring engine — automation ranks, humans still approve", humansApprove: true },
] as const;

export const COP_PHASE3_SCORING_FACTORS = [
  "opportunity score", "affordability score", "financing complexity",
  "environmental complexity", "compliance complexity", "adaptive-reuse potential",
  "community value", "story appeal", "rarity", "resilience potential",
] as const;

/**
 * §7 — membership integration. The subscription is for INTELLIGENCE, not for
 * access to listings. NOTE: monetization itself remains shelved until the
 * founders + counsel set economics ([[membership-tiers-shelved]]); these tiers
 * are the doctrine shape only, not an activation.
 */
export const COP_MEMBERSHIP = {
  subscriptionIsFor: "intelligence",
  subscriptionIsNotFor: "access to listings",
  freeTier: [
    "weekly featured opportunities", "basic intelligence", "limited comparisons",
  ],
  paidTier: [
    "expanded opportunity library", "deeper ownership analysis",
    "opportunity-cost analysis", "resilience modeling", "alternative pathways",
    "enhanced comparison tools",
  ],
} as const;

/** §8 — source attribution is mandatory on every opportunity. */
export const COP_SOURCE_ATTRIBUTION_REQUIRED = [
  "source attribution", "source link", "discovery date",
] as const;
export const COP_SOURCE_ATTRIBUTION_RULE =
  "Furlong must not present third-party opportunities as Furlong-owned listings.";

/** §9 — anti-portal rule: what must NOT be built. */
export const COP_ANTI_PORTAL_FORBIDDEN = [
  "Zillow clone", "Realtor clone", "Crexi clone", "LoopNet clone",
  "MLS replacement",
] as const;
export const COP_ANTI_PORTAL_RULE =
  "The Curated Opportunity Pipeline exists to help users discover and " +
  "understand opportunities. It does not exist to replace listing platforms.";

/** §10 — constitutional lock, verbatim. */
export const COP_CONSTITUTIONAL_LOCK =
  "Listing platforms show opportunities. Furlong explains them. " +
  "The property begins the conversation. The intelligence creates the value.";

/**
 * A would-be featured opportunity honors the doctrine only if a human approved
 * it AND it carries full source attribution AND it is not framed as a
 * Furlong-owned listing. Pure predicate — no I/O, deterministic, replay-safe.
 */
export function opportunityHonorsDoctrine(candidate: {
  humanApproved?: boolean;
  sourceAttribution?: string | null;
  sourceLink?: string | null;
  discoveryDate?: string | null;
  presentedAsFurlongOwnedListing?: boolean;
}): boolean {
  return (
    candidate.humanApproved === true &&
    Boolean(candidate.sourceAttribution) &&
    Boolean(candidate.sourceLink) &&
    Boolean(candidate.discoveryDate) &&
    candidate.presentedAsFurlongOwnedListing !== true
  );
}
