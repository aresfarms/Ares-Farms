import { existsSync, readFileSync } from "node:fs";

/**
 * Classification Change Registry parser (Build 42 follow-up)
 *
 * Per VIA-GOVERNANCE-CLASSIFICATION-001: every classification change
 * (tier or severity) that affects verification outcomes, gate
 * behavior, audit reporting, or operational status is recorded in
 * `docs/CLASSIFICATION_CHANGE_REGISTRY.md`, and `build:self-report`
 * shall emit the active entries on every run so the changes are
 * visible in the canonical audit output.
 *
 * The human-readable registry carries prose per CCR. Prose is not a
 * deterministic parse target — the field-header formatting varies
 * between entries. So each CCR additionally carries a machine-readable
 * `<!-- ccr:meta ... -->` block: one `key: value` line per field. The
 * meta block is the canonical parse target; the prose is the human
 * narrative. The two must agree, but only the meta block is parsed.
 *
 * Design rules:
 * - Fail closed. A registry that cannot be parsed → ok:false. The
 *   caller (build-self-report runtime) turns ok:false into exit 1.
 * - An ACTIVE entry missing any required field → parse failure. An
 *   active classification change with an incomplete record is not a
 *   record at all.
 * - status ∈ { ACTIVE, RESOLVED, VOIDED }. Unknown status → failure.
 * - Resolved/voided entries are emitted separately as historical
 *   entries and do NOT count as active.
 * - An empty registry (no meta blocks) is not a failure — there may
 *   simply be no active classification changes.
 * - Deterministic. Same markdown → identical parse.
 */

export const CLASSIFICATION_CHANGE_REGISTRY_RUNTIME_VERSION =
  "classification-change-registry-runtime-v0.1.0";

export const CLASSIFICATION_CHANGE_REGISTRY_DOC_REF =
  "docs/CLASSIFICATION_CHANGE_REGISTRY.md";

export type CcrStatus = "ACTIVE" | "RESOLVED" | "VOIDED";

const CCR_STATUS_VALUES: readonly CcrStatus[] = [
  "ACTIVE",
  "RESOLVED",
  "VOIDED",
];

export type ClassificationChangeEntry = {
  id: string;
  title: string;
  status: CcrStatus;
  previousState: string;
  newState: string;
  reason: string;
  approver: string;
  effectiveDate: string;
  resolutionCriteria: string;
};

/**
 * The fields every ACTIVE entry must carry. Order is the canonical
 * render order (also used in the markdown "Active Classification
 * Changes" section).
 */
export const REQUIRED_CCR_FIELDS: readonly (keyof ClassificationChangeEntry)[] =
  [
    "id",
    "title",
    "status",
    "previousState",
    "newState",
    "reason",
    "approver",
    "effectiveDate",
    "resolutionCriteria",
  ];

export type ClassificationChangeRegistryParseResult = {
  ok: boolean;
  runtimeVersion: string;
  docRef: string;
  error: string | null;
  allEntries: ClassificationChangeEntry[];
  activeEntries: ClassificationChangeEntry[];
  historicalEntries: ClassificationChangeEntry[];
  activeCount: number;
  historicalCount: number;
  failedBlockIndex: number | null;
  failedId: string | null;
};

// The opening delimiter must begin a line (optionally indented). This
// keeps an inline prose mention of the `ccr:meta` token — e.g. in the
// registry's own how-to note — from being parsed as a real block.
const META_BLOCK_RE = /^[ \t]*<!--[ \t]*ccr:meta\b([\s\S]*?)-->/gm;
const META_LINE_RE = /^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/;

function fail(
  error: string,
  extra?: { failedBlockIndex?: number; failedId?: string }
): ClassificationChangeRegistryParseResult {
  return {
    ok: false,
    runtimeVersion: CLASSIFICATION_CHANGE_REGISTRY_RUNTIME_VERSION,
    docRef: CLASSIFICATION_CHANGE_REGISTRY_DOC_REF,
    error,
    allEntries: [],
    activeEntries: [],
    historicalEntries: [],
    activeCount: 0,
    historicalCount: 0,
    failedBlockIndex: extra?.failedBlockIndex ?? null,
    failedId: extra?.failedId ?? null,
  };
}

/**
 * Parse the registry markdown. Pure — operates on a string so the
 * smoke test can inject malformed / empty fixtures without touching
 * the filesystem.
 */
export function parseClassificationChangeRegistry(
  markdown: string
): ClassificationChangeRegistryParseResult {
  const allEntries: ClassificationChangeEntry[] = [];
  const seenIds = new Set<string>();

  let match: RegExpExecArray | null;
  let blockIndex = -1;
  META_BLOCK_RE.lastIndex = 0;
  while ((match = META_BLOCK_RE.exec(markdown)) !== null) {
    blockIndex += 1;
    const body = match[1];
    const fields: Record<string, string> = {};

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (line.length === 0) {
        continue;
      }
      const m = META_LINE_RE.exec(line);
      if (!m) {
        return fail(
          `ccr:meta block #${blockIndex} has a malformed line (expected "key: value"): "${line}"`,
          { failedBlockIndex: blockIndex }
        );
      }
      const key = m[1];
      const value = m[2].trim();
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        return fail(
          `ccr:meta block #${blockIndex} repeats field "${key}"`,
          { failedBlockIndex: blockIndex }
        );
      }
      fields[key] = value;
    }

    // id + status are required to classify any entry at all.
    const id = fields.id ?? "";
    if (id.length === 0) {
      return fail(`ccr:meta block #${blockIndex} is missing required field "id"`, {
        failedBlockIndex: blockIndex,
      });
    }
    if (seenIds.has(id)) {
      return fail(`ccr:meta has a duplicate id "${id}"`, {
        failedBlockIndex: blockIndex,
        failedId: id,
      });
    }
    const statusRaw = fields.status ?? "";
    if (statusRaw.length === 0) {
      return fail(`ccr:meta ${id} is missing required field "status"`, {
        failedBlockIndex: blockIndex,
        failedId: id,
      });
    }
    if (!CCR_STATUS_VALUES.includes(statusRaw as CcrStatus)) {
      return fail(
        `ccr:meta ${id} has invalid status "${statusRaw}" (expected ACTIVE | RESOLVED | VOIDED)`,
        { failedBlockIndex: blockIndex, failedId: id }
      );
    }
    const status = statusRaw as CcrStatus;

    // ACTIVE entries must carry the full required field set — an
    // active classification change with an incomplete record is not a
    // record. Historical (RESOLVED / VOIDED) entries must still carry
    // id + title + status so they render coherently as history.
    const requiredForThis: (keyof ClassificationChangeEntry)[] =
      status === "ACTIVE"
        ? [...REQUIRED_CCR_FIELDS]
        : ["id", "title", "status"];
    for (const field of requiredForThis) {
      const v = fields[field];
      if (v === undefined || v.length === 0) {
        return fail(
          `ccr:meta ${id} (status ${status}) is missing required field "${field}"`,
          { failedBlockIndex: blockIndex, failedId: id }
        );
      }
    }

    seenIds.add(id);
    allEntries.push({
      id,
      title: fields.title ?? "",
      status,
      previousState: fields.previousState ?? "",
      newState: fields.newState ?? "",
      reason: fields.reason ?? "",
      approver: fields.approver ?? "",
      effectiveDate: fields.effectiveDate ?? "",
      resolutionCriteria: fields.resolutionCriteria ?? "",
    });
  }

  const activeEntries = allEntries.filter((e) => e.status === "ACTIVE");
  const historicalEntries = allEntries.filter((e) => e.status !== "ACTIVE");

  return {
    ok: true,
    runtimeVersion: CLASSIFICATION_CHANGE_REGISTRY_RUNTIME_VERSION,
    docRef: CLASSIFICATION_CHANGE_REGISTRY_DOC_REF,
    error: null,
    allEntries,
    activeEntries,
    historicalEntries,
    activeCount: activeEntries.length,
    historicalCount: historicalEntries.length,
    failedBlockIndex: null,
    failedId: null,
  };
}

/**
 * Read + parse the registry from disk. A missing file fails closed —
 * the canonical build always has the registry, so its absence is a
 * setup error, not an empty registry. Read failures fail closed too.
 */
export function loadClassificationChangeRegistry(
  registryPath: string
): ClassificationChangeRegistryParseResult {
  if (!existsSync(registryPath)) {
    return fail(
      `classification change registry not found at ${registryPath}`
    );
  }
  let markdown: string;
  try {
    markdown = readFileSync(registryPath, "utf8");
  } catch (err) {
    return fail(
      `classification change registry could not be read at ${registryPath}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
  return parseClassificationChangeRegistry(markdown);
}
