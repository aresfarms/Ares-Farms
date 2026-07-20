import Link from "next/link";

import { buildPropertyAnalysisHref } from "@/lib/property/propertyAnalysisHref";
import { classifyPropertyProfile, type PropertyProfileId } from "@/lib/property/propertyProfile";
import type { PublicSafeProperty } from "@/lib/property/propertyTypes";

/**
 * PropertyShowcaseRail — the horizontally scrolling "multitude of properties"
 * on the homepage (founder feedback 2026-07-16: the front door must SHOW real
 * inventory, not just the tour map's single weekly stop).
 *
 * Public-safe by construction: renders only the PublicSafeProperty projection
 * (bands + town/county/state — no exact address, no coordinates). Every card
 * links into the /discover evaluation flow for that property. Rotation is
 * seeded by ISO week so the rail is a living shelf, not a fixed list.
 *
 * Copy discipline (fair housing, verify:brief-copy): type, place, bands,
 * source, and vintage stamp — no characterizations.
 */

const SOURCE_LABELS: Record<string, string> = {
  hud: "HUD Home Store",
  treasury: "U.S. Treasury auctions",
  "gsa-realestate": "GSA realestatesales.gov",
  usda: "USDA resales portal",
};

function sourceLabel(sourceId: string): string {
  return SOURCE_LABELS[sourceId] ?? "Government listing source";
}

/** Deterministic week-seeded rotation — same shelf all week, new shelf next week. */
function rotate<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items;
  const offset = ((Math.trunc(seed) % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function PropertyShowcaseRail({
  inventoryByState,
  weekSeed,
  limit = 24,
  layout = "shelf",
  accent = "#0f766e",
}: {
  inventoryByState: Record<string, PublicSafeProperty[]>;
  weekSeed: number;
  limit?: number;
  /** "shelf" = horizontal scroll (default); "column" = vertical stack that
      fills the dead space beside the map (founder direction 2026-07-18). */
  layout?: "shelf" | "column";
  /** Lane accent color (founder direction 2026-07-18: each module wears its
      own color). Defaults to the shared teal for un-themed surfaces. */
  accent?: string;
}) {
  const isColumn = layout === "column";
  // Interleave by PROPERTY KIND first (founder direction 2026-07-17: the
  // shelf shows a variety, not just HUD homes), then by state within each
  // kind so the rail still sweeps the country. Small groups (commercial,
  // land) surface up front every week instead of drowning under the
  // hundreds of homes.
  const current: PublicSafeProperty[] = [];
  for (const state of rotate(Object.keys(inventoryByState).sort(), weekSeed)) {
    for (const property of inventoryByState[state] ?? []) {
      if (property.isCurrent) current.push(property);
    }
  }
  const byProfile = new Map<PropertyProfileId, PublicSafeProperty[]>();
  for (const property of current) {
    const profileId = classifyPropertyProfile({ propertyType: property.propertyType }).id;
    const bucket = byProfile.get(profileId) ?? [];
    bucket.push(property);
    byProfile.set(profileId, bucket);
  }
  const profileQueues = [...byProfile.entries()]
    .sort(([, a], [, b]) => a.length - b.length) // scarce kinds lead
    .map(([, bucket]) => rotate(bucket, weekSeed));
  const picks: PublicSafeProperty[] = [];
  let drained = false;
  while (picks.length < limit && !drained) {
    drained = true;
    for (const queue of profileQueues) {
      const next = queue.shift();
      if (!next) continue;
      drained = false;
      picks.push(next);
      if (picks.length >= limit) break;
    }
  }
  if (picks.length === 0) return null;

  // "Ledger updated" freshness stamp (founder direction 2026-07-20): the return-
  // visit hook, built from the real provenance dates we already carry — the most
  // recently-updated listing on the shelf. Honest by construction; never faked.
  const ledgerAsOf =
    picks
      .map((p) => p.asOf)
      .filter((d): d is string => Boolean(d))
      .map((d) => d.slice(0, 10))
      .sort()
      .pop() ?? null;

  return (
    <section aria-label="Current government-listed properties" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
            On the shelf this week
          </span>
          <strong style={{ fontSize: isColumn ? 17 : 22, color: "#101a2b", lineHeight: 1.15 }}>
            Real listings, straight from government sources
          </strong>
          {ledgerAsOf && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#5e7a86", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 0 3px rgba(22,163,74,0.18)" }} />
              Ledger updated · {ledgerAsOf} — check back for what&apos;s new
            </span>
          )}
        </div>
        <Link href="/explore" style={{ fontSize: 13.5, fontWeight: 700, color: accent }}>
          Browse all inventory →
        </Link>
      </div>
      <div
        style={
          isColumn
            ? { display: "grid", gridTemplateColumns: "1fr", gap: 10 }
            : {
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "minmax(230px, 260px)",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
                scrollSnapType: "x proximity",
              }
        }
      >
        {picks.map((property) => {
          const title = `${property.propertyType[0]?.toUpperCase() ?? ""}${property.propertyType.slice(1)} in ${property.town}`;
          const href = buildPropertyAnalysisHref({
            propertyId: property.id,
            title,
            location: `${property.town}${property.county && property.county !== "Unknown" ? `, ${property.county} County` : ""}, ${property.state}`,
            propertyType: property.propertyType,
            priceLabel: property.priceBand,
            vintage: property.vintageStamp,
            sourceLabel: sourceLabel(property.sourceId),
            pathways: [],
            town: property.town,
            county: property.county,
            state: property.state,
            sourceId: property.sourceId,
            currentLabel: "Current government listing",
          });
          return (
            <Link
              key={property.id}
              href={href}
              style={{
                display: "grid",
                gap: 6,
                alignContent: "start",
                border: "1px solid #d7deea",
                borderRadius: 14,
                background: "#ffffff",
                padding: "14px 15px",
                textDecoration: "none",
                scrollSnapAlign: isColumn ? undefined : "start",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: accent }}>
                {property.state} · {sourceLabel(property.sourceId)}
              </span>
              <strong style={{ fontSize: 15.5, color: "#101a2b", lineHeight: 1.25 }}>{title}</strong>
              <span style={{ fontSize: 12.7, color: "#4d596d", lineHeight: 1.5 }}>
                {property.priceBand}
                {property.acreageBand ? ` · ${property.acreageBand}` : ""}
              </span>
              <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>
                Current listing{property.asOf ? ` · as of ${property.asOf.slice(0, 10)}` : ""}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: accent }}>
                See the place brief →
              </span>
            </Link>
          );
        })}
      </div>
      <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>
        Location shown to the town level here; the full brief opens with verified place facts and
        sources. Listings and prices live on the source sites and change as bid periods reset.
      </span>
      {/* Quiet roadmap nod (founder direction 2026-07-17) — states nothing,
          promises no dates, pretends no inventory. */}
      <span style={{ fontSize: 11.5, fontStyle: "italic", color: "#9aa6b6" }}>
        More territories being charted.
      </span>
    </section>
  );
}
