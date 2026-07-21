"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { InterestFirstDiscovery } from "@/components/discovery/InterestFirstDiscovery";
import type { GuidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import type { PropertyCategoryId } from "@/lib/property/propertyCategories";

/**
 * Guided intake — "What are you interested in?" (anonymous, INTERESTS-ONLY).
 *
 * The second of the dual property entries (the counts map is the first). Asks
 * only about INTERESTS — which states, which property types, what matters about
 * the place — and progressively narrows to honest, current counts, then deep-
 * links into the existing Explore by-state lists (where Save already lives).
 *
 * HARD LINES (Caitlin doctrine 2026-06-10):
 *  - NO PII, NO qualification questions — qualifying a person is a licensed act
 *    that happens in the licensed modules (Stuart/Five Borough for financing;
 *    Caitlin for environmental), never on a Furlong surface.
 *  - Verified-only: zone interest filters count VERIFIED designations from the
 *    frozen snapshots; counts come from the same is_current machinery as the
 *    map. No "may fit / may qualify" anywhere.
 *  - Anonymous: selections live in component state only; nothing is sent or
 *    stored (no server mutation → nothing to audit; the Save flow downstream
 *    keeps its existing in-session, no-PII behavior).
 */

const CATEGORY_LABELS: Partial<Record<PropertyCategoryId, string>> = {
  homes: "Homes",
  "farms-ranches": "Farms & Ranches",
  land: "Land",
  commercial: "Commercial",
  hospitality: "Hospitality / Hotels",
  businesses: "Businesses",
  misc: "Misc",
};

type ZoneInterest = "oz" | "hubzone";

export function GuidedIntake({ feed }: { feed: GuidedIntakeFeed }) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cats, setCats] = useState<PropertyCategoryId[]>([]);
  const [zones, setZones] = useState<ZoneInterest[]>([]);

  const byAbbr = useMemo(() => new Map(feed.states.map((s) => [s.abbr, s])), [feed.states]);

  // Categories that actually have inventory in the chosen states (zero-noise).
  const availableCats = useMemo(() => {
    const src = states.length ? states.map((a) => byAbbr.get(a)).filter(Boolean) : feed.states;
    const agg = new Map<PropertyCategoryId, number>();
    for (const s of src) for (const [k, v] of Object.entries(s!.byCategory)) agg.set(k as PropertyCategoryId, (agg.get(k as PropertyCategoryId) ?? 0) + (v ?? 0));
    return [...agg.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  }, [states, byAbbr, feed.states]);

  // Narrowed result rows: state × selected categories with live counts.
  const results = useMemo(() => {
    const chosen = states.length ? states : [];
    return chosen
      .map((abbr) => byAbbr.get(abbr))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => {
        const catCounts = (cats.length ? cats : (Object.keys(s.byCategory) as PropertyCategoryId[]))
          .map((c) => ({ cat: c, n: s.byCategory[c] ?? 0 }))
          .filter((x) => x.n > 0);
        return { abbr: s.abbr, catCounts, oz: s.ozDesignated, hubzone: s.hubzoneDesignated };
      })
      .filter((r) => r.catCounts.length > 0);
  }, [states, cats, byAbbr]);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (!open) {
    return (
      <button
        type="button"
        data-testid="guided-intake-entry"
        onClick={() => setOpen(true)}
        style={{
          justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 700, color: "#0f766e", background: "#ffffff",
          border: "1.5px solid #0f766e", borderRadius: 999, padding: "8px 18px", cursor: "pointer",
        }}
      >
        Or take the guided path — what are you interested in? →
      </button>
    );
  }

  return (
    <section
      aria-label="Guided property interests"
      data-testid="guided-intake"
      style={{ border: "1px solid #d7deea", borderRadius: 14, background: "#ffffff", padding: "20px 24px", display: "grid", gap: 16, maxWidth: 680 }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 17, color: "#162033" }}>What are you interested in?</strong>
        {/* WCAG AA: #7a8aa0 on white is 3.52:1 — below the 4.5:1 floor. */}
        <span style={{ fontSize: 12, color: "#4d596d" }}>
          Anonymous — your interests only. No personal information, no qualification questions; whether
          a program fits <em>you</em> is for a licensed professional, your lender, or the agency.
        </span>
      </div>

      {/* Place-first (founder direction 2026-07-20): "I don't know, but I want
          to live in Athens, GA" must be the FIRST move — a person with a place
          in mind should not have to hunt for their state in a 47-box grid. The
          inventory filter below stays as the browse path. */}
      <InterestFirstDiscovery embedded />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4d596d" }}>
          Or browse what we currently track
        </span>
        <span style={{ flex: 1, height: 1, background: "#e4e9f0" }} />
      </div>

      {/* Step 1 — states (only states with current inventory are offered). */}
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#3b475a" }}>1 · Which states?</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {feed.states.map((s) => (
            <button key={s.abbr} type="button" onClick={() => toggle(states, s.abbr, setStates)}
              aria-pressed={states.includes(s.abbr)}
              style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 10px", cursor: "pointer",
                border: `1.5px solid ${states.includes(s.abbr) ? "#0f766e" : "#cbd5e1"}`,
                background: states.includes(s.abbr) ? "#0f766e" : "#fff",
                color: states.includes(s.abbr) ? "#fff" : "#334155" }}>
              {s.abbr} · {s.total}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — property types (narrowed to what the chosen states actually have). */}
      {states.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#3b475a" }}>2 · What kind of property?</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {availableCats.map(([cat, n]) => (
              <button key={cat} type="button" onClick={() => toggle(cats, cat, setCats)}
                aria-pressed={cats.includes(cat)}
                style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 12px", cursor: "pointer",
                  border: `1.5px solid ${cats.includes(cat) ? "#6d28d9" : "#cbd5e1"}`,
                  background: cats.includes(cat) ? "#6d28d9" : "#fff",
                  color: cats.includes(cat) ? "#fff" : "#334155" }}>
                {CATEGORY_LABELS[cat] ?? cat} · {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — what matters about the PLACE (verified place-facts, never the person). */}
      {states.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#3b475a" }}>
            3 · What matters about the place? <span style={{ fontWeight: 400, color: "#7a8aa0" }}>(verified designations, optional)</span>
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {([["oz", "In a designated Opportunity Zone tract"], ["hubzone", "In a designated HUBZone"]] as const).map(([z, label]) => (
              <button key={z} type="button" onClick={() => toggle(zones, z, setZones)}
                aria-pressed={zones.includes(z)}
                style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "4px 12px", cursor: "pointer",
                  border: `1.5px solid ${zones.includes(z) ? "#b45309" : "#cbd5e1"}`,
                  background: zones.includes(z) ? "#b45309" : "#fff",
                  color: zones.includes(z) ? "#fff" : "#334155" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results — honest current counts; deep-links into the existing lists (Save lives there). */}
      {results.length > 0 && (
        <div data-testid="guided-results" style={{ display: "grid", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#162033" }}>
            Your results · current listings as of {feed.asOf}
          </span>
          {results.map((r) => (
            <div key={r.abbr} style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#3b475a" }}>{r.abbr}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.catCounts.map(({ cat, n }) => (
                  <Link key={cat}
                    href={`/explore?${new URLSearchParams({ lane: "property-land", category: cat, state: r.abbr }).toString()}`}
                    style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textDecoration: "underline" }}>
                    {CATEGORY_LABELS[cat] ?? cat}: {n} →
                  </Link>
                ))}
              </div>
              {zones.length > 0 && (
                <span style={{ fontSize: 12, color: "#5d687a" }}>
                  Verified designations in {r.abbr}:{" "}
                  {zones.includes("oz") ? `${r.oz} in a designated Opportunity Zone tract` : ""}
                  {zones.length === 2 ? " · " : ""}
                  {zones.includes("hubzone") ? `${r.hubzone} in a designated HUBZone` : ""}
                  {" "}— badges appear on each listing.
                </span>
              )}
            </div>
          ))}
          <span style={{ fontSize: 11, color: "#7a8aa0" }}>
            Open a list to view and save properties — saving stays anonymous and in-session.
          </span>
        </div>
      )}
    </section>
  );
}
