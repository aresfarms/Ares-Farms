import type { CanonicalProperty } from "@/lib/property/propertyTypes";
import type { OfficialPropertyEvidenceRecord } from "@/lib/property/propertyEvidenceIngestion";
import { OFFICIAL_EVIDENCE_SOURCE_ACTIVATION, resolveOfficialEvidenceSource, type OfficialEvidenceSnapshot } from "@/lib/property/officialEvidenceSourceGovernance";
import { readOfficialEvidenceRefreshState } from "@/lib/property/officialEvidenceRuntimeStore";
import { verifiedSnapshotsForRead } from "@/lib/property/officialEvidenceReadVerification";

export interface ParcelTaxAuthorityRecord {
  parcelId: string;
  authority: string;
  jurisdiction: string;
  reference: string;
  retrievedAt: string;
  asOf: string;
  effectiveDate?: string | null;
  replayRef: string;
  currentAnnualTax?: number | null;
  reassessmentBasis?: string | null;
  transferContinuityVerified: boolean;
}

export interface WellPermitAuthorityRecord {
  parcelId: string;
  authority: string;
  jurisdiction: string;
  permitNumber: string;
  retrievedAt: string;
  asOf: string;
  effectiveDate?: string | null;
  replayRef: string;
  sourceType: "domestic-well" | "deep-well" | "irrigation-well" | "artesian-well" | "multiple-well-system";
  testedYieldGpm?: number | null;
  status: "adequate-private-source" | "adequate-with-conditions" | "capacity-constrained" | "rights-allocation-constrained";
}

// Governed version history. Empty means no approved official snapshot exists; adapters fail closed.
export const PARCEL_TAX_AUTHORITY_SNAPSHOTS: OfficialEvidenceSnapshot<ParcelTaxAuthorityRecord>[] = [];
export const WELL_PERMIT_AUTHORITY_SNAPSHOTS: OfficialEvidenceSnapshot<WellPermitAuthorityRecord>[] = [];

export function governedParcelTaxRecords(now = new Date()): ParcelTaxAuthorityRecord[] {
  return resolveOfficialEvidenceSource({
    activation: OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["parcel-tax-authority"],
    snapshots: verifiedSnapshotsForRead("parcel-tax-authority", readOfficialEvidenceRefreshState<ParcelTaxAuthorityRecord>("parcel-tax-authority")?.snapshots ?? PARCEL_TAX_AUTHORITY_SNAPSHOTS),
    now,
  }).records;
}

export function governedWellPermitRecords(now = new Date()): WellPermitAuthorityRecord[] {
  return resolveOfficialEvidenceSource({
    activation: OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["well-permit-authority"],
    snapshots: verifiedSnapshotsForRead("well-permit-authority", readOfficialEvidenceRefreshState<WellPermitAuthorityRecord>("well-permit-authority")?.snapshots ?? WELL_PERMIT_AUTHORITY_SNAPSHOTS),
    now,
  }).records;
}

function parcelIds(property: CanonicalProperty): Set<string> {
  return new Set(property.parcel_refs.map((value) => value.trim()).filter(Boolean));
}

export function parcelTaxEvidenceRecords(property: CanonicalProperty, records = governedParcelTaxRecords()): OfficialPropertyEvidenceRecord[] {
  const ids = parcelIds(property);
  return records.filter((row) => ids.has(row.parcelId)).map((row) => ({
    recordId: `tax:${row.parcelId}:${row.reference}`,
    domain: "tax",
    status: "current-parcel-tax",
    sourceId: "parcel-tax-authority",
    sourceName: "Parcel tax authority record",
    authority: row.authority,
    jurisdiction: row.jurisdiction,
    reference: row.reference,
    retrievedAt: row.retrievedAt,
    asOf: row.asOf,
    effectiveDate: row.effectiveDate ?? null,
    replayRef: row.replayRef,
    canonicalPropertyId: property.canonical_property_id,
    parcelMatchMethod: "parcel-id",
    parcelMatchConfidence: "exact",
    notes: [
      row.currentAnnualTax == null ? "Current parcel tax not published in the activated record." : `Current parcel tax: $${Math.round(row.currentAnnualTax).toLocaleString("en-US")}.`,
      row.transferContinuityVerified ? "Transfer continuity is officially verified." : "Seller tax is informational only; transfer continuity is not verified.",
      ...(row.reassessmentBasis ? [`Reassessment basis: ${row.reassessmentBasis}`] : []),
    ],
    annualCost: row.currentAnnualTax ?? null,
    currentAnnualTax: row.currentAnnualTax ?? null,
    transferContinuityVerified: row.transferContinuityVerified,
  }));
}

export function wellPermitEvidenceRecords(property: CanonicalProperty, records = governedWellPermitRecords()): OfficialPropertyEvidenceRecord[] {
  const ids = parcelIds(property);
  return records.filter((row) => ids.has(row.parcelId)).map((row) => ({
    recordId: `well:${row.parcelId}:${row.permitNumber}`,
    domain: "water",
    status: row.status,
    sourceId: "well-permit-authority",
    sourceName: "Official well or water-permit record",
    authority: row.authority,
    jurisdiction: row.jurisdiction,
    reference: `Permit ${row.permitNumber}`,
    retrievedAt: row.retrievedAt,
    asOf: row.asOf,
    effectiveDate: row.effectiveDate ?? null,
    replayRef: row.replayRef,
    canonicalPropertyId: property.canonical_property_id,
    parcelMatchMethod: "parcel-id",
    parcelMatchConfidence: "exact",
    notes: [`Water source: ${row.sourceType}.`, ...(row.testedYieldGpm ? [`Tested yield: ${row.testedYieldGpm} GPM.`] : [])],
  }));
}

export function officialPropertyEvidenceRecords(property: CanonicalProperty): OfficialPropertyEvidenceRecord[] {
  return [...parcelTaxEvidenceRecords(property), ...wellPermitEvidenceRecords(property)];
}
