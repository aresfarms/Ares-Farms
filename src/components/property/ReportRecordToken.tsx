"use client";

/**
 * ReportRecordToken — the Report tab's "keep a permanent record" action
 * (founder direction 2026-07-29: ANONYMIZED — no identity, no onboarding.
 * The visitor gets a token number; entering it next time repopulates their
 * records, including this report).
 *
 * Rides the existing anonymous-token substrate (value-loop 4b): the record is
 * a public property snapshot + the report's resume URL — never the visitor's
 * answers, never a name or email. Lose the token → it's gone, because we
 * never asked who you are.
 */

import { useState } from "react";

import { getSaved, replaceSaved, type SavedProperty } from "@/lib/property/savedProperty";

const API = "/api/public/anon-token";

export function ReportRecordToken({ record }: { record: SavedProperty }) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function keepRecord() {
    setBusy(true);
    setError(null);
    try {
      // Fold this report's record into the visitor's saved set (dedupe by id),
      // then mint the token over the whole set — one token covers everything
      // they've saved this session.
      const merged = [...getSaved().filter((p) => p.id !== record.id), record];
      replaceSaved(merged);
      const res = await fetch(`${API}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: merged }),
      });
      const data = (await res.json().catch(() => null)) as { token?: string } | null;
      if (!res.ok || !data?.token) {
        setError("The record service is unavailable right now — your report is still saved on this device.");
        return;
      }
      setToken(data.token);
    } finally {
      setBusy(false);
    }
  }

  if (token) {
    return (
      <div data-testid="report-record-token" style={{ display: "grid", gap: 6, border: "1px solid #b7dccb", borderRadius: 12, background: "#f2faf6", padding: "10px 14px", maxWidth: 560 }}>
        <span style={{ fontSize: 13, color: "#162033" }}>
          Your record token:{" "}
          <code style={{ fontSize: 14, fontWeight: 800, background: "#eef6ff", padding: "2px 8px", borderRadius: 6 }}>{token}</code>
        </span>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#9a3412" }}>
          Write this down — we cannot recover it, because we never asked who you are.
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#5d687a", lineHeight: 1.5 }}>
          Next time, enter this token in the &ldquo;Have a token?&rdquo; box in the Saved tray and your
          records — including this report — will populate again. Export or delete it there any time.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        data-testid="keep-record"
        onClick={keepRecord}
        disabled={busy}
        style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 999, padding: "9px 16px", border: "1px solid #0f766e", background: "#ffffff", color: "#0f766e" }}
      >
        {busy ? "Creating your token..." : "Keep a permanent record → get my token"}
      </button>
      <span style={{ fontSize: 11.5, color: "#5d687a" }}>
        Anonymous — no account, no name, no email. Just a token you keep.
      </span>
      {error && <span style={{ fontSize: 12, color: "#a12626" }}>{error}</span>}
    </div>
  );
}
