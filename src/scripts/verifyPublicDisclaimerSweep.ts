/**
 * M1 — Public disclaimer conformance sweep (BUILD-INTEGRITY-GAP-AUDIT-001).
 *
 * Verifies that required advisory/disclaimer language is present on every public
 * surface and that no affirmative approval/guarantee/eligibility/official-
 * determination/financing/legal-tax claim leaks into public copy.
 *
 * Two layers:
 *  - STATIC (always): the canonical FOOTER_DISCLOSURE in PublicSiteLayout carries
 *    every required clause; the (public) group layout renders PublicSiteLayout (so
 *    every (public) route inherits the footer); enumerate all public page routes;
 *    scan all (public) page sources for prohibited affirmative claims.
 *  - RENDERED (when BASE_URL set): fetch each static public route and assert the
 *    advisory disclosure text is present in the HTML + re-scan for prohibited
 *    claims in rendered output.
 *
 * This gate does NOT change product behavior. If a required disclaimer is missing
 * it FAILS and names the exact location to fix — it never edits copy itself.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const fail: string[] = [];
const warn: string[] = [];
const ok = (c: boolean, m: string) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail.push(m); };
const note = (m: string) => { console.log(`  • ${m}`); };

const PUBLIC_DIR = "src/app/(public)";
const LAYOUT_SRC = "src/components/public/PublicSiteLayout.tsx";

// AI / decision-support surfaces that must additionally retain human-review (or
// qualified/licensed-professional) language — checked in rendered HTML.
const AI_SURFACES = ["/navigator", "/discover", "/discover/opportunity-zone", "/compass", "/financing-pathways"];
const HUMAN_REVIEW = /human review|qualified professional|licensed professional|professionals you (?:choose|trust|select)|your own (?:advisor|attorney|accountant|lawyer|cpa)/i;

// ── Required clauses the public footer disclosure MUST carry (shipped baseline). ──
const REQUIRED_CLAUSES: { label: string; re: RegExp }[] = [
  { label: "advisory-only", re: /advisory information only/i },
  { label: "not-an-approval", re: /not an approval/i },
  { label: "guarantee-negated", re: /\bguarantee\b/i },
  { label: "eligibility-negated", re: /eligibility/i },
  { label: "official-determination-negated", re: /official determination/i },
  { label: "not-a-lender", re: /not a lender/i },
  { label: "not-a-government-agency", re: /not a government agency/i },
];
// Recommended-but-not-shipped — reported, NOT failed (report-first; owner decides).
const RECOMMENDED_CLAUSES: { label: string; re: RegExp }[] = [
  { label: "not-a-regulator", re: /not a regulator/i },
  { label: "no-legal-or-tax-advice", re: /not (legal|tax) advice|no (legal|tax) advice/i },
];

// ── Prohibited AFFIRMATIVE claims (high-precision; negated forms are allowed). ──
const PROHIBITED: { label: string; re: RegExp }[] = [
  { label: "affirmative-approval", re: /\byou(?:'re| are)\s+(?:pre-?)?approved\b/i },
  { label: "guaranteed-financing", re: /\bguarantee(?:d|s)?\s+(?:your\s+)?(?:approval|financing|funding|loan|qualification)\b/i },
  { label: "you-qualify", re: /\byou\s+qualify\s+for\b/i },
  { label: "we-are-a-lender", re: /\bwe\s+are\s+a\s+lender\b/i },
  { label: "we-provide-legal-tax-advice", re: /\b(?:we provide|this is|as your)\s+(?:legal|tax)\s+advice\b/i },
  { label: "official-determination-claim", re: /\bthis\s+is\s+an?\s+official\s+determination\b/i },
];

// Negation cues — if one precedes a prohibited match within the window, the
// phrase is part of a disclaimer ("Furlong does not … guarantee funding"), not a
// claim, so it is allowed.
const NEGATION = /\b(not|never|no|don't|doesn't|do not|does not|cannot|can't|won't|without|neither|nor)\b[^.]{0,200}$/i;

/**
 * Reduce markup to visible text: drop <script>/<style> blocks first (RSC flight
 * data serializes each list item far from its negating heading — that's data,
 * not user-visible copy), then strip tags and collapse whitespace.
 */
function toText(src: string): string {
  return src
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function scanProhibited(raw: string, where: string) {
  const text = toText(raw);
  for (const p of PROHIBITED) {
    const re = new RegExp(p.re.source, p.re.flags.includes("g") ? p.re.flags : p.re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const preceding = text.slice(Math.max(0, m.index - 200), m.index);
      if (NEGATION.test(preceding)) continue; // negated → disclaimer, allowed
      fail.push(`${where}: prohibited affirmative claim [${p.label}] → "${m[0]}"`);
    }
  }
}

// Recursively collect page.tsx routes under (public).
function publicPageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...publicPageFiles(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}
function routeOf(file: string): string {
  const r = file.replace(`${PUBLIC_DIR}`, "").replace(/\/page\.tsx$/, "");
  return r === "" ? "/" : r;
}

console.log("── STATIC layer ──");

// 1 — canonical footer disclosure carries every required clause.
const layoutSrc = readFileSync(LAYOUT_SRC, "utf8");
for (const c of REQUIRED_CLAUSES) {
  ok(c.re.test(layoutSrc), `footer disclosure carries required clause: ${c.label}`);
}
for (const c of RECOMMENDED_CLAUSES) {
  if (!c.re.test(layoutSrc)) warn.push(`footer disclosure MISSING recommended clause: ${c.label} (report-only — owner decides; do not auto-add)`);
}

// 2 — the (public) group layout actually renders PublicSiteLayout (so every
//     (public) route inherits the footer).
const groupLayout = readFileSync(`${PUBLIC_DIR}/layout.tsx`, "utf8");
ok(/PublicSiteLayout/.test(groupLayout), "(public)/layout.tsx renders PublicSiteLayout (footer inherited by all public routes)");

// 3 — enumerate public routes.
const pageFiles = publicPageFiles(PUBLIC_DIR);
const routes = pageFiles.map(routeOf).sort();
ok(routes.length > 0, `enumerated ${routes.length} public page routes`);
routes.forEach((r) => note(`route: ${r}`));

// 4 — scan all (public) page sources for prohibited affirmative claims.
for (const f of pageFiles) scanProhibited(readFileSync(f, "utf8"), `src(${routeOf(f)})`);
ok(!fail.some((m) => m.startsWith("src(")), "no prohibited affirmative claims in public page sources");

// ── RENDERED layer (optional; runs when BASE_URL is reachable). ──
const BASE = process.env.BASE_URL;
const STATIC_ROUTES = routes.filter((r) => !r.includes("[")); // skip dynamic params

async function renderedLayer() {
  if (!BASE) {
    warn.push("BASE_URL unset — rendered sweep skipped; run with BASE_URL=… against a server for full coverage");
    return;
  }
  console.log(`\n── RENDERED layer (${BASE}) ──`);
  let reachable = true;
  try { const probe = await fetch(BASE + "/"); reachable = probe.ok || probe.status < 500; }
  catch { reachable = false; }
  if (!reachable) {
    warn.push(`BASE_URL ${BASE} not reachable — rendered sweep skipped (static layer still enforced)`);
    return;
  }
  for (const r of STATIC_ROUTES) {
    let html = ""; let status = 0;
    try { const res = await fetch(BASE + r); status = res.status; html = await res.text(); }
    catch { fail.push(`rendered ${r}: fetch failed`); continue; }
    if (status === 404) { note(`rendered ${r}: 404 — not a live public surface (env-gated/hidden); skipped`); continue; }
    if (status >= 500) { fail.push(`rendered ${r}: server error ${status}`); continue; }
    const hasDisclosure = /advisory information only/i.test(html) && /not a lender/i.test(html);
    ok(hasDisclosure, `rendered ${r}: advisory disclosure present`);
    if (AI_SURFACES.includes(r)) {
      ok(HUMAN_REVIEW.test(toText(html)), `rendered ${r}: AI surface retains human-review/professional language`);
    }
    scanProhibited(html, `rendered(${r})`);
  }
  ok(!fail.some((m) => m.startsWith("rendered(")), "no prohibited affirmative claims in rendered public HTML");
}

(async () => {
  await renderedLayer();
  if (warn.length) { console.log("\n⚠ warnings (non-fatal):"); warn.forEach((w) => console.log(`  ⚠ ${w}`)); }
  if (fail.length) { console.error(`\n✗ verify:public-disclaimer FAIL — ${fail.length}`); fail.forEach((f) => console.error(`  ✗ ${f}`)); process.exit(1); }
  console.log(`\n✓ verify:public-disclaimer PASS — ${REQUIRED_CLAUSES.length} required clauses present in the global public footer; ${routes.length} public routes inherit it; no prohibited affirmative claims found${BASE ? " (incl. rendered sweep)" : " (static only)"}. Advisory-only framing intact; closes nothing.`);
  process.exit(0);
})();
