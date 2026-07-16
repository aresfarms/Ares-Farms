import type {
  BriefFactLine,
  PropertyBriefIntelligence,
} from "@/lib/property/propertyBriefIntelligence";

/**
 * PropertyPlaceIntelligence — the free "Place Brief" intelligence section
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15, build-order step 1).
 *
 * Server component; renders three governed blocks under the evaluation
 * workspace:
 *   1. "What we can verify about this place" — snapshot-backed place FACTS with
 *      per-line provenance (flood, historic, OZ/HUBZone/NMTC designations).
 *   2. "How buying from this source actually works" — the sale-mechanics
 *      explainer for HUD/USDA/GSA dispositions.
 *   3. "What we can't verify yet — and how you'd find out" — the honest-unknowns
 *      block; every unknown names the official way to resolve it.
 * Plus the prose financing-pathways line that REPLACES the pathway chips
 * (founder decision 2026-07-15): same information, narrative form, no dead UI.
 *
 * Copy discipline (binding): facts about the place and its documents only —
 * no eligibility, qualification, or approval language; no characterizations of
 * neighborhoods or people (amenity-facts pattern).
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

export function PropertyPlaceIntelligence({
  intelligence,
}: {
  intelligence: PropertyBriefIntelligence;
}) {
  const { verifiedFacts, unknowns, mechanics, pathwaysProse } = intelligence;
  if (verifiedFacts.length === 0 && unknowns.length === 0 && !mechanics) {
    return null;
  }

  return (
    <section
      data-testid="place-intelligence"
      aria-label="Place intelligence"
      style={{ display: "grid", gap: 16 }}
    >
      {verifiedFacts.length > 0 && (
        <div style={sectionCard} data-testid="place-intelligence-verified">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>Place facts we can verify now</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>
              What our records already show about this location
            </strong>
            <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>
              Facts about the place from frozen government-data snapshots, each with its source and
              date. These are designations and map facts — not eligibility, qualification, or
              approval for any person.
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {verifiedFacts.map((fact) => (
              <div
                key={fact.label}
                style={{
                  display: "grid",
                  gap: 4,
                  border: "1px solid #e6ebf2",
                  borderRadius: 12,
                  background: "#fff",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: toneColor[fact.tone] }}>
                  {fact.label}
                </span>
                <span style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.6 }}>{fact.text}</span>
                <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>
                  {fact.provenance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mechanics && (
        <div style={sectionCard} data-testid="place-intelligence-mechanics">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>Buying process, decoded</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>{mechanics.heading}</strong>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mechanics.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.65 }}
              >
                {paragraph}
              </p>
            ))}
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

      {unknowns.length > 0 && (
        <div style={sectionCard} data-testid="place-intelligence-unknowns">
          <div style={{ display: "grid", gap: 4 }}>
            <span style={miniLabel}>Honest unknowns</span>
            <strong style={{ fontSize: 18, color: "#162033" }}>
              What we can&apos;t verify yet — and how you&apos;d find out
            </strong>
            <span style={{ fontSize: 12.5, color: "#5d687a", lineHeight: 1.55 }}>
              No listing page tells you what it doesn&apos;t know. These are the open questions for
              this property and the official way to answer each one.
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {unknowns.map((unknown) => (
              <div
                key={unknown.label}
                style={{
                  display: "grid",
                  gap: 3,
                  border: "1px dashed #d9c8a6",
                  borderRadius: 12,
                  background: "#fffdf7",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: "#854f0b" }}>
                  {unknown.label}
                </span>
                <span style={{ fontSize: 12.7, color: "#3b475a", lineHeight: 1.6 }}>
                  {unknown.howToFind}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
