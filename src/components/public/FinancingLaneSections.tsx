import Link from "next/link";

import { FinancingIntakePanel } from "@/components/public/FinancingIntakePanel";
import { FinancingFeeChart, FinancingFreeOverview } from "@/components/public/FinancingFeeChart";
import { NavigatorEntryCta } from "@/components/public/NavigatorEntryCta";
import { LoanProgramComparison } from "@/components/public/LoanProgramComparison";
import { accentForLane } from "@/lib/property/laneThemes";
import { activePartners } from "@/lib/modules/licensedModuleRegistry";

/**
 * FinancingLaneSections — the Financial & Capital module's sections. The
 * customer learns how financing works, sees live public capital rates, then
 * submits a deal that is routed to the licensed lender (Stuart / the lending
 * spoke). Wears the financing PURPLE accent. Server component; the intake panel
 * is the one client island.
 *
 * Master Volume Governance:
 * - CONST-PATHWAY-001 / FACILITATION-001: the module facilitates and routes;
 *   it never lends, qualifies, prices, or approves. "A program fitting a
 *   project is not the same as you qualifying."
 * - Section 1071 firewall: no demographic data is collected anywhere here.
 * - Bright line: Furlong takes no transaction-tied compensation.
 * Educational + illustrative; the licensed lender is the decision authority.
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
    body: "You bring the deal; we route it to a licensed lender who reviews the fit and follows up. Furlong is the analysis and coordination layer — it does not lend, qualify, price, or approve, and it takes no fee tied to your transaction.",
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
    body: "Seeing a program that fits your project is a starting point, not an approval. Qualification, rate, and terms are the licensed lender's call, disclosed to you in writing — never assumed here.",
  },
];

export function FinancingLaneSections() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <NavigatorEntryCta lens="financing-capital" support="Use the same Furlong Navigator entry point as the main Compass. Start with a property, business, project, or financing question and carry that context into the capital workspace." />
      {/* Free application promise first, then current rates and program pricing. */}
      <FinancingFreeOverview />
      <LoanProgramComparison />

      <section id="personalized-financing" aria-label="How financing works here" style={{ display: "grid", gap: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PURPLE }}>
          Our dedicated licensed lender
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          The capital side of every property decision. Learn how the programs
          map to your project, see today&apos;s public rates, then send your deal
          to a licensed lender who can actually do the work.
        </p>
        <div style={cardGrid}>
          {FINANCING_BRIEFS.map((b) => (
            <div key={b.title} style={card}>
              <strong style={{ fontSize: 14.5, color: "#101a2b", lineHeight: 1.25 }}>{b.title}</strong>
              <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.55 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Who reviews your deal" style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: PURPLE }}>
          Who reviews your deal
        </span>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {activePartners("financing-capital").map((p) => (
            <div key={p.slug} style={card}>
              <strong style={{ fontSize: 14, color: "#101a2b" }}>{p.name}</strong>
              <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.5 }}>{p.blurb}</span>
            </div>
          ))}
        </div>
      </section>

      <FinancingIntakePanel />

      {/* Optional paid advisory belongs near the bottom, after rates and intake. */}
      <FinancingFeeChart />

      <section aria-label="Related modules" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/explore?lane=environmental-compliance" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#127a4f" }}>Environmental &amp; Compliance →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            A clean Phase I is a lender requirement — the site side of every capital clearance.
          </span>
        </Link>
        <Link href="/explore?lane=farms-agriculture" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2f6d12" }}>Farms, Agriculture &amp; Land →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            FSA, Farm Credit, and the farm economics these financing choices ride on.
          </span>
        </Link>
      </section>

    </div>
  );
}
