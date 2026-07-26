import { spawnSync } from "node:child_process";

const REQUIRED_CHECKS = [
  "verify:internal-change-verification",
  "verify:three-founder-release-authority",
  "verify:founder-change-review-workspace",
  "verify:founder-pilot-test-gate",
  "verify:property-profile-classification",
  "verify:customer-property-experience",
  "verify:final-production-promotion-decision",
] as const;

for (const check of REQUIRED_CHECKS) {
  const result = spawnSync("npm", ["run", check], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Integrated pre-promotion check failed: ${check}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  rule: "INTEGRATED-PRE-PROMOTION-FEATURE-SUITE-001",
  checks: REQUIRED_CHECKS,
  ownerSelfApprovalBlocked: true,
  publicLaunchStillBlocked: true,
  liveActionsStillBlocked: true,
  unsupportedPropertyRankingsBlocked: true,
  unmatchedParcelFallbackBlocked: true,
  promotionPerformed: false,
}, null, 2));
