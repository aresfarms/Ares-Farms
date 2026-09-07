import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";

import {
  capitalNetworkDealRooms,
  capitalNetworkExecutionRecords,
  capitalNetworkMatches,
  capitalNetworkProviders,
  serviceRequests,
  type CapitalNetworkProviderRow,
  type CapitalNetworkExecutionRecordRow,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  CAPITAL_NETWORK_RUNTIME_VERSION,
  matchCapitalProviders,
  type CapitalDealMatchInput,
  type CapitalProviderProfile,
} from "@/lib/financing/capitalNetworkRuntime";
import {
  MAX_COMPARISON_PROVIDERS,
  caseRoomExpiry,
  validateProviderResponse,
  type ClosingMilestone,
  type ProviderResponseStatus,
} from "@/lib/financing/managedProviderHandoff";
import {
  executionReliabilityTieBreak,
  summarizeProviderExecutionReliability,
  type CapitalExecutionOutcome,
  type ProviderExecutionReliability,
} from "@/lib/financing/capitalNetworkExecutionReliability";

export const CAPITAL_NETWORK_GOVERNANCE_VERSION = "capital-network-v1.1.0";
const RETAINED_BROKER_PROVIDER_ID = "retained-external-broker";

export type ProviderApplicationInput = {
  organizationName: string;
  providerRole: "BROKER" | "LENDER";
  providerType: string;
  primaryContactEmail: string;
  website?: string | null;
  states?: string[];
  programs?: string[];
  purposes?: string[];
  propertyTypes?: string[];
  industries?: string[];
  borrowerTypes?: string[];
  minDealAmount?: number | null;
  maxDealAmount?: number | null;
  publishedCreditBox?: Record<string, unknown>;
  collateralPolicy?: Record<string, unknown>;
  environmentalRequirements?: Record<string, unknown>;
  typicalFirstResponseDays?: number | null;
  typicalClosingDays?: number | null;
  creditBoxSourceRefs?: string[];
  acceptsBrokeredDeals?: boolean;
  acceptsDirectBorrower?: boolean;
  affiliation?: "INDEPENDENT" | "FURLONG_AFFILIATE";
};

export type ProviderGatePatch = Partial<{
  credentialStatus: string;
  connectorStatus: string;
  participationTermsStatus: string;
  dataAgreementStatus: string;
  compensationStatus: string;
  states: string[];
  programs: string[];
  purposes: string[];
  propertyTypes: string[];
  industries: string[];
  borrowerTypes: string[];
  minDealAmount: number | null;
  maxDealAmount: number | null;
  publishedCreditBox: Record<string, unknown>;
  collateralPolicy: Record<string, unknown>;
  environmentalRequirements: Record<string, unknown>;
  typicalFirstResponseDays: number | null;
  typicalClosingDays: number | null;
  creditBoxSourceRefs: string[];
  creditBoxVerifiedAt: Date | string | null;
  acceptsBrokeredDeals: boolean;
  acceptsDirectBorrower: boolean;
  website: string | null;
}>;

function list(value: unknown, upper = false): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const normalized = upper ? trimmed.toUpperCase() : trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function slug(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "capital-provider";
}

function money(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 0 ? rounded : null;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function positiveDays(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded > 0 && rounded <= 3650 ? rounded : null;
}


function executionRecordForSummary(row: CapitalNetworkExecutionRecordRow) {
  return {
    providerId: row.providerId,
    outcome: row.outcome as CapitalExecutionOutcome,
    verificationStatus: row.verificationStatus,
    selectedAt: row.selectedAt,
    consentedAt: row.consentedAt,
    providerFirstResponseAt: row.providerFirstResponseAt,
    providerDispositionAt: row.providerDispositionAt,
    closedFundedAt: row.closedFundedAt,
  };
}

export async function executionReliabilityForProviders(providerIds: string[]) {
  const unique = [...new Set(providerIds.filter(Boolean))];
  const rows = unique.length
    ? await db.select().from(capitalNetworkExecutionRecords).where(inArray(capitalNetworkExecutionRecords.providerId, unique))
    : [];
  const byProvider = new Map<string, CapitalNetworkExecutionRecordRow[]>();
  for (const row of rows) {
    const list = byProvider.get(row.providerId) ?? [];
    list.push(row);
    byProvider.set(row.providerId, list);
  }
  const summaries = new Map<string, ProviderExecutionReliability>();
  for (const providerId of unique) {
    summaries.set(
      providerId,
      summarizeProviderExecutionReliability(
        providerId,
        (byProvider.get(providerId) ?? []).map(executionRecordForSummary),
      ),
    );
  }
  return summaries;
}

export async function recordCapitalNetworkExecutionOutcome(input: {
  serviceRequestId: string;
  providerId: string;
  outcome: CapitalExecutionOutcome;
  outcomeReasonCategory?: string | null;
  providerFirstResponseAt?: Date | null;
  providerDispositionAt?: Date | null;
  closedFundedAt?: Date | null;
  evidenceRefs: string[];
  actorId: string;
  traceId: string;
}) {
  const serviceRequestId = input.serviceRequestId.trim().toUpperCase();
  const providerId = input.providerId.trim();
  const evidenceRefs = [...new Set(input.evidenceRefs.map((ref) => ref.trim()).filter(Boolean))];
  if (!serviceRequestId || !providerId) throw new Error("serviceRequestId and providerId are required.");
  if (!evidenceRefs.length) throw new Error("At least one evidence reference is required before an execution outcome can be VERIFIED.");

  const [room] = await db.select().from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, providerId),
  )).limit(1);
  if (!room) throw new Error("A Capital Network deal room is required before an execution outcome can be recorded.");

  const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.serviceRequestId, serviceRequestId)).limit(1);
  if (!request) throw new Error("Financing request was not found.");
  const metadata = (request.metadata ?? {}) as Record<string, unknown>;
  const now = new Date();
  const closedFundedAt = input.outcome === "CLOSED_FUNDED"
    ? input.closedFundedAt ?? input.providerDispositionAt ?? now
    : null;
  const providerDispositionAt = input.providerDispositionAt ?? now;
  const values = {
    serviceRequestId,
    providerId,
    submissionCaseId: room.submissionCaseId,
    program: request.serviceCode,
    propertyType: typeof metadata.propertyType === "string" ? metadata.propertyType : null,
    industry: typeof metadata.industry === "string" ? metadata.industry : null,
    locationState: request.locationState,
    selectedAt: room.selectedAt,
    consentedAt: room.consentedAt,
    providerFirstResponseAt: input.providerFirstResponseAt ?? null,
    providerDispositionAt,
    closedFundedAt,
    outcome: input.outcome,
    outcomeReasonCategory: input.outcomeReasonCategory?.trim() || null,
    verificationStatus: "VERIFIED",
    evidenceRefs,
    recordedBy: input.actorId,
    verifiedBy: input.actorId,
    verifiedAt: now,
    governanceVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: input.traceId,
    traceId: input.traceId,
    metadata: {
      propertyProjectOnly: true,
      personalFinancialScoring: false,
      compensationRanking: false,
      affiliationRanking: false,
    },
    updatedAt: now,
  } as const;

  const [record] = await db.insert(capitalNetworkExecutionRecords).values(values).onConflictDoUpdate({
    target: [capitalNetworkExecutionRecords.serviceRequestId, capitalNetworkExecutionRecords.providerId],
    set: values,
  }).returning();

  await db.update(capitalNetworkDealRooms).set({
    roomStatus: input.outcome === "CLOSED_FUNDED" ? "CLOSED_FUNDED" : "EXECUTION_OUTCOME_RECORDED",
    closedAt: closedFundedAt ?? providerDispositionAt,
    traceId: input.traceId,
    replayRef: input.traceId,
    updatedAt: now,
  }).where(eq(capitalNetworkDealRooms.id, room.id));

  return record;
}

export function providerProfileFromRow(row: CapitalNetworkProviderRow): CapitalProviderProfile {
  return {
    providerId: row.providerId,
    organizationName: row.organizationName,
    providerRole: row.providerRole as "BROKER" | "LENDER",
    providerType: row.providerType,
    status: row.status as CapitalProviderProfile["status"],
    affiliation: row.affiliation as "INDEPENDENT" | "FURLONG_AFFILIATE",
    states: list(row.states, true),
    programs: list(row.programs),
    purposes: list(row.purposes),
    propertyTypes: list(row.propertyTypes),
    industries: list(row.industries),
    borrowerTypes: list(row.borrowerTypes),
    minDealAmount: row.minDealAmount,
    maxDealAmount: row.maxDealAmount,
    publishedCreditBox: object(row.publishedCreditBox),
    collateralPolicy: object(row.collateralPolicy),
    environmentalRequirements: object(row.environmentalRequirements),
    typicalFirstResponseDays: row.typicalFirstResponseDays,
    typicalClosingDays: row.typicalClosingDays,
    creditBoxSourceRefs: list(row.creditBoxSourceRefs),
    creditBoxVerifiedAt: row.creditBoxVerifiedAt,
    matchingEnabled: row.matchingEnabled,
    explicitAssignmentAllowed: row.explicitAssignmentAllowed,
    liveRoutingAllowed: row.liveRoutingAllowed,
    profileVersion: row.profileVersion,
  };
}

export function publicProvider(row: CapitalNetworkProviderRow) {
  return {
    providerId: row.providerId,
    organizationName: row.organizationName,
    providerRole: row.providerRole,
    providerType: row.providerType,
    affiliation: row.affiliation,
    website: row.website,
    states: list(row.states, true),
    programs: list(row.programs),
    purposes: list(row.purposes),
    propertyTypes: list(row.propertyTypes),
    industries: list(row.industries),
    borrowerTypes: list(row.borrowerTypes),
    minDealAmount: row.minDealAmount,
    maxDealAmount: row.maxDealAmount,
    publishedCreditBox: object(row.publishedCreditBox),
    collateralPolicy: object(row.collateralPolicy),
    environmentalRequirements: object(row.environmentalRequirements),
    typicalFirstResponseDays: row.typicalFirstResponseDays,
    typicalClosingDays: row.typicalClosingDays,
    creditBoxSourceRefs: list(row.creditBoxSourceRefs),
    creditBoxVerifiedAt: row.creditBoxVerifiedAt?.toISOString() ?? null,
    creditBoxEvidenceStatus: row.creditBoxVerifiedAt && list(row.creditBoxSourceRefs).length > 0
      ? "SOURCE_VERIFIED"
      : "PROGRAM_APPETITE_ONLY",
    acceptsBrokeredDeals: row.acceptsBrokeredDeals,
    acceptsDirectBorrower: row.acceptsDirectBorrower,
    profileVersion: row.profileVersion,
    disclosure:
      row.affiliation === "FURLONG_AFFILIATE"
        ? "This provider is affiliated with Furlong. Affiliation does not improve its match score or priority."
        : "Independent provider. Furlong does not make the provider's credit decisions.",
  };
}

export async function createProviderApplication(input: ProviderApplicationInput, actorId: string, traceId: string) {
  const organizationName = input.organizationName.trim();
  const primaryContactEmail = input.primaryContactEmail.trim().toLowerCase();
  const website = input.website?.trim() || null;
  if (!organizationName || !primaryContactEmail.includes("@")) throw new Error("Organization name and a valid contact email are required.");
  if (!['BROKER', 'LENDER'].includes(input.providerRole)) throw new Error("providerRole must be BROKER or LENDER.");
  if (website && !/^https:\/\/[^\s]+$/i.test(website)) {
    throw new Error("Provider website must use an https:// URL.");
  }
  const states = list(input.states, true);
  const programs = list(input.programs);
  const providerId = `${slug(organizationName)}-${randomUUID().slice(0, 8)}`;
  const [row] = await db.insert(capitalNetworkProviders).values({
    providerId,
    organizationName,
    providerRole: input.providerRole,
    providerType: input.providerType.trim().toUpperCase() || "OTHER",
    status: "APPLICANT",
    affiliation: input.affiliation === "FURLONG_AFFILIATE" ? "FURLONG_AFFILIATE" : "INDEPENDENT",
    primaryContactEmail,
    website,
    states,
    programs,
    purposes: list(input.purposes),
    propertyTypes: list(input.propertyTypes),
    industries: list(input.industries),
    borrowerTypes: list(input.borrowerTypes),
    minDealAmount: money(input.minDealAmount),
    maxDealAmount: money(input.maxDealAmount),
    publishedCreditBox: object(input.publishedCreditBox),
    collateralPolicy: object(input.collateralPolicy),
    environmentalRequirements: object(input.environmentalRequirements),
    typicalFirstResponseDays: positiveDays(input.typicalFirstResponseDays),
    typicalClosingDays: positiveDays(input.typicalClosingDays),
    creditBoxSourceRefs: list(input.creditBoxSourceRefs),
    creditBoxVerifiedAt: null,
    acceptsBrokeredDeals: input.acceptsBrokeredDeals === true,
    acceptsDirectBorrower: input.acceptsDirectBorrower === true,
    matchingEnabled: false,
    explicitAssignmentAllowed: false,
    liveRoutingAllowed: false,
    credentialStatus: "PENDING",
    connectorStatus: "NOT_CONFIGURED",
    participationTermsStatus: "PENDING",
    dataAgreementStatus: "PENDING",
    compensationStatus: "UNSET",
    profileVersion: 1,
    governanceVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
    classification: "CONFIDENTIAL",
    replayRef: traceId,
    traceId,
    metadata: { createdBy: actorId, runtimeVersion: CAPITAL_NETWORK_RUNTIME_VERSION },
  }).returning();
  return row;
}

export async function listCapitalProviders(input: { status?: string | null; contactEmail?: string | null } = {}) {
  const filters = [
    input.status ? eq(capitalNetworkProviders.status, input.status) : null,
    input.contactEmail ? eq(capitalNetworkProviders.primaryContactEmail, input.contactEmail.trim().toLowerCase()) : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));
  const query = db.select().from(capitalNetworkProviders).orderBy(desc(capitalNetworkProviders.updatedAt));
  return filters.length === 0 ? query : query.where(filters.length === 1 ? filters[0] : and(...filters));
}

export async function getCapitalProvider(providerId: string) {
  const [row] = await db.select().from(capitalNetworkProviders).where(eq(capitalNetworkProviders.providerId, providerId)).limit(1);
  return row ?? null;
}

export function providerCertificationBlockers(row: CapitalNetworkProviderRow): string[] {
  const blockers: string[] = [];
  if (row.credentialStatus !== "VERIFIED") blockers.push("Professional/institutional authority is not VERIFIED.");
  if (row.connectorStatus !== "CERTIFIED") blockers.push("Delivery/connector posture is not CERTIFIED.");
  if (row.participationTermsStatus !== "EXECUTED") blockers.push("Participation terms are not EXECUTED.");
  if (row.dataAgreementStatus !== "EXECUTED") blockers.push("Data agreement is not EXECUTED.");
  if (row.compensationStatus !== "APPROVED") blockers.push("Compensation/conflict posture is not APPROVED.");
  if (list(row.states, true).length === 0) blockers.push("No governed geography has been declared.");
  if (list(row.programs).length === 0) blockers.push("No governed program appetite has been declared.");
  return blockers;
}

export async function reviewCapitalProvider(
  providerId: string,
  action: "START_DUE_DILIGENCE" | "UPDATE_GATES" | "CERTIFY" | "SUSPEND" | "RETIRE",
  patch: ProviderGatePatch,
  actorId: string,
  traceId: string,
) {
  const row = await getCapitalProvider(providerId);
  if (!row) throw new Error("Capital Network provider was not found.");
  const next: Record<string, unknown> = {
    updatedAt: new Date(),
    traceId,
    replayRef: traceId,
    metadata: { ...((row.metadata as Record<string, unknown>) ?? {}), lastReviewedBy: actorId, lastAction: action },
  };
  const arrayKeys = ["states", "programs", "purposes", "propertyTypes", "industries", "borrowerTypes"] as const;
  for (const key of arrayKeys) {
    if (patch[key] !== undefined) next[key] = list(patch[key], key === "states");
  }
  if (patch.creditBoxSourceRefs !== undefined) next.creditBoxSourceRefs = list(patch.creditBoxSourceRefs);
  for (const key of ["publishedCreditBox", "collateralPolicy", "environmentalRequirements"] as const) {
    if (patch[key] !== undefined) next[key] = object(patch[key]);
  }
  if (patch.typicalFirstResponseDays !== undefined) next.typicalFirstResponseDays = positiveDays(patch.typicalFirstResponseDays);
  if (patch.typicalClosingDays !== undefined) next.typicalClosingDays = positiveDays(patch.typicalClosingDays);
  if (patch.creditBoxVerifiedAt !== undefined) {
    if (patch.creditBoxVerifiedAt == null) {
      next.creditBoxVerifiedAt = null;
    } else {
      const verifiedAt = patch.creditBoxVerifiedAt instanceof Date
        ? patch.creditBoxVerifiedAt
        : new Date(patch.creditBoxVerifiedAt);
      if (Number.isNaN(verifiedAt.getTime())) throw new Error("Credit-box verification timestamp is invalid.");
      next.creditBoxVerifiedAt = verifiedAt;
    }
  }
  for (const key of ["credentialStatus", "connectorStatus", "participationTermsStatus", "dataAgreementStatus", "compensationStatus", "website"] as const) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  for (const key of ["acceptsBrokeredDeals", "acceptsDirectBorrower"] as const) {
    if (patch[key] !== undefined) next[key] = patch[key];
  }
  if (patch.minDealAmount !== undefined) next.minDealAmount = money(patch.minDealAmount);
  if (patch.maxDealAmount !== undefined) next.maxDealAmount = money(patch.maxDealAmount);
  if (action === "START_DUE_DILIGENCE") next.status = "DUE_DILIGENCE";
  if (action === "CERTIFY") {
    const projected = { ...row, ...next } as CapitalNetworkProviderRow;
    const blockers = providerCertificationBlockers(projected);
    if (blockers.length) throw new Error(`Provider certification is blocked: ${blockers.join(" ")}`);
    next.status = "CERTIFIED_ACTIVE";
    next.matchingEnabled = true;
    next.explicitAssignmentAllowed = true;
    next.liveRoutingAllowed = true;
    next.verifiedAt = new Date();
  }
  if (action === "SUSPEND") {
    next.status = "SUSPENDED";
    next.matchingEnabled = false;
    next.liveRoutingAllowed = false;
  }
  if (action === "RETIRE") {
    next.status = "RETIRED";
    next.matchingEnabled = false;
    next.explicitAssignmentAllowed = false;
    next.liveRoutingAllowed = false;
  }
  next.profileVersion = row.profileVersion + 1;
  const [updated] = await db.update(capitalNetworkProviders).set(next).where(eq(capitalNetworkProviders.providerId, providerId)).returning();
  return { provider: updated, blockers: providerCertificationBlockers(updated) };
}

async function financingRequest(serviceRequestId: string) {
  const [row] = await db.select().from(serviceRequests).where(and(
    eq(serviceRequests.serviceRequestId, serviceRequestId.trim().toUpperCase()),
    eq(serviceRequests.requestType, "financing_deal_intake"),
  )).limit(1);
  if (!row) throw new Error("Financing request was not found.");
  return row;
}

function matchInputFromRequest(row: Awaited<ReturnType<typeof financingRequest>>): CapitalDealMatchInput {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    serviceRequestId: row.serviceRequestId,
    state: row.locationState,
    program: row.serviceCode,
    purpose: typeof metadata.purpose === "string" ? metadata.purpose : null,
    estimatedAmount: row.estimatedValue,
    propertyType: typeof metadata.propertyType === "string" ? metadata.propertyType : null,
    industry: typeof metadata.industry === "string" ? metadata.industry : null,
    borrowerType: typeof metadata.borrowerType === "string" ? metadata.borrowerType : null,
  };
}

export async function refreshCapitalMatches(serviceRequestId: string, actorId: string, traceId: string) {
  const request = await financingRequest(serviceRequestId);
  const providers = await db.select().from(capitalNetworkProviders).where(eq(capitalNetworkProviders.status, "CERTIFIED_ACTIVE"));
  const profiles = providers.filter((p) => p.matchingEnabled).map(providerProfileFromRow);
  const matches = matchCapitalProviders(matchInputFromRequest(request), profiles);
  const existing = await db.select().from(capitalNetworkMatches).where(eq(capitalNetworkMatches.serviceRequestId, request.serviceRequestId));
  const existingByProvider = new Map(existing.map((row) => [row.providerId, row] as const));
  for (const match of matches) {
    const prior = existingByProvider.get(match.providerId);
    const preserveSelection = prior?.matchStatus === "BORROWER_SELECTED";
    await db.insert(capitalNetworkMatches).values({
      serviceRequestId: request.serviceRequestId,
      providerId: match.providerId,
      providerProfileVersion: match.providerProfileVersion,
      score: match.score,
      eligible: match.eligible,
      reasons: match.reasons,
      blockers: match.blockers,
      matchStatus: preserveSelection ? "BORROWER_SELECTED" : match.eligible ? "CANDIDATE" : "INELIGIBLE",
      selectedBy: preserveSelection ? prior?.selectedBy ?? null : null,
      selectedAt: preserveSelection ? prior?.selectedAt ?? null : null,
      lastMatchedAt: new Date(),
      dataShared: prior?.dataShared ?? false,
      governanceVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
      classification: "CONFIDENTIAL",
      replayRef: traceId,
      traceId,
      metadata: { matchedBy: actorId, runtimeVersion: CAPITAL_NETWORK_RUNTIME_VERSION },
    }).onConflictDoUpdate({
      target: [capitalNetworkMatches.serviceRequestId, capitalNetworkMatches.providerId],
      set: {
        providerProfileVersion: match.providerProfileVersion,
        score: match.score,
        eligible: match.eligible,
        reasons: match.reasons,
        blockers: match.blockers,
        matchStatus: preserveSelection ? "BORROWER_SELECTED" : match.eligible ? "CANDIDATE" : "INELIGIBLE",
        selectedBy: preserveSelection ? prior?.selectedBy ?? null : null,
        selectedAt: preserveSelection ? prior?.selectedAt ?? null : null,
        lastMatchedAt: new Date(),
        traceId,
        replayRef: traceId,
        updatedAt: new Date(),
      },
    });
  }
  return { request, providers, matches };
}

async function verifiedBorrowerRequest(serviceRequestId: string, email: string) {
  const request = await financingRequest(serviceRequestId);
  if (!request.contactEmail || request.contactEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error("Financing request was not found for that reference and email.");
  }
  return request;
}

export async function publicMatchesForRequest(serviceRequestId: string, email: string, traceId: string) {
  const request = await verifiedBorrowerRequest(serviceRequestId, email);
  await refreshCapitalMatches(request.serviceRequestId, "borrower-match-refresh", traceId);
  const rows = await db.select().from(capitalNetworkMatches).where(and(
    eq(capitalNetworkMatches.serviceRequestId, request.serviceRequestId),
    eq(capitalNetworkMatches.eligible, true),
  )).orderBy(desc(capitalNetworkMatches.score));
  const providerIds = rows.map((row) => row.providerId);
  const providers = providerIds.length
    ? await db.select().from(capitalNetworkProviders).where(inArray(capitalNetworkProviders.providerId, providerIds))
    : [];
  const providerById = new Map(providers.map((row) => [row.providerId, row] as const));
  const reliability = await executionReliabilityForProviders(providerIds);
  const publicRows = rows.flatMap((row) => {
    const provider = providerById.get(row.providerId);
    if (!provider) return [];
    return [{
      matchId: row.id,
      score: row.score,
      reasons: row.reasons as string[],
      selected: row.matchStatus === "BORROWER_SELECTED",
      provider: publicProvider(provider),
      executionReliability: reliability.get(row.providerId) ?? null,
    }];
  });
  publicRows.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.executionReliability && right.executionReliability) {
      const execution = executionReliabilityTieBreak(left.executionReliability, right.executionReliability);
      if (execution !== 0) return execution;
    }
    return left.provider.organizationName.localeCompare(right.provider.organizationName);
  });
  return publicRows;
}

export async function selectProviderForRequest(serviceRequestId: string, email: string, providerId: string, traceId: string) {
  const request = await verifiedBorrowerRequest(serviceRequestId, email);
  await refreshCapitalMatches(request.serviceRequestId, "borrower-selection-refresh", traceId);
  const [match] = await db.select().from(capitalNetworkMatches).where(and(
    eq(capitalNetworkMatches.serviceRequestId, request.serviceRequestId),
    eq(capitalNetworkMatches.providerId, providerId),
  )).limit(1);
  if (!match || !match.eligible) throw new Error("That provider is not currently eligible for borrower selection on this case.");
  const provider = await getCapitalProvider(providerId);
  if (!provider || provider.status !== "CERTIFIED_ACTIVE" || !provider.explicitAssignmentAllowed) {
    throw new Error("That provider is not active for case assignment.");
  }
  const alreadySelected = await db
    .select({ providerId: capitalNetworkMatches.providerId })
    .from(capitalNetworkMatches)
    .where(and(
      eq(capitalNetworkMatches.serviceRequestId, request.serviceRequestId),
      eq(capitalNetworkMatches.matchStatus, "BORROWER_SELECTED"),
    ));
  if (!alreadySelected.some((row) => row.providerId === providerId) && alreadySelected.length >= MAX_COMPARISON_PROVIDERS) {
    throw new Error(`A comparison round may include no more than ${MAX_COMPARISON_PROVIDERS} providers.`);
  }
  const [existingRoom] = await db
    .select()
    .from(capitalNetworkDealRooms)
    .where(
      and(
        eq(capitalNetworkDealRooms.serviceRequestId, request.serviceRequestId),
        eq(capitalNetworkDealRooms.providerId, providerId),
      ),
    )
    .limit(1);
  const selectedAt = new Date();
  const selectedBy = `borrower:${request.serviceRequestId}`;
  const [selected] = await db.update(capitalNetworkMatches).set({
    matchStatus: "BORROWER_SELECTED",
    selectedBy,
    selectedAt,
    traceId,
    replayRef: traceId,
    updatedAt: selectedAt,
  }).where(eq(capitalNetworkMatches.id, match.id)).returning();
  await db.insert(capitalNetworkDealRooms).values({
    serviceRequestId: request.serviceRequestId,
    providerId,
    matchId: match.id,
    roomStatus: existingRoom?.providerAccessAllowed
      ? existingRoom.roomStatus
      : "AWAITING_PACKAGE_AND_CONSENT",
    providerAccessAllowed: existingRoom?.providerAccessAllowed ?? false,
    dataShared: existingRoom?.dataShared ?? false,
    selectedAt,
    consentedAt: existingRoom?.consentedAt ?? null,
    submissionCaseId: existingRoom?.submissionCaseId ?? null,
    governanceVersion: CAPITAL_NETWORK_GOVERNANCE_VERSION,
    classification: "RESTRICTED",
    replayRef: traceId,
    traceId,
    metadata: { selectionOnly: true, exactPackageConsentRequired: true },
  }).onConflictDoUpdate({
    target: [capitalNetworkDealRooms.serviceRequestId, capitalNetworkDealRooms.providerId],
    set: {
      matchId: match.id,
      roomStatus: existingRoom?.providerAccessAllowed
        ? existingRoom.roomStatus
        : "AWAITING_PACKAGE_AND_CONSENT",
      providerAccessAllowed: existingRoom?.providerAccessAllowed ?? false,
      dataShared: existingRoom?.dataShared ?? false,
      submissionCaseId: existingRoom?.submissionCaseId ?? null,
      consentedAt: existingRoom?.consentedAt ?? null,
      selectedAt,
      traceId,
      replayRef: traceId,
      updatedAt: selectedAt,
    },
  });
  return {
    selected,
    provider: publicProvider(provider),
    selectionSharesData: false,
    existingConsentedAccessPreserved: existingRoom?.providerAccessAllowed ?? false,
  };
}

export async function assertSelectedProviderForSubmission(serviceRequestId: string, providerId: string) {
  const [room] = await db.select().from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, providerId),
  )).limit(1);
  if (!room) throw new Error("A borrower-selected Capital Network deal room is required before building a provider package.");
  const [match] = await db.select().from(capitalNetworkMatches).where(and(
    eq(capitalNetworkMatches.serviceRequestId, serviceRequestId),
    eq(capitalNetworkMatches.providerId, providerId),
  )).limit(1);
  if (!match || match.matchStatus !== "BORROWER_SELECTED" || !match.eligible) throw new Error("The selected provider match is missing, stale, or no longer eligible.");
  const provider = await getCapitalProvider(providerId);
  if (!provider || !["CERTIFIED_ACTIVE", "TRANSITION_ACTIVE"].includes(provider.status)) throw new Error("The selected provider is not active.");
  return { room, match, provider };
}

export async function linkSubmissionCaseToDealRoom(serviceRequestId: string, providerId: string, submissionCaseId: string, traceId: string) {
  await db.update(capitalNetworkDealRooms).set({
    submissionCaseId,
    roomStatus: "PACKAGE_BUILDING",
    traceId,
    replayRef: traceId,
    updatedAt: new Date(),
  }).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, providerId),
  ));
}

export async function activateDealRoomAfterConsent(serviceRequestId: string | null, providerId: string | null, traceId: string) {
  if (!serviceRequestId || !providerId) return;
  await db.update(capitalNetworkDealRooms).set({
    roomStatus: "CONSENTED_PROVIDER_ACCESS",
    providerAccessAllowed: true,
    // This flag means provider-scoped case data may now be disclosed in the
    // consented deal room. Full package dispatch remains a separate gate.
    dataShared: true,
    consentedAt: new Date(),
    caseRoomExpiresAt: caseRoomExpiry(new Date()),
    traceId,
    replayRef: traceId,
    updatedAt: new Date(),
  }).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, providerId),
  ));
}

export async function recordManagedProviderResponse(input: {
  serviceRequestId: string;
  providerId: string;
  status: ProviderResponseStatus;
  summary?: string | null;
  missingItems?: string[];
  conditions?: string[];
  offerTerms?: Record<string, unknown> | null;
  actorId: string;
  traceId: string;
}) {
  const errors = validateProviderResponse({
    status: input.status,
    missingItems: input.missingItems,
    conditions: input.conditions,
    explanation: input.summary,
  });
  if (errors.length) throw new Error(errors.join(" "));
  const [room] = await db.select().from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, input.serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, input.providerId),
    eq(capitalNetworkDealRooms.providerAccessAllowed, true),
  )).limit(1);
  if (!room) throw new Error("An active, consented case room is required.");
  if (room.caseRoomExpiresAt && room.caseRoomExpiresAt.getTime() <= Date.now()) {
    throw new Error("This case room has expired.");
  }
  const now = new Date();
  const [updated] = await db.update(capitalNetworkDealRooms).set({
    providerResponseStatus: input.status,
    providerResponseSummary: input.summary?.trim() || null,
    providerResponseDetails: {
      missingItems: input.missingItems ?? [],
      conditions: input.conditions ?? [],
      offerTerms: input.offerTerms ?? null,
      recordedBy: input.actorId,
    },
    providerRespondedAt: now,
    roomStatus: input.status,
    traceId: input.traceId,
    replayRef: input.traceId,
    updatedAt: now,
  }).where(eq(capitalNetworkDealRooms.id, room.id)).returning();
  return updated;
}

export async function updateClosingMilestone(input: {
  serviceRequestId: string;
  providerId: string;
  milestone: ClosingMilestone;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE";
  note?: string | null;
  evidenceRefs?: string[];
  actorId: string;
  traceId: string;
}) {
  const [room] = await db.select().from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, input.serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, input.providerId),
  )).limit(1);
  if (!room) throw new Error("Provider case room was not found.");
  const current = Array.isArray(room.closingMilestones)
    ? room.closingMilestones.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
  const without = current.filter((item) => item.milestone !== input.milestone);
  const now = new Date();
  const closingMilestones = [...without, {
    milestone: input.milestone,
    status: input.status,
    note: input.note?.trim() || null,
    evidenceRefs: input.evidenceRefs ?? [],
    recordedBy: input.actorId,
    recordedAt: now.toISOString(),
  }];
  const [updated] = await db.update(capitalNetworkDealRooms).set({
    closingMilestones,
    roomStatus: input.milestone === "KEYS_AND_LOGBOOK" && input.status === "COMPLETE"
      ? "CLOSED_LOGBOOK_RECORDED"
      : "CLOSING_IN_PROGRESS",
    closedAt: input.milestone === "KEYS_AND_LOGBOOK" && input.status === "COMPLETE" ? now : room.closedAt,
    traceId: input.traceId,
    replayRef: input.traceId,
    updatedAt: now,
  }).where(eq(capitalNetworkDealRooms.id, room.id)).returning();
  return updated;
}

export async function providerMayAccessServiceRequest(providerId: string | null, serviceRequestId: string, allowLegacy = false): Promise<boolean> {
  if (!providerId) return false;
  const [room] = await db.select({ id: capitalNetworkDealRooms.id }).from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.serviceRequestId, serviceRequestId),
    eq(capitalNetworkDealRooms.providerId, providerId),
    eq(capitalNetworkDealRooms.providerAccessAllowed, true),
  )).limit(1);
  if (room) return true;
  if (allowLegacy && providerId === RETAINED_BROKER_PROVIDER_ID) {
    const [request] = await db.select({ routedTo: serviceRequests.routedTo }).from(serviceRequests).where(eq(serviceRequests.serviceRequestId, serviceRequestId)).limit(1);
    return request?.routedTo === "licensed-lending-spoke";
  }
  return false;
}

export async function listCapitalDealRoomsForCapitalDesk(limit = 200) {
  const rooms = await db
    .select()
    .from(capitalNetworkDealRooms)
    .orderBy(desc(capitalNetworkDealRooms.updatedAt))
    .limit(Math.min(Math.max(limit, 1), 500));
  const requestIds = rooms.map((room) => room.serviceRequestId);
  const providerIds = rooms.map((room) => room.providerId);
  const requests = requestIds.length
    ? await db
        .select()
        .from(serviceRequests)
        .where(inArray(serviceRequests.serviceRequestId, requestIds))
    : [];
  const providers = providerIds.length
    ? await db
        .select()
        .from(capitalNetworkProviders)
        .where(inArray(capitalNetworkProviders.providerId, providerIds))
    : [];
  const executionRecords = requestIds.length
    ? await db
        .select()
        .from(capitalNetworkExecutionRecords)
        .where(inArray(capitalNetworkExecutionRecords.serviceRequestId, requestIds))
    : [];
  const requestById = new Map(requests.map((row) => [row.serviceRequestId, row] as const));
  const providerById = new Map(providers.map((row) => [row.providerId, row] as const));
  const executionByCaseProvider = new Map(executionRecords.map((row) => [`${row.serviceRequestId}::${row.providerId}`, row] as const));
  return rooms.map((room) => {
    const request = requestById.get(room.serviceRequestId);
    const provider = providerById.get(room.providerId);
    const execution = executionByCaseProvider.get(`${room.serviceRequestId}::${room.providerId}`);
    return {
      roomId: room.id,
      serviceRequestId: room.serviceRequestId,
      providerId: room.providerId,
      providerName: provider?.organizationName ?? room.providerId,
      providerRole: provider?.providerRole ?? null,
      roomStatus: room.roomStatus,
      submissionCaseId: room.submissionCaseId,
      providerAccessAllowed: room.providerAccessAllowed,
      dataShared: room.dataShared,
      caseRoomExpiresAt: room.caseRoomExpiresAt?.toISOString() ?? null,
      providerResponseStatus: room.providerResponseStatus,
      providerResponseSummary: room.providerResponseSummary,
      providerResponseDetails: room.providerResponseDetails,
      providerRespondedAt: room.providerRespondedAt?.toISOString() ?? null,
      closingMilestones: room.closingMilestones,
      selectedAt: room.selectedAt?.toISOString() ?? null,
      consentedAt: room.consentedAt?.toISOString() ?? null,
      status: request?.status ?? null,
      program: request?.serviceCode ?? null,
      estimatedAmount: request?.estimatedValue ?? null,
      locationState: request?.locationState ?? null,
      locationCounty: request?.locationCounty ?? null,
      propertyDescriptor: request?.propertyDescriptor ?? null,
      scopeSummary: request?.scopeSummary ?? null,
      executionOutcome: execution?.outcome ?? null,
      executionVerificationStatus: execution?.verificationStatus ?? null,
      executionVerifiedAt: execution?.verifiedAt?.toISOString() ?? null,
    };
  });
}

export async function listProviderDealRooms(providerId: string) {
  const rooms = await db.select().from(capitalNetworkDealRooms).where(and(
    eq(capitalNetworkDealRooms.providerId, providerId),
    eq(capitalNetworkDealRooms.providerAccessAllowed, true),
  )).orderBy(desc(capitalNetworkDealRooms.updatedAt));
  const ids = rooms.map((room) => room.serviceRequestId);
  const requests = ids.length
    ? await db.select().from(serviceRequests).where(inArray(serviceRequests.serviceRequestId, ids))
    : [];
  const requestById = new Map(requests.map((row) => [row.serviceRequestId, row] as const));
  return rooms.map((room) => {
    const request = requestById.get(room.serviceRequestId);
    return {
      roomId: room.id,
      serviceRequestId: room.serviceRequestId,
      providerId: room.providerId,
      roomStatus: room.roomStatus,
      submissionCaseId: room.submissionCaseId,
      status: request?.status ?? null,
      program: request?.serviceCode ?? null,
      estimatedAmount: request?.estimatedValue ?? null,
      locationState: request?.locationState ?? null,
      locationCounty: request?.locationCounty ?? null,
      propertyDescriptor: request?.propertyDescriptor ?? null,
      scopeSummary: request?.scopeSummary ?? null,
      providerAccessAllowed: room.providerAccessAllowed,
      dataShared: room.dataShared,
      caseRoomExpiresAt: room.caseRoomExpiresAt?.toISOString() ?? null,
      providerResponseStatus: room.providerResponseStatus,
      providerResponseSummary: room.providerResponseSummary,
      providerResponseDetails: room.providerResponseDetails,
      providerRespondedAt: room.providerRespondedAt?.toISOString() ?? null,
      closingMilestones: room.closingMilestones,
      selectedAt: room.selectedAt?.toISOString() ?? null,
      consentedAt: room.consentedAt?.toISOString() ?? null,
    };
  });
}

export const retainedExternalBrokerProviderId = RETAINED_BROKER_PROVIDER_ID;
