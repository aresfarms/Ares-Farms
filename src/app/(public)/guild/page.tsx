import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterSignup } from "@/components/public/NewsletterSignup";
import { PREMIUM } from "@/lib/property/laneThemes";

/**
 * /guild — the informational Furlong Guild page (founder direction 2026-07-18:
 * the gold membership entity, named "The Guild" after a naming study — distinct,
 * ownable, premium; earned belonging + mutual aid across trades; it's the
 * compass's SW emblem, and the newsletters/podcasts are PART of it).
 *
 * GOVERNANCE: membership economics are shelved until the founders + counsel
 * session. This page states NO prices, has NO membership signup or checkout, and
 * is explicit that the Guild is forming. It describes the vision only — the
 * "what," never a price. The ONE capture is the Compass newsletter (email only,
 * free, approved 2026-07-19) — a newsletter subscribe, not a membership.
 */

export const metadata: Metadata = {
  title: "The Furlong Guild | Furlong",
  description:
    "A guild of owners, operators, and the people who fund them. Forming now — the vision, honestly, with no sign-up yet.",
};

const INSIDE: Array<{ title: string; body: string }> = [
  {
    title: "The Compass",
    body: "Your industry newsletters and podcasts — rates, commodity moves, and what's worth knowing — bundled, not billed separately.",
  },
  {
    title: "Credits toward the licensed work",
    body: "Guild tiers put credit toward the professional work you'd otherwise order à la carte — a Phase I, advisory hours, feasibility support.",
  },
  {
    title: "Priority professional time",
    body: "When you need a licensed PE or lender, members move to the front of the line — real people on your file, not just information.",
  },
  {
    title: "A room of operators — and the people who fund them",
    body: "Farmers, business owners, and the lenders and advisors who back them, working the same land and the same deals you are.",
  },
];

const PILLARS: Array<{ title: string; body: string }> = [
  {
    title: "The people, not just the data",
    body:
      "Everything on Furlong points to one place: a room of people working the same land, the same deals, and " +
      "the same financing problems you are — farmers, operators, and the lenders and advisors who fund them.",
  },
  {
    title: "Your newsletter and podcasts, together",
    body:
      "The lane newsletters and podcasts you already read are part of it — bundled, not billed separately, and " +
      "tuned to the industries you actually work in.",
  },
  {
    title: "Real expertise, real time",
    body:
      "The deeper reviews are people, not information: expert working time on your file, and licensed " +
      "deliverables where the work calls for a professional. What that includes is being finalized.",
  },
];

export default function CommunityPage() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 56px", display: "grid", gap: 20 }}>
      <Link href="/explore" style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textDecoration: "none", width: "fit-content" }}>
        ← Back to explore
      </Link>

      <section
        style={{
          background: `linear-gradient(155deg, ${PREMIUM.ink} 0%, ${PREMIUM.inkSoft} 100%)`,
          border: `1px solid ${PREMIUM.gold}`,
          borderRadius: 18,
          padding: "30px 28px",
          display: "grid",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: PREMIUM.gold }}>
          ✦ The Furlong Guild
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: PREMIUM.goldBright, lineHeight: 1.15 }}>
          Owners, operators, and the people who fund them — one guild.
        </h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "#c8d6ea", maxWidth: 640 }}>
          Furlong is free to explore, and always will be. The Guild is the next step for people who want to go
          deeper — together, and looking out for each other. It is being built right now.
        </p>
      </section>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {PILLARS.map((p) => (
          <div key={p.title} style={{ border: "1px solid #d7deea", background: "#ffffff", borderRadius: 14, padding: "18px 20px", display: "grid", gap: 6 }}>
            <strong style={{ fontSize: 15.5, color: "#101a2b" }}>{p.title}</strong>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#4d596d" }}>{p.body}</p>
          </div>
        ))}
      </div>

      {/* What the Guild brings together — informational, describes the WHAT,
          never a price (governance: economics shelved). */}
      <section style={{ display: "grid", gap: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a6414" }}>
          What the Guild brings together
        </span>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {INSIDE.map((i) => (
            <div key={i.title} style={{ border: `1px solid ${PREMIUM.gold}`, background: PREMIUM.paper, borderRadius: 12, padding: "14px 16px", display: "grid", gap: 4 }}>
              <strong style={{ fontSize: 14.5, color: "#3a2f12" }}>{i.title}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: "#4a3d1e" }}>{i.body}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The ONE capture: the Compass newsletter (free, email only) — the way
          to stay connected while the Guild forms. Not a membership signup. */}
      <section style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a6414" }}>
          Start free — the Compass is part of the Guild
        </span>
        <NewsletterSignup accent="#8a6414" />
      </section>

      {/* Honest status — no signup, no prices (governance: economics shelved). */}
      <section style={{ border: `1px solid ${PREMIUM.gold}`, background: PREMIUM.paper, borderRadius: 14, padding: "18px 20px", display: "grid", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a6414" }}>
          Being built now
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#4a3d1e" }}>
          There is no sign-up yet, and we are not quoting prices. The Guild takes shape once our founders and
          counsel finalize it — and when it opens, everything you already use on Furlong carries forward
          unchanged. Nothing you explore today ever costs you anything.
        </p>
      </section>
    </main>
  );
}
