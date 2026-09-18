import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const doctrine = fs.readFileSync(path.join(root, "docs/DOCTRINE_PROGRESSIVE_INTELLIGENCE_V1.md"), "utf8");
const panel = fs.readFileSync(path.join(root, "src/components/property/ProgressiveIntelligencePanel.tsx"), "utf8");
const chassis = fs.readFileSync(path.join(root, "src/components/property/lanes/GovernedLaneChassis.tsx"), "utf8");
const answer = fs.readFileSync(path.join(root, "src/components/property/FurlongAnswerCard.tsx"), "utf8");
const comparison = fs.readFileSync(path.join(root, "src/components/property/PropertyComparison.tsx"), "utf8");

const failures: string[] = [];
const requiredDoctrine = [
  "Find → Reveal → Question → Investigate → Verify → Unlock → Compare → Shortlist → Improve → Measure → Learn → Discover",
  "withhold a known conclusion",
  "missing evidence as zero",
  "The loop does not end at acquisition",
  "Actuals must never silently overwrite the original baseline",
];
for (const phrase of requiredDoctrine) if (!doctrine.includes(phrase)) failures.push("Doctrine missing: " + phrase);

for (const phrase of [
  "What you have discovered",
  "Still undiscovered",
  "Unlock next",
  "Opportunity signal",
  "Furlong does not manufacture a completion score",
]) if (!panel.includes(phrase)) failures.push("Progressive Intelligence panel missing: " + phrase);

if (!chassis.includes("<ProgressiveIntelligencePanel")) failures.push("Property command center does not render Progressive Intelligence.");
for (const callback of ['setTab("property")', 'setTab("finance")', 'setTab("report")']) {
  if (!chassis.includes(callback)) failures.push("Progressive Intelligence navigation missing: " + callback);
}
if (!answer.includes("Add to My Intelligence")) failures.push("Durable collection action is not customer-framed as My Intelligence.");
if (!answer.includes("Added to My Intelligence privately")) failures.push("Private collection receipt is missing.");
if (!comparison.includes("Build your shortlist from evidence")) failures.push("Comparison surface is not framed as the shortlist loop.");
if (!comparison.includes("missing evidence is not treated as zero")) failures.push("Comparison evidence-safety copy was lost.");
if (panel.includes("% complete") || panel.includes("completionPercentage")) failures.push("Fabricated completion scoring is prohibited.");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "PROGRESSIVE-INTELLIGENCE-001", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  rule: "PROGRESSIVE-INTELLIGENCE-001",
  loop: ["find","reveal","question","investigate","verify","unlock","compare","shortlist","improve","measure","learn","discover"],
  governedEvidenceDerived: true,
  fabricatedCompletionScore: false,
  durableCollectionPath: true,
  evidenceSafeComparison: true,
}, null, 2));
