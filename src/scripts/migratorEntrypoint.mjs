import { spawnSync } from "node:child_process";

const steps = [
  "/app/applyCanonicalGovernanceMigration.cjs",
  "/app/applyRuntimeDatabaseGrants.cjs",
];

for (const step of steps) {
  const result = spawnSync(process.execPath, [step], {
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(`Migrator step failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
