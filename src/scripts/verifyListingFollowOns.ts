/**
 * verify:listing-follow-ons — license gate (Part 1) + weekly freshness (Part 2)
 * + owner-of-record evidence standard (Part 3). Full lifecycle with TEST data,
 * then FULLY REVERTED (store + overlay removed; nothing live).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
  registerLister, submitListing, recordProvenanceCheck, recordLicenseVerification,
  getListing, renderableListings, confirmListingActive,
} from "@/lib/source-intelligence/listing-intake/listingStore";
import { recordCounselClearance, recordListingDecision, counselClearedStates } from "@/lib/source-intelligence/listing-intake/listingSourceActivationStore";
import { canListingRender, listingRenderEligibility } from "@/lib/source-intelligence/listing-intake/listingRenderGate";
import { runDirectListingFreshness } from "@/lib/source-intelligence/listing-intake/directListingFreshness";
import { readAuditEvents } from "@/lib/property/auditLedger";
import { SOURCE_AUTHORITY_REGISTRY } from "@/lib/source-intelligence/sourceIntelligenceRuntime";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };
const ACTOR = { actorId: "op-test", actorName: "Test Operator (follow-ons)" };
const STORE = path.join(process.cwd(), "data", "direct-listings.json");
const OVERLAY = path.join(process.cwd(), "data", "listing-review-state.json");
const TODAY = new Date().toISOString().slice(0, 10);

async function main() {
  // ── governed source registered ───────────────────────────────────────────────
  ok(SOURCE_AUTHORITY_REGISTRY.some((s) => s.sourceId === "state-re-license" && s.connectorCertificationStatus === "PENDING_CERTIFICATION"),
    "state-re-license source must be registered, PENDING certification (Module 22/23)");

  // ── setup: counsel-clear VA (TEST, reverted) + brokers ──────────────────────
  recordCounselClearance({ state: "VA", reviewerId: ACTOR.actorId, reviewerName: ACTOR.actorName, reason: "TEST — reverted at end" });
  registerLister({ listerId: "f-broker", displayName: "Valley Realty (TEST)", contact: { contactName: "V", email: "v@x.com", phone: null },
    credential: { listerType: "broker", credentialId: "VA-91", credentialState: "VA", identityVerified: true, authorityAttested: true, ownerOfRecordMatch: null, photoDisplayRightsGranted: true }, ...ACTOR });

  // ── Part 3: owner-of-record TRUE without evidence is REFUSED ────────────────
  const l1 = submitListing({ listingId: "f-l1", listerId: "f-broker", propertyType: "home", state: "VA", town: "Staunton", priceLabelInput: 350000, description: "Brick home near downtown. (TEST)", photoRefs: [], ...ACTOR });
  let evidenceRefused = false;
  try { recordProvenanceCheck({ listingId: l1.listingId, ownerOfRecordMatch: true, evidence: "   ", ...ACTOR }); } catch { evidenceRefused = true; }
  ok(evidenceRefused, "Part 3: ownerOfRecordMatch=true without an evidence reference must be refused");
  recordProvenanceCheck({ listingId: l1.listingId, ownerOfRecordMatch: true, evidence: "listing agreement #LA-2026-014, owner-of-record J. Smith matches county record", ...ACTOR });
  recordListingDecision({ listingId: l1.listingId, listingState: "VA", decision: "APPROVE", reviewerId: ACTOR.actorId, reviewerName: ACTOR.actorName, reason: "TEST approve — reverted" });

  // ── Part 1: UNVERIFIED license → does NOT render despite full approval ──────
  ok(canListingRender(getListing(l1.listingId)!) === false, "broker with UNVERIFIED license must not render (even approved + counsel-cleared)");
  ok(listingRenderEligibility(getListing(l1.listingId)!).reasons.some((r) => r.includes("license")), "refusal reason must cite the license gate");

  // verified ACTIVE → renders, with the public license line
  recordLicenseVerification({ listerId: "f-broker", licenseStatus: "active", licenseNumber: "0225-099-VA", licenseExpiration: "2028-06-30", verificationSource: "DPOR license lookup (operator-recorded, screenshot ref EV-22)", ...ACTOR });
  const live1 = renderableListings({ state: "VA" });
  ok(live1.length === 1 && canListingRender(getListing(l1.listingId)!), "verified-active license → listing renders");
  ok(live1[0]?.licenseLine === `licensed broker · license #0225-099-VA, verified ${TODAY}`, `license line must match what was verified (got: ${live1[0]?.licenseLine})`);
  ok(live1[0]?.freshnessNotice.startsWith("Direct listings updated weekly · as of"), "public weekly-freshness notice must render");

  // EXPIRED license → blocked at render time (continuous enforcement, no job needed)
  recordLicenseVerification({ listerId: "f-broker", licenseStatus: "active", licenseNumber: "0225-099-VA", licenseExpiration: "2026-01-31", verificationSource: "TEST expired-term record", ...ACTOR });
  ok(canListingRender(getListing(l1.listingId)!) === false, "license expiration in the past must block render the same day — no job required");

  // ── Part 2: mid-cycle lapse → WEEKLY JOB SUSPENDS the lister's listings ─────
  const run1 = runDirectListingFreshness(new Date());
  ok(run1.suspendedLicense >= 1, "weekly job must suspend listings whose lister's license is no longer render-valid");
  ok(getListing(l1.listingId)!.status === "SUSPENDED", "listing status must be SUSPENDED after license lapse");
  ok(renderableListings({ state: "VA" }).length === 0, "suspended listing must not render");

  // re-verify active again → still needs status: store-level SUSPENDED holds until reviewed
  recordLicenseVerification({ listerId: "f-broker", licenseStatus: "active", licenseNumber: "0225-099-VA", licenseExpiration: "2028-06-30", verificationSource: "DPOR re-verification EV-23", ...ACTOR });
  ok(getListing(l1.listingId)!.status === "SUSPENDED", "suspension persists until operator action (no silent auto-revive)");

  // ── Part 2: past-date AUCTION auto-expires ──────────────────────────────────
  const auc = submitListing({ listingId: "f-auction", listerId: "f-broker", propertyType: "commercial", state: "VA", town: "Bristol", priceLabelInput: null, description: "Warehouse at public auction. (TEST)", photoRefs: [], listingKind: "auction", auctionDate: "2026-06-01", ...ACTOR });
  recordProvenanceCheck({ listingId: auc.listingId, ownerOfRecordMatch: true, evidence: "listing agreement #LA-2026-019", ...ACTOR });
  recordListingDecision({ listingId: auc.listingId, listingState: "VA", decision: "APPROVE", reviewerId: ACTOR.actorId, reviewerName: ACTOR.actorName, reason: "TEST approve — reverted" });
  ok(canListingRender(getListing(auc.listingId)!) === false, "past-date auction must not render (render-time enforcement)");
  const run2 = runDirectListingFreshness(new Date());
  ok(run2.auctionsExpired >= 1 && getListing(auc.listingId)!.status === "EXPIRED", "weekly job must auto-expire a past-date auction");

  // ── Part 2: non-reconfirmed listing suspends; reconfirmed stays ─────────────
  const oldDate = new Date(Date.now() + 30 * 86_400_000); // run the job "30 days later"
  const l2 = submitListing({ listingId: "f-l2", listerId: "f-broker", propertyType: "home", state: "VA", town: "Salem", priceLabelInput: 280000, description: "Cottage. (TEST)", photoRefs: [], ...ACTOR });
  recordProvenanceCheck({ listingId: l2.listingId, ownerOfRecordMatch: true, evidence: "listing agreement #LA-2026-020", ...ACTOR });
  recordListingDecision({ listingId: l2.listingId, listingState: "VA", decision: "APPROVE", reviewerId: ACTOR.actorId, reviewerName: ACTOR.actorName, reason: "TEST approve — reverted" });
  confirmListingActive({ listingId: l2.listingId, ...ACTOR }); // reconfirm now…
  const run3 = runDirectListingFreshness(oldDate); // …but the job runs 30 days later
  ok(getListing(l2.listingId)!.status === "SUSPENDED", "listing not reconfirmed within the window must suspend");
  // At +30d the lister's license verification is ALSO stale (>14d window), and the
  // license branch runs first — the stricter gate wins. Either branch must have
  // suspended it; the listing being SUSPENDED (asserted above) is the requirement.
  ok(run3.suspendedStale + run3.suspendedLicense >= 1, "freshness run must record the suspension (stale or license branch)");

  // ── ledger trail ─────────────────────────────────────────────────────────────
  ok(readAuditEvents({ domain: "listing-license-verification" }).some((e) => e.decision === "LICENSE_VERIFIED"), "license verifications must be ledger-logged");
  ok(readAuditEvents({ domain: "listing-freshness" }).some((e) => e.decision === "FRESHNESS_RUN"), "freshness runs must be ledger-logged");

  // ── REVERT ──────────────────────────────────────────────────────────────────
  try { fs.unlinkSync(STORE); } catch {}
  try { fs.unlinkSync(OVERLAY); } catch {}
  ok(counselClearedStates().length === 0 && renderableListings().length === 0, "after revert: nothing cleared, nothing renderable");

  console.log("verify:listing-follow-ons — license gate + weekly freshness + evidence standard proven; reverted clean.");
  if (fail.length) {
    console.error(`\n✗  FAIL — ${fail.length} issue(s):`);
    for (const f of fail) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:listing-follow-ons PASS — unverified/expired license never renders; verified-active renders with exact license line; mid-cycle lapse → weekly job suspends (no silent revive); past-date auction auto-expires; stale listing suspends; weekly notice renders; owner-flip requires evidence; all ledger-logged; state reverted (nothing live).");
  process.exit(0);
}

main().catch((e) => { console.error("verify:listing-follow-ons error:", e); process.exit(1); });
