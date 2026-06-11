import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";
import { DiscoveryEngine } from "@/components/discovery/DiscoveryEngine";
import { guidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import { discoveryPrimary, BROWSE_HREF } from "@/lib/discovery/discoveryConfig";

/**
 * /discover — the Possibility Discovery Engine (Caitlin's vision, 2026-06-11).
 *
 * The guided, possibility-first front door: Person → Goals → Constraints →
 * Possibilities → Pathways → Actions. The property search is ONE possible
 * destination, never assumed to be THE one. Anonymous + in-session — nothing
 * about the person is sent or stored; the map is computed in the browser by the
 * deterministic routing layer. Education + routing, never determination; Human
 * Review is always offered.
 *
 * Browse is PRESERVED: the existing property map / Explore stays one click away
 * (BROWSE_HREF), per "keep what we have until I see this working."
 *
 * Public Alpha PENDING.
 */

export const metadata: Metadata = {
  title: "What are your possibilities? | Furlong",
  description:
    "Before recommending a property, program, financing option, or plan, we help you understand what " +
    "you're trying to accomplish — then map the possibilities. Anonymous, no account, nothing sold.",
};

export default async function DiscoverPage() {
  const feed = guidedIntakeFeed();
  const primary = discoveryPrimary();

  return (
    <main style={{ display: "grid", gap: 28, padding: "40px 20px", maxWidth: 980, margin: "0 auto" }}>
      <header style={{ display: "grid", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "#0f766e" }}>
          Possibility discovery
        </span>
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, color: "#101a2b", maxWidth: 720 }}>
          Understand your possibilities — before anyone recommends anything.
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "#5d687a", lineHeight: 1.55, maxWidth: 720 }}>
          A property, a program, financing, a grant, a conservation pathway, a business opportunity, or a plan —
          we start with what <em>you</em> are trying to accomplish, then show what's out there. No right or wrong
          answers, and we're not here to sell you anything.
        </p>
        {!primary && (
          <p style={{ margin: 0, fontSize: 12.5, color: "#9aa6b6" }}>
            Prefer to look around first? <Link href={BROWSE_HREF} style={{ color: "#185FA5", textDecoration: "underline", fontWeight: 700 }}>Browse properties directly →</Link>
          </p>
        )}
      </header>

      <DiscoveryEngine feed={feed} />

      <Disclosures />
    </main>
  );
}
