import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompassDispatchHero } from "@/components/public/CompassDispatchHero";
import { buildCompassDispatch } from "@/lib/newsletter/newsletterDispatch";
import { newsletterByKey } from "@/lib/newsletter/newsletterRegistry";
import { STATE_DROUGHT_PROVENANCE } from "@/lib/property/stateDroughtGenerated";

/**
 * /newsletters/[key] — one newsletter, on its own page (founder direction
 * 2026-07-18: surfaces carry LINKS under "Current Newsletters"; the letter
 * itself lives here). Keys resolve from the newsletter registry; unknown keys
 * 404. Podcasts share the route when they exist.
 */

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

  const asOf = STATE_DROUGHT_PROVENANCE.mapDate ?? "2026-07-18";
  const dispatch = buildCompassDispatch(listing.audience, listing.regionKey, asOf);
  if (!dispatch) notFound();

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 48px", display: "grid", gap: 16 }}>
      <Link
        href="/explore?lane=housing-development"
        style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textDecoration: "none", width: "fit-content" }}
      >
        ← All newsletters &amp; podcasts
      </Link>
      <CompassDispatchHero dispatch={dispatch} />
    </main>
  );
}
