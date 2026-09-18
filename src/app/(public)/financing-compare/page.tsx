import type { Metadata } from "next";
import Link from "next/link";
import { CustomerJourneyBar } from "@/components/borrower/CustomerJourneyBar";
import { FinancingCostComparator } from "@/components/financing/FinancingCostComparator";
import { Disclosures } from "@/components/public/Disclosures";

export const metadata: Metadata = {
  title: "Compare Financing Cost | Furlong",
  description: "Compare cash equity, payment, debt service, DSCR, interest, fees and balloon exposure using the financing terms you enter.",
};

export default function FinancingComparePage() {
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "42px 24px 80px", display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", color: "#534ab7" }}>Furlong financing screen</span>
        <h1 style={{ margin: 0, color: "#162033", fontSize: "clamp(31px,5vw,48px)", lineHeight: 1.06 }}>Compare the real shape of two financing options — not just the rate.</h1>
        <p style={{ margin: 0, maxWidth: 810, color: "#526074", fontSize: 16.5, lineHeight: 1.65 }}>Enter the terms from a published program, lender indication, or term sheet. Furlong shows the equity cash, payment, annual debt service, optional DSCR, interest through the stated term, and any modeled balloon so a lower rate does not hide a worse structure.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href="/explore?lane=financing-capital" style={{ color: "#534ab7", fontWeight: 800 }}>Review program context →</Link><Link href="/capital-network" style={{ color: "#0f766e", fontWeight: 800 }}>Compare verified providers →</Link></div>
      </header>
      <CustomerJourneyBar current="finance" />
      <FinancingCostComparator />
      <Disclosures variant="full" />
    </main>
  );
}
