import Link from "next/link";

import { StewardshipTabBar } from "@/components/stewardship/StewardshipTabBar";
import {
  STEWARDSHIP_DOCTRINE_RULES,
  STEWARDSHIP_DOMAINS,
  STEWARDSHIP_INTRO,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * /stewardship — public stewardship overview (Build 48).
 *
 * Entry point for all stewardship domains. Accessible from the top navigation.
 * Shows the stewardship purpose statement, the three domain tabs, and domain
 * cards linking to each domain page.
 *
 * Domains persist independently of the individuals who currently steward them.
 * Platform-first, advisory, customer-in-control.
 */

const container = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "40px 24px 56px",
  display: "grid",
  gap: 28,
} as const;

const card = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 12,
  padding: 20,
} as const;

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export default function StewardshipIndexPage() {
  return (
    <div style={container}>
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Furlong Stewardship</h1>
          {STEWARDSHIP_INTRO.map((line) => (
            <p key={line} style={{ ...muted, margin: 0 }}>
              {line}
            </p>
          ))}
        </header>

        {/* Domain tab bar — no active tab on the overview */}
        <div>
          <StewardshipTabBar />

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {STEWARDSHIP_DOMAINS.map((domain) => (
              <Link
                key={domain.domainId}
                href={domain.profileRoute}
                style={{
                  ...card,
                  display: "grid",
                  gap: 8,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.14s, box-shadow 0.14s",
                }}
              >
                <strong style={{ fontSize: 17 }}>{domain.domainName}</strong>
                <span style={{ ...muted, fontSize: 14 }}>
                  {domain.description}
                </span>
                <span style={{ color: "#0f766e", fontSize: 14, fontWeight: 600 }}>
                  Explore this domain →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <section style={{ ...card, background: "#f8fafc" }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>How stewardship works</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            {STEWARDSHIP_DOCTRINE_RULES.map((rule) => (
              <li key={rule} style={{ lineHeight: 1.6 }}>
                {rule}
              </li>
            ))}
          </ul>
        </section>

        {/* Page-level footer: contextual CTA only. Site nav is in the layout header/footer. */}
      </div>
  );
}
