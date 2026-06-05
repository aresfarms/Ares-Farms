import Link from "next/link";

import {
  PUBLIC_TRUST_BORROWER_PROTECTIONS,
  PUBLIC_TRUST_CANONICAL_DISCLOSURES,
  PUBLIC_TRUST_WHAT_FURLONG_IS,
  PUBLIC_TRUST_WHAT_FURLONG_IS_NOT,
} from "@/lib/trust/trustPagesRuntime";

/**
 * About Furlong Page
 *
 * Master Volume Governance:
 * - Vol 0: presents the public orientation in borrower- and public-safe
 *   language.
 * - Vol I: keeps the about surface subordinate to constitutional authority.
 * - Vol II: blocks public copy that implies approval, eligibility, credit,
 *   underwriting, lender commitment, environmental clearance, certification,
 *   public verification, or regulatory or legal reliance.
 * - Vol III-B: surfaces production-block and human-review posture.
 * - Vol IV: routes visitors to readiness, data rights, financing pathways,
 *   opportunities, and environmental intake.
 * - Vol V-VII: preserves canonical claims governance, disclosure, source
 *   authority, and conformance boundaries on the public surface.
 */

const shellStyle = {
  minHeight: "100vh",
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const containerStyle = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: 24,
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 8,
} as const;

const mutedText = {
  color: "#5d687a",
  lineHeight: 1.5,
} as const;

function StatusBadge(props: {
  tone: "blocked" | "review" | "neutral";
  text: string;
}) {
  const tones = {
    blocked: { background: "#fff1f0", color: "#b42318" },
    review: { background: "#fff7ed", color: "#9a3412" },
    neutral: { background: "#eef2f7", color: "#475569" },
  } as const;
  const tone = tones[props.tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "0 10px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.text}
    </span>
  );
}

export default function AboutFurlongPage() {
  return (
    <main style={shellStyle}>
      <div style={containerStyle}>
        {/*
          Public Alpha Surface Content — Route 1 (Founder Introduction)
          Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 1
          Registry: src/lib/customer-journey/publicAlphaSurfaceContent.ts
          Rendered visible-on-render (no click, no accordion, no modal).
          See Build 41 closure doc for traceability.
        */}
        <section
          aria-label="Public Alpha founder introduction"
          style={{
            background: "#ffffff",
            border: "1px solid #d7deea",
            borderRadius: 12,
            padding: 28,
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#162033" }}>
            Compass to Capital
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: "#162033" }}>
            Furlong exists to help people understand their options before
            they commit significant time, money, effort, or personal
            information to a path. We are a compass, not a lender. Every
            decision that affects you is cleared by a named, credentialed
            human; no AI clears anything; no one clears their own request.
          </p>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, color: "#162033" }}>
            Furlong does not:
          </h2>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.7 }}>
            <li>approve loans</li>
            <li>deny loans</li>
            <li>issue underwriting decisions</li>
            <li>issue agency determinations</li>
            <li>guarantee funding</li>
          </ul>

          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: "#162033" }}>
            Furlong helps users understand:
          </h2>
          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 22, color: "#162033", lineHeight: 1.7 }}>
            <li>available pathways</li>
            <li>readiness gaps</li>
            <li>documentation needs</li>
            <li>financing realities</li>
            <li>environmental considerations</li>
            <li>next recommended actions</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 14, color: "#3b475a", fontStyle: "italic" }}>
            — before significant time, money, or effort are committed.
          </p>

          <p style={{ marginTop: 20, fontSize: 14, color: "#5d687a", lineHeight: 1.6 }}>
            This information is advisory only and is not an approval,
            guarantee, or official determination. No legal, regulatory, or
            official reliance may be placed on this information. Furlong
            does not lend, does not commit funds, and does not decide
            credit, eligibility, or approval. Your information belongs to
            you. Furlong does not secretly submit, sell, or distribute
            your information.
          </p>
        </section>

        <section
          style={{
            ...panelStyle,
            padding: 24,
            display: "grid",
            gap: 14,
          }}
        >
          <span
            style={{
              color: "#456077",
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            About Furlong
          </span>
          <h1 style={{ margin: 0, fontSize: 38, lineHeight: 1.1 }}>
            Governed coordination and advisory guidance for farmer-borrowers.
          </h1>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Furlong is a governed coordination platform. It helps farmer-borrowers,
            lenders, sponsors, and operators organize intake, review, and
            evidence. All outputs are advisory and review-bound. Furlong does
            not lend, underwrite, certify, or grant any public verification.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusBadge tone="review" text="Advisory only" />
            <StatusBadge tone="blocked" text="No approval" />
            <StatusBadge tone="blocked" text="No credit decision" />
            <StatusBadge tone="blocked" text="No public verification" />
            <StatusBadge tone="blocked" text="No legal reliance" />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/trust"
              style={{
                color: "#1d4ed8",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              See protections and disclosures →
            </Link>
            <Link
              href="/onboarding"
              style={{
                color: "#1d4ed8",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Start borrower onboarding →
            </Link>
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>What Furlong is</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {PUBLIC_TRUST_WHAT_FURLONG_IS.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 14,
                  display: "grid",
                  gap: 6,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: 16 }}>{item.label}</strong>
                <p style={{ ...mutedText, margin: 0, fontSize: 14 }}>
                  {item.description}
                </p>
                <Link
                  href={item.reviewRoute}
                  style={{
                    color: "#1d4ed8",
                    fontWeight: 800,
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  {item.reviewRoute}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>What Furlong is not</h2>
          <p style={{ ...mutedText, margin: 0 }}>
            Furlong remains advisory across every surface. The boundaries below
            apply to every Furlong output.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#334155" }}>
            {PUBLIC_TRUST_WHAT_FURLONG_IS_NOT.map((item) => (
              <li key={item.id} style={{ marginBottom: 10 }}>
                <strong>{item.label}.</strong>{" "}
                <span style={mutedText}>{item.rationale}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...panelStyle, padding: 22, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 26 }}>What protections apply</h2>
          <p style={{ ...mutedText, margin: 0, maxWidth: 760 }}>
            Furlong protections apply across every governed module. See the
            full protections page for governance references and review routes.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {PUBLIC_TRUST_BORROWER_PROTECTIONS.slice(0, 6).map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 6,
                  padding: 14,
                  display: "grid",
                  gap: 6,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ fontSize: 15 }}>{item.label}</strong>
                <p style={{ ...mutedText, margin: 0, fontSize: 14 }}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <Link
            href="/trust"
            style={{
              color: "#1d4ed8",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            See all protections and disclosures →
          </Link>
        </section>

        <section style={{ ...panelStyle, padding: 22 }}>
          <h2 style={{ marginTop: 0, fontSize: 22 }}>Required disclosures</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#475569" }}>
            {PUBLIC_TRUST_CANONICAL_DISCLOSURES.slice(0, 10).map((disclosure) => (
              <li key={disclosure}>{disclosure}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
