import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  customerSubmissionConsents,
  deliveryAttempts,
  deliveryOutbox,
  deliveryReceipts,
  dispatchAuthorizations,
  lenderSubmissionCases,
  recipientVerifications,
  submissionPackageItems,
  submissionPackageVersions,
  submissionFailures,
} from "@/db/schema";
import { db } from "@/lib/db";
import { writeAuditEvent } from "@/lib/audit/writeAuditEvent";
import { LENDER_SUBMISSION_DOCTRINE, LenderSubmissionState, assertTransition } from "./doctrine";
import {
  AuthorizationGateName,
  BuiltPackage,
  DispatchAuthorization,
  GateSignal,
  PackageSource,
  SubmissionConsent,
  authorizeDispatch,
  buildDeterministicPackage,
  canonicalJson,
  captureSubmissionConsent,
  dispatchWithSandboxAdapter,
  registerRecipient,
  retryDelayMs,
  sha256,
} from "./runtime";

const governance = LENDER_SUBMISSION_DOCTRINE.version;
const evidence = (traceId: string) => ({ governanceVersion: governance, classification: "RESTRICTED", replayRef: traceId, traceId });

export async function createSubmissionCase(input: { applicationId: string; customerId: string; actorId: string; traceId: string }) {
  if (!input.applicationId.trim() || !input.customerId.trim()) throw new Error("applicationId and customerId are required.");
  const [record] = await db.insert(lenderSubmissionCases).values({ applicationId: input.applicationId.trim(), customerId: input.customerId.trim(), state: "DRAFT", productionDeliveryBlocked: true, metadata: { createdBy: input.actorId, doctrineIds: [LENDER_SUBMISSION_DOCTRINE.canonicalId, LENDER_SUBMISSION_DOCTRINE.technicalId, LENDER_SUBMISSION_DOCTRINE.operationsId] }, ...evidence(input.traceId) }).returning();
  return record;
}

export async function loadSubmissionCase(caseId: string) {
  const [record] = await db.select().from(lenderSubmissionCases).where(eq(lenderSubmissionCases.id, caseId)).limit(1);
  if (!record) throw new Error("Lender submission case was not found.");
  return record;
}

export async function transitionSubmissionCase(caseId: string, to: LenderSubmissionState) {
  const record = await loadSubmissionCase(caseId);
  assertTransition(record.state as LenderSubmissionState, to);
  const [updated] = await db.update(lenderSubmissionCases).set({ state: to, updatedAt: new Date(), closedAt: to === "CLOSED" ? new Date() : record.closedAt }).where(eq(lenderSubmissionCases.id, caseId)).returning();
  return updated;
}

export async function buildAndPersistPackage(input: { caseId: string; sources: PackageSource[]; frozenAt: string; actorId: string; traceId: string }): Promise<BuiltPackage> {
  const record = await loadSubmissionCase(input.caseId);
  if (!["DRAFT", "VALIDATION_FAILED", "CHANGES_REQUESTED"].includes(record.state)) throw new Error(`Package cannot be built from ${record.state}.`);
  const existing = await db.select({ version: submissionPackageVersions.version }).from(submissionPackageVersions).where(eq(submissionPackageVersions.caseId, input.caseId)).orderBy(desc(submissionPackageVersions.version)).limit(1);
  const version = (existing[0]?.version ?? 0) + 1;
  const packageVersionId = randomUUID();
  const built = buildDeterministicPackage({ caseId: input.caseId, packageVersionId, version, frozenAt: input.frozenAt, sources: input.sources });
  await db.transaction(async (tx) => {
    await tx.update(lenderSubmissionCases).set({ state: "BUILDING", updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
    if (record.activePackageVersionId) await tx.update(submissionPackageVersions).set({ invalidatedAt: new Date(), invalidationReason: "Replaced by a newly built package version." }).where(eq(submissionPackageVersions.id, record.activePackageVersionId));
    await tx.insert(submissionPackageVersions).values({ id: packageVersionId, caseId: input.caseId, version, manifestJson: JSON.parse(built.manifestJson) as Record<string, unknown>, manifestSha256: built.manifestSha256, byteLength: built.packageBytes.length, frozenAt: new Date(built.frozenAt), metadata: { createdBy: input.actorId }, ...evidence(input.traceId) });
    if (built.items.length) await tx.insert(submissionPackageItems).values(built.items.map((item) => ({ packageVersionId, ...item, itemClassification: item.classification, ...evidence(input.traceId) })));
    await tx.update(lenderSubmissionCases).set({ state: "READY_FOR_REVIEW", activePackageVersionId: packageVersionId, updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
  });
  return built;
}

export async function loadPackage(caseId: string, packageVersionId: string): Promise<BuiltPackage> {
  const [version] = await db.select().from(submissionPackageVersions).where(and(eq(submissionPackageVersions.id, packageVersionId), eq(submissionPackageVersions.caseId, caseId))).limit(1);
  if (!version || version.invalidatedAt) throw new Error("Active package version was not found.");
  const items = await db.select().from(submissionPackageItems).where(eq(submissionPackageItems.packageVersionId, packageVersionId)).orderBy(submissionPackageItems.ordinal);
  const manifestJson = canonicalJson(version.manifestJson);
  return { packageVersionId, caseId, version: version.version, frozenAt: version.frozenAt.toISOString(), items: items.map((item) => ({ ordinal: item.ordinal, canonicalName: item.canonicalName, sourceRef: item.sourceRef, sourceVersion: item.sourceVersion, mediaType: item.mediaType, dataCategory: item.dataCategory, classification: item.itemClassification as "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED", malwareScanStatus: item.malwareScanStatus as "CLEAN", redactionStatus: item.redactionStatus as "APPLIED" | "NOT_REQUIRED", overlayVersion: item.overlayVersion, authenticityEvidenceRef: item.authenticityEvidenceRef, authenticityClassification: item.authenticityClassification as "DIRECT_SOURCE_VERIFIED" | "CORROBORATED", sha256: item.sha256, byteLength: item.byteLength })), manifestJson, manifestSha256: version.manifestSha256, packageBytes: Buffer.from(manifestJson) };
}

export async function persistConsent(input: Omit<Parameters<typeof captureSubmissionConsent>[0], "accepted"> & { accepted: boolean; actorId: string; traceId: string }) {
  const caseRecord = await loadSubmissionCase(input.caseId);
  if (caseRecord.state !== "AWAITING_CUSTOMER_CONSENT" || caseRecord.customerId !== input.customerId || caseRecord.activePackageVersionId !== input.packageVersionId) throw new Error("Consent does not match the reviewed case, customer, or active package.");
  const pkg = await loadPackage(input.caseId, input.packageVersionId);
  if (pkg.manifestSha256 !== input.manifestSha256) throw new Error("Consent manifest hash does not match the active sealed package.");
  const consent = captureSubmissionConsent(input);
  return db.transaction(async (tx) => {
    const [record] = await tx.insert(customerSubmissionConsents).values({ id: consent.id, caseId: consent.caseId, packageVersionId: consent.packageVersionId, manifestSha256: consent.manifestSha256, customerId: consent.customerId, lenderId: consent.lenderId, recipientScope: consent.recipientScope, purpose: consent.purpose, channel: consent.channel, dataCategories: consent.dataCategories, disclosureVersion: consent.disclosureVersion, disclosureSha256: consent.disclosureSha256, consentedAt: new Date(consent.consentedAt), expiresAt: new Date(consent.expiresAt), revokedAt: null, metadata: { capturedBy: input.actorId }, ...evidence(input.traceId) }).returning();
    const transitioned = await tx.update(lenderSubmissionCases).set({ state: "CONSENTED", updatedAt: new Date() }).where(and(eq(lenderSubmissionCases.id, input.caseId), eq(lenderSubmissionCases.state, "AWAITING_CUSTOMER_CONSENT"))).returning({ id: lenderSubmissionCases.id });
    if (!transitioned.length) throw new Error("Consent capture lost its state-transition lock.");
    return record;
  });
}

export async function loadConsent(consentId: string): Promise<SubmissionConsent> {
  const [row] = await db.select().from(customerSubmissionConsents).where(eq(customerSubmissionConsents.id, consentId)).limit(1);
  if (!row) throw new Error("Submission consent was not found.");
  return { id: row.id, caseId: row.caseId, packageVersionId: row.packageVersionId, manifestSha256: row.manifestSha256, customerId: row.customerId, lenderId: row.lenderId, recipientScope: row.recipientScope, purpose: row.purpose, channel: row.channel, dataCategories: row.dataCategories as string[], disclosureVersion: row.disclosureVersion, disclosureSha256: row.disclosureSha256, consentedAt: row.consentedAt.toISOString(), expiresAt: row.expiresAt.toISOString(), revokedAt: row.revokedAt?.toISOString() ?? null };
}

export async function revokeConsent(caseId: string, consentId: string) {
  const [row] = await db.select().from(customerSubmissionConsents).where(and(eq(customerSubmissionConsents.id, consentId), eq(customerSubmissionConsents.caseId, caseId))).limit(1);
  if (!row) throw new Error("Submission consent was not found.");
  if (row.revokedAt) return row;
  const [updated] = await db.update(customerSubmissionConsents).set({ revokedAt: new Date() }).where(eq(customerSubmissionConsents.id, consentId)).returning();
  const record = await loadSubmissionCase(caseId);
  if (["CONSENTED", "AWAITING_RECIPIENT_VERIFICATION", "AUTHORIZED_FOR_DISPATCH"].includes(record.state)) await transitionSubmissionCase(caseId, "REVOKED");
  return updated;
}

export async function persistRecipientVerification(input: Parameters<typeof registerRecipient>[0] & { actorId: string; traceId: string }) {
  const verification = registerRecipient(input);
  const [record] = await db.insert(recipientVerifications).values({ id: verification.id, lenderId: verification.lenderId, channel: verification.channel, destinationFingerprint: verification.destinationFingerprint, verificationLevel: verification.verificationLevel, verifiedBy: verification.verifiedAt ? input.actorId : null, verifiedAt: verification.verifiedAt ? new Date(verification.verifiedAt) : null, expiresAt: new Date(verification.expiresAt), revokedAt: null, metadata: { destinationNeverStored: true }, ...evidence(input.traceId) }).returning();
  return record;
}

export async function authorizeAndPersist(input: { caseId: string; packageVersionId: string; consentId: string; recipientVerificationId: string; adapterId: string; environment: "sandbox" | "production"; idempotencyKey: string; actorId: string; traceId: string; now: string; expiresAt: string }): Promise<DispatchAuthorization> {
  if (!input.idempotencyKey?.trim()) throw new Error("A stable idempotency key is required for atomic authorization and outbox creation.");
  const caseRecord = await loadSubmissionCase(input.caseId);
  const pkg = await loadPackage(input.caseId, input.packageVersionId);
  const consent = await loadConsent(input.consentId);
  const [recipient] = await db.select().from(recipientVerifications).where(eq(recipientVerifications.id, input.recipientVerificationId)).limit(1);
  if (!recipient) throw new Error("Recipient verification was not found.");
  const recipientModel = { id: recipient.id, lenderId: recipient.lenderId, channel: recipient.channel, destinationFingerprint: recipient.destinationFingerprint, verificationLevel: recipient.verificationLevel as "V0_UNVERIFIED" | "V1_DOMAIN" | "V2_OUT_OF_BAND" | "V3_INSTITUTIONAL", verifiedAt: recipient.verifiedAt?.toISOString() ?? null, expiresAt: recipient.expiresAt.toISOString(), revokedAt: recipient.revokedAt?.toISOString() ?? null };
  const duplicate = await db.select({ id: deliveryOutbox.id }).from(deliveryOutbox).where(eq(deliveryOutbox.idempotencyKey, input.idempotencyKey)).limit(1);
  const gates: Record<AuthorizationGateName, GateSignal> = {
    promotion: input.environment === "sandbox" && input.adapterId === "sandbox-v1" ? "PASS" : "FAIL",
    kill_switches: input.environment === "sandbox" ? "PASS" : "MISSING",
    package_integrity: sha256(pkg.manifestJson) === pkg.manifestSha256 ? "PASS" : "FAIL",
    document_authenticity: pkg.items.every((item) => Boolean(item.authenticityEvidenceRef) && ["DIRECT_SOURCE_VERIFIED", "CORROBORATED"].includes(item.authenticityClassification)) ? "PASS" : "FAIL",
    lender_evidence_packet: pkg.items.every((item) => Boolean(item.authenticityEvidenceRef) && Boolean(item.sha256)) ? "PASS" : "FAIL",
    exact_consent: "PASS",
    customer_identity: consent.customerId === caseRecord.customerId && Boolean(input.actorId) ? "PASS" : "FAIL",
    recipient_verification: "PASS",
    adapter_certification: input.adapterId === "sandbox-v1" ? "PASS" : "FAIL",
    data_classification: pkg.items.every((item) => item.classification && item.malwareScanStatus === "CLEAN" && ["APPLIED", "NOT_REQUIRED"].includes(item.redactionStatus) && item.overlayVersion) ? "PASS" : "FAIL",
    human_review: caseRecord.state === "CONSENTED" ? "PASS" : "FAIL",
    runtime_secrets: input.environment === "sandbox" ? "PASS" : "MISSING",
    idempotency_outbox: duplicate.length === 0 ? "PASS" : "CONFLICT",
    ledger_replay: "PASS",
    observability: input.traceId ? "PASS" : "MISSING",
  };
  const authorization = authorizeDispatch({ ...input, package: pkg, consent, gates, recipient: recipientModel });
  await writeAuditEvent({ userId: input.actorId, actorRef: `user:${input.actorId}`, eventType: authorization.allowed ? "LENDER_DISPATCH_AUTHORIZED_PENDING_OUTBOX" : "LENDER_DISPATCH_DENIED", decision: authorization.allowed ? "AUTHORIZED_PENDING_ATOMIC_OUTBOX" : "DENIED", entityType: "lender_submission_case", entityId: input.caseId, classification: "RESTRICTED", source: "lender-submission", moduleId: "lender-submission", traceId: input.traceId, target: { type: "lender_submission_case", id: input.caseId }, metadata: { replayRef: input.traceId, packageVersionId: input.packageVersionId, manifestSha256: pkg.manifestSha256, recipientVerificationId: input.recipientVerificationId, adapterId: input.adapterId, environment: input.environment, idempotencyKeySha256: sha256(input.idempotencyKey), gateResults: authorization.gateResults } });
  await db.transaction(async (tx) => {
    await tx.insert(dispatchAuthorizations).values({ id: authorization.id, caseId: input.caseId, packageVersionId: input.packageVersionId, consentId: input.consentId, recipientVerificationId: input.recipientVerificationId, adapterId: input.adapterId, environment: input.environment, allowed: authorization.allowed, gateResults: authorization.gateResults, authorizationSha256: authorization.authorizationSha256, authorizedBy: input.actorId, expiresAt: new Date(input.expiresAt), metadata: { denialReasons: authorization.denialReasons, serverDerivedGates: true }, ...evidence(input.traceId) });
    if (authorization.allowed) {
      await tx.insert(deliveryOutbox).values({ caseId: input.caseId, authorizationId: authorization.id, idempotencyKey: input.idempotencyKey, status: "PENDING", attemptCount: 0, metadata: { atomicAuthorization: true }, ...evidence(input.traceId) });
      await tx.update(lenderSubmissionCases).set({ state: "AUTHORIZED_FOR_DISPATCH", updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
    }
  });
  return authorization;
}

type SandboxSimulation = "accepted" | "delivered" | "acknowledged" | "transient_failure" | "unknown" | "timeout_before_acceptance" | "timeout_after_acceptance";

export async function dispatchSandbox(input: { caseId: string; authorizationId: string; idempotencyKey: string; simulate?: SandboxSimulation; actorId: string; traceId: string }) {
  if (!input.idempotencyKey?.trim()) throw new Error("A stable idempotency key is required.");
  if (input.simulate && !["accepted", "delivered", "acknowledged", "transient_failure", "unknown", "timeout_before_acceptance", "timeout_after_acceptance"].includes(input.simulate)) throw new Error("Unsupported sandbox simulation outcome.");
  const [row] = await db.select().from(dispatchAuthorizations).where(and(eq(dispatchAuthorizations.id, input.authorizationId), eq(dispatchAuthorizations.caseId, input.caseId))).limit(1);
  if (!row || !row.allowed) throw new Error("A valid dispatch authorization was not found.");
  if (row.consumedAt || row.expiresAt <= new Date()) throw new Error("Dispatch authorization is consumed or expired.");
  const authorization: DispatchAuthorization = { id: row.id, allowed: row.allowed, environment: row.environment as "sandbox" | "production", caseId: row.caseId, packageVersionId: row.packageVersionId, consentId: row.consentId, recipientVerificationId: row.recipientVerificationId, adapterId: row.adapterId, gateResults: row.gateResults as DispatchAuthorization["gateResults"], authorizationSha256: row.authorizationSha256, expiresAt: row.expiresAt.toISOString(), denialReasons: [] };
  return db.transaction(async (tx) => {
    const existing = await tx.select().from(deliveryOutbox).where(and(eq(deliveryOutbox.idempotencyKey, input.idempotencyKey), eq(deliveryOutbox.authorizationId, input.authorizationId))).limit(1);
    const outbox = existing[0];
    if (!outbox) throw new Error("Atomic authorization outbox entry was not found.");
    if (outbox.status !== "PENDING" || outbox.attemptCount !== 0) return { outbox, idempotentReplay: true };
    const [claimed] = await tx.update(deliveryOutbox).set({ status: "DISPATCHING", attemptCount: 1, lockedAt: new Date() }).where(and(eq(deliveryOutbox.id, outbox.id), eq(deliveryOutbox.status, "PENDING"), eq(deliveryOutbox.attemptCount, 0))).returning();
    if (!claimed) return { outbox, idempotentReplay: true };
    const result = dispatchWithSandboxAdapter({ authorization, idempotencyKey: input.idempotencyKey, attemptNumber: 1, simulate: input.simulate });
    const [attempt] = await tx.insert(deliveryAttempts).values({ outboxId: outbox.id, attemptNumber: 1, status: result.status, providerReference: result.providerReference, requestSha256: authorization.authorizationSha256, transientSafe: result.retryable, startedAt: new Date(), completedAt: new Date(), ...evidence(input.traceId) }).returning();
    await tx.insert(deliveryReceipts).values({ outboxId: outbox.id, attemptId: attempt.id, providerEventId: `${result.providerReference}-1`, truthStatus: result.status, payloadSha256: authorization.authorizationSha256, signatureVerified: true, occurredAt: new Date(), metadata: { simulated: true }, ...evidence(input.traceId) });
    if (result.status === "FAILED" || result.status === "UNKNOWN") await tx.insert(submissionFailures).values({ caseId: input.caseId, outboxId: outbox.id, code: result.status === "UNKNOWN" ? "DELIVERY_OUTCOME_UNKNOWN" : "SANDBOX_TRANSIENT_FAILURE", severity: result.status === "UNKNOWN" ? "HIGH" : "WARN", retryable: result.retryable, reconciliationRequired: result.reconciliationRequired, safeMessage: result.status === "UNKNOWN" ? "Delivery outcome is unknown; do not resend until reconciled." : "Sandbox delivery failed transiently.", detailsSha256: authorization.authorizationSha256, ...evidence(input.traceId) });
    const outboxStatus = result.status === "UNKNOWN" ? "RECONCILIATION_REQUIRED" : result.status;
    const [completed] = await tx.update(deliveryOutbox).set({ status: outboxStatus, nextAttemptAt: result.retryable ? new Date(Date.now() + retryDelayMs(1, input.idempotencyKey)) : null, completedAt: result.retryable ? null : new Date(), lockedAt: null }).where(eq(deliveryOutbox.id, outbox.id)).returning();
    await tx.update(dispatchAuthorizations).set({ consumedAt: new Date() }).where(eq(dispatchAuthorizations.id, row.id));
    const caseState = result.status === "UNKNOWN" ? "DELIVERY_UNKNOWN" : result.status === "FAILED" ? "FAILED" : result.status;
    await tx.update(lenderSubmissionCases).set({ state: caseState, updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
    return { outbox: completed, attempt, result, idempotentReplay: false };
  });
}

export async function retrySandboxDelivery(input: { caseId: string; authorizationId: string; idempotencyKey: string; simulate?: SandboxSimulation; actorId: string; traceId: string }) {
  const [outbox] = await db.select().from(deliveryOutbox).where(and(eq(deliveryOutbox.idempotencyKey, input.idempotencyKey), eq(deliveryOutbox.caseId, input.caseId))).limit(1);
  if (!outbox || outbox.authorizationId !== input.authorizationId || outbox.status !== "FAILED") throw new Error("Only a recorded transient-safe failure can be retried.");
  const attempts = await db.select().from(deliveryAttempts).where(eq(deliveryAttempts.outboxId, outbox.id)).orderBy(desc(deliveryAttempts.attemptNumber));
  const lastAttempt = attempts[0];
  if (!lastAttempt?.transientSafe) throw new Error("The last delivery outcome is not safe to retry.");
  if (outbox.nextAttemptAt && outbox.nextAttemptAt > new Date()) throw new Error("The governed retry backoff window has not elapsed.");
  const attemptNumber = outbox.attemptCount + 1;
  if (attemptNumber > LENDER_SUBMISSION_DOCTRINE.maxDeliveryAttempts) throw new Error("Delivery reached the governed five-attempt limit.");
  const [row] = await db.select().from(dispatchAuthorizations).where(eq(dispatchAuthorizations.id, input.authorizationId)).limit(1);
  if (!row || !row.allowed || row.environment !== "sandbox" || row.adapterId !== "sandbox-v1") throw new Error("The sandbox authorization is invalid.");
  if (row.expiresAt <= new Date()) throw new Error("The sandbox authorization expired before retry.");
  const pkg = await loadPackage(input.caseId, row.packageVersionId);
  const consent = await loadConsent(row.consentId);
  const [recipient] = await db.select().from(recipientVerifications).where(eq(recipientVerifications.id, row.recipientVerificationId)).limit(1);
  if (!recipient) throw new Error("Recipient verification was not found for retry.");
  const authorization = authorizeDispatch({ environment: "sandbox", caseId: input.caseId, package: pkg, consent, recipient: { id: recipient.id, lenderId: recipient.lenderId, channel: recipient.channel, destinationFingerprint: recipient.destinationFingerprint, verificationLevel: recipient.verificationLevel as "V0_UNVERIFIED" | "V1_DOMAIN" | "V2_OUT_OF_BAND" | "V3_INSTITUTIONAL", verifiedAt: recipient.verifiedAt?.toISOString() ?? null, expiresAt: recipient.expiresAt.toISOString(), revokedAt: recipient.revokedAt?.toISOString() ?? null }, adapterId: row.adapterId, gates: row.gateResults as DispatchAuthorization["gateResults"], now: new Date().toISOString(), expiresAt: row.expiresAt.toISOString() });
  if (!authorization.allowed) throw new Error(`Volatile retry gates denied dispatch: ${authorization.denialReasons.join(", ")}`);
  const result = dispatchWithSandboxAdapter({ authorization, idempotencyKey: input.idempotencyKey, attemptNumber, simulate: input.simulate });
  return db.transaction(async (tx) => {
    const [attempt] = await tx.insert(deliveryAttempts).values({ outboxId: outbox.id, attemptNumber, status: result.status, providerReference: result.providerReference, requestSha256: authorization.authorizationSha256, transientSafe: result.retryable, startedAt: new Date(), completedAt: new Date(), metadata: { retry: true, actorId: input.actorId }, ...evidence(input.traceId) }).returning();
    await tx.insert(deliveryReceipts).values({ outboxId: outbox.id, attemptId: attempt.id, providerEventId: `${result.providerReference}-${attemptNumber}`, truthStatus: result.status, payloadSha256: authorization.authorizationSha256, signatureVerified: true, occurredAt: new Date(), metadata: { simulated: true, retry: true }, ...evidence(input.traceId) });
    if (result.status === "FAILED" || result.status === "UNKNOWN") await tx.insert(submissionFailures).values({ caseId: input.caseId, outboxId: outbox.id, code: result.status === "UNKNOWN" ? "DELIVERY_OUTCOME_UNKNOWN" : "SANDBOX_TRANSIENT_FAILURE", severity: result.status === "UNKNOWN" ? "HIGH" : "WARN", retryable: result.retryable, reconciliationRequired: result.reconciliationRequired, safeMessage: result.status === "UNKNOWN" ? "Delivery outcome is unknown; do not resend until reconciled." : "Sandbox delivery failed transiently.", detailsSha256: authorization.authorizationSha256, metadata: { attemptNumber }, ...evidence(input.traceId) });
    const status = result.status === "UNKNOWN" ? "RECONCILIATION_REQUIRED" : result.status === "FAILED" && attemptNumber >= LENDER_SUBMISSION_DOCTRINE.maxDeliveryAttempts ? "DEAD_LETTER" : result.status;
    const [updated] = await tx.update(deliveryOutbox).set({ status, attemptCount: attemptNumber, nextAttemptAt: result.retryable ? new Date(Date.now() + retryDelayMs(attemptNumber, input.idempotencyKey)) : null, completedAt: result.retryable ? null : new Date(), lockedAt: null }).where(eq(deliveryOutbox.id, outbox.id)).returning();
    const caseState = result.status === "UNKNOWN" ? "DELIVERY_UNKNOWN" : result.status === "FAILED" ? "FAILED" : result.status;
    await tx.update(lenderSubmissionCases).set({ state: caseState, updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
    return { outbox: updated, attempt, result, idempotentReplay: false, retry: true };
  });
}

export async function getDeliveryStatus(caseId: string) {
  const outboxes = await db.select().from(deliveryOutbox).where(eq(deliveryOutbox.caseId, caseId)).orderBy(desc(deliveryOutbox.createdAt));
  if (!outboxes.length) return { caseId, status: "NOT_DISPATCHED", attempts: [], receipts: [], failures: [] };
  const current = outboxes[0];
  const attempts = await db.select().from(deliveryAttempts).where(eq(deliveryAttempts.outboxId, current.id)).orderBy(deliveryAttempts.attemptNumber);
  const receipts = await db.select().from(deliveryReceipts).where(eq(deliveryReceipts.outboxId, current.id)).orderBy(deliveryReceipts.occurredAt);
  const failures = await db.select().from(submissionFailures).where(eq(submissionFailures.outboxId, current.id)).orderBy(submissionFailures.createdAt);
  return { caseId, status: current.status, outbox: current, attempts, receipts, failures };
}

export async function reconcileDelivery(input: { caseId: string; outboxId: string; resolution: "PROVIDER_ACCEPTED" | "DELIVERED" | "ACKNOWLEDGED" | "FAILED"; actorId: string; traceId: string }) {
  if (!["PROVIDER_ACCEPTED", "DELIVERED", "ACKNOWLEDGED", "FAILED"].includes(input.resolution)) throw new Error("Unsupported reconciliation resolution.");
  const [outbox] = await db.select().from(deliveryOutbox).where(and(eq(deliveryOutbox.id, input.outboxId), eq(deliveryOutbox.caseId, input.caseId))).limit(1);
  if (!outbox || outbox.status !== "RECONCILIATION_REQUIRED") throw new Error("An unresolved delivery reconciliation was not found.");
  return db.transaction(async (tx) => {
    await tx.insert(deliveryReceipts).values({ outboxId: outbox.id, providerEventId: `manual-reconciliation-${randomUUID()}`, truthStatus: input.resolution, payloadSha256: sha256(canonicalJson({ outboxId: outbox.id, resolution: input.resolution, actorId: input.actorId })), signatureVerified: false, occurredAt: new Date(), metadata: { reconciledBy: input.actorId, humanReview: true }, ...evidence(input.traceId) });
    const [updated] = await tx.update(deliveryOutbox).set({ status: input.resolution, completedAt: new Date() }).where(eq(deliveryOutbox.id, outbox.id)).returning();
    await tx.update(lenderSubmissionCases).set({ state: input.resolution, updatedAt: new Date() }).where(eq(lenderSubmissionCases.id, input.caseId));
    return updated;
  });
}
