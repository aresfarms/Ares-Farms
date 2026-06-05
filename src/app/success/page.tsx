import Link from "next/link";

/**
 * Ares/Furlong Success Page
 *
 * Master Volume Governance:
 * - Vol 0: keeps the portal framed as governed operational infrastructure.
 * - Vol I: avoids implying final credit, financing, legal, or regulatory approval.
 * - Vol II: preserves disclosure boundaries after checkout or intake confirmation.
 * - Vol III: routes users back into stabilized runtime surfaces only.
 * - Vol IV: supports controlled operational handoff after a completed user action.
 * - Vol V: keeps classification, replay, versioning, observability, and human review visible.
 */

const nextActions = [
  // /dashboard (legacy internal decision-runtime diagnostic) is not a
  // Public Alpha customer surface and is removed from this next-step
  // navigation. The Public Alpha customer portal is /portal/borrower.
  {
    href: "/portfolio",
    label: "Review Portfolio Ranking",
    description:
      "Open the governed ranking surface to inspect application ordering, replay-safe lineage, and non-final-credit-decision controls.",
  },
  {
    href: "/onboarding",
    label: "Return to Onboarding",
    description:
      "Continue borrower intake through the governed onboarding workflow if more intake context is needed.",
  },
];

export default function SuccessPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
        color: "#111827",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 24,
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "grid",
            gap: 10,
            borderBottom: "1px solid #d0d7de",
            paddingBottom: 18,
          }}
        >
          <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
            Ares Farms Webportal Build
          </p>
          <h1 style={{ margin: 0, fontSize: 34 }}>Workflow Step Received</h1>
          <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.5 }}>
            Your portal action has returned successfully. Any regulated,
            financial, eligibility, or operational reliance still requires the
            governed runtime checks shown in the next surfaces.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Confirmation Boundary</h2>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 8,
              margin: 0,
            }}
          >
            <dt>Portal Status</dt>
            <dd>Action returned to the webportal</dd>

            <dt>Decision Status</dt>
            <dd>Not a final approval, denial, eligibility finding, or report</dd>

            <dt>Operational Reliance</dt>
            <dd>Requires governed runtime review before use</dd>

            <dt>Human Review</dt>
            <dd>Required before financing, permitting, legal, or regulatory reliance</dd>
          </dl>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Next Governed Steps</h2>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {nextActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 16,
                  border: "1px solid #d0d7de",
                  borderRadius: 8,
                  background: "#ffffff",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <strong style={{ fontSize: 18 }}>{action.label}</strong>
                <span style={{ color: "#475569", lineHeight: 1.4 }}>
                  {action.description}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 8,
            padding: 16,
            border: "1px solid #d0d7de",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Compliance Notice</h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID
            FOR PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.
          </p>
        </section>
      </div>
    </main>
  );
}
