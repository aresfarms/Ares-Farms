import Link from "next/link";

/**
 * /trust — The Furlong Promise: No BS, Just Facts (Build 51)
 *
 * Governance — required content tokens (publicAlphaSurfaceContent):
 *   foundational-principle : "your information belongs to you"
 *   ten-will-do            : FURLONG_WILL_DO ×10 (verbatim, §WillDo)
 *   twelve-will-not-do     : FURLONG_WILL_NOT_DO ×12 (verbatim, §WillNotDo)
 *   trust-principle        : "informed decision-making" + "prioritize"
 *
 * Required disclosure ids and semantic tokens embedded below:
 *   advisory-only          : "advisory only"
 *   no-reliance            : "no legal, regulatory, or official reliance"
 *   no-public-verification : "not a public verification or official record"
 *   furlong-not-lender     : "not a lender"
 *   ai-tier1-only          : "AI does not decide" + "human review"
 *   data-rights            : "request an accounting, export, deletion, or human review"
 *   free-for-borrowers     : "Borrowers pay nothing"
 *   user-data-sovereignty  : "does not secretly submit" + "no information sale"
 *
 * Public Alpha remains PENDING.
 * "The map reveals opportunities, not the visitor."
 */

export const metadata = {
  title: "The Furlong Promise | Trust",
  description:
    "No BS, just facts. What Furlong will and will not do with your information.",
};

// ── Shared tokens ─────────────────────────────────────────────────────────────

const shell = {
  background: "#f6f8fb",
  color: "#162033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

const container = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "40px 24px 80px",
  display: "grid",
  gap: 28,
} as const;

const navyPanel = {
  background: "#162033",
  borderRadius: 14,
  padding: "32px 28px",
  display: "grid",
  gap: 16,
} as const;

const whitePanel = {
  background: "#ffffff",
  border: "1px solid #d7deea",
  borderRadius: 14,
  padding: "28px 28px",
  display: "grid",
  gap: 14,
} as const;

const goldHeading = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  color: "#c9a84c",
  letterSpacing: -0.01,
  lineHeight: 1.3,
} as const;

const goldStatement = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "#c9a84c",
  lineHeight: 1.65,
  borderTop: "1px solid rgba(201,168,76,0.28)",
  paddingTop: 14,
} as const;

const lightBody = {
  margin: 0,
  fontSize: 16,
  color: "rgba(232,239,250,0.88)",
  lineHeight: 1.65,
} as const;

const darkHeading = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  color: "#162033",
  letterSpacing: -0.01,
} as const;

const listStyle = {
  margin: "8px 0 0",
  paddingLeft: 22,
  color: "#1f2a3d",
  lineHeight: 1.8,
  display: "grid",
  gap: 2,
} as const;

const muted = {
  margin: 0,
  fontSize: 14,
  color: "#5d687a",
  lineHeight: 1.65,
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrustPage() {
  return (
    <div style={shell}>
      <div style={container}>

        {/* Page header */}
        <header style={{ display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.1 }}>
            The Furlong Promise: No BS, Just Facts.
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: "#5d687a", lineHeight: 1.6, maxWidth: 640 }}>
            Plain English. No jargon. No asterisks. No fine print buried in footnotes.
            Here is exactly what we will and will not do — and why.
          </p>
        </header>

        {/* ── SECTION 1: Your Data Belongs to You ─────────────────────────── */}
        <section style={navyPanel} aria-label="Data sovereignty — your information belongs to you">
          <h2 style={goldHeading}>1. Your Data Belongs to You. Period.</h2>

          <p style={lightBody}>
            Your information belongs to you. Not to Furlong. Not to lenders.
            Not to brokers. Not to advertisers. Not to data aggregators.
          </p>

          <p style={lightBody}>
            You remain in control of when your information moves from exploration
            to engagement. Furlong does not secretly submit, sell, or distribute
            your information. There is no information sale. No silent submission.
            No lead generation funded by your data.
          </p>

          <p style={lightBody}>
            You may request an accounting, export, deletion, or human review of
            your information at any time. Your data rights exist from the moment
            you start exploring.
          </p>

          <div style={{ display: "grid", gap: 20, marginTop: 4 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "rgba(232,239,250,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                We will always:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(232,239,250,0.88)", lineHeight: 1.8, display: "grid", gap: 2 }}>
                <li>Explain why information is requested.</li>
                <li>Explain how information is used.</li>
                <li>Explain which recommendations relied upon specific information.</li>
                <li>Explain when additional information is needed.</li>
                <li>Explain when information is shared.</li>
                <li>Explain when information is retained.</li>
                <li>Explain when information can be deleted.</li>
                <li>Explain when information can be exported.</li>
                <li>Preserve evidence lineage and recommendation traceability.</li>
                <li>Allow users to understand how conclusions were reached.</li>
              </ul>
            </div>

            <div>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "rgba(232,239,250,0.7)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                We will never:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "rgba(232,239,250,0.88)", lineHeight: 1.8, display: "grid", gap: 2 }}>
                <li>Sell user information.</li>
                <li>Secretly submit user information to lenders.</li>
                <li>Secretly submit user information to agencies.</li>
                <li>Secretly submit user information to brokers.</li>
                <li>Secretly distribute user information to third parties.</li>
                <li>Generate undisclosed marketing leads.</li>
                <li>Hide recommendation logic.</li>
                <li>Hide pathway exclusions.</li>
                <li>Hide readiness limitations.</li>
                <li>Hide known conflicts.</li>
                <li>Hide known risks.</li>
                <li>Represent user information as verified when it has not been verified.</li>
              </ul>
            </div>
          </div>

          <p style={goldStatement}>
            Trust is not created by collecting information. Trust is created by
            explaining what is happening and why. Furlong will always prioritize
            informed decision-making over hidden processes.
          </p>
        </section>

        {/* ── SECTION 2: What Furlong Actually Is and Is Not ──────────────── */}
        <section style={navyPanel} aria-label="What Furlong is and is not">
          <h2 style={goldHeading}>2. What Furlong Actually Is and Is Not</h2>

          <p style={lightBody}>
            Furlong is not a lender. Furlong is not a bank. Furlong does not approve
            or deny financing. Furlong does not commit funds, and does not decide
            credit, eligibility, or approval.
          </p>

          <p style={lightBody}>
            Furlong does not guarantee outcomes or make official determinations.
            Furlong does not approve, deny, certify, underwrite, or represent itself
            as a regulator, broker, or agency.
          </p>

          <p style={lightBody}>
            AI does not decide. AI does not approve. AI does not determine and does
            not underwrite. Every governed step is reviewed by a human reviewer
            (human review). AI assists with completeness checks and pathway mapping
            only — not with final decisions.
          </p>

          <p style={goldStatement}>
            Furlong is a discovery and exploration platform. We help you understand
            your options — the decisions and determinations always belong to you
            and to qualified professionals.
          </p>
        </section>

        {/* ── SECTION 3: Free Means Free ──────────────────────────────────── */}
        <section style={whitePanel} aria-label="Free for borrowers">
          <h2 style={darkHeading}>3. Free Means Free</h2>
          <p style={{ ...listStyle, margin: 0, padding: 0, display: "block" }}>
            Borrowers pay nothing to use Furlong. Free for borrowers means exactly
            that — no hidden fees, no back-end commissions, and no lead generation
            funded by your data. Furlong does not sell user information to lenders,
            brokers, or anyone else. Our business model does not depend on monetizing
            your exploration.
          </p>
        </section>

        {/* ── SECTION 4: The Fine Print, In Plain English ─────────────────── */}
        <section style={{ ...whitePanel, background: "#f8fafc" }} aria-label="Required disclosures — plain English">
          <h2 style={darkHeading}>4. The Fine Print, In Plain English</h2>

          <p style={muted}>
            This information is advisory only and is not an approval, guarantee, or
            official determination. No legal reliance, no regulatory reliance, and no
            official reliance may be placed on this information. This is not a public
            verification or official record unless explicitly authorized.
          </p>

          <p style={muted}>
            Furlong does not lend, does not commit funds, and does not decide credit,
            eligibility, or approval. Furlong is not a lender, not a bank, not a
            mortgage servicer, and not a government agency.
          </p>

          <p style={muted}>
            AI does not decide, does not approve, does not determine, and does not
            underwrite. Human review governs every material step. No autonomous
            AI decision or determination is made on your behalf.
          </p>

          <p style={muted}>
            You may exercise your data rights at any time: request an accounting,
            export, deletion, or human review of your information. Borrowers pay
            nothing. Free for borrowers. Your information belongs to you.
            Furlong does not secretly submit, sell, or distribute your information.
            No silent submission and no information sale.
          </p>
        </section>

        {/* Footer nav */}
        <footer style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingTop: 8, borderTop: "1px solid #d7deea" }}>
          <Link href="/" style={{ color: "#0f766e", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Home
          </Link>
          <Link href="/data-rights" style={{ color: "#0f766e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Data Rights
          </Link>
          <Link href="/about" style={{ color: "#0f766e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            About
          </Link>
          <Link href="/onboarding" style={{ color: "#0f766e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Start Exploring
          </Link>
          <Link href="/stewardship" style={{ color: "#0f766e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Stewardship
          </Link>
        </footer>

      </div>
    </div>
  );
}
