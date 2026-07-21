import {
  OPPORTUNITY_DISCOVERY_V2_DISCLOSURES,
  OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS,
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  composeOpportunityDiscoveryV2,
  opportunityDiscoveryV2Lineage,
} from "@/lib/opportunity/discoveryV2Runtime";

export type {
  OpportunityDiscoveryV2CrossSourceConflict,
  OpportunityDiscoveryV2CustomerProfile,
  OpportunityDiscoveryV2GrantCard,
  OpportunityDiscoveryV2Input,
  OpportunityDiscoveryV2Result,
} from "@/lib/opportunity/discoveryV2Runtime";

/** Stable public boundary for the canonical Opportunity domain. */
export const canonicalOpportunityAuthority = Object.freeze({
  compose: composeOpportunityDiscoveryV2,
  lineage: opportunityDiscoveryV2Lineage,
  runtimeVersion: OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  disclosures: OPPORTUNITY_DISCOVERY_V2_DISCLOSURES,
  productionRestrictions: OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS,
});

export {
  OPPORTUNITY_DISCOVERY_V2_DISCLOSURES,
  OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS,
  OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION,
  composeOpportunityDiscoveryV2,
  opportunityDiscoveryV2Lineage,
};
