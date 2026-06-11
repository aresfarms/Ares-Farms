/**
 * seedOperators — bootstrap the local operator accounts (Module 45 operators).
 *
 *   npm run operators:seed                     (provisioned-by defaults to "bootstrap")
 *   npm run operators:seed -- --by="Caitlin"
 *
 * Writes the provisioned accounts to the git-ignored local store and logs each
 * creation to the audit ledger (who · role · when). Stores NO credentials — the
 * credential is the governed email-allowlist + shared secret in .env.local. The
 * gate is unchanged; this only provisions the first operator accounts for local
 * development so they can sign in to the internal review screens.
 */

import { seedLocalOperators } from "../lib/auth/localOperatorStore";
import { appendAuditEvent } from "../lib/property/auditLedger";

function main(): void {
  const by = process.argv.find((a) => a.startsWith("--by="))?.slice(5) || "bootstrap";
  const accounts = seedLocalOperators(by);

  for (const a of accounts) {
    appendAuditEvent({
      actorId: by,
      actorName: by,
      domain: "operator-provisioning",
      subject: a.email,
      decision: "PROVISION_OPERATOR",
      reason: `Provisioned local operator account ${a.name} (${a.role}).`,
      detail: { id: a.id, role: a.role, tenantId: a.tenantId },
    });
  }

  console.log(`\n✓ Provisioned ${accounts.length} local operator account(s) by "${by}":`);
  for (const a of accounts) console.log(`   ${a.name} <${a.email}> · ${a.role}`);
  console.log("\n  Credential (local dev): the email above + AUTH_CREDENTIAL_SHARED_SECRET from .env.local.");
  console.log("  Each provisioning was logged to the audit ledger (data/audit-ledger.ndjson).\n");
}

main();
