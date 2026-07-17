import type {
  BriefFactLine,
  PropertyBriefIntelligence,
} from "@/lib/property/propertyBriefIntelligence";

/**
 * ChartTableBrief — the "Chart Table" presentation of the free Place Brief
 * (founder-selected concept, 2026-07-16: compass-to-capital literalized).
 *
 * A navigator's chart: a FIXED instrument panel (the answer + signal flags —
 * never scrolls away) beside a plotted route of five waypoints:
 *   I. The place, verified   → sourced facts (value-first, provenance on expand)
 *   II. Living here          → amenity distances
 *   III. How the deal works  → sale mechanics steps + how people pay
 *   IV. Uncharted            → honest unknowns with the official pointer
 *   V. Your next move        → export actions + deeper-waters tiers
 *
 * PRESENTATION ONLY: consumes the same PropertyBriefIntelligence the exports
 * use — no new data paths, no governed logic here. Interpretation stays
 * labeled (plain-language read); facts carry sources; unknowns stay honest.
 * Copy rules enforced by verify:brief-copy. Tier names carry NO pricing
 * (tier economics are founder-gated).
 */

const GOLD = "#d4b06a";
const INK = "#dce8ee";
const PLATE_BORDER = "#2c5876";

const plate: React.CSSProperties = {
  background: "linear-gradient(160deg, #12354a, #0d283a)",
  border: `1px solid ${PLATE_BORDER}`,
  borderRadius: 12,
  padding: "16px 18px",
};

const kicker: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: GOLD,
};

const factCell: React.CSSProperties = {
  background: "rgba(9, 28, 41, 0.8)",
  border: "1px solid #234a63",
  borderRadius: 8,
  padding: "8px 11px",
};

const factLab: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#7ea4bb",
};

const factVal: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: "#eaf3f7",
  marginTop: 2,
  lineHeight: 1.35,
};

const factSrc: React.CSSProperties = {
  fontSize: 10,
  color: "#5b7f95",
  marginTop: 3,
  fontFamily: "ui-monospace, 'Courier New', monospace",
};

const expandSummary: React.CSSProperties = {
  cursor: "pointer",
  listStyle: "none",
  fontSize: 10.5,
  color: "#6f96ac",
  marginTop: 4,
};

function Waypoint({
  pt,
  title,
  children,
}: {
  pt: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(16, 45, 64, 0.74)",
        border: "1px solid #29536f",
        borderRadius: 12,
        padding: "15px 18px",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -34,
          top: 14,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#0c2233",
          border: `2px solid ${GOLD}`,
          color: GOLD,
          fontSize: 11,
          fontWeight: 900,
          display: "grid",
          placeItems: "center",
        }}
      >
        {pt}
      </span>
      <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#f2f7fa", letterSpacing: "0.02em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Short provenance cite — the "Source: …" head without verify-URL tails. */
function shortSource(fact: BriefFactLine): string {
  return fact.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim();
}

export interface ChartTableBriefProps {
  title: string;
  location: string;
  sourceLabel: string;
  propertyType: string;
  priceLabel: string;
  fileNo: string | null;
  tierLabel: string;
  headline: string;
  readiness: string[];
  fitLine: string | null;
  pauseLine: string;
  intelligence: PropertyBriefIntelligence | null;
  financingLanes: string[];
  /** Export/save buttons — rendered inside waypoint V. */
  actionsSlot?: React.ReactNode;
  /** Deeper analysis workspace + switch-property rail — rendered after the route. */
  deeperSlot?: React.ReactNode;
}

export function ChartTableBrief(props: ChartTableBriefProps) {
  const intelligence = props.intelligence;
  const facts = (intelligence?.verifiedFacts ?? []).filter(
    (fact) => fact.label !== "Daily life nearby"
  );
  const livingHere = intelligence?.livingHere ?? null;
  const mechanics = intelligence?.mechanics ?? null;
  const unknowns = intelligence?.unknowns ?? [];

  return (
    <section
      aria-label="Place brief chart"
      data-testid="chart-table-brief"
      style={{
        background: "linear-gradient(180deg, #0c2233, #0a1b29 60%, #081521)",
        borderRadius: 20,
        padding: "30px 22px 34px",
        color: INK,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 300px) minmax(0, 1fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        {/* ── Instrument panel — the answer never scrolls out of view ── */}
        <aside style={{ position: "sticky", top: 16, display: "grid", gap: 12 }}>
          <div style={plate}>
            <span style={kicker}>The fix on this property</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: 20, color: "#f2f7fa", lineHeight: 1.2 }}>
              {props.title}
            </h2>
            <span style={{ fontSize: 12.5, color: "#8fb0c4", display: "block" }}>
              {props.propertyType} · {props.sourceLabel}
              {props.fileNo ? ` · #${props.fileNo}` : ""}
            </span>
            <span style={{ fontSize: 12.5, color: "#8fb0c4", display: "block" }}>
              {props.location} · {props.priceLabel}
            </span>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "#cfe0ea",
                margin: "10px 0 0",
                borderTop: "1px dashed #2c5876",
                paddingTop: 10,
              }}
            >
              {props.headline}
            </p>
            <span style={{ fontSize: 10, color: "#6f96ac", display: "block", marginTop: 6 }}>
              Plain-language read — not an approval or determination.
            </span>
          </div>

          <div style={{ ...plate, display: "grid", gap: 7 }}>
            <span style={kicker}>Signal flags</span>
            {props.readiness.map((flag) => {
              const warn = /not captured|needs|review before/i.test(flag);
              return (
                <span
                  key={flag}
                  style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#b7ccd9" }}
                >
                  <i
                    aria-hidden
                    style={{
                      width: 10,
                      height: 14,
                      flex: "none",
                      background: warn ? "#cf8a4a" : GOLD,
                      clipPath: "polygon(0 0, 100% 0, 70% 50%, 100% 100%, 0 100%)",
                    }}
                  />
                  {flag}
                </span>
              );
            })}
            <div style={{ borderTop: "1px dashed #2c5876", paddingTop: 8, display: "grid", gap: 4 }}>
              {props.fitLine && (
                <span style={{ fontSize: 12, lineHeight: 1.55, color: "#b7ccd9" }}>
                  <strong style={{ color: "#7fc4b8" }}>Fits if you want:</strong> {props.fitLine}.
                </span>
              )}
              <span style={{ fontSize: 12, lineHeight: 1.55, color: "#b7ccd9" }}>
                <strong style={{ color: "#e8c088" }}>Pause if you need:</strong> {props.pauseLine}.
              </span>
            </div>
          </div>
        </aside>

        {/* ── The route — five waypoints down the chart ── */}
        <main
          style={{
            position: "relative",
            paddingLeft: 34,
            display: "grid",
            gap: 14,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              top: 18,
              bottom: 30,
              borderLeft: "2px dashed #3e6d8e",
            }}
          />
          {facts.length > 0 && (
            <Waypoint pt="I" title="The place, verified">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {facts.map((fact) => (
                  <div key={fact.label} style={factCell}>
                    <div style={factLab}>{fact.label}</div>
                    <div style={factVal}>{fact.value}</div>
                    <div style={factSrc}>{shortSource(fact)}</div>
                    <details>
                      <summary style={expandSummary}>full fact ▸</summary>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: "#a9c3d2", marginTop: 4 }}>
                        {fact.text}
                        <div style={{ ...factSrc, marginTop: 4 }}>{fact.provenance}</div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </Waypoint>
          )}

          {livingHere && livingHere.items.length > 0 && (
            <Waypoint pt="II" title="Living here, in distances">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {livingHere.items.map((item) => (
                  <div key={item.label} style={factCell}>
                    <div style={factLab}>{item.label}</div>
                    <div style={factVal}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...factSrc, marginTop: 8 }}>{livingHere.attribution}</div>
            </Waypoint>
          )}

          {mechanics && (
            <Waypoint pt="III" title={mechanics.heading}>
              <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#c3d6e1" }}>
                {mechanics.stepTitles.map((stepTitle, index) => (
                  <div key={stepTitle}>
                    <strong style={{ color: "#eaf3f7" }}>{stepTitle}</strong>
                    <details>
                      <summary style={expandSummary}>the details ▸</summary>
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#a9c3d2" }}>
                        {mechanics.paragraphs[index] ?? ""}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
              {(props.financingLanes.length > 0 || intelligence?.pathwaysProse) && (
                <div style={{ borderTop: "1px dashed #2c5876", marginTop: 12, paddingTop: 10, display: "grid", gap: 6 }}>
                  <span style={kicker}>How people typically pay</span>
                  {props.financingLanes.map((lane) => (
                    <span key={lane} style={{ fontSize: 13, fontWeight: 700, color: "#eaf3f7" }}>{lane}</span>
                  ))}
                  {intelligence?.pathwaysProse && (
                    <details>
                      <summary style={expandSummary}>the full picture ▸</summary>
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "#a9c3d2" }}>
                        {intelligence.pathwaysProse}
                      </p>
                    </details>
                  )}
                </div>
              )}
            </Waypoint>
          )}

          {unknowns.length > 0 && (
            <Waypoint pt="IV" title="Uncharted — what nobody can tell you yet">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                {unknowns.map((unknown) => (
                  <div key={unknown.label} style={factCell}>
                    <div style={factLab}>{unknown.label}</div>
                    <div style={{ ...factVal, color: "#e8c088" }}>{unknown.pointer}</div>
                    <details>
                      <summary style={expandSummary}>how exactly ▸</summary>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: "#a9c3d2", marginTop: 4 }}>
                        {unknown.howToFind}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </Waypoint>
          )}

          <Waypoint pt="V" title="Your next move">
            <div style={{ display: "grid", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#c3d6e1", lineHeight: 1.55 }}>
                Take the brief with you — the export carries every fact, source, and open item on
                this chart.
              </span>
              {props.actionsSlot}
              <div style={{ borderTop: "1px solid #29536f", paddingTop: 12 }}>
                <span style={kicker}>Deeper waters — charted, not yet sailed</span>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12.5, color: "#b7ccd9" }}>
                    <span aria-hidden style={{ width: 46, height: 8, borderRadius: 4, background: GOLD, flex: "none" }} />
                    Institutional Coordination Report — financing coordination &amp; program mapping
                  </span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12.5, color: "#b7ccd9" }}>
                    <span aria-hidden style={{ width: 74, height: 8, borderRadius: 4, background: "#5f9450", flex: "none" }} />
                    Environmental Screen — site history and environmental context
                  </span>
                </div>
                <span style={{ fontSize: 10.5, color: "#6f96ac", display: "block", marginTop: 8 }}>
                  {props.tierLabel} — this free chart stays complete and exportable either way.
                </span>
              </div>
            </div>
          </Waypoint>
        </main>
      </div>
      {props.deeperSlot && <div style={{ marginTop: 18 }}>{props.deeperSlot}</div>}
    </section>
  );
}
