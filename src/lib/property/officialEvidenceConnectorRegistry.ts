import { randomUUID } from "node:crypto";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import type { ParcelTaxAuthorityRecord, WellPermitAuthorityRecord } from "./officialPropertySourceAdapters";
import { readDurableConnectorRegistry, writeDurableConnectorRegistry, type ConnectorReviewReceipt } from "./officialEvidenceConnectorRuntimeStore";

export type OfficialEvidenceRows = ParcelTaxAuthorityRecord[] | WellPermitAuthorityRecord[];
export type OfficialEvidenceConnectorFetcher = () => Promise<OfficialEvidenceRows>;
export type ConnectorApprovalStatus = "pending" | "approved" | "suspended";

export interface OfficialEvidenceConnectorRegistration {
  connectorId: string; sourceId: OfficialEvidenceSourceId; sourceName: string; officialAuthority: string; legalBasis: string;
  geographicScope: string[]; parserVersion: string; sourceUrl: string; registeredAt: string; status: ConnectorApprovalStatus;
  reviewedBy?: string | null; reviewedAt?: string | null; reviewReason?: string | null;
}
interface RegistryEntry { registration: OfficialEvidenceConnectorRegistration; fetcher: OfficialEvidenceConnectorFetcher; }
const fetchers = new Map<string, OfficialEvidenceConnectorFetcher>();

function validate(r: OfficialEvidenceConnectorRegistration): void {
  const required = [r.connectorId,r.sourceName,r.officialAuthority,r.legalBasis,r.parserVersion,r.sourceUrl,r.registeredAt];
  if (required.some(v=>!v?.trim())) throw new Error("Connector registration is missing required identity, authority, legal-basis, parser, URL, or timestamp fields.");
  if (!r.geographicScope.length || r.geographicScope.some(v=>!v.trim())) throw new Error("Connector registration requires a non-empty geographic scope.");
  if (r.status === "approved" && (!r.reviewedBy?.trim() || !r.reviewedAt?.trim())) throw new Error("Approved connector registration requires reviewer identity and review timestamp.");
}
function latestForSource(sourceId: OfficialEvidenceSourceId): OfficialEvidenceConnectorRegistration | null {
  return readDurableConnectorRegistry().registrations.filter(r=>r.sourceId===sourceId).at(-1) ?? null;
}
const materialFingerprint = (r: OfficialEvidenceConnectorRegistration): string => JSON.stringify({
  connectorId: r.connectorId, sourceId: r.sourceId, sourceName: r.sourceName, officialAuthority: r.officialAuthority,
  legalBasis: r.legalBasis, geographicScope: [...r.geographicScope].sort(), parserVersion: r.parserVersion, sourceUrl: r.sourceUrl,
});

export function registerOfficialEvidenceConnector(registration: OfficialEvidenceConnectorRegistration, fetcher: OfficialEvidenceConnectorFetcher): void {
  validate(registration);
  const state=readDurableConnectorRegistry();
  const previous=state.registrations.filter(r=>r.sourceId===registration.sourceId).at(-1) ?? null;
  const materiallyChanged=!!previous && materialFingerprint(previous)!==materialFingerprint(registration);
  const next: OfficialEvidenceConnectorRegistration = materiallyChanged
    ? {...registration,status:"pending",reviewedBy:null,reviewedAt:null,reviewReason:"Material connector change requires fresh review."}
    : registration;
  validate(next); fetchers.set(next.connectorId, fetcher);
  const registrations=state.registrations.filter(r=>!(r.connectorId===next.connectorId&&r.parserVersion===next.parserVersion&&r.registeredAt===next.registeredAt));
  const receipt: ConnectorReviewReceipt={receiptId:randomUUID(),connectorId:next.connectorId,sourceId:next.sourceId,decision:materiallyChanged?"CHANGE_REVIEW_REQUIRED":"REGISTER",actorId:"system:connector-registration",actorName:"connector-registration",decidedAt:next.registeredAt,reason:materiallyChanged?"Material connector identity, authority, legal basis, scope, parser, or URL changed; approval reset to pending.":"Connector version registered for governed review.",parserVersion:next.parserVersion};
  writeDurableConnectorRegistry({registrations:[...registrations,structuredClone(next)],receipts:[...state.receipts,receipt]});
}
export function decideOfficialEvidenceConnector(input:{sourceId:OfficialEvidenceSourceId;decision:"APPROVE"|"SUSPEND";reviewerId:string;reviewerName:string;reason:string;decidedAt?:string}): OfficialEvidenceConnectorRegistration {
  const current=latestForSource(input.sourceId); if(!current) throw new Error("No connector registration exists for this source.");
  const decidedAt=input.decidedAt??new Date().toISOString(); const next: OfficialEvidenceConnectorRegistration={...current,status:input.decision==="APPROVE"?"approved":"suspended",reviewedBy:input.reviewerId,reviewedAt:decidedAt,reviewReason:input.reason}; validate(next);
  const state=readDurableConnectorRegistry(); const receipt:ConnectorReviewReceipt={receiptId:randomUUID(),connectorId:next.connectorId,sourceId:next.sourceId,decision:input.decision,actorId:input.reviewerId,actorName:input.reviewerName,decidedAt,reason:input.reason,parserVersion:next.parserVersion};
  writeDurableConnectorRegistry({registrations:[...state.registrations,next],receipts:[...state.receipts,receipt]}); return next;
}
export function clearOfficialEvidenceConnectorRegistry(): void { fetchers.clear(); writeDurableConnectorRegistry({registrations:[],receipts:[]}); }
export function listOfficialEvidenceConnectorRegistrations(): OfficialEvidenceConnectorRegistration[] { return readDurableConnectorRegistry().registrations; }
export function listOfficialEvidenceConnectorReceipts(): ConnectorReviewReceipt[] { return readDurableConnectorRegistry().receipts; }
export function getOfficialEvidenceConnectorRegistration(sourceId: OfficialEvidenceSourceId): OfficialEvidenceConnectorRegistration | null { return latestForSource(sourceId); }
export function resolveApprovedOfficialEvidenceConnector(sourceId: OfficialEvidenceSourceId): RegistryEntry | null { const registration=latestForSource(sourceId); if(!registration||registration.status!=="approved")return null; validate(registration); const fetcher=fetchers.get(registration.connectorId); return fetcher?{registration,fetcher}:null; }
