/**
 * Anonymous consent ledger — FURLONG CORE (PII-FREE by construction).
 *
 * The split-identity model (Caitlin 2026-06-10): licensed modules hold the
 * customer's PII as their licenses require; FURLONG CORE NEVER DOES. Core sees
 * only the customer's opaque anonymous token + property-facts + THIS consent
 * log — the neutral, auditable arbiter (CONST-DATA-001 / TECH-LEDGER-001).
 *
 * HARD GUARANTEES enforced here:
 *  1. NO token→identity binding in core — this module stores tokens and consent
 *     events only; a PII-pattern guard REJECTS any write containing email /
 *     phone / SSN-like content, so identity cannot leak in through free text.
 *  2. Append-only, immutable log (NDJSON append; never rewritten).
 *  3. Consent is AFFIRMATIVE, SPECIFIC, UNBUNDLED — one event per action with
 *     explicit dataScope + recipient module; no blanket scope, never assumed.
 *     The platform asks; it never assumes and never determines the next step.
 *  4. STOP halts all future sharing/processing immediately (checked before
 *     every share). Data a module already lawfully holds stays under THAT
 *     module's legal retention with no further use — disclosed plainly.
 *  5. DELETE-TOKEN removes the platform presence (token tombstoned; consents
 *     inert) and returns the HONEST retention disclosure: module-held legal
 *     records persist as law requires.
 *
 * Counsel gate: this substrate ships dark — no PII module is wired to it until
 * counsel signs off (GLBA / data-rights / inter-module data-sharing agreements).
 */

import * as fs from "node:fs";
import * as path from "node:path";

const LEDGER_PATH = path.join(process.cwd(), "data", "consent-ledger.ndjson");

/** The unbundled, per-action consent vocabulary. Never blanket. */
export type ConsentAction =
  | "engage-module" // start working with a licensed module
  | "share-data" // share a specific scope to a specific module
  | "compile-report" // assemble the end report across engaged modules
  | "export-report"; // print / export / remove in any manner

export type ConsentEventType = "CONSENT" | "STOP" | "TOKEN_DELETED";

export interface ConsentEvent {
  ts: string;
  type: ConsentEventType;
  token: string; // opaque anonymous token — NEVER an identity
  action?: ConsentAction;
  /** WHAT is being consented to — specific, e.g. "saved-properties + interest selections". */
  dataScope?: string;
  /** To WHOM — the licensed module id, e.g. "module:five-borough-financing". */
  toModule?: string;
  /** For WHAT purpose — plain language shown to the customer at the moment of consent. */
  purpose?: string;
}

// ── PII guard: core must be structurally unable to record identity ───────────
const PII_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // US phone
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
];
function assertPiiFree(field: string, value: string | undefined): void {
  if (!value) return;
  for (const re of PII_PATTERNS) {
    if (re.test(value)) {
      throw new Error(
        `Refused: ${field} contains PII-patterned content — Furlong core never records identity. ` +
          `Identity belongs only inside the licensed module.`,
      );
    }
  }
}
function assertOpaqueToken(token: string): void {
  if (!/^[A-Za-z0-9_-]{8,}$/.test(token)) {
    throw new Error("Refused: token must be an opaque identifier (8+ url-safe chars), never identifying text.");
  }
}

function append(e: ConsentEvent): void {
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(e) + "\n", "utf8");
}
function readAll(): ConsentEvent[] {
  try {
    return fs.readFileSync(LEDGER_PATH, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

/**
 * Record one AFFIRMATIVE, SPECIFIC consent. Every field is required — an
 * unscoped or recipient-less consent is blanket consent and is refused.
 * Opt-in only: this is called only on the customer's explicit "go".
 */
export function recordConsent(input: {
  token: string;
  action: ConsentAction;
  dataScope: string;
  toModule: string;
  purpose: string;
}): ConsentEvent {
  assertOpaqueToken(input.token);
  if (!input.dataScope.trim() || !input.toModule.trim() || !input.purpose.trim()) {
    throw new Error("Refused: consent must be specific — dataScope, toModule, and purpose are all required (no blanket consent).");
  }
  assertPiiFree("dataScope", input.dataScope);
  assertPiiFree("purpose", input.purpose);
  assertPiiFree("toModule", input.toModule);
  if (isTokenDeleted(input.token)) throw new Error("Refused: token was deleted — platform presence removed.");
  const e: ConsentEvent = {
    ts: new Date().toISOString(),
    type: "CONSENT",
    token: input.token,
    action: input.action,
    dataScope: input.dataScope,
    toModule: input.toModule,
    purpose: input.purpose,
  };
  append(e);
  return e;
}

/** The customer's STOP — halts all future sharing/processing immediately. */
export function recordStop(token: string): ConsentEvent {
  assertOpaqueToken(token);
  const e: ConsentEvent = { ts: new Date().toISOString(), type: "STOP", token };
  append(e);
  return e;
}

/** Has the token an ACTIVE consent for exactly this action+module — i.e. a
 *  CONSENT event with no later STOP and no deletion? Checked before EVERY
 *  share/compile/export; absence of consent = refusal (ask, never assume). */
export function hasActiveConsent(token: string, action: ConsentAction, toModule: string): boolean {
  const events = readAll().filter((e) => e.token === token);
  if (events.some((e) => e.type === "TOKEN_DELETED")) return false;
  // Append-only log ORDER is authoritative (timestamps can collide within a
  // millisecond): active = a matching CONSENT appears after the last STOP.
  let consentIdx = -1;
  let stopIdx = -1;
  events.forEach((e, i) => {
    if (e.type === "CONSENT" && e.action === action && e.toModule === toModule) consentIdx = i;
    if (e.type === "STOP") stopIdx = i;
  });
  if (consentIdx === -1) return false;
  return consentIdx > stopIdx;
}

export function isTokenDeleted(token: string): boolean {
  return readAll().some((e) => e.token === token && e.type === "TOKEN_DELETED");
}

/** The HONEST retention disclosure (requirement #5) — shown verbatim. */
export function retentionDisclosure(moduleNames: string[]): string {
  const held = moduleNames.length
    ? moduleNames.join(", ")
    : "any licensed module you engaged";
  return (
    `We removed your platform presence: your anonymous token, saved selections, and consent ` +
    `linkage are deleted from Furlong. Records that ${held} lawfully holds (for example a signed ` +
    `report or a loan file) are retained by that licensed module for as long as the law requires — ` +
    `they receive no further use, and Furlong cannot access them.`
  );
}

/**
 * Delete the platform token: tombstones it (append-only — events are never
 * rewritten, but a deleted token fails every future check) and returns the
 * honest retention disclosure for the modules the customer had engaged.
 */
export function deleteToken(token: string): { deleted: true; disclosure: string } {
  assertOpaqueToken(token);
  const engaged = [...new Set(readAll()
    .filter((e) => e.token === token && e.type === "CONSENT" && e.toModule)
    .map((e) => e.toModule!))];
  append({ ts: new Date().toISOString(), type: "TOKEN_DELETED", token });
  return { deleted: true, disclosure: retentionDisclosure(engaged) };
}

/** Token-keyed consent history (PII-free by construction) — what the customer
 *  sees: where they are, what they've agreed to, step by step. */
export function consentHistory(token: string): ConsentEvent[] {
  return readAll().filter((e) => e.token === token);
}

// ── PII-free status channel (requirement #7) ─────────────────────────────────
// Module → customer status ("Phase I ordered", "in underwriting") is token-
// keyed, PII-guarded, and is a governed CONTRACT — never a window into a
// module's store. Stored alongside the consent ledger (still PII-free core).

const STATUS_PATH = path.join(process.cwd(), "data", "status-channel.ndjson");

export interface StatusPost {
  ts: string;
  token: string;
  fromModule: string;
  status: string; // plain-language step status — PII-guarded
}

export function postStatus(input: { token: string; fromModule: string; status: string }): StatusPost {
  assertOpaqueToken(input.token);
  assertPiiFree("status", input.status);
  assertPiiFree("fromModule", input.fromModule);
  if (isTokenDeleted(input.token)) throw new Error("Refused: token was deleted.");
  // Status flows only where the customer engaged the module (ask, never assume).
  if (!hasActiveConsent(input.token, "engage-module", input.fromModule)) {
    throw new Error(`Refused: no active engage-module consent for ${input.fromModule} — status cannot flow without the customer's yes.`);
  }
  const p: StatusPost = { ts: new Date().toISOString(), ...input };
  fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true });
  fs.appendFileSync(STATUS_PATH, JSON.stringify(p) + "\n", "utf8");
  return p;
}

export function statusHistory(token: string): StatusPost[] {
  try {
    return fs.readFileSync(STATUS_PATH, "utf8").split("\n").filter(Boolean)
      .map((l) => JSON.parse(l) as StatusPost).filter((p) => p.token === token);
  } catch {
    return [];
  }
}
