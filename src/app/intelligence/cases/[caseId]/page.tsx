import Link from "next/link";

import { composeIntelligenceCaseWorkspace } from "@/lib/intelligence/intelligenceCaseWorkspaceRuntime";

const panel = { background: "#fff", border: "1px solid #d7deea", borderRadius: 12, padding: 18 } as const;
const muted = { color: "#5d687a", lineHeight: 1.6 } as const;

export default async function IntelligenceCasePage({ params, searchParams }: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const read = (key: string) => typeof query[key] === "string" ? query[key] as string : null;
  const split = (value: string | null) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  const customerTypes = split(read("customerTypes"));
  const intendedUses = split(read("intendedUses"));
  const workspace = composeIntelligenceCaseWorkspace({
    caseId,
    displayName: read("name"),
    goal: read("goal"),
    state: read("state"),
    customerTypes,
    intendedUses,
  });
  const onboardingParams = new URLSearchParams({
    caseId,
    name: workspace.subject.displayName,
    goal: workspace.goal,
    customerTypes: customerTypes.join(","),
    intendedUses: intendedUses.join(","),
  });
  const state = read("state");
  if (state) onboardingParams.set("state", state);

  return <main style={{ minHeight: "100vh", background: "#f6f8fb", color: "#162033", padding: 24 }}>
    <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
      <header style={panel}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: "#0f766e" }}>FURLONG INTELLIGENCE CASE</div>
        <h1 style={{ margin: "8px 0" }}>{workspace.subject.displayName}</h1>
        <p style={muted}>{workspace.goal}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <strong>Recommendation: {workspace.recommendation.state}</strong>
          <span>·</span><span>{workspace.evidence.length} evidence signals</span>
          <span>·</span><span>{workspace.scenarios.length} scenarios</span>
          <span>·</span><span>{workspace.conflictCount} conflicts</span>
        </div>
      </header>

      <section style={{ ...panel, borderLeft: "5px solid #c58b21" }}>
        <h2 style={{ marginTop: 0 }}>Current recommendation posture</h2>
        <p>{workspace.recommendation.recommendationText}</p>
        <p style={muted}>This workspace is advisory only. It does not approve financing, determine eligibility, certify property facts, or execute an external action.</p>
      </section>

      <section><h2>Scenarios</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {workspace.scenarios.map((scenario) => <article key={scenario.scenarioId} style={panel}>
          <h3 style={{ marginTop: 0 }}>{scenario.label}</h3>
          <p style={muted}>{scenario.operatingPosture}</p>
          <div><strong>Compliance:</strong> {scenario.compliancePosture}</div>
          <div><strong>Downside:</strong> {scenario.downsidePosture}</div>
          <div><strong>Unresolved decisions:</strong> {scenario.unresolvedDecisionIds.length}</div>
        </article>)}
      </div></section>

      <section style={panel}>
        <h2 style={{ marginTop: 0 }}>Evidence and conflicts</h2>
        {workspace.evidence.length === 0 ? <p style={muted}>No case-specific evidence has been supplied yet. Add the customer type, intended use, jurisdiction, property, and documents to deepen the case.</p> :
          <ul>{workspace.evidence.slice(0, 24).map((item) => <li key={item.evidenceId}><strong>{item.label}</strong> — {item.state} · {item.sourceAuthority}</li>)}</ul>}
      </section>

      <section style={panel}>
        <h2 style={{ marginTop: 0 }}>Outcome learning</h2>
        <p style={muted}>Status: {workspace.outcome.status}. Outcome capture has not begun. This case will later compare the released recommendation, the human choice, and the actual result.</p>
      </section>

      <footer style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link href={`/onboarding?${onboardingParams.toString()}`}>Enrich this case through onboarding</Link>
        <Link href="/navigator">Return to Navigator</Link>
        <Link href="/governance/advanced-intelligence-v2">Open governed intelligence review</Link>
        <Link href="/reviews">Open human review</Link>
      </footer>
    </div>
  </main>;
}
