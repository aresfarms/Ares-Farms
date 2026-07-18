import type { Metadata } from "next";
import Link from "next/link";

import { PREMIUM } from "@/lib/property/laneThemes";

/**
 * /community — the informational Furlong Community page (founder direction
 * 2026-07-18: teach what belonging looks like).
 *
 * GOVERNANCE: membership economics are shelved until the founders + counsel
 * session. This page collects NOTHING (no signup form, no email capture, no
 * payment), states NO prices, and is explicit that the community is forming.
 * It describes the vision only — the "what," never a checkout.
 */

export const metadata: Metadata = {
  title: "The Furlong Community | Furlong",
  description:
    "A community of owners, operators, and the people who fund them. Forming now — the vision, honestly, with no sign-up yet.",
};

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
          ✦ The Furlong Community
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: PREMIUM.goldBright, lineHeight: 1.15 }}>
          Where owners, operators, and the people who fund them meet.
        </h1>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "#c8d6ea", maxWidth: 640 }}>
          Furlong is free to explore, and always will be. The community is the next step for people who want to
          go deeper — together. It is being built right now.
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

      {/* Honest status — no signup, no prices (governance: economics shelved). */}
      <section style={{ border: `1px solid ${PREMIUM.gold}`, background: PREMIUM.paper, borderRadius: 14, padding: "18px 20px", display: "grid", gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a6414" }}>
          Being built now
        </span>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#4a3d1e" }}>
          There is no sign-up yet, and we are not quoting prices. Membership takes shape once our founders and
          counsel finalize it — and when it opens, everything you already use on Furlong carries forward
          unchanged. Nothing you explore today ever costs you anything.
        </p>
      </section>
    </main>
  );
}
