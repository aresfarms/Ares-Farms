import type { Metadata } from "next";
import Link from "next/link";

import { FurlongStoryTimeline } from "@/components/story/FurlongStoryTimeline";

/**
 * /about/furlong-story — The Furlong Story: Convergence Timeline (Build 48)
 *
 * Purpose:
 *   The origin story of Furlong's philosophy — "People make better decisions
 *   when they can see the pathways before them." Told through two anonymous
 *   historical threads (Amber, Sapphire) that converged in the founding of
 *   Furlong. An America 250 living-history experience.
 *
 * Privacy posture:
 *   - No modern addresses, living-person details, exact birthdates,
 *     or identity-theft-sensitive lineage facts.
 *   - Uses "Amber Thread" / "Sapphire Thread" / "Modern Convergence" —
 *     not named family or individual lines.
 *   - Story is historical and illustrative; no personalization.
 *   - "The map reveals opportunities, not the visitor."
 *
 * Public Alpha remains PENDING.
 */

export const metadata: Metadata = {
  title:       "The Furlong Story | Furlong",
  description:
    "Two threads of history converged in a shared belief: people make better " +
    "decisions when they can see the pathways before them. That belief became Furlong.",
};

// ── Shared tokens ─────────────────────────────────────────────────────────────

const container = {
  maxWidth: 1040,
  margin:   "0 auto",
  padding:  "40px 24px 80px",
  display:  "grid",
  gap:      32,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.65 } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FurlongStoryPage() {
  return (
    <main>
      <div style={container}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 14 }}>

          {/* America 250 badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           6,
              background:    "#162033",
              color:         "#c9a84c",
              fontSize:      11,
              fontWeight:    800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding:       "5px 11px",
              borderRadius:  6,
            }}>
              ★ America 250 Living History
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, lineHeight: 1.15 }}>
            The Furlong Story
          </h1>

          <p style={{ ...muted, margin: 0, fontSize: 18, maxWidth: 700 }}>
            People make better decisions when they can see the pathways before
            them. That belief became Furlong.
          </p>

          <p style={{ ...muted, margin: 0, maxWidth: 720 }}>
            The story of Furlong's founding runs through centuries of land
            stewardship. Two historical threads — separated by geography and
            era — eventually converged in a shared conviction about how to
            serve people facing the complexity of agricultural finance and
            land stewardship. In 2026, as America marks 250 years of
            independence, we trace those threads on the map that shaped them.
          </p>

          {/* Thread legend */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        7,
              fontSize:   13,
              fontWeight: 600,
              color:      "#3b475a",
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                background: "#c9a84c", display: "inline-block",
              }} aria-hidden="true" />
              Amber Thread — Historical journey A
            </span>
            <span style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        7,
              fontSize:   13,
              fontWeight: 600,
              color:      "#3b475a",
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                background: "#3b82f6", display: "inline-block",
              }} aria-hidden="true" />
              Sapphire Thread — Historical journey B (pending)
            </span>
            <span style={{
              display:    "inline-flex",
              alignItems: "center",
              gap:        7,
              fontSize:   13,
              fontWeight: 600,
              color:      "#3b475a",
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                background: "#c9a84c", border: "2px solid #162033",
                display: "inline-block", boxSizing: "border-box",
              }} aria-hidden="true" />
              Modern Convergence — The founding of Furlong
            </span>
          </div>
        </header>

        {/* ── Interactive convergence map ──────────────────────────────────
            This is the founding-thread storyline (Amber / Sapphire / Modern
            Convergence) — NOT the homepage hidden-gem tour. FurlongStoryTimeline
            reuses the homepage map's INTERACTION (on-map narrative card anchored
            at each milestone, clamping, dwell, Prev/Next/Begin, reduced-motion)
            but renders THIS page's own founding milestones. Do not replace this
            with the homepage hidden-gem tour — the two pages share the
            interaction, not the data (enforced by verifyMapPhotos P20). */}
        <section aria-label="Interactive convergence map">
          <FurlongStoryTimeline />
        </section>

        {/* ── Story context (always readable without JS/animation) ─────── */}
        <section
          aria-label="Story context"
          style={{
            background:   "#ffffff",
            border:       "1px solid #d7deea",
            borderRadius: 10,
            padding:      24,
            display:      "grid",
            gap:          14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Why the map matters
          </h2>
          <p style={{ ...muted, margin: 0 }}>
            The families and communities behind these threads shared something
            with the farmers, landowners, and borrowers Furlong serves today:
            they had to navigate complex terrain without a clear map of the
            pathways available to them. They had to assess risk, understand
            options, and make decisions that would shape generations.
          </p>
          <p style={{ ...muted, margin: 0 }}>
            Furlong exists to give today's agricultural families the map those
            earlier generations didn't have. Not a promise of outcomes. Not a
            guarantee of approval. A compass — so that when the time comes to
            decide, you can see what's ahead.
          </p>
          <blockquote style={{
            margin:       "4px 0 0",
            paddingLeft:  16,
            borderLeft:   "3px solid #c9a84c",
            fontStyle:    "italic",
            color:        "#3b475a",
            fontSize:     15,
            lineHeight:   1.65,
          }}>
            "The map reveals opportunities, not the visitor."
          </blockquote>
        </section>

        {/* ── Privacy note ─────────────────────────────────────────────── */}
        <aside
          aria-label="Story privacy note"
          style={{
            background:   "#f8fafc",
            border:       "1px solid #d7deea",
            borderRadius: 8,
            padding:      "14px 18px",
            fontSize:     13,
            color:        "#5d687a",
            lineHeight:   1.6,
          }}
        >
          <strong style={{ color: "#162033" }}>Historical and illustrative note: </strong>
          This story uses historical and illustrative pathways. It
          intentionally avoids sensitive personal details, living-person
          identifiers, and exact modern locations. Geographic references are
          approximate and illustrative. Furlong does not track, identify, or
          personalize based on visitor ancestry, location, or background.
        </aside>

        {/* ── Contextual CTA ───────────────────────────────────────────────
            The single journey call-to-action lives on the map's capstone card
            ("Ready to begin your Journey?" → /explore). No second, non-map
            journey button here — a duplicate is confusing. Only a contextual
            back-link remains; site nav is in the layout header/footer. */}
        <section aria-label="Story navigation">
          <div style={{
            background:   "#162033",
            color:        "#e8effa",
            borderRadius: 10,
            padding:      "24px 28px",
            display:      "grid",
            gap:          12,
          }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#c9a84c" }}>
              Now it's your turn to explore the pathways.
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: "#e8effa", lineHeight: 1.6 }}>
              Furlong helps agricultural families understand their options —
              before committing time, money, or personal information to a path.
              Use the map above to begin your Journey. No account needed to look
              around. You remain in control.
            </p>
          </div>
          {/* Contextual back-link — not a nav mirror. Site nav is in the layout header/footer. */}
          <div style={{ marginTop: 14 }}>
            <Link href="/about" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
              ← About Furlong
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
