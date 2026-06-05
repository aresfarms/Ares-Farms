import { PortableSurfaceIndexPage } from "@/app/portal/verticalSurfacePage";

/*
  Public Alpha Surface Content — Route 7 (Human Escalation)
  Source: docs/PUBLIC_ALPHA_SURFACE_CONTENT.md §Route 7
  Renders the four-stage escalation, the five reviewer roles
  (sourced from Vol VII Operational Annex + Module 45), and
  next-step guidance — visible-on-render.
*/

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 12,
  padding: 28,
  marginBottom: 16,
} as const;

export default function BorrowerPortalPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        color: "#162033",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: 24,
          display: "grid",
          gap: 18,
        }}
      >
        <section aria-label="Public Alpha human escalation" style={panelStyle}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              color: "#162033",
            }}
          >
            Human escalation
          </h1>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginTop: 20,
              color: "#162033",
            }}
          >
            You decide when your information moves stages
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#162033",
              lineHeight: 1.7,
            }}
          >
            Users decide when information moves from:
            <br />
            <strong>Exploration</strong> &nbsp;→&nbsp;{" "}
            <strong>Human Review</strong> &nbsp;→&nbsp;{" "}
            <strong>Lender Engagement</strong> &nbsp;→&nbsp;{" "}
            <strong>Application Submission</strong>.
            <br />
            Furlong may recommend escalation but will not silently
            perform escalation.
          </p>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginTop: 20,
              color: "#162033",
            }}
          >
            Available human review paths
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#162033",
              lineHeight: 1.6,
            }}
          >
            Each escalation lands on a named, credentialed human reviewer
            (human review). Names are recorded in the Vol VII Operational
            Annex and surfaced on request via REQUEST_HUMAN_REVIEW.
          </p>
          <ul
            style={{
              marginTop: 8,
              marginBottom: 0,
              paddingLeft: 22,
              color: "#162033",
              lineHeight: 1.7,
            }}
          >
            <li>
              <strong>Borrower intake</strong> — Borrower Intake Reviewer.
            </li>
            <li>
              <strong>Document review</strong> — Document Verification Reviewer.
            </li>
            <li>
              <strong>Independent governance review</strong> — Qualified Governance Reviewer.
            </li>
            <li>
              <strong>Data-rights fulfillment</strong> — Data Rights Officer.
            </li>
            <li>
              <strong>Final authority decisions</strong> — Chief Governance Authority.
            </li>
          </ul>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginTop: 20,
              color: "#162033",
            }}
          >
            Next step
          </h2>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#162033",
              lineHeight: 1.7,
            }}
          >
            Whatever you do next is your decision. We will tell you what
            we recommend, what the trade-offs are, and what the next
            stage requires.
          </p>

          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "#5d687a",
              lineHeight: 1.6,
            }}
          >
            This information is advisory only and is not an approval,
            guarantee, or official determination. Furlong does not lend,
            does not commit funds, and does not decide credit,
            eligibility, or approval. AI does not decide, does not
            approve, does not determine, and does not underwrite — every
            decision is reviewed by a human reviewer (human review).
          </p>
        </section>

        <PortableSurfaceIndexPage
          audience="borrower"
          title="Borrower Portal"
          subtitle="Borrower application, document, notice, report, and data-rights surfaces using the same Master Volume governed language."
        />
      </div>
    </main>
  );
}
