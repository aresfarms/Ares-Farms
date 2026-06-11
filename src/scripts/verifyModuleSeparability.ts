/**
 * verify:module-separability — DIVEST-001 enforcement gate.
 *
 * The doctrine ([[divestibleUnits]]) defines the requirement; THIS gate proves
 * the code actually enforces it. Furlong must always be able to operate,
 * license, or DIVEST any designated unit independently — never structurally
 * locked into keeping the whole.
 *
 * FAIL conditions (exit 1):
 *   DESIGNATION  a divestible unit names a moduleId that does not exist in the
 *                module manifests (a unit that cannot be located cannot be carved out).
 *   OWNERSHIP    two divestible units claim the same data store EXCLUSIVELY
 *                (exclusive ownership is the precondition for a clean carve-out).
 *   COUPLING     a divestible unit's module declares a dataDependency on a store
 *                owned EXCLUSIVELY by ANOTHER divestible unit (a hidden cross-unit
 *                read — the unit could not run alone). Reads of the CORE governance
 *                backbone or declared shared registries are allowed (API contract).
 *   LOCK-IN      a unit's sharedDependencies are not ALL replaceable/licensable
 *                (a hard backend lock defeats separability).
 *   CARVE-OUT    buildCarveOutManifest() cannot produce a non-empty export +
 *                run-alone manifest for a divestible unit.
 *
 * HONEST SCOPE: this gate verifies separability from the DECLARED manifest graph
 * (dataDependencies) + the divestiture registry. It does NOT yet run a full
 * source-level import-graph analysis nor an actual standalone build of each unit.
 * Those are named follow-ups; this gate is the deterministic, replayable first
 * line that stops cross-unit coupling from being introduced silently.
 *
 * Edge-safe: pure registry analysis, no fs/network. Run in verify:backend.
 */

import { moduleManifests } from "../lib/modules/moduleRegistry";
import {
  DIVESTIBLE_UNITS,
  buildCarveOutManifest,
  type DivestibleUnit,
} from "../lib/divestiture/divestibleUnits";
import { findCrossUnitImports } from "../lib/divestiture/importGraph";

const fail: string[] = [];
const note = (m: string) => fail.push(m);

const manifestById = new Map(moduleManifests.map((m) => [m.id, m]));
const divestible = DIVESTIBLE_UNITS.filter((u) => u.divestible);

// ── OWNERSHIP: each data store is owned EXCLUSIVELY by at most one divestible unit
const storeOwner = new Map<string, string>();
for (const u of divestible) {
  for (const store of u.ownedDataStores) {
    const prior = storeOwner.get(store);
    if (prior && prior !== u.id) {
      note(`OWNERSHIP: data store "${store}" is claimed by two divestible units ("${prior}" and "${u.id}") — exclusive ownership is required for a clean carve-out.`);
    } else {
      storeOwner.set(store, u.id);
    }
  }
}

function checkUnit(u: DivestibleUnit): void {
  // DESIGNATION: every named module must exist in the manifest registry.
  for (const mid of u.moduleIds) {
    if (!manifestById.has(mid)) {
      note(`DESIGNATION(${u.id}): module "${mid}" is not present in moduleManifests — a unit that cannot be located cannot be carved out.`);
    }
  }

  // COUPLING: no module may read a store owned EXCLUSIVELY by ANOTHER divestible unit.
  for (const mid of u.moduleIds) {
    const m = manifestById.get(mid);
    if (!m) continue;
    for (const dep of m.dataDependencies) {
      const owner = storeOwner.get(dep);
      if (owner && owner !== u.id) {
        note(`COUPLING(${u.id}): module "${mid}" reads data store "${dep}" owned exclusively by divestible unit "${owner}" — a hidden cross-unit read; the unit could not run alone.`);
      }
    }
  }

  // LOCK-IN: shared dependencies must all be replaceable/licensable.
  for (const dep of u.sharedDependencies) {
    if (!dep.replaceable) {
      note(`LOCK-IN(${u.id}): shared dependency "${dep.name}" is not marked replaceable — a hard backend lock defeats separability.`);
    }
  }

  // CARVE-OUT: a producible, non-empty export + run-alone manifest.
  let kit: ReturnType<typeof buildCarveOutManifest>;
  try {
    kit = buildCarveOutManifest(u.id);
  } catch (e) {
    note(`CARVE-OUT(${u.id}): buildCarveOutManifest threw — ${(e as Error).message}`);
    return;
  }
  if (kit.modules.length === 0) {
    note(`CARVE-OUT(${u.id}): carve-out kit names no modules.`);
  }
  if (kit.dataExport.ownedDataStores.length === 0) {
    note(`CARVE-OUT(${u.id}): carve-out kit has no owned data stores to export (Vol III §3.9 portability).`);
  }
  if (kit.runAlone.services.length === 0 || kit.runAlone.config.length === 0) {
    note(`CARVE-OUT(${u.id}): run-alone manifest is missing services or config (cannot stand alone).`);
  }
}

for (const u of divestible) checkUnit(u);

// ── COVERAGE: every module declares exactly ONE unit (no undeclared territory,
//    no double-assignment) — the founder re-designation rule.
const unitOfModule = new Map<string, string>();
for (const u of DIVESTIBLE_UNITS) {
  for (const mid of u.moduleIds) {
    const prior = unitOfModule.get(mid);
    if (prior) {
      note(`COVERAGE: module "${mid}" is assigned to two units ("${prior}" and "${u.id}") — each module declares exactly one unit.`);
    } else {
      unitOfModule.set(mid, u.id);
    }
  }
}
for (const m of moduleManifests) {
  if (!unitOfModule.has(m.id)) {
    note(`COVERAGE: module "${m.id}" is not assigned to any unit — no undeclared territory is allowed (assign it to a divestible unit or the core backbone).`);
  }
}

// ── COUPLING (whole graph): no module in ANY unit may read a store owned
//    exclusively by a DIFFERENT divestible unit — including core modules.
for (const m of moduleManifests) {
  const myUnit = unitOfModule.get(m.id);
  for (const dep of m.dataDependencies) {
    const owner = storeOwner.get(dep);
    if (owner && owner !== myUnit) {
      note(`COUPLING: module "${m.id}" (${myUnit ?? "unassigned"}) reads data store "${dep}" owned exclusively by divestible unit "${owner}" — a hidden cross-unit read.`);
    }
  }
}

// ── IMPORT-GRAPH (real source): no divestible unit's code may import another
//    divestible unit's internals directly. This catches REAL coupling the
//    declared manifest graph cannot see (a registry can read "clean" while the
//    source quietly couples). Reaching another unit via the core-backbone API
//    contract or node_modules is allowed.
for (const e of findCrossUnitImports()) {
  note(`IMPORT-GRAPH: ${e.fromUnit} file "${e.fromFile}" imports ${e.toUnit} internals ("${e.specifier}") — route through a core-backbone contract instead.`);
}

// Sanity: at least one divestible unit and exactly one core backbone designated.
if (divestible.length === 0) note("DESIGNATION: no divestible units are designated — optionality is unproven.");
const core = DIVESTIBLE_UNITS.filter((u) => !u.divestible);
if (core.length === 0) note("DESIGNATION: no core governance backbone is designated (the unit that stays with Furlong).");

console.log(
  `verify:module-separability — ${divestible.length} divestible unit(s) + ${core.length} core backbone checked against ${moduleManifests.length} module manifests.`
);
if (fail.length) {
  console.error(`\n✗  verify:module-separability FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log(
  `\n✓  verify:module-separability PASS — all ${moduleManifests.length} modules declare exactly one unit (full coverage), every divestible unit owns its stores exclusively with no hidden cross-unit read, only replaceable shared deps, and a producible carve-out kit.`
);
console.log(
  "   (Covers declared-manifest separability AND real source-level import-graph. Actual isolated-build harness per unit remains a follow-up; source-intelligence is proven self-contained by verify:standalone-build.)"
);
process.exit(0);
