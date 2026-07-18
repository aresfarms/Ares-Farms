"use client";

/**
 * FarmEquipmentExplorer — interactive farm-equipment section (founder direction
 * 2026-07-18): supplier links live INSIDE each equipment box (click to open a
 * dropdown), and a "match to your operation" picker flags the equipment
 * recommended for the visitor's farming specialty (with a "not sure — recommend
 * for me" default). Client component; data is the curated EQUIPMENT_LINES.
 */

import { useState } from "react";

import {
  EQUIPMENT_LINES,
  EQUIPMENT_NOTE,
  FARM_SPECIALTIES,
  SUPPLIER_LINKS,
} from "@/lib/property/farmLaneCurated";
import { LANE_THEMES } from "@/lib/property/laneThemes";

const FARM = LANE_THEMES.farm;

const card = {
  border: "1px solid #d7deea",
  background: "#ffffff",
  borderRadius: 14,
  padding: "14px 15px",
} as const;

function supplierFor(name: string) {
  return SUPPLIER_LINKS.find((s) => s.name === name) ?? null;
}

export function FarmEquipmentExplorer() {
  const [specialty, setSpecialty] = useState<string>("any");

  // Recommended-first ordering when a real specialty is picked.
  const items = [...EQUIPMENT_LINES].sort((a, b) => {
    if (specialty === "any") return 0;
    const ar = a.specialties.includes(specialty) ? 0 : 1;
    const br = b.specialties.includes(specialty) ? 0 : 1;
    return ar - br;
  });
  const specialtyLabel = FARM_SPECIALTIES.find((s) => s.id === specialty)?.label ?? "";

  return (
    <section aria-label="Farm equipment" style={{ display: "grid", gap: 12 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: FARM.accent }}>
        Farm equipment — what the iron costs
      </span>

      {/* Match to operation — the "recommend for my project" control. */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <label htmlFor="fl-specialty" style={{ fontSize: 13, fontWeight: 700, color: "#101a2b" }}>
          Recommend equipment for my operation:
        </label>
        <select
          id="fl-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          style={{ fontSize: 13, padding: "7px 12px", borderRadius: 999, border: `1px solid ${FARM.accent}`, color: "#101a2b", background: "#ffffff", fontWeight: 600, cursor: "pointer" }}
        >
          {FARM_SPECIALTIES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {specialty !== "any" && (
          <span style={{ fontSize: 12.5, color: FARM.accent, fontWeight: 700 }}>
            ✓ Recommended pieces for {specialtyLabel.toLowerCase()} are flagged and listed first.
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, alignItems: "start" }}>
        {items.map((line) => {
          const recommended = specialty !== "any" && line.specialties.includes(specialty);
          return (
            <div key={line.category} style={{ ...card, borderColor: recommended ? FARM.accent : "#d7deea", display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: FARM.accent }}>Equipment</span>
                {recommended && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#ffffff", background: FARM.accent, borderRadius: 999, padding: "2px 9px" }}>
                    Recommended
                  </span>
                )}
              </div>
              <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25 }}>{line.category}</strong>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: FARM.accent, fontVariantNumeric: "tabular-nums" }}>{line.typicalCost}</span>
              <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.5 }}>{line.note}</span>

              {/* Suppliers dropdown — inside the box (founder direction). */}
              <details style={{ marginTop: 2 }}>
                <summary style={{ cursor: "pointer", listStyle: "none", fontSize: 12.5, fontWeight: 700, color: FARM.accent }}>
                  <span className="fl-eq-closed">Where to buy it ▾</span>
                  <span className="fl-eq-open">Hide suppliers ▴</span>
                </summary>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                  {line.suppliers.map((name) => {
                    const s = supplierFor(name);
                    if (!s) return null;
                    return (
                      <a
                        key={name}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.role}
                        style={{ fontSize: 12, fontWeight: 700, color: FARM.accent, border: `1px solid #d7deea`, borderRadius: 999, padding: "5px 11px", textDecoration: "none", background: "#ffffff" }}
                      >
                        {s.name} ↗
                      </a>
                    );
                  })}
                </div>
              </details>
            </div>
          );
        })}
      </div>
      <style>{`.fl-eq-open{display:none}details[open] .fl-eq-open{display:inline}details[open] .fl-eq-closed{display:none}`}</style>
      <span style={{ fontSize: 11.5, color: "#708997", lineHeight: 1.5 }}>{EQUIPMENT_NOTE}</span>
    </section>
  );
}
