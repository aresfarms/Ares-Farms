"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CustomerJourneyBar } from "@/components/borrower/CustomerJourneyBar";

type Summary = {
  caseId: string;
  propertyAddress: string | null;
  customerGoal: string | null;
  currentStage: string;
  updatedAt: string;
};

function friendlyStage(value: string): string {
  return value.replaceAll("_", " ").toLowerCase();
}

export function MyFurlongCases() {
  const [cases, setCases] = useState<Summary[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void fetch("/api/intelligence/cases", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Saved cases could not be loaded.");
        setCases(Array.isArray(data.cases) ? data.cases : []);
      })
      .catch((caught) => {
        if (caught?.name !== "AbortError") setError(caught instanceof Error ? caught.message : "Saved cases could not be loaded.");
      });
    return () => controller.abort();
  }, [retry]);

  return (
    <section style={{ display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 9 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: ".1em", textTransform: "uppercase", color: "#0f766e" }}>My Furlong</span>
        <h1 style={{ margin: 0, color: "#162033", fontSize: "clamp(30px,5vw,44px)", lineHeight: 1.08 }}>Your properties and projects stay together after the first answer.</h1>
        <p style={{ margin: 0, maxWidth: 760, color: "#526074", lineHeight: 1.65 }}>
          A saved Furlong Case carries the matter from property analysis through readiness, provider permissions, diligence, closing, and later operating memory. Saving is separate from sharing; no provider is selected here and no saved case is broadcast.
        </p>
      </header>

      <CustomerJourneyBar current="prepare" financeHref="/provider-compare" />

      {error ? (
        <div role="alert" style={notice}><p style={{ margin: 0 }}>{error}</p><button onClick={() => setRetry((value) => value + 1)} type="button" style={button}>Try again</button></div>
      ) : cases === null ? (
        <p role="status" style={{ color: "#64748b" }}>Loading your saved cases…</p>
      ) : cases.length === 0 ? (
        <div style={notice}>
          <strong style={{ color: "#162033" }}>No saved cases yet.</strong>
          <span style={{ color: "#526074" }}>Explore a property or project first. You can look around without an account; saving a durable case is a separate choice.</span>
          <Link href="/" style={link}>Explore a property or project →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, color: "#162033", fontSize: 21 }}>Active Furlong Cases</h2>
            <span style={{ color: "#64748b", fontSize: 12.5 }}>{cases.length} saved matter{cases.length === 1 ? "" : "s"}</span>
          </div>
          {cases.map((item) => (
            <article key={item.caseId} style={{ border: "1px solid #ccd6df", borderRadius: 14, padding: 18, background: "#fff", display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 3 }}>
                  <Link href={`/intelligence/cases/${encodeURIComponent(item.caseId)}`} style={{ fontSize: 18, fontWeight: 800, color: "#0f6e56" }}>{item.propertyAddress || item.customerGoal || "Saved Furlong case"}</Link>
                  {item.customerGoal && item.propertyAddress && <span style={{ color: "#526074", fontSize: 13.5 }}>{item.customerGoal}</span>}
                </div>
                <span style={{ borderRadius: 999, padding: "5px 9px", background: "#edf7f3", color: "#0f6e56", fontSize: 11.5, fontWeight: 800 }}>RECORDED STAGE · {friendlyStage(item.currentStage).toUpperCase()}</span>
              </div>
              <span style={{ color: "#64748b", fontSize: 12.5 }}>Updated {new Date(item.updatedAt).toLocaleString()}</span>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <Link href={`/intelligence/cases/${encodeURIComponent(item.caseId)}`} style={secondary}>Open case</Link>
                <Link href="/provider-compare" style={secondary}>How provider comparison works</Link>
                <Link href="/financing-compare" style={secondary}>Compare financing terms</Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <section style={{ border: "1px solid #b9e3d4", borderRadius: 14, background: "#f4fbf8", padding: "16px 18px", display: "grid", gap: 7 }}>
        <strong style={{ color: "#0f6e56" }}>Operate: the relationship should remain useful after the financing event.</strong>
        <span style={{ color: "#526074", fontSize: 13.5, lineHeight: 1.6 }}>Return to the same case for evidence-backed program changes, operating opportunities, environmental obligations, refinancing context, or property records. Furlong should surface a change only when a governed source supports it — never invent activity just to create engagement.</span>
      </section>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Link href="/" style={link}>Start another project</Link><Link href="/status" style={link}>Check a service request</Link></div>
    </section>
  );
}

const notice = { border: "1px solid #d7deea", borderRadius: 14, background: "#f8fafc", padding: 18, display: "grid", gap: 9 } as const;
const button = { justifySelf: "start", border: "1px solid #0f766e", borderRadius: 999, background: "#fff", color: "#0f766e", padding: "8px 12px", fontWeight: 800, cursor: "pointer" } as const;
const link = { color: "#0f766e", fontWeight: 800, textDecoration: "none" } as const;
const secondary = { display: "inline-flex", minHeight: 36, alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 999, padding: "0 12px", color: "#0f6e56", fontWeight: 800, fontSize: 12.5, textDecoration: "none" } as const;
