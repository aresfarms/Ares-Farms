import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import type { ParcelTaxAuthorityRecord, WellPermitAuthorityRecord } from "./officialPropertySourceAdapters";

export type OfficialEvidenceRows = ParcelTaxAuthorityRecord[] | WellPermitAuthorityRecord[];
export type OfficialEvidenceConnectorFetcher = () => Promise<OfficialEvidenceRows>;
export type ConnectorApprovalStatus = "pending" | "approved" | "suspended";

export interface OfficialEvidenceConnectorRegistration {
  connectorId: string;
  sourceId: OfficialEvidenceSourceId;
  sourceName: string;
  officialAuthority: string;
  legalBasis: string;
  geographicScope: string[];
  parserVersion: string;
  sourceUrl: string;
  registeredAt: string;
  status: ConnectorApprovalStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewReason?: string | null;
}

interface RegistryEntry {
  registration: OfficialEvidenceConnectorRegistration;
  fetcher: OfficialEvidenceConnectorFetcher;
}

const registry = new Map<OfficialEvidenceSourceId, RegistryEntry>();

function validate(registration: OfficialEvidenceConnectorRegistration): void {
  const required = [registration.connectorId, registration.sourceName, registration.officialAuthority, registration.legalBasis, registration.parserVersion, registration.sourceUrl, registration.registeredAt];
  if (required.some((value) => !value?.trim())) throw new Error("Connector registration is missing required identity, authority, legal-basis, parser, URL, or timestamp fields.");
  if (!registration.geographicScope.length || registration.geographicScope.some((value) => !value.trim())) throw new Error("Connector registration requires a non-empty geographic scope.");
  if (registration.status === "approved" && (!registration.reviewedBy?.trim() || !registration.reviewedAt?.trim())) throw new Error("Approved connector registration requires reviewer identity and review timestamp.");
}

export function registerOfficialEvidenceConnector(registration: OfficialEvidenceConnectorRegistration, fetcher: OfficialEvidenceConnectorFetcher): void {
  validate(registration);
  registry.set(registration.sourceId, { registration: structuredClone(registration), fetcher });
}

export function clearOfficialEvidenceConnectorRegistry(): void { registry.clear(); }

export function getOfficialEvidenceConnectorRegistration(sourceId: OfficialEvidenceSourceId): OfficialEvidenceConnectorRegistration | null {
  return registry.get(sourceId)?.registration ?? null;
}

export function resolveApprovedOfficialEvidenceConnector(sourceId: OfficialEvidenceSourceId): RegistryEntry | null {
  const entry = registry.get(sourceId);
  if (!entry || entry.registration.status !== "approved") return null;
  validate(entry.registration);
  return entry;
}
