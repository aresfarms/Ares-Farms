import { OpportunityZoneFactCard } from "@/components/place-facts/OpportunityZoneFactCard";
import { HubzoneFactCard } from "@/components/place-facts/HubzoneFactCard";
import {
  OZ_PLACE_FACTS,
  OZ_SNAPSHOT_PROVENANCE,
} from "@/lib/place-facts/opportunityZoneSnapshot";
import {
  HUBZONE_PLACE_FACTS,
  HUBZONE_SNAPSHOT_PROVENANCE,
  isCurrentAsOf,
} from "@/lib/place-facts/hubzoneSnapshot";
import { canonicalPlaceAuthority } from "@/lib/platform/authorities/place";

/**
 * Place-Facts — Opportunity Zones (public reference surface).
 *
 * Renders verified, public-domain government place-facts: whether a location's
 * census tract is a designated Qualified Opportunity Zone (IRC §1400Z-1). These
 * are FACTS about places, framed strictly as place-facts — never eligibility,
 * qualification, approval, or a tax-benefit guarantee.
 *
 * Governance: the request-time LIVE lookup is gated behind Module 22/23
 * (placeFactActivation.ts); this surface renders the FROZEN, verified snapshot
 * (published public-domain designation with provenance + as-of date), which the
 * recorded decision permits to render without flipping the live source on.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export default function PlaceFactsPage() {
  const designatedCount = OZ_PLACE_FACTS.filter((f) => f.designated).length;
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gap: 24 }}>
      <header style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Place-facts — public government reference
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: -0.02, lineHeight: 1.14 }}>
          Government place-facts
        </h1>
        <p style={{ margin: 0, fontSize: 16, ...muted, maxWidth: 680 }}>
          Verified, public-domain government boundary facts about a location — Opportunity Zones
          and SBA HUBZones. These describe the <strong>place</strong>, never a person or business:
          not eligibility, qualification, certification, approval, or a guarantee.
        </p>
      </header>

      <section aria-label="Opportunity Zone place-facts" style={{ display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: -0.01 }}>
          Opportunity Zone designations
        </h2>
        <p style={{ margin: 0, fontSize: 15, ...muted, maxWidth: 680 }}>
          Whether a location&apos;s census tract is a <strong>designated Qualified Opportunity
          Zone</strong> under IRC §1400Z-1 — a published government fact about the place.
          This is <strong>not</strong> eligibility, qualification, approval, or a guaranteed
          tax benefit for any person; whether a buyer benefits is a separate question.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#7a8aa0" }}>
          {OZ_SNAPSHOT_PROVENANCE.designatedTractCount.toLocaleString("en-US")} designated tracts ·
          source: {canonicalPlaceAuthority.opportunityZone.sourceName} ({OZ_SNAPSHOT_PROVENANCE.license}) ·
          as of {OZ_SNAPSHOT_PROVENANCE.asOf}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#5d687a" }}>
          {OZ_PLACE_FACTS.length} verified examples · {designatedCount} designated,{" "}
          {OZ_PLACE_FACTS.length - designatedCount} not designated.
        </p>
        {OZ_PLACE_FACTS.map((fact) => (
          <OpportunityZoneFactCard key={fact.geoid} fact={fact} />
        ))}
      </section>

      <section aria-label="HUBZone place-facts" style={{ display: "grid", gap: 14, borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
        <h2 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, letterSpacing: -0.01 }}>
          HUBZone designations
        </h2>
        <p style={{ margin: 0, fontSize: 15, ...muted, maxWidth: 680 }}>
          Whether a location is in a <strong>designated SBA HUBZone</strong> (Historically
          Underutilized Business Zone). A place-fact about the location — <strong>not</strong>{" "}
          eligibility, certification, or a guarantee for any business; HUBZone certification
          depends on a business meeting SBA criteria. HUBZone areas change: each fact shows its
          effective date and any expiration, and expired designations are labeled historical.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#7a8aa0" }}>
          source: {canonicalPlaceAuthority.hubzone.sourceName} ({HUBZONE_SNAPSHOT_PROVENANCE.license}) ·
          dataset effective {HUBZONE_SNAPSHOT_PROVENANCE.datasetEffective} · snapshot as of{" "}
          {HUBZONE_SNAPSHOT_PROVENANCE.asOf} · verify current at {HUBZONE_SNAPSHOT_PROVENANCE.authoritativeLiveSource}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#5d687a" }}>
          {HUBZONE_PLACE_FACTS.length} verified examples ·{" "}
          {HUBZONE_PLACE_FACTS.filter((f) => isCurrentAsOf(f)).length} currently designated,{" "}
          {HUBZONE_PLACE_FACTS.filter((f) => f.designated && !isCurrentAsOf(f)).length} expired/historical,{" "}
          {HUBZONE_PLACE_FACTS.filter((f) => !f.designated).length} not designated.
        </p>
        {HUBZONE_PLACE_FACTS.map((fact) => (
          <HubzoneFactCard key={`${fact.geoid ?? "none"}-${fact.address}`} fact={fact} />
        ))}
      </section>

      <footer style={{ fontSize: 12, color: "#7a8aa0", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
        Designation data is dated government snapshots resolved through the U.S. Census geocoder
        and the HUD OZ / SBA HUBZone layers. Request-time live lookups are pending operator
        activation review (Module 22/23). Place-facts describe places, not people or businesses;
        HUBZone designations change — verify current status with SBA.
      </footer>
    </main>
  );
}
