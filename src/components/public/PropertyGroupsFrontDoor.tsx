import Link from "next/link";

import type { FrontDoorGroup } from "@/lib/property/propertyFrontDoor";

/**
 * PropertyGroupsFrontDoor — "start with the kind of property you're looking
 * for" (founder direction 2026-07-17). One cohesive front door over the
 * canonical property-profile taxonomy: each group card carries its real
 * count, a few live listings, and a browse link. Groups with no inventory do
 * not render — nothing on the page ever pretends.
 *
 * Copy discipline (fair housing, verify:brief-copy): kinds, places, counts,
 * and prices — no characterizations.
 */

export function PropertyGroupsFrontDoor({
  groups,
  compact = false,
}: {
  groups: FrontDoorGroup[];
  /** Side-panel mode (beside the map): a light "Live listings" label instead
      of the full front-door heading, which was written for a full-width page
      (founder direction 2026-07-18). */
  compact?: boolean;
}) {
  if (groups.length === 0) return null;

  return (
    <section aria-label="Property groups" style={{ display: "grid", gap: 14 }}>
      {compact ? (
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e" }}>
          Live listings
        </span>
      ) : (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0f766e" }}>
            The front door
          </span>
          <strong style={{ fontSize: 24, color: "#101a2b", lineHeight: 1.15 }}>
            Start with the kind of property you&apos;re looking for
          </strong>
          <span style={{ fontSize: 13.5, color: "#4d596d", lineHeight: 1.55 }}>
            Every kind gets its own questions, its own costs, and its own chart — the platform reads
            the property first, and the analysis follows its shape.
          </span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
        {groups.map((group) => (
          <div
            key={group.profileId}
            style={{
              display: "grid",
              gap: 10,
              alignContent: "start",
              border: "1px solid #d7deea",
              borderRadius: 16,
              background: "#ffffff",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <strong style={{ fontSize: 17, color: "#101a2b" }}>{group.label}</strong>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#0f766e", whiteSpace: "nowrap" }}>
                {group.count.toLocaleString("en-US")} tracked
              </span>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {group.featured.map((listing) => (
                <Link
                  key={listing.id}
                  href={listing.href}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "baseline",
                    fontSize: 12.8,
                    textDecoration: "none",
                    borderBottom: "1px dashed #e4e9f2",
                    paddingBottom: 6,
                  }}
                >
                  <span style={{ color: "#101a2b", fontWeight: 600, lineHeight: 1.4 }}>{listing.title}</span>
                  <span style={{ color: "#4d596d", whiteSpace: "nowrap" }}>{listing.priceLabel}</span>
                </Link>
              ))}
            </div>
            <Link href={group.browseHref} style={{ fontSize: 12.8, fontWeight: 700, color: "#0f766e", textDecoration: "none" }}>
              See all {group.label.toLowerCase()} →
            </Link>
          </div>
        ))}
      </div>
      {!compact && (
        <span style={{ fontSize: 11.5, fontStyle: "italic", color: "#9aa6b6" }}>
          More territories being charted.
        </span>
      )}
    </section>
  );
}
