import Link from "next/link";

import { FurlongCompassWatermark } from "@/components/brand/FurlongCompassWatermark";
import { FurlongLogo } from "@/components/brand/FurlongLogo";
import { LivingOpportunityMap } from "@/components/customer/LivingOpportunityMap";
import { StewardshipSection } from "@/components/stewardship/StewardshipSection";
import {
  EXPLORATION_CATEGORIES,
  explorationHref,
} from "@/lib/customer-landing/featuredExplorationStories";

/**
 * Furlong homepage — public-facing discovery experience (Build 45).
 *
 * A customer-facing landing page built around the Living Opportunity Map. It
 * is intentionally NOT an internal dashboard: no module/runtime/diagnostic
 * language, no lead-capture-first behavior, and no personal information is
 * collected here. One clear call to action, then a category choice that routes
 * into the exploration flow. The operator/module console lives at /internal.
 */

const TRUST_LANGUAGE = [
  "We personalize with you, not to you.",
  "You choose what you want to explore.",
  "From there, you can personalize your journey or continue exploring the full map.",
  "We do not sell your data.",
  "We show pathways, not promises.",
  "Furlong is not a lender and does not approve, deny, guarantee, or make official determinations.",
];

const HOW_FURLONG_WORKS = [
  "Start with the full map of possibilities before sharing personal information.",
  "Choose one of eight exploration categories or stay broad while you compare paths.",
  "See readiness, financing, program, land, and stewardship context before deciding whether to focus your journey.",
  "Request human review only when you want a deeper next-step conversation.",
];

const WHAT_FURLONG_DOES_NOT_DO = [
  "Approve loans or deny loans.",
  "Guarantee funding, rates, or eligibility.",
  "Track your location or build the map around where you are.",
  "Sell your information or silently submit it to lenders, agencies, or brokers.",
];

const FOOTER_LINKS = [
  { href: "/about", label: "About Furlong" },
  { href: "/trust", label: "How we handle your information" },
  { href: "/data-rights", label: "Your data rights" },
  { href: "/financing-pathways", label: "Financing pathways" },
  { href: "/readiness", label: "Readiness" },
  { href: "/onboarding", label: "Tell us about your project" },
  { href: "/portal/borrower", label: "Borrower portal" },
  { href: "/stewardship", label: "Stewardship" },
];

const shell = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "40px 24px 64px",
  display: "grid",
  gap: 28,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export default function HomePage() {
  return (
    <main style={shell}>
      <div style={container}>
        <style>{`
          .furlong-hero-stage {
            position: relative;
            display: grid;
            gap: 28px;
            overflow: hidden;
            padding: 10px 0 8px;
          }

          .furlong-stage-content {
            position: relative;
            z-index: 1;
          }

          .furlong-hero-copy {
            display: grid;
            gap: 14px;
            justify-items: center;
            text-align: center;
            padding-top: 68px;
          }

          .furlong-hero-copy h1 {
            margin: 0;
            font-size: clamp(42px, 6vw, 72px);
            line-height: 1.05;
            letter-spacing: -0.03em;
            max-width: 980px;
          }

          .furlong-category-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          }

          .furlong-category-card {
            display: grid;
            gap: 6px;
            padding: 18px;
            border: 1px solid #d7deea;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.9);
            color: inherit;
            text-decoration: none;
            backdrop-filter: blur(6px);
          }
        `}</style>

        <section className="furlong-hero-stage">
          <FurlongCompassWatermark variant="hero" />
          <FurlongCompassWatermark variant="subtle" />

          {/* Hero — the logo supports the headline (it does not replace it). */}
          <header className="furlong-stage-content furlong-hero-copy">
            <h1>Furlong helps you discover things you didn’t know were possible.</h1>
            <p
              style={{
                ...muted,
                margin: "0 auto",
                maxWidth: 720,
                fontSize: 18,
              }}
            >
              Discover your possibilities. Explore your options. Understand your
              next steps. Make informed decisions.
            </p>
            <Link
              href="/onboarding"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                padding: "0 22px",
                borderRadius: 999,
                background: "#0f766e",
                color: "#ffffff",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Explore the full map
            </Link>
          </header>

          {/* Category choice */}
          <section className="furlong-stage-content" style={{ display: "grid", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 24, textAlign: "center" }}>
              What would you like to explore today?
            </h2>
            <div className="furlong-category-grid">
              {EXPLORATION_CATEGORIES.map((category) => (
                <Link
                  key={category.slug}
                  href={explorationHref(category.slug)}
                  className="furlong-category-card"
                >
                  <strong style={{ fontSize: 17 }}>{category.label}</strong>
                  <span style={{ ...muted, fontSize: 13 }}>{category.blurb}</span>
                </Link>
              ))}
            </div>
            <p style={{ ...muted, margin: 0, fontSize: 13, textAlign: "center" }}>
              Choose a starting point — or just begin exploring. You can change
              direction any time, and no account or personal information is needed
              to look around.
            </p>
          </section>

          {/* Living Opportunity Map */}
          <div className="furlong-stage-content">
            <LivingOpportunityMap />
          </div>
        </section>

        {/* Trust strip */}
        <section
          aria-label="How Furlong works with you"
          style={{
            display: "grid",
            gap: 10,
            padding: 22,
            border: "1px solid #d7deea",
            borderRadius: 12,
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>How we work with you</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            {TRUST_LANGUAGE.map((line) => (
              <li key={line} style={{ lineHeight: 1.6 }}>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          <article
            style={{
              padding: 22,
              border: "1px solid #d7deea",
              borderRadius: 12,
              background: "#ffffff",
              display: "grid",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22 }}>How Furlong Works</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
              {HOW_FURLONG_WORKS.map((line) => (
                <li key={line} style={{ lineHeight: 1.6 }}>
                  {line}
                </li>
              ))}
            </ul>
          </article>

          <article
            style={{
              padding: 22,
              border: "1px solid #d7deea",
              borderRadius: 12,
              background: "#ffffff",
              display: "grid",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22 }}>What Furlong Does Not Do</h2>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
              {WHAT_FURLONG_DOES_NOT_DO.map((line) => (
                <li key={line} style={{ lineHeight: 1.6 }}>
                  {line}
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* Meet the Stewards — platform-first, introduced after exploration,
            trust, and discovery content. No steward is the hero. */}
        <StewardshipSection />

        {/* Footer links to customer surfaces */}
        <footer
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            borderTop: "1px solid #d7deea",
            paddingTop: 18,
          }}
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}
            >
              {link.label}
            </Link>
          ))}
        </footer>
      </div>
    </main>
  );
}
