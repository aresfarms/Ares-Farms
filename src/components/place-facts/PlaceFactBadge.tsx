/**
 * PlaceFactBadge — reusable place-fact attribute badge (CORE / shared substrate).
 *
 * A small, presentational badge that states a government PLACE-FACT about a
 * location (e.g. "Designated Opportunity Zone tract"), with an as-of date and an
 * expandable plain-language disclaimer. Built generic so every place-fact —
 * Opportunity Zones first, HUBZone next, future overlays after — reuses the SAME
 * UI with no rework.
 *
 * Pure props only: no domain/source imports, so it stays core-shared substrate
 * (a divestible unit may import it; it imports no unit). It states a fact about a
 * PLACE; it never asserts anything about a PERSON (no eligibility/approval copy).
 */

export interface PlaceFactBadgeProps {
  /** Short factual label, e.g. "Designated Opportunity Zone tract". */
  label: string;
  /** ISO-ish as-of date the underlying snapshot was resolved (e.g. "2026-06-09"). */
  asOf: string;
  /** Plain-language place-fact disclaimer (about the LOCATION, never a person). */
  disclaimer: string;
  /** Source citation line (public-domain attribution). */
  sourceCitation: string;
  /** Optional coarse geography note (e.g. tract id) — never an exact address. */
  geographyNote?: string;
  /**
   * Visual tone. "affirmative" (default) = active/current designation (green).
   * "historical" = expired/no-longer-current (amber) so the color never implies
   * a lapsed designation is still in force — the label says so AND looks so.
   */
  tone?: "affirmative" | "historical";
}

const pillBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  alignSelf: "start",
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 999,
  padding: "3px 12px",
} as const;

const TONE = {
  affirmative: { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" },
  historical: { color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74" },
} as const;

export function PlaceFactBadge({
  label,
  asOf,
  disclaimer,
  sourceCitation,
  geographyNote,
  tone = "affirmative",
}: PlaceFactBadgeProps) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ ...pillBase, ...TONE[tone] }} aria-label={`${label}, as of ${asOf}`}>
        {label} · as of {asOf} · subject to change
      </span>
      <details style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.55 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#3b475a" }}>
          What this means
        </summary>
        <p style={{ margin: "6px 0 0" }}>{disclaimer}</p>
        {geographyNote && (
          <p style={{ margin: "4px 0 0", color: "#7a8aa0" }}>{geographyNote}</p>
        )}
        <p style={{ margin: "4px 0 0", color: "#7a8aa0" }}>{sourceCitation}</p>
      </details>
    </div>
  );
}
