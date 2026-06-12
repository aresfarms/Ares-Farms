import type { Metadata } from "next";

import { DiscoverSurface } from "../page";

/**
 * /discover/opportunity-zone — an explicit path entrypoint for the Opportunity
 * Zone place-fact journey. Resolves to the PLACE-FIRST card (location first),
 * never the generic persona intake. Anonymous; verified place-facts only.
 */

export const metadata: Metadata = {
  title: "Opportunity Zone lookup | Furlong",
  description:
    "Check whether a location's census tract is a designated Qualified Opportunity Zone (IRC §1400Z-1) — " +
    "a published government place-fact, not eligibility advice. Anonymous, no account needed.",
};

export default function OpportunityZoneDiscoverPage() {
  return <DiscoverSurface route="/discover/opportunity-zone" query={{}} />;
}
