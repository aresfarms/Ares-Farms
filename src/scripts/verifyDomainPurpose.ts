/**
 * verify:domain-purpose — DOMAIN-GOVERNANCE-002 acceptance after the FOUNDER
 * DECISION PATCH (2026-06-14). Composes with verify:domain-governance
 * (DOMAIN-ASSET-001 stays exactly the two Furlong domains); this gate locks the
 * founder-approved SIX-domain PURPOSE registry, the role constitutional lock,
 * the Furlong/Compass boundary, defensive/typo redirect-only posture, the
 * exclusion of non-owned compass2capital.com, and that NOTHING is live or
 * production-approved while SEC-DNS-001 is open.
 */
import * as fs from "node:fs";
import {
  DOMAIN_PURPOSE_REGISTRY, domainPurpose, FURLONG_COMPASS_BOUNDARY_LOCK,
  DOMAIN_ROLE_CONSTITUTIONAL_LOCK, NON_OWNED_EXCLUDED_DOMAINS, TYPO_DOMAIN_RULES,
} from "@/security/domainPurposeRegistry";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// §7 — all six founder-confirmed owned domains registered, all owned.
const expected = [
  "furlongpathways.com", "furlonghub.com", "compasstocapital.com",
  "compasstocapital.org", "comapss2capital.com", "comapss2capital.org",
];
ok(DOMAIN_PURPOSE_REGISTRY.length === 6 && expected.every((d) => !!domainPurpose(d)),
  "all six owned domains registered in the purpose inventory");
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => d.owned), "every record marked owned");

// §3/§7 — compass2capital.com (NOT owned) must NOT appear anywhere.
ok(NON_OWNED_EXCLUDED_DOMAINS.includes("compass2capital.com"), "compass2capital.com is listed as excluded/non-owned");
ok(!DOMAIN_PURPOSE_REGISTRY.some((d) => d.domain === "compass2capital.com"),
  "compass2capital.com is NOT a registry record");

// §7 — furlongpathways.com is the PRIMARY public-domain candidate.
const pathways = domainPurpose("furlongpathways.com")!;
ok(pathways.canonicalCandidate === true && pathways.hubCandidate === false &&
   pathways.intendedRole.toLowerCase().includes("primary public-facing") &&
   pathways.moduleAlignment.some((m) => m.includes("Discovery Engine")) &&
   pathways.productionApproved === false,
  "furlongpathways.com is the primary public-domain candidate (front door), not production-approved");

// §7 — furlonghub.com is the HUB-domain candidate.
const hub = domainPurpose("furlonghub.com")!;
ok(hub.hubCandidate === true && hub.canonicalCandidate === false &&
   hub.intendedRole.toLowerCase().includes("ecosystem hub") &&
   hub.moduleAlignment.some((m) => m.includes("provider access")) &&
   hub.productionApproved === false,
  "furlonghub.com is the hub-domain candidate (provider/broker/lender/partner), not production-approved");

// §7 — compasstocapital.com is the capital-brand candidate, Furlong-owned, NOT auto Five Borough.
const compass = domainPurpose("compasstocapital.com")!;
ok(compass.capitalBrandCandidate === true && compass.canonicalCandidate === false &&
   compass.hubCandidate === false && compass.intendedRole.toLowerCase().includes("capital-navigation brand"),
  "compasstocapital.com is the capital-navigation brand candidate");
ok(compass.notes.some((n) => n.toLowerCase().includes("not automatically five borough")) &&
   compass.notes.some((n) => n.toLowerCase().includes("financing-neutrality")),
  "compasstocapital.com: Furlong-owned, not auto Five Borough, preserves financing neutrality");
ok(!compass.moduleAlignment.some((m) => m === "Furlong Core"),
  "compasstocapital.com is not Furlong Core");

// §7 — defensive / typo domains are redirect-only defensive registrations.
for (const d of ["compasstocapital.org", "comapss2capital.com", "comapss2capital.org"]) {
  const r = domainPurpose(d)!;
  ok(r.defensiveRegistration === true && r.redirectOnly === true && r.redirectTarget === "compasstocapital.com",
    `${d} is a defensive registration, redirect-only → compasstocapital.com`);
}

// §5 — role constitutional lock verbatim (four roles, not collapsed).
ok(/Furlong Pathways is the public front door/.test(DOMAIN_ROLE_CONSTITUTIONAL_LOCK) &&
   /Furlong Hub is the ecosystem hub/.test(DOMAIN_ROLE_CONSTITUTIONAL_LOCK) &&
   /Compass to Capital is the capital-navigation brand/.test(DOMAIN_ROLE_CONSTITUTIONAL_LOCK) &&
   /Five Borough Capital remains/.test(DOMAIN_ROLE_CONSTITUTIONAL_LOCK) &&
   /must not\s+collapse these roles into a single identity/.test(DOMAIN_ROLE_CONSTITUTIONAL_LOCK),
  "§5 role constitutional lock verbatim (four distinct roles, never collapsed)");

// Boundary + typo rules locked.
ok(FURLONG_COMPASS_BOUNDARY_LOCK === "Furlong informs. Compass/Five Borough performs professional financing work when separately activated.",
  "Furlong/Compass boundary lock verbatim");
ok(TYPO_DOMAIN_RULES.length === 6, "six typo/defensive-domain rules locked");

// §7/§8 — nothing live; nothing production-approved; no redirect activated; SEC-DNS-001 open.
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => d.dnsStatus === "unverified"), "no domain DNS-verified/configured/live");
ok(DOMAIN_PURPOSE_REGISTRY.every((d) => !d.productionApproved), "no domain production-approved");
{
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dash = require("@/security/securityResilienceDashboard");
  const blockers = dash.combinedProductionBlockers() as { id: string; open: boolean }[];
  ok(blockers.some((b) => b.id === "SEC-DNS-001" && b.open), "SEC-DNS-001 remains OPEN");
  ok(blockers.length === 10 && blockers.every((b) => b.open) && dash.combinedProductionReady() === false,
    "10 blockers all open; production readiness remains false");
}

// Runbook records the founder-approved inventory.
const runbook = fs.readFileSync("docs/deployment/GCP_MIGRATION_RUNBOOK.md", "utf8");
ok(/furlongpathways\.com/.test(runbook) && /furlonghub\.com/.test(runbook) &&
   /compasstocapital\.com/.test(runbook) && /compasstocapital\.org/.test(runbook) &&
   /comapss2capital\.com/.test(runbook) && /comapss2capital\.org/.test(runbook),
  "runbook carries the full six-domain inventory");
ok(/Removed[^\n]*compass2capital\.com/i.test(runbook),
  "runbook explicitly records compass2capital.com as removed / not owned");

if (fail.length) {
  console.error(`\n✗  verify:domain-purpose FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log("✓  verify:domain-purpose PASS — six founder-approved owned domains; furlongpathways=primary public front door; furlonghub=ecosystem hub; compasstocapital.com=capital-navigation brand (Furlong-owned, not auto Five Borough, financing-neutral); .org + both typo domains defensive redirect-only; non-owned compass2capital.com excluded; role constitutional lock verbatim; nothing live/approved; SEC-DNS-001 open; 10 blockers open.");
process.exit(0);
