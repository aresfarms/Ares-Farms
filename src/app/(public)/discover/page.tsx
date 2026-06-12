import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";
import { FurlongNavigator } from "@/components/navigator/FurlongNavigator";
import { PlaceFirstDiscovery } from "@/components/discovery/PlaceFirstDiscovery";
import { discoveryPrimary, BROWSE_HREF } from "@/lib/discovery/discoveryConfig";
import { resolveDiscoveryFlow, isPlaceFirstFlow } from "@/lib/discovery/discoveryFlow";

/**
 * /discover — the discovery front door. The journey is chosen UP FRONT by the
 * flow-state resolver (resolveDiscoveryFlow) BEFORE anything renders:
 *   - place-facts / opportunity-zone / property-discovery → PLACE-FIRST card
 *     (location first; persona only later);
 *   - possibilities-persona (default) → the conversational persona interview.
 *
 * The generic persona intake is NEVER the default when the route/query/entrypoint
 * signals place/property facts. Browse is preserved. Public Alpha PENDING.
 *
 * Governance basis: Master Volume VI separates Property Discovery & Canonical
 * Property Governance from general customer/revenue intelligence.
 */

export const metadata: Metadata = {
  title: "What are your possibilities? | Furlong",
  description:
    "Start with a place or with what you're trying to accomplish. Verified place-facts up front; " +
    "possibilities mapped from your interests. Anonymous, no account, nothing sold.",
};

type SP = Record<string, string | string[] | undefined>;

/** Render the journey chosen by the resolver. Exported for the path entrypoints. */
export function DiscoverSurface({ route, query }: { route: string; query: SP }) {
  const flow = resolveDiscoveryFlow({ route, query });

  if (isPlaceFirstFlow(flow)) {
    return (
      <main style={{ display: "grid", gap: 28, padding: "40px 20px", maxWidth: 980, margin: "0 auto" }}>
        <PlaceFirstDiscovery flow={flow} />
        <Disclosures />
      </main>
    );
  }

  // Default — Furlong Navigator: the governed conversational front door.
  // One open question, one free-text box, the spine walked in the visitor's
  // own words. No chip grid, no persona picker (spec 2026-06-11 §3).
  const primary = discoveryPrimary();
  return (
    <main style={{ display: "grid", gap: 28, padding: "40px 20px", maxWidth: 980, margin: "0 auto" }}>
      <header style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#0f766e" }}>
          Furlong Navigator
        </span>
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, color: "#101a2b", maxWidth: 720 }}>
          Start your journey here.
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#5d687a", lineHeight: 1.55, maxWidth: 720 }}>
          Bring a property, a goal, or nothing at all — the Navigator helps you discover what an asset can
          realistically become, with evidence, honest No's, and pathways you didn't know existed.
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: "#9aa6b6" }}>
          Looking up a specific place instead? <Link href="/discover?mode=place-facts" style={{ color: "#854F0B", textDecoration: "underline", fontWeight: 700 }}>Check a location's place-facts →</Link>
          {!primary && <> · <Link href={BROWSE_HREF} style={{ color: "#185FA5", textDecoration: "underline", fontWeight: 700 }}>Browse properties →</Link></>}
        </p>
      </header>

      <FurlongNavigator />

      <Disclosures />
    </main>
  );
}

export default async function DiscoverPage({ searchParams }: { searchParams?: Promise<SP> }) {
  const query = searchParams ? await searchParams : {};
  return <DiscoverSurface route="/discover" query={query} />;
}
