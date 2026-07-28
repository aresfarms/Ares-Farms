"use client";

import type { ChartTableBriefProps } from "@/components/property/ChartTableBrief";
import { CHART_THEMES } from "@/lib/property/chartThemes";

export type PropertyDecisionBriefProps = ChartTableBriefProps;

export function PropertyDecisionBrief(props: PropertyDecisionBriefProps) {
  const theme = CHART_THEMES[props.variant ?? "buyer"];
  const intelligence = props.intelligence;
  const facts = intelligence?.verifiedFacts ?? [];
  const unknowns = intelligence?.unknowns ?? [];
  const panel = {
    background: theme.plate,
    border: `1px solid ${theme.plateBorder}`,
    borderRadius: 14,
    padding: "16px 18px",
  } as const;

  return (
    <section
      aria-label="Property decision brief"
      data-testid="property-decision-brief"
      style={{ background: theme.stage, borderRadius: 20, padding: "24px", color: theme.ink, display: "grid", gap: 16 }}
    >
      <header style={{ ...panel, display: "grid", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.accent }}>
          Property decision brief
        </span>
        <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{props.title}</h2>
        <span style={{ fontSize: 13, color: theme.inkSoft }}>
          {props.location} · {props.propertyType} · {props.priceLabel}
        </span>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: theme.inkSoft }}>{props.headline}</p>
        <span style={{ fontSize: 11, color: theme.inkFaint }}>Preliminary property intelligence, not an approval or final determination.</span>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <section style={{ ...panel, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>What Furlong verified</h3>
          {facts.length ? facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} style={{ borderTop: `1px solid ${theme.cellBorder}`, paddingTop: 10, display: "grid", gap: 3 }}>
              <strong style={{ fontSize: 13 }}>{fact.label}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: theme.inkSoft }}>{fact.value}</span>
              <details>
                <summary style={{ cursor: "pointer", fontSize: 11, color: theme.accent }}>Source and explanation</summary>
                <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.55, color: theme.inkSoft }}>{fact.text}</p>
                <p style={{ margin: "4px 0 0", fontSize: 10.5, color: theme.inkFaint }}>{fact.provenance}</p>
              </details>
            </div>
          )) : <span style={{ fontSize: 13, color: theme.inkSoft }}>No property-specific facts have been verified yet.</span>}
        </section>

        <section style={{ ...panel, display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>What still needs verification</h3>
          {unknowns.length ? unknowns.map((item) => (
            <div key={item.label} style={{ borderTop: `1px solid ${theme.cellBorder}`, paddingTop: 10, display: "grid", gap: 3 }}>
              <strong style={{ fontSize: 13 }}>{item.label}</strong>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: theme.inkSoft }}>{item.howToFind}</span>
              <span style={{ fontSize: 10.5, color: theme.inkFaint }}>{item.pointer}</span>
            </div>
          )) : <span style={{ fontSize: 13, color: theme.inkSoft }}>No unresolved property questions are currently listed.</span>}
        </section>
      </div>

      {(props.readiness.length > 0 || props.fitLine || props.pauseLine) && (
        <section style={{ ...panel, display: "grid", gap: 9 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>What this means right now</h3>
          {props.fitLine && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{props.fitLine}</p>}
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 5, color: theme.inkSoft, fontSize: 13 }}>
            {props.readiness.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: theme.inkSoft }}>{props.pauseLine}</p>
        </section>
      )}

      {props.financingLanes.length > 0 && (
        <section style={{ ...panel, display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Potential financing paths to examine</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {props.financingLanes.map((lane) => <span key={lane} style={{ border: `1px solid ${theme.cellBorder}`, borderRadius: 999, padding: "6px 10px", fontSize: 12.5 }}>{lane}</span>)}
          </div>
        </section>
      )}

      {props.costsSlot}

      {intelligence?.mechanics && (
        <details style={panel}>
          <summary style={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }}>{intelligence.mechanics.heading}</summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {intelligence.mechanics.paragraphs.map((paragraph, index) => (
              <div key={`${index}-${paragraph.slice(0, 24)}`}>
                <strong style={{ fontSize: 12.5 }}>{intelligence.mechanics?.stepTitles[index] ?? `Step ${index + 1}`}</strong>
                <p style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>{paragraph}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {props.actionsSlot}
    </section>
  );
}
