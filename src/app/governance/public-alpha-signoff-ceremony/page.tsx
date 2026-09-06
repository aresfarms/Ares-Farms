import { composePublicAlphaSignoffCeremonyPacket } from "@/lib/governance/publicAlphaSignoffCeremonyPacket";

export const dynamic = "force-dynamic";

export default function PublicAlphaSignoffCeremonyPage() {
  const packet = composePublicAlphaSignoffCeremonyPacket();
  const passed = packet.entryConditions.filter((x) => x.status === "PASS");
  const external = packet.entryConditions.filter((x) => x.status === "EXTERNAL_EVIDENCE_REQUIRED");
  return (
    <main style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gap: 18 }}>
      <header style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 20 }}>
        <h1>Public Alpha Sign-Off Ceremony Packet</h1>
        <p>Founder review packet only. No vote is recorded here, and production remains blocked.</p>
        <p><b>{packet.ceremonyStatus}</b> · quorum {packet.quorumRule} · votes recorded {packet.reviewDecisionCount}</p>
      </header>
      <section style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 20 }}>
        <h2>Readiness boundary</h2>
        <p>Engineering: <b>{packet.engineeringStatus}</b></p>
        <p>Public Alpha: <b>{packet.publicAlphaStatus}</b></p>
        <p>Production: <b>{packet.productionStatus}</b></p>
      </section>
      <section style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 20 }}>
        <h2>§9 founder decisions</h2>
        {packet.decisions.map((decision) => (
          <article key={decision.decisionId} style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}>
            <b>{decision.label}</b><br />
            {decision.doctrineProposal ? <>Doctrine proposal: {decision.doctrineProposal}<br /></> : null}
            Status: {decision.status}
          </article>
        ))}
      </section>
      <section style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 20 }}>
        <h2>Entry conditions</h2>
        <p>{passed.length} machine-verifiable conditions pass. {external.length} require external evidence.</p>
        {packet.entryConditions.map((condition) => (
          <div key={condition.conditionId} style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}>
            <b>{condition.status}</b> · {condition.label}
          </div>
        ))}
      </section>
      <section style={{ border: "1px solid #d7deea", borderRadius: 12, padding: 20 }}>
        <h2>Frozen evidence snapshot</h2>
        <code style={{ overflowWrap: "anywhere" }}>{packet.evidenceSnapshotHash}</code>
      </section>
    </main>
  );
}
