import {
  type HubzoneFactSnapshot,
  HUBZONE_SNAPSHOT_PROVENANCE,
  isCurrentAsOf,
} from "@/lib/place-facts/hubzoneSnapshot";

/**
 * HUBZone place-fact card (operator review surface).
 *
 * Renders one SBA HUBZone designation as a strict place-fact about the LOCATION,
 * with type + effective date + (when present) expiration. Freshness honesty:
 * an expired designation is labeled "historical / expired — verify current
 * status with SBA", never shown as currently designated. Never asserts anything
 * about a business (no eligibility/certification/guarantee copy).
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export function HubzoneFactCard({
  fact,
  now = new Date(),
}: {
  fact: HubzoneFactSnapshot;
  now?: Date;
}) {
  const current = isCurrentAsOf(fact, now);
  const expired = fact.designated && !current;

  const tone = !fact.designated
    ? { color: "#475569", background: "#f1f5f9", border: "1px solid #cbd5e1" }
    : expired
      ? { color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74" }
      : { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" };

  const badge = !fact.designated
    ? "Not in a designated HUBZone"
    : expired
      ? `HUBZone (${fact.hubzoneType}) — historical / expired`
      : `Designated HUBZone (${fact.hubzoneType})`;

  return (
    <article
      aria-label={`HUBZone place-fact for ${fact.address}`}
      style={{ border: "1px solid #d7deea", borderRadius: 12, background: "#ffffff", padding: "18px 20px", display: "grid", gap: 10 }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 16, color: "#162033" }}>{fact.address}</strong>
        {fact.geoid && <span style={{ fontSize: 13, color: "#7a8aa0" }}>tract/area {fact.geoid}</span>}
      </div>

      <span style={{ alignSelf: "start", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 12px", ...tone }}>
        {badge}
      </span>

      <p style={{ margin: 0, fontSize: 14, ...muted }}>
        {!fact.designated ? (
          <>
            This location is <strong>not</strong> in any designated SBA HUBZone per the
            published designation layer. This states only what the government boundary says
            about the place.
          </>
        ) : expired ? (
          <>
            This location is in <strong>{fact.area}</strong> — a {fact.hubzoneType} whose
            HUBZone designation was effective {fact.effective} and{" "}
            <strong>expired {fact.expiration}</strong>. It is shown as{" "}
            <strong>historical / expired</strong> — verify current status with SBA. This is a
            place-fact about the location — not eligibility, certification, or a guarantee for
            any business.
          </>
        ) : (
          <>
            This location is in <strong>{fact.area}</strong> — a designated{" "}
            <strong>{fact.hubzoneType}</strong> HUBZone (effective {fact.effective}
            {fact.expiration ? `, designation expires ${fact.expiration} (time-limited)` : ""}).
            This is a place-fact about the location — it is not eligibility, certification, or a
            guarantee for any business. HUBZone certification depends on a business meeting SBA
            criteria.
          </>
        )}
      </p>

      <div style={{ fontSize: 12, color: "#7a8aa0" }}>
        Source: SBA HUBZone (effective {HUBZONE_SNAPSHOT_PROVENANCE.datasetEffective}) + U.S.
        Census geocoder · public domain · verify current designation at{" "}
        {HUBZONE_SNAPSHOT_PROVENANCE.authoritativeLiveSource} · snapshot as of{" "}
        {HUBZONE_SNAPSHOT_PROVENANCE.asOf}
      </div>
    </article>
  );
}
