"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const field = { display: "grid", gap: 6 } as const;
const input = { padding: "10px 12px", border: "1px solid #cfd8e6", borderRadius: 9, fontSize: 14 } as const;

export default function ProfessionalVerificationPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/public/professional-verification-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, consented: form.get("consented") === "on" }),
    });
    const result = await response.json();
    setMessage(response.ok ? `${result.message} Reference: ${result.requestId}` : result.error ?? "Request failed.");
    setBusy(false);
  }

  return <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: "42px 20px" }}>
    <div style={{ maxWidth: 680, margin: "0 auto", display: "grid", gap: 18 }}>
      <Link href="/professional-access" style={{ color: "#1C2B45", fontWeight: 700 }}>← Professional Access</Link>
      <header style={{ display: "grid", gap: 8 }}>
        <span style={{ color: "#b8862f", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 12 }}>Credential verification</span>
        <h1 style={{ margin: 0, color: "#1C2B45", fontFamily: "Georgia,serif" }}>Verify before professional login</h1>
        <p style={{ margin: 0, color: "#4d596d", lineHeight: 1.65 }}>Furlong verifies credentials automatically against an authoritative source or certified verification connector. A clean match can unlock professional login automatically. Only inconclusive, conflicting, or unavailable-source results enter an exception queue; applicant claims never grant access.</p>
      </header>
      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #d7deea", borderRadius: 14, padding: 20, display: "grid", gap: 14 }}>
        <label style={field}><span>Full legal name</span><input name="fullLegalName" required style={input} /></label>
        <label style={field}><span>Email invited to Furlong</span><input name="email" type="email" required style={input} /></label>
        <label style={field}><span>Professional lane</span><select name="role" required style={input} defaultValue="lender">
          <option value="lender">Lender / Debt Broker</option><option value="attorney">Attorney / Counsel</option><option value="auditor">Auditor / Examiner</option><option value="sponsor">Sponsor / Institutional Partner</option>
        </select></label>
        <label style={field}><span>Credential type</span><input name="credentialType" required style={input} placeholder="e.g. broker license, bar admission, examiner commission" /></label>
        <label style={field}><span>Credential / license identifier</span><input name="credentialIdentifier" required style={input} /></label>
        <label style={field}><span>Jurisdiction or issuer</span><input name="jurisdictionOrIssuer" required style={input} placeholder="State, agency, bar, regulator, or institution" /></label>
        <label style={field}><span>Organization</span><input name="organization" style={input} /></label>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.5 }}>
          <input name="consented" type="checkbox" required style={{ marginTop: 4 }} />
          <span>I authorize Furlong to verify this credential with the official issuing authority or directory and to retain the verification evidence and audit record.</span>
        </label>
        <button disabled={busy} style={{ border: 0, borderRadius: 10, padding: "11px 18px", background: "#1C2B45", color: "white", fontWeight: 800, cursor: "pointer" }}>{busy ? "Verifying…" : "Verify credential"}</button>
        {message ? <div role="status" style={{ borderRadius: 9, padding: 11, background: "#f2f5f9", color: "#24344f", lineHeight: 1.5 }}>{message}</div> : null}
      </form>
      <p style={{ color: "#64748b", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>Credential data is used only for professional-access verification and audit. It does not create a customer account or grant access by itself.</p>
    </div>
  </main>;
}
