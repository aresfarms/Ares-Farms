import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { composePublicAlphaSignoffCeremonyPacket } from "@/lib/governance/publicAlphaSignoffCeremonyPacket";
import { parseClassificationChangeRegistry } from "@/lib/build-self-report/classificationChangeRegistry";
import { securityHardeningStatus } from "@/security/securityHardeningManifest";

type OperationalCondition = {
  conditionId: string;
  status: "PASS" | "PENDING" | "BLOCKED";
  owner: string;
  evidenceRef: string | null;
  nextAction: string;
};

type OperationalEvidence = {
  schemaVersion: string;
  updatedAt: string;
  purpose: string;
  conditions: OperationalCondition[];
  alphaOnlyGuardrails: Record<string, boolean | number>;
};

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const doctrine = read("docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md");
const registryMarkdown = read("docs/CLASSIFICATION_CHANGE_REGISTRY.md");
const registry = parseClassificationChangeRegistry(registryMarkdown);
const annex = JSON.parse(
  read("docs/governance/VOL_VII_OPERATIONAL_ANNEX.json"),
) as {
  module45RolesNotInAlpha?: Array<{
    roleId: string;
    reason: string;
    category: string;
    ccrRef?: string;
  }>;
};
const operational = JSON.parse(
  read("docs/governance/PUBLIC_ALPHA_OPERATIONAL_EVIDENCE.json"),
) as OperationalEvidence;
const acceptanceSource = read("src/lib/acceptance/namedTesterAcceptance.ts");
const ceremony = composePublicAlphaSignoffCeremonyPacket({
  generatedAt: "2026-09-30T22:47:00.000Z",
});
const security = securityHardeningStatus();

// TECH-TEST-001 / CONST-RESILIENCE-001: the verifier must recognize the
// signed Module 21 decision without accepting another module's FEATURED state.
// Regex literals need one escape, not the double escapes used in strings.
const module21FeaturedPattern =
  /Environmental-compliance \(Module 21\)\*\*:[ \t]*\*\*FEATURED\*\*/;
const featuredDecisionFixture =
  "3. **Environmental-compliance (Module 21)**: **FEATURED** — independent review required.";
assert.match(featuredDecisionFixture, module21FeaturedPattern);
assert.doesNotMatch(
  featuredDecisionFixture.replace("**FEATURED**", "**DEFERRED**"),
  module21FeaturedPattern,
);
assert.doesNotMatch(
  featuredDecisionFixture.replace("Module 21", "Module 22"),
  module21FeaturedPattern,
);
assert.doesNotMatch(
  featuredDecisionFixture.replace("**FEATURED**", "**DEFERRED**") +
    "\n4. **Another module**: **FEATURED**",
  module21FeaturedPattern,
);
assert.match(
  doctrine,
  module21FeaturedPattern,
  "Signed Public Alpha doctrine must keep Module 21 FEATURED.",
);
assert.match(
  doctrine,
  /qualified independent environmental reviewer is assigned/,
  "Signed doctrine must preserve the independent environmental reviewer prerequisite.",
);

assert.equal(ceremony.ownerDecisionRecordCount, 5);
assert.equal(ceremony.reviewDecisionCount, 0);
assert.equal(ceremony.publicAlphaStatus, "PENDING_SIGNOFF");
assert.equal(ceremony.productionStatus, "BLOCKED");
assert.equal(ceremony.productionAuthorizationGranted, false);
assert.equal(ceremony.externalActionsPermitted, false);

const environmentalDecision = ceremony.decisions.find(
  (x) =>
    x.decisionId ===
    "module_21_environmental_compliance_featured_or_deferred",
);
assert.ok(environmentalDecision);
assert.match(environmentalDecision.ownerRecordedDecision, /FEATURED/);
assert.match(
  environmentalDecision.ownerRecordedDecision,
  /qualified independent environmental reviewer/,
);
assert.match(environmentalDecision.ownerRecordedDecision, /2-of-3 founder sign-off/);

assert.equal(registry.ok, true, registry.error ?? "CCR registry must parse.");
const ccr002 = registry.allEntries.find((x) => x.id === "CCR-2026-002");
const ccr005 = registry.allEntries.find((x) => x.id === "CCR-2026-005");
assert.equal(ccr002?.status, "RESOLVED");
assert.equal(ccr005?.status, "ACTIVE");
assert.match(ccr005?.newState ?? "", /FEATURED in Public Alpha/);
assert.match(ccr005?.newState ?? "", /qualified independent environmental reviewer/);

const environmentalRole = annex.module45RolesNotInAlpha?.find(
  (x) => x.roleId === "ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER",
);
assert.ok(environmentalRole);
assert.equal(environmentalRole.category, "HELD_FOR_ALPHA");
assert.equal(environmentalRole.ccrRef, "CCR-2026-005");
assert.match(environmentalRole.reason, /FEATURED for Public Alpha/);
assert.doesNotMatch(environmentalRole.reason, /deferred from Alpha/i);
assert.match(environmentalRole.reason, /may not self-clear/);

assert.equal(
  security.alphaBlockingOpen.length,
  0,
  `Technical Alpha security blockers remain open: ${security.alphaBlockingOpen.join(", ")}`,
);

assert.doesNotMatch(
  acceptanceSource,
  /furlong-core-00107-6z7/,
  "Named-tester acceptance must not retain the July target fallback.",
);
assert.match(
  acceptanceSource,
  /process\.env\.K_REVISION/,
  "Named-tester acceptance must bind to the current Cloud Run revision.",
);
assert.match(
  acceptanceSource,
  /P6_NAMED_TESTER_TARGET_IMAGE_DIGEST/,
  "Named-tester acceptance must require the immutable target digest.",
);
assert.match(
  acceptanceSource,
  /Named-tester acceptance is unavailable until the current immutable image digest is bound/,
  "Named-tester acceptance must fail closed when the current digest is not bound.",
);

assert.equal(
  operational.schemaVersion,
  "public-alpha-operational-evidence-v1",
);
const requiredOperationalIds = [
  "internal_acceptance",
  "participant_terms",
  "environmental_independent_reviewer",
  "environmental_founder_quorum",
  "security_human_review",
].sort();
assert.deepEqual(
  operational.conditions.map((x) => x.conditionId).sort(),
  requiredOperationalIds,
);
for (const condition of operational.conditions) {
  assert.ok(["PASS", "PENDING", "BLOCKED"].includes(condition.status));
  assert.ok(condition.owner.trim().length > 0);
  assert.ok(condition.nextAction.trim().length > 0);
  if (condition.status === "PASS") {
    assert.ok(
      condition.evidenceRef,
      `${condition.conditionId} cannot PASS without an evidence reference.`,
    );
  }
}

assert.equal(operational.alphaOnlyGuardrails.invitationOnly, true);
assert.equal(operational.alphaOnlyGuardrails.paymentsRemainOff, true);
assert.equal(
  operational.alphaOnlyGuardrails.liveExternalRegulatedActionsRemainOff,
  true,
);
assert.equal(operational.alphaOnlyGuardrails.publicDnsCutoverRemainOff, true);
assert.equal(operational.alphaOnlyGuardrails.openSignupRemainOff, true);
assert.equal(operational.alphaOnlyGuardrails.productionAuthorization, false);

const dr = ceremony.entryConditions.find((x) => x.conditionId === "dr_restore");
assert.equal(dr?.status, "PASS");
assert.ok(dr?.evidenceRef);

const operationalBlockers = operational.conditions
  .filter((x) => x.status !== "PASS")
  .map((x) => ({
    id: x.conditionId,
    status: x.status,
    owner: x.owner,
    nextAction: x.nextAction,
  }));

const ceremonyStatus: string = ceremony.publicAlphaStatus;
const ceremonyBlocker =
  ceremonyStatus === "PASS"
    ? []
    : [
        {
          id: "public_alpha_ceremony_signoff",
          status: ceremony.publicAlphaStatus,
          owner: "Owner + independent reviewer",
          nextAction:
            "Complete the governed Public Alpha ceremony after the operational evidence conditions are satisfied.",
        },
      ];

const launchBlockers = [...operationalBlockers, ...ceremonyBlocker];
const launchReady =
  launchBlockers.length === 0 &&
  security.alphaBlockingOpen.length === 0 &&
  ceremony.productionStatus === "BLOCKED";

const result = {
  ok: true,
  rule: "PUBLIC-ALPHA-LAUNCH-RECONCILIATION-001",
  currentPhase: launchReady
    ? "READY_FOR_INVITATION_ONLY_PUBLIC_ALPHA"
    : "INTERNAL_ACCEPTANCE_AND_ALPHA_EVIDENCE",
  technicalAlphaSecurityBlockers: security.alphaBlockingOpen,
  technicalAlphaStructureReady: security.alphaBlockingOpen.length === 0,
  ownerDecisionsRecorded: ceremony.ownerDecisionRecordCount,
  drRestoreEvidence: "PASS",
  operationalConditions: operational.conditions,
  publicAlphaCeremonyStatus: ceremony.publicAlphaStatus,
  launchBlockerCount: launchBlockers.length,
  launchBlockers,
  launchReady,
  productionStatus: ceremony.productionStatus,
  productionAuthorizationGranted: ceremony.productionAuthorizationGranted,
  alphaGuardrails: operational.alphaOnlyGuardrails,
};

console.log(JSON.stringify(result, null, 2));

if (process.argv.includes("--require-ready") && !launchReady) {
  process.exit(1);
}
