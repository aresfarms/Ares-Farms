import type { Metadata } from "next";

import { Disclosures } from "@/components/public/Disclosures";
import { InterestFirstDiscovery } from "@/components/discovery/InterestFirstDiscovery";

/**
 * /interests — "What are you interested in?" (founder direction 2026-07-20).
 *
 * The front door for the person who has no address yet — "I don't know, but I
 * want to live in Athens, GA." Anonymous, interests only, guided one question
 * at a time, ending in a PLACE-level Land Register entry.
 *
 * Honesty spine (see placeLevelBrief.ts + verify:place-brief): a place is not a
 * parcel. County/area-published facts are carried; tract-level designations
 * (Opportunity Zone, NMTC, FEMA flood) are never claimed for a whole town and
 * are deferred, by name, to a specific address.
 */
export const metadata: Metadata = {
  title: "What are you interested in? | Furlong",
  description:
    "Start with a place, not an address. Anonymous — your interests only. Furlong charts what a town or county's own public records say, and is plain about what only a specific address can answer.",
};

export default function InterestsPage() {
  return (
    <main style={{ display: "grid", gap: 24, padding: "40px 20px", maxWidth: 900, margin: "0 auto" }}>
      <InterestFirstDiscovery />
      <Disclosures showManifesto={false} />
    </main>
  );
}
