/**
 * Program verification engine — property-side ONLY (FINANCING-INTELLIGENCE unit).
 *
 * Input is OPAQUE verified place-facts passed by the property surface over the
 * HTTP contract (no cross-unit import): the surface reads its frozen snapshots
 * (OZ tract, HUBZone designation) server-side and hands the determinations here.
 * The engine renders a program ONLY when ALL of its property-side criteria are
 * machine-verifiable AND verify positive (registry status "property-verifiable"
 * + a positive fact supplied). Not met, uncertain, or dataset-unwired → OMITTED
 * ENTIRELY — never a conditional "may fit if…" (BUILD_FIX_ZONING rule).
 *
 * THE LOCKED LANGUAGE STANDARD (Caitlin-confirmed 2026-06-10) is built here and
 * ONLY here, so every surface renders the same words. The property qualifies ≠
 * you qualify: Furlong is definitive about the property/place side and NEVER
 * asserts person-eligibility — that is a licensed act, off Furlong surfaces.
 *
 * Every verification run appends an audit event to this unit's OWN ledger
 * (data/program-verification-ledger.ndjson — financing-intelligence-owned store;
 * TECH-LEDGER-001: no unrecorded state changes).
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { PROGRAM_REGISTRY, PROGRAM_REGISTRY_VERSION } from "./programRegistry";

const LEDGER_PATH = path.join(process.cwd(), "data", "program-verification-ledger.ndjson");

/** Opaque verified place-facts from the property surface's snapshots. */
export interface VerifiedPlaceFacts {
  propertyId?: string | null; // for the ledger only — never rendered
  ozTractId?: string | null; // 11-digit GEOID when the tract IS designated
  ozAsOf?: string | null;
  nmtcTractId?: string | null;
  nmtcAsOf?: string | null;
  hubzone?: {
    hubzoneType: string;
    geoid: string;
    effective: string;
    expiration: string | null;
    isCurrent: boolean;
  } | null;
  hubzoneAsOf?: string | null;
  historic?: {
    historicName: string | null;
  } | null;
  historicAsOf?: string | null;
}

export interface VerifiedProgramMatch {
  program_id: string;
  name: string;
  administering_body: string;
  /** The locked-standard sentence — render verbatim. */
  verifiedStatement: string;
  /** The rule basis + zone/tract id + as-of (checkable). */
  basis: string;
  /** The locked person-side caveat — render verbatim with every match. */
  personSideCaveat: string;
  source_citation: string;
  asOf: string;
}

export const PERSON_SIDE_CAVEAT =
  "Whether you personally qualify also depends on your circumstances and the agency's " +
  "decision — confirm with your lender, advisor, or the agency before proceeding.";

function lockedStatement(programLabel: string, asOf: string): string {
  return (
    `Verified against current program rules (as of ${asOf}): this property meets the ` +
    `property/location criteria for ${programLabel}.`
  );
}

/**
 * Verify the property-side criteria of every registry program against the
 * supplied facts. Only "property-verifiable" programs with a positive supplied
 * determination produce a match. Appends one ledger event per run.
 */
export function verifyPropertyPrograms(facts: VerifiedPlaceFacts, now: Date = new Date()): VerifiedProgramMatch[] {
  const out: VerifiedProgramMatch[] = [];
  const checked: { program_id: string; result: string }[] = [];

  for (const entry of PROGRAM_REGISTRY) {
    if (entry.status !== "property-verifiable") {
      checked.push({ program_id: entry.program_id, result: "skipped:not-property-verifiable" });
      continue;
    }

    if (entry.program_id === "fed-oz") {
      const tract = (facts.ozTractId ?? "").trim();
      if (/^\d{11}$/.test(tract)) {
        const asOf = facts.ozAsOf ?? now.toISOString().slice(0, 10);
        out.push({
          program_id: entry.program_id,
          name: entry.name,
          administering_body: entry.administering_body,
          verifiedStatement: lockedStatement(`Opportunity Zone tract #${tract}`, asOf),
          basis: `census tract ${tract} is on the designated OZ list (2018 designation, locked through 2028) · as of ${asOf}`,
          personSideCaveat: PERSON_SIDE_CAVEAT,
          source_citation: entry.source_citation,
          asOf,
        });
        checked.push({ program_id: entry.program_id, result: `verified:tract=${tract}` });
      } else {
        checked.push({ program_id: entry.program_id, result: "omitted:no-positive-determination" });
      }
      continue;
    }

    if (entry.program_id === "fed-hubzone") {
      const hz = facts.hubzone;
      // CURRENT designations only — an expired designation never verifies.
      if (hz && hz.isCurrent && hz.geoid) {
        const asOf = facts.hubzoneAsOf ?? hz.effective;
        out.push({
          program_id: entry.program_id,
          name: entry.name,
          administering_body: entry.administering_body,
          verifiedStatement: lockedStatement(`HUBZone (${hz.hubzoneType}) — area ${hz.geoid}`, asOf),
          basis:
            `location is in a designated HUBZone: ${hz.hubzoneType}, area ${hz.geoid}, effective ${hz.effective}` +
            (hz.expiration ? `, designation expires ${hz.expiration} (time-limited)` : "") +
            ` · as of ${asOf} · verify current designation with SBA`,
          personSideCaveat: PERSON_SIDE_CAVEAT,
          source_citation: entry.source_citation,
          asOf,
        });
        checked.push({ program_id: entry.program_id, result: `verified:area=${hz.geoid}` });
      } else {
        checked.push({
          program_id: entry.program_id,
          result: hz && !hz.isCurrent ? "omitted:designation-expired" : "omitted:no-positive-determination",
        });
      }
      continue;
    }

    if (entry.program_id === "fed-nmtc") {
      const tract = (facts.nmtcTractId ?? "").trim();
      if (/^\d{11}$/.test(tract)) {
        const asOf = facts.nmtcAsOf ?? now.toISOString().slice(0, 10);
        out.push({
          program_id: entry.program_id,
          name: entry.name,
          administering_body: entry.administering_body,
          verifiedStatement: lockedStatement(`NMTC-qualified low-income community tract #${tract}`, asOf),
          basis: `census tract ${tract} is qualified in the current NMTC low-income community tract dataset · as of ${asOf}`,
          personSideCaveat: PERSON_SIDE_CAVEAT,
          source_citation: entry.source_citation,
          asOf,
        });
        checked.push({ program_id: entry.program_id, result: `verified:tract=${tract}` });
      } else {
        checked.push({ program_id: entry.program_id, result: "omitted:no-positive-determination" });
      }
      continue;
    }

    if (entry.program_id === "fed-historic") {
      const historic = facts.historic;
      if (historic) {
        const asOf = facts.historicAsOf ?? now.toISOString().slice(0, 10);
        out.push({
          program_id: entry.program_id,
          name: entry.name,
          administering_body: entry.administering_body,
          verifiedStatement: lockedStatement(
            historic.historicName
              ? `National Register area — ${historic.historicName}`
              : "National Register listed area",
            asOf,
          ),
          basis: historic.historicName
            ? `location falls within National Register listed area "${historic.historicName}" · as of ${asOf}`
            : `location falls within a National Register listed area · as of ${asOf}`,
          personSideCaveat: PERSON_SIDE_CAVEAT,
          source_citation: entry.source_citation,
          asOf,
        });
        checked.push({ program_id: entry.program_id, result: "verified:national-register-area" });
      } else {
        checked.push({ program_id: entry.program_id, result: "omitted:no-positive-determination" });
      }
      continue;
    }

    // A property-verifiable program with no wired evaluator: omit (never guess).
    checked.push({ program_id: entry.program_id, result: "omitted:no-evaluator-wired" });
  }

  // TECH-LEDGER-001 — append-only audit event per verification run.
  try {
    fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
    fs.appendFileSync(
      LEDGER_PATH,
      JSON.stringify({
        ts: now.toISOString(),
        domain: "program-verification",
        registryVersion: PROGRAM_REGISTRY_VERSION,
        propertyId: facts.propertyId ?? null,
        checked,
        verified: out.map((m) => m.program_id),
      }) + "\n",
      "utf8",
    );
  } catch {
    /* ledger best-effort in read-only environments; never blocks the response */
  }

  return out;
}

/** Read recent verification-ledger events (for proof/operator review). */
export function readVerificationLedger(limit = 10): unknown[] {
  try {
    return fs
      .readFileSync(LEDGER_PATH, "utf8")
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
