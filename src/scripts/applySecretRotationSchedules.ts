import { execFileSync } from "node:child_process";

import {
  rotationPeriodSeconds,
  secretRotationPolicy,
  validateSecretRotationPolicy,
} from "@/lib/security/secretRotationPolicy";

const execute = process.argv.includes("--execute");
const projectArgument = process.argv.find((argument) => argument.startsWith("--project="));
const project = projectArgument?.slice("--project=".length) || "furlong-staging-499102";
const topic = `projects/${project}/topics/furlong-secret-rotation-events`;
const now = new Date();
const issues = validateSecretRotationPolicy();
if (issues.length) throw new Error(`Invalid secret rotation policy: ${issues.join("; ")}`);

function nextRotationTime(days: number): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

const schedule = secretRotationPolicy.secrets.map((entry) => ({
  secretName: entry.name,
  tier: entry.tier,
  rotationDays: secretRotationPolicy.tiers[entry.tier].rotationDays,
  rotationPeriodSeconds: rotationPeriodSeconds(entry),
  nextRotationTime: nextRotationTime(secretRotationPolicy.tiers[entry.tier].rotationDays),
  automation: entry.automation,
}));

if (execute) {
  for (const entry of schedule) {
    execFileSync("gcloud", [
      "secrets", "update", entry.secretName,
      `--project=${project}`,
      `--add-topics=${topic}`,
      `--next-rotation-time=${entry.nextRotationTime}`,
      `--rotation-period=${entry.rotationPeriodSeconds}s`,
      "--quiet",
    ], { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"] });
  }
}

console.log(JSON.stringify({
  ok: true,
  mode: execute ? "EXECUTED" : "PLAN_ONLY",
  project,
  generatedAt: now.toISOString(),
  emergency: secretRotationPolicy.emergency,
  scheduledSecretCount: schedule.length,
  excludedIdentityMetadata: secretRotationPolicy.identityMetadataExcludedFromValueRotation,
  schedule,
  secretValuesAccessed: false,
}, null, 2));
