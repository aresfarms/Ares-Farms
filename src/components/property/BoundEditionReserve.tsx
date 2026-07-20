"use client";

import { useEffect, useState } from "react";

/**
 * BoundEditionReserve — the alpha "mock the desire" reservation prompt (founder
 * direction 2026-07-20). Physical bound editions of the Land Register are a
 * future Guild benefit; here we only MEASURE who wants one. Reserving is a
 * waitlist signal — no payment, no shipping, no Guild token, and NO personal
 * PII (a mailing address only ever lives inside the identified, opt-in Guild).
 *
 * The click records an anonymous, property-context-only interest signal to the
 * operator queue (server), and remembers the reserved state ON THIS DEVICE so
 * the prompt reflects it and never re-nags. Server persistence is best-effort:
 * the device-local state is authoritative for the UI (works even where the DB
 * isn't reachable, e.g. local preview).
 */

const STORE_KEY = "furlong.bound-edition-reserved.v1";

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
  const [reserved, setReserved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReserved(Boolean(readReserved()[propertyId]));
  }, [propertyId]);

  const reserve = () => {
    if (busy || reserved) return;
    setBusy(true);
    // Device-local state is authoritative for the UI.
    try {
      const all = readReserved();
      all[propertyId] = { binding, at: new Date().toISOString() };
      window.localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch {
      /* best effort */
    }
    setReserved(true);
    // Best-effort anonymous demand signal — property context ONLY, no PII.
    void fetch("/api/public/bound-edition-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, title, location, propertyType, binding, lane }),
    })
      .catch(() => {
        /* the reservation still stands on this device */
      })
      .finally(() => setBusy(false));
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
        with ruled field-note margins to write in by hand. Shipped to Guild members; reserving here just
        holds your place while we open it.
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
          Your place is reserved on this device. Bound editions arrive with the Guild — we&apos;ll bring it up when it opens.
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
            No payment, no address, no account. Reserving only tells us you&apos;d want one — a shipping
            address is asked for later, and only inside the Guild.
          </span>
        </>
      )}
    </section>
  );
}
