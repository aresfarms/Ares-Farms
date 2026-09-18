import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompassDispatchHero } from "@/components/public/CompassDispatchHero";
import { NewsletterDownloadButton } from "@/components/public/NewsletterDownloadButton";
import { buildCompassDispatch } from "@/lib/newsletter/newsletterDispatch";
import { newsletterByKey } from "@/lib/newsletter/newsletterRegistry";
import { buildStateDroughtProvenance } from "@/lib/property/weeklyAgLive";

/**
 * /newsletters/[key] — one newsletter, as a branded, downloadable document
 * (founder direction 2026-07-20: "a nicer newsletter with our logo, the name more
 * prominent, something someone would want to download — not a weird news
 * dispatch"). A masthead (emblem + THE FURLONG COMPASS + region · date), a faint
 * emblem WATERMARK across the document to deter counterfeits/replication, a
 * download/print control, and an optional photo slot — then the sourced body.
 */

const INK = "#14212b";
const GOLD = "#b8862f";
const TEAL = "#0f766e";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const listing = newsletterByKey(key);
  return {
    title: listing ? `${listing.title} | Furlong` : "Newsletter | Furlong",
    description: "The Furlong Compass — sourced, dated regional reads for the people who work the ground.",
  };
}

export default async function NewsletterPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const listing = newsletterByKey(key);
  if (!listing || listing.kind !== "newsletter") notFound();

  const asOf = buildStateDroughtProvenance().mapDate ?? "2026-07-18";
  const dispatch = buildCompassDispatch(listing.audience, listing.regionKey, asOf);
  if (!dispatch) notFound();

  // The masthead parts come from the stamp: "The Furlong Compass · region · date".
  const parts = dispatch.stamp.split(" · ");
  const mastheadName = parts[0] ?? "The Furlong Compass";
  const region = parts[1] ?? null;
  const date = parts[2] ?? null;

  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "24px 20px 48px", display: "grid", gap: 16 }}>
      {/* Print stylesheet: isolate the newsletter document, drop the site chrome. */}
      <style>{`
        @media print {
          header, nav, footer, .nl-no-print { display: none !important; }
          .nl-doc { box-shadow: none !important; border: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="nl-no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/explore?lane=farms-agriculture"
          style={{ fontSize: 13, fontWeight: 700, color: TEAL, textDecoration: "none" }}
        >
          ← All newsletters &amp; podcasts
        </Link>
        <NewsletterDownloadButton accent={TEAL} />
      </div>

      {/* The newsletter document — masthead + watermark + body. */}
      <article
        className="nl-doc"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#ffffff",
          border: "1px solid #d6dfe5",
          borderRadius: 16,
          padding: "0 0 26px",
          boxShadow: "0 6px 22px rgba(16,26,43,0.08)",
        }}
      >
        {/* Anti-counterfeit watermark — the Furlong emblem, faint, behind the body. */}
        { }
        <img
          src="/brand/furlong-emblem.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "48%",
            left: "50%",
            width: "min(70%, 460px)",
            transform: "translate(-50%, -50%)",
            opacity: 0.05,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* Masthead — emblem + prominent name + region · date, on a navy band. */}
        <header
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "22px 26px 18px",
            background: "linear-gradient(180deg, #10233b 0%, #14293f 100%)",
            borderBottom: `3px solid ${GOLD}`,
          }}
        >
          { }
          <img
            src="/brand/furlong-emblem.png"
            alt="Furlong emblem"
            width={60}
            height={60}
            style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, boxShadow: "0 0 0 2px rgba(201,168,76,0.4)" }}
          />
          <div style={{ display: "grid", gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>
              Newsletter
            </span>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 4.5vw, 34px)", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.01em", color: "#f4f7fa" }}>
              {mastheadName}
            </h1>
            {(region || date) && (
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#b9cbd9", letterSpacing: "0.02em" }}>
                {[region, date].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </header>

        {/* Optional hero photo slot — renders per-edition when an image is wired
            (founder direction 2026-07-20: support photos, even if unused every
            edition). No image today → nothing renders; the layout stays clean. */}

        {/* Body — the sourced dispatch, framed by the document (no inner card). */}
        <div style={{ position: "relative", padding: "22px 26px 0" }}>
          <CompassDispatchHero dispatch={dispatch} hideStamp bare />
        </div>
      </article>
    </main>
  );
}
