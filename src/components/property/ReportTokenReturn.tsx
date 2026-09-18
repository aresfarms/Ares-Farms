"use client";

import { useState } from "react";

import { replaceSaved, type SavedProperty } from "@/lib/property/savedProperty";

/**
 * ReportTokenReturn — "put in their token number next time and their report
 * will populate" (founder spec 2026-07-29; gap found same day: the token
 * entry lived only in the browse page's saved tray, so a visitor holding a
 * furlong-xxxx-xxxx-xxxx token had nowhere obvious to use it).
 *
 * Sits beside the Study Desk on the property front door. Enter the token →
 * the permanent record is restored to this device and the report reopens
 * directly (single report) or lists every saved analysis (multiple).
 * Anonymous contract: no account, no PII; a lost token is unrecoverable
 * because we never asked who you are.
 */

const API = "/api/public/anon-token";

export function ReportTokenReturn() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState<SavedProperty[] | null>(null);

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    const token = input.trim();
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setError("No record found for that token. Check the exact spelling (furlong-xxxx-xxxx-xxxx) — if the token is lost, the record is unrecoverable, because we never asked who you are.");
        return;
      }
      const data = (await res.json()) as { saved?: SavedProperty[] };
      const saved = data.saved ?? [];
      replaceSaved(saved);
      const withReports = saved.filter((p) => p.resumeHref);
      if (withReports.length === 1 && withReports[0].resumeHref) {
        // One report on file — reopen it directly, as promised at mint time.
        window.location.href = withReports[0].resumeHref;
        return;
      }
      setRestored(saved);
    } catch {
      setError("The token service could not be reached — try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Reopen a permanent record with your Furlong token"
      style={{ border: "1.5px solid #B08A2E", borderRadius: 14, background: "#FFFDF5", padding: "14px 16px", display: "grid", gap: 8 }}
    >
      <strong style={{ color: "#1C2B45", fontSize: 13.5 }}>Have a Furlong token?</strong>
      <p style={{ margin: 0, color: "#5A6172", fontSize: 12.5, lineHeight: 1.55 }}>
        If you chose &ldquo;Keep a permanent record&rdquo; on a past report, enter your token and that
        report reopens — no account, no name, the token is the whole key.
      </p>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="furlong-xxxx-xxxx-xxxx"
          aria-label="Furlong permanent-record token"
          autoComplete="off"
          spellCheck={false}
          style={{ flex: "1 1 240px", border: "1px solid #B08A2E", borderRadius: 9, padding: "10px 12px", fontFamily: "ui-monospace, monospace", fontSize: 13 }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          style={{ border: 0, borderRadius: 9, padding: "10px 16px", background: "#1C2B45", color: "#fff", fontWeight: 800, cursor: busy ? "wait" : "pointer", opacity: busy || !input.trim() ? 0.6 : 1 }}
        >
          {busy ? "Checking…" : "Reopen my report"}
        </button>
      </form>
      {error && <p role="alert" style={{ margin: 0, color: "#a12626", fontSize: 12.5, lineHeight: 1.5 }}>{error}</p>}
      {restored && (
        <div style={{ display: "grid", gap: 5 }}>
          <strong style={{ color: "#1C2B45", fontSize: 12.5 }}>
            Restored {restored.length} saved propert{restored.length === 1 ? "y" : "ies"} to this device:
          </strong>
          {restored.map((p) => (
            <span key={p.id} style={{ fontSize: 12.5, color: "#3d4655" }}>
              {p.exactAddress ?? [p.town, p.state].filter(Boolean).join(", ") ?? p.id}
              {p.resumeHref && (
                <>
                  {" "}
                  <a href={p.resumeHref} style={{ color: "#0f766e", fontWeight: 700 }}>Reopen this report →</a>
                </>
              )}
            </span>
          ))}
          {restored.length === 0 && (
            <span style={{ fontSize: 12.5, color: "#5A6172" }}>The token is valid but holds no saved properties yet.</span>
          )}
        </div>
      )}
    </section>
  );
}
