import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Disclosures } from "@/components/public/Disclosures";

/**
 * /team — "The Guiding Beacon" (Build 56). PUBLISH-GATED — stays dark.
 *
 * This page is BUILT but intentionally NOT publicly routed: it renders only when
 * FURLONG_TEAM_PUBLIC === "1". Until Furlong Inc is registered, WHOIS privacy is
 * on, and a business mailing address is in use, the route returns 404 and is not
 * linked from the nav or footer. Flip the env flag to publish.
 *
 * Privacy posture (hard rules — enforced by the P-team gates):
 *   - First names + roles ONLY. No last names.
 *   - No photos of people. No locations / addresses / cities.
 *   - Security is presented as a TEAM PROMISE, not personal detail.
 *   - Lighthouse motifs only (no headshots).
 *
 * "The map reveals opportunities, not the visitor." Public Alpha remains PENDING.
 */

export const metadata: Metadata = {
  title: "The Guiding Beacon | Furlong",
  description:
    "The small team keeping the light on at Furlong — roles, not résumés. We protect your information " +
    "the way a lighthouse protects a coastline: quietly, constantly, and on purpose.",
};

/** Whether the team page is allowed to render publicly. Dark by default. */
const TEAM_PAGE_PUBLIC = process.env.FURLONG_TEAM_PUBLIC === "1";

// First names + lighthouse roles ONLY — no surnames, no photos, no locations.
// Replace first names with the real team's before going live (page stays dark
// until then). Roles are the public-facing "beacon" each person keeps.
type Beacon = { firstName: string; role: string; keeps: string };
const TEAM: Beacon[] = [
  { firstName: "Caitlin", role: "Keeper of the Light",   keeps: "Sets the course and keeps the mission true — why Furlong exists and who it serves." },
  { firstName: "—",       role: "Chart & Compass",       keeps: "Shapes the map and the pathways, so the route ahead is clear before you commit." },
  { firstName: "—",       role: "Harbor Watch",          keeps: "Guards your information — the tamper-proof record, the data rights, the no-surprises promise." },
  { firstName: "—",       role: "Signal & Shore",        keeps: "Answers when you call — support, plain answers, and a real person at every material step." },
];

const container = { maxWidth: 880, margin: "0 auto", padding: "48px 24px 80px", display: "grid", gap: 32 } as const;
const muted = { margin: 0, fontSize: 16, color: "#3b475a", lineHeight: 1.7 } as const;

export default function TeamGuidingBeaconPage() {
  // Publish gate — dark until the entity + records are safe.
  if (!TEAM_PAGE_PUBLIC) {
    notFound();
  }

  return (
    <main>
      <div style={container}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 16, paddingBottom: 24, borderBottom: "1px solid #d7deea" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#162033" }}>
            The Guiding Beacon
          </h1>
          <p style={{ ...muted, fontSize: 18, color: "#5d687a" }}>
            A small team keeps the light on at Furlong. We introduce ourselves the way a lighthouse
            introduces itself — by the beacon we keep, not by a résumé. First names and roles, because
            the work is what matters and your trust is earned by what we do, not who we know.
          </p>
        </header>

        {/* ── The beacons (first names + roles only) ────────────────────── */}
        <section aria-label="The team — roles and the beacon each one keeps" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {TEAM.map((m) => (
            <div key={m.role} style={{ border: "1px solid #d7deea", borderRadius: 14, background: "#ffffff", padding: "22px 22px", display: "grid", gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 26 }}>🗼</span>
              <strong style={{ fontSize: 18, color: "#162033" }}>{m.firstName}</strong>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.role}</span>
              <p style={{ ...muted, fontSize: 14 }}>{m.keeps}</p>
            </div>
          ))}
        </section>

        {/* ── Security is a team promise ────────────────────────────────── */}
        <section
          aria-label="Security is a team promise"
          style={{ background: "#162033", color: "#e8effa", borderRadius: 14, padding: "28px 28px", display: "grid", gap: 12 }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>
            Security is a team promise
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#e8effa" }}>
            We protect your information the way a lighthouse protects a coastline: quietly, constantly,
            and on purpose. Your file stays with your lender and your agency; we are the secure
            coordination channel between them, never a giant pile of everyone's private data. Every step
            is written to a tamper-proof record, no entry is secretly changed, and a real person reviews
            every material decision. Those aren't features — they're the promise the whole team keeps.
          </p>
        </section>

        {/* ── Links ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/about" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Our Story →
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
