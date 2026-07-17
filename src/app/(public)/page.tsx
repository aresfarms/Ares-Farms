import Link from "next/link";

import { America250Banner } from "@/components/brand/America250Banner";
import { CompassRose } from "@/components/public/CompassRose";
import { discoveryPrimary, DISCOVERY_HREF } from "@/lib/discovery/discoveryConfig";
import { Disclosures } from "@/components/public/Disclosures";
import {
  HOMEPAGE_CAPABILITIES,
  HOMEPAGE_HERO,
  HOMEPAGE_PRIMARY_ACTIONS,
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

function CapabilityGlyph({ kind }: { kind: "private" | "pathways" | "boundaries" | "human" }) {
  const stroke = "#12344d";
  const accent = "#b8862f";

  if (kind === "private") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M16 22v-6a8 8 0 0 1 16 0v6" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <rect x="12" y="22" width="24" height="18" rx="6" fill="none" stroke={stroke} strokeWidth="2.4" />
        <circle cx="24" cy="30" r="3" fill={accent} />
      </svg>
    );
  }
  if (kind === "pathways") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 34c8-2 10-12 16-12s8 10 16 12" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M8 14h10" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M30 14h10" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="24" cy="22" r="4" fill="none" stroke={accent} strokeWidth="2.4" />
      </svg>
    );
  }
  if (kind === "boundaries") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M12 36V12l12 6 12-6v24l-12 6-12-6Z" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 18v18" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18 24h12" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="17" cy="20" r="6" fill="none" stroke={stroke} strokeWidth="2.4" />
      <circle cx="31" cy="18" r="5" fill="none" stroke={stroke} strokeWidth="2.4" />
      <path d="M9 37c1.5-6 6.5-10 12-10s10.5 4 12 10" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M26 37c1-4.5 4.5-7.5 8.5-7.5 2.2 0 4.2.8 5.5 2.5" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
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
            gap: 18px;
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
            max-width: 720px;
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
          .fl-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            justify-content: center;
            align-items: stretch;
            margin-top: 4px;
          }
          .fl-hero-action {
            display: grid;
            gap: 8px;
            max-width: 320px;
            justify-items: center;
          }
          .fl-hero-action-support {
            font-size: 12.5px;
            color: #5d687a;
            line-height: 1.5;
            text-align: center;
          }
          .fl-cta-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 52px;
            padding: 0 28px;
            border-radius: 999px;
            background: #ffffff;
            color: #0f766e;
            border: 1.5px solid #0f766e;
            font-weight: 800;
            font-size: 16px;
            text-decoration: none;
            letter-spacing: 0.01em;
            transition: background 0.15s, color 0.15s;
          }
          .fl-cta-secondary:hover { background: #f1fbfa; }
          .fl-cta-secondary:focus-visible {
            outline: 3px solid #0f766e;
            outline-offset: 3px;
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
          .fl-section-intro {
            margin: 0 auto;
            max-width: 720px;
            text-align: center;
            font-size: 17px;
            line-height: 1.7;
            color: #5d687a;
          }
          .fl-capability-rail {
            position: relative;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
          }
          .fl-capability-rail::before {
            content: "";
            position: absolute;
            left: 8%;
            right: 8%;
            top: 38px;
            height: 1px;
            background:
              linear-gradient(90deg,
                rgba(184,134,47,0),
                rgba(184,134,47,0.45) 18%,
                rgba(15,118,110,0.3) 50%,
                rgba(184,134,47,0.45) 82%,
                rgba(184,134,47,0));
            pointer-events: none;
          }
          .fl-capability-stop {
            position: relative;
            display: grid;
            justify-items: center;
            text-align: center;
            gap: 12px;
            padding: 0 10px;
          }
          .fl-capability-link {
            color: inherit;
            text-decoration: none;
            border-radius: 16px;
            padding: 8px 10px 12px;
            transition: transform 0.14s ease, background 0.14s ease, box-shadow 0.14s ease;
          }
          .fl-capability-link:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.62);
            box-shadow: 0 12px 28px rgba(22,32,51,0.08);
          }
          .fl-capability-link:focus-visible {
            outline: 3px solid #0f766e;
            outline-offset: 3px;
          }
          .fl-capability-badge {
            width: 76px;
            height: 76px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.96), rgba(248,250,253,0.92) 58%, rgba(230,237,245,0.9));
            border: 1px solid rgba(184,134,47,0.34);
            box-shadow:
              0 10px 26px rgba(22,32,51,0.06),
              inset 0 1px 0 rgba(255,255,255,0.9);
            z-index: 1;
          }
          .fl-capability-badge svg {
            width: 40px;
            height: 40px;
          }
          .fl-capability-stop h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #162033;
            letter-spacing: -0.01em;
          }
          .fl-capability-stop p {
            margin: 0;
            font-size: 14px;
            line-height: 1.65;
            color: #4d596d;
            max-width: 220px;
          }
          .fl-steps-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }
          .fl-step-card {
            background: #ffffff;
            border: 1px solid #d7deea;
            border-radius: 16px;
            padding: 20px 18px;
            display: grid;
            gap: 12px;
          }
          .fl-step-link {
            color: inherit;
            text-decoration: none;
            transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
          }
          .fl-step-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(22,32,51,0.08);
            border-color: #bfd0e4;
          }
          .fl-step-link:focus-visible {
            outline: 3px solid #0f766e;
            outline-offset: 3px;
          }
          .fl-step-number {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(15,118,110,0.12);
            color: #0f766e;
            font-size: 14px;
            font-weight: 800;
          }
          .fl-step-card h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 800;
            color: #162033;
          }
          .fl-step-card p {
            margin: 0;
            font-size: 14px;
            line-height: 1.65;
            color: #5d687a;
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
            .fl-capability-rail {
              grid-template-columns: 1fr;
              gap: 22px;
            }
            .fl-capability-rail::before {
              left: 38px;
              right: auto;
              top: 22px;
              bottom: 22px;
              width: 1px;
              height: auto;
              background:
                linear-gradient(180deg,
                  rgba(184,134,47,0),
                  rgba(184,134,47,0.45) 18%,
                  rgba(15,118,110,0.3) 50%,
                  rgba(184,134,47,0.45) 82%,
                  rgba(184,134,47,0));
            }
            .fl-capability-stop {
              grid-template-columns: 76px 1fr;
              justify-items: start;
              align-items: center;
              text-align: left;
              gap: 14px 16px;
              padding: 0;
            }
            .fl-capability-stop h3,
            .fl-capability-stop p {
              max-width: none;
            }
            .fl-capability-copy {
              display: grid;
              gap: 6px;
            }
            .fl-steps-grid { grid-template-columns: 1fr; }
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
            {discoveryPrimary() && (
              <div className="fl-hero-actions">
                <div className="fl-hero-action">
                  <Link href="/navigator" className="fl-cta-primary" data-testid="cta-navigator">
                    {HOMEPAGE_PRIMARY_ACTIONS.primaryLabel} →
                  </Link>
                  <span data-testid="cta-navigator-support" className="fl-hero-action-support">
                    {HOMEPAGE_PRIMARY_ACTIONS.primarySupport}
                  </span>
                </div>
                <div className="fl-hero-action">
                  <Link href="/explore" className="fl-cta-secondary" data-testid="cta-explore-map">
                    {HOMEPAGE_PRIMARY_ACTIONS.secondaryLabel} →
                  </Link>
                  <span data-testid="cta-explore-support" className="fl-hero-action-support">
                    {HOMEPAGE_PRIMARY_ACTIONS.secondarySupport}
                  </span>
                </div>
              </div>
            )}
          </header>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            THE COMPASS — the /explore compass-rose explorer, moved to the
            front page intact (founder direction 2026-07-17: keep it exactly,
            just put it on the main page in place of the property-type grid +
            listings shelf). Full-bleed dark stage; breaks out of the max-width
            container the way the America 250 banner does.
            ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginInline: "calc(50% - 50vw)" }}>
          <CompassRose />
        </div>

        <section className="fl-section" aria-label="What you can do here">
          <h2 className="fl-section-title">{HOMEPAGE_CAPABILITIES.heading}</h2>
          <p className="fl-section-intro">{HOMEPAGE_CAPABILITIES.intro}</p>
          <div className="fl-capability-rail">
            {HOMEPAGE_CAPABILITIES.cards.map((card, index) => {
              const kinds = ["private", "pathways", "boundaries", "human"] as const;
              const kind = kinds[index] ?? "human";
              return (
                <Link key={card.title} href={card.href} className="fl-capability-stop fl-capability-link">
                  <div className="fl-capability-badge">
                    <CapabilityGlyph kind={kind} />
                  </div>
                  <div className="fl-capability-copy">
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* The property-type grid + listings shelf were replaced by the compass
            above; the America's Journey map moved to the /explore land lane
            (founder direction 2026-07-17). */}

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
