import type { Metadata } from "next";
import Link from "next/link";

import {
  EXPLORATION_CATEGORIES,
  explorationHref,
} from "@/lib/customer-landing/featuredExplorationStories";
import { PUBLIC_PAGE_META } from "@/lib/public-content/publicCopyRegistry";
import { Disclosures } from "@/components/public/Disclosures";
import { onboardingIntelligenceCaseHandoff } from "@/lib/intelligence/onboardingIntelligenceCaseHandoff";

/**
 * /onboarding — Start Exploring (Build 53)
 *
 * Progressive one-question-at-a-time flow.
 * No internal labels. No wall of every category and explanation.
 * Clean one-question progressive flow per Build 53 remediation.
 *
 * Flow:
 *   1. Without ?explore= : show "What would you like to explore?" with 8 categories.
 *   2. With ?explore=slug : show selected category + "Continue exploring" CTA.
 *
 * Governance:
 *   - No approval, eligibility, or official-determination language.
 *   - No geolocation, no visitor identification.
 *   - "The map reveals opportunities, not the visitor."
 *
 * Public Alpha remains PENDING.
 */

export const metadata: Metadata = {
  title:       PUBLIC_PAGE_META.onboarding.title,
  description: PUBLIC_PAGE_META.onboarding.description,
};

// ── Shared tokens ─────────────────────────────────────────────────────────────

const container = {
  maxWidth: 880,
  margin:   "0 auto",
  padding:  "40px 24px 80px",
  display:  "grid",
  gap:      28,
} as const;

const whitePanel = {
  background:   "#ffffff",
  border:       "1px solid #d7deea",
  borderRadius: 14,
  padding:      "28px 28px",
  display:      "grid",
  gap:          16,
} as const;

const muted = {
  color:      "#5d687a",
  lineHeight: 1.6,
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams   = searchParams ? await searchParams : {};
  const slugValue        = resolvedParams.explore;
  const selectedSlug     = Array.isArray(slugValue) ? slugValue[0] : slugValue;
  const selectedCategory = EXPLORATION_CATEGORIES.find((c) => c.slug === selectedSlug) ?? null;
  const intelligenceCase = selectedCategory
    ? onboardingIntelligenceCaseHandoff(selectedCategory.slug, selectedCategory.label)
    : null;

  return (
    <main>
      <div style={container}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.12 }}>
            {selectedCategory ? selectedCategory.label : "What would you like to explore?"}
          </h1>
          <p style={{ margin: 0, fontSize: 17, ...muted, maxWidth: 600 }}>
            No account or personal information needed to look around.
            You can change direction any time.
          </p>
        </header>

        {/* ── Category selected — focused view ─────────────────────────────── */}
        {selectedCategory && (
          <section
            style={{
              background:   "#ecfdf5",
              border:       "2px solid #0f766e",
              borderRadius: 14,
              padding:      "24px 28px",
              display:      "grid",
              gap:          12,
            }}
            aria-label={`Exploring: ${selectedCategory.label}`}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: 0.4 }}>
              Exploring
            </span>
            <strong style={{ fontSize: 22, color: "#162033" }}>{selectedCategory.label}</strong>
            <p style={{ margin: 0, fontSize: 16, ...muted }}>{selectedCategory.blurb}</p>
            <p style={{ margin: 0, fontSize: 13, ...muted }}>
              Carry this choice into one anonymous intelligence case. No identity, address, transcript, listing URL, or hidden account is transferred.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
              <Link
                href={intelligenceCase?.href ?? explorationHref(selectedCategory.slug)}
                style={{
                  display:         "inline-flex",
                  minHeight:       48,
                  alignItems:      "center",
                  padding:         "0 22px",
                  borderRadius:    999,
                  background:      "#0f766e",
                  color:           "#ffffff",
                  fontWeight:      800,
                  textDecoration:  "none",
                  fontSize:        16,
                }}
              >
                Open your intelligence case →
              </Link>
              <Link
                href="/onboarding"
                style={{
                  display:        "inline-flex",
                  minHeight:      48,
                  alignItems:     "center",
                  padding:        "0 18px",
                  borderRadius:   999,
                  border:         "1px solid #d7deea",
                  background:     "#ffffff",
                  color:          "#5d687a",
                  fontWeight:     700,
                  textDecoration: "none",
                  fontSize:       15,
                }}
              >
                ← See all options
              </Link>
            </div>
          </section>
        )}

        {/* ── Category grid ────────────────────────────────────────────────── */}
        <section
          style={whitePanel}
          aria-label="Exploration categories"
        >
          {!selectedCategory && (
            <p style={{ ...muted, margin: 0 }}>
              Choose a category to focus your exploration, or browse all eight lanes at once.
            </p>
          )}

          <div
            style={{
              display:             "grid",
              gap:                 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {EXPLORATION_CATEGORIES.map((category) => {
              const isSelected = category.slug === selectedSlug;
              return (
                <Link
                  key={category.slug}
                  href={explorationHref(category.slug)}
                  style={{
                    display:        "grid",
                    gap:            8,
                    border:         isSelected ? "2px solid #0f766e" : "1px solid #d7deea",
                    borderRadius:   12,
                    background:     isSelected ? "#f0fdf9" : "#ffffff",
                    padding:        "18px 16px",
                    textDecoration: "none",
                    color:          "inherit",
                  }}
                >
                  <strong style={{ fontSize: 16, color: "#162033" }}>{category.label}</strong>
                  <span style={{ fontSize: 14, ...muted }}>{category.blurb}</span>
                  <span style={{ fontSize: 13, color: "#0f766e", fontWeight: 700 }}>
                    Explore →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── What we'll ask you ───────────────────────────────────────────── */}
        {/* Required content: four-intake-questions (Customer Journey §2) */}
        <section
          style={{
            background:   "#ffffff",
            border:       "1px solid #d7deea",
            borderRadius: 14,
            padding:      "24px 28px",
            display:      "grid",
            gap:          12,
          }}
          aria-label="What we will ask you"
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#162033" }}>
            When you're ready to go deeper, we'll ask four questions:
          </h2>
          <ol style={{ margin: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.8, display: "grid", gap: 2 }}>
            <li>What type of business do you own?</li>
            <li>What are you trying to accomplish?</li>
            <li>Where is the property located?</li>
            <li>What type of asset is involved?</li>
          </ol>
          <p style={{ margin: 0, fontSize: 14, ...muted }}>
            That is all we need to give you a meaningful first map of possibilities.
            No account required before you see value.
          </p>
        </section>

        {/* ── Advisory note ────────────────────────────────────────────────── */}
        <section
          style={{
            background:   "#f8fafc",
            border:       "1px solid #d7deea",
            borderRadius: 14,
            padding:      "20px 24px",
            display:      "grid",
            gap:          8,
          }}
          aria-label="Advisory disclosure"
        >
          {/* Canonical disclosures — single source of truth (see Disclosures.tsx). */}
          <Disclosures variant="full" />
        </section>

        {/* Page-level footer: contextual CTA only. Site nav is in the layout header/footer. */}

      </div>
    </main>
  );
}
