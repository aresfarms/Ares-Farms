import { cookies } from "next/headers";
import Link from "next/link";

import { FinancingIntakePanel } from "@/components/public/FinancingIntakePanel";
import {
  FinancingFeeChart,
  FinancingFreeOverview,
} from "@/components/public/FinancingFeeChart";
import { NavigatorEntryCta } from "@/components/public/NavigatorEntryCta";
import { LoanProgramComparison } from "@/components/public/LoanProgramComparison";
import { accentForLane } from "@/lib/property/laneThemes";
import { resolveNextAuthSecret } from "@/lib/auth/nextAuthSecurity";
import {
  SYNTHETIC_FIXTURE_COOKIE,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";

/**
 * FinancingLaneSections — the Financial & Capital module's sections. The
 * customer learns how financing works, sees live public capital rates, then
 * submits a deal into the owner-controlled Capital Desk. A later external
 * financing handoff requires a certified recipient plus exact borrower consent.
 * Wears the financing PURPLE accent. Server component; the intake panel
 * is the one client island.
 *
 * Master Volume Governance:
 * - CONST-PATHWAY-001 / FACILITATION-001: the module facilitates and routes;
 *   it never lends, qualifies, prices, or approves. "A program fitting a
 *   project is not the same as you qualifying."
 * - Section 1071 firewall: no demographic data is collected anywhere here.
 * - Bright line: paid brokerage/packaging is not activated by intake; any later
 *   compensation requires the commercial-finance authority gate.
 * Educational + illustrative; the funding institution is the decision authority.
 */

const PURPLE = accentForLane("financing-capital", "light"); // #534AB7

const card = {
  display: "grid",
  gap: 6,
  alignContent: "start",
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "14px 15px",
} as const;

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 12,
  alignItems: "start",
} as const;

interface FinBrief {
  title: string;
  body: string;
}

const FINANCING_BRIEFS: FinBrief[] = [
  {
    title: "How this works",
    body: "You bring the deal; the Furlong Capital Desk organizes readiness, compares pathways, and identifies possible lender categories. No outside lender or broker receives the case from this intake alone, and Furlong Core does not lend, qualify, price, or approve.",
  },
  {
    title: "SBA, USDA, or conventional — the quick map",
    body: "SBA 7(a) and 504 fit most owner-occupied commercial and equipment needs; USDA B&I and FSA fit rural business and farm ground; conventional fits when the deal is strong and speed matters. The lender confirms which actually fits you.",
  },
  {
    title: "What the lender will want",
    body: "Generally: what you're buying or building, roughly how much, your timeline, and enough on the business and the collateral to size the deal. You don't need it all to start — the lender tells you what's missing.",
  },
  {
    title: "A program fitting ≠ you qualifying",
    body: "Seeing a program that fits your project is a starting point, not an approval. Qualification, rate, and terms are the funding lender's call, disclosed to you in writing — never assumed here.",
  },
];

export async function FinancingLaneSections() {
  const secret = resolveNextAuthSecret();
  const cookieStore = await cookies();
  const activeFixture = secret
    ? verifySyntheticFixtureSessionToken(
        cookieStore.get(SYNTHETIC_FIXTURE_COOKIE)?.value,
        secret,
      )
    : null;
  const lenderScenario =
    activeFixture &&
    [
      "lender-intake",
      "lender-proforma-review",
      "lender-document-upload",
      "lender-signature",
      "lender-dispatch-sandbox",
      "full-lender-lifecycle",
    ].includes(activeFixture.scenarioId)
      ? activeFixture
      : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <NavigatorEntryCta
        lens="financing-capital"
        support="Use the same Furlong Navigator entry point as the main Compass. Start with a property, business, project, or financing question and carry that context into the capital workspace."
      />
      {/* Free application promise first, then current rates and program pricing. */}
      <FinancingFreeOverview />
      <LoanProgramComparison />

      <section
        id="personalized-financing"
        aria-label="How financing works here"
        style={{ display: "grid", gap: 12 }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: PURPLE,
          }}
        >
          Furlong Capital Desk
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#3b475a",
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          The capital side of every property decision. Learn how the programs
          map to your project, see current public rate context, then place the
          deal in the Capital Desk so readiness and lender-network options can be organized before any external handoff.
        </p>
        <div style={cardGrid}>
          {FINANCING_BRIEFS.map((b) => (
            <div key={b.title} style={card}>
              <strong
                style={{ fontSize: 14.5, color: "#101a2b", lineHeight: 1.25 }}
              >
                {b.title}
              </strong>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#3b475a",
                  lineHeight: 1.55,
                }}
              >
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Who reviews your deal"
        style={{ display: "grid", gap: 8 }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: PURPLE,
          }}
        >
          Who reviews your deal
        </span>
        <div style={card}>
          <strong style={{ fontSize: 14, color: "#101a2b" }}>
            Capital Desk first; funding institution second
          </strong>
          <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.5 }}>
            Furlong organizes the case and identifies possible institutions. Candidate lenders are not represented as partners until certification is complete. The selected funding institution performs underwriting and makes the credit decision.
          </span>
        </div>
      </section>

      <section
        aria-label="Furlong Capital Network"
        style={{ ...card, borderColor: "#c9c4f3", background: "#f8f7ff" }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: PURPLE,
          }}
        >
          One case · multiple providers
        </span>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>
          The Capital Network is built for choice, not a single-lender funnel.
        </strong>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Certified brokers and funding institutions declare the states, programs, deal sizes, and transaction types they actually work. Furlong compares those declared profiles to your case without making a credit decision. You choose which matched providers you want to work with, and choosing one does not send the file — package-specific consent and recipient verification still come first.
        </p>
        <Link
          href="/capital-network/onboarding"
          style={{ color: PURPLE, fontSize: 12.5, fontWeight: 800, textDecoration: "none", width: "fit-content" }}
        >
          Broker or lender? Apply to join the Capital Network →
        </Link>
      </section>

      {/* Stable anchor for every financing-intake entry point. */}
      <div id="lender-intake">
        <FinancingIntakePanel syntheticFixture={lenderScenario} />
      </div>

      {/* Optional paid advisory belongs near the bottom, after rates and intake. */}
      <FinancingFeeChart />

      <section
        aria-label="Related modules"
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <Link
          href="/explore?lane=environmental-compliance"
          style={{ ...card, textDecoration: "none" }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "#127a4f" }}>
            Environmental &amp; Compliance →
          </span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            A clean Phase I is a lender requirement — the site side of every
            capital clearance.
          </span>
        </Link>
        <Link
          href="/explore?lane=farms-agriculture"
          style={{ ...card, textDecoration: "none" }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2f6d12" }}>
            Farms, Agriculture &amp; Land →
          </span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            FSA, Farm Credit, and the farm economics these financing choices
            ride on.
          </span>
        </Link>
        {/* Surfaced 2026-07-28: the ranked pathway engine was live but reachable
            only from a workspace deep-link — a working tool with no door. */}
        <Link
          href="/financing-pathways"
          style={{ ...card, textDecoration: "none" }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>
            Rank your financing pathways →
          </span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Answer a few questions about the project and see which federal lanes
            fit best, with the reasons and what each still needs — guidance,
            never an approval.
          </span>
        </Link>
      </section>
    </div>
  );
}
