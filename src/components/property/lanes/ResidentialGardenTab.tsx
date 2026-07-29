"use client";

/**
 * ResidentialGardenTab — the residential lane's Yard & Garden tab (founder
 * request 2026-07-29: repurpose the farm lane's agriculture slot on the
 * residential side as "garden plants that would grow well in their
 * individual yards along with native plants for the area").
 *
 * Pure presentation of the deterministic residentialGardenGuide output:
 * soil-matched garden guidance plus curated region-native plants. Advisory
 * screening only — the extension-office boundary stays in view.
 */

import {
  buildResidentialGardenGuide,
  type GardenGuideSoil,
} from "@/lib/property/residentialGardenGuide";

const card = { background: "#fff", border: "1px solid #E5E0D5", borderRadius: 14, padding: "16px 18px" } as const;

export function ResidentialGardenTab({ state, soil }: { state: string | null; soil: GardenGuideSoil | null }) {
  const guide = buildResidentialGardenGuide({ state, soil });
  return (
    <>
      <section style={{ ...card, display: "grid", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#2F6D12" }}>
          What grows well in this yard
        </span>
        <p style={{ margin: 0, color: "#3d4655", fontSize: 13.5, lineHeight: 1.65 }}>{guide.headline}</p>
        {guide.soilNotes.map((note) => (
          <p key={note} style={{ margin: 0, color: "#4d596d", fontSize: 12.5, lineHeight: 1.6 }}>{note}</p>
        ))}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
        <section style={{ ...card, display: "grid", gap: 8, alignContent: "start" }}>
          <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#8F6E1F" }}>
            Garden picks for this soil
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {guide.gardenPicks.map((pick) => (
              <li key={pick.name} style={{ color: "#3d4655", fontSize: 12.5, lineHeight: 1.6 }}>
                <strong style={{ color: "#1C2B45" }}>{pick.name}</strong> — {pick.why}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ ...card, display: "grid", gap: 8, alignContent: "start" }}>
          <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: ".14em", textTransform: "uppercase", color: "#1C4532" }}>
            Native plants for this region
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
            {guide.nativePicks.map((pick) => (
              <li key={pick.name} style={{ color: "#3d4655", fontSize: 12.5, lineHeight: 1.6 }}>
                <strong style={{ color: "#1C2B45" }}>{pick.name}</strong> — {pick.why}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p style={{ margin: 0, color: "#6B7280", fontSize: 11.5, lineHeight: 1.6 }}>{guide.boundary}</p>
    </>
  );
}
