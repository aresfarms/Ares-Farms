/**
 * CommunityCta — the gold paid-community cue (founder direction 2026-07-18:
 * add the reserved "Compass to Capital" gold to every lane as the belong/return
 * signal, and put a Community button where the newsletters & podcasts sit).
 *
 * GOVERNANCE: membership economics are shelved until the founders + counsel
 * session — so this collects NOTHING (no signup, no payment, no email), makes
 * no price claim, and is honest that the community is forming. It links to the
 * informational /community page. It is a wayfinding + brand cue, not a checkout.
 */

import Link from "next/link";

import { PREMIUM } from "@/lib/property/laneThemes";

export function CommunityCta() {
  return (
    <section
      aria-label="The Furlong community"
      style={{
        background: `linear-gradient(155deg, ${PREMIUM.ink} 0%, ${PREMIUM.inkSoft} 100%)`,
        border: `1px solid ${PREMIUM.gold}`,
        borderRadius: 16,
        padding: "20px 22px",
        display: "grid",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: PREMIUM.gold }}>
        ✦ The Furlong Community
      </span>
      <strong style={{ fontSize: 20, color: PREMIUM.goldBright, lineHeight: 1.2, fontWeight: 800 }}>
        Where owners, operators, and the people who fund them meet.
      </strong>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#c8d6ea", maxWidth: 620 }}>
        The newsletter, the podcasts, and the deeper analysis all lead to one place: a community of people
        working the same problems you are. It&apos;s being built now — no sign-up yet — and it opens once we
        finalize it with our founders and counsel.
      </p>
      <div>
        <Link
          href="/community"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: PREMIUM.gold,
            color: PREMIUM.onGold,
            fontWeight: 800,
            fontSize: 14,
            padding: "10px 18px",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          See what the community is →
        </Link>
      </div>
    </section>
  );
}
