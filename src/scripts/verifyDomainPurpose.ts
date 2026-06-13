/**
 * verify:domain-purpose — DOMAIN-GOVERNANCE-002 acceptance (§9). Composes with
 * verify:domain-governance (DOMAIN-ASSET-001 stays exactly the two Furlong
 * domains); this gate locks the five-domain PURPOSE registry, the
 * Furlong/Compass boundary, typo-domain redirect-only posture, and that
 * NOTHING is live or production-approved while SEC-DNS-001 is open.
 */
import * as fs from "node:fs";
import {
  DOMAIN_PURPOSE_REGISTRY, domainPurpose, FURLONG_COMPASS_BOUNDARY_LOCK, TYPO_DOMAIN_RULES,
} from "@/security/domainPurposeRegistry";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// All five domains registered, all owned.
const expected = ["furlonghub.com", "furlongpathways.com", "compasstocapital.com", "comapss2capital.com", "comapss2capital.org"];
ok(DOMAIN_PURPOSE_REGISTRY.length === 5 && expected.every((d) => !!domainPurpose(d)),
  "all five owned domains registered in the purpose inventory");
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => d.owned), "every record marked owned");

// furlonghub: canonical CANDIDATE but NOT production-approved.
const hub = domainPurpose("furlonghub.com")!;
ok(hub.canonicalCandidate === true && hub.productionApproved === false,
  "furlonghub.com is a canonical candidate but NOT production-approved");

// compasstocapital: capital/professional module — NOT Furlong Core.
const compass = domainPurpose("compasstocapital.com")!;
ok(compass.moduleAlignment.some((m) => /Five Borough|Compass to Capital/.test(m)) &&
   !compass.moduleAlignment.some((m) => /^Furlong Core$/.test(m)),
  "compasstocapital.com maps to the capital/professional module, not Furlong Core");
ok(/NOT Furlong Core/i.test(compass.intendedRole), "compass role states NOT Furlong Core");

// Typo domains: redirect-only candidates to the canonical Compass surface.
for (const d of ["comapss2capital.com", "comapss2capital.org"]) {
  const r = domainPurpose(d)!;
  ok(r.redirectOnly === true && r.redirectTarget === "compasstocapital.com",
    `${d} is redirect-only → compasstocapital.com`);
}

// Nothing live; nothing production-approved; SEC-DNS-001 stays open.
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => d.dnsStatus !== "live"), "no domain marked live");
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => !d.productionApproved), "no domain production-approved");
{
  // SEC-DNS-001 open + production blocked (combined model unchanged).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dash = require("@/security/securityResilienceDashboard");
  const blockers = dash.combinedProductionBlockers() as { id: string; open: boolean }[];
  ok(blockers.some((b) => b.id === "SEC-DNS-001" && b.open), "SEC-DNS-001 remains OPEN");
  ok(blockers.length === 10 && blockers.every((b) => b.open) && dash.combinedProductionReady() === false,
    "10 blockers all open; production readiness remains false");
}

// Boundary + typo rules locked.
ok(FURLONG_COMPASS_BOUNDARY_LOCK === "Furlong informs. Compass/Five Borough performs professional financing work when separately activated.",
  "Furlong/Compass boundary lock verbatim");
ok(TYPO_DOMAIN_RULES.length === 6, "six typo-domain rules locked");

// Runbook records the inventory + the pending canonical decision.
const runbook = fs.readFileSync("docs/deployment/GCP_MIGRATION_RUNBOOK.md", "utf8");
ok(/furlonghub\.com/.test(runbook) && /compasstocapital\.com/.test(runbook) && /comapss2capital\.com/.test(runbook),
  "runbook carries the domain inventory");
ok(/pending Caitlin approval|Caitlin'?s approval/i.test(runbook), "runbook: canonical selection pending Caitlin approval");

if (fail.length) {
  console.error(`\n✗  verify:domain-purpose FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log("✓  verify:domain-purpose PASS — five owned domains in the purpose registry; furlonghub canonical CANDIDATE only; compass = professional-module surface (not Furlong Core); typo domains redirect-only; nothing live, nothing production-approved, SEC-DNS-001 open, 10 blockers open.");
process.exit(0);
