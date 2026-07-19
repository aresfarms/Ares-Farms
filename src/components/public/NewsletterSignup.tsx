"use client";

import { useState } from "react";

/**
 * NewsletterSignup — the retention loop closer. A single-field "get the
 * Dispatch" capture: email + consent → POST /api/newsletter/subscribe (the ESP
 * holds the list; no account, minimum PII). Customer surface (brief-copy
 * scanned).
 */

const ACCENT = "#0f766e"; // teal — matches the homepage primary

export function NewsletterSignup({ accent = ACCENT }: { accent?: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!email.trim() || !consent) return;
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not subscribe.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <section aria-label="Subscribed" style={{ border: `1.5px solid ${accent}`, background: "#f1fbfa", borderRadius: 14, padding: "18px 20px", display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 15, color: "#0b4f49" }}>You&apos;re on the list.</strong>
        <span style={{ fontSize: 13, color: "#2f5f5a", lineHeight: 1.5 }}>
          The Dispatch — this week&apos;s rates, commodity moves, and what&apos;s worth knowing — lands in your inbox. No spam, unsubscribe anytime.
        </span>
      </section>
    );
  }

  return (
    <section aria-label="Get the Dispatch" style={{ border: "1px solid #d7deea", background: "#ffffff", borderRadius: 14, padding: "18px 20px", display: "grid", gap: 10, maxWidth: 560 }}>
      <div style={{ display: "grid", gap: 3 }}>
        <strong style={{ fontSize: 16, color: "#101a2b" }}>Get this week&apos;s Dispatch</strong>
        <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.5 }}>
          Rates, commodity moves, and the property signals worth knowing — free, weekly, no account.
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          style={{ flex: "1 1 220px", minWidth: 0, border: "1px solid #cfd8e6", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#101a2b", background: "#fbfcfe" }}
        />
        <button
          type="button"
          onClick={subscribe}
          disabled={!email.trim() || !consent || state === "loading"}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 800,
            color: "#fff",
            background: email.trim() && consent ? accent : "#9fb8b5",
            cursor: email.trim() && consent && state !== "loading" ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {state === "loading" ? "Subscribing…" : "Send it to me"}
        </button>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#5d687a", lineHeight: 1.5 }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
        <span>Yes, email me the Dispatch. I can unsubscribe anytime, and my email is never sold.</span>
      </label>
      {state === "error" && <span style={{ fontSize: 12.5, color: "#b42318" }}>{error}</span>}
    </section>
  );
}
