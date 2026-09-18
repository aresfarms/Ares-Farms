import type { CanonicalDomainKey } from "@/lib/platform/canonicalDomainRegistry";

export const CANONICAL_IDENTITY_SCHEMA_VERSION = "canonical-identity-v1";

export type IdentityConfidence = "ASSERTED" | "PROBABLE" | "CORROBORATED" | "VERIFIED";
export type IdentityStatus = "ACTIVE" | "MERGED" | "SPLIT" | "RETIRED";
export type ExternalIdentifier = Readonly<{ namespace: string; value: string }>;
export type IdentityAlias = Readonly<{ value: string; normalizedValue: string }>;

export type CanonicalIdentityRecord = Readonly<{
  canonicalIdentityId: string;
  domain: CanonicalDomainKey;
  schemaVersion: typeof CANONICAL_IDENTITY_SCHEMA_VERSION;
  governanceVersion: string;
  status: IdentityStatus;
  aliases: readonly IdentityAlias[];
  externalIdentifiers: readonly ExternalIdentifier[];
  confidence: IdentityConfidence;
  matchScore: number;
  provenanceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
  supersededBy: readonly string[];
  createdAt: string;
  recordedAt: string;
}>;

export type CanonicalIdentityRegistry = Readonly<{
  records: Readonly<Record<string, CanonicalIdentityRecord>>;
  aliasIndex: Readonly<Record<string, readonly string[]>>;
  externalIdentifierIndex: Readonly<Record<string, readonly string[]>>;
}>;

export type CreateCanonicalIdentityInput = Omit<CanonicalIdentityRecord,
  "schemaVersion" | "aliases" | "externalIdentifiers" | "supersededBy"> & {
  aliases: readonly string[];
  externalIdentifiers?: readonly ExternalIdentifier[];
  supersededBy?: readonly string[];
};

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const confidenceRank: Record<IdentityConfidence, number> = {
  ASSERTED: 0, PROBABLE: 1, CORROBORATED: 2, VERIFIED: 3,
};

function nonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} must be non-empty.`);
  return normalized;
}
function iso(value: string, field: string): string {
  if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);
  return value;
}
function refs(values: readonly string[], field: string): readonly string[] {
  const normalized = values.map((value) => nonEmpty(value, field));
  if (!normalized.length) throw new Error(`${field} must contain at least one reference.`);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`);
  return Object.freeze([...normalized]);
}
export function normalizeIdentityToken(value: string): string {
  return nonEmpty(value, "identity token").normalize("NFKC").toUpperCase()
    .replace(/\bSTREET\b/g, "ST").replace(/\bROAD\b/g, "RD").replace(/\bAVENUE\b/g, "AVE")
    .replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function externalKey(identifier: ExternalIdentifier): string {
  return `${normalizeIdentityToken(identifier.namespace)}::${normalizeIdentityToken(identifier.value)}`;
}
function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

export function createCanonicalIdentity(input: CreateCanonicalIdentityInput): CanonicalIdentityRecord {
  const canonicalIdentityId = nonEmpty(input.canonicalIdentityId, "canonicalIdentityId");
  if (input.matchScore < 0 || input.matchScore > 1 || !Number.isFinite(input.matchScore)) {
    throw new Error("matchScore must be a finite number between 0 and 1.");
  }
  const aliases = uniqueSorted(input.aliases.map(normalizeIdentityToken)).map((normalizedValue) =>
    Object.freeze({ value: input.aliases.find((value) => normalizeIdentityToken(value) === normalizedValue)!.trim(), normalizedValue }));
  if (!aliases.length) throw new Error("aliases must contain at least one identity token.");
  const externalIdentifiers = (input.externalIdentifiers ?? []).map((identifier) => Object.freeze({
    namespace: nonEmpty(identifier.namespace, "externalIdentifiers.namespace"),
    value: nonEmpty(identifier.value, "externalIdentifiers.value"),
  }));
  if (new Set(externalIdentifiers.map(externalKey)).size !== externalIdentifiers.length) {
    throw new Error("externalIdentifiers must not contain duplicates.");
  }
  return Object.freeze({
    canonicalIdentityId, domain: input.domain, schemaVersion: CANONICAL_IDENTITY_SCHEMA_VERSION,
    governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"), status: input.status,
    aliases: Object.freeze(aliases), externalIdentifiers: Object.freeze(externalIdentifiers),
    confidence: input.confidence, matchScore: input.matchScore,
    provenanceRefs: refs(input.provenanceRefs, "provenanceRefs"), auditRefs: refs(input.auditRefs, "auditRefs"),
    replayRef: nonEmpty(input.replayRef, "replayRef"), versionRefs: refs(input.versionRefs, "versionRefs"),
    supersededBy: uniqueSorted(input.supersededBy ?? []), createdAt: iso(input.createdAt, "createdAt"),
    recordedAt: iso(input.recordedAt, "recordedAt"),
  });
}

export function createCanonicalIdentityRegistry(records: readonly CanonicalIdentityRecord[]): CanonicalIdentityRegistry {
  const byId: Record<string, CanonicalIdentityRecord> = {};
  const aliasIndex: Record<string, string[]> = {};
  const externalIdentifierIndex: Record<string, string[]> = {};
  for (const record of [...records].sort((a, b) => a.canonicalIdentityId.localeCompare(b.canonicalIdentityId))) {
    validateCanonicalIdentity(record);
    if (byId[record.canonicalIdentityId]) throw new Error(`Duplicate canonical identity: ${record.canonicalIdentityId}`);
    byId[record.canonicalIdentityId] = record;
    for (const alias of record.aliases) (aliasIndex[alias.normalizedValue] ??= []).push(record.canonicalIdentityId);
    for (const identifier of record.externalIdentifiers) (externalIdentifierIndex[externalKey(identifier)] ??= []).push(record.canonicalIdentityId);
  }
  const freezeIndex = (index: Record<string, string[]>) => Object.freeze(Object.fromEntries(
    Object.entries(index).sort(([a], [b]) => a.localeCompare(b)).map(([key, ids]) => [key, uniqueSorted(ids)])));
  return Object.freeze({ records: Object.freeze(byId), aliasIndex: freezeIndex(aliasIndex), externalIdentifierIndex: freezeIndex(externalIdentifierIndex) });
}

export function resolveCanonicalIdentity(registry: CanonicalIdentityRegistry, query: {
  domain: CanonicalDomainKey; aliases?: readonly string[]; externalIdentifiers?: readonly ExternalIdentifier[];
}): Readonly<{ canonicalIdentityId: string | null; candidates: readonly Readonly<{ canonicalIdentityId: string; score: number }>[] }> {
  const scores = new Map<string, number>();
  for (const alias of query.aliases ?? []) for (const id of registry.aliasIndex[normalizeIdentityToken(alias)] ?? []) scores.set(id, (scores.get(id) ?? 0) + 1);
  for (const identifier of query.externalIdentifiers ?? []) for (const id of registry.externalIdentifierIndex[externalKey(identifier)] ?? []) scores.set(id, (scores.get(id) ?? 0) + 4);
  const denominator = Math.max(1, (query.aliases?.length ?? 0) + 4 * (query.externalIdentifiers?.length ?? 0));
  const candidates = [...scores.entries()].filter(([id]) => registry.records[id]?.domain === query.domain && registry.records[id]?.status === "ACTIVE")
    .map(([canonicalIdentityId, score]) => Object.freeze({ canonicalIdentityId, score: score / denominator }))
    .sort((a, b) => b.score - a.score || a.canonicalIdentityId.localeCompare(b.canonicalIdentityId));
  const winner = candidates[0];
  const uniqueWinner = winner && (!candidates[1] || winner.score > candidates[1].score);
  return Object.freeze({ canonicalIdentityId: uniqueWinner ? winner.canonicalIdentityId : null, candidates: Object.freeze(candidates) });
}

export function mergeCanonicalIdentities(records: readonly CanonicalIdentityRecord[], targetId: string, sourceIds: readonly string[], recordedAt: string): readonly CanonicalIdentityRecord[] {
  const target = records.find((record) => record.canonicalIdentityId === targetId);
  if (!target) throw new Error("Merge target does not exist.");
  const sourceSet = new Set(sourceIds);
  if (!sourceSet.size || sourceSet.has(targetId)) throw new Error("Merge sources must be non-empty and exclude the target.");
  const sources = records.filter((record) => sourceSet.has(record.canonicalIdentityId));
  if (sources.length !== sourceSet.size || sources.some((record) => record.domain !== target.domain)) throw new Error("Merge sources must exist in the target domain.");
  const mergedTarget = createCanonicalIdentity({ ...target,
    aliases: uniqueSorted([...target.aliases.map((a) => a.value), ...sources.flatMap((r) => r.aliases.map((a) => a.value))]),
    externalIdentifiers: [...target.externalIdentifiers, ...sources.flatMap((r) => r.externalIdentifiers)].filter((item, index, all) => all.findIndex((candidate) => externalKey(candidate) === externalKey(item)) === index),
    confidence: sources.reduce((best, record) => confidenceRank[record.confidence] > confidenceRank[best] ? record.confidence : best, target.confidence),
    matchScore: Math.max(target.matchScore, ...sources.map((r) => r.matchScore)), recordedAt,
    provenanceRefs: uniqueSorted([...target.provenanceRefs, ...sources.flatMap((r) => r.provenanceRefs)]),
    auditRefs: uniqueSorted([...target.auditRefs, ...sources.flatMap((r) => r.auditRefs)]),
    versionRefs: uniqueSorted([...target.versionRefs, ...sources.flatMap((r) => r.versionRefs)]),
  });
  return Object.freeze(records.map((record) => record.canonicalIdentityId === targetId ? mergedTarget : sourceSet.has(record.canonicalIdentityId)
    ? createCanonicalIdentity({ ...record, aliases: record.aliases.map((a) => a.value), status: "MERGED", supersededBy: [targetId], recordedAt }) : record));
}

export function validateCanonicalIdentity(record: CanonicalIdentityRecord): void {
  if (record.schemaVersion !== CANONICAL_IDENTITY_SCHEMA_VERSION) throw new Error("Unsupported canonical identity schema.");
  createCanonicalIdentity({ ...record, aliases: record.aliases.map((alias) => alias.value), externalIdentifiers: record.externalIdentifiers, supersededBy: record.supersededBy });
  if ((record.status === "MERGED" || record.status === "SPLIT") && !record.supersededBy.length) throw new Error("Merged or split identities must declare supersededBy targets.");
}

export const canonicalIdentityAuthority = Object.freeze({ create: createCanonicalIdentity, validate: validateCanonicalIdentity, createRegistry: createCanonicalIdentityRegistry, resolve: resolveCanonicalIdentity, merge: mergeCanonicalIdentities, normalize: normalizeIdentityToken });
