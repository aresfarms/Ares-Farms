/**
 * ingestUsdaFoodAccess — USDA Food Access Research Atlas facts per property
 * tract, frozen into a committed snapshot
 * (PROPERTY_BRIEF_INTELLIGENCE_SPEC_2026-07-15: the grocery-access fact that
 * matters most in rural markets — presented as a USDA designation FACT with
 * methodology framing, never an adjective about the area).
 *
 * Source: USDA ERS Food Access Research Atlas (2019 vintage — the current
 * published tract-level release) — public domain. The 65MB workbook is parsed
 * with openpyxl inside an ISOLATED scratch venv (nothing installed system-wide).
 *
 * Usage:
 *   npx tsx src/scripts/ingestUsdaFoodAccess.ts --xlsx <downloaded .xlsx>
 * Output: src/lib/property/propertyFoodAccessGenerated.ts
 */

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { PROPERTY_OZ_FACTS } from "../lib/property/propertyOpportunityZonesGenerated";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/lib/property/propertyFoodAccessGenerated.ts");

const PY_EXTRACT = `
import json, sys
from openpyxl import load_workbook

xlsx_path, tracts_path = sys.argv[1], sys.argv[2]
tracts = set(json.load(open(tracts_path)))
wb = load_workbook(xlsx_path, read_only=True, data_only=True)
ws = wb["Food Access Research Atlas"] if "Food Access Research Atlas" in wb.sheetnames else wb[wb.sheetnames[-1]]
rows = ws.iter_rows(values_only=True)
header = [str(h).strip() if h is not None else "" for h in next(rows)]
idx = {name: header.index(name) for name in ("CensusTract", "Urban", "LILATracts_1And10", "LILATracts_halfAnd10", "LATracts10", "LATracts1") if name in header}
out = {}
for row in rows:
    tract = str(row[idx["CensusTract"]]).split(".")[0].zfill(11)
    if tract not in tracts:
        continue
    def flag(col):
        v = row[idx[col]] if col in idx else None
        return bool(v) and str(v) not in ("0", "0.0", "None", "False")
    out[tract] = {
        "urban": flag("Urban"),
        "lila1And10": flag("LILATracts_1And10"),
        "lowAccess10": flag("LATracts10"),
        "lowAccess1": flag("LATracts1"),
    }
print(json.dumps(out))
`;

function ensureVenvPython(scratchDir: string): string {
  const venv = path.join(scratchDir, "furlong-ingest-venv");
  const python = path.join(venv, "bin", "python3");
  if (!fs.existsSync(python)) {
    console.log("  creating isolated venv (openpyxl only, nothing system-wide)...");
    execFileSync("python3", ["-m", "venv", venv], { stdio: "inherit" });
    execFileSync(path.join(venv, "bin", "pip"), ["install", "--quiet", "openpyxl"], { stdio: "inherit" });
  }
  return python;
}

async function main(): Promise<void> {
  console.log("\n━━━ ingest:usda-food-access ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const xlsxIdx = process.argv.indexOf("--xlsx");
  const xlsxPath = xlsxIdx >= 0 ? process.argv[xlsxIdx + 1] : null;
  if (!xlsxPath || !fs.existsSync(xlsxPath)) {
    throw new Error(
      "Provide --xlsx <FoodAccessResearchAtlasData2019.xlsx> " +
        "(download: ers.usda.gov → Food Access Research Atlas → Download the Data)."
    );
  }

  // property tract → the atlas is tract-keyed; join back to properties after.
  const tractByProperty = new Map<string, string>();
  for (const [id, fact] of Object.entries(PROPERTY_OZ_FACTS)) {
    if (fact.tractId && fact.tractId.length === 11) tractByProperty.set(id, fact.tractId);
  }
  const tracts = [...new Set(tractByProperty.values())];
  console.log(`  ${tractByProperty.size} properties across ${tracts.length} tracts`);

  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-food-"));
  const python = ensureVenvPython(path.dirname(scratch));
  const tractsFile = path.join(scratch, "tracts.json");
  const scriptFile = path.join(scratch, "extract.py");
  fs.writeFileSync(tractsFile, JSON.stringify(tracts));
  fs.writeFileSync(scriptFile, PY_EXTRACT);

  console.log("  parsing the atlas workbook (read-only stream; a few minutes)...");
  const raw = execFileSync(python, [scriptFile, xlsxPath, tractsFile], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const byTract = JSON.parse(raw) as Record<
    string,
    { urban: boolean; lila1And10: boolean; lowAccess10: boolean; lowAccess1: boolean }
  >;
  console.log(`  atlas rows matched: ${Object.keys(byTract).length}/${tracts.length} tracts`);

  const entries: string[] = [];
  let lilaCount = 0;
  for (const [id, tract] of [...tractByProperty.entries()].sort()) {
    const row = byTract[tract];
    if (!row) continue;
    if (row.lila1And10) lilaCount += 1;
    entries.push(`  ${JSON.stringify(id)}: ${JSON.stringify(row)},`);
  }

  const asOf = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    OUT,
    `/**
 * propertyFoodAccessGenerated — GENERATED FILE. Do not edit by hand.
 *
 * USDA ERS Food Access Research Atlas (2019 tract vintage) designations per
 * property tract — public domain. lila1And10 = the tract is designated
 * low-income AND low-access at the 1-mile urban / 10-mile rural measure (the
 * measure USDA uses for what is colloquially called a "food desert").
 * Re-run: npx tsx src/scripts/ingestUsdaFoodAccess.ts --xlsx <atlas.xlsx>
 */

export const PROPERTY_FOOD_ACCESS_PROVENANCE = {
  asOf: ${JSON.stringify(asOf)},
  atlasVintage: "2019 (current published tract-level release)",
  source: "USDA ERS Food Access Research Atlas",
  license: "Public domain (U.S. Government work)",
  resolvedProperties: ${entries.length},
  lilaCount: ${lilaCount},
} as const;

export interface PropertyFoodAccessFact {
  urban: boolean;
  /** Low-income AND low-access at 1mi urban / 10mi rural — USDA's headline measure. */
  lila1And10: boolean;
  /** Low access at the 10-mile (rural) measure. */
  lowAccess10: boolean;
  /** Low access at the 1-mile (urban) measure. */
  lowAccess1: boolean;
}

export const PROPERTY_FOOD_ACCESS_FACTS: Record<string, PropertyFoodAccessFact> = {
${entries.join("\n")}
};
`,
    "utf8"
  );
  console.log(`  wrote ${entries.length} properties (${lilaCount} LILA) -> ${path.relative(ROOT, OUT)}\n`);
}

main().catch((e) => { console.error("ingest:usda-food-access FAILED —", e); process.exit(1); });
