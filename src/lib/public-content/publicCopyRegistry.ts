/**
 * publicCopyRegistry — Build 53
 *
 * CANONICAL source of truth for all approved public-facing copy.
 *
 * Every public-facing page MUST import its user-visible text from this
 * registry rather than declaring inline constants. This allows:
 *   1. Single-location copy review and approval.
 *   2. `verify:public-copy-integrity` gate to catch obsolete or banned
 *      phrases before they reach a rendered public surface.
 *   3. Consistent wording across all public pages.
 *
 * Governance:
 *   - No phrase that implies approval, eligibility, lender commitment,
 *     environmental clearance, or official determination may appear here.
 *   - "Public Alpha remains PENDING." — do not declare Alpha approved.
 *   - "The map reveals opportunities, not the visitor."
 *   - Thread labels: Amber Thread, Sapphire Thread, Modern Convergence.
 *     Do NOT use personal family-line labels.
 *
 * Sections:
 *   A. Homepage hero + section headings
 *   B. Homepage trust strip
 *   C. Homepage "What Furlong Is Not"
 *   D. Homepage footer links
 *   E. Shared advisory disclosures (reused across public pages)
 *   F. Page metadata
 */

// ── A. Homepage hero ──────────────────────────────────────────────────────────

/**
 * Homepage hero — "blend" copy (Build 57, final). Supersedes the prior
 * "Every Journey Starts Somewhere" standalone headline and the "Discovering Your
 * Opportunities…" tagline (retired). Sentence case throughout.
 *
 * 2026-06-07 (Stuart): "Every journey starts somewhere." is the LARGE lead H1;
 * the mapping line is the prominent tagline directly under it (reworded to mirror
 * the lanes — "land, funding, and business opportunities" — replacing the earlier
 * "…financial and land topography.").
 *
 * Honesty guardrails:
 *   - Pathways-not-promises framing intact: the hero describes what the visitor
 *     can DO ("map your next venture / on your terms"), not what the tool
 *     computes. The "250 years" claim stays consistent with the site's
 *     established "drawn from 250 years of land and financial history… a
 *     brainstorming tool, not a guarantee" wording.
 *   - "Zero tracking. Total transparency." is truthful: no cross-web tracking,
 *     no data sale (consistent with <Disclosures>).
 *   - Hero pathway vocabulary is "property, farming, or small business"; the
 *     longer canonical list ("land, capital, business, and community") stays on
 *     the /about mission line. Do not reintroduce "commercial pathways".
 */
/**
 * Hero v3 (founder direction 2026-07-29, from Stuart's positioning review):
 * the customer's own sentence — "you type in an address and it tells you if
 * it's worth buying and how to finance it, whoever you are" — stated as an
 * action + outcome, not a catalog of capabilities. Supersedes "Bring the
 * property. We bring the analysis." (retired: described Furlong's activity,
 * not the visitor's outcome; the four-item tagline list covered three
 * audiences at once and read as comprehensive rather than specific).
 * Advisory posture preserved: the visitor SEES and decides; nothing promises
 * value, approval, or eligibility.
 */
export const HOMEPAGE_HERO = {
  brandName: "Furlong",
  headline:  "Type in an address. See if it's worth buying — and exactly how to pay for it.",
  tagline:
    "A house, a farm, a commercial building, bare land — Furlong shows you what's really there, what it actually costs to own, the deal-killers hiding in the details, and the financing built for exactly that kind of property. Free, before you commit to anything.",
  subhead:
    "Not sure the property is even right for what you want? That's the exact question this answers. " +
    "Start with an address — or just a question — and see the whole picture and your next move before you talk to anyone or share a thing.",
  trustTag:  "Explore anonymously. No account required. No hidden handoff.",
} as const;

/**
 * CTA v2 (founder direction 2026-07-29): buttons say the ACTION in the
 * customer's words, not brand-internal nouns — a first-time visitor doesn't
 * know what a "Navigator" or "Compass" is yet (Stuart's "What is this?"
 * reaction lived on these buttons). The Compass keeps its name in the
 * support line, where it's introduced rather than assumed.
 */
export const HOMEPAGE_PRIMARY_ACTIONS = {
  primaryLabel: "Check an address — free",
  primarySupport:
    "Any U.S. address — a home, a farm, a business property, or bare land. The facts come first; no account, no sales call.",
  secondaryLabel: "Browse every pathway",
  secondarySupport:
    "Not address-first? Move through the Furlong Compass — farms, homes, business, financing, and grants on one map.",
} as const;

export const HOMEPAGE_CAPABILITIES = {
  heading: "What you can do here",
  intro:
    "You do not need a finished plan to begin. Furlong is built to help you orient yourself before the paperwork, pressure, and noise take over.",
  cards: [
    {
      title: "Explore without exposing yourself",
      href: "/discover",
      body:
        "Look around, compare paths, and pressure-test ideas before sharing personal information or talking to anyone.",
    },
    {
      title: "See pathways, not just search results",
      href: "/explore",
      body:
        "Move across land, funding, business, and readiness questions in one place instead of piecing the picture together alone.",
    },
    {
      title: "Understand what stands in the way",
      href: "/readiness",
      body:
        "See missing pieces, likely constraints, and the boundaries around a path before you spend time chasing it.",
    },
    {
      title: "Bring in a human when you're ready",
      href: "/compass",
      body:
        "Use the system to get oriented first, then move to real human review when the moment actually calls for it.",
    },
  ],
} as const;

export const HOMEPAGE_MODULES = {
  heading: "Where do you want to go?",
  // Hero v3 alignment (2026-07-29): the modules echo the address-first
  // promise instead of re-stating the retired "we bring the analysis" line.
  intro:
    "Whatever the property is — a house, a farm, a commercial building, bare land — there's a lane built for its questions. Explore any of them free; bring in a licensed professional only when you're ready.",
  cards: [
    {
      title: "Farms, Agriculture & Land",
      href: "/explore?lane=farms-agriculture",
      accent: "#2f6d12",
      lead: "Know what the land can actually earn.",
      body:
        "Commodity economics, two honest net lines, equipment and hauling — the numbers behind the dirt before you commit.",
      cta: "Explore farms & land",
    },
    {
      title: "Commercial & Small Business",
      href: "/explore?lane=small-business-growth",
      accent: "#0f766e",
      lead: "See what a building is really worth to a business.",
      body:
        "Worth, cash flow, operating capital, leases — the questions a lender will ask, answered before you make an offer.",
      cta: "Explore commercial",
    },
    {
      title: "Environmental & Compliance",
      href: "/explore?lane=environmental-compliance",
      accent: "#127a4f",
      lead: "Find the deal-killers before they find you.",
      body:
        "Phase I, wetlands, contamination, water rights — read it all free, then order a licensed assessment from a PE.",
      cta: "Explore environmental",
    },
    {
      title: "Financing & Capital",
      href: "/explore?lane=financing-capital",
      accent: "#534AB7",
      lead: "Bring the deal to a licensed lender.",
      body:
        "SBA, USDA, and conventional — see how the programs map to your project, then send your deal to a licensed lender.",
      cta: "Explore financing",
    },
  ],
} as const;

export const HOMEPAGE_HOW_IT_WORKS = {
  heading: "How Furlong works",
  steps: [
    {
      title: "Start with what you know",
      href: "/discover",
      body:
        "A property, a place, a rough idea, or a problem you are trying to solve is enough to begin.",
    },
    {
      title: "See what may be possible",
      href: "/explore",
      body:
        "Furlong maps potential pathways, opportunity signals, and adjacent routes that may not be obvious at first glance.",
    },
    {
      title: "Understand the boundaries",
      href: "/readiness",
      body:
        "You can see constraints, readiness gaps, and what still needs human judgment before you move too far down the wrong path.",
    },
    {
      title: "Decide your next real step",
      href: "/compass",
      body:
        "When you are ready, move from exploration into human-guided action with more context and less confusion.",
    },
  ],
} as const;

export const HOMEPAGE_SECTION_HEADINGS = {
  explore:   "What would you like to explore today?",
  exploreNote:
    "No account or personal information is needed to look around.\nYou can change direction any time.",
  trust:     "How we work with you",
  whatNot:   "What Furlong Is Not",
  whatNotNote:
    "Furlong is a discovery and exploration platform. We help you understand\n" +
    "your options — the decisions and determinations always belong to you\n" +
    "and to qualified professionals.",
} as const;

// ── B. Homepage trust strip ───────────────────────────────────────────────────

/**
 * Five trust statements rendered in the homepage trust strip.
 * These are governance-required — do not remove or reorder without
 * Master Volume review.
 */
export const HOMEPAGE_TRUST_STRIP = [
  "We personalize with you, not to you.",
  "You can explore before sharing personal information.",
  "We do not sell your data.",
  "We show pathways, not promises.",
  "You remain in control.",
] as const;

// ── C. Homepage "What Furlong Is Not" ────────────────────────────────────────

/**
 * Five "What Furlong Is Not" statements rendered in the dark panel.
 * Governance-required negative declarations — do not soften or omit.
 */
export const HOMEPAGE_WHAT_NOT = [
  "Furlong is not a lender.",
  "Furlong does not approve or deny financing.",
  "Furlong does not guarantee outcomes.",
  "Furlong does not make official determinations.",
  "Furlong does not sell your information.",
] as const;

// ── D. Homepage "Clear waters, no surprises" — Build 55 ───────────────────────
//
// Replaces the old trust-strip (B) and what-not panel (C) on the homepage.
// Content approved verbatim. Must carry all required disclosures:
//   advisory · pathways-not-promises · not-a-lender · not-a-regulator
//   ai-advisory-only · no-data-sale · explore-first · right-to-delete
//
// Do NOT soften the "What Furlong is not" bullets or omit the AI disclosure.

export const HOMEPAGE_CLEAR_WATERS = {
  heading: "Clear waters, no surprises",
  intro:
    "A lighthouse is a tool for the captain — it doesn't grab the wheel, and it " +
    "doesn't demand to see your cargo before it lights the way. Here's exactly how " +
    "we work with you, and exactly where the lines are.",

  howWeWorkHeading: "How we work with you",
  howWeWork: [
    {
      lead: "Explore first, talk later.",
      body: "Wander, click around, and map out your possibilities before you ever share a single piece of personal information.",
    },
    {
      lead: "We personalize with you, not to you.",
      body: "We don't track you across the web or use creepy guesswork to figure out who you are. You give us the basic coordinates of your project, and we show you the paths that match.",
    },
    {
      lead: "Pathways, not promises.",
      body: "The map shows what's realistic, drawn from 250 years of land and financial history. It's a brilliant brainstorming tool — not a magic guarantee.",
    },
    {
      lead: "You keep the wheel.",
      body: "Your data is yours. We don't sell it, we don't pass it out the back door to lenders, and you can delete your footprint whenever you want. You decide when you're ready to go from exploring to talking with a real person.",
    },
  ],

  whatNotHeading: "What Furlong is not",
  whatNotPreamble: "No exceptions, no fine print:",
  whatNot: [
    {
      lead: "We're not a bank or a lender.",
      body: "We don't fund projects, issue loans, score your credit, or hand out approvals or denials.",
    },
    {
      lead: "We're not a regulator.",
      body: "We don't issue environmental permits, legal clearances, or government certifications.",
    },
    {
      lead: "We're not an automated decision-maker.",
      body: "AI never makes the final call on your journey. Our tech helps you get your files lender-ready — but every real step is cleared and guided by a credentialed human professional.",
    },
  ],

  closing:
    "Think of Furlong as your discovery platform: we help you read the landscape and see " +
    "what's ahead. Every final decision and determination belongs entirely to you and the " +
    "qualified professionals you choose to work with.",
} as const;

// ── E. Homepage footer links ──────────────────────────────────────────────────

/**
 * Footer navigation links rendered at the bottom of the homepage.
 * Keep in sync with FOOTER_LINKS in verifyPublicAccessibility.ts.
 */
export const HOMEPAGE_FOOTER_LINKS = [
  { href: "/about",              label: "About" },
  { href: "/trust",              label: "Trust" },
  { href: "/data-rights",        label: "Data Rights" },
  { href: "/financing-pathways", label: "Financing Pathways" },
  { href: "/readiness",          label: "Readiness" },
  { href: "/onboarding",         label: "Onboarding" },
  { href: "/portal/borrower",    label: "Borrower Portal" },
  { href: "/accessibility",      label: "Accessibility" },
] as const;

/** Featured footer CTAs above the link list. */
export const HOMEPAGE_FOOTER_FEATURED = [
  { href: "/stewardship",           label: "Meet the Furlong Stewards →",  color: "#0f766e" as const },
  { href: "/about/furlong-story",   label: "The Furlong Story →",           color: "#8a6914" as const },
] as const;

// ── E. Shared advisory disclosures ───────────────────────────────────────────

/**
 * Canonical advisory-only disclosure.
 * Appears verbatim (or a subset) on every public-facing page that
 * presents guidance, pathways, or outcomes.
 *
 * Governance: do not truncate the lender / funds / AI / human-review
 * sentences — they must appear together or the disclosure is incomplete.
 */
export const SHARED_ADVISORY_DISCLOSURE =
  "This information is advisory only and is not an approval, guarantee, or " +
  "official determination. No legal, regulatory, or official reliance may be " +
  "placed on this information. Furlong does not lend, does not commit funds, " +
  "and does not decide credit, eligibility, or approval. Your information " +
  "belongs to you. Furlong does not secretly submit, sell, or distribute your " +
  "information.";

/**
 * Canonical data-rights statement.
 * Append after SHARED_ADVISORY_DISCLOSURE on pages that accept user data
 * or describe data handling.
 */
export const SHARED_DATA_RIGHTS_STATEMENT =
  "You may exercise your data rights at any time: request an accounting, " +
  "export, deletion, or human review of your information (data-rights). " +
  "Borrowers pay nothing. Free for borrowers. Your information belongs to " +
  "you; Furlong does not secretly submit, sell, or distribute your information; " +
  "no silent submission and no information sale.";

/**
 * Canonical footer advisory note.
 * Used in journey shells and exploration-step footers.
 */
export const SHARED_JOURNEY_FOOTER_ADVISORY =
  "Advisory information only — not an approval, guarantee, eligibility " +
  "finding, or official determination. Furlong is not a lender. The " +
  "journey and the decisions remain yours.";

export const SHARED_JOURNEY_FOOTER_DATA_RIGHTS =
  "Your information belongs to you. You can request an accounting, export, " +
  "or deletion of your data at any time.";

// ── F. Page metadata ──────────────────────────────────────────────────────────

/**
 * Canonical <title> and <description> for each public page.
 * Next.js `export const metadata` on each page should reference these.
 */
export const PUBLIC_PAGE_META = {
  home: {
    title:       "Furlong — Every Journey Starts Somewhere",
    description: "Explore your agricultural land, financing, and stewardship pathways. No account required.",
  },
  about: {
    title:       "About Furlong | Compass to Capital",
    description: "Furlong helps you understand your pathways — land, financing, readiness, and next steps — before committing time, money, or personal information to a path.",
  },
  furlongStory: {
    title:       "The Furlong Story | Furlong",
    description:
      "Two threads of history converged in a shared belief: people make better " +
      "decisions when they can see the pathways before them. That belief became Furlong.",
  },
  trust: {
    title:       "The Furlong Promise | Trust",
    description: "No BS, just facts. What Furlong will and will not do with your information.",
  },
  dataRights: {
    title:       "Your Data Rights | Furlong",
    description: "What information Furlong collects, why, how it is used, and how to request deletion, export, or human review.",
  },
  stewardship: {
    title:       "Furlong Stewardship | Domain Overview",
    description: "Furlong stewardship domains: platform integrity, data governance, and community trust.",
  },
  onboarding: {
    title:       "Start Exploring | Furlong",
    description: "Explore the full map of agricultural pathways or focus your exploration on one category. No account required.",
  },
  accessibility: {
    title:       "Accessibility | Furlong",
    description: "How Furlong supports keyboard navigation, screen readers, reduced motion, and accessible use.",
  },
} as const;

// ── G. Banned-phrase list (for verify:public-copy-integrity) ──────────────────

/**
 * These phrases must NOT appear in any public-facing source file.
 * The verifyPublicCopyIntegrity script enforces this at build time.
 *
 * Rationale per phrase:
 *
 *   "Ares/Furlong Governed Platform"
 *     Internal platform branding. Must not appear on public pages or
 *     in public-facing components. Use "Furlong" alone.
 *
 *   "Begin exploring"
 *     Deprecated homepage CTA. Replaced by "Explore Your Possibilities".
 *
 *   "Female narrator" / "Male narrator"
 *     Internal recording-session labels (narratorLabel in narration scripts).
 *     Must not appear in any rendered UI copy or public component.
 *
 *   "Voice: Female" / "Voice: Male"
 *     Old narrator-selector UI copy. Removed with Web Speech API.
 *
 *   "speechSynthesis" / "SpeechSynthesisUtterance"
 *     Web Speech API. Fully removed. Must not reappear in public components.
 */
export const BANNED_PUBLIC_PHRASES: ReadonlyArray<{
  phrase:    string;
  rationale: string;
  /** If true, phrase is case-insensitive match. */
  caseInsensitive?: boolean;
}> = [
  {
    phrase:    "Ares/Furlong Governed Platform",
    rationale: "Retired internal platform label — use 'Furlong Governed Platform' or 'Furlong'.",
  },
  {
    phrase:    "Celebrating 250 years",
    rationale: "Superseded series tagline. Use: 'Illustrative examples from 250 years of American land, agriculture, and community.'",
  },
  {
    phrase:          "Begin exploring",
    rationale:       "Deprecated CTA. Use 'Explore Your Possibilities'.",
    caseInsensitive: true,
  },
  {
    phrase:    "Female narrator",
    rationale: "Internal recording-session label. Must not appear in rendered UI.",
  },
  {
    phrase:    "Male narrator",
    rationale: "Internal recording-session label. Must not appear in rendered UI.",
  },
  {
    phrase:    "Voice: Female",
    rationale: "Removed VoiceSelector copy. Must not reappear.",
  },
  {
    phrase:    "Voice: Male",
    rationale: "Removed VoiceSelector copy. Must not reappear.",
  },
  {
    phrase:    "speechSynthesis",
    rationale: "Web Speech API removed. Must not reappear in public components.",
  },
  {
    phrase:    "SpeechSynthesisUtterance",
    rationale: "Web Speech API removed. Must not reappear in public components.",
  },
] as const;
