import Link from "next/link";

import {
  STEWARDSHIP_DOMAINS,
  STEWARDSHIP_INTRO,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * "Meet the Stewards Behind Furlong" — homepage section (Build 44-A).
 *
 * Platform-first: this is introduced AFTER exploration, trust, and discovery
 * content. No steward is the homepage hero. Stewards are shown as the CURRENT
 * stewards of persistent domains; each domain links to its own profile page.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function StewardshipSection() {
  return (
    <section
      aria-label="Meet the stewards behind Furlong"
      style={{
        display: "grid",
        gap: 14,
        padding: 24,
        border: "1px solid #d7deea",
        borderRadius: 12,
        background: "#ffffff",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 24 }}>Meet the Stewards Behind Furlong</h2>
      <div style={{ display: "grid", gap: 6 }}>
        {STEWARDSHIP_INTRO.map((line) => (
          <p key={line} style={{ ...muted, margin: 0 }}>
            {line}
          </p>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginTop: 4,
        }}
      >
        {STEWARDSHIP_DOMAINS.map((domain) => (
          <Link
            key={domain.domainId}
            href={domain.profileRoute}
            style={{
              display: "grid",
              gap: 6,
              padding: 16,
              border: "1px solid #d7deea",
              borderRadius: 10,
              background: "#f8fafc",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <strong style={{ fontSize: 16 }}>{domain.domainName}</strong>
            <span style={{ ...muted, fontSize: 13 }}>
              Current Steward: {domain.currentSteward}
            </span>
            <span style={{ color: "#0f766e", fontSize: 13 }}>
              See what this steward helps illuminate →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
