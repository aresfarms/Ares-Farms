/**
 * Disclosures — the single source of truth for Furlong's legal disclosure tokens.
 *
 * Render this ONCE on any public surface that needs disclosures. No page may
 * hand-write these sentences again — that duplication is what caused the drift
 * across pages. The anti-duplication gate (verifyMapPhotos / verify:public)
 * fails if the canonical disclosure sentences appear in any page file outside
 * this component.
 *
 *   <Disclosures variant="full" />     — every canonical token (Trust & Your Data)
 *   <Disclosures variant="compact" />  — condensed line (Home, What We Do)
 *
 * The full text carries every token the governance gates check (Module 44
 * disclosure registry: advisory-only, no-reliance, no-public-verification,
 * furlong-not-lender, ai-tier1-only, data-rights, free-for-borrowers,
 * user-data-sovereignty) plus the not-a-regulator clause.
 *
 * Public Alpha remains PENDING.
 */

import { CHART_TONES, type ChartTone } from "@/lib/property/chartThemes";

const FULL_TEXT =
  "This information is advisory only and is not an approval, guarantee, or official determination. " +
  "No legal reliance, no regulatory reliance, and no official reliance may be placed on this information. " +
  "This is not a public verification or official record. " +
  "AI does not decide, does not approve, and does not determine. Human review is required for every material step. " +
  "Furlong is not a lender and not a regulator. Furlong does not lend, does not commit funds, and does not decide credit, eligibility, or approval, and does not issue permits, clearances, or certifications. " +
  "Free for borrowers. Borrowers pay nothing. " +
  "Your information belongs to you. Furlong does not secretly submit, sell, or distribute your information. " +
  "No silent submission. No information sale.";

const COMPACT_TEXT =
  "Advisory only — not an approval, guarantee, or official determination, and no legal reliance, " +
  "no regulatory reliance, or official reliance may be placed on it. Furlong is not a lender and not a " +
  "regulator: it does not lend, commit funds, or decide credit, eligibility, or approval. " +
  "Free for borrowers. Borrowers pay nothing. Your information belongs to you. " +
  "Furlong does not secretly submit, sell, or distribute your information. No silent submission. No information sale.";

export function Disclosures({
  variant = "full",
  tone = "light",
}: {
  variant?: "full" | "compact";
  /** Chart Table cohesion: "dark" keeps the disclosure text readable when the
      strip sits on a chart stage (CHART_TONES ink) — text is identical. */
  tone?: ChartTone;
}) {
  // Presentation only (founder direction 2026-07-20): the governance-locked text
  // is UNCHANGED, but it's framed as an old-ledger "Field note" — a soft cream
  // marginalia box, muted serif — so the legal disclosure keeps the cozy book
  // vibe instead of reading like a cold corporate wall.
  const dark = tone === "dark";
  return (
    <aside
      aria-label="Furlong disclosures"
      style={{
        display: "grid",
        gap: 6,
        background: dark ? "rgba(255,255,255,0.05)" : "#faf6ec",
        border: `1px solid ${dark ? "rgba(201,168,76,0.28)" : "#e9ddc4"}`,
        borderLeft: `3px solid ${dark ? "rgba(201,168,76,0.55)" : "#c9a84c"}`,
        borderRadius: 10,
        padding: "12px 16px",
      }}
    >
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: dark ? "#d4b06a" : "#96742f",
        }}
      >
        ❧ Field note &amp; limitations
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 12.5,
          fontStyle: "italic",
          color: dark ? CHART_TONES.dark.bodyInk : "#6b6152",
          lineHeight: 1.65,
        }}
      >
        {variant === "compact" ? COMPACT_TEXT : FULL_TEXT}
      </p>
    </aside>
  );
}
