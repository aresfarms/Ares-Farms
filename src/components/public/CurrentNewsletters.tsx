/**
 * CurrentNewsletters — the "Current Newsletters:" link list (founder direction
 * 2026-07-18: the letter itself is a page; surfaces show links that
 * auto-populate from the registry — newsletters now, podcasts when running).
 * Server component.
 */

import Link from "next/link";

import { buildCompassDispatch } from "@/lib/newsletter/newsletterDispatch";
import type { NewsletterAudience } from "@/lib/newsletter/newsletterEditions";
import { CURRENT_NEWSLETTERS } from "@/lib/newsletter/newsletterRegistry";
import { buildStateDroughtProvenance } from "@/lib/property/weeklyAgLive";

export function CurrentNewsletters({ audiences, accent = "#0f766e" }: { audiences?: NewsletterAudience[]; accent?: string }) {
  const asOf = buildStateDroughtProvenance().mapDate ?? "2026-07-18";
  const listings = CURRENT_NEWSLETTERS.filter(
    (n) => !audiences || audiences.includes(n.audience)
  );
  const newsletters = listings.filter((n) => n.kind === "newsletter");
  const podcasts = listings.filter((n) => n.kind === "podcast");

  return (
    <section
      aria-label="Current newsletters"
      style={{
        display: "grid",
        gap: 10,
        border: "1px solid #d7deea",
        background: "#ffffff",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
        Current Newsletters
      </span>
      {newsletters.length === 0 ? (
        <span style={{ fontSize: 13, color: "#4d596d" }}>The first editions are being written.</span>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {newsletters.map((n) => {
            const dispatch = buildCompassDispatch(n.audience, n.regionKey, asOf);
            return (
              <li key={n.key}>
                <Link
                  href={`/newsletters/${n.key}`}
                  style={{ fontSize: 14, fontWeight: 700, color: accent, textDecoration: "none" }}
                >
                  {n.title} →
                </Link>
                {dispatch && (
                  <span style={{ display: "block", fontSize: 12, color: "#708997", marginTop: 2 }}>
                    {dispatch.stamp.replace("The Furlong Compass · ", "")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <span style={{ fontSize: 12, color: "#9aa6b6" }}>
        {podcasts.length > 0 ? "Podcasts:" : "Podcasts join here as soon as they're up and running."}
      </span>
      {podcasts.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {podcasts.map((p) => (
            <li key={p.key}>
              <Link href={`/newsletters/${p.key}`} style={{ fontSize: 14, fontWeight: 700, color: accent, textDecoration: "none" }}>
                {p.title} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
