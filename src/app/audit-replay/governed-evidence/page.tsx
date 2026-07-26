import { getServerSession } from "next-auth";
import Link from "next/link";
import path from "node:path";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readLedgerEvents } from "@/lib/audit/appendLedger";
import { composeGovernedEvidencePacket } from "@/lib/governance/governedEvidenceReviewPortal";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { verifyLedgerChain } from "@/lib/security/ledgerHashChain";

const allowedRoles = new Set(["auditor", "governance", "admin"]);

export default async function GovernedEvidenceReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as { role?: string } | undefined)?.role ?? "").toLowerCase();
  if (!session?.user || !allowedRoles.has(role)) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
        <h1>Restricted evidence review</h1>
        <p>This passworded screen is limited to provisioned auditor, governance, and administrator accounts.</p>
      </main>
    );
  }

  const query = await searchParams;
  const moduleId = query.module?.trim() || null;
  const ledgerPath = path.join(process.cwd(), "data", "audit-ledger.ndjson");
  const packet = composeGovernedEvidencePacket({
    scope: moduleId ? { kind: "MODULE", moduleId } : { kind: "PLATFORM" },
    modules: moduleManifests,
    events: readLedgerEvents(),
    chainVerification: verifyLedgerChain(ledgerPath),
  });

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px", display: "grid", gap: 18 }}>
      <header style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 20 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>PASSWORD-PROTECTED · AUDITOR / COUNSEL REVIEW</p>
        <h1 style={{ margin: "8px 0" }}>Governed Evidence Review Portal</h1>
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          Standardized evidence packet with SHA-256 integrity posture, rule matching, replay references, and a plain-language event timeline.
        </p>
      </header>

      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
        <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ display: "grid", gap: 5, minWidth: 320 }}>
            <span style={{ fontWeight: 700 }}>Review scope</span>
            <select name="module" defaultValue={moduleId ?? ""} style={{ padding: 10 }}>
              <option value="">Whole platform</option>
              {moduleManifests.slice().sort((a, b) => a.title.localeCompare(b.title)).map((module) => (
                <option key={module.id} value={module.id}>{module.title} ({module.id})</option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: "10px 16px" }}>Build packet</button>
          <Link href="/audit-replay">Return to audit console</Link>
        </form>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {[
          ["Packet", packet.packetId],
          ["Scope", packet.scope.kind === "PLATFORM" ? "Whole platform" : packet.scope.moduleId],
          ["Modules", String(packet.moduleCount)],
          ["Ledger events", String(packet.evidenceEventCount)],
          ["Integrity", packet.integrityConclusion],
          ["Packet SHA-256", packet.packetSha256],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid #d5dbe7", borderRadius: 10, padding: 14, overflowWrap: "anywhere" }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
            <div style={{ marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </section>

      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
        <h2>Rule-matching logic</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {packet.ruleMatches.map((rule) => (
            <article key={rule.ruleId} style={{ borderTop: "1px solid #e4e8ef", paddingTop: 12 }}>
              <strong>{rule.ruleId} · {rule.status}</strong>
              <div>{rule.label}</div>
              <p style={{ marginBottom: 4 }}>{rule.explanation}</p>
              <small>Evidence: {rule.evidenceRefs.join(" · ")}</small>
            </article>
          ))}
        </div>
      </section>

      <section style={{ border: "1px solid #d5dbe7", borderRadius: 12, padding: 18 }}>
        <h2>Plain-language legal record</h2>
        {packet.timeline.length === 0 ? <p>No matching ledger events were found for this scope.</p> : (
          <ol style={{ display: "grid", gap: 12 }}>
            {packet.timeline.map((event) => (
              <li key={`${event.occurredAt}-${event.sourceRef}`}>
                <strong>{event.occurredAt} · {event.action}</strong>
                <div>{event.whatHappened}</div>
                <div><em>Why it matters:</em> {event.whyItMatters}</div>
                <small>{event.sourceRef} · {event.cryptographicCoverage}</small>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ border: "1px solid #e2b8b8", background: "#fff8f8", borderRadius: 12, padding: 18 }}>
        <h2>Integrity limitations and legal boundary</h2>
        {packet.unresolvedIssues.length > 0 ? <ul>{packet.unresolvedIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p>No unresolved packet-integrity issues were detected.</p>}
        <p>{packet.legalBoundary}</p>
      </section>
    </main>
  );
}
