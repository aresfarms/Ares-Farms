import Link from "next/link";

import { GRANT_BRIEFS, GRANTS_NOTE, type GrantBrief } from "@/lib/property/grantsLaneCurated";
import { accentForLane } from "@/lib/property/laneThemes";

/**
 * GrantsLaneSections — the Grants & Programs module. The federal/state grant
 * programs a rural owner should know (REAP, VAPG, Community Facilities, RBDG,
 * plus the feasibility-study connection), as expandable briefs with the catch
 * called out, and cross-links to Financing + Farm. Raspberry accent. Server
 * component; educational, never a promise of an award.
 */

const RASPBERRY = accentForLane("programs-incentives", "light"); // #a8324f

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

function BriefCard({ brief }: { brief: GrantBrief }) {
  return (
    <details style={{ ...card, padding: 0, overflow: "hidden" }}>
      <summary style={{ ...card, cursor: "pointer", listStyle: "none", margin: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: RASPBERRY }}>{brief.program}</span>
        <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25, fontWeight: 700 }}>{brief.question}</strong>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: RASPBERRY }}>
          <span className="gr-closed">Read →</span>
          <span className="gr-open">Close ▲</span>
        </span>
      </summary>
      <div style={{ padding: "0 15px 15px", display: "grid", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#3b475a" }}>{brief.answer}</p>
        {brief.watch && (
          <div style={{ background: "#fdf3e7", borderLeft: "3px solid #c2410c", borderRadius: "0 8px 8px 0", padding: "9px 12px", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9a3412" }}>⚠ The catch</span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#7c2d12" }}>{brief.watch}</p>
          </div>
        )}
        <span style={{ fontSize: 11.5, color: "#708997" }}>
          Where to go: {brief.pointer}
          {brief.url && (
            <>
              {" · "}
              <a href={brief.url} target="_blank" rel="noopener noreferrer" style={{ color: RASPBERRY }}>
                {new URL(brief.url).hostname.replace("www.", "")} ↗
              </a>
            </>
          )}
        </span>
      </div>
    </details>
  );
}

/**
 * Live federal grant opportunities (Tier-2 activation 2026-07-28) — the
 * official Grants.gov register, rendered as facts-with-source + link-out.
 * Async server component; a failed fetch renders a plain link-out line, never
 * a fabricated list.
 */
async function LiveGrantOpportunities() {
  const { fetchGrantOpportunities } = await import("@/lib/grants/grantsGovSearch");
  const result = await fetchGrantOpportunities(8);
  const fmt = (d: string | null) => (d ? d.split("T")[0] : null);
  return (
    <section aria-label="Open federal grant opportunities" style={{ display: "grid", gap: 12 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: RASPBERRY }}>
        Open right now — live from Grants.gov
      </span>
      {result.opportunities.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {result.opportunities.map((o) => (
            <a
              key={o.id}
              href={o.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...card, textDecoration: "none", display: "grid", gap: 4 }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#101a2b", lineHeight: 1.35 }}>{o.title} ↗</span>
              <span style={{ fontSize: 12, color: "#4d596d" }}>
                {o.agency}
                {o.number ? ` · ${o.number}` : ""}
                {fmt(o.closeDate) ? ` · closes ${fmt(o.closeDate)}` : " · no close date posted"}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "#4d596d", lineHeight: 1.6 }}>
          The live register didn&apos;t answer just now — search it directly on{" "}
          <a href="https://www.grants.gov/search-grants" target="_blank" rel="noopener noreferrer" style={{ color: RASPBERRY, fontWeight: 700 }}>
            grants.gov ↗
          </a>
          .
        </p>
      )}
      <span style={{ fontSize: 11, color: "#708997", lineHeight: 1.5 }}>
        Source: {result.source} · searched: {result.searchedKeywords.join(", ")} · Listings and deadlines
        belong to the posting agency — always confirm on the linked page. Whether a program fits{" "}
        <em>you</em> is the agency&apos;s determination, never ours.{" "}
        <a href="https://www.grants.gov/search-grants" target="_blank" rel="noopener noreferrer" style={{ color: RASPBERRY, fontWeight: 700 }}>
          Search all of Grants.gov ↗
        </a>
      </span>
    </section>
  );
}

export function GrantsLaneSections() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <style>{`.gr-open{display:none}details[open] .gr-open{display:inline}details[open] .gr-closed{display:none}`}</style>

      <section aria-label="Grant programs" style={{ display: "grid", gap: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: RASPBERRY }}>
          Money that isn&apos;t a loan — the programs people miss
        </span>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.6, maxWidth: 720 }}>
          Federal and state grants can fund a real slice of a project — energy, value-added processing, rural
          facilities. They&apos;re competitive and deadline-driven, so knowing what fits and preparing early is
          most of the battle.
        </p>
        <div style={cardGrid}>
          {GRANT_BRIEFS.map((b) => (
            <BriefCard key={b.id} brief={b} />
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{GRANTS_NOTE}</span>
      </section>

      <LiveGrantOpportunities />

      <section aria-label="Related modules" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/explore?lane=financing-capital" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#534AB7" }}>Financing &amp; Capital →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            Grants rarely fund a whole project — pair them with the right loan program.
          </span>
        </Link>
        <Link href="/explore?lane=farms-agriculture" style={{ ...card, textDecoration: "none" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2f6d12" }}>Farms, Agriculture &amp; Land →</span>
          <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.5 }}>
            REAP and VAPG were built for farms — see the enterprise economics they support.
          </span>
        </Link>
      </section>
    </div>
  );
}
