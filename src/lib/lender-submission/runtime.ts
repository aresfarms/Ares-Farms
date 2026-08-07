import { createHash, randomUUID } from "node:crypto";
import {
  DeliveryTruthStatus,
  LENDER_DISCLOSURE_TEXT,
  LENDER_DISCLOSURE_VERSION,
  LENDER_SUBMISSION_DOCTRINE,
} from "./doctrine";

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

export type PackageSource = {
  sourceRef: string;
  sourceVersion: string;
  canonicalName: string;
  mediaType: string;
  dataCategory: string;
  classification: "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  malwareScanStatus: "CLEAN";
  redactionStatus: "APPLIED" | "NOT_REQUIRED";
  overlayVersion: string;
  content: Buffer | string;
};

export type BuiltPackage = {
  packageVersionId: string;
  caseId: string;
  version: number;
  frozenAt: string;
  items: Array<Omit<PackageSource, "content"> & { ordinal: number; sha256: string; byteLength: number }>;
  manifestJson: string;
  manifestSha256: string;
  packageBytes: Buffer;
};

export function buildDeterministicPackage(input: {
  caseId: string;
  packageVersionId?: string;
  version: number;
  frozenAt: string;
  sources: PackageSource[];
}): BuiltPackage {
  if (!input.caseId || !Number.isInteger(input.version) || input.version < 1) throw new Error("caseId and a positive package version are required.");
  const frozenAt = new Date(input.frozenAt);
  if (Number.isNaN(frozenAt.getTime())) throw new Error("A valid frozenAt timestamp is required.");
  const names = new Set<string>();
  const sorted = [...input.sources].sort((a, b) => a.canonicalName.localeCompare(b.canonicalName) || a.sourceRef.localeCompare(b.sourceRef));
  const items = sorted.map((source, index) => {
    if (!source.sourceRef || !source.sourceVersion || !source.canonicalName || !source.overlayVersion) throw new Error("Every package item requires a frozen source reference, source version, canonical name, and active overlay version.");
    if (source.malwareScanStatus !== "CLEAN") throw new Error(`Package item is not malware-cleared: ${source.canonicalName}`);
    if (!["APPLIED", "NOT_REQUIRED"].includes(source.redactionStatus)) throw new Error(`Package item lacks a governed redaction decision: ${source.canonicalName}`);
    if (!["application/pdf", "application/json", "text/csv", "text/plain"].includes(source.mediaType)) throw new Error(`Package item MIME type is not permitted: ${source.mediaType}`);
    if (names.has(source.canonicalName)) throw new Error(`Duplicate canonical package name: ${source.canonicalName}`);
    names.add(source.canonicalName);
    const bytes = Buffer.isBuffer(source.content) ? source.content : Buffer.from(source.content, "utf8");
    return { ordinal: index + 1, canonicalName: source.canonicalName, sourceRef: source.sourceRef, sourceVersion: source.sourceVersion, mediaType: source.mediaType, dataCategory: source.dataCategory, classification: source.classification, malwareScanStatus: source.malwareScanStatus, redactionStatus: source.redactionStatus, overlayVersion: source.overlayVersion, sha256: sha256(bytes), byteLength: bytes.length };
  });
  const packageVersionId = input.packageVersionId ?? `pkg-${sha256(`${input.caseId}:${input.version}`).slice(0, 24)}`;
  const manifest = { schema: "furlong-lender-package-manifest-v1", caseId: input.caseId, packageVersionId, version: input.version, frozenAt: frozenAt.toISOString(), items };
  const manifestJson = canonicalJson(manifest);
  const packageBytes = Buffer.from(`${manifestJson}\n${items.map((item) => `${item.ordinal}\t${item.canonicalName}\t${item.sha256}`).join("\n")}\n`, "utf8");
  return { packageVersionId, caseId: input.caseId, version: input.version, frozenAt: frozenAt.toISOString(), items, manifestJson, manifestSha256: sha256(manifestJson), packageBytes };
}

export type SubmissionConsent = {
  id: string; caseId: string; packageVersionId: string; manifestSha256: string;
  customerId: string; lenderId: string; recipientScope: string; purpose: string;
  channel: string; dataCategories: string[]; disclosureVersion: string;
  disclosureSha256: string; consentedAt: string; expiresAt: string; revokedAt: string | null;
};

export function captureSubmissionConsent(input: Omit<SubmissionConsent, "id" | "disclosureVersion" | "disclosureSha256" | "revokedAt"> & { accepted: boolean }): SubmissionConsent {
  if (!input.accepted) throw new Error("Explicit customer consent is required.");
  if (!input.packageVersionId || !/^[a-f0-9]{64}$/.test(input.manifestSha256)) throw new Error("Consent must bind to an exact package version and manifest hash.");
  if (!input.lenderId || !input.recipientScope || !input.purpose || !input.channel || input.dataCategories.length === 0) throw new Error("Named lender, recipient scope, purpose, channel, and data categories are required.");
  if (new Date(input.expiresAt) <= new Date(input.consentedAt)) throw new Error("Consent expiry must be after consent capture.");
  return { ...input, id: randomUUID(), disclosureVersion: LENDER_DISCLOSURE_VERSION, disclosureSha256: sha256(LENDER_DISCLOSURE_TEXT), revokedAt: null };
}

export type VerificationLevel = "V0_UNVERIFIED" | "V1_DOMAIN" | "V2_OUT_OF_BAND" | "V3_INSTITUTIONAL";
export type RecipientVerification = {
  id: string; lenderId: string; channel: string; destinationFingerprint: string;
  verificationLevel: VerificationLevel; verifiedAt: string | null; expiresAt: string; revokedAt: string | null;
};

export function registerRecipient(input: {
  lenderId: string; channel: string; destination: string; verificationLevel: VerificationLevel;
  verifiedAt?: string | null; expiresAt: string;
}): RecipientVerification {
  if (!input.lenderId || !input.channel || !input.destination) throw new Error("Recipient identity fields are required.");
  const verifiedAt = input.verificationLevel === "V0_UNVERIFIED" ? null : input.verifiedAt ?? null;
  if (input.verificationLevel !== "V0_UNVERIFIED" && !verifiedAt) throw new Error("Verified recipients require verification evidence.");
  return { id: randomUUID(), lenderId: input.lenderId, channel: input.channel, destinationFingerprint: sha256(input.destination.trim().toLowerCase()), verificationLevel: input.verificationLevel, verifiedAt, expiresAt: input.expiresAt, revokedAt: null };
}

export const AUTHORIZATION_GATE_NAMES = [
  "promotion", "kill_switches", "package_integrity", "exact_consent", "customer_identity",
  "recipient_verification", "adapter_certification", "data_classification", "human_review",
  "runtime_secrets", "idempotency_outbox", "ledger_replay", "observability",
] as const;
export type AuthorizationGateName = (typeof AUTHORIZATION_GATE_NAMES)[number];
export type GateSignal = "PASS" | "FAIL" | "UNKNOWN" | "STALE" | "CONFLICT" | "ERROR" | "MISSING";

export type DispatchAuthorization = {
  id: string; allowed: boolean; environment: "sandbox" | "production";
  caseId: string; packageVersionId: string; consentId: string; recipientVerificationId: string;
  adapterId: string; gateResults: Record<AuthorizationGateName, GateSignal>;
  authorizationSha256: string; expiresAt: string; denialReasons: string[];
};

export function authorizeDispatch(input: {
  environment: "sandbox" | "production"; caseId: string; package: BuiltPackage;
  consent: SubmissionConsent; recipient: RecipientVerification; adapterId: string;
  gates: Partial<Record<AuthorizationGateName, GateSignal>>; now: string; expiresAt: string;
}): DispatchAuthorization {
  const now = new Date(input.now);
  const consentValid = input.consent.caseId === input.caseId && input.consent.packageVersionId === input.package.packageVersionId && input.consent.manifestSha256 === input.package.manifestSha256 && input.consent.lenderId === input.recipient.lenderId && input.consent.channel === input.recipient.channel && !input.consent.revokedAt && new Date(input.consent.expiresAt) > now;
  const recipientValid = ["V2_OUT_OF_BAND", "V3_INSTITUTIONAL"].includes(input.recipient.verificationLevel) && Boolean(input.recipient.verifiedAt) && !input.recipient.revokedAt && new Date(input.recipient.expiresAt) > now;
  const computed: Record<AuthorizationGateName, GateSignal> = Object.fromEntries(AUTHORIZATION_GATE_NAMES.map((name) => [name, input.gates[name] ?? "MISSING"])) as Record<AuthorizationGateName, GateSignal>;
  computed.exact_consent = consentValid ? computed.exact_consent : "FAIL";
  computed.recipient_verification = recipientValid ? computed.recipient_verification : "FAIL";
  if (input.environment === "production" || LENDER_SUBMISSION_DOCTRINE.productionDeliveryBlocked && input.adapterId !== LENDER_SUBMISSION_DOCTRINE.supportedAdapter) computed.promotion = "FAIL";
  const denialReasons = AUTHORIZATION_GATE_NAMES.filter((name) => computed[name] !== "PASS").map((name) => `${name}:${computed[name]}`);
  const stable = { caseId: input.caseId, packageVersionId: input.package.packageVersionId, consentId: input.consent.id, recipientVerificationId: input.recipient.id, adapterId: input.adapterId, environment: input.environment, gateResults: computed, expiresAt: input.expiresAt };
  return { id: randomUUID(), ...stable, allowed: denialReasons.length === 0, authorizationSha256: sha256(canonicalJson(stable)), denialReasons };
}

export type SandboxDeliveryResult = { status: DeliveryTruthStatus; providerReference: string; retryable: boolean; reconciliationRequired: boolean };
export function retryDelayMs(attemptNumber: number, idempotencyKey: string): number {
  const base = Math.min(60_000, 1_000 * 2 ** Math.max(0, attemptNumber - 1));
  const jitter = Number.parseInt(sha256(`${idempotencyKey}:${attemptNumber}`).slice(0, 4), 16) % 1_000;
  return base + jitter;
}

export function dispatchWithSandboxAdapter(input: { authorization: DispatchAuthorization; idempotencyKey: string; attemptNumber: number; simulate?: "accepted" | "delivered" | "acknowledged" | "transient_failure" | "unknown" | "timeout_before_acceptance" | "timeout_after_acceptance" }): SandboxDeliveryResult {
  if (!input.authorization.allowed) throw new Error("Dispatch authorization is denied.");
  if (input.authorization.environment !== "sandbox" || input.authorization.adapterId !== LENDER_SUBMISSION_DOCTRINE.supportedAdapter) throw new Error("Only the sandbox adapter is implemented.");
  if (!input.idempotencyKey) throw new Error("An idempotency key is required.");
  if (input.attemptNumber < 1 || input.attemptNumber > LENDER_SUBMISSION_DOCTRINE.maxDeliveryAttempts) throw new Error("Delivery attempt is outside the governed retry limit.");
  const providerReference = `sandbox-${sha256(input.idempotencyKey).slice(0, 20)}`;
  switch (input.simulate ?? "accepted") {
    case "delivered": return { status: "DELIVERED", providerReference, retryable: false, reconciliationRequired: false };
    case "acknowledged": return { status: "ACKNOWLEDGED", providerReference, retryable: false, reconciliationRequired: false };
    case "transient_failure":
    case "timeout_before_acceptance": return { status: "FAILED", providerReference, retryable: input.attemptNumber < LENDER_SUBMISSION_DOCTRINE.maxDeliveryAttempts, reconciliationRequired: false };
    case "unknown":
    case "timeout_after_acceptance": return { status: "UNKNOWN", providerReference, retryable: false, reconciliationRequired: true };
    default: return { status: "PROVIDER_ACCEPTED", providerReference, retryable: false, reconciliationRequired: false };
  }
}

export function replayDeliveryTruth(statuses: DeliveryTruthStatus[]): DeliveryTruthStatus {
  if (statuses.includes("UNKNOWN")) return "UNKNOWN";
  const order: DeliveryTruthStatus[] = ["ATTEMPTED", "PROVIDER_ACCEPTED", "DELIVERED", "ACKNOWLEDGED"];
  const successful = statuses.filter((status) => order.includes(status));
  if (successful.length) return successful.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
  return statuses.includes("FAILED") ? "FAILED" : "ATTEMPTED";
}
