import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const FILES = [
  "src/lib/property/propertyBriefIntelligence.ts",
  "src/lib/property/riverRoadCuratedIntelligence.ts",
  "src/components/property/PropertyCommandCenter.tsx",
  "src/components/property/PropertyEvaluationWorkspace.tsx",
  "src/components/discovery/PlaceFirstDiscovery.tsx",
];

const banned = [
  { pattern: /\d+ in the county(?:[^\n]*in \w+)?/, reason: "School headlines must name schools, not show count-only geography." },
  { pattern: /avg bill ~\$/, reason: "Statewide average bills must not be presented as a property estimate." },
  { pattern: /no separate readiness ceremony or placeholder pro forma/i, reason: "Internal implementation language must not appear in customer copy." },
  { pattern: /Named school directory available/i, reason: "Private-school headlines must name schools rather than advertise directory availability." },
];

const violations: string[] = [];
for (const rel of FILES) {
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const rule of banned) {
    if (rule.pattern.test(text)) violations.push(`${rel}: ${rule.reason}`);
  }
}

const brief = fs.readFileSync(path.join(ROOT, "src/lib/property/propertyBriefIntelligence.ts"), "utf8");
const directSchoolBuilders = (brief.match(/label:\s*"Schools"/g) ?? []).length;
if (directSchoolBuilders !== 2) {
  violations.push(`propertyBriefIntelligence.ts: expected one shared verified Schools builder plus one unresolved Schools label; found ${directSchoolBuilders}.`);
}
if ((brief.match(/publicSchoolsFact\(/g) ?? []).length !== 3) {
  violations.push("propertyBriefIntelligence.ts: both property-intelligence paths must call the shared publicSchoolsFact builder.");
}

if (violations.length) {
  console.error(JSON.stringify({ ok: false, violations }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, rule: "PROPERTY-REPORT-COPY-INTEGRITY-001", files: FILES.length }, null, 2));
