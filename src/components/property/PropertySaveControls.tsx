"use client";

import { useEffect, useState } from "react";

import { isSaved, toggleSaved, SAVED_EVENT, type SavedProperty } from "@/lib/property/savedProperty";

/**
 * Per-listing Save toggle — NO account, NO PII. Saving keeps the property in the
 * tab's sessionStorage only (see savedProperty.ts). Reflects + updates the
 * shared saved set live (via the SAVED_EVENT window event).
 */
export function PropertySaveControls({ property }: { property: SavedProperty }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isSaved(property.id));
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    return () => window.removeEventListener(SAVED_EVENT, sync);
  }, [property.id]);

  return (
    <button
      type="button"
      onClick={() => toggleSaved(property)}
      aria-pressed={saved}
      data-saved={saved ? "true" : "false"}
      data-testid="save-button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        borderRadius: 999,
        padding: "6px 14px",
        border: `1px solid ${saved ? "#0f766e" : "#cdd9ec"}`,
        background: saved ? "#0f766e" : "#ffffff",
        color: saved ? "#ffffff" : "#334155",
      }}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
