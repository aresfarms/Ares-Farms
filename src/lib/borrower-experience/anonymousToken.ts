/**
 * Anonymous token — borrower-experience unit's OWN store (SERVER-ONLY).
 *
 * The "take it with you" upgrade from the ephemeral in-session Save. ANONYMOUS
 * BY DESIGN:
 *   - minting requires ZERO real-identity PII — no email, no name. The visitor
 *     gets a generated token/passphrase they keep. The token is the only handle.
 *   - we store ONLY the token's SHA-256 hash, never the plaintext — so we
 *     genuinely cannot recover it, and cannot identify the visitor.
 *   - optional contact (to return / for matching) is OPTIONAL, minimal, and only
 *     stored if the visitor explicitly provides it — never required to mint.
 *
 * DIVEST-001: this data lives in the borrower-experience unit's own store
 * (data/borrower-experience/tokens.json), reached only by this unit's code — not
 * core, not a shared table. The import-graph gate guards src/lib/borrower-
 * experience/ as borrower-experience.
 *
 * Every action is logged to the CORE audit ledger by tokenId only (never a
 * person). The five data rights are wired; delete TRULY purges (no account
 * elsewhere holds a copy).
 *
 * Saved items are persisted OPAQUELY (no import of another unit's types) — the
 * unit holds whatever public property snapshot the visitor chose to keep.
 */

import { createHash, randomBytes } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { appendLedgerEvent } from "@/lib/audit/appendLedger";

const STORE_DIR = path.join(process.cwd(), "data", "borrower-experience");
const STORE_PATH = path.join(STORE_DIR, "tokens.json");
const LEDGER_DOMAIN = "anonymous-token";

/** Opaque public-property snapshot (the unit doesn't need another unit's type). */
export type StoredSnapshot = Record<string, unknown>;

export interface TokenRecord {
  /** Short public handle for logging — derived from the hash, identifies NO person. */
  tokenId: string;
  /** SHA-256 of the plaintext token. The plaintext is NEVER stored. */
  tokenHash: string;
  createdAt: string;
  /** The visitor's saved properties (public listing snapshots). */
  saved: StoredSnapshot[];
  /** Optional, consented, minimal — null unless the visitor explicitly added it. */
  contact: string | null;
  /** Append-only log of data-rights actions on this token (anonymous). */
  rightsLog: Array<{ ts: string; right: string }>;
}

/** The five data rights, surfaced so the UX can explain them. */
export const DATA_RIGHTS = [
  { id: "explain", label: "Explain", note: "See exactly what is stored under your token." },
  { id: "export", label: "Export", note: "Download everything stored under your token." },
  { id: "human-review", label: "Human review", note: "Ask a person to review anything under your token." },
  { id: "hold", label: "Hold", note: "Pause any processing of your token's data." },
  { id: "delete", label: "Delete", note: "Permanently purge your token's data — truly gone." },
] as const;

function sha(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function readAll(): TokenRecord[] {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as TokenRecord[];
  } catch {
    return [];
  }
}

function writeAll(rows: TokenRecord[]): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(rows, null, 2), "utf8");
}

function log(tokenId: string, decision: string, reason: string): void {
  // tokenId only — NEVER a person. actorId is the token; there is no human name.
  appendLedgerEvent({
    actorId: `anon:${tokenId}`,
    actorName: "anonymous-token",
    domain: LEDGER_DOMAIN,
    subject: tokenId,
    decision,
    reason,
  });
}

/** Generate a human-keepable token: furlong-XXXX-XXXX-XXXX (base32, no PII). */
function generateToken(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no ambiguous chars
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 11) out += "-";
  }
  return `furlong-${out.toLowerCase()}`;
}

/**
 * Mint a new anonymous token. NO PII required. Returns the PLAINTEXT token ONCE
 * (the caller shows it to the visitor; we never store or recover it).
 */
export function mintToken(input?: { saved?: StoredSnapshot[]; contact?: string | null }): {
  token: string;
  tokenId: string;
} {
  const token = generateToken();
  const tokenHash = sha(token);
  const tokenId = tokenHash.slice(0, 16);
  const record: TokenRecord = {
    tokenId,
    tokenHash,
    createdAt: new Date().toISOString(),
    saved: input?.saved ?? [],
    contact: input?.contact?.trim() ? input.contact.trim() : null, // optional, consented
    rightsLog: [],
  };
  const rows = readAll();
  rows.push(record);
  writeAll(rows);
  log(tokenId, "MINT", input?.contact ? "minted with optional contact" : "minted with zero PII");
  return { token, tokenId };
}

function findByToken(token: string): { rows: TokenRecord[]; idx: number; tokenId: string } {
  const tokenHash = sha(token);
  const rows = readAll();
  const idx = rows.findIndex((r) => r.tokenHash === tokenHash);
  return { rows, idx, tokenId: tokenHash.slice(0, 16) };
}

/** Return-by-token. Null if unknown (lost token = genuinely gone). */
export function getByToken(token: string): TokenRecord | null {
  const { rows, idx, tokenId } = findByToken(token);
  if (idx < 0) return null;
  log(tokenId, "RETURN", "returned by token");
  return rows[idx];
}

/** Persist the visitor's saved set + optional consented contact. */
export function updateToken(token: string, patch: { saved?: StoredSnapshot[]; contact?: string | null }): TokenRecord | null {
  const { rows, idx, tokenId } = findByToken(token);
  if (idx < 0) return null;
  if (patch.saved) rows[idx].saved = patch.saved;
  if (patch.contact !== undefined) rows[idx].contact = patch.contact?.trim() ? patch.contact.trim() : null;
  writeAll(rows);
  log(tokenId, "UPDATE", "saved set updated");
  return rows[idx];
}

/** Data right: EXPORT — return everything stored under the token. */
export function exportToken(token: string): TokenRecord | null {
  const { rows, idx, tokenId } = findByToken(token);
  if (idx < 0) return null;
  rows[idx].rightsLog.push({ ts: new Date().toISOString(), right: "export" });
  writeAll(rows);
  log(tokenId, "EXPORT", "data-rights export");
  return rows[idx];
}

/** Data right: HOLD / HUMAN-REVIEW — recorded request (no processing here). */
export function requestRight(token: string, right: "hold" | "human-review"): boolean {
  const { rows, idx, tokenId } = findByToken(token);
  if (idx < 0) return false;
  rows[idx].rightsLog.push({ ts: new Date().toISOString(), right });
  writeAll(rows);
  log(tokenId, right.toUpperCase(), `data-rights ${right} requested`);
  return true;
}

/**
 * Data right: DELETE — TRUE purge. The record is removed entirely; there is no
 * account or shared table elsewhere holding a copy. Returns true if purged.
 */
export function deleteToken(token: string): boolean {
  const { rows, idx, tokenId } = findByToken(token);
  if (idx < 0) return false;
  rows.splice(idx, 1);
  writeAll(rows);
  log(tokenId, "DELETE", "data-rights delete — purged");
  return true;
}

/** Count of stored tokens — for verification only (no token contents). */
export function tokenCount(): number {
  return readAll().length;
}
