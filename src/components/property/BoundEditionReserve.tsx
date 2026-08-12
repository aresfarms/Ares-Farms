"use client";

import { useEffect, useState } from "react";

/**
 * BoundEditionReserve — the alpha Bound Register WAITLIST (founder direction
 * 2026-07-20). Physical bound editions of the Land Register are a future Guild
 * benefit; this is the real waitlist so reservers are first in line.
 *
 * PII: this is the ONE place the free surface asks who you are, and it is a
 * CONSCIOUS, EXPLICIT OPT-IN. It collects NAME + EMAIL only — never a mailing
 * address (that comes later, at ship, inside the Guild). The consent + "why" is
 * stated on the surface. No payment, no account, no Guild token. The device
 * remembers only that this tract was reserved (so the card reflects it and
 * doesn't re-nag); the name/email go to the operator queue, not localStorage.
 */

const STORE_KEY = "furlong.bound-edition-reserved.v1";
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ReservedMap = Record<string, { binding: string; at: string }>;

function readReserved(): ReservedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as ReservedMap) : {};
  } catch {
    return {};
  }
}

export function BoundEditionReserve({
  propertyId,
  title,
  location,
  propertyType,
  lane,
}: {
  propertyId: string;
  title: string;
  location: string;
  propertyType: string;
  lane?: string;
}) {
  const [binding, setBinding] = useState<"standalone" | "portfolio">("standalone");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reserved, setReserved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReserved(Boolean(readReserved()[propertyId]));
  }, [propertyId]);

  const reserve = () => {
    if (busy || reserved) return;
    if (!name.trim()) {
      setError("Your name holds your place in line.");
      return;
    }
    if (!EMAIL_SHAPE.test(email.trim())) {
      setError("A valid email lets us tell you first.");
      return;
    }
    setError(null);
    setBusy(true);
    void fetch("/api/public/bound-edition-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        title,
        location,
        propertyType,
        binding,
        lane,
        name: name.trim(),
        email: email.trim(),
      }),
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || "The reservation could not be recorded — please try again.");
        }
        // Device remembers ONLY the reserved flag (never the contact details).
        try {
          const all = readReserved();
          all[propertyId] = { binding, at: new Date().toISOString() };
          window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
        } catch {
          /* best effort */
        }
        setReserved(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "The reservation could not be recorded — please try again.");
      })
      .finally(() => setBusy(false));
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: 14,
    color: "#efe9d8",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid #3a4230",
    borderRadius: 8,
    padding: "9px 11px",
    width: "100%",
  };

  return (
    <section
      aria-label="Reserve a bound edition of this ledger"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gap: 12,
        border: "1px solid #b8862f",
        borderRadius: 14,
        background: "linear-gradient(180deg,#12130f,#1c2417)",
        color: "#efe9d8",
        padding: "18px 20px",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span aria-hidden style={{ fontSize: 15, color: "#d4b06a" }}>⚓</span>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4b06a" }}>
          The Bound Register · a Guild benefit
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#efe9d8" }}>
        A hardbound, foil-stamped edition of this ledger — your tract&apos;s verified record pre-printed,
        with ruled field-note margins to write in by hand. Shipped to Guild members; join the waitlist to
        be first when editions open.
      </p>

      {reserved ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "system-ui, sans-serif",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#8fd0a8",
          }}
        >
          <span aria-hidden>✓</span>
          You&apos;re on the list. We&apos;ll email you the moment bound editions open — you&apos;ll be first.
        </div>
      ) : (
        <>
          <fieldset style={{ border: "none", margin: 0, padding: 0, display: "grid", gap: 8, fontFamily: "system-ui, sans-serif" }}>
            <legend style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c9bfa4", padding: 0, marginBottom: 2 }}>
              Bind this tract as
            </legend>
            {([
              { id: "standalone", label: "A standalone volume", hint: "its own bound book" },
              { id: "portfolio", label: "Append to my Master Portfolio Register", hint: "one book, all your ground" },
            ] as const).map((opt) => {
              const active = binding === opt.id;
              return (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 9,
                    cursor: "pointer",
                    border: active ? "1px solid #d4b06a" : "1px solid #3a4230",
                    borderRadius: 9,
                    padding: "9px 11px",
                    background: active ? "rgba(212,176,106,0.10)" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="bound-binding"
                    checked={active}
                    onChange={() => setBinding(opt.id)}
                    style={{ accentColor: "#d4b06a", marginTop: 1 }}
                  />
                  <span style={{ display: "grid", gap: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#efe9d8" }}>{opt.label}</span>
                    <span style={{ fontSize: 12, color: "#9ca884" }}>{opt.hint}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div style={{ display: "grid", gap: 8, fontFamily: "system-ui, sans-serif" }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c9bfa4" }}>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who should we hold the edition for?"
                autoComplete="name"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c9bfa4" }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle}
              />
            </label>
          </div>

          {error && (
            <span role="alert" style={{ fontSize: 12.5, color: "#e7a17a", fontFamily: "system-ui, sans-serif" }}>
              {error}
            </span>
          )}

          <button
            type="button"
            onClick={reserve}
            disabled={busy}
            style={{
              justifySelf: "start",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13.5,
              fontWeight: 800,
              color: "#12130f",
              background: "#d4b06a",
              border: "none",
              borderRadius: 999,
              padding: "9px 18px",
              cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "Reserving…" : "Reserve my place in line"}
          </button>

          <span style={{ fontSize: 11.5, color: "#9ca884", lineHeight: 1.5, fontFamily: "system-ui, sans-serif" }}>
            This is the one place we ask who you are — and only because you asked to be first. We hold your
            name and email solely to tell you when editions open, never sell them, and delete them on request.
            No payment, no account, and no mailing address until you actually order one, inside the Guild.
          </span>
        </>
      )}
    </section>
  );
}
