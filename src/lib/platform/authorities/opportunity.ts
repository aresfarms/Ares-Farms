import {
  composeOpportunityDiscoveryV2,
  opportunityDiscoveryV2Lineage,
} from "@/lib/opportunity/discoveryV2Runtime";

/** Stable public boundary for the canonical Opportunity domain. */
export const canonicalOpportunityAuthority = Object.freeze({
  compose: composeOpportunityDiscoveryV2,
  lineage: opportunityDiscoveryV2Lineage,
});
