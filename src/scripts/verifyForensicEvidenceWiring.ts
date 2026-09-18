/**
 * SEC-FORENSICS-001 evidence-class wiring verifier (Pass 01 — evidence only).
 *
 * Asserts:
 *  - the in-code configuration-snapshot capture seals + tamper-detects,
 *  - exactly the expected classes are wired (audit-logs, security-events,
 *    configuration-snapshots) and the Cloud-Logging classes remain owner-pending,
 *  - each owner-pending class declares a required export sink (the owner contract),
 *  - forensicReadinessVerified() is STILL false (3 classes remain unwired).
 *
 * Closes nothing — SEC-FORENSICS-001 stays OPEN until every class is wired and
 * the owner provisions + a later pass verifies the Cloud Logging sinks.
 */
import {
  EVIDENCE_CLASSES,
  PRESERVATION_SOURCES,
  captureConfigurationSnapshot,
  verifyConfigurationSnapshot,
  describeRequiredSink,
  forensicReadinessVerified,
  forensicReadinessStatus,
  type EvidenceClass,
} from "@/security/forensicPreservation";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) fail.push(m); };

const EXPECTED_WIRED: EvidenceClass[] = ["audit-logs", "security-events", "configuration-snapshots"];
const EXPECTED_PENDING: EvidenceClass[] = ["runtime-logs", "api-logs", "deployment-events"];

// 1 — config-snapshot capture seals + tamper-detects.
const cfg = { DISCOVERY_PRIMARY: true, LEDGER_MODE: "file", API_AUTH_ENFORCEMENT: "on", RATE_LIMITING_ENABLED: true };
const snap = captureConfigurationSnapshot({ snapshotId: "CFG-SNAP-0001", ts: "2026-06-14T00:00:00.000Z", config: cfg });
ok(snap.config_hash.startsWith("sha256:"), "config snapshot carries a sealed config_hash");
ok(snap.config_keys.length === Object.keys(cfg).length, "config snapshot records all config keys (names only)");
ok(verifyConfigurationSnapshot(snap, cfg) === true, "intact config snapshot verifies");
ok(verifyConfigurationSnapshot(snap, { ...cfg, API_AUTH_ENFORCEMENT: "off" }) === false, "TAMPER DETECTED: altered config breaks the snapshot seal");
ok(verifyConfigurationSnapshot(snap, { ...cfg, EXTRA: "x" }) === false, "TAMPER DETECTED: added config key breaks the snapshot seal");

// 2 — exactly the expected classes are wired.
ok(EXPECTED_WIRED.every((c) => PRESERVATION_SOURCES[c].wired), "expected classes are wired (audit-logs, security-events, configuration-snapshots)");
ok(EXPECTED_PENDING.every((c) => !PRESERVATION_SOURCES[c].wired), "Cloud-Logging classes remain owner-pending (runtime-logs, api-logs, deployment-events)");
const wiredCount = EVIDENCE_CLASSES.filter((c) => PRESERVATION_SOURCES[c].wired).length;
ok(wiredCount === 3, `wired count is 3/6 (got ${wiredCount})`);

// 3 — each owner-pending class declares a required export sink.
for (const c of EXPECTED_PENDING) {
  const d = describeRequiredSink(c);
  ok(!!d && d.evidence_class === c && !!d.sink_name && !!d.log_filter && d.immutable_required === true && d.min_retention_days >= 365,
    `owner sink contract present + immutable + >=365d retention for ${c}`);
}
// Wired in-code classes have no owner sink to create.
ok(describeRequiredSink("configuration-snapshots") === null, "configuration-snapshots needs no owner sink (wired in-code)");

// 4 — blocker stays open.
ok(forensicReadinessVerified() === false, "forensicReadinessVerified() is STILL false (3 classes unwired)");
const status = forensicReadinessStatus();
ok(status.pending.length === 3, "status reports 3 pending classes");

if (fail.length) { console.error(`\n✗ verify:forensic-evidence-wiring FAIL — ${fail.length}`); process.exit(1); }
console.log("\n✓ verify:forensic-evidence-wiring PASS — config-snapshot capture seals + tamper-detects; 3/6 classes wired; Cloud-Logging classes carry an immutable owner sink contract; forensicReadinessVerified()=false. EVIDENCE ONLY — SEC-FORENSICS-001 stays OPEN.");
process.exit(0);
