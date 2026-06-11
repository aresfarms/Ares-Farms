import { America250Banner } from "@/components/brand/America250Banner";
import { PublicMapExperience } from "@/components/public/PublicMapExperience";
import { getRuntimeLiveSources } from "@/lib/property/sourceActivationStore";
import { isoWeekSeed } from "@/lib/public-content/weekSeed";
import { Disclosures } from "@/components/public/Disclosures";
import {
  HOMEPAGE_HERO,
  HOMEPAGE_CLEAR_WATERS,
} from "@/lib/public-content/publicCopyRegistry";

/**
 * Furlong homepage — Build 55
 *
 * Lives in src/app/(public)/page.tsx → resolves to /.
 * The (public) route group layout (PublicSiteLayout) provides:
 *   - page background (#f6f8fb), color, fontFamily
 *   - compass watermark (journey, position: absolute)
 *   - site header (PublicSiteHeader) — exactly ONE instance
 *   - stacking context (watermarks z-1, content z-10)
 *
 * This file owns ONLY page-level content. No shell, no watermarks here.
 *
 * Section order:
 *   1. America 250 Banner (full-width, above max-width container)
 *   2. Hero — headline + CTA
 *   3. Living Opportunity Map — America 250 Featured Exploration
 *   4. Explore section → onboarding
 *   5. Clear waters, no surprises (replaces old trust strip + what-not panel)
 *
 * Privacy posture (unchanged):
 *   "The map reveals opportunities, not the visitor."
 *   No geolocation. No visitor identification. No personal data.
 *
 * Public Alpha remains PENDING.
 */

// ── Content ───────────────────────────────────────────────────────────────────
// All user-visible copy is imported from publicCopyRegistry — no inline
// constants for display text. See src/lib/public-content/publicCopyRegistry.ts.

// ── Shared tokens ─────────────────────────────────────────────────────────────

/** Max-width content container — centered, padded. */
const container = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "0 24px 80px",
  display: "grid",
  gap: 0,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.65 } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Weekly place-rotation seed: the ISO week, computed server-side so SSR and
  // the client agree (no hydration drift). `?week=N` (alias `?mapWeek=N`) is a
  // read-only dev/proof override so any week's featured journey can be rendered
  // on demand — same as the holiday engine's `?holidayDate=`.
  const resolved = searchParams ? await searchParams : {};
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawWeek = one(resolved.week) ?? one(resolved.mapWeek);
  const weekSeed = rawWeek != null && rawWeek !== "" && Number.isFinite(Number(rawWeek))
    ? Number(rawWeek)
    : isoWeekSeed();
  return (
    <>
      {/* America 250 full-width commemorative banner — outside max-width container */}
      <America250Banner />

      <div style={container}>

        {/* ─── Inline styles ─────────────────────────────────────────── */}
        <style>{`

          /* ── Hero ──────────────────────────────────────────────────── */
          .fl-hero {
            padding: 60px 0 20px;
            display: grid;
            gap: 0;
          }
          .fl-hero-copy {
            display: grid;
            gap: 20px;
            text-align: center;
            justify-items: center;
          }
          .fl-hero-copy h1 {
            margin: 0;
            font-size: clamp(36px, 5.5vw, 70px);
            line-height: 1.06;
            letter-spacing: -0.03em;
            max-width: 900px;
            font-weight: 800;
          }
          /* ── Hero brand line — "FURLONG" above the headline ──── */
          .fl-hero-brand {
            margin: 0;
            font-size: clamp(36px, 6vw, 64px);
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #8a6914;   /* dark gold — 4.84:1 on #f6f8fb, WCAG AA ✓ */
            line-height: 1;
          }
          /* ── Hero tagline — prominent line directly under the H1 ──── */
          .fl-hero-tagline {
            margin: 0;
            font-size: clamp(18px, 2.4vw, 26px);
            font-weight: 700;
            line-height: 1.25;
            max-width: 760px;
            color: #8a6914;   /* dark gold — WCAG AA on #f6f8fb */
          }
          .fl-hero-sub {
            margin: 0;
            font-size: clamp(16px, 2vw, 20px);
            max-width: 640px;
            color: #5d687a;
            line-height: 1.65;
          }
          /* ── Hero trust tag — small line below the subhead ──── */
          .fl-hero-trust {
            margin: 0;
            font-size: clamp(13px, 1.4vw, 15px);
            font-weight: 700;
            letter-spacing: 0.02em;
            color: #0f766e;   /* teal — WCAG AA on #f6f8fb */
          }

          /* ── Primary CTA ───────────────────────────────────────────── */
          .fl-cta-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 52px;
            padding: 0 28px;
            border-radius: 999px;
            background: #0f766e;
            color: #ffffff;
            font-weight: 800;
            font-size: 16px;
            text-decoration: none;
            letter-spacing: 0.01em;
            transition: background 0.15s;
          }
          .fl-cta-primary:hover { background: #0d6460; }
          .fl-cta-primary:focus-visible {
            outline: 3px solid #0f766e;
            outline-offset: 3px;
          }

          /* ── Map section ───────────────────────────────────────────── */
          .fl-map-section {
            margin-top: 16px;
          }

          /* ── Section spacing ───────────────────────────────────────── */
          .fl-section {
            margin-top: 52px;
            display: grid;
            gap: 20px;
          }
          .fl-section-title {
            margin: 0;
            font-size: clamp(22px, 3vw, 30px);
            font-weight: 800;
            letter-spacing: -0.02em;
            text-align: center;
          }

          /* ── Explore dropdown form ─────────────────────────────────── */
          .fl-explore-form {
            display: grid;
            gap: 10px;
            max-width: 580px;
            margin: 0 auto;
          }
          .fl-explore-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #3b475a;
            text-align: center;
          }
          .fl-explore-select {
            width: 100%;
            min-height: 50px;
            padding: 0 14px;
            border-radius: 10px;
            border: 1.5px solid #cdd9ec;
            background: #ffffff;
            color: #162033;
            font-size: 15px;
            font-family: inherit;
            cursor: pointer;
          }
          .fl-explore-select:focus-visible {
            outline: 2px solid #0f766e;
            outline-offset: 2px;
            border-color: #0f766e;
          }

          /* ── Clear waters — how we work with you ─────────────────── */
          .fl-clear-intro {
            margin: 0 auto;
            max-width: 680px;
            text-align: center;
            font-size: 17px;
            line-height: 1.7;
            color: #5d687a;
          }
          .fl-clear-panel {
            border: 1px solid #d7deea;
            border-radius: 14px;
            background: #ffffff;
            padding: 28px 28px 24px;
            display: grid;
            gap: 16px;
          }
          .fl-clear-subheading {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #162033;
            letter-spacing: -0.01em;
          }
          .fl-clear-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 12px;
          }
          .fl-clear-list li {
            font-size: 15px;
            line-height: 1.65;
            color: #3b475a;
            padding-left: 18px;
            position: relative;
          }
          .fl-clear-list li::before {
            content: "–";
            position: absolute;
            left: 0;
            color: #0f766e;
            font-weight: 700;
          }
          .fl-clear-list li strong {
            color: #162033;
            font-weight: 700;
          }

          /* ── What Furlong Is Not — institutional blue / gold ───────── */
          .fl-not-panel {
            background: #162033;
            border-radius: 16px;
            padding: 32px 28px;
            display: grid;
            gap: 16px;
          }
          .fl-not-heading {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            color: #c9a84c;
            letter-spacing: -0.01em;
          }
          .fl-not-preamble {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #c9a84c;
            opacity: 0.8;
          }
          .fl-not-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
          }
          .fl-not-list li {
            font-size: 15px;
            line-height: 1.65;
            color: #e8effa;
            padding-left: 18px;
            position: relative;
          }
          .fl-not-list li::before {
            content: "✗";
            position: absolute;
            left: 0;
            color: #c9a84c;
            font-size: 12px;
            font-weight: 900;
            top: 2px;
          }
          .fl-not-list li strong {
            color: #ffffff;
            font-weight: 700;
          }
          .fl-not-note {
            margin: 0;
            font-size: 15px;
            font-weight: 500;
            color: #c9a84c;
            line-height: 1.65;
            border-top: 1px solid rgba(201,168,76,0.28);
            padding-top: 16px;
          }

          /* ── Footer ────────────────────────────────────────────────── */
          .fl-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            justify-content: center;
            align-items: center;
            padding-top: 20px;
            border-top: 1px solid #d7deea;
            margin-top: 52px;
          }
          .fl-footer-sep {
            color: #d7deea;
            font-size: 14px;
            user-select: none;
          }

          /* ── Responsive ────────────────────────────────────────────── */
          @media (max-width: 640px) {
            .fl-hero { padding: 52px 0 28px; }
            .fl-trust-strip-items { gap: 8px 16px; }
            .fl-not-grid { grid-template-columns: 1fr; }
            .fl-explore-select { min-height: 48px; }
          }

        `}</style>

        {/* ═══════════════════════════════════════════════════════════════
            1. HERO
            Headline · Sub only — single CTA is placed below the map.
            ══════════════════════════════════════════════════════════════ */}
        <section className="fl-hero" aria-label="Furlong discovery">
          <header className="fl-hero-copy">
            <p className="fl-hero-brand">{HOMEPAGE_HERO.brandName}</p>
            <h1>
              {HOMEPAGE_HERO.headline}
            </h1>
            <p className="fl-hero-tagline">{HOMEPAGE_HERO.tagline}</p>
            <p className="fl-hero-sub">
              {HOMEPAGE_HERO.subhead}
            </p>
            <p className="fl-hero-trust">{HOMEPAGE_HERO.trustTag}</p>
          </header>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            2. AMERICA'S JOURNEY MAP
            Canonical stop pool from americasJourneyStops.ts.
            PublicMapExperience manages its own data — no props needed here.
            ══════════════════════════════════════════════════════════════ */}
        <div className="fl-map-section">
          <PublicMapExperience liveSources={getRuntimeLiveSources()} weekSeed={weekSeed} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3. JOURNEY CTA
            There is exactly ONE journey call-to-action and it lives on the
            map's final (capstone) card — "Ready to begin your Journey?" →
            /explore (see americasJourneyTour.ts CAPSTONE). No second, non-map
            CTA here: a duplicate journey button is confusing. The .fl-cta-primary
            class remains defined in the <style> block above for shared button
            styling and is intentionally not rendered as a redundant link.
            ══════════════════════════════════════════════════════════════ */}

        {/* ═══════════════════════════════════════════════════════════════
            4. CLEAR WATERS, NO SURPRISES
            Replaces old trust strip + what-not panel (Build 55).
            Carries all required disclosures (advisory, not-a-lender,
            not-a-regulator, AI-advisory-only, no-data-sale,
            explore-first, right-to-delete).
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="How we work with you — clear waters, no surprises"
        >
          <h2 className="fl-section-title">{HOMEPAGE_CLEAR_WATERS.heading}</h2>
          <p className="fl-clear-intro">{HOMEPAGE_CLEAR_WATERS.intro}</p>

          {/* ── How we work with you ────────────────────────────────── */}
          <div className="fl-clear-panel">
            <h3 className="fl-clear-subheading">{HOMEPAGE_CLEAR_WATERS.howWeWorkHeading}</h3>
            <ul className="fl-clear-list">
              {HOMEPAGE_CLEAR_WATERS.howWeWork.map((item) => (
                <li key={item.lead}>
                  <strong>{item.lead}</strong>{" "}{item.body}
                </li>
              ))}
            </ul>
          </div>

          {/* ── What Furlong is not ─────────────────────────────────── */}
          <div className="fl-not-panel">
            <h3 className="fl-not-heading">{HOMEPAGE_CLEAR_WATERS.whatNotHeading}</h3>
            <p className="fl-not-preamble">{HOMEPAGE_CLEAR_WATERS.whatNotPreamble}</p>
            <ul className="fl-not-list">
              {HOMEPAGE_CLEAR_WATERS.whatNot.map((item) => (
                <li key={item.lead}>
                  <strong>{item.lead}</strong>{" "}{item.body}
                </li>
              ))}
            </ul>
            <p className="fl-not-note">{HOMEPAGE_CLEAR_WATERS.closing}</p>
          </div>

          {/* Canonical disclosures — single source of truth (compact on Home). */}
          <Disclosures variant="compact" />
        </section>

        {/* Page-level nav footer removed in Build 50.
            Site nav is in the layout header. Utility links are in the layout footer.
            Do NOT re-add a nav footer here — it creates a duplicate nav landmark. */}

      </div>
    </>
  );
}
