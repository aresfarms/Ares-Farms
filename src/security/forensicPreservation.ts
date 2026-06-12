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
 * Master Volume traceability: Vol III TECH-LEDGER-001 / TECH-REPLAY-001, Vol IV.
 */

import { createHash } from "node:crypto";

export const FORENSICS_DOCTRINE_ID = "FORENSICS-001";
export const FORENSICS_VERSION = "forensic-preservation-v0.1.0";

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
  "runtime-logs": { source: "Cloud Run request/stderr logs (Cloud Logging) — export sink pending", wired: false },
  "api-logs": { source: "API perimeter governance logs — export sink pending", wired: false },
  "deployment-events": { source: "CI/CD deploy audit (Cloud Audit Logs) — export sink pending", wired: false },
  "configuration-snapshots": { source: "IaC state + config registry snapshot — capture job pending", wired: false },
};

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

/** PRODUCTION BLOCKER (SEC-FORENSICS-001): every evidence class has a wired preservable source. */
export function forensicReadinessVerified(): boolean {
  return EVIDENCE_CLASSES.every((c) => PRESERVATION_SOURCES[c].wired);
}

export function forensicReadinessStatus() {
  const wired = EVIDENCE_CLASSES.filter((c) => PRESERVATION_SOURCES[c].wired);
  return {
    doctrine: FORENSICS_DOCTRINE_ID,
    evidenceClasses: EVIDENCE_CLASSES.length,
    wired: wired.length,
    pending: EVIDENCE_CLASSES.filter((c) => !PRESERVATION_SOURCES[c].wired),
    integratesWith: ["TECH-LEDGER-001", "TECH-REPLAY-001"],
    verified: forensicReadinessVerified(),
  };
}
