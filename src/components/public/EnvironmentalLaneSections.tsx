/**
 * EnvironmentalLaneSections — the Environmental module's sections (founder
 * direction 2026-07-18; the founder's own domain). The site-side questions a
 * buyer needs answered before closing, as expandable cards, plus cross-links to
 * the Financing and Farm/Commercial modules. Wears the environmental EMERALD
 * accent. Server component; educational + illustrative, never a substitute for
 * a professional assessment.
 */

import Link from "next/link";

import { ENVIRONMENTAL_BRIEFS, ENVIRONMENTAL_NOTE, type EnvBrief } from "@/lib/property/environmentalLaneCurated";
import { accentForLane } from "@/lib/property/laneThemes";

const EMERALD = accentForLane("environmental-compliance", "light"); // #127a4f

const card = {
  display: "grid",
  gap: 6,
  alignContent: "start",
  border: "1px solid #d7deea",
  borderRadius: 14,
  background: "#ffffff",
  padding: "14px 15px",
} as const;

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 12,
  alignItems: "start",
} as const;

function BriefCard({ brief }: { brief: EnvBrief }) {
  return (
    <details style={{ ...card, padding: 0, overflow: "hidden" }}>
      <summary style={{ ...card, cursor: "pointer", listStyle: "none", margin: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: EMERALD }}>Site-side</span>
        <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25, fontWeight: 700 }}>{brief.question}</strong>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: EMERALD }}>
          <span className="env-closed">Read →</span>
          <span className="env-open">Close ▲</span>
        </span>
      </summary>
      <div style={{ padding: "0 15px 15px", display: "grid", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3b475a" }}>{brief.answer}</p>
        {brief.watch && (
          <div style={{ background: "#fdf3e7", borderLeft: "3px solid #c2410c", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9a3412" }}>⚠ Deal-killer to know</span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#7c2d12" }}>{brief.watch}</p>
          </div>
        )}
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Where to go: {brief.pointer}
          {brief.url && (
            <>
              {" · "}
              <a href={brief.url} target="_blank" rel="noopener noreferrer" style={{ color: EMERALD }}>
                {new URL(brief.url).hostname.replace("www.", "")} ↗
              </a>
            </>
          )}
        </span>
      </div>
    </details>
  );
}

export function EnvironmentalLaneSections() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`.env-open{display:none}details[open] .env-open{display:inline}details[open] .env-closed{display:none}`}</style>

      <section aria-label="Environmental site questions" style={{ display: "grid", gap: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: EMERALD }}>
          The site-side reality — before you close
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          The ground has its own truths — contamination, water, wetlands, permits — and they change what a property
          can do and what it can cost you. These are the questions a lender will ask and a first-time buyer usually
          doesn&apos;t, answered straight.
        </p>
        <div style={cardGrid}>
          {ENVIRONMENTAL_BRIEFS.map((b) => (
            <BriefCard key={b.id} brief={b} />
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{ENVIRONMENTAL_NOTE}</span>
      </section>

      <section aria-label="Related modules" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/explore?lane=financing-capital" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>Financing &amp; Capital module →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            A clean Phase I is a lender requirement — the capital side of every environmental clearance.
          </span>
        </Link>
        <Link href="/explore?lane=farms-agriculture" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2f6d12" }}>Farms, Agriculture &amp; Land →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Nutrient management, water rights, and the land uses these site facts make or break.
          </span>
        </Link>
      </section>
    </div>
  );
}
