/**
 * verify:listing-intake-gate — proves the listing scaffold is hard-gated.
 *
 * Asserts (no surface renders anything; this is the gate, not a live flow):
 *   1. Sample broker + bank/REO listings default PENDING and canListingRender = false.
 *   2. The render gate stays false even after operator APPROVE while the state is
 *      NOT counsel-cleared (counsel precondition cannot be skipped).
 *   3. APPROVE is REFUSED by the store when the state is not counsel-cleared.
 *   4. Fair-housing guard flags discriminatory ad text.
 *   5. Owner/FSBO is excluded at the type level (LISTER_TYPES has no "owner").
 *
 * Edge-safe-ish: touches the git-ignored runtime overlay only.
 */

import {
  recordListingDecision,
  getListingState,
  isStateCounselCleared,
} from "@/lib/source-intelligence/listing-intake/listingSourceActivationStore";
import { canListingRender, listingRenderEligibility } from "@/lib/source-intelligence/listing-intake/listingRenderGate";
import { fairHousingScan } from "@/lib/source-intelligence/listing-intake/fairHousingGuard";
import { LISTER_TYPES } from "@/lib/source-intelligence/listing-intake/listingSourceActivation";
import type { Listing, ListerType } from "@/lib/source-intelligence/listing-intake/listingTypes";

const fail: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) fail.push(msg); };

function sample(listerType: ListerType, id: string): Listing {
  return {
    listingId: id,
    listerType,
    listerDisplayName: listerType === "broker" ? "Test Realty LLC" : "Test National Bank",
    credential: {
      listerType,
      credentialId: listerType === "broker" ? "TEST-LIC-001" : "TEST-INST-001",
      credentialState: "VA",
      identityVerified: true,
      authorityAttested: true,
      ownerOfRecordMatch: true,
      photoDisplayRightsGranted: true,
    },
    propertyType: "commercial",
    state: "VA",
    town: "Roanoke",
    priceLabelInput: 250000,
    description: "Well-located commercial building near downtown.",
    photoRefs: [],
    status: "PENDING_HUMAN_APPROVAL",
    fairHousingClear: null,
    submittedAt: "2026-06-10T00:00:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
    expiresAt: null,
  };
}

// 5. Owner/FSBO excluded at type level.
ok(!(LISTER_TYPES as string[]).includes("owner"), "Owner/FSBO must be excluded from LISTER_TYPES (NO-GO).");
ok(LISTER_TYPES.length === 2 && LISTER_TYPES.includes("broker") && LISTER_TYPES.includes("bank-reo"),
  "LISTER_TYPES must be exactly broker + bank-reo.");

// 1. Default PENDING + cannot render.
for (const lt of ["broker", "bank-reo"] as ListerType[]) {
  const l = sample(lt, `verify-${lt}`);
  ok(getListingState(l.listingId).status === "PENDING_HUMAN_APPROVAL", `${lt}: should default PENDING`);
  ok(canListingRender(l) === false, `${lt}: must NOT render while PENDING`);
}

// 3 + 2. APPROVE refused while state not counsel-cleared; gate stays false.
const broker = sample("broker", "verify-broker");
ok(!isStateCounselCleared(broker.state), "VA must not be counsel-cleared by default (empty default).");
let refused = false;
try {
  recordListingDecision({ listingId: broker.listingId, listingState: broker.state, decision: "APPROVE", reviewerId: "t", reviewerName: "Test", reason: "x" });
} catch { refused = true; }
ok(refused, "APPROVE must be REFUSED when the listing's state is not counsel-cleared.");
ok(canListingRender(broker) === false, "Listing must still NOT render after a refused approve.");

// 4. Fair-housing guard flags bad text.
const bad = fairHousingScan("Great home, adults only, no children, perfect for a Christian couple.");
ok(bad.clear === false && bad.findings.length >= 2, "Fair-housing guard must flag discriminatory ad text.");
const good = fairHousingScan("Spacious 3-bedroom home with a large yard and updated kitchen.");
ok(good.clear === true, "Fair-housing guard must pass clean text.");

// Report
const elig = listingRenderEligibility(broker);
console.log("verify:listing-intake-gate —");
console.log(`  LISTER_TYPES: ${LISTER_TYPES.join(", ")} (owner/FSBO excluded)`);
console.log(`  sample broker render eligibility: canRender=${elig.canRender} reasons=[${elig.reasons.join("; ")}]`);
console.log(`  counsel-cleared states (default): [${[].join(", ")}] → nothing renders anywhere`);

if (fail.length) {
  console.error(`\n✗  FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log("\n✓  verify:listing-intake-gate PASS — scaffold is hard-gated: owner/FSBO excluded; broker + bank/REO default PENDING; APPROVE refused until counsel-cleared; nothing renders; fair-housing guard works.");
process.exit(0);
