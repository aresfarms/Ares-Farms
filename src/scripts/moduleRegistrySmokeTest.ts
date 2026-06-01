import fs from "fs";
import path from "path";

import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { moduleFeatureFlagsComplete } from "@/lib/modules/featureFlagGovernance";

/**
 * Module Registry Smoke Test
 *
 * Verifies that every vertical surface has a complete module manifest matching
 * the supplemental integration requirements.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function routeFileExists(route: string): boolean {
  const routePath = route === "/" ? "src/app/page.tsx" : `src/app${route}/page.tsx`;

  return fs.existsSync(path.join(repoRoot, routePath));
}

function main() {
  const ids = new Set<string>();

  for (const manifest of moduleManifests) {
    assert(manifest.id.trim().length > 0, "Manifest id is required.");
    assert(!ids.has(manifest.id), `Duplicate manifest id: ${manifest.id}`);
    ids.add(manifest.id);

    assert(manifest.route.startsWith("/"), `${manifest.id} route must be absolute.`);
    assert(routeFileExists(manifest.route), `${manifest.id} route file is missing.`);
    assert(manifest.audience.length > 0, `${manifest.id} audience is required.`);
    assert(manifest.permissions.length > 0, `${manifest.id} permissions are required.`);
    assert(
      manifest.dataDependencies.length > 0,
      `${manifest.id} dataDependencies are required.`
    );
    assert(
      manifest.requiredGovernance.length > 0,
      `${manifest.id} requiredGovernance is required.`
    );
    assert(
      manifest.requiredGovernance.includes("CANON-CLASS-001") &&
        manifest.requiredGovernance.includes("TECH-LEDGER-001") &&
        manifest.requiredGovernance.includes("TECH-REPLAY-001"),
      `${manifest.id} must carry classification, ledger, and replay governance.`
    );
    assert(
      typeof manifest.publicSurfaceAllowed === "boolean",
      `${manifest.id} publicSurfaceAllowed is required.`
    );
    assert(
      typeof manifest.productionBlocked === "boolean",
      `${manifest.id} productionBlocked is required.`
    );
    assert(
      manifest.claimsProfile.trim().length > 0,
      `${manifest.id} claimsProfile is required.`
    );
    assert(
      typeof manifest.replayRequired === "boolean",
      `${manifest.id} replayRequired is required.`
    );
    assert(
      moduleFeatureFlagsComplete(manifest.featureFlags),
      `${manifest.id} feature flags are incomplete.`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        manifestCount: moduleManifests.length,
        message: "Module manifest registry smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
