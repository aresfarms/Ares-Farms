/**
 * Local operator identity store — SERVER-ONLY, local-development bootstrap.
 *
 * Bootstrap step after adding the auth gate: provision the first operator
 * accounts when no production database is available locally. This is a real,
 * provisioned ACCOUNT store (id/email/name/role) — it holds NO credential. The
 * credential remains the governed email-allowlist + shared secret in .env.local
 * (evaluateCredentialAuthPolicy). The gate is unchanged: a request still must
 * pass the credential policy AND be a provisioned operator to get a session.
 *
 * Accounts are written by `npm run operators:seed` (which also logs each
 * creation to the audit ledger). The store file (data/operators.json) is
 * git-ignored. NEVER used in production — the NextAuth route only consults this
 * store when the durable (DB) identity is unavailable AND NODE_ENV !== production.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { OPERATORS } from "./operatorRegistry";

const STORE_PATH = path.join(process.cwd(), "data", "operators.json");

export interface LocalOperatorAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  provisionedAt: string;
  provisionedBy: string;
}

export function readLocalOperators(): LocalOperatorAccount[] {
  try { return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")); } catch { return []; }
}

export function findLocalOperator(email: string | null | undefined): LocalOperatorAccount | null {
  const e = (email ?? "").trim().toLowerCase();
  return readLocalOperators().find((o) => o.email.toLowerCase() === e) ?? null;
}

/**
 * Seed the allowlisted operators into the local store. Returns the accounts
 * created/refreshed. Credentials are NOT stored here. Caller logs the audit
 * ledger entries (the seed script does).
 */
export function seedLocalOperators(provisionedBy: string): LocalOperatorAccount[] {
  const now = new Date().toISOString();
  const accounts: LocalOperatorAccount[] = OPERATORS.map((o) => ({
    id: o.id,
    email: o.email,
    name: o.name,
    role: o.role,
    tenantId: "furlong-local",
    provisionedAt: now,
    provisionedBy,
  }));
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(accounts, null, 2) + "\n", "utf8");
  return accounts;
}
