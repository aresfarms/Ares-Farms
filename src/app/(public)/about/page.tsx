import type { Metadata } from "next";
import Link from "next/link";

import { FurlongStoryTimeline } from "@/components/story/FurlongStoryTimeline";
import { Disclosures } from "@/components/public/Disclosures";

/**
 * /about — Our Story (Build 56 consolidation, Stage 2)
 *
 * The founding narrative: the Amber and Sapphire historical-journey threads and
 * the modern convergence that became Furlong, told on the founding-thread map
 * (FurlongStoryTimeline — the on-map narrative interaction). The value-prop
 * "What We Do" content now lives on /compass; this page does ONE job (the story)
 * and links to the others.
 *
 * Team beacons are publish-gated (named version stays dark until Furlong Inc is
 * registered) — only an illustrative, privacy-safe placeholder appears here.
 *
 * Privacy posture: no living-person identifiers, no founder names, no exact
 * locations. Threads are illustrative. "The map reveals opportunities, not the
 * visitor." Public Alpha remains PENDING.
 */

export const metadata: Metadata = {
  title: "Our Story | Furlong",
  description:
    "Two historical journeys — the Amber and Sapphire threads — converged into a shared belief: people " +
    "make better decisions when they can see the pathways before them. That convergence became Furlong.",
};

const container = {
  maxWidth: 880,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      32,
} as const;

const muted = { margin: 0, fontSize: 16, color: "#3b475a", lineHeight: 1.7 } as const;
const small = { margin: 0, fontSize: 14, color: "#5d687a", lineHeight: 1.65 } as const;

export default function OurStoryPage() {
  return (
    <main>
      <div style={container}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 16, paddingBottom: 24, borderBottom: "1px solid #d7deea" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#162033" }}>
            Our Story
          </h1>
          <p style={{ ...muted, fontSize: 18, color: "#5d687a" }}>
            Furlong wasn't dreamed up in a boardroom. It grew out of two separate American journeys —
            two families, two regions, two centuries apart — that arrived at the same conviction: people
            make better decisions when they can see the pathways before them. We call them the Amber and
            Sapphire threads, and where they met is where Furlong began.
          </p>
        </header>

        {/* ── Founding-thread map ───────────────────────────────────────── */}
        <section aria-label="The Furlong founding story map">
          <FurlongStoryTimeline />
        </section>

        {/* ── The team (publish-gated) ──────────────────────────────────── */}
        <section
          aria-label="The team behind Furlong"
          style={{ background: "#f8fafc", border: "1px solid #d7deea", borderRadius: 12, padding: "24px 28px", display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>
            The people behind the beacon
          </h2>
          <p style={small}>
            Furlong is built by a focused, mission-aligned team. We believe data transparency should be
            paired with human accountability. What you see is exactly what you get: real history, clear
            pathways, and privacy you control. No embellishment.
          </p>
        </section>

        {/* ── Links (does one job; links to the others) ─────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/compass" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            What We Do →
          </Link>
          <Link href="/trust#your-data" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Trust &amp; Your Data →
          </Link>
        </div>

        {/* Canonical disclosures — single source of truth (see Disclosures.tsx). */}
        <Disclosures variant="full" />

      </div>
    </main>
  );
}
