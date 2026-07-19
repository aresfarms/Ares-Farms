/**
 * CommercialLaneSections — the Commercial Properties module's own sections
 * (founder direction 2026-07-18): the kinds of commercial property with how
 * each is valued, the questions commercial owners actually ask, the questions
 * they never thought to ask (the value-add), and cross-links to the
 * Environmental and Financing modules. Wears the commercial TEAL identity.
 * Server component; every figure labeled illustrative and sourced.
 */

import Link from "next/link";

import {
  COMMERCIAL_BRIEFS,
  COMMERCIAL_TYPES,
  COMMERCIAL_TYPES_NOTE,
  COMMERCIAL_UNKNOWN_BRIEFS,
  type CommercialBrief,
} from "@/lib/property/commercialLaneCurated";
import { LANE_THEMES } from "@/lib/property/laneThemes";
import { HundredPercentFinancingCallout } from "@/components/public/HundredPercentFinancingCallout";

const COM = LANE_THEMES.commercial;

const card = {
  display: "grid",
  gap: 6,
  alignContent: "start",
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "14px 15px",
} as const;

const sectionKicker = {
  fontSize: 11.5,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: COM.accent,
} as const;

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12,
  alignItems: "start",
} as const;

function BriefCard({ tag, brief }: { tag: string; brief: CommercialBrief }) {
  return (
    <details style={{ ...card, padding: 0, overflow: "hidden" }}>
      <summary style={{ ...card, cursor: "pointer", listStyle: "none", margin: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: COM.accent }}>{tag}</span>
        <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25, fontWeight: 700 }}>{brief.question}</strong>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: COM.accent }}>
          <span className="cl-closed-only">Read →</span>
          <span className="cl-open-only">Close ▲</span>
        </span>
      </summary>
      <div style={{ padding: "0 15px 15px", display: "grid", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3b475a" }}>{brief.answer}</p>
        {brief.watch && (
          <div style={{ background: "#fdf3e7", borderLeft: "3px solid #c2410c", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9a3412" }}>⚠ Watch out</span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#7c2d12" }}>{brief.watch}</p>
          </div>
        )}
        {brief.financing && (
          <div style={{ background: "#eef0fe", borderLeft: "3px solid #534AB7", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#534AB7" }}>Financing note</span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#312a6b" }}>{brief.financing}</p>
          </div>
        )}
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Where to go: {brief.pointer}
          {brief.url && (
            <>
              {" · "}
              <a href={brief.url} target="_blank" rel="noopener noreferrer" style={{ color: COM.accent }}>
                {new URL(brief.url).hostname.replace("www.", "")} ↗
              </a>
            </>
          )}
        </span>
      </div>
    </details>
  );
}

function BriefSection({ title, tag, briefs, intro }: { title: string; tag: string; briefs: CommercialBrief[]; intro?: string }) {
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

export function CommercialLaneSections() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <style>{`.cl-open-only{display:none}details[open] .cl-open-only{display:inline}details[open] .cl-closed-only{display:none}`}</style>

      {/* The kinds of commercial property + how each is valued. */}
      <section aria-label="Kinds of commercial property" style={{ display: "grid", gap: 12 }}>
        <span style={sectionKicker}>The kinds of commercial property — and how each is valued</span>
        <div style={cardGrid}>
          {COMMERCIAL_TYPES.map((t) => (
            <div key={t.name} style={card}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: COM.accent }}>Commercial</span>
              <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25 }}>{t.name}</strong>
              <span style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.55 }}>{t.economics}</span>
              <span style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.5 }}>⚠ {t.watch}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{COMMERCIAL_TYPES_NOTE}</span>
      </section>

      <HundredPercentFinancingCallout />

      <BriefSection title="The questions commercial owners actually ask" tag="The essentials" briefs={COMMERCIAL_BRIEFS} />
      <BriefSection
        title="The questions you didn't know to ask"
        tag="Before you sign"
        briefs={COMMERCIAL_UNKNOWN_BRIEFS}
        intro="These are the ones that catch first-time commercial buyers — the deal-killers, tax levers, and lease traps nobody mentions until it's too late. Read them before you make an offer, not after."
      />

      {/* Cross-links to the sibling modules */}
      <section aria-label="Related modules" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/explore?lane=environmental-compliance" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f6e56" }}>Environmental module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Phase I, contamination, and the site questions a lender will require before it funds a commercial deal.
          </span>
        </Link>
        <Link href="/explore?lane=financing-capital" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>Financing &amp; Capital module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            SBA 504 &amp; 7(a), conventional commercial, and agency programs — the capital side of every option here.
          </span>
        </Link>
      </section>
    </div>
  );
}
