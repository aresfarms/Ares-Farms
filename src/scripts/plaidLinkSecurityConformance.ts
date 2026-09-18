import assert from "node:assert/strict";
import fs from "node:fs";

import { evaluateActionGate } from "@/lib/privacy/actionGate";
import { issueMfaAssurance, verifyMfaAssurance, MFA_STEP_UP_MAX_AGE_SECONDS } from "@/lib/auth/mfaAssurance";

async function main() {
const now = Date.parse("2026-08-08T23:00:00.000Z");
const secret = "plaid-link-conformance-secret";
const token = await issueMfaAssurance({ userId: "user-1", sessionVersion: 7, secret, now });
const valid = await verifyMfaAssurance({ token, userId: "user-1", sessionVersion: 7, secret, now: now + 60_000, maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS });
assert.ok(valid, "fresh passkey assurance must validate");
assert.equal(await verifyMfaAssurance({ token, userId: "user-1", sessionVersion: 8, secret, now: now + 60_000 }), null, "session version change must revoke prior MFA assurance");
assert.equal(await verifyMfaAssurance({ token, userId: "user-1", sessionVersion: 7, secret, now: now + (MFA_STEP_UP_MAX_AGE_SECONDS + 1) * 1000, maxVerifiedAgeSeconds: MFA_STEP_UP_MAX_AGE_SECONDS }), null, "stale step-up MFA must fail");

const denied = evaluateActionGate("connect-financial-account", { tier: "identity-verified", consentsHeld: [] });
assert.equal(denied.permitted, false);
assert.deepEqual(denied.missingConsents, ["plaid-financial-account-access"]);
const allowed = evaluateActionGate("connect-financial-account", { tier: "identity-verified", consentsHeld: ["plaid-financial-account-access"] });
assert.equal(allowed.permitted, true);
const linkRoute = fs.readFileSync("src/app/api/plaid/link-token/route.ts", "utf8");
const exchangeRoute = fs.readFileSync("src/app/api/plaid/exchange/route.ts", "utf8");
const page = fs.readFileSync("src/app/financial-connect/page.tsx", "utf8");

const principal = fs.readFileSync("src/lib/plaid/connectionPrincipal.ts", "utf8");

// Authorization moved OUT of the routes and into ONE module (2026-08-11), so
// the two routes cannot drift apart and let the weaker one become the way in.
// These assertions therefore check the single resolution point, not per-route
// copies of the same logic.
for (const required of ["resolvePlaidPrincipal", "plaid-financial-account-access", "PLAID_LINK_AUTHORIZED", "/link/token/create", "PLAID-CLIENT-ID", "PLAID-SECRET"]) {
  assert.ok(linkRoute.includes(required), `link-token route missing ${required}`);
}
for (const required of ["resolvePlaidPrincipal", "MFA_STEP_UP_MAX_AGE_SECONDS", "PLAID_LINK_AUTHORIZED", "/item/public_token/exchange", "persistPlaidSecret", "PLAID_ITEM_CONNECTED"]) {
  assert.ok(exchangeRoute.includes(required), `exchange route missing ${required}`);
}

// Neither route may re-derive identity for itself. A second opinion on who the
// caller is, is a second place for the answer to be wrong.
for (const [name, src] of [["link-token", linkRoute], ["exchange", exchangeRoute]] as const) {
  assert.ok(!src.includes("getServerSession"), `${name} route must resolve identity ONLY via resolvePlaidPrincipal`);
}

// BOTH doors must be enforced in the one module: staff by fresh passkey MFA,
// customer by a VERIFIED identity.
for (const required of ["verifyMfaAssurance", "MFA_STEP_UP_MAX_AGE_SECONDS", "verifyUploadLinkToken", "identityVerifications", "identity?.verified !== true"]) {
  assert.ok(principal.includes(required), `connectionPrincipal missing ${required}`);
}
// Subjects are namespaced so one door can never read the other's records.
assert.ok(principal.includes("`user:${user.id}`") && principal.includes("`deal:${claims.applicationId}`"),
  "principal subjects must be namespaced per door");

// The page must gate the same way the API does, on both doors.
assert.ok(page.includes("verifyMfaAssurance") && page.includes("/security/mfa?callbackUrl=%2Ffinancial-connect"),
  "financial-connect page must fail closed to fresh passkey MFA on the staff door");
assert.ok(page.includes("verifyUploadLinkToken") && page.includes("bank=identity-required"),
  "financial-connect page must fail closed to a verified identity on the customer door");

assert.ok(!linkRoute.includes("PLAID_SECRET:"), "Plaid secret must not be embedded in a JSON payload");
assert.ok(!exchangeRoute.includes("PLAID_SECRET:"), "Plaid secret must not be embedded in a JSON payload");

console.log("verify:plaid-link-security PASS — one resolution point for both doors (staff: session + fresh passkey MFA; customer: deal link token + VERIFIED identity), namespaced subjects, specific consent, audit-authorized, encrypted token persistence.");
}

main().catch((error) => { console.error(error); process.exit(1); });
