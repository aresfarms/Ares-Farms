"use client";

import { FormEvent, useEffect, useState } from "react";

interface RequestRow {
  requestId: string; status: string; fullLegalName: string | null; email: string | null;
  role: string | null; requestPayload: Record<string, unknown> | null; createdAt: string | null;
}

const input = { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13 } as const;

export default function ProfessionalCredentialsReviewPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/governance/professional-credentials");
    const json = await res.json();
    setRows(res.ok && json.ok ? json.requests : []);
    if (!res.ok) setMessage(json.error ?? "Unable to load credential requests.");
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function review(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault(); setMessage(null);
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries(data.entries());
    const res = await fetch("/api/governance/professional-credentials", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, requestId, independenceAttested: data.get("independenceAttested") === "on" }),
    });
    const json = await res.json();
    setMessage(res.ok ? `${requestId}: ${json.status}` : json.error ?? "Review failed.");
    if (res.ok) await load();
  }
  return <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 32 }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
      <header><h1 style={{ margin: 0, color: "#1C2B45" }}>Professional Credential Exceptions</h1>
        <p style={{ color: "#556274" }}>Normal credential verification is automated. This queue contains only inconclusive, conflicting, or unavailable-source cases. Applicant claims never grant access.</p></header>
      {message ? <div role="status" style={{ padding: 10, background: "#fff8df", border: "1px solid #e2c96f", borderRadius: 8 }}>{message}</div> : null}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No credential exceptions. Automated verification is clear.</p> : rows.map((row) => {
        const payload = row.requestPayload ?? {};
        return <section key={row.requestId} style={{ background: "white", border: "1px solid #d7deea", borderRadius: 12, padding: 16, display: "grid", gap: 10 }}>
          <div><strong>{row.fullLegalName ?? "Unknown"}</strong> · {row.email} · {row.role} · <strong>{row.status}</strong></div>
          <div style={{ fontSize: 13, color: "#475569" }}>
            Credential: {String(payload.credentialType ?? "—")} · ID: {String(payload.credentialIdentifier ?? "—")} · Issuer: {String(payload.jurisdictionOrIssuer ?? "—")} · Organization: {String(payload.organization ?? "—")}
          </div>
          {row.status === "AUTOMATION_EXCEPTION" ? <form onSubmit={(e) => void review(e, row.requestId)} style={{ display: "grid", gap: 8 }}>
            <input name="officialSourceRef" required style={input} placeholder="Official directory / issuer source reference" />
            <textarea name="officialSourcePayload" required style={{ ...input, minHeight: 90 }} placeholder="Source snapshot / verification facts retained for hashing" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input name="standing" required style={input} placeholder="Standing (e.g. active, good standing)" />
              <input name="expiresAt" required type="datetime-local" style={input} />
              <select name="method" style={input} defaultValue="OFFICIAL_DIRECTORY_MANUAL">
                <option value="OFFICIAL_DIRECTORY_MANUAL">Official directory — manual</option>
                <option value="OFFICIAL_DIRECTORY_AUTOMATED">Official directory — automated</option>
                <option value="ISSUER_CONFIRMATION">Issuer confirmation</option>
                <option value="AGENCY_CONFIRMATION">Agency confirmation</option>
              </select>
            </div>
            {row.role === "auditor" ? <label style={{ fontSize: 13 }}><input name="independenceAttested" type="checkbox" /> Independence attested for this engagement</label> : null}
            <textarea name="reason" required style={{ ...input, minHeight: 70 }} placeholder="Review reason / notes" />
            <div style={{ display: "flex", gap: 8 }}>
              <button name="decision" value="VERIFIED" style={{ border: 0, borderRadius: 8, padding: "9px 14px", background: "#166534", color: "white", fontWeight: 800 }}>Resolve as verified</button>
              <button name="decision" value="REJECTED" style={{ border: 0, borderRadius: 8, padding: "9px 14px", background: "#991b1b", color: "white", fontWeight: 800 }}>Reject</button>
            </div>
          </form> : null}
        </section>;
      })}
    </div>
  </main>;
}
