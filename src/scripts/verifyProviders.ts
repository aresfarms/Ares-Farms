/**
 * verify:providers — neutral-directory / license-to-operate guardrails.
 *
 *   MODEL      Each Provider Page states the license-to-operate model verbatim
 *              (pays a license fee · no referral fee · no commission · no data
 *              sale/submission · providers pay to belong) — and NEVER publishes
 *              the fee amount.
 *   SEPARATION Provider is marked a separate company; the provider's claims are
 *              clearly attributed to the provider ("not Furlong's"), and Furlong's
 *              own <Disclosures> still render.
 *   NO-SUBMIT  The page is link-out only — no <form>, no personal-data inputs;
 *              the CTA opens the provider's own site (target=_blank). Furlong
 *              passes no data (no silent submission).
 *
 * Requires the dev server (BASE_URL, default :3000). Exit 0 only if all pass.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PROVIDERS, licenseModelStatement } from "../lib/providers/providerRegistry";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const ROOT = process.cwd();
const fail: string[] = [];
const note = (m: string) => fail.push(m);
const read = (rel: string) => { try { return readFileSync(join(ROOT, rel), "utf8"); } catch { return ""; } };

const MODEL_PHRASES = [
  "pays Furlong a license fee",
  "does not take referral fees",
  "does not earn a commission on your deal",
  "does not sell or submit your information",
  "Providers pay to belong",
];

// ── Static: registry + page source ───────────────────────────────────────────
const registry = read("src/lib/providers/providerRegistry.ts");
const stmt = licenseModelStatement("ACME");
for (const p of MODEL_PHRASES) if (!stmt.includes(p)) note(`MODEL: licenseModelStatement() is missing "${p}".`);
if (/\$\s?\d/.test(registry)) note("MODEL: provider registry appears to contain a fee amount ($…) — the fee amount must never be published.");
if (PROVIDERS.length === 0) note("registry has no providers.");
for (const p of PROVIDERS) {
  if (!/^https:\/\//.test(p.portalOutUrl)) note(`SEPARATION: ${p.slug} portalOutUrl must be the provider's own https site.`);
  if (!p.separateCompanyLabel) note(`SEPARATION: ${p.slug} missing separateCompanyLabel.`);
  if (p.providerClaims.length === 0 || p.providerDisclosures.length === 0) note(`SEPARATION: ${p.slug} must carry its own claims AND its own disclosures.`);
}

const page = read("src/app/(public)/providers/[slug]/page.tsx");
if (!page.includes("<Disclosures")) note("SEPARATION: Provider Page must render Furlong's <Disclosures>.");
if (!page.includes("licenseModelStatement")) note("MODEL: Provider Page must render the licenseModelStatement.");
if (!/not Furlong&apos;s|not Furlong's/.test(page)) note("SEPARATION: Provider Page must attribute the provider's claims as 'not Furlong's'.");
if (!page.includes('target="_blank"')) note("NO-SUBMIT: portal-out CTA must open the provider's own site (target=_blank).");
if (/<form\b/.test(page)) note("NO-SUBMIT: Provider Page must not contain a <form> (link-out only — Furlong passes no data).");

// ── Runtime: the live Five Borough page ──────────────────────────────────────
async function runtime(): Promise<void> {
  try { await fetch(BASE); } catch { note(`server not reachable at ${BASE}.`); return; }
  for (const p of PROVIDERS) {
    const res = await fetch(`${BASE}/providers/${p.slug}`, { headers: { Accept: "text/html" } });
    if (res.status !== 200) { note(`${p.slug}: page returned ${res.status}.`); continue; }
    const body = await res.text();
    // Visible text only — strip framework scripts/styles (Next streaming emits
    // tokens like "$1"/"$L…" in inline scripts that are not page content).
    const visible = body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
    for (const phrase of MODEL_PHRASES) if (!body.includes(phrase)) note(`MODEL(${p.slug}): rendered page missing "${phrase}".`);
    if (!/separate company/i.test(body)) note(`SEPARATION(${p.slug}): rendered page missing the "separate company" label.`);
    if (!/not a lender|advisory only|not an approval/i.test(body)) note(`SEPARATION(${p.slug}): Furlong disclosures not present on the page.`);
    if (/<form\b/i.test(visible)) note(`NO-SUBMIT(${p.slug}): rendered page contains a <form> — link-out only.`);
    if (/\$\s?\d/.test(visible)) note(`MODEL(${p.slug}): rendered page shows a dollar amount — the license fee must never be published.`);
    if (!body.includes(p.portalOutUrl)) note(`NO-SUBMIT(${p.slug}): portal-out link to the provider's own site not found.`);
  }
}

async function main(): Promise<void> {
  await runtime();
  console.log(`verify:providers — ${PROVIDERS.length} provider(s) checked against ${BASE}`);
  if (fail.length) {
    console.error(`\n✗  verify:providers FAIL — ${fail.length} issue(s):`);
    for (const f of fail) console.error(`    ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n✓  verify:providers PASS — license model stated (no fee amount), providers separate + self-attributed, link-out only (no data submission).");
  process.exit(0);
}

main().catch((e) => { console.error("verify:providers FAIL —", e); process.exit(1); });
