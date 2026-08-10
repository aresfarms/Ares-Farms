import assert from "node:assert/strict";
import fs from "node:fs";

import {
  assertSyntheticFixtureLineage,
  bindSyntheticFixtureLineage,
  createSyntheticFixtureContext,
  expectedStripeMethodForSyntheticScenario,
  issueSyntheticFixtureSessionToken,
  syntheticFixtureContextFromProviderMetadata,
  syntheticStripeMethodMatches,
  syntheticFixtureProviderMetadata,
  verifySyntheticFixtureSessionToken,
} from "@/lib/testing/syntheticFixtureLineage";
import {
  SYNTHETIC_FIXTURE_REGISTRY_VERSION,
  SYNTHETIC_PERSONAS,
  syntheticPersonaByHumanVisibleName,
} from "@/lib/testing/syntheticPersonaRegistry";

const original = {
  environment: process.env.FURLONG_DEPLOYMENT_ENVIRONMENT,
  enabled: process.env.SYNTHETIC_FIXTURES_ENABLED,
  allowlist: process.env.SYNTHETIC_FIXTURE_OPERATOR_ALLOWLIST,
};

try {
  process.env.FURLONG_DEPLOYMENT_ENVIRONMENT = "staging";
  process.env.SYNTHETIC_FIXTURES_ENABLED = "true";
  process.env.SYNTHETIC_FIXTURE_OPERATOR_ALLOWLIST = "chudson@aresfarmsinc.com";

  const requiredNames = [
    "Pocohantus Smith",
    "Tree Frog",
    "Tuna Fish",
    "Purple Cow",
    "Rainbow Trout",
    "Sam Oranutang",
    "Sammy Snake",
    "Frank Furter",
    "Hound Dog",
    "Shark Bait",
    "Caitlin Hudson",
  ];
  assert.deepEqual(
    SYNTHETIC_PERSONAS.map((persona) => persona.humanVisibleName),
    requiredNames,
  );
  for (const name of requiredNames) {
    const persona = syntheticPersonaByHumanVisibleName(name);
    assert(persona, `Missing synthetic persona for ${name}.`);
    assert(persona.syntheticPersonaId.startsWith("syn-"));
    assert(persona.fixtureVersion.includes("v1.0.0"));
    assert(persona.scenarioIds.length > 0);
  }

  const legacyPersonas = SYNTHETIC_PERSONAS.filter(
    (persona) => persona.activationMode === "LEGACY_BACKFILL_ONLY",
  );
  assert.equal(
    legacyPersonas.length,
    6,
    "Six exact legacy broker-test personas must be backfill-only.",
  );
  assert.throws(
    () =>
      createSyntheticFixtureContext({
        syntheticPersonaId: "syn-founder-smoke-legacy-001",
        scenarioId: "lender-intake",
        operatorIdentity: "chudson@aresfarmsinc.com",
        environment: "staging",
      }),
    /restricted to founder-authorized backfill/i,
  );
  const legacyBackfillContext = createSyntheticFixtureContext({
    syntheticPersonaId: "syn-founder-smoke-legacy-001",
    scenarioId: "lender-intake",
    operatorIdentity: "chudson@aresfarmsinc.com",
    environment: "staging",
    testRunId: "legacy-founder-smoke-conformance-001",
    createdAt: "2026-07-27T05:35:53.198Z",
    allowLegacyBackfill: true,
  });
  assert.equal(legacyBackfillContext.humanVisibleName, "Caitlin Hudson");

  const context = createSyntheticFixtureContext({
    syntheticPersonaId: "syn-tree-frog-001",
    scenarioId: "lender-intake",
    operatorIdentity: "chudson@aresfarmsinc.com",
    environment: "staging",
    testRunId: "synth-tree-frog-conformance-001",
    createdAt: "2026-08-09T12:00:00.000Z",
  });
  assert.equal(context.registryVersion, SYNTHETIC_FIXTURE_REGISTRY_VERSION);
  assert.equal(context.testOnly, true);
  assert.equal(context.operatorIdentity, "user:chudson@aresfarmsinc.com");

  const first = bindSyntheticFixtureLineage(
    context,
    "service_request",
    "FIN-SYNTHETIC-001",
  );
  const second = bindSyntheticFixtureLineage(
    context,
    "service_request",
    "FIN-SYNTHETIC-001",
  );
  assert.equal(first.lineageSha256, second.lineageSha256);
  assert.match(first.lineageSha256, /^[a-f0-9]{64}$/);
  assertSyntheticFixtureLineage(first);
  assert.throws(() =>
    assertSyntheticFixtureLineage({
      ...first,
      humanVisibleName: "Not Tree Frog",
    }),
  );

  const providerMetadata = syntheticFixtureProviderMetadata(context);
  const providerRoundTrip =
    syntheticFixtureContextFromProviderMetadata(providerMetadata);
  assert(providerRoundTrip);
  assert.equal(providerRoundTrip.testRunId, context.testRunId);
  assert.equal(
    providerRoundTrip.syntheticPersonaId,
    context.syntheticPersonaId,
  );
  assert.equal(expectedStripeMethodForSyntheticScenario("stripe-card"), "card");
  assert.equal(
    expectedStripeMethodForSyntheticScenario("stripe-apple-pay"),
    "apple_pay",
  );
  assert.equal(
    expectedStripeMethodForSyntheticScenario("stripe-google-pay"),
    "google_pay",
  );
  assert.equal(syntheticStripeMethodMatches("stripe-card", null), true);
  assert.equal(syntheticStripeMethodMatches("stripe-card", "apple_pay"), false);
  assert.equal(
    syntheticStripeMethodMatches("stripe-apple-pay", "apple_pay"),
    true,
  );
  assert.equal(
    syntheticStripeMethodMatches("stripe-apple-pay", "google_pay"),
    false,
  );

  const sessionSecret = "synthetic-fixture-conformance-secret-32-bytes";
  const signed = issueSyntheticFixtureSessionToken(context, sessionSecret, 300);
  const verified = verifySyntheticFixtureSessionToken(
    signed,
    sessionSecret,
    "chudson@aresfarmsinc.com",
  );
  assert(verified);
  assert.equal(verified.testRunId, context.testRunId);
  assert.equal(
    verifySyntheticFixtureSessionToken(
      signed,
      sessionSecret,
      "someone@example.com",
    ),
    null,
  );

  process.env.FURLONG_DEPLOYMENT_ENVIRONMENT = "production";
  assert.throws(() =>
    createSyntheticFixtureContext({
      syntheticPersonaId: "syn-tree-frog-001",
      scenarioId: "lender-intake",
      operatorIdentity: "chudson@aresfarmsinc.com",
      environment: "production",
    }),
  );
  assert.equal(
    verifySyntheticFixtureSessionToken(
      signed,
      sessionSecret,
      "chudson@aresfarmsinc.com",
    ),
    null,
  );
  assert.throws(() =>
    syntheticFixtureContextFromProviderMetadata(providerMetadata),
  );

  assert(
    fs.existsSync("docs/security/SYNTHETIC_FIXTURE_LINEAGE_001.md"),
    "Synthetic fixture doctrine/runbook must exist.",
  );
  const migration = fs.readFileSync(
    "src/lib/db/migrations/0053_synthetic_fixture_lineage.sql",
    "utf8",
  );
  const financingRoute = fs.readFileSync(
    "src/app/api/financing/intake/route.ts",
    "utf8",
  );
  const dealDeskStore = fs.readFileSync(
    "src/lib/lender/dealDeskStore.ts",
    "utf8",
  );
  const stripeCheckout = fs.readFileSync(
    "src/app/api/stripe/checkout/route.ts",
    "utf8",
  );
  const plaidExchange = fs.readFileSync(
    "src/app/api/plaid/exchange/route.ts",
    "utf8",
  );
  assert(migration.includes("BEFORE UPDATE OR DELETE"));
  assert(migration.includes("synthetic_fixture_lineage_records"));
  assert(financingRoute.includes("syntheticPersonaByHumanVisibleName"));
  assert(financingRoute.includes("externalNotificationSuppressed"));
  assert(dealDeskStore.includes("synthetic-fixture-notification-suppressed"));
  assert(stripeCheckout.includes("syntheticFixtureContext"));
  assert(
    fs
      .readFileSync("src/app/api/stripe/webhook/route.ts", "utf8")
      .includes("SYNTHETIC_PAYMENT_METHOD_MISMATCH"),
  );
  assert(plaidExchange.includes("synthetic-fixture lineage"));
  assert(
    fs
      .readFileSync("src/lib/lender-submission/store.ts", "utf8")
      .includes("lender-submission.delivery"),
  );
  assert(
    fs
      .readFileSync("src/lib/documents/documentStore.ts", "utf8")
      .includes("application_document"),
  );
  assert(
    fs
      .readFileSync("src/instrumentation.ts", "utf8")
      .includes("Production startup refused"),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        registryVersion: SYNTHETIC_FIXTURE_REGISTRY_VERSION,
        personas: requiredNames,
        requiredLineageFields: [
          "syntheticPersonaId",
          "testRunId",
          "fixtureVersion",
          "environment",
          "operatorIdentity",
          "createdAt",
        ],
        deterministicHash: first.lineageSha256,
        productionBlocked: true,
        notificationSuppressionVerified: true,
        providerMetadataRoundTrip: true,
      },
      null,
      2,
    ),
  );
} finally {
  if (original.environment === undefined) {
    delete process.env.FURLONG_DEPLOYMENT_ENVIRONMENT;
  } else process.env.FURLONG_DEPLOYMENT_ENVIRONMENT = original.environment;
  if (original.enabled === undefined) {
    delete process.env.SYNTHETIC_FIXTURES_ENABLED;
  } else process.env.SYNTHETIC_FIXTURES_ENABLED = original.enabled;
  if (original.allowlist === undefined) {
    delete process.env.SYNTHETIC_FIXTURE_OPERATOR_ALLOWLIST;
  } else process.env.SYNTHETIC_FIXTURE_OPERATOR_ALLOWLIST = original.allowlist;
}
