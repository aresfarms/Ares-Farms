import type { Metadata } from "next";

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

export default function NavigatorPage() {
  return <DiscoverSurface route="/navigator" query={{}} />;
}
