"use client";

import type { ChartTheme } from "@/lib/property/chartThemes";

/**
 * PropertyResultCard — the free tier's DEFAULT view (founder direction
 * 2026-07-17): no more than ten bullets that answer the questions, grouped as
 * green flags / watch flags, with a short overall read and the full chart one
 * click behind it. The tease is DEPTH, not withholding — every bullet keeps
 * its number; what's paid is the why, the documents, the county pulls, the
 * personalized file. The full chart stays complete and free: its completeness
 * is the trust argument the platform stands on.
 */

export interface ResultCardFlag {
  label: string;
  value: string;
}

export interface PropertyResultCardProps {
  theme: ChartTheme;
  title: string;
  location: string;
  priceLabel: string;
  profileLabel: string | null;
  /** One-line verdict at the top. */
  verdictLine: string;
  /** Working in your favor — each carries its number. Max 4 rendered. */
  greenFlags: ResultCardFlag[];
  /** Watch these first — each names where the answer lives. Max 4 rendered. */
  watchFlags: ResultCardFlag[];
  /** The money line (all-in monthly + income bracket), when computable. */
  numbersLine: string | null;
  /** 3–5 line overall read. */
  overallRead: string;
  /** What the paid tiers add — one line, depth not withholding. */
  tierLine: string;
  chartOpen: boolean;
  onToggleChart: () => void;
  /** Export/save actions — same handlers the chart uses. */
  actionsSlot?: React.ReactNode;
}

export function PropertyResultCard(props: PropertyResultCardProps) {
  const { theme } = props;

  const flagRow = (flag: ResultCardFlag, color: string) => (
    <li
      key={flag.label}
      style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 13, lineHeight: 1.5, color: theme.inkSoft }}
    >
      <i
        aria-hidden
        style={{
          width: 10,
          height: 14,
          flex: "none",
          transform: "translateY(2px)",
          background: color,
          clipPath: "polygon(0 0, 100% 0, 70% 50%, 100% 100%, 0 100%)",
        }}
      />
      <span>
        <strong style={{ color: theme.ink }}>{flag.label}:</strong> {flag.value}
      </span>
    </li>
  );

  return (
    <section
      aria-label="Property result card"
      data-testid="property-result-card"
      style={{
        background: theme.stage,
        border: `1px solid ${theme.plateBorder}`,
        borderRadius: 20,
        padding: "22px 24px",
        display: "grid",
        gap: 14,
        color: theme.ink,
      }}
    >
      <div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.accent }}>
          The answer, first
        </span>
        <h2 style={{ margin: "6px 0 2px", fontSize: 21, lineHeight: 1.2, color: theme.ink }}>{props.title}</h2>
        <span style={{ fontSize: 12.5, color: theme.inkSoft }}>
          {props.location} · {props.priceLabel}
          {props.profileLabel ? ` · ${props.profileLabel}` : ""}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, fontWeight: 700, color: theme.ink }}>{props.verdictLine}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {props.greenFlags.length > 0 && (
          <div style={{ background: theme.plate, border: `1px solid ${theme.plateBorder}`, borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6fbf8f", display: "block", marginBottom: 8 }}>
              Working in your favor
            </span>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
              {props.greenFlags.slice(0, 4).map((flag) => flagRow(flag, "#6fbf8f"))}
            </ul>
          </div>
        )}
        {props.watchFlags.length > 0 && (
          <div style={{ background: theme.plate, border: `1px solid ${theme.plateBorder}`, borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#e2b34c", display: "block", marginBottom: 8 }}>
              Watch these first
            </span>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
              {props.watchFlags.slice(0, 4).map((flag) => flagRow(flag, "#e2b34c"))}
            </ul>
          </div>
        )}
      </div>

      {props.numbersLine && (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: theme.ink, background: theme.cellBg, border: `1px solid ${theme.cellBorder}`, borderRadius: 10, padding: "10px 14px" }}>
          {props.numbersLine}
        </p>
      )}

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: theme.inkSoft }}>{props.overallRead}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={props.onToggleChart}
          style={{
            font: "inherit",
            fontSize: 13.5,
            fontWeight: 800,
            padding: "9px 18px",
            borderRadius: 999,
            border: `1px solid ${theme.accent}`,
            background: "transparent",
            color: theme.accent,
            cursor: "pointer",
          }}
        >
          {props.chartOpen ? "Collapse the full chart ▴" : "Open the full chart — every fact, source, and cost ▾"}
        </button>
        <span style={{ fontSize: 11.5, color: theme.inkFaint }}>{props.tierLine}</span>
      </div>

      {props.actionsSlot}
    </section>
  );
}
