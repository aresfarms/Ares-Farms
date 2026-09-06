"use client";

import { FormEvent, useEffect, useState } from "react";

const PROGRAMS = ["sba_7a", "sba_504", "usda_bi", "fsa", "ag_conventional", "commercial_conventional"];

export default function CapitalNetworkOnboardingPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [providerRole, setProviderRole] = useState("LENDER");
  const [providerType, setProviderType] = useState("BANK");
  const [website, setWebsite] = useState("");
  const [states, setStates] = useState("DE, MD");
  const [programs, setPrograms] = useState<string[]>([]);
  const [minDealAmount, setMinDealAmount] = useState("");
  const [maxDealAmount, setMaxDealAmount] = useState("");
  const [acceptsBrokeredDeals, setAcceptsBrokeredDeals] = useState(true);
  const [acceptsDirectBorrower, setAcceptsDirectBorrower] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [mine, setMine] = useState<Array<Record<string, unknown>>>([]);
  const [busy, setBusy] = useState(false);

  async function loadMine() {
    const res = await fetch("/api/capital-network/providers?mine=1");
    const data = await res.json();
    if (res.ok && data.ok === true) setMine(Array.isArray(data.providers) ? data.providers : []);
  }
  useEffect(() => { void loadMine(); }, []);

  function toggleProgram(code: string) {
    setPrograms((current) => current.includes(code) ? current.filter((value) => value !== code) : [...current, code]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/capital-network/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          providerRole,
          providerType,
          website: website || null,
          states: states.split(",").map((value) => value.trim()).filter(Boolean),
          programs,
          minDealAmount: minDealAmount ? Number(minDealAmount) : null,
          maxDealAmount: maxDealAmount ? Number(maxDealAmount) : null,
          acceptsBrokeredDeals,
          acceptsDirectBorrower,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok !== true) throw new Error(data.error ?? "Application failed.");
      setMessage("Application recorded. It grants no case access or routing authority; Furlong must complete credential, participation, data, compensation/conflict, and connector review before activation.");
      await loadMine();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Application failed.");
    } finally {
      setBusy(false);
    }
  }

  const field = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 11px", fontSize: 14 };
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "36px 20px 64px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ display: "grid", gap: 7 }}>
          <span style={{ color: "#534AB7", fontSize: 12, fontWeight: 850, letterSpacing: "0.08em", textTransform: "uppercase" }}>Furlong Capital Network</span>
          <h1 style={{ margin: 0, color: "#101a2b", fontSize: 32 }}>Provider onboarding</h1>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>Brokers and funding institutions declare where and what they actually work. Furlong verifies the organization, professional authority, participation terms, data boundary, compensation/conflict posture, and delivery channel before a profile can match to borrower cases.</p>
        </header>
        <form onSubmit={(event) => void submit(event)} style={{ background: "#fff", border: "1px solid #d7deea", borderRadius: 14, padding: 18, display: "grid", gap: 13 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Organization<input style={field} value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Role<select style={field} value={providerRole} onChange={(e) => setProviderRole(e.target.value)}><option value="LENDER">Funding lender / institution</option><option value="BROKER">Commercial finance broker</option></select></label>
            <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Provider type<input style={field} value={providerType} onChange={(e) => setProviderType(e.target.value)} placeholder="BANK, SBA_CDC_504, FARM_CREDIT, COMMERCIAL_BROKER…" /></label>
          </div>
          <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Website<input style={field} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" /></label>
          <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>States served<input style={field} value={states} onChange={(e) => setStates(e.target.value)} placeholder="DE, MD, PA" /></label>
          <fieldset style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}><legend style={{ fontSize: 12.5, fontWeight: 800 }}>Programs / capital lanes</legend><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{PROGRAMS.map((code) => <label key={code} style={{ fontSize: 12.5, display: "flex", gap: 5 }}><input type="checkbox" checked={programs.includes(code)} onChange={() => toggleProgram(code)} />{code.replaceAll("_", " ")}</label>)}</div></fieldset>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Minimum deal amount<input style={field} inputMode="numeric" value={minDealAmount} onChange={(e) => setMinDealAmount(e.target.value)} /></label>
            <label style={{ display: "grid", gap: 5, fontSize: 12.5, fontWeight: 700 }}>Maximum deal amount<input style={field} inputMode="numeric" value={maxDealAmount} onChange={(e) => setMaxDealAmount(e.target.value)} /></label>
          </div>
          <label style={{ fontSize: 12.5, display: "flex", gap: 7 }}><input type="checkbox" checked={acceptsBrokeredDeals} onChange={(e) => setAcceptsBrokeredDeals(e.target.checked)} />Accept broker-submitted transactions</label>
          <label style={{ fontSize: 12.5, display: "flex", gap: 7 }}><input type="checkbox" checked={acceptsDirectBorrower} onChange={(e) => setAcceptsDirectBorrower(e.target.checked)} />Accept direct borrower transactions</label>
          <button disabled={busy || !organizationName.trim()} style={{ justifySelf: "start", border: 0, borderRadius: 10, padding: "10px 16px", background: "#534AB7", color: "#fff", fontWeight: 800 }}>{busy ? "Recording…" : "Submit provider application"}</button>
          {message && <p role="status" style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.55 }}>{message}</p>}
        </form>
        {mine.length > 0 && <section style={{ background: "#fff", border: "1px solid #d7deea", borderRadius: 14, padding: 18, display: "grid", gap: 9 }}><h2 style={{ margin: 0, fontSize: 18 }}>Your provider applications</h2>{mine.map((row) => <div key={String(row.providerId)} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, fontSize: 13, color: "#475569" }}><strong style={{ color: "#101a2b" }}>{String(row.organizationName)}</strong> · {String(row.providerRole)} · {String(row.status)} · profile v{String(row.profileVersion)}</div>)}</section>}
        <p style={{ margin: 0, color: "#64748b", fontSize: 12.5, lineHeight: 1.6 }}>An application is not a Furlong endorsement, listing, contract, license certification, borrower-data entitlement, or promise of referrals. Provider activation is a separate governed decision.</p>
      </div>
    </main>
  );
}
