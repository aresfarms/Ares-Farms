import Link from "next/link";

import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";
import { LivingOpportunityMap } from "@/components/customer/LivingOpportunityMap";
import { StewardshipSection } from "@/components/stewardship/StewardshipSection";
import {
  AMERICA_250_STORIES,
  EXPLORATION_CATEGORIES,
  explorationHref,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Furlong homepage — public-facing discovery experience (Build 47-B).
 *
 * Section order:
 *   1. Hero Identity Layer (compass + map + headline + CTA)
 *   2. Featured Exploration Layer (Living Opportunity Map)
 *   3. Full Map vs Personalize Choice
 *   4. Exploration Categories
 *   5. Trust Strip
 *   6. Stewardship Section
 *   7. What Furlong Is Not
 *   8. Footer
 *
 * Design posture: curious, trustworthy, alive. Educational, not salesy.
 * Exploration-first, not lead-capture-first. No internal module names.
 * No governance jargon. No dashboard diagnostics. No geolocation.
 */

// ── Content ──────────────────────────────────────────────────────────────────

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
  { href: "/about",             label: "About" },
  { href: "/trust",             label: "Trust" },
  { href: "/data-rights",       label: "Data Rights" },
  { href: "/financing-pathways",label: "Financing Pathways" },
  { href: "/readiness",         label: "Readiness" },
  { href: "/onboarding",        label: "Onboarding" },
  { href: "/portal/borrower",   label: "Borrower Portal" },
  { href: "/stewardship",       label: "Stewardship" },
] as const;

// ── Shared tokens ─────────────────────────────────────────────────────────────

const shell = {
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "0 24px 80px",
  display: "grid",
  gap: 0,
} as const;

const card = {
  padding: 24,
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  display: "grid",
  gap: 12,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.65 } as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={shell}>
      <div style={container}>

        {/* ─── Inline responsive styles ─────────────────────────────────── */}
        <style>{`
          /* Hero stage */
          .fl-hero {
            position: relative;
            overflow: hidden;
            padding: 72px 0 40px;
            display: grid;
            gap: 36px;
          }
          .fl-hero-content {
            position: relative;
            z-index: 1;
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
          .fl-hero-sub {
            margin: 0;
            font-size: clamp(16px, 2vw, 20px);
            max-width: 640px;
            color: #5d687a;
            line-height: 1.65;
          }
          .fl-hero-trust-note {
            margin: 0;
            font-size: 14px;
            color: #5d687a;
            max-width: 560px;
            line-height: 1.6;
          }

          /* Primary CTA button */
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

          /* Section spacing */
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
          .fl-section-title--left {
            text-align: left;
          }

          /* Full Map vs Personalize — two option cards */
          .fl-explore-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 1fr;
          }
          .fl-explore-card {
            display: grid;
            gap: 12px;
            padding: 26px 22px;
            border: 1.5px solid #d7deea;
            border-radius: 14px;
            background: #ffffff;
            text-decoration: none;
            color: inherit;
            align-content: start;
            transition: border-color 0.14s, box-shadow 0.14s;
          }
          .fl-explore-card:hover {
            border-color: #0f766e;
            box-shadow: 0 2px 16px rgba(15,118,110,0.08);
          }
          .fl-explore-card--primary {
            border-color: #0f766e;
            background: linear-gradient(160deg, #f0fbf9 0%, #ffffff 100%);
          }
          .fl-explore-card--primary:hover {
            box-shadow: 0 4px 20px rgba(15,118,110,0.14);
          }
          .fl-explore-icon {
            font-size: 28px;
            line-height: 1;
          }
          .fl-explore-card-title {
            font-size: 19px;
            font-weight: 800;
            color: #162033;
            margin: 0;
          }
          .fl-explore-card-desc {
            font-size: 15px;
            color: #5d687a;
            line-height: 1.6;
            margin: 0;
          }
          .fl-explore-card-cta {
            font-size: 14px;
            font-weight: 700;
            color: #0f766e;
          }
          .fl-explore-card:focus-visible {
            outline: 2px solid #0f766e;
            outline-offset: 2px;
          }

          /* Category grid */
          .fl-category-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
          .fl-category-card {
            display: grid;
            gap: 6px;
            padding: 18px;
            border: 1px solid #d7deea;
            border-radius: 12px;
            background: rgba(255,255,255,0.92);
            color: inherit;
            text-decoration: none;
            backdrop-filter: blur(4px);
            transition: border-color 0.14s, box-shadow 0.12s;
          }
          .fl-category-card:hover {
            border-color: #0f766e;
            box-shadow: 0 2px 10px rgba(15,118,110,0.07);
          }
          .fl-category-card:focus-visible {
            outline: 2px solid #0f766e;
            outline-offset: 2px;
          }

          /* Trust strip */
          .fl-trust-strip {
            display: grid;
            gap: 0;
            padding: 26px 28px;
            border: 1px solid #d7deea;
            border-radius: 14px;
            background: #ffffff;
          }
          .fl-trust-strip-items {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 28px;
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

          /* Stewardship */
          .fl-stewardship-wrap {
            display: grid;
            gap: 6px;
            margin-bottom: 4px;
          }
          .fl-stewardship-wrap p {
            margin: 0;
            color: #5d687a;
            line-height: 1.65;
            font-size: 15px;
          }

          /* What Furlong Is Not */
          .fl-not-grid {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
          .fl-not-item {
            display: flex;
            align-items: baseline;
            gap: 10px;
            padding: 14px 16px;
            border: 1px solid #f1c40f22;
            border-radius: 10px;
            background: #fffdf0;
            font-size: 15px;
            line-height: 1.6;
            color: #162033;
          }
          .fl-not-mark {
            font-size: 13px;
            color: #b45309;
            font-weight: 900;
            flex-shrink: 0;
          }

          /* Footer */
          .fl-footer {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            justify-content: center;
            padding-top: 20px;
            border-top: 1px solid #d7deea;
            margin-top: 52px;
          }

          /* America 250 featured exploration label */
          .fl-a250-label {
            display: flex;
            align-items: baseline;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            margin-bottom: 14px;
          }
          .fl-a250-badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 999px;
            background: #eef1f7;
            color: #2d4270;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }
          .fl-a250-copy {
            font-size: 14px;
            color: #5d687a;
            line-height: 1.55;
          }

          /* Responsive */
          @media (max-width: 640px) {
            .fl-hero { padding: 48px 0 28px; gap: 24px; }
            .fl-explore-grid { grid-template-columns: 1fr; }
            .fl-trust-strip-items { gap: 8px 16px; }
            .fl-not-grid { grid-template-columns: 1fr; }
            .fl-a250-label { justify-content: flex-start; }
          }
        `}</style>

        {/* ═══════════════════════════════════════════════════════════════
            1. HERO IDENTITY LAYER
            ══════════════════════════════════════════════════════════════ */}
        <section className="fl-hero" aria-label="Furlong discovery">
          {/* Compass watermark — brand identity behind the hero */}
          <FurlongCompassWatermark variant="hero" />
          <FurlongCompassWatermark variant="subtle" />

          <header className="fl-hero-content fl-hero-copy">
            <h1>
              Furlong helps you discover things you didn&rsquo;t know were possible.
            </h1>
            <p className="fl-hero-sub">
              Discover your possibilities. Explore your options.
              Understand your next steps. Make informed decisions.
            </p>
            <a href="#explore" className="fl-cta-primary">
              What would you like to explore today?
            </a>
            <p className="fl-hero-trust-note">
              You choose what you want to explore. From there, you can personalize
              your journey or continue exploring the full map.
            </p>
          </header>

          {/* ─── 2. AMERICA 250 FEATURED EXPLORATION (Living Opportunity Map) ─ */}
          <div className="fl-hero-content">
            <div className="fl-a250-label">
              <span className="fl-a250-badge">America 250</span>
              <span className="fl-a250-copy">
                Celebrating 250 years of American growth, innovation,
                stewardship, and opportunity.
              </span>
            </div>
            <LivingOpportunityMap stories={AMERICA_250_STORIES} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            3. FULL MAP vs PERSONALIZE CHOICE
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="explore"
          className="fl-section"
          aria-label="How would you like to explore"
          style={{ scrollMarginTop: 80 }}
        >
          <h2 className="fl-section-title">How would you like to explore?</h2>

          <div className="fl-explore-grid">
            <Link href="/onboarding" className="fl-explore-card fl-explore-card--primary">
              <span className="fl-explore-icon" aria-hidden="true">🗺</span>
              <p className="fl-explore-card-title">Explore the Full Map</p>
              <p className="fl-explore-card-desc">
                Browse opportunities, pathways, and ideas without narrowing your
                journey. See the full range of what Furlong can help you discover.
              </p>
              <span className="fl-explore-card-cta">Begin exploring →</span>
            </Link>

            <a href="#topics" className="fl-explore-card">
              <span className="fl-explore-icon" aria-hidden="true">🧭</span>
              <p className="fl-explore-card-title">Focus My Exploration</p>
              <p className="fl-explore-card-desc">
                Choose a topic, location, or goal to help Furlong surface more
                relevant pathways for your specific situation.
              </p>
              <span className="fl-explore-card-cta">Choose where to start →</span>
            </a>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            4. EXPLORATION CATEGORIES
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="topics"
          className="fl-section"
          aria-label="Exploration topics"
          style={{ scrollMarginTop: 80 }}
        >
          <h2 className="fl-section-title">What would you like to explore today?</h2>

          <div className="fl-category-grid">
            {EXPLORATION_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={explorationHref(category.slug)}
                className="fl-category-card"
              >
                <strong style={{ fontSize: 16 }}>{category.label}</strong>
                <span style={{ ...muted, fontSize: 14 }}>{category.blurb}</span>
              </Link>
            ))}
          </div>

          <p style={{ ...muted, margin: 0, fontSize: 14, textAlign: "center" }}>
            Choose a starting point — or just begin exploring. You can change
            direction any time. No account or personal information is needed
            to look around.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            5. TRUST STRIP
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="How Furlong works with you"
        >
          <div className="fl-trust-strip">
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: 18,
                fontWeight: 800,
                color: "#162033",
              }}
            >
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
            6. STEWARDSHIP PREVIEW (gateway to /stewardship)
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="Furlong Stewardship"
        >
          <h2 className="fl-section-title">Meet the Stewards Behind Furlong</h2>
          <StewardshipSection />
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            7. WHAT FURLONG IS NOT
            ══════════════════════════════════════════════════════════════ */}
        <section
          className="fl-section"
          aria-label="What Furlong is not"
        >
          <div style={card}>
            <h2
              className="fl-section-title--left"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              What Furlong Is Not
            </h2>
            <div className="fl-not-grid">
              {WHAT_FURLONG_IS_NOT.map((line) => (
                <span key={line} className="fl-not-item">
                  <span className="fl-not-mark" aria-hidden="true">✗</span>
                  {line}
                </span>
              ))}
            </div>
            <p style={{ ...muted, margin: 0, fontSize: 14 }}>
              Furlong is a discovery and exploration platform. We help you understand
              your options — the decisions and determinations always belong to you
              and to qualified professionals.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            8. FOOTER
            ══════════════════════════════════════════════════════════════ */}
        <footer className="fl-footer" aria-label="Site navigation">
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
