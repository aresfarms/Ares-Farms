/**
 * FarmLaneSections — the Farms, Agriculture & Land module's own sections
 * (founder direction 2026-07-18): the commodity ticker (regional cash bids —
 * NE, Mid-Atlantic, South, Midwest, West), the questions real farmers ask, the
 * land-money options, farm equipment, and cross-links to the Environmental and
 * Financing modules — all presented as cards in the same visual language as the
 * "On the shelf this week" listings. Server component; every figure labeled
 * illustrative and sourced.
 */

import Link from "next/link";

import {
  buildCommodityTicker,
  ENTERPRISE_BRIEFS,
  EQUIPMENT_LINES,
  EQUIPMENT_NOTE,
  LAND_OPTION_BRIEFS,
  SUPPLIER_LINKS,
  type FarmBrief,
} from "@/lib/property/farmLaneCurated";

// Listing-card visual language (matches PropertyShowcaseRail cards).
const card = {
  display: "grid",
  gap: 6,
  alignContent: "start",
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "14px 15px",
} as const;

const cardKicker = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#0f766e",
} as const;

const cardTitle = { fontSize: 15.5, color: "#101a2b", lineHeight: 1.25, fontWeight: 700 } as const;

const sectionKicker = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#0f766e",
} as const;

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12,
  alignItems: "start",
} as const;

function BriefCard({ tag, brief }: { tag: string; brief: FarmBrief }) {
  return (
    <details style={{ ...card, padding: 0, overflow: "hidden" }}>
      <summary style={{ ...card, cursor: "pointer", listStyle: "none", margin: 0 }}>
        <span style={cardKicker}>{tag}</span>
        <strong style={cardTitle}>{brief.question}</strong>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f766e" }}>
          <span className="fl-closed-only">Read →</span>
          <span className="fl-open-only">Close ▲</span>
        </span>
      </summary>
      <div style={{ padding: "0 15px 15px", display: "grid", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3b475a" }}>{brief.answer}</p>
        {brief.liability && (
          <div style={{ background: "#fdf3e7", borderLeft: "3px solid #c2410c", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9a3412" }}>
              ⚠ Liability &amp; insurance
            </span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#7c2d12" }}>{brief.liability}</p>
          </div>
        )}
        {brief.financing && (
          <div style={{ background: "#eef0fe", borderLeft: "3px solid #534AB7", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#534AB7" }}>
              Financing note
            </span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#312a6b" }}>{brief.financing}</p>
          </div>
        )}
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Where to go: {brief.pointer}
          {brief.url && (
            <>
              {" · "}
              <a href={brief.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0f766e" }}>
                {new URL(brief.url).hostname.replace("www.", "")} ↗
              </a>
            </>
          )}
        </span>
      </div>
    </details>
  );
}

function CardSection({ title, tag, briefs, intro }: { title: string; tag: string; briefs: FarmBrief[]; intro?: string }) {
  return (
    <section aria-label={title} style={{ display: "grid", gap: 12 }}>
      <span style={sectionKicker}>{title}</span>
      {intro && <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#708997" }}>{intro}</p>}
      <div style={cardGrid}>
        {briefs.map((brief) => (
          <BriefCard key={brief.id} tag={tag} brief={brief} />
        ))}
      </div>
    </section>
  );
}

export function FarmCommodityTicker() {
  const ticker = buildCommodityTicker();
  const priceRegions = ticker.regions;
  const fmt = (n: number | null): string => (n == null ? "—" : `$${n.toFixed(2)}`);
  return (
    <section aria-label="Commodity prices and regional cash bids" style={{ display: "grid", gap: 6 }}>
      <div style={{ border: "1px solid #d7deea", background: "#0f2430", borderRadius: 12, padding: "10px 16px", display: "grid", gap: 9 }}>
        {/* National prices, input costs, FSA rate */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px", alignItems: "baseline" }}>
          {ticker.items.map((item) => (
            <span key={item.label} style={{ fontSize: 13, color: "#b7ccd9", whiteSpace: "nowrap" }}>
              <strong style={{ color: "#eaf3f7", fontWeight: 700 }}>{item.label}</strong>{" "}
              <span style={{ color: "#eaf3f7", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
              {item.direction === "up" && <span style={{ color: "#f0864f" }}> ▲</span>}
              {item.direction === "down" && <span style={{ color: "#5ec6bb" }}> ▼</span>}
            </span>
          ))}
        </div>
        {/* Regional cash bids — the five parts of the country */}
        {priceRegions.length > 0 && (
          <div style={{ borderTop: "1px solid #23434f", paddingTop: 8, display: "grid", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "#6f97a6" }}>
              Regional cash bids · corn · soy · wheat
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "baseline" }}>
              {priceRegions.map((r) => (
                <span key={r.name} style={{ fontSize: 12.5, color: "#b7ccd9", whiteSpace: "nowrap" }}>
                  <strong style={{ color: "#eaf3f7", fontWeight: 700 }}>{r.name}</strong>{" "}
                  {r.hasData ? (
                    <span style={{ color: "#cfe0e8", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(r.corn)} · {fmt(r.soybeans)} · {fmt(r.wheat)}
                    </span>
                  ) : (
                    <span style={{ color: "#6f97a6", fontStyle: "italic" }}>no reporting bids yet</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: "#9aa6b6" }}>{ticker.note}</span>
    </section>
  );
}

export function FarmLaneSections() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* details[open] label toggle — no client JS needed. */}
      <style>{`.fl-open-only{display:none}details[open] .fl-open-only{display:inline}details[open] .fl-closed-only{display:none}`}</style>

      <CardSection title="The questions farmers actually ask" tag="Farm enterprise" briefs={ENTERPRISE_BRIEFS} />
      <CardSection
        title="What your land could earn besides crops"
        tag="Land option"
        briefs={LAND_OPTION_BRIEFS}
        intro="Every option below is real — but each one is only worth it if this particular parcel supports it: the zoning, the road access, and the demand nearby all have to line up. Read each as 'possible here if…', never as a promise. Confirm the zoning and your insurance before acting on any of them."
      />

      {/* Equipment — as cards, then supplier chips */}
      <section aria-label="Farm equipment" style={{ display: "grid", gap: 12 }}>
        <span style={sectionKicker}>Farm equipment — what the iron costs</span>
        <div style={cardGrid}>
          {EQUIPMENT_LINES.map((line) => (
            <div key={line.category} style={card}>
              <span style={cardKicker}>Equipment</span>
              <strong style={cardTitle}>{line.category}</strong>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f766e", fontVariantNumeric: "tabular-nums" }}>{line.typicalCost}</span>
              <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.5 }}>{line.note}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUPPLIER_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12.5, fontWeight: 700, color: "#0f766e", border: "1px solid #d7deea", borderRadius: 999, padding: "6px 13px", textDecoration: "none", background: "#ffffff" }}
              title={s.role}
            >
              {s.name} ↗
            </a>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{EQUIPMENT_NOTE}</span>
      </section>

      {/* Cross-links to the sibling modules */}
      <section aria-label="Related modules" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/explore?lane=environmental-compliance" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f6e56" }}>Environmental module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Water, soil, wetlands, and the site questions that change what ground can do.
          </span>
        </Link>
        <Link href="/explore?lane=financing-capital" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>Financing &amp; Capital module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            FSA, Farm Credit, and the lanes beyond them — the capital side of every plan on this page.
          </span>
        </Link>
      </section>
    </div>
  );
}
