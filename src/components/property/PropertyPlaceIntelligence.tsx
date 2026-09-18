import type {
  BriefFactLine,
  PropertyBriefIntelligence,
} from "@/lib/property/propertyBriefIntelligence";

/**
 * PropertyPlaceIntelligence — the free "Place Brief" intelligence section
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15; presentation per the approved
 * redesign memo 2026-07-16).
 *
 * Server component; renders under the evaluation workspace:
 *   1. "Living here" — amenity DISTANCES as a scannable strip (eye-tracking:
 *      distances beat prose; endowment framing stays activity-based and
 *      fair-housing-safe: distances, counts, sources — never characterizations).
 *   2. "Buying process, decoded" — the sale-mechanics explainer.
 *   3. The trust stage: verified facts and honest unknowns SIDE BY SIDE — the
 *      pairing is the product's differentiation, so it renders as one section.
 *   4. The prose financing-pathways line (replaces pathway chips).
 *
 * Label discipline (redesign rule): `Verified` = sourced fact with provenance;
 * `Unknown` = named gap with the official way to resolve it. Interpretation
 * (`Plain-language read`) lives in the workspace Answer card, never here.
 *
 * Copy discipline (binding, fair-housing): facts about the place and its
 * documents only — no eligibility or approval language; no neighborhood
 * "vibe", no safety implication, no family-targeted persuasion, no
 * demographic steering. Distances, sources, and official directories only.
 * Enforced by `npm run verify:brief-copy`.
 */

const toneColor: Record<BriefFactLine["tone"], string> = {
  positive: "#0f766e",
  neutral: "#4d596d",
  caution: "#854f0b",
};

const sectionCard: React.CSSProperties = {
  display: "grid",
  gap: 10,
  border: "1px solid #dde6f0",
  borderRadius: 18,
  background: "linear-gradient(180deg, #fcfdff, #f7fbff)",
  padding: "16px 16px 14px",
};

const miniLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#5d687a",
};

const badgeBase: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderRadius: 999,
  padding: "2px 8px",
  justifySelf: "start",
};

const verifiedBadge: React.CSSProperties = {
  ...badgeBase,
  color: "#0f766e",
  background: "#e4efed",
  border: "1px solid #bfe4db",
};

const unknownBadge: React.CSSProperties = {
  ...badgeBase,
  color: "#854f0b",
  background: "#fdf6e7",
  border: "1px solid #ead8aa",
};

export function PropertyPlaceIntelligence({
  intelligence,
}: {
  intelligence: PropertyBriefIntelligence;
}) {
  const { verifiedFacts, unknowns, mechanics, pathwaysProse, livingHere } = intelligence;
  if (verifiedFacts.length === 0 && unknowns.length === 0 && !mechanics) {
    return null;
  }

  // The strip renders the same distances the amenity sentence carries, so the
  // sentence card is export-only when the strip is present (each fact renders
  // once on screen — redesign rule).
  const factCards = livingHere
    ? verifiedFacts.filter((fact) => fact.label !== "Daily life nearby")
    : verifiedFacts;
  const amenityProvenance = verifiedFacts.find((fact) => fact.label === "Daily life nearby")?.provenance;

  return (
    <section
      data-testid="place-intelligence"
      aria-label="Place intelligence"
      style={{ display: "grid", gap: 16 }}
    >
      {livingHere && livingHere.items.length > 0 && (
        <div style={sectionCard} data-testid="place-intelligence-living">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>Living here</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>
              Daily life, in distances
            </strong>
            <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>
              What&apos;s mapped within ~{livingHere.radiusMiles} miles of this address — distances
              and counts, so you can judge the drive for yourself.
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            }}
          >
            {livingHere.items.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  gap: 3,
                  border: "1px solid #e6ebf2",
                  borderRadius: 12,
                  background: "#fff",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#5d687a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#162033", lineHeight: 1.4 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>
            {amenityProvenance ?? livingHere.attribution}
          </span>
        </div>
      )}

      {mechanics && (
        <div style={sectionCard} data-testid="place-intelligence-mechanics">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>Buying process, decoded</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>{mechanics.heading}</strong>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mechanics.paragraphs.map((paragraph, index) => (
              <div key={paragraph.slice(0, 40)} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "start" }}>
                <span
                  aria-hidden
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#0f766e",
                    border: "1px solid #bfe4db",
                    borderRadius: 999,
                    width: 22,
                    height: 22,
                    display: "grid",
                    placeItems: "center",
                    marginTop: 1,
                  }}
                >
                  {index + 1}
                </span>
                <div style={{ display: "grid", gap: 2 }}>
                  <strong style={{ fontSize: 13.5, color: "#162033", lineHeight: 1.4 }}>
                    {mechanics.stepTitles[index] ?? ""}
                  </strong>
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 11.5, color: "#7a8aa0", listStyle: "none" }}>
                      The details ▸
                    </summary>
                    <p style={{ margin: "6px 0 0", fontSize: 12.7, color: "#3b475a", lineHeight: 1.65 }}>
                      {paragraph}
                    </p>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(factCards.length > 0 || unknowns.length > 0) && (
        <div style={sectionCard} data-testid="place-intelligence-trust">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>The receipts</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>
              What we can prove — and what nobody can tell you yet
            </strong>
            <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>
              Most listing pages show what was advertised. This brief separates what is sourced,
              what is missing, and what you need to verify before acting. Nothing here is
              eligibility, qualification, or approval for any person.
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              alignItems: "start",
            }}
          >
            {factCards.length > 0 && (
              <div style={{ display: "grid", gap: 8 }} data-testid="place-intelligence-verified">
                {factCards.map((fact) => (
                  <div
                    key={fact.label}
                    style={{
                      display: "grid",
                      gap: 2,
                      border: "1px solid #e6ebf2",
                      borderRadius: 12,
                      background: "#fff",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: toneColor[fact.tone], textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {fact.label}
                      </span>
                      <span style={verifiedBadge}>Verified</span>
                    </div>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "#162033", lineHeight: 1.4 }}>{fact.value}</span>
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: 11.5, color: "#7a8aa0", listStyle: "none" }}>
                        What this means + source ▸
                      </summary>
                      <div style={{ display: "grid", gap: 4, paddingTop: 6 }}>
                        <span style={{ fontSize: 12.7, color: "#3b475a", lineHeight: 1.6 }}>{fact.text}</span>
                        <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>{fact.provenance}</span>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
            {unknowns.length > 0 && (
              <div style={{ display: "grid", gap: 8 }} data-testid="place-intelligence-unknowns">
                {unknowns.map((unknown) => (
                  <div
                    key={unknown.label}
                    style={{
                      display: "grid",
                      gap: 2,
                      border: "1px dashed #d9c8a6",
                      borderRadius: 12,
                      background: "#fffdf7",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#854f0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {unknown.label}
                      </span>
                      <span style={unknownBadge}>Unknown</span>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#162033", lineHeight: 1.4 }}>
                      Find out: {unknown.pointer}
                    </span>
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: 11.5, color: "#a08147", listStyle: "none" }}>
                        How exactly ▸
                      </summary>
                      <span style={{ display: "block", paddingTop: 6, fontSize: 12.7, color: "#3b475a", lineHeight: 1.6 }}>
                        {unknown.howToFind}
                      </span>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {pathwaysProse && (
        <div style={sectionCard} data-testid="place-intelligence-pathways">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>How people typically pay for a property like this</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "#3b475a", lineHeight: 1.65 }}>
            {pathwaysProse}
          </p>
        </div>
      )}
    </section>
  );
}
