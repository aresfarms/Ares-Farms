/**
 * verify:curated-opportunity — CURATED-OPPORTUNITY-PIPELINE-001 (COP-001),
 * doctrine-only. Locks the registry contract (core principle, sources, human
 * selection rule, weekly curation model, card structure, automation roadmap
 * with humans-approve-at-every-phase, membership-is-for-intelligence, source
 * attribution, anti-portal list, constitutional lock verbatim) and asserts the
 * pipeline is NOT activated. There is no live surface to probe — the gate
 * proves the contract is captured and the activation flag is off.
 */
import * as fs from "node:fs";
import {
  COP_DOCTRINE_ID, COP_PIPELINE_LIVE, COP_CORE_PRINCIPLE,
  COP_OPPORTUNITY_SOURCES, COP_HUMAN_SELECTION_RULE, COP_WEEKLY_CURATION,
  COP_OPPORTUNITY_CARD_SECTIONS, COP_PROPERTY_SNAPSHOT_FIELDS,
  COP_AUTOMATION_ROADMAP, COP_PHASE3_SCORING_FACTORS, COP_MEMBERSHIP,
  COP_SOURCE_ATTRIBUTION_REQUIRED, COP_SOURCE_ATTRIBUTION_RULE,
  COP_ANTI_PORTAL_FORBIDDEN, COP_ANTI_PORTAL_RULE, COP_CONSTITUTIONAL_LOCK,
  opportunityHonorsDoctrine,
} from "@/lib/platform/curatedOpportunityPipeline";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// Identity + master gate.
ok(COP_DOCTRINE_ID === "CURATED-OPPORTUNITY-PIPELINE-001", "doctrine id locked");
ok(COP_PIPELINE_LIVE === false, "pipeline NOT activated (COP_PIPELINE_LIVE=false)");

// §1 core principle: decision intelligence, not a listing platform.
ok(COP_CORE_PRINCIPLE.isNot === "a listing platform" &&
   COP_CORE_PRINCIPLE.is === "a Decision Intelligence Platform" &&
   COP_CORE_PRINCIPLE.productIsThe === "intelligence" &&
   COP_CORE_PRINCIPLE.startingPointIsThe === "property" &&
   COP_CORE_PRINCIPLE.explains.length === 5,
  "§1 core principle locked (intelligence is the product; property is the start)");

// §2 sources across all four families.
ok(COP_OPPORTUNITY_SOURCES.public.includes("Crexi") &&
   COP_OPPORTUNITY_SOURCES.public.includes("LoopNet") &&
   COP_OPPORTUNITY_SOURCES.government.includes("USDA") &&
   COP_OPPORTUNITY_SOURCES.government.includes("state land banks") &&
   COP_OPPORTUNITY_SOURCES.community.includes("user submissions") &&
   COP_OPPORTUNITY_SOURCES.internalDiscovery.includes("watchlists"),
  "§2 source families complete (public/government/community/internal)");

// §3 human selection rule.
ok(/Automation may discover/.test(COP_HUMAN_SELECTION_RULE) &&
   /Humans decide what becomes featured/.test(COP_HUMAN_SELECTION_RULE) &&
   /without human review/.test(COP_HUMAN_SELECTION_RULE),
  "§3 human selection rule locked (no feature without human review)");

// §4 weekly curation model + volume targets.
ok(COP_WEEKLY_CURATION.reviewers.Caitlin.includes("environmental") &&
   COP_WEEKLY_CURATION.reviewers.CapitalReview.includes("financing pathways") &&
   COP_WEEKLY_CURATION.reviewers.PublicTrustReview.includes("public appeal") &&
   COP_WEEKLY_CURATION.perReviewerNominationsPerWeek.min === 5 &&
   COP_WEEKLY_CURATION.perReviewerNominationsPerWeek.max === 10 &&
   COP_WEEKLY_CURATION.reviewedPipelinePerWeek.min === 15 &&
   COP_WEEKLY_CURATION.reviewedPipelinePerWeek.max === 30 &&
   COP_WEEKLY_CURATION.featuredPublishedPerWeek.min === 5 &&
   COP_WEEKLY_CURATION.featuredPublishedPerWeek.max === 15,
  "§4 weekly curation reviewers + 5–10 / 15–30 / 5–15 targets locked");

// §5 card structure.
ok(COP_OPPORTUNITY_CARD_SECTIONS.length === 11 &&
   COP_OPPORTUNITY_CARD_SECTIONS[0] === "Property Snapshot" &&
   COP_OPPORTUNITY_CARD_SECTIONS.includes("What Could Go Wrong") &&
   COP_OPPORTUNITY_CARD_SECTIONS.includes("Ownership Reality") &&
   COP_OPPORTUNITY_CARD_SECTIONS.includes("Who Should Pause") &&
   COP_PROPERTY_SNAPSHOT_FIELDS.includes("source attribution") &&
   COP_PROPERTY_SNAPSHOT_FIELDS.includes("source link"),
  "§5 opportunity card structure (11 sections) + snapshot fields locked");

// §6 automation roadmap — humans approve at every phase.
ok(COP_AUTOMATION_ROADMAP.length === 3 &&
   COP_AUTOMATION_ROADMAP.every((p) => p.humansApprove === true) &&
   COP_PHASE3_SCORING_FACTORS.length === 10,
  "§6 automation roadmap (3 phases, humans approve at EVERY phase; 10 scoring factors)");

// §7 membership — intelligence, not listing access.
ok(COP_MEMBERSHIP.subscriptionIsFor === "intelligence" &&
   COP_MEMBERSHIP.subscriptionIsNotFor === "access to listings" &&
   COP_MEMBERSHIP.freeTier.includes("weekly featured opportunities") &&
   COP_MEMBERSHIP.paidTier.includes("resilience modeling"),
  "§7 membership is for intelligence, not access to listings");

// §8 source attribution rule.
ok(COP_SOURCE_ATTRIBUTION_REQUIRED.length === 3 &&
   COP_SOURCE_ATTRIBUTION_REQUIRED.includes("discovery date") &&
   /must not present third-party opportunities as Furlong-owned listings/.test(COP_SOURCE_ATTRIBUTION_RULE),
  "§8 source attribution mandatory; never framed as Furlong-owned");

// §9 anti-portal rule.
ok(COP_ANTI_PORTAL_FORBIDDEN.length === 5 &&
   COP_ANTI_PORTAL_FORBIDDEN.includes("MLS replacement") &&
   /does not exist to replace listing platforms/.test(COP_ANTI_PORTAL_RULE),
  "§9 anti-portal rule locked (no Zillow/Realtor/Crexi/LoopNet/MLS clone)");

// §10 constitutional lock verbatim.
ok(COP_CONSTITUTIONAL_LOCK ===
   "Listing platforms show opportunities. Furlong explains them. " +
   "The property begins the conversation. The intelligence creates the value.",
  "§10 constitutional lock verbatim");

// Predicate: human approval + full attribution + not-Furlong-owned required.
ok(opportunityHonorsDoctrine({
     humanApproved: true, sourceAttribution: "Crexi", sourceLink: "https://x",
     discoveryDate: "2026-06-14", presentedAsFurlongOwnedListing: false,
   }) === true,
  "honoring candidate (human-approved + attributed + not-owned) passes");
ok(opportunityHonorsDoctrine({ humanApproved: false, sourceAttribution: "Crexi",
     sourceLink: "https://x", discoveryDate: "2026-06-14" }) === false,
  "auto-discovered-but-unapproved candidate is rejected (human selection rule)");
ok(opportunityHonorsDoctrine({ humanApproved: true, sourceAttribution: null,
     sourceLink: null, discoveryDate: null }) === false,
  "unattributed candidate is rejected (source attribution rule)");
ok(opportunityHonorsDoctrine({ humanApproved: true, sourceAttribution: "Crexi",
     sourceLink: "https://x", discoveryDate: "2026-06-14",
     presentedAsFurlongOwnedListing: true }) === false,
  "Furlong-owned-listing framing is rejected (anti-portal / attribution)");

// Doc exists with the constitutional lock.
ok(fs.existsSync("docs/doctrine/CURATED_OPPORTUNITY_PIPELINE_001.md") &&
   /Listing platforms show opportunities\. Furlong explains them\./.test(
     fs.readFileSync("docs/doctrine/CURATED_OPPORTUNITY_PIPELINE_001.md", "utf8")),
  "doctrine doc exists with the constitutional lock");

if (fail.length) {
  console.error(`\n✗  verify:curated-opportunity FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log("✓  verify:curated-opportunity PASS — COP-001 captured as Build-Later doctrine: decision-intelligence-not-listing-portal core; four source families; human selection mandatory at every automation phase; weekly curation (owner + role-based review queues, 5–10 / 15–30 / 5–15); 11-section opportunity card; membership is for intelligence not listing access; source attribution mandatory; anti-portal list locked; constitutional lock verbatim; pipeline NOT activated (COP_PIPELINE_LIVE=false).");
process.exit(0);
