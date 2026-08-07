import assert from "node:assert/strict";

import { automateProfessionalCredentialVerification } from "@/lib/auth/automatedProfessionalCredentialVerification";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL;
const originalKey = process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY;

async function main() {
  delete process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL;
  delete process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY;
  const unconfigured = await automateProfessionalCredentialVerification({
    fullLegalName: "Test Broker", email: "broker@example.com", role: "lender",
    credentialType: "broker license", credentialIdentifier: "ABC123",
    jurisdictionOrIssuer: "Fixture Authority",
  });
  assert.equal(unconfigured.status, "PROVIDER_NOT_CONFIGURED");

  process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL = "https://credential-verifier.invalid/verify";
  process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY = "fixture-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    verified: true, provider: "fixture-authoritative-source",
    officialSourceRef: "official://fixture/ABC123", fullLegalName: "Test Broker",
    credentialIdentifier: "ABC123", standing: "active",
    expiresAt: "2099-12-31T23:59:59.000Z",
  }), { status: 200, headers: { "content-type": "application/json" } });
  const verified = await automateProfessionalCredentialVerification({
    fullLegalName: "Test Broker", email: "broker@example.com", role: "lender",
    credentialType: "broker license", credentialIdentifier: "ABC123",
    jurisdictionOrIssuer: "Fixture Authority",
  });
  assert.equal(verified.status, "VERIFIED");
  assert.equal(verified.standing, "active");
  assert.match(verified.evidenceSha256 ?? "", /^[a-f0-9]{64}$/);

  globalThis.fetch = async () => new Response(JSON.stringify({
    verified: true, provider: "fixture-authoritative-source",
    officialSourceRef: "official://fixture/ABC123", fullLegalName: "Different Person",
    credentialIdentifier: "ABC123", standing: "active",
    expiresAt: "2099-12-31T23:59:59.000Z",
  }), { status: 200, headers: { "content-type": "application/json" } });
  const mismatch = await automateProfessionalCredentialVerification({
    fullLegalName: "Test Broker", email: "broker@example.com", role: "lender",
    credentialType: "broker license", credentialIdentifier: "ABC123",
    jurisdictionOrIssuer: "Fixture Authority",
  });
  assert.equal(mismatch.status, "INCONCLUSIVE");
  console.log(JSON.stringify({ ok: true, automatedDefault: true, exceptionOnlyOnInconclusive: true }, null, 2));
}
main().finally(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL;
  else process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_URL = originalUrl;
  if (originalKey === undefined) delete process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY;
  else process.env.PROFESSIONAL_CREDENTIAL_VERIFIER_API_KEY = originalKey;
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
