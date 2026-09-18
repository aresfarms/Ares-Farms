/**
 * FORENSICS-001 — Forensic preservation (governance only).
 *
 * Defines WHAT must be preserved during/after a cyber event, and the evidence
 * contract: a forensic_case_id, an evidence_hash (tamper-evident), and a
 * chain_of_custody. Integrates with TECH-LEDGER-001 (the append-only hash-chained
 * ledgers are themselves preserved evidence) and TECH-REPLAY-001 (preserved state
 * is reconstructable). No live capture happens here — this is the doctrine + the
 * pure helpers a human/operator uses to open and seal a case.
 *
 * SEC-FORENSICS-001 evidence-class wiring:
 *  - Pass 01: in-code deterministic capture for `configuration-snapshots`, plus a
 *    typed export-manifest CONTRACT for the Cloud-Logging-sourced classes.
 *  - Pass 02: structured OWNER ATTESTATION per Cloud-Logging sink + a decoupled
 *    HUMAN-REVIEW gate. A Cloud-Logging class flips to `wired:true` ONLY when its
 *    owner attestation is COMPLETE (every §3 checklist item evidenced). And the
 *    SEC-FORENSICS-001 blocker stays OPEN until ALL classes are wired AND human
 *    review is recorded — so wiring can never auto-close the blocker.
 *
 * No GCP access here; the build agent cannot itself observe a sink. The owner
 * attests sink facts; this module records the attestation and gates on it.
 *
 * Master Volume traceability: Vol III TECH-LEDGER-001 / TECH-REPLAY-001, Vol IV.
 */

import { createHash } from "node:crypto";

export const FORENSICS_DOCTRINE_ID = "FORENSICS-001";
export const FORENSICS_VERSION = "forensic-preservation-v0.3.0";

/** The evidence classes a forensic case must preserve. */
export type EvidenceClass =
  | "audit-logs"
  | "runtime-logs"
  | "api-logs"
  | "security-events"
  | "deployment-events"
  | "configuration-snapshots";

export const EVIDENCE_CLASSES: EvidenceClass[] = [
  "audit-logs", "runtime-logs", "api-logs", "security-events", "deployment-events", "configuration-snapshots",
];

/** The Cloud-Logging-sourced classes that depend on owner-provisioned sinks. */
export type CloudLoggingClass = "runtime-logs" | "api-logs" | "deployment-events";
export const CLOUD_LOGGING_CLASSES: CloudLoggingClass[] = ["runtime-logs", "api-logs", "deployment-events"];

/** Whether each evidence class has a wired, preservable source. Honest defaults. */
export const PRESERVATION_SOURCES: Record<EvidenceClass, { source: string; wired: boolean }> = {
  "audit-logs": { source: "data/audit-ledger.ndjson (hash-chained, TECH-LEDGER-001)", wired: true },
  "security-events": { source: "securityRuntimeGuards.recordSecurityEvent (hash-chained)", wired: true },
  // Wired in-code by Pass 01: a deterministic config-snapshot capture + verifier.
  "configuration-snapshots": { source: "captureConfigurationSnapshot() — sealed config-registry snapshot (in-code, deterministic)", wired: true },
  // Owner-pending: require Cloud Logging export sinks (see EXPORT_SINK_CONTRACT).
  // Pass 02 owner attestation received existence + locked-bucket routing, but the
  // attestation is NOT yet complete (filter-match / >=400d retention / writer IAM /
  // test-event / export-verify still outstanding), so these stay wired:false.
  "runtime-logs": { source: "Cloud Run request/stderr logs (Cloud Logging) — sink furlong-forensics-runtime-logs; owner attestation partial", wired: false },
  "api-logs": { source: "API perimeter governance logs (Cloud Logging) — sink furlong-forensics-api-logs; owner attestation partial", wired: false },
  "deployment-events": { source: "CI/CD deploy audit (Cloud Audit Logs) — sink furlong-forensics-deployment-events; owner attestation partial", wired: false },
};

/**
 * Export-manifest CONTRACT for Cloud-Logging-sourced evidence classes.
 *
 * This is the unambiguous owner half: for each unwired class, the exact Cloud
 * Logging sink the owner must create so the class becomes preservable. No values,
 * no project IDs, no provisioning — descriptors only. A class flips to wired
 * (above) ONLY after the owner attestation is complete AND a pass verifies it.
 */
export interface ExportSinkDescriptor {
  evidence_class: EvidenceClass;
  /** Cloud Logging sink name the owner creates. */
  sink_name: string;
  /** Logging filter that selects the records for this class. */
  log_filter: string;
  /** Destination kind for tamper-evident, retained storage. */
  destination: "gcs-bucket-object-lock" | "bigquery-dataset" | "logging-bucket-locked";
  /** Minimum retention the destination must enforce. */
  min_retention_days: number;
  /** Whether the destination must be immutable/locked (object-lock or locked bucket). */
  immutable_required: boolean;
}

export const EXPORT_SINK_CONTRACT: Record<CloudLoggingClass, ExportSinkDescriptor> = {
  "runtime-logs": {
    evidence_class: "runtime-logs",
    sink_name: "furlong-forensics-runtime-logs",
    log_filter: 'resource.type="cloud_run_revision" AND (severity>=DEFAULT)',
    destination: "logging-bucket-locked",
    min_retention_days: 400,
    immutable_required: true,
  },
  "api-logs": {
    evidence_class: "api-logs",
    sink_name: "furlong-forensics-api-logs",
    log_filter: 'resource.type="cloud_run_revision" AND jsonPayload.channel="api-perimeter"',
    destination: "gcs-bucket-object-lock",
    min_retention_days: 400,
    immutable_required: true,
  },
  "deployment-events": {
    evidence_class: "deployment-events",
    sink_name: "furlong-forensics-deployment-events",
    log_filter: 'logName:"cloudaudit.googleapis.com" AND protoPayload.serviceName="run.googleapis.com"',
    destination: "gcs-bucket-object-lock",
    min_retention_days: 400,
    immutable_required: true,
  },
};

/** The owner-side sink descriptor for a Cloud-Logging class, or null. */
export function describeRequiredSink(c: EvidenceClass): ExportSinkDescriptor | null {
  return c in EXPORT_SINK_CONTRACT
    ? EXPORT_SINK_CONTRACT[c as CloudLoggingClass]
    : null;
}

/**
 * OWNER ATTESTATION (Pass 02) for a Cloud-Logging sink. Each boolean is an
 * owner-attested fact the build agent cannot itself observe (no GCP access). A
 * class is wiring-eligible ONLY when every field is true (see
 * sinkAttestationComplete). Names/settings only — never secret values.
 */
export interface SinkOwnerAttestation {
  evidence_class: CloudLoggingClass;
  sink_name: string;
  attested_on: string | null;
  /** §3 checklist items, owner-attested. */
  sink_exists: boolean;
  filter_matches_contract: boolean;
  destination_immutable_or_locked: boolean;
  retention_min_400d: boolean;
  writer_identity_bound: boolean;
  test_event_observed: boolean;
  export_verified: boolean;
  evidence_file_owner_side: boolean;
}

/**
 * Pass 02 owner attestations — recorded from the owner's 2026-06-14 report:
 * "logging-bucket-locked exists; sinks furlong-forensics-{runtime-logs,api-logs,
 * deployment-events} are present, enabled, routed to that bucket."
 *
 * That covers sink_exists + destination_immutable_or_locked. It does NOT yet
 * cover filter_matches_contract, retention_min_400d, writer_identity_bound,
 * test_event_observed, export_verified, or evidence_file_owner_side — so each
 * attestation is INCOMPLETE and the class stays wired:false.
 */
export const SINK_OWNER_ATTESTATIONS: Record<CloudLoggingClass, SinkOwnerAttestation> = {
  "runtime-logs": {
    evidence_class: "runtime-logs", sink_name: "furlong-forensics-runtime-logs", attested_on: "2026-06-14",
    sink_exists: true, destination_immutable_or_locked: true,
    filter_matches_contract: false, retention_min_400d: false, writer_identity_bound: false,
    test_event_observed: false, export_verified: false, evidence_file_owner_side: false,
  },
  "api-logs": {
    evidence_class: "api-logs", sink_name: "furlong-forensics-api-logs", attested_on: "2026-06-14",
    sink_exists: true, destination_immutable_or_locked: true,
    filter_matches_contract: false, retention_min_400d: false, writer_identity_bound: false,
    test_event_observed: false, export_verified: false, evidence_file_owner_side: false,
  },
  "deployment-events": {
    evidence_class: "deployment-events", sink_name: "furlong-forensics-deployment-events", attested_on: "2026-06-14",
    sink_exists: true, destination_immutable_or_locked: true,
    filter_matches_contract: false, retention_min_400d: false, writer_identity_bound: false,
    test_event_observed: false, export_verified: false, evidence_file_owner_side: false,
  },
};

/** The §3 checklist items that must ALL be owner-attested for a class to be wiring-eligible. */
export function sinkAttestationGaps(c: CloudLoggingClass): string[] {
  const a = SINK_OWNER_ATTESTATIONS[c];
  const gaps: string[] = [];
  if (!a.sink_exists) gaps.push("sink_exists");
  if (!a.filter_matches_contract) gaps.push("filter_matches_contract");
  if (!a.destination_immutable_or_locked) gaps.push("destination_immutable_or_locked");
  if (!a.retention_min_400d) gaps.push("retention_min_400d");
  if (!a.writer_identity_bound) gaps.push("writer_identity_bound");
  if (!a.test_event_observed) gaps.push("test_event_observed");
  if (!a.export_verified) gaps.push("export_verified");
  if (!a.evidence_file_owner_side) gaps.push("evidence_file_owner_side");
  return gaps;
}

/** A sink is wiring-eligible only when its owner attestation has zero gaps. */
export function sinkAttestationComplete(c: CloudLoggingClass): boolean {
  return sinkAttestationGaps(c).length === 0;
}

/**
 * Decoupled HUMAN-REVIEW gate for SEC-FORENSICS-001. Even once every class is
 * wired, the blocker stays OPEN until a human records this attestation. This is
 * what guarantees wiring can never auto-close the blocker. Stays false until a
 * human (Caitlin / reviewer) records sign-off in a future pass.
 */
export const FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE = false;

export interface CustodyEntry {
  ts: string;
  actor: string; // role
  action: "opened" | "collected" | "sealed" | "transferred" | "accessed";
  note: string;
}

export interface ForensicCase {
  forensic_case_id: string;
  opened_at: string;
  scenario: string;
  evidence: { class: EvidenceClass; ref: string; sha256: string }[];
  /** Hash over the whole evidence manifest — the seal. */
  evidence_hash: string;
  chain_of_custody: CustodyEntry[];
  sealed: boolean;
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

/**
 * Open + seal a forensic case from collected evidence refs. Pure: the caller
 * supplies the evidence (ref + content hash); this computes the manifest hash and
 * the initial chain of custody. Deterministic given inputs (ts is passed in).
 */
export function openForensicCase(input: {
  caseId: string;
  ts: string;
  scenario: string;
  actor: string;
  evidence: { class: EvidenceClass; ref: string; sha256: string }[];
}): ForensicCase {
  const manifest = input.evidence
    .map((e) => `${e.class}:${e.ref}:${e.sha256}`)
    .sort()
    .join("\n");
  const evidence_hash = "sha256:" + sha256(`${input.caseId}|${input.scenario}|${manifest}`);
  return {
    forensic_case_id: input.caseId,
    opened_at: input.ts,
    scenario: input.scenario,
    evidence: input.evidence,
    evidence_hash,
    chain_of_custody: [
      { ts: input.ts, actor: input.actor, action: "opened", note: `case opened for ${input.scenario}` },
      { ts: input.ts, actor: input.actor, action: "sealed", note: `manifest sealed (${input.evidence.length} items)` },
    ],
    sealed: true,
  };
}

/** Re-derive the seal and confirm it matches (tamper check). */
export function verifyForensicSeal(c: ForensicCase): boolean {
  const manifest = c.evidence.map((e) => `${e.class}:${e.ref}:${e.sha256}`).sort().join("\n");
  return c.evidence_hash === "sha256:" + sha256(`${c.forensic_case_id}|${c.scenario}|${manifest}`);
}

/**
 * A sealed configuration snapshot — preserved evidence for the
 * `configuration-snapshots` class. Captured deterministically from an explicit
 * config/registry object the caller supplies (NO ambient reads of env, disk, or
 * network), so it is replay-safe and reproducible.
 */
export interface ConfigurationSnapshot {
  evidence_class: "configuration-snapshots";
  snapshot_id: string;
  captured_at: string;
  /** Sorted key list of the captured config (names only — see hard rule below). */
  config_keys: string[];
  /** sha256 over the canonicalized config — the seal. */
  config_hash: string;
}

/**
 * Capture + seal a configuration snapshot. Deterministic given inputs.
 *
 * HARD RULE: callers pass non-secret CONFIG only (flag names + non-sensitive
 * values). Do NOT pass secret values; this records keys and a content hash for
 * tamper-evidence, not a credential store.
 */
export function captureConfigurationSnapshot(input: {
  snapshotId: string;
  ts: string;
  config: Record<string, string | number | boolean | null>;
}): ConfigurationSnapshot {
  const config_keys = Object.keys(input.config).sort();
  const canonical = config_keys.map((k) => `${k}=${String(input.config[k])}`).join("\n");
  const config_hash = "sha256:" + sha256(`${input.snapshotId}|${canonical}`);
  return {
    evidence_class: "configuration-snapshots",
    snapshot_id: input.snapshotId,
    captured_at: input.ts,
    config_keys,
    config_hash,
  };
}

/** Re-derive the snapshot seal from the original config (tamper check). */
export function verifyConfigurationSnapshot(
  snap: ConfigurationSnapshot,
  config: Record<string, string | number | boolean | null>,
): boolean {
  const canonical = Object.keys(config).sort().map((k) => `${k}=${String(config[k])}`).join("\n");
  return snap.config_hash === "sha256:" + sha256(`${snap.snapshot_id}|${canonical}`);
}

/**
 * PRODUCTION BLOCKER (SEC-FORENSICS-001): every evidence class has a wired
 * preservable source AND human review of the forensic-readiness package is
 * recorded. The human-review conjunct ensures wiring alone never auto-closes
 * the blocker.
 */
export function forensicReadinessVerified(): boolean {
  return EVIDENCE_CLASSES.every((c) => PRESERVATION_SOURCES[c].wired)
    && FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE;
}

export function forensicReadinessStatus() {
  const wired = EVIDENCE_CLASSES.filter((c) => PRESERVATION_SOURCES[c].wired);
  return {
    doctrine: FORENSICS_DOCTRINE_ID,
    version: FORENSICS_VERSION,
    evidenceClasses: EVIDENCE_CLASSES.length,
    wired: wired.length,
    pending: EVIDENCE_CLASSES.filter((c) => !PRESERVATION_SOURCES[c].wired),
    humanReviewComplete: FORENSIC_READINESS_HUMAN_REVIEW_COMPLETE,
    /** Per-class detail: wired flag, source, owner sink, and (Cloud-Logging) attestation state. */
    classes: EVIDENCE_CLASSES.map((c) => ({
      evidence_class: c,
      wired: PRESERVATION_SOURCES[c].wired,
      source: PRESERVATION_SOURCES[c].source,
      requiredSink: describeRequiredSink(c),
      attestationComplete: c in EXPORT_SINK_CONTRACT ? sinkAttestationComplete(c as CloudLoggingClass) : null,
      attestationGaps: c in EXPORT_SINK_CONTRACT ? sinkAttestationGaps(c as CloudLoggingClass) : null,
    })),
    integratesWith: ["TECH-LEDGER-001", "TECH-REPLAY-001"],
    verified: forensicReadinessVerified(),
  };
}
