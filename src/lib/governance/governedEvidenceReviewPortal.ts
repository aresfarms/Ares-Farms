import { createHash } from "node:crypto";

import type { LedgerEvent } from "@/lib/audit/appendLedger";
import type { ModuleManifest } from "@/lib/modules/moduleRegistry";

export const GOVERNED_EVIDENCE_REVIEW_RULE =
  "GOVERNED-EVIDENCE-REVIEW-PORTAL-001" as const;

export type EvidenceReviewScope =
  | { kind: "PLATFORM" }
  | { kind: "MODULE"; moduleId: string };

export type HashChainVerification = {
  ok: boolean;
  chained: number;
  legacy: number;
  brokenAt: number | null;
};

export type RuleMatch = {
  ruleId: string;
  label: string;
  status: "MATCH" | "MISMATCH" | "NOT_APPLICABLE" | "REVIEW_REQUIRED";
  explanation: string;
  evidenceRefs: string[];
};

export type PlainLanguageTimelineEntry = {
  occurredAt: string;
  actor: string;
  action: string;
  subject: string;
  whatHappened: string;
  whyItMatters: string;
  sourceRef: string;
  cryptographicCoverage: "CHAINED" | "LEGACY_UNCHAINED" | "UNKNOWN";
};

export type GovernedEvidencePacket = {
  schemaVersion: "governed-evidence-packet-v1";
  packetId: string;
  generatedAt: string;
  scope: EvidenceReviewScope;
  moduleCount: number;
  moduleIds: string[];
  evidenceEventCount: number;
  chainVerification: HashChainVerification;
  integrityConclusion:
    | "CRYPTOGRAPHIC_CHAIN_VERIFIED"
    | "PARTIALLY_VERIFIED_WITH_LEGACY_RECORDS"
    | "INTEGRITY_FAILURE"
    | "NO_CHAINED_RECORDS";
  ruleMatches: RuleMatch[];
  timeline: PlainLanguageTimelineEntry[];
  unresolvedIssues: string[];
  legalBoundary: string;
  replayRule: "TECH-REPLAY-001";
  appendOnlyRule: "TECH-LEDGER-001";
  packetSha256: string;
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function integrityConclusion(verification: HashChainVerification): GovernedEvidencePacket["integrityConclusion"] {
  if (!verification.ok) return "INTEGRITY_FAILURE";
  if (verification.chained === 0) return "NO_CHAINED_RECORDS";
  if (verification.legacy > 0) return "PARTIALLY_VERIFIED_WITH_LEGACY_RECORDS";
  return "CRYPTOGRAPHIC_CHAIN_VERIFIED";
}

function relevantEvents(input: {
  scope: EvidenceReviewScope;
  events: LedgerEvent[];
  modules: ModuleManifest[];
}): LedgerEvent[] {
  if (input.scope.kind === "PLATFORM") return input.events;
  const moduleId = input.scope.moduleId;
  const selected = input.modules.find((module) => module.id === moduleId);
  if (!selected) return [];
  const tokens = new Set([
    selected.id.toLowerCase(),
    selected.route.toLowerCase(),
    selected.title.toLowerCase(),
    ...selected.eventsPublished.map((event) => event.toLowerCase()),
    ...selected.eventsConsumed.map((event) => event.toLowerCase()),
  ]);
  return input.events.filter((event) => {
    const haystack = [event.domain, event.subject, event.decision, event.reason]
      .join(" ")
      .toLowerCase();
    return [...tokens].some((token) => token && haystack.includes(token));
  });
}

function timeline(events: LedgerEvent[], verification: HashChainVerification): PlainLanguageTimelineEntry[] {
  const legacyBoundary = verification.legacy;
  return events
    .slice()
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((event, index) => ({
      occurredAt: event.ts,
      actor: event.actorName || event.actorId || "Unknown recorded actor",
      action: event.decision,
      subject: event.subject,
      whatHappened: `${event.actorName || event.actorId || "A recorded actor"} recorded ${event.decision} for ${event.subject}.`,
      whyItMatters: event.reason || "The event is part of the governed operational history.",
      sourceRef: `audit-ledger://event/${index + 1}`,
      cryptographicCoverage:
        verification.chained === 0
          ? "LEGACY_UNCHAINED"
          : index < legacyBoundary
            ? "LEGACY_UNCHAINED"
            : "CHAINED",
    }));
}

function moduleRules(modules: ModuleManifest[], verification: HashChainVerification): RuleMatch[] {
  const allReplay = modules.every((module) => module.replayRequired);
  const allBlocked = modules.every((module) => module.productionBlocked);
  const allHaveClaims = modules.every((module) => Boolean(module.claimsProfile));
  return [
    {
      ruleId: "TECH-LEDGER-001",
      label: "Append-only and tamper-evident ledger integrity",
      status: verification.ok && verification.chained > 0
        ? verification.legacy > 0 ? "REVIEW_REQUIRED" : "MATCH"
        : verification.ok ? "REVIEW_REQUIRED" : "MISMATCH",
      explanation: !verification.ok
        ? `The SHA-256 chain failed at ledger index ${verification.brokenAt ?? "unknown"}.`
        : verification.chained === 0
          ? "No records are currently covered by the SHA-256 chain; records are disclosed as legacy unchained evidence."
          : verification.legacy > 0
            ? `${verification.chained} chained records verify, but ${verification.legacy} earlier records remain legacy and unchained.`
            : `${verification.chained} records verify through the SHA-256 chain with no legacy gap.`,
      evidenceRefs: ["data/audit-ledger.ndjson", "src/lib/security/ledgerHashChain.ts"],
    },
    {
      ruleId: "TECH-REPLAY-001",
      label: "Deterministic replay requirement",
      status: allReplay ? "MATCH" : "MISMATCH",
      explanation: allReplay
        ? "Every module in scope declares replayRequired = true."
        : "At least one module in scope does not declare the deterministic replay boundary.",
      evidenceRefs: modules.map((module) => `module://${module.id}`),
    },
    {
      ruleId: "PRODUCTION-BLOCK-001",
      label: "No production or external reliance authorization",
      status: allBlocked ? "MATCH" : "MISMATCH",
      explanation: allBlocked
        ? "Every module in scope remains production blocked."
        : "At least one module in scope is not production blocked and requires review.",
      evidenceRefs: modules.map((module) => `module://${module.id}/productionBlocked`),
    },
    {
      ruleId: "PUBLIC-CLAIMS-001",
      label: "Claims and disclosure profile present",
      status: allHaveClaims ? "MATCH" : "REVIEW_REQUIRED",
      explanation: allHaveClaims
        ? "Every module in scope has a claims profile."
        : "At least one module lacks an explicit claims profile.",
      evidenceRefs: modules.map((module) => `module://${module.id}/claimsProfile`),
    },
  ];
}

export function composeGovernedEvidencePacket(input: {
  scope: EvidenceReviewScope;
  modules: ModuleManifest[];
  events: LedgerEvent[];
  chainVerification: HashChainVerification;
  generatedAt?: string;
}): GovernedEvidencePacket {
  const scopedModuleId = input.scope.kind === "MODULE" ? input.scope.moduleId : null;
  const selectedModules = scopedModuleId === null
    ? input.modules
    : input.modules.filter((module) => module.id === scopedModuleId);
  if (scopedModuleId !== null && selectedModules.length !== 1) {
    throw new Error(`Unknown module scope: ${scopedModuleId}`);
  }
  const selectedEvents = relevantEvents({
    scope: input.scope,
    events: input.events,
    modules: selectedModules,
  });
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const base = {
    schemaVersion: "governed-evidence-packet-v1" as const,
    packetId: `gep-${createHash("sha256").update(`${input.scope.kind}:${input.scope.kind === "MODULE" ? input.scope.moduleId : "platform"}:${generatedAt}`).digest("hex").slice(0, 20)}`,
    generatedAt,
    scope: input.scope,
    moduleCount: selectedModules.length,
    moduleIds: selectedModules.map((module) => module.id).sort(),
    evidenceEventCount: selectedEvents.length,
    chainVerification: input.chainVerification,
    integrityConclusion: integrityConclusion(input.chainVerification),
    ruleMatches: moduleRules(selectedModules, input.chainVerification),
    timeline: timeline(selectedEvents, input.chainVerification),
    unresolvedIssues: [
      ...(input.chainVerification.legacy > 0
        ? [`${input.chainVerification.legacy} legacy ledger record(s) are not covered by the SHA-256 chain.`]
        : []),
      ...(!input.chainVerification.ok
        ? ["Ledger integrity verification failed; preserve evidence and escalate before relying on the packet."]
        : []),
    ],
    legalBoundary:
      "This packet presents governed records, cryptographic verification posture, and deterministic replay references. It does not determine admissibility, authenticity under a particular rules-of-evidence standard, legal effect, liability, or the merits of any dispute. Those determinations remain with qualified counsel and the tribunal.",
    replayRule: "TECH-REPLAY-001" as const,
    appendOnlyRule: "TECH-LEDGER-001" as const,
  };
  return {
    ...base,
    packetSha256: createHash("sha256").update(stable(base)).digest("hex"),
  };
}
