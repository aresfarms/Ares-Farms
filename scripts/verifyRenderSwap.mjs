// scripts/verifyRenderSwap.mjs — Living Map render-level gate (P18)
//
// The recurring failure mode is "green data, dead render": gates pass on the
// registries while the actual card sits frozen on one image. This gate loads the
// REAL page in a browser and asserts that, on a multi-image stop, the card
// cross-fades — two DISTINCT image files appear and the year label changes —
// without anyone clicking "Begin the tour".
//
// Needs the site running:  npm run dev (or npm start) at localhost:3000.
//   BASE=http://localhost:3000 node scripts/verifyRenderSwap.mjs
//
// Public Alpha remains PENDING.

import { chromium } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:3000";
const DEADLINE_MS = 20_000;

function fail(msg) { console.error(`✗  P18 render-swap FAIL — ${msg}`); }

/**
 * CANNOT-RUN IS NOT THE SAME AS FAILED (sweep finding S-4, 2026-08-11).
 *
 * This gate was red for an unknown period because Playwright's browser binary
 * was never installed on the machine. It reported a raw launch exception, and
 * the surrounding runner appended the hint "(is the dev server running?)" —
 * the WRONG diagnosis, which is exactly why nobody could see what was wrong.
 *
 * A gate that cannot tell "the map is frozen" from "I have no browser" is
 * worse than no gate: the first is a defect, the second is a laptop, and
 * conflating them trains everyone to skip past red. It exits 2 with the exact
 * remedy, distinct from the exit-1 used for a real render failure.
 */
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Executable doesn't exist|please run the following command/i.test(message)) {
    console.error(
      "–  P18 render-swap CANNOT RUN — Playwright has no browser binary on this machine.\n" +
      "   This is NOT a render failure and says nothing about the map.\n" +
      "   Fix:  npx playwright install chromium"
    );
    process.exit(2);
  }
  console.error(`✗  P18 render-swap FAIL — browser launch failed: ${message}`);
  process.exit(1);
}
try {
  const page = await browser.newPage();
  await page.goto(`${BASE}/explore?lane=property-land`, { waitUntil: "domcontentloaded" });

  // The property-land lane opens on a governed multi-image stop. Wait for
  // the first actual image, then observe the automatic cross-fade without
  // advancing the interactive map or mutating its compass state.
  await page.waitForSelector(".tour-popup-card img", { timeout: 15_000 });

  const read = () =>
    page.evaluate(() => {
      const c = document.querySelector(".tour-popup-card");
      return {
        src:   c?.querySelector("img")?.getAttribute("src") || "",
        label: c?.querySelector(".tour-popup-label")?.textContent || "",
      };
    });

  const first = await read();
  if (!first.src) { fail("no image rendered on the sampled stop"); await browser.close(); process.exit(1); }

  // Poll for a swap: a different image file AND a changed year label.
  let swapped = null;
  const start = Date.now();
  while (Date.now() - start < DEADLINE_MS) {
    await page.waitForTimeout(1000);
    const cur = await read();
    if (cur.src && cur.src !== first.src && cur.label !== first.label) { swapped = cur; break; }
  }

  await browser.close();

  if (!swapped) {
    fail(`card stayed locked on a single image (${first.src.split("/").pop()} | "${first.label.trim()}") — no earlier/later cross-fade`);
    process.exit(1);
  }

  console.log("PASS  P18  render-swap — card cross-fades two distinct images with changing year");
  console.log(`           ${first.src.split("/").pop()} ("${first.label.trim()}")  →  ${swapped.src.split("/").pop()} ("${swapped.label.trim()}")`);
  console.log("✓  P18 render-swap PASS");
  process.exit(0);
} catch (e) {
  try { await browser.close(); } catch {}
  fail(e.message.split("\n")[0]);
  process.exit(1);
}
