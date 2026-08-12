"use client";

import { useEffect, useState } from "react";

type Recipient = "CAITLIN" | "STUART";
type Status = { exists: boolean; recipient: Recipient; accountId?: string; testMode?: boolean;
  detailsSubmitted?: boolean; payoutsEnabled?: boolean; chargesEnabled?: boolean;
  currentlyDue?: string[]; eventuallyDue?: string[]; disabledReason?: string | null;
  bankAccounts?: Array<{ id: string; bankName: string | null; last4: string | null; currency: string; status: string; defaultForCurrency: boolean | null }> };

export default function StripeConnectGovernancePage() {
  const [statuses, setStatuses] = useState<Partial<Record<Recipient, Status>>>({});
  const [busy, setBusy] = useState<Recipient | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh(recipient: Recipient) {
    const res = await fetch(`/api/stripe/connect/status?recipient=${recipient}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setStatuses((current) => ({ ...current, [recipient]: data.status }));
  }

  useEffect(() => { void refresh("CAITLIN"); void refresh("STUART"); }, []);
  async function onboard(recipient: Recipient) {
    setBusy(recipient); setError(null);
    const res = await fetch("/api/stripe/connect/onboarding", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { setError(data.error ?? "Unable to start Stripe onboarding."); return; }
    window.location.assign(data.url);
  }

  return <main style={{ padding: 28, display: "grid", gap: 20, maxWidth: 920 }}>
    <header style={{ display: "grid", gap: 8 }}>
      <h1 style={{ margin: 0 }}>Stripe Connect verification</h1>
      <p style={{ margin: 0, lineHeight: 1.6 }}>
        Stripe-hosted onboarding owns KYC/identity requirements and payout-bank collection. Furlong stores only Stripe identifiers and verification status — never bank routing or account numbers.
      </p>
    </header>
    {error ? <div role="alert" style={{ padding: 12, border: "1px solid #b91c1c", borderRadius: 8 }}>{error}</div> : null}
    {(["CAITLIN", "STUART"] as Recipient[]).map((recipient) => {
      const status = statuses[recipient];
      return <section key={recipient} style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 18, display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0 }}>{recipient === "CAITLIN" ? "Caitlin Hudson" : "Stuart Fraass"}</h2>
        <div>Connected account: <strong>{status?.accountId ?? "Not created"}</strong></div>
        <div>Identity/KYC submitted: <strong>{status?.detailsSubmitted ? "Yes" : "No"}</strong></div>
        <div>Payouts enabled: <strong>{status?.payoutsEnabled ? "Yes" : "No"}</strong></div>
        <div>Outstanding requirements: <strong>{status?.currentlyDue?.length ?? 0}</strong></div>
        <div>Bank accounts: <strong>{status?.bankAccounts?.length ?? 0}</strong></div>
        {status?.bankAccounts?.map((bank) => <div key={bank.id} style={{ paddingLeft: 12 }}>
          {bank.bankName ?? "Bank"} •••• {bank.last4 ?? "----"} — <strong>{bank.status}</strong>
        </div>)}
        {status?.disabledReason ? <div>Disabled reason: <strong>{status.disabledReason}</strong></div> : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button disabled={busy === recipient} onClick={() => void onboard(recipient)}>
            {busy === recipient ? "Opening Stripe…" : status?.exists ? "Continue Stripe verification" : "Start Stripe verification"}
          </button>
          <button onClick={() => void refresh(recipient)}>Refresh status</button>
        </div>
        {recipient === "STUART" ? <small>Generating Stuart's link is allowed for platform administration, but Stuart should complete his own Stripe-hosted identity and bank verification.</small> : null}
      </section>;
    })}
    <p style={{ margin: 0, fontSize: 13 }}>
      Transfer execution remains independently promotion-blocked until the connected account is certified by Furlong governance.
    </p>
  </main>;
}
