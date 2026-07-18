/**
 * FarmLaneSections — the Farms, Agriculture & Land module's own sections
 * (founder direction 2026-07-18): the commodity ticker, the questions real
 * farmers ask (enterprises, acreage, expansion, trials), the land-money
 * options (solar, developer, easements/CREP), farm equipment with costs and
 * supplier links, and cross-links to the Environmental and Financing modules.
 * Server component; every figure labeled illustrative and sourced.
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

const card = {
  border: "1px solid #d7deea",
  background: "#ffffff",
  borderRadius: 14,
  padding: "16px 20px",
} as const;

const kicker = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#0f766e",
} as const;

function BriefList({ title, briefs, intro }: { title: string; briefs: FarmBrief[]; intro?: string }) {
  return (
    <section aria-label={title} style={{ display: "grid", gap: 12 }}>
      <span style={kicker}>{title}</span>
      {intro && (
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#708997" }}>{intro}</p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {briefs.map((brief) => (
          <details key={brief.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
            <summary
              style={{
                cursor: "pointer",
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 700,
                color: "#101a2b",
                listStyle: "none",
              }}
            >
              {brief.question}
            </summary>
            <div style={{ padding: "0 20px 16px", display: "grid", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3b475a" }}>{brief.answer}</p>
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
        ))}
      </div>
    </section>
  );
}

export function FarmCommodityTicker() {
  const ticker = buildCommodityTicker();
  return (
    <section aria-label="Commodity prices" style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 18px",
          alignItems: "baseline",
          border: "1px solid #d7deea",
          background: "#0f2430",
          borderRadius: 12,
          padding: "10px 16px",
        }}
      >
        {ticker.items.map((item) => (
          <span key={item.label} style={{ fontSize: 13, color: "#b7ccd9", whiteSpace: "nowrap" }}>
            <strong style={{ color: "#eaf3f7", fontWeight: 700 }}>{item.label}</strong>{" "}
            <span style={{ color: "#eaf3f7", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
            {item.direction === "up" && <span style={{ color: "#f0864f" }}> ▲</span>}
            {item.direction === "down" && <span style={{ color: "#5ec6bb" }}> ▼</span>}
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11, color: "#9aa6b6" }}>{ticker.note}</span>
    </section>
  );
}

export function FarmLaneSections() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <BriefList title="The questions farmers actually ask" briefs={ENTERPRISE_BRIEFS} />
      <BriefList
        title="What your land could earn besides crops"
        briefs={LAND_OPTION_BRIEFS}
        intro="Every option below is real — but each one is only worth it if this particular parcel supports it: the zoning, the road access, and the demand nearby all have to line up. Read each as 'possible here if…', never as a promise. Confirm the zoning and your insurance before acting on any of them."
      />


      {/* Equipment — costs + suppliers */}
      <section aria-label="Farm equipment" style={{ display: "grid", gap: 12 }}>
        <span style={kicker}>Farm equipment — what the iron costs</span>
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#708997" }}>
                <th style={{ padding: "0 12px 8px 0", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</th>
                <th style={{ padding: "0 12px 8px 0", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Typical cost</th>
                <th style={{ padding: "0 0 8px 0", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>The honest note</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT_LINES.map((line) => (
                <tr key={line.category} style={{ borderTop: "1px solid #e5ebef" }}>
                  <td style={{ padding: "9px 12px 9px 0", fontWeight: 700, color: "#101a2b" }}>{line.category}</td>
                  <td style={{ padding: "9px 12px 9px 0", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", color: "#101a2b" }}>{line.typicalCost}</td>
                  <td style={{ padding: "9px 0", color: "#4d596d" }}>{line.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SUPPLIER_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "#0f766e",
                border: "1px solid #d7deea",
                borderRadius: 999,
                padding: "6px 13px",
                textDecoration: "none",
                background: "#ffffff",
              }}
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
        <Link href="/explore?lane=environmental-compliance" style={{ ...card, textDecoration: "none", display: "grid", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f6e56" }}>Environmental module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Water, soil, wetlands, and the site questions that change what ground can do.
          </span>
        </Link>
        <Link href="/explore?lane=financing-capital" style={{ ...card, textDecoration: "none", display: "grid", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>Financing &amp; Capital module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            FSA, Farm Credit, and the lanes beyond them — the capital side of every plan on this page.
          </span>
        </Link>
      </section>
    </div>
  );
}
