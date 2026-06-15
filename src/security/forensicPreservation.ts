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
 * SEC-FORENSICS-001 evidence-class wiring (Pass 01): in-code, deterministic
 * capture for `configuration-snapshots`, plus a typed export-manifest CONTRACT
 * for the Cloud-Logging-sourced classes (`runtime-logs`, `api-logs`,
 * `deployment-events`). The owner provisions the actual Cloud Logging sinks; this
 * module only declares, per class, the sink the owner must create. No GCP access,
 * no sinks created here. SEC-FORENSICS-001 stays OPEN until every class is wired.
 *
 * Master Volume traceability: Vol III TECH-LEDGER-001 / TECH-REPLAY-001, Vol IV.
 */

import { createHash } from "node:crypto";

export const FORENSICS_DOCTRINE_ID = "FORENSICS-001";
export const FORENSICS_VERSION = "forensic-preservation-v0.2.0";

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

/** Whether each evidence class has a wired, preservable source. Honest defaults. */
export const PRESERVATION_SOURCES: Record<EvidenceClass, { source: string; wired: boolean }> = {
  "audit-logs": { source: "data/audit-ledger.ndjson (hash-chained, TECH-LEDGER-001)", wired: true },
  "security-events": { source: "securityRuntimeGuards.recordSecurityEvent (hash-chained)", wired: true },
  // Wired in-code by this pass: a deterministic config-snapshot capture + verifier
  // (captureConfigurationSnapshot / verifyConfigurationSnapshot) seal the config
  // registry into a tamper-evident record — no ambient reads, no GCP.
  "configuration-snapshots": { source: "captureConfigurationSnapshot() — sealed config-registry snapshot (in-code, deterministic)", wired: true },
  // Owner-pending: require Cloud Logging export sinks (see EXPORT_SINK_CONTRACT).
  "runtime-logs": { source: "Cloud Run request/stderr logs (Cloud Logging) — export sink pending (owner)", wired: false },
  "api-logs": { source: "API perimeter governance logs (Cloud Logging) — export sink pending (owner)", wired: false },
  "deployment-events": { source: "CI/CD deploy audit (Cloud Audit Logs) — export sink pending (owner)", wired: false },
};

/**
 * Export-manifest CONTRACT for Cloud-Logging-sourced evidence classes.
 *
 * This is the unambiguous owner half: for each unwired class, the exact Cloud
 * Logging sink the owner must create so the class becomes preservable. No values,
 * no project IDs, no provisioning — descriptors only. A class flips to wired
 * (above) ONLY after the owner provisions the sink AND a later pass verifies it.
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

export const EXPORT_SINK_CONTRACT: Record<
  "runtime-logs" | "api-logs" | "deployment-events",
  ExportSinkDescriptor
> = {
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

/** The owner-side sink descriptor for an unwired Cloud-Logging class, or null. */
export function describeRequiredSink(c: EvidenceClass): ExportSinkDescriptor | null {
  return c in EXPORT_SINK_CONTRACT
    ? EXPORT_SINK_CONTRACT[c as keyof typeof EXPORT_SINK_CONTRACT]
    : null;
}

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

/** PRODUCTION BLOCKER (SEC-FORENSICS-001): every evidence class has a wired preservable source. */
export function forensicReadinessVerified(): boolean {
  return EVIDENCE_CLASSES.every((c) => PRESERVATION_SOURCES[c].wired);
}

export function forensicReadinessStatus() {
  const wired = EVIDENCE_CLASSES.filter((c) => PRESERVATION_SOURCES[c].wired);
  return {
    doctrine: FORENSICS_DOCTRINE_ID,
    version: FORENSICS_VERSION,
    evidenceClasses: EVIDENCE_CLASSES.length,
    wired: wired.length,
    pending: EVIDENCE_CLASSES.filter((c) => !PRESERVATION_SOURCES[c].wired),
    /** Per-class detail: wired flag, source, and (for unwired Cloud-Logging classes) the owner sink to create. */
    classes: EVIDENCE_CLASSES.map((c) => ({
      evidence_class: c,
      wired: PRESERVATION_SOURCES[c].wired,
      source: PRESERVATION_SOURCES[c].source,
      requiredSink: describeRequiredSink(c),
    })),
    integratesWith: ["TECH-LEDGER-001", "TECH-REPLAY-001"],
    verified: forensicReadinessVerified(),
  };
}
