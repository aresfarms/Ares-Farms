import { readFileSync } from "node:fs";

import {
  FURLONG_CASE_GOVERNANCE_VERSION,
  type FurlongCaseStage,
} from "@/lib/intelligence/furlongCaseStore";

const failures: string[] = [];
const assert = (condition: boolean, message: string) => { if (!condition) failures.push(message); };
const read = (file: string) => readFileSync(file, "utf8");

const schema = read("src/db/schema/furlongCases.ts");
const migration = read("src/lib/db/migrations/0060_furlong_case_living_record_upgrade.sql");
const api = read("src/app/api/intelligence/cases/[caseId]/route.ts");
const panel = read("src/components/intelligence/LivingFurlongCasePanel.tsx");

assert(FURLONG_CASE_GOVERNANCE_VERSION === "furlong-case-v1.0.0", "Furlong Case governance version drifted.");
for (const table of ["furlong_cases", "furlong_case_events", "furlong_case_outcome_records"]) {
  assert(schema.includes(`"${table}"`), `Schema missing ${table}.`);
  assert(migration.includes(table), `Migration missing ${table}.`);
}
for (const field of [
  "propertySnapshot",
  "businessContext",
  "borrowerReadiness",
  "environmentalContext",
  "capitalContext",
  "documentRefs",
  "permissionState",
  "providerSelections",
]) assert(schema.includes(field), `Living case missing ${field}.`);
for (const field of [
  "outcomeReasonCategory",
  "financingStructure",
  "actualRateBps",
  "actualProjectCost",
  "environmentalOutcome",
  "evidenceRefs",
]) assert(schema.includes(field), `Outcome learning missing ${field}.`);

const stages: FurlongCaseStage[] = [
  "PROPERTY_ANALYSIS",
  "FEASIBILITY",
  "FINANCING_READINESS",
  "PROVIDER_COMPARISON",
  "CASE_ROOM",
  "DILIGENCE",
  "CLOSING",
  "OPERATING_LOGBOOK",
];
for (const stage of stages) assert(panel.includes(stage), `Living case UX missing stage ${stage}.`);
assert(panel.includes("Saving or updating this case shares nothing with a lender"), "Case save must explicitly preserve no-sharing boundary.");
assert(api.includes("sessionAuthority(req)"), "Case API authority must be derived from the verified session.");
assert(!api.includes('req.nextUrl.searchParams.get("userId")'), "Case API may not trust a query-claimed userId.");
assert(api.includes('action === "record-outcome"'), "Case API must support actual-world outcome capture.");
assert(api.includes("VERIFY_OUTCOME_ROLES"), "Verified outcomes must be restricted to authorized operator/governance roles.");
assert(
  migration.includes("ALTER COLUMN idempotency_key SET NOT NULL") &&
    migration.includes("CREATE UNIQUE INDEX IF NOT EXISTS furlong_case_event_idempotency_uq"),
  "Case events require non-null unique idempotency for safe append/replay.",
);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, rule: "FURLONG-CASE-001", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  rule: "FURLONG-CASE-001",
  durableCustomerCase: true,
  appendOrientedTimeline: true,
  actualOutcomeLearning: true,
  providerSharingExplicitOnly: true,
  sessionDerivedAuthority: true,
  propertyThroughLogbook: true,
}, null, 2));
