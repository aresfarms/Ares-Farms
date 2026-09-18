/**
 * verify:module-ecosystem — Governed Federated Module Ecosystem (constitutional).
 * Locks: §4 architecture fields on every module, the Five Borough boundary
 * (licensed, inactive, never merged into core, explicit-opt-in handoff),
 * financing gated, §9 fallback language verbatim, §7 anti-drift list, the
 * constitutional lock, and independence (no module hard-depends on the hub;
 * no public surface carries professional-service language).
 */
import * as fs from "node:fs";
import {
  MODULE_ECOSYSTEM, PROFESSIONAL_MODULE_INACTIVE_FALLBACK, ANTI_DRIFT_FORBIDDEN_SHAPES,
  CONSTITUTIONAL_LOCK, moduleById, professionalModuleRenderable,
} from "@/lib/platform/moduleEcosystemRegistry";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// §4 — every module carries the full architecture contract.
ok(MODULE_ECOSYSTEM.length === 13, `13 spine modules registered (got ${MODULE_ECOSYSTEM.length})`);
for (const m of MODULE_ECOSYSTEM) {
  ok(!!m.doctrine && !!m.inputContract && !!m.outputContract && !!m.eligibilityGate && !!m.auditReplay && !!m.fallback,
    `${m.id}: all §4 fields present`);
  ok(["active", "gated", "inactive", "deferred"].includes(m.activation), `${m.id}: valid activation flag`);
  if (m.kind === "professional" || m.kind === "licensed_professional") {
    ok(m.reviewGate !== null, `${m.id}: professional module has a review gate`);
  }
  ok(m.dependsOnHub === false, `${m.id}: no hard dependency on the public hub (federation rule)`);
}

// §3 — Five Borough boundary.
const fb = moduleById("five-borough-capital")!;
ok(fb.kind === "licensed_professional" && fb.activation === "inactive" && fb.publicSurface === false,
  "Five Borough: licensed, INACTIVE, not a public surface");
ok(/never merged into core|NOT Furlong/i.test(fb.doctrine), "Five Borough: never-merged boundary stated in doctrine");
ok(/explicit user opt-in|never silent submission/i.test(fb.inputContract), "Five Borough: explicit opt-in handoff, no silent submission");
ok(professionalModuleRenderable("five-borough-capital") === false, "Five Borough: not renderable while inactive");

// §8 — graceful degradation: financing gated while property intelligence active.
ok(moduleById("financing-intelligence")!.activation === "gated" &&
   /FINANCING_NODE_LIVE=false/.test(moduleById("financing-intelligence")!.eligibilityGate) &&
   /counsel/.test(moduleById("financing-intelligence")!.eligibilityGate),
  "financing intelligence gated behind FINANCING_NODE_LIVE + counsel");
ok(moduleById("property-intelligence")!.activation === "active", "property intelligence active independently");
ok(MODULE_ECOSYSTEM.filter((m) => m.activation !== "active").every((m) => m.fallback.length > 0),
  "every non-active module has a graceful fallback");

// §9 — locked fallback language, verbatim.
ok(PROFESSIONAL_MODULE_INACTIVE_FALLBACK ===
  "Furlong can explain the pathway and what information matters, but this professional service is not active " +
  "here yet. You may continue with general decision intelligence or consult a qualified professional.",
  "§9 fallback language locked verbatim");

// §7 — anti-drift list complete.
ok(ANTI_DRIFT_FORBIDDEN_SHAPES.length === 9 && ANTI_DRIFT_FORBIDDEN_SHAPES.includes("loan portal") &&
   ANTI_DRIFT_FORBIDDEN_SHAPES.includes("100% financing sales page") && ANTI_DRIFT_FORBIDDEN_SHAPES.includes("broker CRM"),
  "§7 anti-drift forbidden shapes locked (9)");

// §11 — constitutional lock.
ok(/Furlong is the map\. Modules are optional guided routes\. Professionals are separate service providers\. The user chooses the path\./.test(CONSTITUTIONAL_LOCK),
  "§11 constitutional lock locked verbatim");

// §10 — no professional-service language on public surfaces (this branch).
function grepDir(dir: string, re: RegExp): string[] {
  const hits: string[] = [];
  if (!fs.existsSync(dir)) return hits;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) hits.push(...grepDir(p, re));
    else if (/\.(tsx?|mdx?)$/.test(e.name)) {
      // Test RENDERED/user-facing content only — strip code comments (a comment
      // explaining the licensed boundary is doctrine, not leakage).
      const src = fs.readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s*\*.*$/gm, "");
      if (re.test(src)) hits.push(p);
    }
  }
  return hits;
}
ok(grepDir("src/app/(public)", /Five Borough/i).length === 0 && grepDir("src/components", /Five Borough/i).length === 0,
  "no Five Borough professional-service language on public surfaces");
ok(grepDir("src/app/(public)", /you (?:are )?(?:pre-?)?approved|we underwrite|loan commitment\b/i).length === 0,
  "no underwriting/approval claims on public surfaces");

// Doctrine doc exists and carries the boundary.
ok(fs.existsSync("docs/doctrine/GOVERNED_FEDERATED_MODULE_ECOSYSTEM.md"), "doctrine doc exists");
ok(/must not merge those two layers/i.test(fs.readFileSync("docs/doctrine/GOVERNED_FEDERATED_MODULE_ECOSYSTEM.md", "utf8")),
  "doctrine doc states the never-merge boundary");

if (fail.length) {
  console.error(`\n✗  verify:module-ecosystem FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log("✓  verify:module-ecosystem PASS — 13 spine modules with full §4 contracts; Five Borough licensed/inactive/never-merged with explicit-opt-in handoff; financing gated behind FINANCING_NODE_LIVE+counsel while property intelligence runs independently; §9 fallback + §7 anti-drift + §11 constitutional lock verbatim; no professional-service language on public surfaces.");
process.exit(0);
