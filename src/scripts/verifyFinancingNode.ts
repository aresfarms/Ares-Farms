/**
 * verify:financing-node — locks the DEFERRED, gated financing-node contract:
 * not live, disclaimer is a counsel DRAFT (not published), no live fetcher,
 * ag/USDA foregrounded for land, ranges-with-basis honesty, doctrine lock, and
 * SEPARABILITY (no rendered component or the converse route imports it yet).
 */
import * as fs from "node:fs";
import {
  FINANCING_NODE_LIVE, DISCLAIMER_COUNSEL_REVIEW_REQUIRED, FINANCING_LIVE_FETCH_ACTIVE,
  FINANCING_DISCLAIMER_DRAFT, FINANCING_DATA_SOURCES, PROGRAM_FIT_NOT_QUALIFY,
  programsForAsset, financingNodeRenderable,
} from "@/lib/navigator/financing/financingNodeContract";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// Gates — deferred, not live, not published.
ok(FINANCING_NODE_LIVE === false, "financing node is NOT live (deferred build)");
ok(DISCLAIMER_COUNSEL_REVIEW_REQUIRED === true, "disclaimer flagged as counsel DRAFT (review required before publish)");
ok(FINANCING_LIVE_FETCH_ACTIVE === false, "no live FRED/FOIA/rule fetcher active in the contract");
ok(financingNodeRenderable(true) === false, "node cannot render even if 'counsel approved' is passed while DRAFT flag stands");

// Program selection — ag/USDA/FSA foregrounded for land; SBA for CRE.
const ag = programsForAsset("agricultural");
ok(ag.length > 0 && ag[0].family !== "SBA" && ag.some((p) => p.id === "usda-fsa-farm"),
  "ag/land foregrounds USDA/FSA/Farm Credit ahead of SBA");
const cre = programsForAsset("commercial");
ok(cre.some((p) => p.id === "sba-504" || p.id === "sba-7a"), "CRE/business surfaces SBA 504/7(a)");

// Honesty + doctrine.
ok(/program fitting a project is not the same as you qualifying/i.test(FINANCING_DISCLAIMER_DRAFT) &&
   /program fitting this project is not the same as you qualifying/i.test(PROGRAM_FIT_NOT_QUALIFY),
  "doctrine lock present: program fits ≠ you qualify");
ok(/not a loan offer.*credit or underwriting decision.*financial, investment, tax, or legal advice/i.test(FINANCING_DISCLAIMER_DRAFT),
  "disclaimer: not a loan offer / not credit decision / not advice (incl. tax+legal)");
ok(/Anonymous: no information you enter is sold, or submitted to any lender or provider, without your explicit action/.test(FINANCING_DISCLAIMER_DRAFT),
  "disclaimer: anonymity + no-silent-submission promise");
ok(/ranges with their basis and the date/.test(FINANCING_DISCLAIMER_DRAFT), "disclaimer: ranges-with-basis honesty rule");
ok(FINANCING_DATA_SOURCES.some((s) => /FRED/.test(s)) && FINANCING_DATA_SOURCES.some((s) => /7 CFR Part 5001/.test(s)),
  "public data sources listed by citation (FRED + federal program rules)");

// SEPARABILITY — nothing rendered or the converse route imports the node yet.
{
  const routeSrc = fs.readFileSync("src/app/api/public/navigator/converse/route.ts", "utf8");
  ok(!/financingNodeContract/.test(routeSrc), "converse route does NOT import the financing node (deferred)");
  const grep = (dir: string): string[] => {
    const out: string[] = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) out.push(...grep(p));
      else if (/\.tsx$/.test(e.name) && /financingNodeContract/.test(fs.readFileSync(p, "utf8"))) out.push(p);
    }
    return out;
  };
  ok(grep("src/components").length === 0 && grep("src/app").length === 0,
    "no rendered component imports the financing node (not shipped to users)");
}

if (fail.length) {
  console.error(`\n✗  verify:financing-node FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log("✓  verify:financing-node PASS — deferred, gated (not live), counsel-DRAFT disclaimer not published, no live fetcher, ag/USDA foregrounded for land, ranges-with-basis + program-fits-≠-qualify locked, separable from all rendered surfaces.");
process.exit(0);
