import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  canApproveSourceLegal,
  operatorByEmail,
} from "@/lib/auth/operatorRegistry";
import {
  attestDeterministicReplay,
  listReplayAttestations,
} from "@/lib/property/officialEvidenceReplayExecutor";
import { listEvidenceReplayPackets } from "@/lib/property/officialEvidenceReplayPacketStore";
import {
  decideGovernedRecomputationHandler,
  listGovernedRecomputationHandlerReceipts,
  listGovernedRecomputationHandlers,
} from "@/lib/property/officialEvidenceRecomputationHandlerRegistry";
import type { DownstreamArtifactKind } from "@/lib/property/officialEvidenceDownstreamInvalidation";
import { ensureProductionRecomputationBindings } from "@/lib/property/officialEvidenceProductionRecomputationHandlers";
import { evidenceRecomputationActivationStatus } from "@/lib/property/officialEvidenceRecomputationActivation";
import { bootstrapLiveEvidenceReplayReview } from "@/lib/property/officialEvidenceLiveBootstrap";
import {
  listBatchReplayReceipts,
  runGovernedBatchReplayVerification,
} from "@/lib/property/officialEvidenceBatchReplayVerification";
import {
  createApprovalPacket,
  decideApprovalPacketItem,
  listApprovalPackets,
  listApprovalPacketDecisions,
  approvalCompletionStatus,
} from "@/lib/property/officialEvidenceApprovalPacket";
import {
  listRecomputationActivationReceipts,
  recordRecomputationActivationCeremony,
  recomputationActivationFinalized,
  type CeremonyAction,
} from "@/lib/property/officialEvidenceRecomputationCeremony";
import {
  createFinalCanaryReleasePacket,
  currentFinalCanaryReleasePacket,
  listFinalCanaryReleasePackets,
} from "@/lib/property/officialEvidenceFinalCanaryPacket";
import {
  currentPassedCanaryTranscript,
  listCanaryExecutionTranscripts,
} from "@/lib/property/officialEvidenceCanaryExecutionTranscript";
import {
  listSchedulerReleaseReceipts,
  recordSchedulerRelease,
  schedulerCanaryPassed,
  schedulerReleaseAuthorized,
  schedulerResumePermitted,
} from "@/lib/property/officialEvidenceSchedulerRelease";
import {
  currentReviewHandoffChecklist,
  listReviewHandoffReceipts,
  recordReviewHandoff,
} from "@/lib/property/officialEvidenceReviewHandoff";
import {
  decideSteadyStateIncident,
  listSteadyStateIncidentReceipts,
  openSteadyStateIncidents,
  type SteadyStateIncidentAction,
} from "@/lib/property/officialEvidenceSteadyStateIncident";

async function runReplay(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const kind = String(formData.get("kind")) as DownstreamArtifactKind;
  const artifactId = String(formData.get("artifactId") ?? "");
  const registration = [...listGovernedRecomputationHandlers()]
    .reverse()
    .find((r) => r.kind === kind);
  if (!registration)
    throw new Error("No handler registration exists for this artifact class.");
  attestDeterministicReplay({
    artifactId,
    handlerId: registration.handlerId,
    implementationHash: registration.implementationHash,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function runBatchReplay(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const reason = String(formData.get("reason") ?? "").trim();
  runGovernedBatchReplayVerification({
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function createDecisionPacket(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  createApprovalPacket({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function decidePacketItem(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideApprovalPacketItem({
    packetId: String(formData.get("packetId") ?? ""),
    kind: String(formData.get("kind")) as DownstreamArtifactKind,
    decision: String(formData.get("decision")) as "APPROVE" | "SUSPEND",
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function recordHandoff(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  recordReviewHandoff({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function ceremony(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const action = String(formData.get("action")) as CeremonyAction;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["INITIALIZE", "FINALIZE", "REVOKE"].includes(action))
    throw new Error("Invalid activation ceremony action.");
  recordRecomputationActivationCeremony({
    action,
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function createCanaryPacket(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  createFinalCanaryReleasePacket({
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

async function schedulerRelease(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const action = String(formData.get("action")) as "AUTHORIZE" | "REVOKE";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["AUTHORIZE", "REVOKE"].includes(action))
    throw new Error("Invalid scheduler release action.");
  recordSchedulerRelease({
    action,
    actorId: operator.id,
    actorName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}
async function decide(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  const kind = String(formData.get("kind")) as DownstreamArtifactKind;
  const decision = String(formData.get("decision")) as "APPROVE" | "SUSPEND";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("A review reason is required.");
  decideGovernedRecomputationHandler({
    kind,
    decision,
    reviewerId: operator.id,
    reviewerName: operator.name,
    reason,
  });
  revalidatePath("/internal/evidence-recomputation");
}
import { listPostResumeWatchdogReceipts } from "@/lib/property/officialEvidencePostResumeWatchdog";

async function decideSteadyIncident(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email))
    throw new Error("Module 45 source/legal authority is required.");
  const operator = operatorByEmail(email)!;
  decideSteadyStateIncident({
    incidentId: String(formData.get("incidentId") ?? ""),
    action: String(formData.get("action")) as Exclude<
      SteadyStateIncidentAction,
      "OPEN"
    >,
    actorId: operator.id,
    actorName: operator.name,
    reason: String(formData.get("reason") ?? "").trim(),
  });
  revalidatePath("/internal/evidence-recomputation");
}

export default async function EvidenceRecomputationPage() {
  ensureProductionRecomputationBindings();
  const activation = evidenceRecomputationActivationStatus();
  const session = await getServerSession(authOptions);
  const mayApprove = canApproveSourceLegal(session?.user?.email ?? null);
  const registrations = listGovernedRecomputationHandlers();
  const latest = [...registrations]
    .reverse()
    .filter((r, i, a) => a.findIndex((x) => x.kind === r.kind) === i);
  const packets = listEvidenceReplayPackets().slice().reverse();
  const attestations = listReplayAttestations().slice().reverse();
  const batchReplayReceipts = listBatchReplayReceipts().slice(-20).reverse();
  const approvalPackets = listApprovalPackets().slice(-10).reverse();
  const approvalPacketDecisions = listApprovalPacketDecisions()
    .slice(-30)
    .reverse();
  const receipts = listGovernedRecomputationHandlerReceipts()
    .slice(-30)
    .reverse();
  const ceremonyReceipts = listRecomputationActivationReceipts()
    .slice(-20)
    .reverse();
  const finalized = recomputationActivationFinalized();
  const releaseReceipts = listSchedulerReleaseReceipts().slice(-20).reverse();
  const releaseAuthorized = schedulerReleaseAuthorized();
  const canaryPassed = schedulerCanaryPassed();
  const resumePermitted = schedulerResumePermitted();
  const approvalCompletion = approvalCompletionStatus();
  const finalCanaryPacket = currentFinalCanaryReleasePacket();
  const finalCanaryPackets = listFinalCanaryReleasePackets()
    .slice(-20)
    .reverse();
  const steadyIncidentReceipts = listSteadyStateIncidentReceipts()
    .slice(-30)
    .reverse();
  const steadyOpenIncidents = openSteadyStateIncidents();
  const watchdogReceipts = listPostResumeWatchdogReceipts()
    .slice(-20)
    .reverse();
  const canaryTranscripts = listCanaryExecutionTranscripts()
    .slice(-20)
    .reverse();
  const passedCanaryTranscript = currentPassedCanaryTranscript();
  const handoffChecklist = currentReviewHandoffChecklist();
  const handoffReceipts = listReviewHandoffReceipts().slice(-20).reverse();
  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "28px 24px 80px",
        display: "grid",
        gap: 18,
      }}
    >
      <header>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#9a3412" }}>
          INTERNAL · MODULE 45 RECOMPUTATION REVIEW
        </div>
        <h1>Evidence recomputation approvals</h1>
        <p>
          Approval requires a successful deterministic replay attestation for
          the exact handler implementation hash. No attestation, no approval.
        </p>
        <p>
          Scheduler activation: <b>{activation.ready ? "READY" : "BLOCKED"}</b>.
          Approval completion:{" "}
          <b>
            {approvalCompletion.complete &&
            approvalCompletion.allApproved &&
            approvalCompletion.current
              ? "READY"
              : "INCOMPLETE"}
          </b>
          . Ceremony: <b>{finalized ? "FINALIZED" : "OPEN"}</b>. All four
          handlers must be approved, replay-matched, and runtime-bound.
        </p>
        <p>
          Scheduler release:{" "}
          <b>{releaseAuthorized ? "AUTHORIZED" : "BLOCKED"}</b>. Canary:{" "}
          <b>{canaryPassed ? "PASSED" : "NOT PASSED"}</b>. Resume permission:{" "}
          <b>{resumePermitted ? "GRANTED" : "DENIED"}</b>.
        </p>
        <section
          style={{
            padding: 16,
            border: "1px solid #d7deea",
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <h2>Live readiness checklist</h2>
          <div>
            Approval packet:{" "}
            <b>{handoffChecklist.packetsReady ? "READY" : "MISSING"}</b>
          </div>
          <div>
            Four decisions complete:{" "}
            <b>{handoffChecklist.fourDecisionsComplete ? "YES" : "NO"}</b>
          </div>
          <div>
            All four approved:{" "}
            <b>{handoffChecklist.allApproved ? "YES" : "NO"}</b>
          </div>
          <div>
            Implementations current:{" "}
            <b>{handoffChecklist.implementationsCurrent ? "YES" : "NO"}</b>
          </div>
          <div>
            Technical activation:{" "}
            <b>{handoffChecklist.technicalReady ? "READY" : "BLOCKED"}</b>
          </div>
          <div>
            Final ceremony:{" "}
            <b>{handoffChecklist.ceremonyFinalized ? "FINALIZED" : "OPEN"}</b>
          </div>
          <div>
            Scheduler:{" "}
            <b>
              {handoffChecklist.resumePermitted
                ? "RESUME PERMITTED"
                : "PAUSED / BLOCKED"}
            </b>
          </div>
          {mayApprove && (
            <form
              action={recordHandoff}
              style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 10 }}
            >
              <textarea
                name="reason"
                required
                placeholder="Reason for handing the completed review to the final ceremony"
              />
              <button
                disabled={
                  !handoffChecklist.packetsReady ||
                  !handoffChecklist.fourDecisionsComplete ||
                  !handoffChecklist.allApproved ||
                  !handoffChecklist.implementationsCurrent ||
                  !handoffChecklist.technicalReady ||
                  handoffChecklist.ceremonyFinalized
                }
              >
                Record final-ceremony handoff
              </button>
            </form>
          )}
        </section>
        {mayApprove && (
          <form
            action={ceremony}
            style={{ display: "grid", gap: 8, maxWidth: 700 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Activation ceremony reason"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button name="action" value="INITIALIZE">
                Initialize live review set
              </button>
              <button
                name="action"
                value="FINALIZE"
                disabled={
                  !activation.ready ||
                  !approvalCompletion.complete ||
                  !approvalCompletion.allApproved ||
                  !approvalCompletion.current
                }
              >
                Finalize activation
              </button>
              <button name="action" value="REVOKE">
                Revoke activation
              </button>
            </div>
          </form>
        )}
        {mayApprove && (
          <form
            action={runBatchReplay}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Batch replay verification reason"
            />
            <button>Run all four deterministic replays</button>
          </form>
        )}
        {mayApprove && (
          <form
            action={createCanaryPacket}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Final canary release packet reason"
            />
            <button disabled={!finalized}>
              Create final canary release packet
            </button>
          </form>
        )}
        {mayApprove && (
          <form
            action={schedulerRelease}
            style={{ display: "grid", gap: 8, maxWidth: 700, marginTop: 12 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Scheduler release reason"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                name="action"
                value="AUTHORIZE"
                disabled={!activation.ready || !finalized || !finalCanaryPacket}
              >
                Authorize paused scheduler canary
              </button>
              <button name="action" value="REVOKE">
                Revoke scheduler release
              </button>
            </div>
          </form>
        )}
      </header>
      {latest.map((r) => (
        <section
          key={r.kind}
          style={{
            padding: 20,
            border: "1px solid #d7deea",
            borderRadius: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>
            {r.kind} · {r.handlerId}
          </strong>
          <div>
            Status: <b>{r.status}</b>
          </div>
          <code style={{ overflowWrap: "anywhere" }}>
            Implementation {r.implementationHash}
          </code>
          <div>Source: {r.sourcePath}</div>
          {mayApprove && (
            <form
              action={decide}
              style={{ display: "grid", gap: 8, maxWidth: 700 }}
            >
              <input type="hidden" name="kind" value={r.kind} />
              <textarea
                name="reason"
                required
                placeholder="Human review reason"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button name="decision" value="APPROVE">
                  Approve exact implementation
                </button>
                <button name="decision" value="SUSPEND">
                  Suspend
                </button>
              </div>
            </form>
          )}
        </section>
      ))}
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Signed replay packets</h2>
        {packets.length === 0 ? (
          <p>No replay packets are available yet.</p>
        ) : (
          packets.map((p) => (
            <div
              key={p.packetId}
              style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{p.kind}</b> · {p.artifactId}
              <br />
              <code>{p.outputHash}</code>
              {mayApprove && (
                <form action={runReplay} style={{ marginTop: 8 }}>
                  <input type="hidden" name="kind" value={p.kind} />
                  <input type="hidden" name="artifactId" value={p.artifactId} />
                  <button>Run deterministic replay</button>
                </form>
              )}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Replay attestations</h2>
        {attestations.map((a) => (
          <div
            key={a.attestationId}
            style={{ padding: "10px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{a.matched ? "MATCH" : "FAIL"}</b> · {a.kind} · {a.artifactId} ·{" "}
            {a.executedAt}
            <br />
            <code>{a.implementationHash}</code>
            {a.reasons.length ? (
              <>
                <br />
                {a.reasons.join(", ")}
              </>
            ) : null}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Batch replay verification receipts</h2>
        {batchReplayReceipts.length === 0 ? (
          <p>No batch replay verification receipts.</p>
        ) : (
          batchReplayReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.allMatched ? "ALL MATCHED" : "REVIEW REQUIRED"}</b> ·{" "}
              {r.actorName} · {r.at}
              <br />
              {r.reason}
              <br />
              {r.results
                .map((x) => `${x.kind}:${x.matched ? "MATCH" : "FAIL"}`)
                .join(", ")}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Four-decision approval packet</h2>
        {mayApprove && (
          <form
            action={createDecisionPacket}
            style={{ display: "grid", gap: 8, maxWidth: 700 }}
          >
            <textarea
              name="reason"
              required
              placeholder="Reason for preparing the four-decision packet"
            />
            <button>Create packet from latest all-matched batch replay</button>
          </form>
        )}
        {approvalPackets.length === 0 ? (
          <p>No approval packet has been prepared.</p>
        ) : (
          approvalPackets.map((packet) => (
            <div
              key={packet.packetId}
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <b>Packet {packet.packetId}</b> · batch {packet.batchReceiptId}
              <br />
              {packet.items.map((item) => (
                <form
                  key={item.kind}
                  action={decidePacketItem}
                  style={{
                    display: "grid",
                    gap: 6,
                    marginTop: 12,
                    maxWidth: 760,
                  }}
                >
                  <input
                    type="hidden"
                    name="packetId"
                    value={packet.packetId}
                  />
                  <input type="hidden" name="kind" value={item.kind} />
                  <div>
                    <b>{item.kind}</b> · <code>{item.implementationHash}</code>
                    <br />
                    Attestation {item.attestationId}
                  </div>
                  <textarea
                    name="reason"
                    required
                    placeholder={`Separate decision reason for ${item.kind}`}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button name="decision" value="APPROVE">
                      Approve this implementation
                    </button>
                    <button name="decision" value="SUSPEND">
                      Suspend this implementation
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ))
        )}
        <h3>Packet decisions</h3>
        {approvalPacketDecisions.length === 0 ? (
          <p>No packet decisions recorded.</p>
        ) : (
          approvalPacketDecisions.map((d) => (
            <div
              key={d.decisionId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{d.decision}</b> · {d.kind} · {d.actorName} · {d.at}
              <br />
              {d.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Approval receipts</h2>
        {receipts.map((r) => (
          <div
            key={r.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{r.decision}</b> · {r.kind} · {r.actorName} · {r.at}
            <br />
            {r.reason}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Final-ceremony handoff receipts</h2>
        {handoffReceipts.length === 0 ? (
          <p>No handoff receipts recorded.</p>
        ) : (
          handoffReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>READY FOR FINAL CEREMONY</b> · {r.actorName} · {r.at}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Activation ceremony receipts</h2>
        {ceremonyReceipts.length === 0 ? (
          <p>No activation ceremony receipts.</p>
        ) : (
          ceremonyReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.actorName} · {r.at} · ready{" "}
              {String(r.readyAtDecision)}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>

      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Final canary release packets</h2>
        {finalCanaryPackets.length === 0 ? (
          <p>No final canary release packets.</p>
        ) : (
          finalCanaryPackets.map((p) => (
            <div
              key={p.packetId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{p.ready ? "READY" : "BLOCKED"}</b> · {p.actorName} · {p.at}
              <br />
              Approval {p.approvalPacketId} · Handoff {p.handoffReceiptId} ·
              Ceremony {p.ceremonyReceiptId}
              <br />
              {p.reason}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Canary execution transcripts</h2>
        <p>
          Current matching passed transcript:{" "}
          <b>{passedCanaryTranscript ? "READY" : "MISSING"}</b>.
        </p>
        {canaryTranscripts.length === 0 ? (
          <p>No canary execution transcripts.</p>
        ) : (
          canaryTranscripts.map((r) => (
            <div
              key={r.transcriptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.status}</b> · run {r.canaryRunId} · packet {r.finalPacketId}
              <br />
              jobs {String(r.jobCount ?? 0)} · queued{" "}
              {String(r.queuedCount ?? 0)} · duration{" "}
              {String(r.durationMs ?? 0)} ms
              <br />
              <code>{r.jobResultHash ?? "pending"}</code>
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Post-resume watchdog receipts</h2>
        {watchdogReceipts.length === 0 ? (
          <p>
            No recurring executions have entered the guarded post-resume window.
          </p>
        ) : (
          watchdogReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.at} · execution {r.executionId}
              <br />
              Guard window: {String(r.withinGuardWindow)} · jobs {r.jobCount} ·
              failed {r.failedJobIds.length} · blocked {r.blockedJobIds.length}
              {r.pauseError ? (
                <>
                  <br />
                  Pause error: {r.pauseError}
                </>
              ) : null}
            </div>
          ))
        )}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Steady-state recomputation incidents</h2>
        {steadyOpenIncidents.length === 0 ? (
          <p>No open steady-state incidents.</p>
        ) : (
          steadyOpenIncidents.map((r) => (
            <form
              key={r.incidentId}
              action={decideSteadyIncident}
              style={{
                display: "grid",
                gap: 8,
                padding: "10px 0",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input type="hidden" name="incidentId" value={r.incidentId} />
              <b>OPEN · {r.incidentId}</b>
              <div>
                Execution {r.executionId} · failed {r.failedJobIds.length} ·
                blocked {r.blockedJobIds.length}
              </div>
              <textarea
                name="reason"
                required
                placeholder="Incident decision reason"
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button name="action" value="ACKNOWLEDGE">
                  Acknowledge
                </button>
                <button name="action" value="ESCALATE">
                  Escalate
                </button>
                <button name="action" value="RESOLVE">
                  Resolve
                </button>
              </div>
            </form>
          ))
        )}
        <h3>Incident receipts</h3>
        {steadyIncidentReceipts.map((r) => (
          <div
            key={r.receiptId}
            style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
          >
            <b>{r.action}</b> · {r.actorName} · {r.at}
            <br />
            {r.reason}
          </div>
        ))}
      </section>
      <section
        style={{ padding: 20, border: "1px solid #d7deea", borderRadius: 12 }}
      >
        <h2>Scheduler release receipts</h2>
        {releaseReceipts.length === 0 ? (
          <p>No scheduler release receipts.</p>
        ) : (
          releaseReceipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: "8px 0", borderTop: "1px solid #e2e8f0" }}
            >
              <b>{r.action}</b> · {r.actorName} · {r.at} · ready{" "}
              {String(r.activationReady)} · finalized{" "}
              {String(r.ceremonyFinalized)}
              <br />
              {r.reason}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
