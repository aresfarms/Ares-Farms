import type { Metadata } from "next";
import Link from "next/link";

import { Disclosures } from "@/components/public/Disclosures";

/**
 * /compass — What We Do (Compass to Capital). Build 56, consolidation Stage 2.
 *
 * The value-proposition page: what Furlong is and does. Warm "Navigating the
 * Maze" copy + the precise "Furlong does not / helps you understand" lists +
 * the shared <Disclosures> (single source of truth). Each page does one job and
 * links to the others rather than restating them.
 *
 * Carries the Customer-Journey §1 tokens (tagline "Compass to Capital",
 * founder-mission, the promise negations + affirmations) so the surface registry
 * can treat THIS page as the value-prop surface.
 *
 * Governance: "The map reveals opportunities, not the visitor." Public Alpha PENDING.
 */

export const metadata: Metadata = {
  title: "What We Do | Compass to Capital",
  description:
    "Furlong casts a clear light on the lenders, programs, and incentives already in your world, and " +
    "helps you get organized so the right information reaches the right people. We help; we don't decide.",
};

const container = {
  maxWidth: 760,
  margin:   "0 auto",
  padding:  "48px 24px 80px",
  display:  "grid",
  gap:      28,
} as const;

const muted = { margin: 0, fontSize: 16, color: "#3b475a", lineHeight: 1.7 } as const;
const small = { margin: 0, fontSize: 14, color: "#5d687a", lineHeight: 1.65 } as const;

export default function CompassPage() {
  return (
    <main>
      <div style={container}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header style={{ display: "grid", gap: 16, paddingBottom: 24, borderBottom: "1px solid #d7deea" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#162033" }}>
            Compass to Capital: Navigating the Maze
          </h1>
          <p style={{ ...muted, fontSize: 18, color: "#5d687a" }}>
            Getting funding for a farm, a building, or a small business shouldn't feel like wandering
            through a maze in the dark. But it usually does — the bank needs one set of papers, the
            state agency demands another, a grant office wants a third, and none of them talk to each
            other. Brilliant projects stall for months because a single form went missing in the
            chaos. Furlong exists to change that. Think of us as your lighthouse: we cast a clear light
            on the lenders, programs, and incentives already in your world, and help you get your files
            beautifully organized so the right information reaches the right people at the right time.
          </p>
        </header>

        {/* ── How the Beacon guides you ─────────────────────────────────── */}
        <section style={{ display: "grid", gap: 14 }} aria-label="How the Beacon guides you">
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#162033" }}>
            💡 How the Beacon guides you
          </h2>
          <p style={muted}>Clarity before you commit time, money, or personal data:</p>
          <ul style={{ margin: 0, paddingLeft: 24, display: "grid", gap: 12 }}>
            <li style={muted}><strong>🚀 Your available pathways</strong> — the actual loans, grants, and agricultural programs that fit your goals.</li>
            <li style={muted}><strong>📉 Your readiness gaps</strong> — exactly what's complete and what's missing before you apply anywhere.</li>
            <li style={muted}><strong>📋 Your documentation needs</strong> — rounding up the records underwriting teams always look for.</li>
            <li style={muted}><strong>🌿 Your land considerations</strong> — the local environmental, zoning, and safety rules that affect success.</li>
          </ul>
        </section>

        {/* ── We light the way — you hold the wheel ─────────────────────── */}
        <section style={{ display: "grid", gap: 12 }} aria-label="We light the way, you hold the wheel">
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#162033" }}>
            🛑 We light the way — you hold the wheel.
          </h2>
          <p style={muted}>
            Our line in the sand: we help, we don't decide. Furlong is a discovery and organization
            platform, not a bank. We do not approve or deny loans, score credit, issue underwriting
            decisions, or guarantee funding. Those determinations belong entirely to you and the
            qualified professionals you choose. Our job is to make you "lender-ready" — organized
            against standard paperwork requirements so you can move forward with confidence.
          </p>
        </section>

        {/* ── Free for borrowers ────────────────────────────────────────── */}
        <section style={{ display: "grid", gap: 12 }} aria-label="Free for borrowers">
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#162033" }}>
            💵 Free for borrowers, always.
          </h2>
          <p style={muted}>
            No surprise fees, no hidden backend commissions, no catch. Your data belongs to you — we
            don't sell your files, build tracking profiles, or secretly slide your information to third
            parties. You stay in total command.
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FORMAL RECORD — the precise commitments (Customer Promise).
            ══════════════════════════════════════════════════════════════ */}
        <section
          aria-label="What we help, we don't decide means — specifically"
          style={{ background: "#f8fafc", border: "1px solid #d7deea", borderRadius: 12, padding: "24px 28px", display: "grid", gap: 20 }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#162033" }}>
            What "we help, we don't decide" means — specifically
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...small, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a2018", fontSize: 12 }}>
              Furlong does not:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              <li style={small}>approve loans</li>
              <li style={small}>deny loans</li>
              <li style={small}>issue underwriting decisions</li>
              <li style={small}>issue agency determinations</li>
              <li style={small}>guarantee funding</li>
            </ul>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ ...small, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0f766e", fontSize: 12 }}>
              Furlong helps you understand:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
              <li style={small}>available pathways</li>
              <li style={small}>readiness gaps</li>
              <li style={small}>documentation needs</li>
              <li style={small}>financing realities</li>
              <li style={small}>environmental considerations</li>
              <li style={small}>next recommended actions</li>
            </ul>
            <p style={{ ...small, fontStyle: "italic", marginTop: 4 }}>
              — before significant time, money, or effort are committed.
            </p>
          </div>

          {/* Canonical disclosures — single source of truth (see Disclosures.tsx). */}
          <Disclosures variant="compact" />
        </section>

        {/* ── Links (does one job; links to the others) ─────────────────── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Explore Your Possibilities on the Map →
          </Link>
          <Link href="/trust#your-data" style={{ color: "#0f766e", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
            Review Your Data Rights →
          </Link>
        </div>

      </div>
    </main>
  );
}
