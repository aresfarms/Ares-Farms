"use client";

import { useEffect, useState } from "react";

import { loadChecklist, setChecklistItem } from "@/lib/property/dueDiligenceChecklist";

export type DiligenceItem = {
  label: string;
  pointer: string;
  howToFind: string;
  url?: string | null;
};

export type DiligenceChecklistColors = {
  accent: string;
  honey: string;
  cellBg: string;
  cellBorder: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
};

/**
 * DiligenceChecklist — the Uncharted section as a tickable workbook (founder
 * direction 2026-07-20). Each open item is a checkbox you can mark done; the
 * checked state persists ON THIS DEVICE ONLY (localStorage, zero-PII), so a
 * visitor who comes back a week later sees what they've already cleared.
 *
 * SSR-safe: renders unchecked on the server, then hydrates the saved state in
 * an effect (same pattern as the device-draft shelf) — no hydration mismatch.
 * Checked items still print (print CSS hides buttons, not inputs), so the
 * workbook travels onto the paper brief.
 */
export function DiligenceChecklist({
  propertyId,
  items,
  colors,
  cellStyle,
  labelStyle,
  summaryStyle,
}: {
  propertyId: string;
  items: DiligenceItem[];
  colors: DiligenceChecklistColors;
  cellStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  summaryStyle: React.CSSProperties;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecked(loadChecklist(propertyId));
  }, [propertyId]);

  const clearedCount = items.reduce((n, item) => (checked[item.label] ? n + 1 : n), 0);

  const toggle = (label: string, next: boolean) => {
    setChecked(setChecklistItem(propertyId, label, next));
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: colors.inkSoft, lineHeight: 1.5 }}>
          Your pre-flight due-diligence workbook — tick each as you clear it. Saved on this device only.
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.accent, whiteSpace: "nowrap" }}>
          {clearedCount} of {items.length} cleared
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
        {items.map((item) => {
          const isDone = !!checked[item.label];
          return (
            <label
              key={item.label}
              style={{
                ...cellStyle,
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 9,
                alignItems: "start",
                cursor: "pointer",
                opacity: isDone ? 0.62 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={(event) => toggle(item.label, event.target.checked)}
                aria-label={`Mark done: ${item.label}`}
                style={{ marginTop: 2, width: 15, height: 15, accentColor: colors.accent, cursor: "pointer" }}
              />
              <span style={{ display: "grid", gap: 2 }}>
                <span
                  style={{
                    ...labelStyle,
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    style={{ fontSize: 13, fontWeight: 700, color: colors.honey, textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {item.pointer} ↗
                  </a>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.honey }}>{item.pointer}</span>
                )}
                <details onClick={(event) => event.stopPropagation()}>
                  <summary style={summaryStyle}>how exactly ▸</summary>
                  <div style={{ fontSize: 11.5, lineHeight: 1.6, color: colors.inkSoft, marginTop: 4 }}>
                    {item.howToFind}
                  </div>
                </details>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
