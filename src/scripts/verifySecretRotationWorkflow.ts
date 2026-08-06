import assert from "node:assert/strict";

import {
  executeSecretRotation,
  type ReplacementCredential,
  type SecretRotationDependencies,
  type SecretRotationRequest,
} from "@/lib/security/secretRotationWorkflow";
import { validateSecretRotationPolicy } from "@/lib/security/secretRotationPolicy";

type Calls = {
  alerted: string[];
  disabled: string[];
  revoked: string[];
  rolledBack: string[];
  retirements: Array<{ request: SecretRotationRequest; runAt: string }>;
};

function dependencies(input: Readonly<{
  supported: boolean;
  failValidation?: boolean;
  now?: string;
}>): { calls: Calls; dependencies: SecretRotationDependencies } {
  const calls: Calls = { alerted: [], disabled: [], revoked: [], rolledBack: [], retirements: [] };
  const replacement: ReplacementCredential = {
    value: "test-only-value-never-emitted",
    providerCredentialId: "provider:new",
    previousProviderCredentialId: "provider:old",
    providerEventReference: "provider-event:test",
  };
  return {
    calls,
    dependencies: {
      now: () => new Date(input.now ?? "2026-08-06T12:00:00Z"),
      supports: () => input.supported,
      currentEnabledVersion: async () => "7",
      createProviderCredential: async () => replacement,
      addSecretVersion: async () => "8",
      validateReplacement: async () => {
        if (input.failValidation) throw new Error("replacement validation failed");
        return ["replacement:pass"];
      },
      rolloutConsumers: async () => ["revision:test"],
      validateConsumers: async () => ["health:pass"],
      rollbackConsumers: async (entry) => { calls.rolledBack.push(entry.name); },
      disableSecretVersion: async (_name, version) => { calls.disabled.push(version); },
      revokeProviderCredential: async (_entry, credentialId) => { calls.revoked.push(credentialId); },
      scheduleRetirement: async (request, runAt) => { calls.retirements.push({ request, runAt }); },
      recordActivationEvidence: async () => undefined,
      recordCompletionEvidence: async () => undefined,
      alertFailure: async ({ reason }) => { calls.alerted.push(reason); },
    },
  };
}

async function main(): Promise<void> {
assert.deepEqual(validateSecretRotationPolicy(), []);

const internal = dependencies({ supported: true });
const internalResult = await executeSecretRotation({
  secretName: "STAGING_SEED_SHARED_SECRET",
  reason: "SCHEDULED",
  phase: "ACTIVATE",
  requestedAt: "2026-08-06T12:00:00Z",
}, internal.dependencies);
assert.equal(internalResult.ok, true);
assert.equal(internalResult.state, "AWAITING_RETIREMENT");
assert.equal(JSON.stringify(internalResult).includes("test-only-value-never-emitted"), false);
assert.equal(internal.calls.retirements.length, 1);
assert.equal(internal.calls.retirements[0].runAt, "2026-08-07T12:00:00.000Z");

const unsupported = dependencies({ supported: false });
const unsupportedResult = await executeSecretRotation({
  secretName: "ANTHROPIC_API_KEY",
  reason: "SCHEDULED",
  phase: "ACTIVATE",
  requestedAt: "2026-08-06T12:00:00Z",
}, unsupported.dependencies);
assert.equal(unsupportedResult.ok, false);
assert.equal(unsupportedResult.acknowledgeSourceEvent, false);
assert.equal(unsupported.calls.alerted.length, 1);

const failed = dependencies({ supported: true, failValidation: true });
const failedResult = await executeSecretRotation({
  secretName: "AIRNOW_API_KEY",
  reason: "OPERATOR_REQUEST",
  phase: "ACTIVATE",
  requestedAt: "2026-08-06T12:00:00Z",
}, failed.dependencies);
assert.equal(failedResult.state, "FAILED_ROLLED_BACK");
assert.deepEqual(failed.calls.disabled, ["8"]);
assert.deepEqual(failed.calls.revoked, ["provider:new"]);
assert.deepEqual(failed.calls.rolledBack, ["AIRNOW_API_KEY"]);

const emergency = dependencies({ supported: true });
const emergencyResult = await executeSecretRotation({
  secretName: "AIRNOW_API_KEY",
  reason: "SUSPECTED_DISCLOSURE",
  phase: "ACTIVATE",
  requestedAt: "2026-08-06T12:00:00Z",
}, emergency.dependencies);
assert.equal(emergencyResult.state, "AWAITING_RETIREMENT");
assert.equal(emergency.calls.retirements[0].runAt, "2026-08-06T12:00:00.000Z");

const retirement = dependencies({ supported: true });
const retirementResult = await executeSecretRotation({
  secretName: "AIRNOW_API_KEY",
  reason: "SCHEDULED",
  phase: "RETIRE",
  requestedAt: "2026-08-06T12:00:00Z",
  rotationId: "rotation:test",
  activatedVersion: "8",
  previousVersion: "7",
  providerCredentialId: "provider:new",
  previousProviderCredentialId: "provider:old",
}, retirement.dependencies);
assert.equal(retirementResult.state, "COMPLETE");
assert.deepEqual(retirement.calls.disabled, ["7"]);
assert.deepEqual(retirement.calls.revoked, ["provider:old"]);

console.log(JSON.stringify({
  ok: true,
  policyIssues: [],
  scenarios: [
    "scheduled-internal-activation",
    "unsupported-provider-fail-closed",
    "activation-failure-rollback",
    "suspected-disclosure-immediate-retirement",
    "overlap-retirement-completion"
  ],
  secretValuesDisplayed: false,
}, null, 2));
}

void main();
