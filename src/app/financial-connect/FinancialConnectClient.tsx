"use client";

import { useCallback, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

import { CONSENTS } from "@/lib/privacy/consentRegistry";

type LinkGrant = { linkToken: string; authorizationRef: string };

export default function FinancialConnectClient({ dealRef }: { dealRef?: string | null }) {
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [grant, setGrant] = useState<LinkGrant | null>(null);
  const [status, setStatus] = useState("Ready to connect when you are.");
  const [busy, setBusy] = useState(false);

  const onSuccess = useCallback(async (publicToken: string | null) => {
    if (!grant || !publicToken) return;
    setBusy(true);
    setStatus("Securing your financial-account connection…");
    const response = await fetch("/api/plaid/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken, authorizationRef: grant.authorizationRef }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      setStatus(data?.error || "The account connection could not be secured.");
      setBusy(false);
      return;
    }
    setStatus("Connected. Your Plaid access token is stored only in Furlong's encrypted vault.");
    setBusy(false);
  }, [grant]);

  const { open, ready } = usePlaidLink({
    token: grant?.linkToken ?? null,
    onSuccess,
    onExit: (error) => {
      if (error) setStatus("Plaid Link closed before the connection completed.");
    },
  });

  async function authorizeAndOpen() {
    if (!consentAgreed) return;
    setBusy(true);
    setStatus("Recording consent and confirming fresh passkey MFA…");
    const response = await fetch("/api/plaid/link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentAgreed: true, dealRef: dealRef || undefined }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.linkToken || !data?.authorizationRef) {
      setStatus(data?.error || "Plaid Link authorization failed.");
      setBusy(false);
      return;
    }
    setGrant({ linkToken: data.linkToken, authorizationRef: data.authorizationRef });
    setStatus("Authorization recorded. Opening Plaid Link…");
    setBusy(false);
  }

  const consent = CONSENTS["plaid-financial-account-access"];
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" }}>
      <h1>Connect financial accounts</h1>
      <p>Furlong requires a fresh passkey verification and a separate financial-account authorization before Plaid Link can open.</p>
      <div style={{ border: "1px solid #d7dce5", borderRadius: 12, padding: 20, marginTop: 24 }}>
        <label style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <input type="checkbox" checked={consentAgreed} onChange={(e) => setConsentAgreed(e.target.checked)} />
          <span><strong>Plaid financial-account authorization</strong><br />{consent.text}</span>
        </label>
      </div>
      {!grant ? (
        <button onClick={authorizeAndOpen} disabled={!consentAgreed || busy} style={{ marginTop: 20, padding: "12px 18px" }}>
          {busy ? "Authorizing…" : "Authorize and continue to Plaid"}
        </button>
      ) : (
        <button onClick={() => open()} disabled={!ready || busy} style={{ marginTop: 20, padding: "12px 18px" }}>
          {ready ? "Open Plaid Link" : "Preparing Plaid…"}
        </button>
      )}
      <p aria-live="polite" style={{ marginTop: 18 }}>{status}</p>
      <p style={{ marginTop: 28, fontSize: 14 }}>
        Furlong does not receive your online-banking password. Long-lived Plaid access tokens are encrypted before persistence and are subject to disconnect, retention, and deletion controls.
      </p>
    </div>
  );
}
