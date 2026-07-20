"use client";

import { useEffect, useState } from "react";

import {
  deletePropertyEvaluationDraft,
  listPropertyEvaluationDrafts,
  type PropertyEvaluationDraft,
} from "@/lib/property/propertyEvaluationDraft";

/**
 * The Study Desk (formerly SavedDraftsRail) — "come back a week or six months
 * later" (founder direction 2026-07-17), dressed as a physical workspace
 * (founder direction 2026-07-20). Each analysis saved ON THIS DEVICE
 * (localStorage — nothing ever leaves the device, no account, no server copy)
 * is a manila "Property Dossier File" in an architect's catalog drawer, with
 * old-school ledger metadata and a "Strike from Ledger" command that draws a
 * line through the entry before the file vanishes. Renders nothing when there
 * are no drafts.
 *
 * Honesty note: the device draft stores the logged location + timestamp, not a
 * FEMA flood zone — so TRACK shows the real location and never a fabricated
 * "(Zone X)". A zone only appears once the analysis itself carries one.
 */

function ledgerDate(iso: string): string {
  // YYYY-MM-DD in the ledger's plain hand — no locale surprises.
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}

export function SavedDraftsRail() {
  const [drafts, setDrafts] = useState<PropertyEvaluationDraft[]>([]);
  const [striking, setStriking] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(listPropertyEvaluationDrafts().filter((draft) => draft.resume?.href));
  }, []);

  if (drafts.length === 0) return null;

  const remove = (propertyId: string) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const commit = () => {
      deletePropertyEvaluationDraft(propertyId);
      setDrafts((current) => current.filter((d) => d.propertyId !== propertyId));
      setStriking(null);
    };
    if (reduce) {
      commit();
      return;
    }
    setStriking(propertyId);
    window.setTimeout(commit, 620);
  };

  return (
    <section
      aria-label="The Study Desk — analyses saved on this device"
      data-testid="saved-drafts-rail"
      style={{
        border: "1px solid #6d5325",
        borderTop: "3px solid #b98a3a",
        borderRadius: 12,
        // The drawer: dark walnut with a faint brass rail up top.
        background:
          "linear-gradient(180deg, rgba(30,22,10,0.62) 0%, rgba(14,32,45,0.78) 42%)",
        padding: "16px 18px 18px",
        display: "grid",
        gap: 14,
        color: "#e7ddca",
      }}
    >
      <style>{`
        @keyframes studydesk-strike {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes studydesk-close {
          0%   { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(14px); }
        }
        .studydesk-file { transition: box-shadow 140ms ease, transform 140ms ease; }
        .studydesk-file:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.34); }
        .studydesk-file.is-striking { animation: studydesk-close 600ms ease forwards; animation-delay: 180ms; }
        .studydesk-file.is-striking .studydesk-strikeline { animation: studydesk-strike 200ms ease forwards; }
        @media (prefers-reduced-motion: reduce) {
          .studydesk-file, .studydesk-file.is-striking, .studydesk-file.is-striking .studydesk-strikeline { animation: none; transition: none; }
        }
      `}</style>

      {/* Drawer label — the brass plate on the catalog slot. */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <strong
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#e0b968",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            The Study Desk
          </strong>
          <span style={{ fontSize: 12.5, color: "#c8bda6" }}>
            Files you&apos;ve opened, kept on this device — pick any one back up.
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: "#9c8f74", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.08em" }}>
          DEVICE-ONLY · NEVER SENT · {drafts.length} ON FILE
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {drafts.slice(0, 6).map((draft) => {
          const isStriking = striking === draft.propertyId;
          const track = draft.resume?.location?.trim() || "Location on file";
          return (
            <div
              key={draft.propertyId}
              className={`studydesk-file${isStriking ? " is-striking" : ""}`}
              style={{
                position: "relative",
                display: "grid",
                gap: 8,
                // Manila dossier file against the drawer.
                background: "linear-gradient(180deg, #f6efdd 0%, #efe6cf 100%)",
                color: "#3a3018",
                border: "1px solid #cbb98c",
                borderLeft: "6px solid #b0762c",
                borderRadius: "3px 8px 8px 3px",
                padding: "11px 13px 12px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.24)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", position: "relative" }}>
                <a
                  href={draft.resume?.href}
                  style={{
                    position: "relative",
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "#5a3a12",
                    textDecoration: "none",
                    lineHeight: 1.25,
                  }}
                >
                  {draft.resume?.title ?? draft.propertyId}
                  {/* The strike, drawn by hand across the entry. */}
                  <span
                    className="studydesk-strikeline"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "52%",
                      height: 2,
                      background: "#8a2f1d",
                      transform: "scaleX(0)",
                      transformOrigin: "left center",
                      pointerEvents: "none",
                    }}
                  />
                </a>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#8a6a2e",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    border: "1px solid #cbb98c",
                    borderRadius: 3,
                    padding: "1px 6px",
                    background: "rgba(176,118,44,0.10)",
                  }}
                >
                  Dossier
                </span>
              </div>

              {/* Old-school ledger metadata line. */}
              <div
                style={{
                  fontSize: 11.5,
                  color: "#6b5a35",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "0.02em",
                }}
              >
                LOGGED: {ledgerDate(draft.updatedAt)}
                {"  |  "}
                TRACK: {track}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <a
                  href={draft.resume?.href}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#0f5a46", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  Reopen file →
                </a>
                <button
                  type="button"
                  onClick={() => remove(draft.propertyId)}
                  disabled={isStriking}
                  style={{
                    font: "inherit",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: "#8a2f1d",
                    background: "transparent",
                    border: "1px solid rgba(138,47,29,0.42)",
                    borderRadius: 4,
                    padding: "3px 9px",
                    cursor: isStriking ? "default" : "pointer",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {isStriking ? "Closing…" : "[ Strike from Ledger ]"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <span style={{ fontSize: 11, color: "#9c8f74", lineHeight: 1.5 }}>
        Prefer a file that travels with you? Any analysis can be saved with Furlong by starting your
        borrower file — otherwise these live here, on this device, until you strike them.
      </span>
    </section>
  );
}
