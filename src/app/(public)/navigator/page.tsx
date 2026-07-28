import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiscoverSurface } from "../discover/page";

/**
 * /navigator — the canonical Furlong Navigator destination (hero CTA
 * restructure Option A, 2026-06-11: "Talk to Furlong Navigator" → /navigator).
 * Renders the same governed conversational surface as the /discover default
 * flow; /discover stays for the place-facts entrypoints and existing links.
 */

export const metadata: Metadata = {
  title: "Furlong Navigator | Furlong",
  description:
    "Tell us what you're looking for and we'll help uncover pathways you may not know exist. " +
    "Paste a property, describe an idea, or start with nothing at all. Anonymous, no account required.",
};

type SP = Record<string, string | string[] | undefined>;

export default async function NavigatorPage({ searchParams }: { searchParams?: Promise<SP> }) {
  const query = searchParams ? await searchParams : {};
  const flow = Array.isArray(query.flow) ? query.flow[0] : query.flow;
  const lens = Array.isArray(query.lens) ? query.lens[0] : query.lens;

  // Farms is a discovery destination, not a pre-emptive address-intake flow.
  // Preserve old/bookmarked Navigator URLs by sending them to the canonical
  // Farms, Agriculture & Land page, where users can browse the map or enter an address.
  if (flow === "property-discovery" && lens === "farms-agriculture") {
    redirect("/explore?lane=farms-agriculture");
  }

  return <DiscoverSurface route="/navigator" query={query} />;
}
