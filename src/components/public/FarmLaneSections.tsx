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
  AG_HAULERS,
  buildFarmMarketView,
  ENTERPRISE_BRIEFS,
  FMCSA_SAFER_URL,
  HAULING_NOTE,
  LAND_OPTION_BRIEFS,
  type FarmBrief,
} from "@/lib/property/farmLaneCurated";
import { buildCommodityPrices, buildLivestockPrices } from "@/lib/property/commodityPricesLive";
import { CapitalRatesBlock } from "@/components/public/CapitalRatesBlock";
import { HundredPercentFinancingCallout } from "@/components/public/HundredPercentFinancingCallout";
import { FarmEquipmentExplorer } from "@/components/public/FarmEquipmentExplorer";
import { FarmFinancialHealthCheck } from "@/components/public/FarmFinancialHealthCheck";
import { LANE_THEMES } from "@/lib/property/laneThemes";

// This whole module wears the FARM lane's color identity (green — growth,
// agriculture, money) so it's visibly its own world while keeping the exact
// same structure as the residential chart.
const FARM = LANE_THEMES.farm;

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
  color: FARM.accent,
} as const;

const cardTitle = { fontSize: 15.5, color: "#101a2b", lineHeight: 1.25, fontWeight: 700 } as const;

const sectionKicker = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: FARM.accent,
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
        <span style={{ fontSize: 12.5, fontWeight: 700, color: FARM.accent }}>
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
              <a href={brief.url} target="_blank" rel="noopener noreferrer" style={{ color: FARM.accent }}>
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
  const view = buildFarmMarketView(buildCommodityPrices());
  const livestock = buildLivestockPrices();
  const fmt = (n: number | null): string => (n == null ? "—" : `$${n.toFixed(2)}`);
  return (
    <section aria-label="Commodity prices and regional cash bids" style={{ display: "grid", gap: 12 }}>
      {/* Header — same shape as the residential rates block. */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: FARM.accent }}>
            The grain market this week
          </span>
          <strong style={{ fontSize: 22, color: "#101a2b", lineHeight: 1.15 }}>
            What the crop is worth right now
          </strong>
        </div>
        {view.weekOf && (
          <span style={{ fontSize: 12, color: "#7a8aa0" }}>Tracks USDA · week of {view.weekOf}</span>
        )}
      </div>

      {/* Headline national prices — navy number tiles. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {view.headlinePrices.map((p) => (
          <div key={p.crop} style={{ ...card, background: FARM.tileBg, border: `1px solid ${FARM.tileBg}`, display: "grid", gap: 2, minWidth: 150, flex: "1 1 150px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: FARM.tileLabel }}>{p.crop}</span>
            <strong style={{ fontSize: 28, color: FARM.tileValue, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              ${p.value.toFixed(2)}
              <span style={{ fontSize: 13, fontWeight: 600, color: FARM.tileLabel }}>/bu</span>
            </strong>
            <span style={{ fontSize: 11, color: FARM.tileLabel }}>USDA national average</span>
          </div>
        ))}
      </div>

      {/* Livestock — renders only once the NASS livestock snapshot is populated
          (npm run ingest:nass-livestock-prices with the owner's key); no
          fabricated numbers before that. $/CWT, not $/bushel. */}
      {Object.keys(livestock).length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: FARM.accent }}>
            Livestock
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(livestock).map(([name, p]) => (
              <div key={name} style={{ ...card, background: FARM.tileBg, border: `1px solid ${FARM.tileBg}`, display: "grid", gap: 2, minWidth: 150, flex: "1 1 150px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: FARM.tileLabel }}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
                <strong style={{ fontSize: 28, color: FARM.tileValue, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  ${p.pricePerCwt.toFixed(2)}
                  <span style={{ fontSize: 13, fontWeight: 600, color: FARM.tileLabel }}>/cwt</span>
                </strong>
                <span style={{ fontSize: 11, color: FARM.tileLabel }}>USDA national average</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional cash bids — a clean table (the loan-options analog). */}
      {view.regions.length > 0 && (
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#708997" }}>
                {["Region cash bid", "Corn", "Soybeans", "Wheat"].map((h) => (
                  <th key={h} style={{ padding: "0 12px 8px 0", fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
              {view.regions.map((r) => (
                <tr key={r.name} style={{ borderTop: "1px solid #e5ebef" }}>
                  <td style={{ padding: "9px 12px 9px 0", fontWeight: 700, color: "#101a2b" }}>{r.name}</td>
                  {r.hasData ? (
                    <>
                      <td style={{ padding: "9px 12px 9px 0", color: FARM.accent, fontWeight: 700 }}>{fmt(r.corn)}</td>
                      <td style={{ padding: "9px 12px 9px 0", color: FARM.accent, fontWeight: 700 }}>{fmt(r.soybeans)}</td>
                      <td style={{ padding: "9px 0", color: FARM.accent, fontWeight: 700 }}>{fmt(r.wheat)}</td>
                    </>
                  ) : (
                    <td colSpan={3} style={{ padding: "9px 0", color: "#9aa6b6", fontStyle: "italic" }}>no reporting bids yet</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supporting line — input costs + FSA rate, now bold PILLS so they stand
          out instead of fading into the page (founder direction 2026-07-18). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#708997" }}>Also this week</span>
        {view.inputs.map((i) => {
          const dirColor = i.direction === "up" ? "#c2410c" : i.direction === "down" ? FARM.accent : "#101a2b";
          return (
            <span
              key={i.label}
              style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#101a2b", background: "#eef2f6", borderRadius: 999, padding: "5px 12px" }}
            >
              {i.label} y/y{" "}
              <strong style={{ fontWeight: 800, color: dirColor }}>
                {i.pct >= 0 ? "+" : ""}{i.pct}%{i.direction === "up" ? " ▲" : i.direction === "down" ? " ▼" : ""}
              </strong>
            </span>
          );
        })}
        <span style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#101a2b", background: "#eef2f6", borderRadius: 999, padding: "5px 12px" }}>
          FSA Farm Ownership <strong style={{ fontWeight: 800, color: FARM.accent }}>{view.fsaRate}%</strong>
          {view.fsaEffective ? <span style={{ fontWeight: 500, color: "#4d596d" }}>{` · eff. ${view.fsaEffective}`}</span> : null}
        </span>
      </div>

      <span style={{ fontSize: 11, color: "#9aa6b6" }}>{view.note}</span>
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

      {/* Farm financial health self-check — the operation view (is the OPERATION
          healthy) to complement the parcel view (what the LAND should do).
          Public Farm Financial Scorecard, facts+calculator only, routes to the
          Guild at the licensing seam (founder direction 2026-07-20). */}
      <FarmFinancialHealthCheck />

      {/* Equipment — interactive: suppliers inside each box + a recommend-for-
          my-operation picker (founder direction 2026-07-18). */}
      <FarmEquipmentExplorer />

      {/* Agricultural hauling (founder direction 2026-07-18). */}
      <section aria-label="Agricultural hauling" style={{ display: "grid", gap: 12 }}>
        <span style={sectionKicker}>Agricultural hauling — livestock, grain &amp; equipment</span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>
          Reliable hauling makes or breaks a delivery — of animals, grain, or a $200,000 combine. Verify any
          carrier&apos;s authority and insurance first, then line up a hauler that runs your kind of load.
        </p>
        <div style={cardGrid}>
          {AG_HAULERS.map((h) => (
            <div key={h.name} style={card}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: FARM.accent }}>Hauler</span>
              <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25 }}>{h.name}</strong>
              <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.5 }}>{h.role}</span>
              {h.disclosure && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9a3412" }}>⚠ {h.disclosure}</span>
              )}
            </div>
          ))}
        </div>
        <a
          href={FMCSA_SAFER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12.5, fontWeight: 700, color: FARM.accent, border: "1px solid #d7deea", borderRadius: 999, padding: "6px 13px", textDecoration: "none", background: "#ffffff", width: "fit-content" }}
        >
          Verify a carrier on FMCSA SAFER ↗
        </a>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{HAULING_NOTE}</span>
      </section>

      {/* SBA / prime / 504 / USDA capital rates (founder direction 2026-07-18:
          added to both farm and commercial). */}
      <CapitalRatesBlock accent={FARM.accent} subtitle="FSA, SBA & USDA financing" />

      <HundredPercentFinancingCallout />

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
