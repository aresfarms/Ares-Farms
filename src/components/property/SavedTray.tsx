"use client";

import { useEffect, useState } from "react";

import { getSaved, removeSaved, SAVED_EVENT, type SavedProperty } from "@/lib/property/savedProperty";
import { AnonymousTokenControls } from "@/components/property/AnonymousTokenControls";

/**
 * Saved-properties tray + property-only PRINT sheet. NO account, NO PII.
 *
 * - Reads the in-session saved set (sessionStorage). Hidden entirely when empty.
 * - "Print" opens the browser print dialog; a print stylesheet hides the whole
 *   app and shows ONLY the `.fl-print-region` — the PROPERTY details and an
 *   advisory footer. No personal information is collected, shown, or printed;
 *   no account is required. Honors explore-first.
 */
export function SavedTray() {
  const [list, setList] = useState<SavedProperty[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setList(getSaved());
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    return () => window.removeEventListener(SAVED_EVENT, sync);
  }, []);

  if (list.length === 0) return null; // nothing saved → no tray, no clutter

  const loc = (p: SavedProperty) =>
    p.county && p.county !== "Unknown"
      ? `${p.town}, ${p.county} County, ${p.state}`
      : `${p.town}, ${p.state}`;

  return (
    <>
      <style>{`
        /* Property-only print: hide the whole app, show only the print sheet. */
        .fl-print-region { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .fl-print-region, .fl-print-region * { visibility: visible !important; }
          .fl-print-region {
            display: block !important;
            position: absolute !important; left: 0; top: 0; width: 100%;
            color: #000; font-family: Georgia, serif;
          }
          .fl-print-item { break-inside: avoid; border-bottom: 1px solid #999; padding: 10px 0; }
        }
      `}</style>

      {/* ── On-screen saved tray ─────────────────────────────────────────────── */}
      <section
        aria-label="Saved properties"
        data-testid="saved-tray"
        style={{
          border: "1px solid #b9e3d4", background: "#f2fbf7", borderRadius: 12,
          padding: "12px 16px", display: "grid", gap: 10,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", alignItems: "center", justifyContent: "space-between" }}>
          <strong data-testid="saved-count" style={{ fontSize: 15, color: "#0f6e56" }}>
            ★ Saved ({list.length}) — no account needed
          </strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setOpen((o) => !o)} style={btn(false)}>
              {open ? "Hide" : "View"}
            </button>
            <button type="button" data-testid="print-button" onClick={() => window.print()} style={btn(true)}>
              ⎙ Print
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#5d687a" }}>
          Saved only in this browser tab — no account, no personal information, cleared when you close the tab.
        </p>
        {open && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {list.map((p) => (
              <li key={p.id} style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid #d7eee5", paddingTop: 8 }}>
                <span style={{ fontSize: 14, color: "#162033" }}>
                  <strong>{loc(p)}</strong> · {p.propertyType} · {p.priceLabel}
                </span>
                <button type="button" onClick={() => removeSaved(p.id)} style={{ ...btn(false), fontSize: 12, padding: "3px 10px" }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* "Take it with you" — the anonymous token (explicit upgrade from the
            ephemeral in-session save). No account, no PII. */}
        <AnonymousTokenControls />
      </section>

      {/* ── Print-only sheet — PROPERTY details + advisory footer, no PII ─────── */}
      <div className="fl-print-region" aria-hidden="true" data-testid="print-region">
        <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Furlong — Saved properties</h1>
        <p style={{ fontSize: 12, margin: "0 0 12px" }}>
          Advisory only — no account, no personal information. Furlong does not lend, approve, or
          determine eligibility. Confirm any program or financing details with the agency or lender.
        </p>
        {list.map((p) => (
          <div className="fl-print-item" key={p.id}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{loc(p)}</div>
            <div style={{ fontSize: 13 }}>
              {[p.propertyType, p.priceLabel, p.isCurrent ? "current listing" : p.vintageStamp]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {p.exactAddress && (
              <div style={{ fontSize: 13 }}>{p.exactAddress}{p.zip ? `, ${p.state} ${p.zip}` : ""}</div>
            )}
            {p.pathways.length > 0 && (
              <div style={{ fontSize: 13 }}>May fit a {p.pathways.join(" / ")} pathway — providers can help you explore it.</div>
            )}
            <div style={{ fontSize: 11 }}>{p.sourceCitation} · {p.vintageStamp} · {p.listingUrl}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function btn(primary: boolean) {
  return {
    fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 999, padding: "5px 14px",
    border: `1px solid ${primary ? "#0f766e" : "#cdd9ec"}`,
    background: primary ? "#0f766e" : "#ffffff",
    color: primary ? "#ffffff" : "#334155",
  } as const;
}
