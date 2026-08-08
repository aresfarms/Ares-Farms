import assert from "node:assert/strict";
import { plaidAtRestEncryptionReady, verifyPlaidEncryptionPrimitive } from "@/lib/plaid/secureDataStore";

assert.equal(plaidAtRestEncryptionReady(), true, "Plaid at-rest encryption key/version must be configured.");
assert.equal(verifyPlaidEncryptionPrimitive(), true, "Plaid AES-256-GCM envelope round-trip failed.");
console.log("verify:plaid-at-rest-encryption PASS — AES-256-GCM envelope encryption configured; plaintext sentinel not present in ciphertext.");
