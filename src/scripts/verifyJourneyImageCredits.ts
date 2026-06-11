/**
 * verifyJourneyImageCredits — Build 53
 *
 * Gate: ensures every archival image in the America's Journey registries
 * satisfies Furlong's "visible credit always" transparency rule before
 * any image can be displayed in production.
 *
 * Checks both IMAGES (then) from americasJourneyImages.ts
 * and NOW_IMAGES (now) from americasJourneyNowImages.ts.
 *
 * Fails if any entry violates:
 *   C1 — src is set but credit is missing or empty
 *   C2 — src is set but sourceUrl is missing or empty
 *   C3 — src is set but alt is missing or empty
 *   C4 — needsConfirmation === true AND src is populated (gate bypass)
 *   C5 — src is set but does not begin with /journey/ (hotlinking forbidden)
 *   C6 — src is set but sourceUrl does not begin with http (broken source link)
 *   C7 — tier === 'cc-verify' AND src set AND needsConfirmation is not exactly
 *          false (i.e. true or undefined — not explicitly cleared after verification)
 *   C8 — stop has both imageThen.src AND imageNow.src but the now-image
 *          credit is identical to the then-image credit (must be separate)
 *
 * Dual-credit rule (C8): the then→now dissolve renders two independent
 * ArchivalCredit elements. Each image must have its own distinct credit string.
 * The gate flags entries where both src are populated but credits are identical
 * — the two images cannot share one caption.
 *
 * The gate does NOT fail on entries where src === null — those stops render
 * with text + map only (the intended state until images are downloaded).
 *
 * interactionModel.creditRequirement = "visible-always"
 * "The map reveals opportunities, not the visitor."
 * "Public Alpha remains PENDING."
 */

import * as fs from "fs";
import * as path from "path";
import { IMAGES } from "../lib/public-content/americasJourneyImages";
import { NOW_IMAGES } from "../lib/public-content/americasJourneyNowImages";
import { EXTRA_IMAGES } from "../lib/public-content/americasJourneyPool";
import { GENERATED_HOLIDAY_POOL } from "../lib/public-content/americasJourneyPoolGenerated";
import type { ImageEntry } from "../lib/public-content/americasJourneyImages";
import type { NowImage } from "../lib/public-content/americasJourneyNowImages";
import type { ArchivalImage } from "../lib/public-content/americasJourneyStops";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Failure {
  registry: "IMAGES (then)" | "NOW_IMAGES (now)" | "DUAL_CREDIT" | "EXTRA_IMAGES (pool)" | "HOLIDAY_POOL";
  stopId:   string;
  check:    string;
  detail:   string;
}

/** Rights must read CC0 / public domain / no known restrictions. */
const RIGHTS_CLEAN = /\bCC0\b|public[\s-]?domain|no known (?:copyright )?restrictions|\bPD\b/i;

// ── Per-entry checks ──────────────────────────────────────────────────────────

function checkEntry(
  registry: "IMAGES (then)" | "NOW_IMAGES (now)",
  stopId:   string,
  entry:    ImageEntry | NowImage,
): Failure[] {
  const failures: Failure[] = [];
  const tier = "tier" in entry ? (entry as NowImage).tier : undefined;

  // C4 — needsConfirmation + src populated: gate bypass attempt
  if (entry.needsConfirmation && entry.src !== null && entry.src !== undefined) {
    failures.push({
      registry, stopId, check: "C4",
      detail: `needsConfirmation is true but src is set to "${entry.src}". ` +
              `Do not set src until rights are confirmed.`,
    });
  }

  // C7 — cc-verify tier: needsConfirmation must be explicitly false (not undefined)
  if (
    tier === "cc-verify" &&
    entry.src !== null &&
    entry.src !== undefined &&
    entry.needsConfirmation !== false
  ) {
    failures.push({
      registry, stopId, check: "C7",
      detail: `tier is 'cc-verify' and src is set, but needsConfirmation is ` +
              `not explicitly false (it is ${String(entry.needsConfirmation)}). ` +
              `After verifying the exact license version, author, and attribution ` +
              `string on the Wikimedia file page, set needsConfirmation: false ` +
              `and populate credit with the verbatim required attribution.`,
    });
  }

  // Skip remaining checks when src is null — text+map-only state is valid.
  if (entry.src === null || entry.src === undefined) return failures;

  // C5 — hotlink: must be a local /journey/ path
  if (!entry.src.startsWith("/journey/")) {
    failures.push({
      registry, stopId, check: "C5",
      detail: `src "${entry.src}" does not begin with /journey/. ` +
              `Download the image to /public/journey/<stop-id>-then.jpg or ` +
              `/public/journey/<stop-id>-now.jpg and use the /journey/ path. ` +
              `Never hotlink external images.`,
    });
  }

  // C1 — credit required when image is shown
  if (!entry.credit || entry.credit.trim() === "") {
    failures.push({
      registry, stopId, check: "C1",
      detail: "src is set but credit is missing or empty. " +
              "Every displayed image must have a visible credit string.",
    });
  }

  // C2 — sourceUrl required for the 'Source ↗' link
  if (!entry.sourceUrl || entry.sourceUrl.trim() === "") {
    failures.push({
      registry, stopId, check: "C2",
      detail: "src is set but sourceUrl is missing or empty. " +
              "Every displayed image must have a visible Source link.",
    });
  }

  // C6 — sourceUrl must be a real URL (not a placeholder)
  if (entry.sourceUrl && !entry.sourceUrl.startsWith("http")) {
    failures.push({
      registry, stopId, check: "C6",
      detail: `sourceUrl "${entry.sourceUrl}" does not begin with http. ` +
              `Provide the full canonical catalog URL.`,
    });
  }

  // C3 — alt text required for accessibility
  if (!entry.alt || entry.alt.trim() === "") {
    failures.push({
      registry, stopId, check: "C3",
      detail: "src is set but alt is missing or empty. " +
              "Every displayed image must have descriptive alt text.",
    });
  }

  return failures;
}

// ── Dual-credit check ─────────────────────────────────────────────────────────

function checkDualCredit(): Failure[] {
  const failures: Failure[] = [];

  // All stop ids that appear in both registries
  const allIds = new Set([...Object.keys(IMAGES), ...Object.keys(NOW_IMAGES)]);

  for (const stopId of allIds) {
    const thenEntry = IMAGES[stopId];
    const nowEntry  = NOW_IMAGES[stopId];
    if (!thenEntry || !nowEntry) continue;

    // C8: both src populated → credits must differ (each needs its own ArchivalCredit)
    const thenSrc = thenEntry.src;
    const nowSrc  = nowEntry.src;
    if (thenSrc && nowSrc && thenEntry.credit === nowEntry.credit) {
      failures.push({
        registry: "DUAL_CREDIT",
        stopId,
        check: "C8",
        detail: "Both imageThen.src and imageNow.src are set, but their credit " +
                "strings are identical. The then→now dissolve renders two " +
                "independent ArchivalCredit elements. Give each image its own " +
                "distinct attribution string.",
      });
    }
  }

  return failures;
}

// ── Pool (EXTRA_IMAGES) checks ──────────────────────────────────────────────────
// Every pool image actually renders, so it is held to the full Living-map
// standard: downloaded /journey/ file on disk, CC0/PD rights, true year, credit,
// and a working source link.

function checkImagePool(
  reg: "EXTRA_IMAGES (pool)" | "HOLIDAY_POOL",
  map: Record<string, ArchivalImage[]>,
): Failure[] {
  const failures: Failure[] = [];
  for (const [stopId, list] of Object.entries(map)) {
    for (const img of list) {
      // Furlong-owned original photography: cleanest rights of all (owned
      // outright). No external catalog/source link exists or is required.
      const isOriginal = /original\s+photography|owned\s+outright/i.test(img.rights || "");

      if (!img.src || !img.src.startsWith("/journey/")) {
        failures.push({ registry: reg, stopId, check: "P-C5",
          detail: `pool image src "${img.src}" must be a local /journey/ path.` });
        continue;
      }
      const abs = path.join(process.cwd(), "public", img.src.replace(/^\//, ""));
      if (!fs.existsSync(abs)) {
        failures.push({ registry: reg, stopId, check: "P-FILE",
          detail: `pool image file missing on disk: public${img.src}` });
      }
      if (!img.credit || img.credit.trim() === "") {
        failures.push({ registry: reg, stopId, check: "P-C1", detail: "pool image missing credit." });
      }
      // External source link required EXCEPT for Furlong originals (no catalog).
      if (!isOriginal && (!img.sourceUrl || !img.sourceUrl.startsWith("http"))) {
        failures.push({ registry: reg, stopId, check: "P-C2", detail: `pool image sourceUrl "${img.sourceUrl}" must be an http(s) URL.` });
      }
      if (!img.alt || img.alt.trim() === "") {
        failures.push({ registry: reg, stopId, check: "P-C3", detail: "pool image missing alt text." });
      }
      if (img.year === undefined || img.year === null || String(img.year).trim() === "") {
        failures.push({ registry: reg, stopId, check: "P-YEAR", detail: "pool image missing a true year." });
      }
      if (!isOriginal && !RIGHTS_CLEAN.test(img.rights || "")) {
        failures.push({ registry: reg, stopId, check: "P-RIGHTS",
          detail: `pool image rights not CC0/public-domain/Furlong-original: "${img.rights}".` });
      }
    }
  }
  return failures;
}

function checkPool(): Failure[] {
  return [
    ...checkImagePool("EXTRA_IMAGES (pool)", EXTRA_IMAGES),
    ...checkImagePool("HOLIDAY_POOL", GENERATED_HOLIDAY_POOL),
  ];
}

// ── Runner ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("\n━━━ verify:journey-image-credits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── IMAGES (then) summary
  const thenEntries = Object.entries(IMAGES);
  const thenWithSrc = thenEntries.filter(([, e]) => e.src !== null && e.src !== undefined);
  const thenHeld    = thenEntries.filter(([, e]) => e.needsConfirmation === true);

  // ── NOW_IMAGES (now) summary
  const nowEntries  = Object.entries(NOW_IMAGES);
  const nowWithSrc  = nowEntries.filter(([, e]) => e.src !== null && e.src !== undefined);
  const nowHeld     = nowEntries.filter(([, e]) => e.needsConfirmation === true);
  const nowByTier   = {
    pd:         nowEntries.filter(([, e]) => e.tier === "pd").length,
    ccVerify:   nowEntries.filter(([, e]) => e.tier === "cc-verify").length,
    commission: nowEntries.filter(([, e]) => e.tier === "commission").length,
  };

  console.log("  THEN images (IMAGES registry):");
  console.log(`    Registry size:      ${thenEntries.length} entries`);
  console.log(`    Images downloaded:  ${thenWithSrc.length} (src populated)`);
  console.log(`    Held for review:    ${thenHeld.length} (needsConfirmation)`);

  console.log("");
  console.log("  NOW images (NOW_IMAGES registry):");
  console.log(`    Registry size:      ${nowEntries.length} entries`);
  console.log(`    Images downloaded:  ${nowWithSrc.length} (src populated)`);
  console.log(`    Held for review:    ${nowHeld.length} (needsConfirmation)`);
  console.log(`    By tier:            pd=${nowByTier.pd}  cc-verify=${nowByTier.ccVerify}  commission=${nowByTier.commission}`);

  // List held entries
  const allHeld = [
    ...thenHeld.map(([id]) => ({ id, registry: "IMAGES (then)" as const })),
    ...nowHeld.map( ([id]) => ({ id, registry: "NOW_IMAGES (now)" as const })),
  ];
  if (allHeld.length > 0) {
    console.log("\n  Held stops (needsConfirmation — display blocked in all registries):");
    for (const { id, registry } of allHeld) {
      const entry = registry === "IMAGES (then)" ? IMAGES[id] : NOW_IMAGES[id];
      console.log(`    • [${registry}] ${id}`);
      if (entry?.note) console.log(`      Note: ${entry.note}`);
    }
  }

  console.log("");

  // ── Run all checks
  const allFailures: Failure[] = [];

  for (const [stopId, entry] of thenEntries) {
    allFailures.push(...checkEntry("IMAGES (then)", stopId, entry));
  }
  for (const [stopId, entry] of nowEntries) {
    allFailures.push(...checkEntry("NOW_IMAGES (now)", stopId, entry));
  }
  allFailures.push(...checkDualCredit());
  allFailures.push(...checkPool());

  const poolCount = Object.values(EXTRA_IMAGES).reduce((n, l) => n + l.length, 0);
  console.log(`  POOL images (EXTRA_IMAGES): ${poolCount} across ${Object.keys(EXTRA_IMAGES).length} stop(s)\n`);

  if (allFailures.length === 0) {
    console.log("  ✓ All checks passed.\n");
    console.log("    Every image with src set has:\n" +
                "      · A visible credit string (C1)\n" +
                "      · A source URL for the 'Source ↗' link (C2, C6)\n" +
                "      · Descriptive alt text (C3)\n" +
                "      · A local /journey/ path — no hotlinks (C5)\n" +
                "    No needsConfirmation entries have src set (C4).\n" +
                "    No cc-verify entries published without explicit sign-off (C7).\n" +
                "    No then→now pairs share a single credit string (C8).\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(0);
  }

  console.log(`  ✗ ${allFailures.length} failure(s):\n`);
  for (const f of allFailures) {
    console.log(`    [${f.check}] [${f.registry}] ${f.stopId}`);
    console.log(`           ${f.detail}\n`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(1);
}

main();
