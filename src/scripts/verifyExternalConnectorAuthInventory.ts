/**
 * External connector authentication inventory verification.
 *
 * Master Volume traceability:
 * - Vol II: provider credentials remain separated from Google identities.
 * - Vol III / III-B: workloads use attached or federated identities and no
 *   downloaded Google service-account keys.
 * - Vol V: every inventoried external credential has one deterministic auth
 *   classification for audit and replay.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SecretInventory = { secrets: Array<{ name: string }> };
type AuthInventory = {
  googleCloudIdentityPosture: {
    cloudRunAndJobs: string;
    githubToGoogleCloud: string;
    downloadedServiceAccountKeysAllowed: boolean;
  };
  authenticationClasses: Array<{ class: string; secretNames: string[] }>;
};

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;

const secrets = readJson<SecretInventory>(
  "config/security/external-secret-inventory.json",
).secrets.map((entry) => entry.name);
const auth = readJson<AuthInventory>(
  "config/security/external-connector-auth-inventory.json",
);

assert.equal(auth.googleCloudIdentityPosture.cloudRunAndJobs, "ATTACHED_SERVICE_ACCOUNT");
assert.equal(auth.googleCloudIdentityPosture.githubToGoogleCloud, "WORKLOAD_IDENTITY_FEDERATION");
assert.equal(auth.googleCloudIdentityPosture.downloadedServiceAccountKeysAllowed, false);

const classified = auth.authenticationClasses.flatMap((entry) => entry.secretNames);
assert.equal(new Set(classified).size, classified.length, "A secret is classified more than once.");
assert.deepEqual([...classified].sort(), [...secrets].sort(), "Every external secret must be classified exactly once.");
assert.ok(!auth.authenticationClasses.some((entry) => /service.?account.?key/i.test(entry.class)));

console.log(JSON.stringify({
  ok: true,
  gate: "verify-external-connector-auth-inventory-v1",
  classifiedSecretCount: classified.length,
  authenticationClassCount: auth.authenticationClasses.length,
  downloadedGoogleServiceAccountKeysAllowed: false,
}, null, 2));
