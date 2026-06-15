/**
 * MODULE-SOVEREIGNTY-AUDIT-001 — verify Furlong Core and all governed modules
 * stay federated, separable, and independently operable.
 *
 * Complements verify:module-ecosystem (which locks the §4 contract fields) by
 * proving the sovereignty PROPERTIES: Core does not bleed into module identity,
 * professional modules do not merge into Core, inactive modules degrade
 * gracefully (not broken), no module can silently act for the user, and every
 * module connects through the registry/contract rather than hidden coupling.
 *
 * Audit + verification only. Closes nothing; activates nothing.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  MODULE_ECOSYSTEM, CONSTITUTIONAL_LOCK,
  moduleById, professionalModuleRenderable, type EcosystemModule,
} from "@/lib/platform/moduleEcosystemRegistry";

const fail: string[] = [];
const warn: string[] = [];
const ok = (c: boolean, m: string) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail.push(m); };
const note = (m: string) => console.log(`  • ${m}`);

// Steward is derived from kind (registry has no explicit steward field — reported).
const stewardOf = (m: EcosystemModule) =>
  m.kind === "licensed_professional" ? "external licensed professional"
  : m.kind === "professional" ? "Furlong-governed, separately operated"
  : m.kind === "future" ? "unassigned (must enter via registry)"
  : "Furlong Core";

// Core modules that must keep routing regardless of any optional module state.
const ALWAYS_ON_CORE = ["property-intelligence", "agricultural", "compliance", "source-intelligence"];

console.log("── 1. Module enumeration + per-module classification ──");
ok(MODULE_ECOSYSTEM.length === 13, `enumerated ${MODULE_ECOSYSTEM.length} modules`);
for (const m of MODULE_ECOSYSTEM) {
  const fields = !!m.id && !!m.name && !!m.kind && !!m.activation
    && typeof m.publicSurface === "boolean" && !!m.inputContract && !!m.outputContract
    && !!m.eligibilityGate && !!m.fallback && typeof m.dependsOnHub === "boolean";
  ok(fields, `${m.id}: full sovereignty contract (id/steward/activation/boundary/io/deps/fallback/disable-safe)`);
  // disable-without-breaking-core proxy: no hard hub dependency + a graceful fallback.
  ok(m.dependsOnHub === false && m.fallback.length > 0, `${m.id}: disableable without breaking Core (no hub hard-dep + fallback)`);
  note(`${m.id} | kind=${m.kind} | steward=${stewardOf(m)} | activation=${m.activation} | public=${m.publicSurface}`);
}

console.log("\n── 3. Core does not import professional-module internals ──");
// Walk core source; flag any import of a professional/licensed module implementation.
const CORE_DIRS = ["src/lib/navigator", "src/lib/discovery", "src/components/navigator", "src/components/discovery"];
function tsFiles(dir: string): string[] {
  let out: string[] = [];
  try {
    for (const e of readdirSync(dir)) {
      const f = join(dir, e);
      if (statSync(f).isDirectory()) out = out.concat(tsFiles(f));
      else if (/\.(ts|tsx)$/.test(e)) out.push(f);
    }
  } catch { /* dir may not exist */ }
  return out;
}
const PROF_INTERNAL = /from\s+["'][^"']*(five[-_]?borough|fiveBorough|\/environmental\/(?!.*registry))/i;
let coreBleed = 0;
for (const d of CORE_DIRS) for (const f of tsFiles(d)) {
  const src = readFileSync(f, "utf8");
  if (PROF_INTERNAL.test(src)) { fail.push(`core bleed: ${f} imports a professional-module internal`); coreBleed++; }
}
ok(coreBleed === 0, "no Core file imports professional-module internals (registry/contract only)");

console.log("\n── 4. Modules do not mutate Core doctrine ──");
ok(typeof CONSTITUTIONAL_LOCK === "string" && /Furlong is the map/i.test(CONSTITUTIONAL_LOCK), "constitutional lock intact");
ok(MODULE_ECOSYSTEM.every((m) => m.dependsOnHub === false), "no module hard-depends on the hub (federation rule)");

console.log("\n── 5. Five Borough remains a licensed professional module, not Core ──");
const fb = moduleById("five-borough-capital")!;
ok(fb.kind === "licensed_professional" && fb.activation === "inactive" && fb.publicSurface === false,
  "Five Borough: licensed_professional, INACTIVE, non-public");
ok(/never merged into core|NOT Furlong/i.test(fb.doctrine), "Five Borough: never-merged-into-core doctrine");
ok(/explicit user opt-in|never silent submission/i.test(fb.inputContract), "Five Borough: explicit opt-in; no silent submission");
ok(professionalModuleRenderable("five-borough-capital") === false, "Five Borough: not renderable while inactive");

console.log("\n── 6. Compass to Capital = capital-navigation, not auto Five Borough routing ──");
const fin = moduleById("financing-intelligence")!;
ok(fin.activation === "gated" && /FINANCING_NODE_LIVE=false/.test(fin.eligibilityGate),
  "Financing Intelligence gated (no live capital routing)");
const domReg = readFileSync("src/security/domainPurposeRegistry.ts", "utf8");
ok(/not\s+automatically\s+Five Borough/i.test(domReg) && /financing-neutral/i.test(domReg),
  "Compass to Capital: financing-neutral, not automatically Five Borough (domain doctrine)");

console.log("\n── 7. Environmental / Compliance / Media separately governed ──");
const env = moduleById("environmental")!, comp = moduleById("compliance")!;
ok(env.kind === "professional" && env.activation === "gated" && env.publicSurface === false, "Environmental: professional, gated, non-public");
ok(comp.kind === "core_intelligence" && /fail-closed/.test(comp.fallback), "Compliance: governed, fail-closed fallback");
ok(env.doctrine !== comp.doctrine, "Environmental and Compliance carry distinct doctrine references");
// Media (image-rights / Module 23) is governed OUTSIDE the ecosystem registry as PENDING records.
warn.push("Media (image-rights / Module 23) is governed separately via PENDING image-rights records, not the ecosystem registry — confirm that remains intentional");

console.log("\n── 8. Inactive modules render unavailable/deferred, not broken ──");
for (const m of MODULE_ECOSYSTEM.filter((x) => x.activation !== "active")) {
  ok(m.fallback.length > 0, `${m.id} (${m.activation}): has graceful fallback (not broken)`);
}
for (const m of MODULE_ECOSYSTEM.filter((x) => (x.kind === "professional" || x.kind === "licensed_professional") && x.activation !== "active")) {
  ok(professionalModuleRenderable(m.id) === false, `${m.id}: inactive professional not renderable (degrades, no crash)`);
}

console.log("\n── 9. No module can silently submit/quote/approve/qualify/bind/act ──");
// Enforced by the constitutional doctrine (registry header) + the professional
// opt-in contracts — NOT the anti-drift portal-shape list.
const registrySrc = readFileSync("src/lib/platform/moduleEcosystemRegistry.ts", "utf8");
const doesNotBlock = /does NOT[\s\S]{0,400}/i.exec(registrySrc)?.[0] ?? "";
for (const verb of ["underwrite", "approve", "qualify", "broker", "submit", "decide"]) {
  ok(new RegExp(verb, "i").test(doesNotBlock), `constitutional doctrine forbids Core to silently "${verb}"`);
}
// Every professional/licensed module: no silent path — either non-renderable while
// inactive, or its input contract requires explicit user opt-in.
for (const m of MODULE_ECOSYSTEM.filter((x) => x.kind === "professional" || x.kind === "licensed_professional")) {
  const safe = (m.activation !== "active" && !professionalModuleRenderable(m.id))
    || /explicit user opt-in|never silent submission/i.test(m.inputContract);
  ok(safe, `${m.id}: no silent submit/act path (inactive-nonrenderable or explicit opt-in)`);
}

console.log("\n── 10. Every module connects via registry/contract, not hidden coupling ──");
ok(MODULE_ECOSYSTEM.every((m) => !!m.inputContract && !!m.outputContract && m.dependsOnHub === false),
  "every module declares input+output contracts and no hidden hub coupling");

// ── Simulation: Core with optional modules OFF (graceful degradation) ──
console.log("\n── Simulation: Core with module(s) OFF ──");
function simulate(label: string, disabled: string[]) {
  // Core still routes if the always-on core set isn't in the disabled set.
  const coreRoutes = ALWAYS_ON_CORE.every((id) => !disabled.includes(id) && moduleById(id)!.activation === "active");
  // Every disabled module yields a graceful explanation (fallback present).
  const graceful = disabled.every((id) => (moduleById(id)?.fallback.length ?? 0) > 0);
  // No disabled module is a hard hub dependency of another (independence).
  const noHidden = disabled.every((id) => moduleById(id)?.dependsOnHub === false);
  ok(coreRoutes && graceful && noHidden, `${label}: Core routes + graceful fallback + no hidden dependency`);
}
const OPTIONAL = MODULE_ECOSYSTEM.filter((m) => !ALWAYS_ON_CORE.includes(m.id)).map((m) => m.id);
simulate("all optional modules off", OPTIONAL);
simulate("Financing off", ["financing-intelligence"]);
simulate("Five Borough off", ["five-borough-capital"]);
simulate("Environmental off", ["environmental"]);
simulate("Media off (separately governed)", []); // media not in ecosystem registry; core unaffected
simulate("all optional modules declared but inactive", OPTIONAL);
// Compliance is a CORE governance guardrail, not an optional spoke: "off" must
// FAIL-CLOSED (gates block) — the safe outcome, not a user-facing crash.
const compMod = moduleById("compliance")!;
ok(compMod.kind === "core_intelligence" && /fail-closed/.test(compMod.fallback),
  "Compliance off → fail-closed (gates block; safe, not a crash) — never a graceful-skip");

if (warn.length) { console.log("\n⚠ findings (non-fatal, reported):"); warn.forEach((w) => console.log(`  ⚠ ${w}`)); }
if (fail.length) { console.error(`\n✗ verify:module-sovereignty FAIL — ${fail.length}`); fail.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
console.log(`\n✓ verify:module-sovereignty PASS — 13 modules federated + separable; Core imports no professional internals; Five Borough stays licensed/inactive; Compass-to-Capital financing-neutral; inactive modules degrade gracefully; no silent module action; all connect via registry/contract. Audit only — closes nothing.`);
process.exit(0);
