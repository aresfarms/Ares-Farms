import Link from "next/link";

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
        {/* Hero */}
        <header style={{ display: "grid", gap: 14, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.12 }}>
            Furlong helps you discover things you didn’t know were possible.
          </h1>
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
        </header>

        {/* Primary CTA + category choice */}
        <section style={{ display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24, textAlign: "center" }}>
            What would you like to explore today?
          </h2>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            }}
          >
            {EXPLORATION_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={explorationHref(category.slug)}
                style={{
                  display: "grid",
                  gap: 6,
                  padding: 18,
                  border: "1px solid #d7deea",
                  borderRadius: 12,
                  background: "#ffffff",
                  color: "inherit",
                  textDecoration: "none",
                }}
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
        <LivingOpportunityMap />

        {/* Trust language */}
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
