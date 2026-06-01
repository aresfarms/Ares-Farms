/**
 * Canonical Connector Source Registry
 *
 * Master Volume Governance:
 * - Vol I: Preserves one constitutional source-authority map.
 * - Vol II: Prevents unsupported USDA, SBA, property, borrower, or
 *   institutional external data from entering regulated workflows.
 * - Vol III: Provides deterministic source and query validation for replay.
 * - Vol IV: Supports operator certification, outage planning, escalation,
 *   and audit preparation.
 * - Vol V: Enforces source authority, classification, consent, replay,
 *   observability, version lineage, and evidence preservation.
 */

export type CanonicalExternalSource = {
  id: string;
  sourceName: string;
  sourceType: string;
  authorityLevel: string;
  sourceVersion: string;
  allowedQueryTypes: string[];
};

export const CANONICAL_EXTERNAL_SOURCES: Record<
  string,
  CanonicalExternalSource
> = {
  "usda-fsa": {
    id: "usda-fsa",
    sourceName: "USDA Farm Service Agency",
    sourceType: "USDA",
    authorityLevel: "official-reference-required",
    sourceVersion: "usda-fsa-connector-governance-v0.1.0",
    allowedQueryTypes: ["program_reference", "farm_service_context"],
  },
  sba: {
    id: "sba",
    sourceName: "Small Business Administration",
    sourceType: "SBA",
    authorityLevel: "official-reference-required",
    sourceVersion: "sba-connector-governance-v0.1.0",
    allowedQueryTypes: ["program_reference", "small_business_context"],
  },
  "property-records": {
    id: "property-records",
    sourceName: "Property Records Source",
    sourceType: "PROPERTY",
    authorityLevel: "jurisdictional-source-required",
    sourceVersion: "property-records-connector-governance-v0.1.0",
    allowedQueryTypes: ["property_record", "parcel_context"],
  },
};

const SOURCE_ALIASES: Record<string, string> = {
  usda: "usda-fsa",
  "usda-fsa": "usda-fsa",
  usda_fsa: "usda-fsa",
  fsa: "usda-fsa",
  sba: "sba",
  property: "property-records",
  "property-records": "property-records",
  property_records: "property-records",
  parcel: "property-records",
};

export function normalizeConnectorText(value: unknown): string | null {
  if (typeof value !== "string") {
    return value === null || value === undefined ? null : String(value);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

export function normalizeExternalSourceId(sourceId: unknown): string {
  const normalized = normalizeConnectorText(sourceId)?.toLowerCase();

  if (!normalized) {
    throw new Error("sourceId is required for external connector governance.");
  }

  const canonicalSourceId = SOURCE_ALIASES[normalized] ?? normalized;

  if (!CANONICAL_EXTERNAL_SOURCES[canonicalSourceId]) {
    throw new Error(`Unsupported external sourceId: ${sourceId}.`);
  }

  return canonicalSourceId;
}

export function resolveCanonicalExternalSource(
  sourceId: unknown
): CanonicalExternalSource {
  return CANONICAL_EXTERNAL_SOURCES[normalizeExternalSourceId(sourceId)];
}

export function normalizeExternalQueryType(
  queryType: unknown,
  source: CanonicalExternalSource
): string {
  const normalized = normalizeConnectorText(queryType)?.toLowerCase();

  if (!normalized) {
    throw new Error("queryType is required for external connector governance.");
  }

  if (!source.allowedQueryTypes.includes(normalized)) {
    throw new Error(
      `Query type ${queryType} is not allowed for source ${source.id}.`
    );
  }

  return normalized;
}

export function listCanonicalExternalSources(): CanonicalExternalSource[] {
  return Object.values(CANONICAL_EXTERNAL_SOURCES);
}
