/**
 * FURLONG-VISION-001
 *
 * Canonical product invariant for every public entrypoint, property analysis,
 * opportunity model, financing workflow, provider match, customer case, and
 * institutional integration.
 *
 * Doctrine lineage:
 * - Furlong Volume 0, Parts 1 and 11
 * - Vol I HUMANITY-PRINCIPLE-001 / FACILITATION-001 / AI-TIER-001
 * - Vol V institutional charter and CANON-ECON-001
 * - Vol VI UX-GOV-001 / PUBLIC-CLAIMS-001 / IMPLEMENTATION-MANIFEST-001
 * - docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md
 */
export const FURLONG_VISION_VERSION = "furlong-vision-v1.0.0" as const;

export const FURLONG_CUSTOMER_PROMISE =
  "Give Furlong an address and it will show what the entire property could realistically produce and how to finance it completely through receiving the keys—not merely its listing facts, agricultural classification or estimated sale value." as const;

export const FURLONG_CATEGORY_POSITION =
  "Furlong is the independent property-to-capital intelligence and coordination layer between a property idea and the capital required to make it real." as const;

export const FURLONG_CUSTOMER_EXPERIENCE_RULE =
  "Every decision surface answers in this order: what Furlong found, why it matters, what the customer should do next, and only then the evidence, assumptions, sources, and technical detail needed to verify the answer." as const;

export const FURLONG_CUSTOMER_CORE_SERVICES = [
  "open-property-analysis",
  "financing-readiness",
  "verified-provider-comparison",
  "customer-controlled-case-file",
  "exact-recipient-case-room-handoff",
] as const;

export const FURLONG_MONETIZATION_RULE =
  "The customer-free core may not be gated by a borrower financing fee. Furlong is funded primarily by institutional subscriptions, licensing, workflow infrastructure, integrations, APIs, analytics, support, and optional separately scoped professional or archival services. Provider compensation may never influence ranking, and Furlong takes no success percentage or transaction cut from a financing outcome." as const;

export const FURLONG_INSTITUTIONAL_REVENUE_STREAMS = [
  "institutional-subscriptions",
  "enterprise-licensing",
  "workflow-infrastructure",
  "api-and-integration-access",
  "case-room-and-document-normalization-infrastructure",
  "institutional-analytics",
  "governance-and-audit-tooling",
  "support-and-sla-services",
  "enterprise-deployment-environments",
] as const;

/**
 * Product specialization order. This is a development/market priority, never
 * an eligibility preference. A customer whose facts fit a later-listed program
 * still receives the supported path; the sequence only governs where Furlong
 * builds the deepest provider coverage and operating expertise first.
 */
export const FURLONG_MARKET_SEQUENCE = [
  "USDA_BI",
  "SBA_504",
  "SBA_7A",
  "FSA_FARM_OWNERSHIP_AND_OPERATING",
  "USDA_CF_AND_REAP",
  "CONVENTIONAL_COMMERCIAL",
  "RESIDENTIAL_CONVENTIONAL_WHEN_PROPERTY_JOURNEY_REQUIRES",
] as const;

export const FURLONG_VISION_REQUIREMENTS = [
  "address-first-entry",
  "automatic-property-classification",
  "answer-first-progressive-disclosure",
  "whole-property-segmentation",
  "objective-highest-supported-land-plan",
  "singular-and-compatible-combination-plans",
  "risk-adjusted-net-after-expenses",
  "three-five-ten-year-projections",
  "property-specific-market-and-competition",
  "regulatory-and-environmental-constraints",
  "capital-path-through-keys",
  "borrower-core-direct-free",
  "durable-property-logbook",
  "multi-property-portfolio-register",
  "customer-controlled-share-access",
  "accounting-and-tax-extension-ready",
  "verified-provider-fit-ranking",
  "customer-selected-multi-provider-comparison",
  "separate-consent-per-recipient",
  "no-paid-placement-lead-sale-file-auction-or-success-cut",
  "provider-response-and-closing-tracking",
  "outcome-learning-with-evidence",
  "production-security-evidence-gate",
] as const;

/**
 * Soil limitations are inputs to scenario design, not an automatic reason to
 * discard otherwise viable land. When evidence indicates amendment is needed,
 * Furlong must compare the current-soil case with restoration alternatives.
 */
export const FURLONG_SOIL_AMENDMENT_REQUIREMENTS = [
  "current-soil-production-case",
  "purchased-or-mechanical-amendment-case",
  "livestock-assisted-regeneration-case",
  "no-livestock-alternative",
  "amendment-capital-cost",
  "amendment-operating-cost",
  "time-to-productive-soil",
  "labor-and-management-burden",
  "three-five-ten-year-net-effect",
] as const;

export type FurlongPlanClass =
  | "objective-strongest-property-plan"
  | "most-practical-starting-plan"
  | "lower-capital-alternative"
  | "lower-labor-alternative"
  | "fastest-route-to-revenue";

export const FURLONG_PLAN_SEPARATION_RULE =
  "Furlong determines the objectively strongest property plan from land, law, market, competition, cost, risk, and time. Customer budget, labor, and goals may refine execution, but must never rewrite the underlying property conclusion." as const;

export const FURLONG_SOIL_AMENDMENT_RULE =
  "If verified soil evidence indicates amendment, compare current-soil production, purchased or mechanical amendment, and livestock-assisted regeneration. Always provide a non-livestock alternative, and disclose cost, time, labor, management burden, and projected net effect separately." as const;

export const FURLONG_LIVING_RECORD_RULE =
  "Each analyzed property may become a durable customer-controlled logbook within a multi-property portfolio: printable, continuously updateable, selectively shareable by revocable access, and extensible to operating records, accounting, and tax preparation." as const;

export const FURLONG_CONTROLLED_PROVIDER_HANDOFF_RULE =
  "Furlong may recommend and rank verified providers only by documented property, program, published credit-box, and execution fit. The customer chooses every recipient and authorizes each package separately. Furlong never sells leads, auctions files, permits pay-to-rank placement, broadcasts customer data, or takes a success percentage from the financing outcome." as const;

/** Compatibility export; neutrality means independence from compensation, not refusal to help choose. */
export const FURLONG_FINANCING_NEUTRALITY_RULE =
  FURLONG_CONTROLLED_PROVIDER_HANDOFF_RULE;

export const FURLONG_SECURITY_RELEASE_RULE =
  "Architecture is not production assurance. Unrestricted production activation requires current evidence for threat-model closure, dependency and container scanning, IAM and tenant-isolation review, key and secret rotation, backup/restore and replay testing, penetration testing, incident/rollback exercises, vendor review, and signed governed promotion gates. Missing evidence keeps the affected live action blocked." as const;
