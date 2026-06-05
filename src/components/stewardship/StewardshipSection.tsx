import Link from "next/link";

import {
  STEWARDSHIP_DOMAINS,
  STEWARDSHIP_TAGLINE,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * Homepage stewardship preview (Build 48).
 *
 * Compact gateway: shows tagline, domain cards, and a link to the full
 * stewardship overview. Not the primary stewardship experience — that lives
 * at /stewardship and /stewardship/<domainId>.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function StewardshipSection() {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        padding: "22px 24px",
        border: "1px solid #d7deea",
        borderRadius: 12,
        background: "#ffffff",
      }}
    >
      <p style={{ ...muted, margin: 0, fontSize: 15 }}>{STEWARDSHIP_TAGLINE}</p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {STEWARDSHIP_DOMAINS.map((domain) => (
          <Link
            key={domain.domainId}
            href={domain.profileRoute}
            style={{
              display: "grid",
              gap: 5,
              padding: "14px 16px",
              border: "1px solid #d7deea",
              borderRadius: 10,
              background: "#f8fafc",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <strong style={{ fontSize: 15 }}>{domain.domainName}</strong>
            <span style={{ ...muted, fontSize: 13 }}>
              Current Steward: {domain.currentSteward}
            </span>
            <span style={{ color: "#0f766e", fontSize: 13 }}>
              See what this steward helps illuminate →
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/stewardship"
        style={{
          color: "#0f766e",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Explore all stewardship domains →
      </Link>
    </div>
  );
}
