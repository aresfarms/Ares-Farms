import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runtimeStatePath } from "@/lib/property/runtimeStatePath";
import { readRequiredSecret } from "@/lib/security/requestGuards";
import {
  buildInternalChangeVerificationReport,
  internalChangeReportHash,
  type FounderPrincipal,
  type InternalChangeVerificationInput,
  type InternalChangeVerificationReport,
  type OwnerAttestation,
  type ReviewerApproval,
} from "@/lib/governance/internalChangeVerification";
import {
  evaluateThreeFounderReleaseAuthority,
  type FounderAuthorityRecord,
  type ThreeFounderReleaseDecision,
} from "@/lib/governance/threeFounderReleaseAuthority";

export const FOUNDER_CHANGE_REVIEW_WORKSPACE_RULE =
  "FOUNDER-CHANGE-REVIEW-WORKSPACE-001" as const;

type WorkspaceAction =
  | "REPORT_FROZEN"
  | "OWNER_ATTESTED"
  | "REVIEW_RECORDED"
  | "LAUNCH_AUTHORITY_RECORDED";

export type FounderChangeReviewRecord = {
  eventId: string;
  requestId: string;
  action: WorkspaceAction;
  actorPrincipal: FounderPrincipal;
  recordedAtUtc: string;
  reportInput?: InternalChangeVerificationInput;
  ownerAttestation?: OwnerAttestation;
  reviewerApproval?: ReviewerApproval;
  founderAuthority?: FounderAuthorityRecord;
  payloadSha256: string;
  signature: string | null;
};

export type FounderChangeReviewSnapshot = {
  rule: typeof FOUNDER_CHANGE_REVIEW_WORKSPACE_RULE;
  requestId: string;
  report: InternalChangeVerificationReport | null;
  founderReleaseDecision: ThreeFounderReleaseDecision | null;
  events: FounderChangeReviewRecord[];
  immutable: true;
  activationPerformed: false;
};

const dir = () => runtimeStatePath("governance", "founder-change-review-records");

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sign(payload: Omit<FounderChangeReviewRecord, "payloadSha256" | "signature">) {
  const bytes = stable(payload);
  const payloadSha256 = createHash("sha256").update(bytes).digest("hex");
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return {
    payloadSha256,
    signature: secret
      ? createHmac("sha256", secret).update(bytes).digest("base64url")
      : null,
  };
}

function verify(record: FounderChangeReviewRecord): boolean {
  const { payloadSha256, signature, ...payload } = record;
  const bytes = stable(payload);
  const expectedDigest = createHash("sha256").update(bytes).digest("hex");
  if (payloadSha256 !== expectedDigest) return false;
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  if (!secret) return signature === null;
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(bytes).digest("base64url"));
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function requestDir(requestId: string): string {
  return path.join(dir(), createHash("sha256").update(requestId).digest("hex").slice(0, 24));
}

function append(input: Omit<FounderChangeReviewRecord, "eventId" | "recordedAtUtc" | "payloadSha256" | "signature">) {
  const payload = {
    ...input,
    eventId: `founder-change-${Date.now()}-${randomUUID()}`,
    recordedAtUtc: new Date().toISOString(),
  };
  const record: FounderChangeReviewRecord = { ...payload, ...sign(payload) };
  const target = requestDir(input.requestId);
  mkdirSync(target, { recursive: true });
  writeFileSync(path.join(target, `${record.recordedAtUtc}-${record.eventId}.json`), JSON.stringify(record, null, 2), { flag: "wx" });
  return record;
}

export function founderPrincipalForEmail(email: string): FounderPrincipal | null {
  const normalized = email.trim().toLowerCase();
  const bindings: Array<[FounderPrincipal, string | undefined]> = [
    ["CAITLIN", process.env.FOUNDER_CAITLIN_EMAIL],
    ["STUART", process.env.FOUNDER_STUART_EMAIL],
    ["FRANCIS", process.env.FOUNDER_FRANCIS_EMAIL],
  ];
  return bindings.find(([, value]) => value?.trim().toLowerCase() === normalized)?.[0] ?? null;
}

export function founderChangeReviewEvents(requestId: string): FounderChangeReviewRecord[] {
  try {
    return readdirSync(requestDir(requestId))
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => {
        try {
          const parsed = JSON.parse(readFileSync(path.join(requestDir(requestId), name), "utf8")) as FounderChangeReviewRecord;
          return verify(parsed) ? [parsed] : [];
        } catch {
          return [];
        }
      })
      .sort((a, b) => a.recordedAtUtc.localeCompare(b.recordedAtUtc));
  } catch {
    return [];
  }
}

function assembleInput(events: FounderChangeReviewRecord[]): InternalChangeVerificationInput | null {
  const frozen = [...events].reverse().find((event) => event.action === "REPORT_FROZEN" && event.reportInput)?.reportInput;
  if (!frozen) return null;
  const expectedHash = internalChangeReportHash(frozen);
  const ownerAttestation = [...events].reverse().find(
    (event) => event.action === "OWNER_ATTESTED" && event.ownerAttestation?.reportSha256 === expectedHash,
  )?.ownerAttestation ?? null;
  const approvals = events
    .filter((event) => event.action === "REVIEW_RECORDED" && event.reviewerApproval?.reportSha256 === expectedHash)
    .map((event) => event.reviewerApproval!)
    .reduce<ReviewerApproval[]>((items, approval) => {
      const without = items.filter((item) => item.principal !== approval.principal);
      return [...without, approval];
    }, []);
  return { ...frozen, ownerAttestation, reviewerApprovals: approvals };
}

export function founderChangeReviewSnapshot(requestId: string): FounderChangeReviewSnapshot {
  const events = founderChangeReviewEvents(requestId);
  const input = assembleInput(events);
  const report = input ? buildInternalChangeVerificationReport(input) : null;
  const authorities = report
    ? events
        .filter((event) => event.action === "LAUNCH_AUTHORITY_RECORDED" && event.founderAuthority?.packetSha256 === report.reportSha256)
        .map((event) => event.founderAuthority!)
        .reduce<FounderAuthorityRecord[]>((items, authority) => [
          ...items.filter((item) => item.founder !== authority.founder),
          authority,
        ], [])
    : [];
  const founderReleaseDecision = report
    ? evaluateThreeFounderReleaseAuthority({
        initialLaunch: true,
        packetSha256: report.reportSha256,
        changeOwner: report.evidence.changeOwner,
        affectedDomains: [report.evidence.domain],
        approvals: authorities,
      })
    : null;
  return {
    rule: FOUNDER_CHANGE_REVIEW_WORKSPACE_RULE,
    requestId,
    report,
    founderReleaseDecision,
    events,
    immutable: true,
    activationPerformed: false,
  };
}

export function freezeFounderChangeReport(actorPrincipal: FounderPrincipal, input: InternalChangeVerificationInput) {
  if (actorPrincipal !== input.evidence.changeOwner) throw new Error("Only the attributed change owner may freeze the report.");
  if (founderChangeReviewEvents(input.evidence.requestId).some((event) => event.action === "REPORT_FROZEN")) {
    throw new Error("This request already has a frozen report. Material changes require a new request version.");
  }
  return append({ requestId: input.evidence.requestId, action: "REPORT_FROZEN", actorPrincipal, reportInput: { ...input, ownerAttestation: null, reviewerApprovals: [] } });
}

export function recordFounderOwnerAttestation(actorPrincipal: FounderPrincipal, requestId: string, attestation: OwnerAttestation) {
  if (actorPrincipal !== attestation.principal) throw new Error("Authenticated principal does not match the attestation.");
  return append({ requestId, action: "OWNER_ATTESTED", actorPrincipal, ownerAttestation: attestation });
}

export function recordFounderReview(actorPrincipal: FounderPrincipal, requestId: string, approval: ReviewerApproval) {
  if (actorPrincipal !== approval.principal) throw new Error("Authenticated principal does not match the review.");
  const snapshot = founderChangeReviewSnapshot(requestId);
  if (!snapshot.report) throw new Error("A frozen report is required before review.");
  if (!snapshot.report.requiredReviewers.includes(actorPrincipal)) throw new Error("This principal is not an authorized outside-group reviewer.");
  return append({ requestId, action: "REVIEW_RECORDED", actorPrincipal, reviewerApproval: approval });
}

export function recordFounderLaunchAuthority(actorPrincipal: FounderPrincipal, requestId: string, authority: FounderAuthorityRecord) {
  if (actorPrincipal !== authority.founder) throw new Error("Authenticated principal does not match the authority record.");
  const snapshot = founderChangeReviewSnapshot(requestId);
  if (!snapshot.report || snapshot.report.status !== "APPROVED_FOR_ACTIVATION") throw new Error("Cross-functional report approval is required first.");
  return append({ requestId, action: "LAUNCH_AUTHORITY_RECORDED", actorPrincipal, founderAuthority: authority });
}
