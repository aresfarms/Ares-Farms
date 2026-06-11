/**
 * ingestJourneyImages — Build 53
 *
 * Deliberate download-checklist script for America's Journey images.
 * Run this explicitly when ready to add images: npm run ingest:journey-images
 *
 * This script NEVER runs as part of `npm run build`.
 * Image ingestion is a deliberate, rights-verified step performed by a human.
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Reads the IMAGES (then) and NOW_IMAGES (now) registries.
 *   2. Compares each entry against /public/journey/ on disk.
 *   3. Prints a prioritized download checklist grouped by:
 *      - Already downloaded (src set and file exists)
 *      - Pending download (src null, needsConfirmation not true, pd tier)
 *      - Needs verification first (cc-verify tier)
 *      - Commission (no source image exists — must photograph)
 *      - Held pending rights confirmation (needsConfirmation: true)
 *   4. Provides the sourceUrl and target filename for each pending image.
 *
 * WHAT THIS SCRIPT DOES NOT DO:
 *   - Does not download images automatically. Catalog page URLs require human
 *     navigation to find the download button and choose the correct file.
 *   - Does not modify any source files (IMAGES, NOW_IMAGES, package.json).
 *   - Does not alter git state.
 *
 * AFTER DOWNLOADING AN IMAGE:
 *   1. Save to /public/journey/<stop-id>-then.jpg OR -now.jpg.
 *   2. Set src: '/journey/<stop-id>-then.jpg' in americasJourneyImages.ts
 *      OR src: '/journey/<stop-id>-now.jpg' in americasJourneyNowImages.ts.
 *   3. Run: npm run verify:journey-image-credits
 *   4. Run: npx tsc --noEmit && npm run build
 *
 * RIGHTS DISCIPLINE:
 *   - 'pd' entries: confirmed public domain / no known restrictions.
 *     Download freely from the institution's download option.
 *   - 'cc-verify' entries: verify the Wikimedia file page first.
 *     Confirm: exact license version, author name, required attribution string.
 *     Set needsConfirmation: false in the registry ONLY after all three confirmed.
 *   - 'commission' entries: no image exists. Requires original photography.
 *   - Any entry with needsConfirmation: true: DO NOT download or publish.
 *
 * "The map reveals opportunities, not the visitor."
 * "Public Alpha remains PENDING."
 */

import * as fs from "fs";
import * as path from "path";
import { IMAGES } from "../lib/public-content/americasJourneyImages";
import { NOW_IMAGES } from "../lib/public-content/americasJourneyNowImages";
import type { ImageEntry } from "../lib/public-content/americasJourneyImages";
import type { NowImage } from "../lib/public-content/americasJourneyNowImages";

// ── Types ─────────────────────────────────────────────────────────────────────

type RegistryKind = "then" | "now";

interface ImageTask {
  stopId:     string;
  kind:       RegistryKind;
  tier:       "pd" | "cc-verify" | "commission";
  targetFile: string;         // relative: /journey/<stopId>-<kind>.jpg
  targetPath: string;         // absolute on disk
  sourceUrl:  string;
  rights:     string;
  credit:     string;
  note?:      string;
  status:
    | "downloaded"           // file exists on disk
    | "pending-pd"           // pd tier, src null, no needsConfirmation
    | "needs-cc-verify"      // cc-verify tier, not yet cleared
    | "commission"           // must photograph
    | "held";                // needsConfirmation: true
}

// ── Journey directory ─────────────────────────────────────────────────────────

const JOURNEY_DIR = path.join(process.cwd(), "public", "journey");

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ── Task builder ──────────────────────────────────────────────────────────────

function buildTask(
  stopId: string,
  kind: RegistryKind,
  entry: ImageEntry | NowImage,
): ImageTask {
  const tier: "pd" | "cc-verify" | "commission" =
    "tier" in entry
      ? (entry as NowImage).tier
      : "pd"; // IMAGES (then) entries are all verified pd or pending

  const targetFile = `/journey/${stopId}-${kind}.jpg`;
  const targetPath = path.join(JOURNEY_DIR, `${stopId}-${kind}.jpg`);
  const onDisk     = fileExists(targetPath);

  let status: ImageTask["status"];
  if (entry.needsConfirmation === true) {
    status = "held";
  } else if (onDisk && entry.src !== null) {
    status = "downloaded";
  } else if (tier === "commission") {
    status = "commission";
  } else if (tier === "cc-verify") {
    status = "needs-cc-verify";
  } else {
    status = "pending-pd";
  }

  return {
    stopId,
    kind,
    tier,
    targetFile,
    targetPath,
    sourceUrl:  entry.sourceUrl ?? "",
    rights:     entry.rights ?? "",
    credit:     entry.credit ?? "",
    note:       ("note" in entry ? entry.note : undefined) as string | undefined,
    status,
  };
}

// ── Report printer ────────────────────────────────────────────────────────────

function printSection(title: string, tasks: ImageTask[], showSourceUrl: boolean): void {
  if (tasks.length === 0) return;
  console.log(`\n  ── ${title} (${tasks.length}) ${"─".repeat(Math.max(0, 58 - title.length - String(tasks.length).length))}`);
  for (const t of tasks) {
    console.log(`\n    [${t.kind.toUpperCase()}] ${t.stopId}`);
    console.log(`           Save to:  ${t.targetFile}`);
    if (showSourceUrl && t.sourceUrl) {
      console.log(`           Catalog:  ${t.sourceUrl}`);
    }
    console.log(`           Rights:   ${t.rights.split(".")[0]}.`);  // first sentence only
    if (t.note) {
      console.log(`           Note:     ${t.note}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("\n━━━ ingest:journey-images ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("  Journey images directory: " + JOURNEY_DIR);

  // Ensure the directory exists
  if (!fs.existsSync(JOURNEY_DIR)) {
    console.log("  ⚠  /public/journey/ does not exist — creating it.");
    fs.mkdirSync(JOURNEY_DIR, { recursive: true });
  }

  // Build all tasks
  const tasks: ImageTask[] = [];
  for (const [stopId, entry] of Object.entries(IMAGES)) {
    tasks.push(buildTask(stopId, "then", entry));
  }
  for (const [stopId, entry] of Object.entries(NOW_IMAGES)) {
    tasks.push(buildTask(stopId, "now", entry));
  }

  // Buckets
  const downloaded    = tasks.filter(t => t.status === "downloaded");
  const pendingPd     = tasks.filter(t => t.status === "pending-pd");
  const ccVerify      = tasks.filter(t => t.status === "needs-cc-verify");
  const commission    = tasks.filter(t => t.status === "commission");
  const held          = tasks.filter(t => t.status === "held");

  // Summary
  console.log(`\n  Total image slots:    ${tasks.length}`);
  console.log(`  ✓ Downloaded:         ${downloaded.length}`);
  console.log(`  ⬇ Pending (pd):       ${pendingPd.length}  ← do these first`);
  console.log(`  ⚑ Needs CC verify:    ${ccVerify.length}   ← verify file page before downloading`);
  console.log(`  📷 Commission:         ${commission.length}  ← requires original photography`);
  console.log(`  ✗ Held:               ${held.length}   ← blocked pending rights confirmation`);

  // Print each bucket
  if (downloaded.length > 0) {
    console.log("\n  ── Already downloaded ─────────────────────────────────────────────────");
    for (const t of downloaded) {
      console.log(`    ✓ [${t.kind.toUpperCase()}] ${t.stopId} → ${t.targetFile}`);
    }
  }

  printSection("Pending download (public-domain — do these first)", pendingPd, true);

  if (ccVerify.length > 0) {
    console.log(`\n  ── Needs CC verification first (${ccVerify.length}) ───────────────────────────────────────`);
    console.log("     Before downloading any cc-verify entry:");
    console.log("       1. Open the Wikimedia file page (sourceUrl)");
    console.log("       2. Confirm: exact license version, author name, attribution string");
    console.log("       3. Copy the required attribution verbatim into the credit field");
    console.log("       4. Set needsConfirmation: false in the registry");
    console.log("       5. THEN download and set src");
    for (const t of ccVerify) {
      console.log(`\n    [${t.kind.toUpperCase()}] ${t.stopId}`);
      console.log(`           Save to:  ${t.targetFile}`);
      console.log(`           Verify:   ${t.sourceUrl}`);
      console.log(`           Rights:   ${t.rights.split(".")[0]}.`);
      if (t.note) console.log(`           Note:     ${t.note}`);
    }
  }

  if (commission.length > 0) {
    console.log(`\n  ── Commission (original photography required) (${commission.length}) ─────────────────────`);
    for (const t of commission) {
      console.log(`    📷 [${t.kind.toUpperCase()}] ${t.stopId}`);
      console.log(`           Save to:  ${t.targetFile}  (after shoot)`);
      if (t.note) console.log(`           Note:     ${t.note}`);
    }
  }

  if (held.length > 0) {
    console.log(`\n  ── Held (rights confirmation required) (${held.length}) ─────────────────────────────────`);
    for (const t of held) {
      console.log(`    ✗ [${t.kind.toUpperCase()}] ${t.stopId}`);
      if (t.note) console.log(`           Note:     ${t.note}`);
    }
  }

  // Instructions
  console.log("\n  ── After downloading an image ─────────────────────────────────────────");
  console.log("     1.  Save to /public/journey/<stop-id>-then.jpg or -now.jpg");
  console.log("     2.  Set src: '/journey/<stop-id>-then.jpg' in americasJourneyImages.ts");
  console.log("         or  src: '/journey/<stop-id>-now.jpg'  in americasJourneyNowImages.ts");
  console.log("     3.  npm run verify:journey-image-credits");
  console.log("     4.  npx tsc --noEmit && npm run build");
  console.log("     5.  Confirm the ArchivalCredit block renders with a working Source ↗ link");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main();
