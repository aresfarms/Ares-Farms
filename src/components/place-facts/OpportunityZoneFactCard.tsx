import type { OzPlaceFactSnapshot } from "@/lib/place-facts/opportunityZoneSnapshot";
import { OZ_SNAPSHOT_PROVENANCE } from "@/lib/place-facts/opportunityZoneSnapshot";

/**
 * Opportunity Zone place-fact card.
 *
 * Renders ONE factual government designation for a place. Framing is a strict
 * place-fact: "this location is in a designated Opportunity Zone tract" — never
 * eligibility, qualification, approval, or a guaranteed tax benefit. Whether a
 * given buyer benefits is a separate buyer-qualification question handled
 * elsewhere; this card states only what the published government boundary says.
 *
 * Copy is held to the content-claims policy (no approval/eligibility language);
 * the OZ surface test runs this card's copy through evaluateContentClaims.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function OpportunityZoneFactCard({ fact }: { fact: OzPlaceFactSnapshot }) {
  const designated = fact.designated;
  return (
    <article
      aria-label={`Opportunity Zone place-fact for ${fact.address}`}
      style={{
        border: "1px solid #d7deea",
        borderRadius: 12,
        background: "#ffffff",
        padding: "18px 20px",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 16, color: "#162033" }}>{fact.address}</strong>
        <span style={{ fontSize: 13, color: "#7a8aa0" }}>
          Census tract {fact.geoid}
        </span>
      </div>

      {/* The designation badge — the factual government place-fact. */}
      <span
        style={{
          alignSelf: "start",
          fontSize: 12,
          fontWeight: 700,
          borderRadius: 999,
          padding: "3px 12px",
          ...(designated
            ? { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" }
            : { color: "#475569", background: "#f1f5f9", border: "1px solid #cbd5e1" }),
        }}
      >
        {designated
          ? "Designated Opportunity Zone tract"
          : "Not in a designated Opportunity Zone tract"}
      </span>

      <p style={{ margin: 0, fontSize: 14, ...muted }}>
        {designated ? (
          <>
            This location is in <strong>{fact.tractName}</strong> ({fact.stateName}),
            a census tract <strong>designated as a Qualified Opportunity Zone</strong> under
            IRC §1400Z-1{fact.rural ? ", flagged rural by HUD" : ""}. This is a published
            government designation of the place — it is not eligibility, qualification, or
            a guaranteed tax benefit for any person.
          </>
        ) : (
          <>
            This location is in <strong>{fact.tractName}</strong> ({fact.stateName}),
            which is <strong>not</strong> on the designated Qualified Opportunity Zone list
            (IRC §1400Z-1). This states only what the published government boundary says
            about the place.
          </>
        )}
      </p>

      <div style={{ fontSize: 12, color: "#7a8aa0" }}>
        Source: HUD GIS / Treasury (IRC §1400Z-1) + U.S. Census geocoder · public domain ·
        as of {OZ_SNAPSHOT_PROVENANCE.asOf}
      </div>
    </article>
  );
}
