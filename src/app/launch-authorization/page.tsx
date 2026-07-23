"use client";

import { useEffect, useState } from "react";

type Assignment = {
  status: "ASSIGNED" | "EXTERNAL_AUTHORITY" | "HELD_FOR_LATER_PHASE" | "UNFILLED_BY_DESIGN";
  holderName: string | null;
  reason: string;
};

type Slot = {
  blockerId: string;
  title: string;
  authorityRole: string;
  assignment: Assignment | null;
  decision: { decision: string } | null;
  canDecide: boolean;
};

type ResponseData = {
  ok: boolean;
  actor?: string;
  error?: string;
  rollup?: {
    completed: number;
    required: number;
    approvalsComplete: boolean;
    slots: Slot[];
  };
};

export default function LaunchAuthorizationPage() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [slot, setSlot] = useState("");
  const [decision, setDecision] = useState("APPROVE");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [condition, setCondition] = useState("");
  const [message, setMessage] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const load = () =>
    fetch("/api/governance/launch-authorization-decisions")
      .then((response) => response.json())
      .then(setData);

  useEffect(() => {
    void load();
  }, []);

  async function submit() {
    const [blockerId, authorityRole] = slot.split("|");
    const response = await fetch(
      "/api/governance/launch-authorization-decisions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerId,
          authorityRole,
          decision,
          evidenceRef,
          conditions: condition.trim() ? [condition.trim()] : [],
        }),
      }
    );
    const json = (await response.json()) as ResponseData;
    setMessage(json.ok ? "Your authority decision was recorded." : json.error ?? "Decision could not be recorded.");
    if (json.ok) setData(json);
  }

  async function approveAllAssigned() {
    if (!window.confirm("Approve every pending launch decision currently assigned to your authenticated identity? This will not approve external, held, or unassigned authority roles.")) return;
    setBatchSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(
        "/api/governance/launch-authorization-decisions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "APPROVE_ALL_ASSIGNED",
            evidenceRef: evidenceRef.trim() || "launch-authorization-batch-approval",
          }),
        }
      );
      const json = (await response.json()) as ResponseData & { batch?: { recorded: number } };
      setMessage(
        json.ok
          ? `${json.batch?.recorded ?? 0} assigned pending decision(s) approved.`
          : json.error ?? "Assigned decisions could not be approved."
      );
      if (json.ok) setData(json);
    } finally {
      setBatchSubmitting(false);
    }
  }

  if (!data) return <main className="mx-auto max-w-5xl p-8">Loading…</main>;
  if (!data.ok || !data.rollup) {
    return <main className="mx-auto max-w-5xl p-8">{data.error}</main>;
  }

  const rollup = data.rollup;
  const actorSlots = rollup.slots.filter((item) => item.canDecide);
  const pendingActorSlots = actorSlots.filter((item) => !item.decision);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">Launch authorization decisions</h1>
        <p>
          Signed in as {data.actor}. Submit only decisions within your assigned authority.
          Proxy approval is forbidden.
        </p>
      </div>

      <section className="rounded border p-4">
        <p><b>Completed:</b> {rollup.completed}/{rollup.required}</p>
        <p><b>Approvals complete:</b> {String(rollup.approvalsComplete)}</p>
        <p><b>Final launch hold released:</b> false</p>
        <p><b>Production authorized:</b> false</p>
      </section>

      <section className="space-y-3 rounded border p-4">
        <select
          className="w-full border p-2"
          value={slot}
          onChange={(event) => setSlot(event.target.value)}
        >
          <option value="">Select an assigned authority slot</option>
          {actorSlots.map((item) => (
            <option
              key={`${item.blockerId}|${item.authorityRole}`}
              value={`${item.blockerId}|${item.authorityRole}`}
            >
              {item.blockerId} — {item.authorityRole} — {item.decision?.decision ?? "PENDING"}
            </option>
          ))}
        </select>
        <select className="border p-2" value={decision} onChange={(event) => setDecision(event.target.value)}>
          <option>APPROVE</option>
          <option>APPROVE_WITH_CONDITIONS</option>
          <option>REJECT</option>
        </select>
        <input className="w-full border p-2" value={evidenceRef} onChange={(event) => setEvidenceRef(event.target.value)} placeholder="Evidence reference" />
        <input className="w-full border p-2" value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Condition, required for conditional approval" />
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-black px-4 py-2 text-white" disabled={!slot} onClick={submit}>
            Record my decision
          </button>
          <button
            className="rounded border border-black px-4 py-2"
            disabled={batchSubmitting || pendingActorSlots.length === 0}
            onClick={approveAllAssigned}
          >
            {batchSubmitting
              ? "Approving assigned decisions…"
              : `Approve all assigned to me (${pendingActorSlots.length})`}
          </button>
        </div>
        <p className="text-sm">
          Batch approval applies only to pending slots assigned to your authenticated identity.
          External, held, and unassigned roles remain blocked.
        </p>
        {message && <p>{message}</p>}
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="text-xl font-semibold">Decision matrix</h2>
        {rollup.slots.map((item) => (
          <div className="rounded border p-3" key={`${item.blockerId}-${item.authorityRole}`}>
            <p><b>{item.blockerId} · {item.authorityRole}</b></p>
            <p>Decision: {item.decision?.decision ?? "PENDING"}</p>
            <p>Assignment posture: {item.assignment?.status ?? "UNRECORDED"}</p>
            {item.assignment?.holderName && <p>Holder: {item.assignment.holderName}</p>}
            {item.assignment?.reason && <p className="text-sm">{item.assignment.reason}</p>}
          </div>
        ))}
      </section>
    </main>
  );
}
