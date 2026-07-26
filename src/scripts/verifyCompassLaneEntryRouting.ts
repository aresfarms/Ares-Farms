import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const compassPath = path.join(root, "src/components/public/InteractiveCompassRose.tsx");
const source = fs.readFileSync(compassPath, "utf8");
const discoverySource = fs.readFileSync(path.join(root, "src/components/discovery/PlaceFirstDiscovery.tsx"), "utf8");
const failures: string[] = [];

for (const lane of ["property-land", "farms-agriculture", "small-business-growth"]) {
  if (!source.includes(`"${lane}"`)) failures.push(`Property lane ${lane} is missing from the property-discovery allowlist.`);
}
for (const lane of ["environmental-compliance", "financing-capital", "programs-incentives", "not-sure"]) {
  if (source.includes(`flow=property-discovery&lens=${lane}`)) failures.push(`${lane} still routes into property address intake.`);
}
if (!source.includes('return `/explore?lane=${encodeURIComponent(l.slug)}`')) failures.push("Non-property compass lanes do not route to their own modules.");
if (!source.includes("PROPERTY_DISCOVERY_LANES.has(l.slug)")) failures.push("Property-discovery routing is not explicitly allowlisted.");
if (!source.includes('/brand/furlong-ship-emblem.png')) failures.push("The rose compass is not using the ship emblem.");
if (source.includes('/brand/furlong-emblem.png')) failures.push("The lighthouse/property emblem leaked into the rose compass.");
if (!discoverySource.includes("if (result && analysisHref)")) failures.push("Successful property lookup does not route directly to results.");
if (discoverySource.includes("(compact || embedded) && result && analysisHref")) failures.push("Direct results routing is still limited to selected page variants.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "COMPASS-LANE-ENTRY-ROUTING-001", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  rule: "COMPASS-LANE-ENTRY-ROUTING-001",
  propertyLanesUseAddressIntake: true,
  environmentalUsesOwnModule: true,
  financingUsesOwnModule: true,
  grantsUsesOwnModule: true,
  taxesUsesOwnModule: true,
  shipEmblemOnRoseCompass: true,
  successfulAddressLookupOpensResultsDirectly: true,
}, null, 2));
