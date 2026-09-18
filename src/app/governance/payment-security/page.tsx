"use client";

import { useEffect, useState } from "react";

type Readiness = {
  stripe?: { configured: boolean; radar: boolean; threeDSecurePolicy: string };
  idme?: { configured: boolean; issuer: string | null; clientIdPresent: boolean; clientSecretPresent: boolean };
  plaid?: { configured: boolean; clientIdPresent: boolean; secretPresent: boolean; environment: string };
  releasePolicy?: string;
};

export default function PaymentSecurityGovernancePage() {
  const [data, setData] = useState<Readiness>({});
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/governance/payment-security/readiness", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Unable to load readiness."); return; }
    setError(null); setData(json);
  }

  useEffect(() => { void refresh(); }, []);
  const card = { border: "1px solid #d7deea", borderRadius: 12, padding: 16, display: "grid", gap: 7 } as const;
  return <main style={{ padding: 28, display: "grid", gap: 18, maxWidth: 900 }}>
    <header style={{ display: "grid", gap: 7 }}>
      <h1 style={{ margin: 0 }}>Payment security & fraud readiness</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>Identity proof, payment risk, bank ownership and release authority are separate controls. Missing connectors fail closed.</p>
    </header>
    {error ? <div role="alert">{error}</div> : null}
    <section style={card}>
      <h2 style={{ margin: 0 }}>Stripe</h2>
      <div>Payments configured: <strong>{data.stripe?.configured ? "Yes" : "No"}</strong></div>
      <div>Radar risk signals available: <strong>{data.stripe?.radar ? "Yes" : "No"}</strong></div>
      <div>3D Secure policy: <strong>{data.stripe?.threeDSecurePolicy ?? "—"}</strong></div>
    </section>
    <section style={card}>
      <h2 style={{ margin: 0 }}>ID.me</h2>
      <div>Identity provider configured: <strong>{data.idme?.configured ? "Yes" : "No"}</strong></div>
      <div>Client ID present: <strong>{data.idme?.clientIdPresent ? "Yes" : "No"}</strong></div>
      <div>Client secret present: <strong>{data.idme?.clientSecretPresent ? "Yes" : "No"}</strong></div>
    </section>
    <section style={card}>
      <h2 style={{ margin: 0 }}>Plaid</h2>
      <div>Bank identity connector configured: <strong>{data.plaid?.configured ? "Yes" : "No"}</strong></div>
      <div>Environment: <strong>{data.plaid?.environment ?? "—"}</strong></div>
      <div>Client ID present: <strong>{data.plaid?.clientIdPresent ? "Yes" : "No"}</strong></div>
      <div>Secret present: <strong>{data.plaid?.secretPresent ? "Yes" : "No"}</strong></div>
    </section>
    <section style={card}>
      <h2 style={{ margin: 0 }}>Release policy</h2>
      <div style={{ lineHeight: 1.6 }}>{data.releasePolicy ?? "Loading…"}</div>
      <div><strong>BLOCK / CHALLENGE / HOLD / SAFE_TO_RELEASE</strong> is evaluated independently from payment success.</div>
    </section>
    <button onClick={() => void refresh()} style={{ justifySelf: "start" }}>Refresh readiness</button>
  </main>;
}
