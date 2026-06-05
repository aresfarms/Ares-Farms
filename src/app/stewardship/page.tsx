import Link from "next/link";

import {
  STEWARDSHIP_DOCTRINE_RULES,
  STEWARDSHIP_DOMAINS,
  STEWARDSHIP_INTRO,
} from "@/lib/stewardship/stewardshipRegistry";

/**
 * /stewardship — public stewardship index (Build 44-A).
 *
 * The "Stewardship" footer link target. Lists the current stewardship domains
 * (each persists independently of its current steward) and the stewardship
 * doctrine. Platform-first, advisory, customer-in-control.
 */

const shell = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "40px 24px 56px",
  display: "grid",
  gap: 22,
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
    <main style={shell}>
      <div style={container}>
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>Furlong Stewardship</h1>
          {STEWARDSHIP_INTRO.map((line) => (
            <p key={line} style={{ ...muted, margin: 0 }}>
              {line}
            </p>
          ))}
        </header>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Stewardship domains</h2>
          <div
            style={{
              display: "grid",
              gap: 12,
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
                  gap: 6,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <strong style={{ fontSize: 17 }}>{domain.domainName}</strong>
                <span style={{ ...muted, fontSize: 13 }}>
                  Current Steward: {domain.currentSteward}
                </span>
                <span style={{ ...muted, fontSize: 13 }}>
                  {domain.description}
                </span>
                <span style={{ color: "#0f766e", fontSize: 13 }}>
                  View domain →
                </span>
              </Link>
            ))}
          </div>
        </section>

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

        <footer style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Link href="/" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            Home
          </Link>
          <Link href="/onboarding" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            Tell us about your project
          </Link>
          <Link href="/trust" style={{ color: "#0f766e", fontSize: 14, textDecoration: "none" }}>
            How we handle your information
          </Link>
        </footer>
      </div>
    </main>
  );
}
