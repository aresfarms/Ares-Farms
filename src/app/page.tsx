import Link from "next/link";

import { America250Banner } from "@/components/brand/America250Banner";
import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";
import { LivingOpportunityMap } from "@/components/customer/LivingOpportunityMap";
import { ExploreDropdown } from "@/components/public/ExploreDropdown";
import {
  AMERICA_250_STORIES,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Furlong homepage — public-facing discovery experience (Build 52).
 *
 * Section order:
 *   1. Hero — compass + headline + CTA
 *   2. Living Opportunity Map — America 250 Featured Exploration
 *   3. Explore section (id="explore") — labeled dropdown form → onboarding
 *   4. Trust Strip
 *   5. What Furlong Is Not — institutional blue/gold
 *   6. Footer (with stewardship link)
 *
 * Design posture: compass → map → discovery. Lighthouse, not sitemap.
 * Educational, not salesy. Exploration-first. No geolocation. No jargon.
 *
 * Privacy posture (unchanged):
 *   "The map reveals opportunities, not the visitor."
 *   No geolocation. No visitor identification. No personal data.
 *
 * Public Alpha remains PENDING.
 */

// ── Content ───────────────────────────────────────────────────────────────────

const TRUST_STRIP = [
  "We personalize with you, not to you.",
  "You can explore before sharing personal information.",
  "We do not sell your data.",
  "We show pathways, not promises.",
  "You remain in control.",
] as const;

const WHAT_FURLONG_IS_NOT = [
  "Furlong is not a lender.",
  "Furlong does not approve or deny financing.",
  "Furlong does not guarantee outcomes.",
  "Furlong does not make official determinations.",
  "Furlong does not sell your information.",
] as const;

const FOOTER_LINKS = [
  { href: "/about",              label: "About" },
  { href: "/trust",              label: "Trust" },
  { href: "/data-rights",        label: "Data Rights" },
  { href: "/financing-pathways", label: "Financing Pathways" },
  { href: "/readiness",          label: "Readiness" },
  { href: "/onboarding",         label: "Onboarding" },
  { href: "/portal/borrower",    label: "Borrower Portal" },
] as const;

// ── Shared tokens ─────────────────────────────────────────────────────────────

const shell = {
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  position: "relative" as const,
  overflow: "hidden" as const,
} as const;

const container = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "0 24px 80px",
  display: "grid",
  gap: 0,
  position: "relative" as const,
  zIndex: 1,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.65 } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={shell}>
      {/*
        ╔═══════════════════════════════════════════════════════════════╗
        ║  Compass watermarks — page scope, z-index: 0, behind all     ║
        ║  content. Both are aria-hidden and pointer-events: none.      ║
        ╚═══════════════════════════════════════════════════════════════╝
      */}
      <FurlongCompassWatermark variant="hero" />
      <FurlongCompassWatermark variant="subtle" />

      {/* America 250 full-width commemorative banner */}
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
            font-size: clamp(13px, 1.8vw, 17px);
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #8a6914;   /* dark gold — 4.84:1 on #f6f8fb, WCAG AA ✓ */
            line-height: 1;
          }

          .fl-hero-sub {
            margin: 0;
            font-size: clamp(16px, 2vw, 20px);
            max-width: 640px;
            color: #5d687a;
            line-height: 1.65;
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
          /* fl-explore-form, fl-explore-label, fl-explore-select rendered  */
          /* by ExploreDropdown client component (onChange routes to onboarding). */
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

          /* ── Trust strip ───────────────────────────────────────────── */
          .fl-trust-strip {
            padding: 26px 28px;
            border: 1px solid #d7deea;
            border-radius: 14px;
            background: #ffffff;
          }
          .fl-trust-strip-items {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 28px;
            margin-top: 16px;
          }
          .fl-trust-item {
            display: flex;
            align-items: baseline;
            gap: 8px;
            font-size: 15px;
            line-height: 1.6;
            color: #162033;
          }
          .fl-trust-check {
            font-size: 13px;
            color: #0f766e;
            flex-shrink: 0;
            font-weight: 900;
          }

          /* ── What Furlong Is Not — institutional blue / gold ───────── */
          .fl-not-panel {
            background: #162033;
            border-radius: 16px;
            padding: 36px 32px;
            display: grid;
            gap: 20px;
          }
          .fl-not-heading {
            margin: 0;
            font-size: 22px;
            font-weight: 800;
            color: #c9a84c;
            letter-spacing: -0.01em;
          }
          .fl-not-grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          .fl-not-item {
            display: flex;
            align-items: baseline;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 10px;
            background: rgba(255,255,255,0.06);
            font-size: 15px;
            line-height: 1.6;
            color: #e8effa;
          }
          .fl-not-mark {
            font-size: 13px;
            color: #c9a84c;
            font-weight: 900;
            flex-shrink: 0;
          }
          .fl-not-note {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
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
            Headline · Sub · CTA
            ══════════════════════════════════════════════════════════════ */}
        <section className="fl-hero" aria-label="Furlong discovery">
          <header className="fl-hero-copy">
            <p className="fl-hero-brand">Furlong</p>
            <h1>
              Every Journey Starts Somewhere.
            </h1>
            <p className="fl-hero-sub">
              Explore Your Possibilities.
            </p>
            <a href="#explore" className="fl-cta-primary">
              Explore Your Possibilities →
            </a>
          </header>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            2. LIVING OPPORTUNITY MAP
            America 250 Featured Exploration — immediately below hero
            ══════════════════════════════════════════════════════════════ */}
        <div className="fl-map-section">
          <LivingOpportunityMap stories={AMERICA_250_STORIES} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3. EXPLORE DROPDOWN
            Single focused entry point → onboarding
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="explore"
          className="fl-section"
          aria-label="Choose your exploration"
          style={{ scrollMarginTop: 80 }}
        >
          <h2 className="fl-section-title">What would you like to explore today?</h2>

          {/* ExploreDropdown: "use client" component — routes on selection,
              no submit button. Contains <label htmlFor="homepage-explore-select">
              and <select id="homepage-explore-select"> for WCAG 3.3.2/4.1.2. */}
          <ExploreDropdown />

          <p style={{ ...muted, margin: 0, fontSize: 14, textAlign: "center" }}>
            No account or personal information is needed to look around.
            You can change direction any time.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            4. TRUST STRIP
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="How Furlong works with you"
        >
          <div className="fl-trust-strip">
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>
              How we work with you
            </h2>
            <div className="fl-trust-strip-items">
              {TRUST_STRIP.map((line) => (
                <span key={line} className="fl-trust-item">
                  <span className="fl-trust-check" aria-hidden="true">✓</span>
                  {line}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            5. WHAT FURLONG IS NOT — institutional blue / gold
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="What Furlong is not"
        >
          <div className="fl-not-panel">
            <h2 className="fl-not-heading">What Furlong Is Not</h2>
            <div className="fl-not-grid">
              {WHAT_FURLONG_IS_NOT.map((line) => (
                <span key={line} className="fl-not-item">
                  <span className="fl-not-mark" aria-hidden="true">✗</span>
                  {line}
                </span>
              ))}
            </div>
            <p className="fl-not-note">
              Furlong is a discovery and exploration platform. We help you understand
              your options — the decisions and determinations always belong to you
              and to qualified professionals.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            6. FOOTER
            ══════════════════════════════════════════════════════════════ */}
        <footer className="fl-footer" aria-label="Site navigation">
          <Link
            href="/stewardship"
            style={{
              color: "#0f766e",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Meet the Furlong Stewards →
          </Link>

          <Link
            href="/about/furlong-story"
            style={{
              color: "#8a6914",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            The Furlong Story →
          </Link>

          <span className="fl-footer-sep" aria-hidden="true">|</span>

          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: "#0f766e",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </footer>

      </div>
    </div>
  );
}
