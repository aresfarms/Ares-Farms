"use client";

import Link from "next/link";

import { MyFurlongCases } from "@/components/intelligence/MyFurlongCases";
import { SavedDraftsRail } from "@/components/property/SavedDraftsRail";

/**
 * Canonical borrower continuity surface.
 * Device-only studies remain private until the customer deliberately creates
 * a durable Furlong Case. Saving, provider selection and sharing are separate acts.
 */
export function MyFurlongDashboard() {
  return (
    <section style={{ display: "grid", gap: 28 }}>
      <header style={{ display: "grid", gap: 9 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: ".1em", textTransform: "uppercase", color: "#0f766e" }}>My Furlong · My Properties</span>
        <h1 style={{ margin: 0, color: "#162033", fontSize: "clamp(31px,5vw,46px)", lineHeight: 1.06 }}>Keep the property, the evidence, the financing work and the next decision together.</h1>
        <p style={{ margin: 0, maxWidth: 820, color: "#526074", fontSize: 16, lineHeight: 1.65 }}>
          Reopen a property you studied on this device or continue a durable Furlong Case. A saved item is not a loan application and is never sent to a provider unless you authorize one named recipient for one exact package.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/discover" style={primary}>Explore another property</Link>
          <Link href="/provider-compare" style={secondary}>How provider comparison works</Link>
        </div>
      </header>
      <section aria-label="Device-only property studies" style={{ display: "grid", gap: 9 }}>
        <div style={{ display: "grid", gap: 3 }}>
          <h2 style={{ margin: 0, color: "#162033", fontSize: 21 }}>Properties saved on this device</h2>
          <span style={{ color: "#64748b", fontSize: 13.5 }}>These stay in this browser until you remove them. They are not uploaded merely because you saved the analysis locally.</span>
        </div>
        <SavedDraftsRail />
      </section>

      <section aria-label="Durable Furlong cases" style={{ borderTop: "1px solid #e2e8f0", paddingTop: 26 }}>
        <MyFurlongCases />
      </section>
    </section>
  );
}

const primary = { display: "inline-flex", minHeight: 42, alignItems: "center", borderRadius: 999, padding: "0 16px", background: "#0f766e", color: "#fff", fontWeight: 800, textDecoration: "none" } as const;
const secondary = { display: "inline-flex", minHeight: 42, alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 999, padding: "0 16px", color: "#0f6e56", fontWeight: 800, textDecoration: "none" } as const;
