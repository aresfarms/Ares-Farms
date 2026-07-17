import type {
  BriefFactLine,
  PropertyBriefIntelligence,
} from "@/lib/property/propertyBriefIntelligence";
import {
  CHART_LENS_COPY,
  CHART_THEMES,
  orderFactsForLens,
  type ChartVariant,
} from "@/lib/property/chartThemes";

/**
 * ChartTableBrief — the "Chart Table" presentation family (founder-selected
 * concept 2026-07-16, extended same day to all audience lenses).
 *
 * One chart language — a FIXED instrument panel (the answer + signal flags,
 * never scrolls away) beside a plotted route of waypoints — themed per lens:
 * buyer (navigator teal/gold), environmental (surveyor green), finance
 * (ledger gold/slate, bankers), commercial (harbor copper).
 *
 * PRESENTATION ONLY: every lens consumes the same PropertyBriefIntelligence
 * the exports use — a lens reorders and reframes; it never invents data.
 * The finance lens is facts + open items ONLY (no products, terms, rates, or
 * eligibility — FINANCING_NODE_LIVE stays false; counsel gate respected).
 * Copy rules enforced by verify:brief-copy. Tier names carry NO pricing.
 */

function Waypoint({
  pt,
  title,
  accent,
  bg,
  border,
  id,
  children,
}: {
  pt: string;
  title: string;
  accent: string;
  bg: string;
  border: string;
  /** Anchor target so signal flags can point at the waypoint that answers them. */
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        position: "relative",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: "15px 18px",
        scrollMarginTop: 90,
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
          background: "rgba(0,0,0,0.35)",
          border: `2px solid ${accent}`,
          color: accent,
          fontSize: 11,
          fontWeight: 900,
          display: "grid",
          placeItems: "center",
        }}
      >
        {pt}
      </span>
      <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "inherit", letterSpacing: "0.02em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Signal-flag hues — distinct COLORS by meaning, not shades (founder feedback
 * 2026-07-17). Tuned for all four dark stages: green = clear to proceed,
 * amber = information gap, sky = fieldwork needed, violet = timing rule.
 */
function signalFlagColor(flag: string): string {
  if (/looks reviewable|window open/i.test(flag)) return "#6fbf8f";
  if (/price|not captured/i.test(flag)) return "#e2b34c";
  if (/inspection|fieldwork/i.test(flag)) return "#6aa9d8";
  if (/timing|window|review before/i.test(flag)) return "#b48ed0";
  return "#9db4c4";
}

/** Short provenance cite — the "Source: …" head without verify-URL tails. */
function shortSource(fact: BriefFactLine): string {
  return fact.provenance.replace(/^Source:\s*/i, "").split("·")[0].trim();
}

/**
 * Where each signal flag POINTS (founder feedback 2026-07-17: flags must
 * coordinate with the chart, not just sit there). Each flag resolves to the
 * first AVAILABLE waypoint that answers it — e.g. "Price not captured here"
 * jumps to the cost panel where a price can be entered.
 */
function flagTarget(
  flag: string,
  available: Record<string, string>
): { href: string; label: string } | null {
  const preference: Array<[RegExp, string[]]> = [
    [/price|not captured/i, ["wp-costs", "wp-uncharted"]],
    [/inspection|fieldwork|condition/i, ["wp-uncharted"]],
    [/timing|window|owner-occupant/i, ["wp-mechanics"]],
    [/needs review/i, ["wp-uncharted", "wp-mechanics"]],
    [/looks reviewable/i, ["wp-verified"]],
  ];
  for (const [pattern, targets] of preference) {
    if (!pattern.test(flag)) continue;
    for (const target of targets) {
      if (available[target]) return { href: `#${target}`, label: available[target] };
    }
  }
  return null;
}

export interface ChartTableBriefProps {
  variant?: ChartVariant;
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
  /** Export/save buttons — rendered inside the final waypoint. */
  actionsSlot?: React.ReactNode;
  /** Ownership-cost panel (OwnershipCostPanel) — its own waypoint. The parent
      decides which lenses carry it (finance lens: never — no products/terms). */
  costsSlot?: React.ReactNode;
  /** Alternatives from the government-listing inventory Furlong tracks. */
  similarHomes?: SimilarHomeLine[];
}

/** Public-safe similar-property line (server-selected; no coordinates). */
export interface SimilarHomeLine {
  id: string;
  title: string;
  location: string;
  priceLabel: string;
  comparison: "lower" | "similar" | "higher" | null;
  distanceMiles: number | null;
  /** Verifiable differentiators (flood vs this one, grocery, county taxes). */
  signals?: string[];
  vintage: string;
  isCurrent: boolean;
  sourceLabel: string;
  href: string;
}

export function ChartTableBrief(props: ChartTableBriefProps) {
  const variant: ChartVariant = props.variant ?? "buyer";
  const theme = CHART_THEMES[variant];
  const lens = CHART_LENS_COPY[variant];

  const kicker: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: theme.accent,
  };
  const plate: React.CSSProperties = {
    background: theme.plate,
    border: `1px solid ${theme.plateBorder}`,
    borderRadius: 12,
    padding: "16px 18px",
  };
  const factCell: React.CSSProperties = {
    background: theme.cellBg,
    border: `1px solid ${theme.cellBorder}`,
    borderRadius: 8,
    padding: "8px 11px",
  };
  const factLab: React.CSSProperties = {
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: theme.inkSoft,
  };
  const factVal: React.CSSProperties = {
    fontSize: 13.5,
    fontWeight: 700,
    color: theme.ink,
    marginTop: 2,
    lineHeight: 1.35,
  };
  const factSrc: React.CSSProperties = {
    fontSize: 10,
    color: theme.inkFaint,
    marginTop: 3,
    fontFamily: "ui-monospace, 'Courier New', monospace",
  };
  const expandSummary: React.CSSProperties = {
    cursor: "pointer",
    listStyle: "none",
    fontSize: 10.5,
    color: theme.inkFaint,
    marginTop: 4,
  };

  const intelligence = props.intelligence;
  const facts = orderFactsForLens(
    (intelligence?.verifiedFacts ?? []).filter((fact) => fact.label !== "Daily life nearby"),
    variant
  );
  const livingHere = lens.showLiving ? intelligence?.livingHere ?? null : null;
  const mechanics = intelligence?.mechanics ?? null;
  // Lens extras merge AFTER the brief's unknowns (which now carry the
  // property-profile question bank) — dedupe by label so a topic both know
  // about renders once.
  const briefUnknowns = intelligence?.unknowns ?? [];
  const briefUnknownLabels = new Set(briefUnknowns.map((u) => u.label.toLowerCase()));
  const unknowns = [
    ...briefUnknowns,
    ...lens.extraUnknowns.filter((u) => !briefUnknownLabels.has(u.label.toLowerCase())),
  ];
  const headline = lens.headline || props.headline;

  // Anchor targets that actually render on THIS chart — flags link only to
  // waypoints that exist (founder feedback 2026-07-17: flags coordinate).
  const waypointAnchors: Record<string, string> = {};
  if (facts.length > 0) waypointAnchors["wp-verified"] = lens.waypointFacts;
  if (livingHere && livingHere.items.length > 0) waypointAnchors["wp-living"] = lens.waypointLiving;
  if (mechanics) waypointAnchors["wp-mechanics"] = mechanics.heading;
  if (unknowns.length > 0) waypointAnchors["wp-uncharted"] = lens.waypointUncharted;
  if (props.costsSlot) waypointAnchors["wp-costs"] = "What it costs to buy — and to keep";
  if ((props.similarHomes?.length ?? 0) > 0) waypointAnchors["wp-similar"] = "Also on this chart nearby";

  // Waypoint numbering stays sequential per lens (some waypoints are absent).
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  let wp = 0;
  const nextPt = () => numerals[Math.min(wp++, numerals.length - 1)];

  const tierLines = [
    {
      key: "coordination",
      color: "#d4b06a",
      width: 46,
      text: "Institutional Coordination Report — financing coordination & program mapping",
    },
    {
      key: "environmental",
      color: "#5f9450",
      width: 74,
      text: "Environmental Screen — site history and environmental context",
    },
  ].sort((a, b) => (a.key === lens.tierLead ? -1 : b.key === lens.tierLead ? 1 : 0));

  return (
    <section
      aria-label="Place brief chart"
      data-testid="chart-table-brief"
      data-chart-variant={variant}
      style={{
        background: theme.stage,
        borderRadius: 20,
        padding: "30px 22px 34px",
        color: theme.ink,
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
            <span style={kicker}>{lens.panelKicker}</span>
            <h2 style={{ margin: "6px 0 2px", fontSize: 20, color: theme.ink, lineHeight: 1.2 }}>
              {props.title}
            </h2>
            <span style={{ fontSize: 12.5, color: theme.inkSoft, display: "block" }}>
              {props.propertyType} · {props.sourceLabel}
              {props.fileNo ? ` · #${props.fileNo}` : ""}
            </span>
            {intelligence?.profile && (
              <span style={{ fontSize: 11.5, color: theme.accent, display: "block", marginTop: 2 }}>
                Charted as: {intelligence.profile.label} — the questions below match it
              </span>
            )}
            <span style={{ fontSize: 12.5, color: theme.inkSoft, display: "block" }}>
              {props.location} · {props.priceLabel}
            </span>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.55,
                color: theme.inkSoft,
                margin: "10px 0 0",
                borderTop: `1px dashed ${theme.plateBorder}`,
                paddingTop: 10,
              }}
            >
              {headline}
            </p>
            <span style={{ fontSize: 10, color: theme.inkFaint, display: "block", marginTop: 6 }}>
              Plain-language read — not an approval or determination.
            </span>
          </div>

          <div style={{ ...plate, display: "grid", gap: 7 }}>
            <span style={kicker}>Signal flags</span>
            {props.readiness.map((flag) => {
              const target = flagTarget(flag, waypointAnchors);
              const pennant = (
                <i
                  aria-hidden
                  style={{
                    width: 10,
                    height: 14,
                    flex: "none",
                    background: signalFlagColor(flag),
                    clipPath: "polygon(0 0, 100% 0, 70% 50%, 100% 100%, 0 100%)",
                  }}
                />
              );
              // Every flag POINTS somewhere on the chart — click it and the
              // waypoint that answers it scrolls into view.
              return target ? (
                <a
                  key={flag}
                  href={target.href}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 9,
                    fontSize: 12.5,
                    color: theme.inkSoft,
                    textDecoration: "none",
                  }}
                >
                  {pennant}
                  <span>
                    {flag}
                    <span
                      style={{
                        display: "block",
                        fontSize: 10.5,
                        color: theme.inkFaint,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      → {target.label}
                    </span>
                  </span>
                </a>
              ) : (
                <span
                  key={flag}
                  style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: theme.inkSoft }}
                >
                  {pennant}
                  {flag}
                </span>
              );
            })}
            <div style={{ borderTop: `1px dashed ${theme.plateBorder}`, paddingTop: 8, display: "grid", gap: 4 }}>
              {props.fitLine && variant === "buyer" && (
                <span style={{ fontSize: 12, lineHeight: 1.55, color: theme.inkSoft }}>
                  <strong style={{ color: theme.accent }}>Fits if you want:</strong> {props.fitLine}.
                </span>
              )}
              <span style={{ fontSize: 12, lineHeight: 1.55, color: theme.inkSoft }}>
                <strong style={{ color: theme.honey }}>Pause if you need:</strong> {props.pauseLine}.
              </span>
            </div>
          </div>
        </aside>

        {/* ── The route — waypoints down the chart ── */}
        <main style={{ position: "relative", paddingLeft: 34, display: "grid", gap: 14 }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              top: 18,
              bottom: 30,
              borderLeft: `2px dashed ${theme.waypointBorder}`,
            }}
          />
          {facts.length > 0 && (
            <Waypoint pt={nextPt()} id="wp-verified" title={lens.waypointFacts} accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {facts.map((fact) => (
                  <div key={fact.label} style={factCell}>
                    <div style={factLab}>{fact.label}</div>
                    <div style={factVal}>{fact.value}</div>
                    <div style={factSrc}>{shortSource(fact)}</div>
                    <details>
                      <summary style={expandSummary}>full fact ▸</summary>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: theme.inkSoft, marginTop: 4 }}>
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
            <Waypoint pt={nextPt()} id="wp-living" title={lens.waypointLiving} accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
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
            <Waypoint pt={nextPt()} id="wp-mechanics" title={mechanics.heading} accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
              <div style={{ display: "grid", gap: 8, fontSize: 13, color: theme.inkSoft }}>
                {mechanics.stepTitles.map((stepTitle, index) => (
                  <div key={stepTitle}>
                    <strong style={{ color: theme.ink }}>{stepTitle}</strong>
                    <details>
                      <summary style={expandSummary}>the details ▸</summary>
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>
                        {mechanics.paragraphs[index] ?? ""}
                      </p>
                    </details>
                  </div>
                ))}
              </div>
              {variant !== "finance" && (props.financingLanes.length > 0 || intelligence?.pathwaysProse) && (
                <div style={{ borderTop: `1px dashed ${theme.plateBorder}`, marginTop: 12, paddingTop: 10, display: "grid", gap: 6 }}>
                  <span style={kicker}>How people typically pay</span>
                  {props.financingLanes.map((lane) => (
                    <span key={lane} style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>{lane}</span>
                  ))}
                  {intelligence?.pathwaysProse && (
                    <details>
                      <summary style={expandSummary}>the full picture ▸</summary>
                      <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>
                        {intelligence.pathwaysProse}
                      </p>
                    </details>
                  )}
                </div>
              )}
            </Waypoint>
          )}

          {unknowns.length > 0 && (
            <Waypoint pt={nextPt()} id="wp-uncharted" title={lens.waypointUncharted} accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                {unknowns.map((unknown) => (
                  <div key={unknown.label} style={factCell}>
                    <div style={factLab}>{unknown.label}</div>
                    {"url" in unknown && unknown.url ? (
                      <a
                        href={unknown.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...factVal, color: theme.honey, display: "block", textDecoration: "underline", textUnderlineOffset: 2 }}
                      >
                        {unknown.pointer} ↗
                      </a>
                    ) : (
                      <div style={{ ...factVal, color: theme.honey }}>{unknown.pointer}</div>
                    )}
                    <details>
                      <summary style={expandSummary}>how exactly ▸</summary>
                      <div style={{ fontSize: 11.5, lineHeight: 1.6, color: theme.inkSoft, marginTop: 4 }}>
                        {unknown.howToFind}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
              {(intelligence?.diligenceCosts?.length ?? 0) > 0 && (
                <div style={{ borderTop: `1px dashed ${theme.plateBorder}`, marginTop: 12, paddingTop: 10, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: theme.accent }}>
                      What these answers typically cost
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.inkFaint, border: `1px solid ${theme.cellBorder}`, borderRadius: 999, padding: "2px 8px" }}>
                      Plain-language guidance
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {intelligence?.diligenceCosts?.map((cost) => (
                      <div key={cost.label} style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", fontSize: 12.5 }}>
                        <span style={{ color: theme.inkSoft, minWidth: 210 }}>{cost.label}</span>
                        <strong style={{ color: theme.ink }}>{cost.range}</strong>
                        {cost.note && <span style={{ color: theme.inkFaint, fontSize: 11.5 }}>{cost.note}</span>}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 10.5, color: theme.inkFaint, lineHeight: 1.5 }}>
                    Typical national ranges, not quotes — get local numbers. Outside as-is government
                    sales, many of these are negotiable as seller credits; in as-is sales the
                    inspection informs your decision, not a repair negotiation.
                  </span>
                </div>
              )}
            </Waypoint>
          )}

          {props.costsSlot && (
            <Waypoint pt={nextPt()} id="wp-costs" title="What it costs to buy — and to keep" accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
              {props.costsSlot}
            </Waypoint>
          )}

          {(props.similarHomes?.length ?? 0) > 0 && (
            <Waypoint pt={nextPt()} id="wp-similar" title="Also on this chart nearby" accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
              <div style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 12.5, lineHeight: 1.6, color: theme.inkSoft }}>
                  Other properties from the same government inventory, close enough to matter. Each
                  line lists what we can verify from here — whether one beats the property above
                  comes down to price and condition, and every card opens the same full chart so
                  you can compare like for like.
                </span>
                {props.similarHomes?.map((home) => (
                  <a
                    key={home.id}
                    href={home.href}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      background: theme.cellBg,
                      border: `1px solid ${theme.cellBorder}`,
                      borderRadius: 8,
                      padding: "9px 12px",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ display: "grid", gap: 2 }}>
                      <strong style={{ fontSize: 13, color: theme.ink }}>{home.title}</strong>
                      <span style={{ fontSize: 11.5, color: theme.inkFaint }}>
                        {home.location}
                        {home.distanceMiles != null ? ` · ~${home.distanceMiles} mi away` : ""} · {home.sourceLabel}
                        {home.isCurrent ? "" : ` · ${home.vintage}`}
                      </span>
                      {(home.signals?.length ?? 0) > 0 && (
                        <span style={{ fontSize: 11.5, lineHeight: 1.5, color: theme.inkSoft }}>
                          {home.signals?.join(" · ")}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: theme.accent, whiteSpace: "nowrap" }}>
                      {home.priceLabel}
                      {home.comparison === "lower" && <span style={{ fontWeight: 700, color: theme.inkSoft }}> · less than this one</span>}
                      {home.comparison === "higher" && <span style={{ fontWeight: 700, color: theme.inkSoft }}> · more than this one</span>}
                      {home.comparison === "similar" && <span style={{ fontWeight: 700, color: theme.inkSoft }}> · about the same</span>}
                    </span>
                  </a>
                ))}
                <span style={{ fontSize: 10.5, color: theme.inkFaint, lineHeight: 1.5 }}>
                  From the government-listing inventory Furlong tracks (HUD, USDA, Treasury, GSA) —
                  not the whole market. A local agent will see more; these are the ones we can
                  verify. See a listing somewhere else? Paste its link or address into Furlong and
                  it gets the same chart.
                </span>
              </div>
            </Waypoint>
          )}

          <Waypoint pt={nextPt()} title={lens.waypointNext} accent={theme.accent} bg={theme.waypointBg} border={theme.waypointBorder}>
            <div style={{ display: "grid", gap: 12 }}>
              <span style={{ fontSize: 13, color: theme.inkSoft, lineHeight: 1.55 }}>
                Take the brief with you — the export carries every fact, source, and open item on
                this chart.
              </span>
              {props.actionsSlot}
              <div style={{ borderTop: `1px solid ${theme.waypointBorder}`, paddingTop: 12 }}>
                <span style={kicker}>Deeper waters — charted, not yet sailed</span>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {tierLines.map((tier) => (
                    <span key={tier.key} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12.5, color: theme.inkSoft }}>
                      <span aria-hidden style={{ width: tier.width, height: 8, borderRadius: 4, background: tier.color, flex: "none" }} />
                      {tier.text}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 10.5, color: theme.inkFaint, display: "block", marginTop: 8 }}>
                  {props.tierLabel} — this free chart stays complete and exportable either way.
                </span>
              </div>
            </div>
          </Waypoint>
        </main>
      </div>
    </section>
  );
}
