"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { PropertyStateCountsFeed, StateCounts } from "@/lib/property/propertyStateCounts";

/**
 * Property counts map — tile-grid (statebins), compass-framed, color-by-type.
 *
 * UTILITY map ("where's the inventory, and how much") — deliberately visually
 * distinct from the homepage Living Opportunity Map (story/emotion). Every state
 * is an equal labeled cell so DC/RI/DE/NH hold their own number with no off-map
 * boxes. State level only — NO addresses. Counts arrive via props from the
 * governed server feed (propertyStateCounts: live sources, is_current only) and
 * carry its as-of stamp; this component never queries data itself.
 *
 * Type "versions": All=purple · Residential=blue · Land=amber · Commercial=red
 * (no green). Density shades WITHIN the selected type relative to that type's
 * max, so small-volume types still read. Clicking a state opens its per-type
 * breakdown + a "View listings" drill into the existing by-state list.
 */

type TypeKey = "total" | "residential" | "land" | "commercial";

const TYPE_META: Record<TypeKey, { label: string; categoryId: string | null; base: [number, number, number] }> = {
  total: { label: "All", categoryId: null, base: [109, 40, 217] }, // purple #6d28d9
  residential: { label: "Residential", categoryId: "homes", base: [29, 78, 216] }, // blue #1d4ed8
  land: { label: "Land", categoryId: "land", base: [180, 83, 9] }, // amber #b45309
  commercial: { label: "Commercial", categoryId: "commercial", base: [185, 28, 28] }, // red #b91c1c
};

/** Statebins grid (row, col) — the standard equal-cell US layout incl. DC/AK/HI. */
const GRID: Record<string, [number, number]> = {
  AK: [0, 0], ME: [0, 10],
  VT: [1, 9], NH: [1, 10],
  WA: [2, 0], ID: [2, 1], MT: [2, 2], ND: [2, 3], MN: [2, 4], IL: [2, 5], WI: [2, 6], MI: [2, 7], NY: [2, 8], RI: [2, 9], MA: [2, 10],
  OR: [3, 0], NV: [3, 1], WY: [3, 2], SD: [3, 3], IA: [3, 4], IN: [3, 5], OH: [3, 6], PA: [3, 7], NJ: [3, 8], CT: [3, 9],
  CA: [4, 0], UT: [4, 1], CO: [4, 2], NE: [4, 3], MO: [4, 4], KY: [4, 5], WV: [4, 6], VA: [4, 7], MD: [4, 8], DE: [4, 9],
  AZ: [5, 1], NM: [5, 2], KS: [5, 3], AR: [5, 4], TN: [5, 5], NC: [5, 6], SC: [5, 7], DC: [5, 8],
  OK: [6, 3], LA: [6, 4], MS: [6, 5], AL: [6, 6], GA: [6, 7],
  HI: [7, 0], TX: [7, 3], FL: [7, 8],
};

const ALL_ABBRS = Object.keys(GRID);

function shade(base: [number, number, number], count: number, max: number): string {
  if (count <= 0) return "#eef0f4"; // zero = greyed, never blank
  const t = 0.25 + 0.75 * Math.min(1, count / Math.max(1, max)); // density within type
  const [r, g, b] = base;
  // blend from a pale tint toward the full base color
  const mix = (c: number) => Math.round(255 - (255 - c) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
function textOn(count: number, max: number): string {
  return count > 0 && count / Math.max(1, max) > 0.55 ? "#ffffff" : "#1f2937";
}

export function PropertyCountsMap({ feed }: { feed: PropertyStateCountsFeed }) {
  const [type, setType] = useState<TypeKey>("total");
  const [selected, setSelected] = useState<string | null>(null);

  const byAbbr = useMemo(() => new Map(feed.states.map((s) => [s.abbr, s])), [feed.states]);
  const max = useMemo(
    () => Math.max(1, ...feed.states.map((s) => s[type])),
    [feed.states, type],
  );
  const meta = TYPE_META[type];
  const baseCss = `rgb(${meta.base[0]}, ${meta.base[1]}, ${meta.base[2]})`;
  const total = feed.totals[type];
  const statesWith = feed.states.filter((s) => s[type] > 0).length;
  const sel: StateCounts | null = selected
    ? byAbbr.get(selected) ?? { abbr: selected, residential: 0, land: 0, commercial: 0, total: 0 }
    : null;

  return (
    <section aria-label="Property inventory by state" style={{ display: "grid", gap: 14 }}>
      {/* Compass entry frame — the doorway, not a second map. Recolors with type. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <svg viewBox="0 0 40 40" width={34} height={34} aria-hidden="true" style={{ flexShrink: 0 }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke={baseCss} strokeWidth="2" />
          <path d="M20 5 L24 20 L20 35 L16 20 Z" fill={baseCss} />
          <circle cx="20" cy="20" r="3" fill="#ffffff" stroke={baseCss} strokeWidth="1.5" />
        </svg>
        <div style={{ display: "grid" }}>
          <strong style={{ fontSize: 17, color: "#162033" }}>Where the inventory is</strong>
          <span style={{ fontSize: 13, color: "#5d687a" }}>
            compass to capital · choose your direction — {total.toLocaleString("en-US")}{" "}
            {meta.label.toLowerCase() === "all" ? "current listings" : `current ${meta.label.toLowerCase()} listings`} across {statesWith} states · as of {feed.asOf}
          </span>
        </div>
      </div>

      {/* Type selector — recolors tiles + compass, re-totals. */}
      <div role="group" aria-label="Property type" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(Object.keys(TYPE_META) as TypeKey[]).map((k) => {
          const m = TYPE_META[k];
          const active = k === type;
          const css = `rgb(${m.base[0]}, ${m.base[1]}, ${m.base[2]})`;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              aria-pressed={active}
              style={{
                fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "5px 14px", cursor: "pointer",
                border: `1.5px solid ${css}`,
                background: active ? css : "#ffffff",
                color: active ? "#ffffff" : css,
              }}
            >
              {m.label} · {feed.totals[k].toLocaleString("en-US")}
            </button>
          );
        })}
      </div>

      {/* Tile grid — every state an equal labeled cell (DC/RI/DE/NH inline). */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(11, minmax(34px, 1fr))",
          gridTemplateRows: "repeat(8, auto)",
          gap: 4,
          maxWidth: 640,
        }}
      >
        {ALL_ABBRS.map((abbr) => {
          const [row, col] = GRID[abbr];
          const s = byAbbr.get(abbr);
          const count = s ? s[type] : 0;
          return (
            <button
              key={abbr}
              type="button"
              onClick={() => setSelected(abbr === selected ? null : abbr)}
              aria-label={`${abbr}: ${count} ${meta.label.toLowerCase()} listings`}
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                display: "grid",
                placeItems: "center",
                gap: 0,
                padding: "5px 2px",
                borderRadius: 6,
                border: abbr === selected ? `2px solid #162033` : "1px solid #d7deea",
                background: shade(meta.base, count, max),
                color: textOn(count, max),
                cursor: "pointer",
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{abbr}</span>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Drill-down — per-type breakdown + drill into the existing by-state list. */}
      {sel && (
        <div
          style={{
            border: "1px solid #d7deea", borderRadius: 12, background: "#ffffff",
            padding: "14px 18px", display: "grid", gap: 8, maxWidth: 640,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <strong style={{ fontSize: 15, color: "#162033" }}>{sel.abbr} — current listings by type</strong>
            <span style={{ fontSize: 12, color: "#7a8aa0" }}>as of {feed.asOf}</span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14, color: "#3b475a" }}>
            <span>Residential: <strong>{sel.residential}</strong></span>
            <span>Land: <strong>{sel.land}</strong></span>
            <span>Commercial: <strong>{sel.commercial}</strong></span>
            <span>Total: <strong>{sel.total}</strong></span>
          </div>
          {/* Drill-down carries the ACTIVE type. With "All" selected there is no
              single category, so render one link per nonzero type — never a
              hardcoded homes fallback. */}
          {sel.total > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(type === "total"
                ? (["residential", "land", "commercial"] as const).filter((k) => sel[k] > 0)
                : ([type] as const)
              ).map((k) => (
                <Link
                  key={k}
                  href={`/explore?${new URLSearchParams({
                    lane: "property-land",
                    category: TYPE_META[k].categoryId ?? "homes",
                    state: sel.abbr,
                  }).toString()}`}
                  style={{
                    fontSize: 14, fontWeight: 700, color: "#ffffff",
                    background: `rgb(${TYPE_META[k].base[0]}, ${TYPE_META[k].base[1]}, ${TYPE_META[k].base[2]})`,
                    borderRadius: 999, padding: "7px 16px", textDecoration: "none",
                  }}
                >
                  View {sel.abbr} {TYPE_META[k].label.toLowerCase()} ({sel[k]}) →
                </Link>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "#7a8aa0" }}>No current listings in {sel.abbr} right now.</span>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "#7a8aa0", maxWidth: 640 }}>
        Counts are state-level only and include only current listings from approved government sources
        (expired or historical records are never counted). Exact locations appear only on each listing&apos;s
        detail in Explore.
      </p>
    </section>
  );
}
