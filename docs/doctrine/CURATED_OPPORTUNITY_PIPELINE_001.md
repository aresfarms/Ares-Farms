# CURATED OPPORTUNITY PIPELINE — COP-001

- **Owner:** Caitlin
- **Reviewers:** Stuart Fraass, Frances Fraass
- **Target platform:** Furlong Hub
- **Status:** Build-Later / Governance Approved Concept
- **Registry:** `src/lib/platform/curatedOpportunityPipeline.ts`
- **Gate:** `npm run verify:curated-opportunity`
- **Activation flag:** `COP_PIPELINE_LIVE = false` (nothing renders)

> **Purpose:** create a human-guided opportunity discovery and intelligence
> pipeline **without becoming a listing portal.**

This is a doctrine and contract only. No feature flow, no public surface, and
no automation is activated by this capture. It records the rules any future
curated-opportunity build must satisfy, and it composes with — never weakens —
the existing discovery-honesty stance, the anti-portal/partner-not-compete
position, the membership-shelving rule, and the financing-node gating.

## 1. Core Principle

Furlong is **not** a listing platform. Furlong is a **Decision Intelligence
Platform.** The purpose of the Curated Opportunity Pipeline is not to sell
properties. The purpose is to surface interesting opportunities and explain:

- what they are;
- why they matter;
- what they could become;
- what risks exist;
- what ownership may actually look like.

**The property is the starting point. The intelligence is the product.**

## 2. Opportunity Sources

Candidates may originate from (discovery only — attribution required, §8):

- **Public:** broker websites, Realtor, Zillow, Redfin, Crexi, LoopNet,
  LandWatch, Land.com, Lands of America, auction platforms, county surplus
  sales, public notices.
- **Government:** USDA, FSA, SBA, EDA, state economic-development agencies,
  state land banks, tax sales, historic-preservation registries.
- **Community:** user submissions, broker submissions, lender submissions,
  professional module referrals.
- **Internal discovery:** AI-assisted opportunity detection, watchlists, saved
  searches, program-specific discovery feeds.

## 3. Human Selection Rule

Automation may discover opportunities. **Humans decide what becomes featured.**
No candidate becomes a Furlong Featured Opportunity without human review.

## 4. Weekly Curation Model

- **Caitlin** — environmental, compliance, agricultural, unusual opportunities,
  adaptive reuse, stewardship potential.
- **Stuart** — financing pathways, capital stack, business viability, lender
  attractiveness, transaction feasibility.
- **Frances** — public appeal, community value, story potential, communications
  impact, audience interest.

Volume targets: each reviewer may nominate **5–10/week**; reviewed pipeline
**15–30/week**; featured/published set **5–15/week**.

## 5. Opportunity Card Structure

Every Featured Opportunity receives:

1. **Property Snapshot** — title, state, county, asking price (if known), asset
   category, source attribution, source link.
2. **Why It Caught Our Attention** — human-written.
3. **What It Could Become** — possible uses.
4. **What Could Go Wrong** — known risks.
5. **Ownership Reality** — expected responsibilities.
6. **Opportunity Cost** — alternatives and tradeoffs.
7. **Financing Pathways** — general pathway discussion only. **No qualification
   claims.**
8. **Due Diligence Questions** — questions the user should investigate.
9. **Similar Alternatives** — comparable opportunity categories.
10. **Who This May Fit** — general user archetypes.
11. **Who Should Pause** — situations where caution may be appropriate.

## 6. Automation Roadmap

- **Phase 1** — human curation only.
- **Phase 2** — AI-assisted candidate queue. Automation proposes. Humans approve.
- **Phase 3** — scoring engine. Automation ranks. **Humans still approve.**

Potential Phase-3 scoring factors: opportunity score, affordability score,
financing complexity, environmental complexity, compliance complexity,
adaptive-reuse potential, community value, story appeal, rarity, resilience
potential.

## 7. Membership Integration

- **Free tier:** weekly featured opportunities, basic intelligence, limited
  comparisons.
- **Paid tier:** expanded opportunity library, deeper ownership analysis,
  opportunity-cost analysis, resilience modeling, alternative pathways,
  enhanced comparison tools.

**The subscription is for intelligence. Not for access to listings.**

> Monetization itself remains shelved until the founders + counsel set the
> economics. These tiers are the doctrine shape only — not an activation.

## 8. Source Attribution Rule

Every opportunity must maintain **source attribution**, **source link**, and
**discovery date**. Furlong must not present third-party opportunities as
Furlong-owned listings.

## 9. Anti-Portal Rule

Do **not** build: a Zillow clone, Realtor clone, Crexi clone, LoopNet clone, or
MLS replacement. The Curated Opportunity Pipeline exists to help users discover
and understand opportunities. It does not exist to replace listing platforms.

## 10. Constitutional Lock

> **Listing platforms show opportunities. Furlong explains them.
> The property begins the conversation. The intelligence creates the value.**

## 11. Build-Later Gate

Until the founders explicitly authorize a build, this doctrine ships as registry
+ doc + gate only:

- `COP_PIPELINE_LIVE = false` — no curated-opportunity flow may render.
- Human selection (§3) is mandatory at every automation phase (§6).
- `opportunityHonorsDoctrine()` requires human approval + full source
  attribution + not-Furlong-owned framing before any candidate could be
  featured.
- Composes with and never weakens: discovery honesty, the anti-portal /
  partner-not-compete stance, membership shelving, financing-node gating.
