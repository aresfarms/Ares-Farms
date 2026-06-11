/**
 * decideSource — CLI operator decision for a property/equipment source.
 *
 * The same governed action as the internal Source Review screen's Approve/Reject
 * button (recordSourceDecision → runtime activation overlay + audit ledger), for
 * use when the browser login is unavailable locally (no DB for NextAuth). A REAL
 * human operator runs this; the build never self-approves.
 *
 *   npm run source:decide -- --source=usda --decision=APPROVE --by="Caitlin" --reason="CC0 public domain; vintage labeled."
 *   npm run source:decide -- --source=hud  --decision=APPROVE --by=chudson@aresfarmsinc.com --reason="..."
 *   npm run source:decide -- --source=usda --decision=HOLD    --by=Stuart --reason="need second look"
 *
 * The --by operator MUST hold Module 45 'approve:source-legal' authority
 * (operatorRegistry); otherwise the decision is refused. Every decision is
 * attributed in the audit ledger.
 */

import { OPERATORS, operatorByEmail, canApproveSourceLegal } from "../lib/auth/operatorRegistry";
import { SOURCE_ACTIVATION } from "../lib/property/sourceActivation";
import { getRuntimeActivation, recordSourceDecision, type ReviewDecision } from "../lib/property/sourceActivationStore";
import { readAuditEvents } from "../lib/property/auditLedger";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function resolveOperator(by: string) {
  const v = by.trim().toLowerCase();
  return (
    operatorByEmail(by) ??
    OPERATORS.find((o) => o.name.toLowerCase() === v || o.id.toLowerCase() === v) ??
    null
  );
}

function main(): void {
  const source = (arg("source") ?? "").toLowerCase();
  const decision = (arg("decision") ?? "").toUpperCase() as ReviewDecision;
  const by = arg("by") ?? "";
  const reason = arg("reason") ?? "";

  const fail = (m: string) => { console.error(`✗ ${m}`); process.exit(1); };

  if (!SOURCE_ACTIVATION[source]) fail(`Unknown --source "${source}". Known: ${Object.keys(SOURCE_ACTIVATION).join(", ")}`);
  if (!["APPROVE", "REJECT", "HOLD"].includes(decision)) fail(`--decision must be APPROVE | REJECT | HOLD (got "${decision}")`);
  if (!by) fail("--by is required (operator name, id, or email)");
  if (!reason) fail("--reason is required (recorded in the audit ledger)");

  const op = resolveOperator(by);
  if (!op) fail(`"${by}" is not a known operator. Known: ${OPERATORS.map((o) => `${o.name} <${o.email}>`).join(", ")}`);
  if (!canApproveSourceLegal(op!.email)) fail(`${op!.name} does not hold Module 45 approve:source-legal authority.`);

  const result = recordSourceDecision({ sourceId: source, decision, reviewerId: op!.id, reviewerName: op!.name, reason });
  const last = readAuditEvents({ domain: "source-review", subject: source }).at(-1);

  console.log(`\n✓ ${decision} recorded for "${source}" by ${op!.name} (${op!.role}).`);
  console.log(`  Module 23: ${result.module23} · Module 22: ${result.module22} · SOURCE_LIVE: ${result.sourceLive}`);
  console.log(`  Audit ledger: ${last?.ts} · ${last?.decision} · "${last?.reason}"`);
  console.log(
    result.sourceLive
      ? `\n  ${getRuntimeActivation(source)?.sourceName} is now LIVE — listings appear in /explore?lane=property-land (and the map). Re-render the homepage to refresh the map "Possible" cards.\n`
      : `\n  ${getRuntimeActivation(source)?.sourceName} remains blocked.\n`,
  );
}

main();
