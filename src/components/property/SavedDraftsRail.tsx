"use client";

import { useEffect, useState } from "react";

import {
  deletePropertyEvaluationDraft,
  listPropertyEvaluationDrafts,
  type PropertyEvaluationDraft,
} from "@/lib/property/propertyEvaluationDraft";

/**
 * SavedDraftsRail — "come back a week or six months later" (founder direction
 * 2026-07-17). Lists analysis drafts saved ON THIS DEVICE (localStorage —
 * nothing ever leaves the device, no account, no server copy) with resume
 * links and per-draft delete. Renders nothing when there are no drafts.
 */
export function SavedDraftsRail() {
  const [drafts, setDrafts] = useState<PropertyEvaluationDraft[]>([]);

  useEffect(() => {
    setDrafts(listPropertyEvaluationDrafts().filter((draft) => draft.resume?.href));
  }, []);

  if (drafts.length === 0) return null;

  return (
    <section
      aria-label="Saved analysis drafts on this device"
      data-testid="saved-drafts-rail"
      style={{
        border: "1px solid #29536f",
        borderRadius: 14,
        background: "rgba(16, 45, 64, 0.74)",
        padding: "16px 18px",
        display: "grid",
        gap: 10,
        color: "#dce8ee",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15, color: "#f2f7fa" }}>Pick up where you left off</strong>
        <span style={{ fontSize: 11, color: "#7ea4bb" }}>
          Saved on this device only — never sent anywhere. Delete anytime. Prefer a file that
          travels with you? Any analysis can be saved with Furlong by starting your borrower file.
        </span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {drafts.slice(0, 6).map((draft) => (
          <div
            key={draft.propertyId}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              border: "1px solid #234a63",
              borderRadius: 10,
              background: "rgba(9, 28, 41, 0.8)",
              padding: "10px 12px",
            }}
          >
            <a
              href={draft.resume?.href}
              style={{ fontSize: 13.5, fontWeight: 700, color: "#7fc4b8", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {draft.resume?.title ?? draft.propertyId}
            </a>
            <span style={{ fontSize: 12, color: "#8fb0c4" }}>
              {draft.resume?.location} · saved {new Date(draft.updatedAt).toLocaleDateString()}
            </span>
            <button
              type="button"
              onClick={() => {
                deletePropertyEvaluationDraft(draft.propertyId);
                setDrafts((current) => current.filter((d) => d.propertyId !== draft.propertyId));
              }}
              style={{
                font: "inherit",
                fontSize: 12,
                fontWeight: 700,
                color: "#e8c088",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
