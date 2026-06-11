"use client";

import { useState } from "react";

import { getSaved, replaceSaved, type SavedProperty } from "@/lib/property/savedProperty";

/**
 * "Take it with you" — the anonymous token (value-loop 4b). NO account, NO
 * real-identity PII. Minting returns a generated token the visitor keeps; the
 * data lives in the borrower-experience unit's own store (not Furlong core).
 * Lose the token → it's gone, because we never asked who you are.
 *
 * All calls go to the PUBLIC /api/public/anon-token/* contract (no sign-in).
 */

const API = "/api/public/anon-token";

type Right = { id: string; label: string; note: string };

export function AnonymousTokenControls() {
  const [token, setToken] = useState<string | null>(null);
  const [rights, setRights] = useState<Right[]>([]);
  const [returnInput, setReturnInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function mint() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: getSaved() }), // public property snapshots only — no PII
      });
      const data = await res.json();
      setToken(data.token);
      setRights(data.rights ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function returnByToken() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: returnInput.trim() }),
      });
      if (!res.ok) {
        setStatus("No data found for that token. If you lost it, it's gone — we never asked who you are.");
        return;
      }
      const data = await res.json();
      replaceSaved((data.saved ?? []) as SavedProperty[]);
      setToken(returnInput.trim());
      setStatus(`Welcome back — ${(data.saved ?? []).length} saved propert${(data.saved ?? []).length === 1 ? "y" : "ies"} restored.`);
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    if (!token) return;
    const res = await fetch(`${API}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "furlong-my-token-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Exported your token's data.");
  }

  async function deleteData() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.purged) {
        setToken(null);
        setRights([]);
        setStatus("Deleted — your token's data is permanently purged. There is no copy anywhere else.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Take it with you — anonymous token"
      data-testid="anon-token"
      style={{ borderTop: "1px solid #d7eee5", paddingTop: 10, display: "grid", gap: 8 }}
    >
      {!token ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button type="button" data-testid="mint-token" onClick={mint} disabled={busy} style={primaryBtn}>
              Take it with you →
            </button>
            <span style={{ fontSize: 12, color: "#5d687a" }}>
              No account. No name or email. Just a token you keep.
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <input
              value={returnInput}
              onChange={(e) => setReturnInput(e.target.value)}
              placeholder="Have a token? furlong-…"
              aria-label="Return with your token"
              data-testid="return-input"
              style={{ fontSize: 13, padding: "6px 10px", borderRadius: 8, border: "1px solid #cdd9ec", minWidth: 220 }}
            />
            <button type="button" data-testid="return-token" onClick={returnByToken} disabled={busy || !returnInput.trim()} style={ghostBtn}>
              Return
            </button>
          </div>
        </>
      ) : (
        <div data-testid="token-issued" style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#162033" }}>
            Your token:{" "}
            <code data-testid="token-value" style={{ fontSize: 14, fontWeight: 800, background: "#eef6ff", padding: "2px 8px", borderRadius: 6 }}>
              {token}
            </code>
          </div>
          <p data-testid="token-warning" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#9a3412" }}>
            Save this — we can&apos;t recover it, because we never asked who you are.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#5d687a" }}>
            Your saved properties are kept under this token only. Your rights:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#5d687a", display: "grid", gap: 2 }}>
            {rights.map((r) => (
              <li key={r.id}>
                <strong>{r.label}</strong> — {r.note}
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" data-testid="export-token" onClick={exportData} style={ghostBtn}>
              Export my data
            </button>
            <button type="button" data-testid="delete-token" onClick={deleteData} disabled={busy} style={{ ...ghostBtn, borderColor: "#e3a08c", color: "#9a3412" }}>
              Delete my data
            </button>
          </div>
        </div>
      )}
      {status && (
        <p data-testid="token-status" style={{ margin: 0, fontSize: 12, color: "#0f6e56" }}>
          {status}
        </p>
      )}
    </section>
  );
}

const primaryBtn = {
  fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 999, padding: "6px 16px",
  border: "1px solid #0f766e", background: "#0f766e", color: "#ffffff",
} as const;
const ghostBtn = {
  fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 999, padding: "5px 14px",
  border: "1px solid #cdd9ec", background: "#ffffff", color: "#334155",
} as const;
