"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";
import {
  ActionButton,
  EmptyState,
  FieldLabel,
  LoadResult,
  ModuleHeader,
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
  formatDateTime,
  inputStyle,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  normalizeStatus,
  panelStyle,
  primaryRecord,
  scopeFromApplicationRows,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 11 - Partner Workflow Coordination Console
 *
 * Master Volume Governance:
 * - Vol I: preserves accountable lender and sponsor workflow authority.
 * - Vol II: protects borrower, diligence, commitment, certification, and disclosure posture.
 * - Vol III: consumes replay-safe partner workflow records before partner modules rely on them.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports assignment, due diligence, escalation, recovery, and audit preparation.
 * - Vol V: enforces advisory-only coordination, controlled disclosure, replay, and human review.
 */

const actorId = "module-11-partner-workflow-console";

type ModuleData = {
  applications: LoadResult;
  workflows: LoadResult;
  scope: ModuleScope;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

function workflowRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["workflow"]);
}

function workflowIdFromRow(row: unknown): string | null {
  return stringValue(workflowRecord(row).id);
}

function selectedWorkflowFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => workflowIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

export default function PartnerWorkflowCoordinationPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    workflows: emptyLoad,
    scope: emptyScope,
  });
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [partnerType, setPartnerType] = useState("LENDER");
  const [partnerName, setPartnerName] = useState("Module 11 Review Partner");
  const [workflowType, setWorkflowType] = useState("LENDER_REVIEW");
  const [workflowStage, setWorkflowStage] = useState("DUE_DILIGENCE");
  const [priority, setPriority] = useState("NORMAL");
  const [requestedAmount, setRequestedAmount] = useState("0");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const workflows =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/partners/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true`,
            ["partnerWorkflows"]
          )
        : emptyLoad;
    const selected = selectedWorkflowFromRows(workflows.rows, selectedWorkflowId);

    setSelectedWorkflowId(selected ? workflowIdFromRow(selected) : null);
    setData({ applications, workflows, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedWorkflowId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedWorkflow = useMemo(() => {
    return selectedWorkflowFromRows(data.workflows.rows, selectedWorkflowId);
  }, [data.workflows.rows, selectedWorkflowId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 11 Partner Workflow Coordination Console",
        "Internal lender and sponsor coordination surface",
        ADVISORY_ONLY_DISCLOSURE,
        BORROWER_PORTABILITY_DISCLOSURE,
        LENDER_READY_DISCLOSURE,
      ],
      context: {
        borrowerPortabilityAvailable: true,
        freeTierBaselineReadinessAvailable: true,
        lenderReadyDisclosurePresent: true,
      },
    });
  }, []);

  const recordWorkflow = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/partners/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          actorId,
          applicationId: data.scope.applicationId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          partnerType,
          partnerId: `module-11-${partnerType.toLowerCase()}-review`,
          partnerName,
          workflowType,
          workflowStage,
          status: "OPEN",
          priority,
          requestedAmount: Number(requestedAmount),
          programType:
            partnerType === "SPONSOR"
              ? "SPONSORSHIP_REVIEW"
              : "USDA_FSA_REVIEW",
          commitmentStatus: "NOT_COMMITTED",
          dueDiligenceStatus: "REVIEW_REQUIRED",
          disclosureStatus: "DISCLOSURE_REVIEW_REQUIRED",
          certificationStatus: "NOT_CERTIFIED",
          assignedTo: "governance-operator",
          escalationStatus: "NONE",
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            module: "Module 11 - Partner Workflow Coordination Console",
            advisoryOnly: true,
            finalCommitmentAllowed: false,
            borrowerDisclosureAllowed: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Partner workflow returned review."
        );
      } else {
        const workflow = primaryRecord(json, ["workflow"]);

        setSelectedWorkflowId(stringValue(workflow.id));
        setActionMessage(
          `Workflow recorded: ${shortId(
            workflow.id
          )} / ${normalizeStatus(workflow.status)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown partner workflow action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [
    data.scope,
    loadAll,
    partnerName,
    partnerType,
    priority,
    requestedAmount,
    workflowStage,
    workflowType,
  ]);

  const lenderCount = data.workflows.rows.filter(
    (row) => stringValue(workflowRecord(row).partnerType) === "LENDER"
  ).length;
  const sponsorCount = data.workflows.rows.filter(
    (row) => stringValue(workflowRecord(row).partnerType) === "SPONSOR"
  ).length;
  const selected = selectedWorkflow ? workflowRecord(selectedWorkflow) : {};
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Partner Coordination",
    "No Final Commitment",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="11"
          title="Partner Workflow Coordination"
          subtitle="Internal lender, sponsor, due diligence, and certification workflow posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Partner Workflows",
              value: data.workflows.count,
              color: "#2563eb",
            },
            {
              label: "Lender Reviews",
              value: lenderCount,
              color: "#0f766e",
            },
            {
              label: "Sponsor Reviews",
              value: sponsorCount,
              color: "#7c3aed",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Not loaded",
              color: "#334155",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.4fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Workflow Controls</h2>
            <FieldLabel label="Partner type">
              <select
                value={partnerType}
                onChange={(event) => {
                  const next = event.target.value;

                  setPartnerType(next);
                  setWorkflowType(
                    next === "SPONSOR" ? "SPONSOR_REVIEW" : "LENDER_REVIEW"
                  );
                }}
                style={inputStyle}
              >
                <option value="LENDER">Lender</option>
                <option value="SPONSOR">Sponsor</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Partner name">
              <input
                value={partnerName}
                onChange={(event) => setPartnerName(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <FieldLabel label="Workflow type">
              <select
                value={workflowType}
                onChange={(event) => setWorkflowType(event.target.value)}
                style={inputStyle}
              >
                <option value="LENDER_REVIEW">Lender review</option>
                <option value="SPONSOR_REVIEW">Sponsor review</option>
                <option value="DUE_DILIGENCE">Due diligence</option>
                <option value="TERM_REVIEW">Term review</option>
                <option value="DISCLOSURE_REVIEW">Disclosure review</option>
                <option value="CERTIFICATION_REVIEW">Certification review</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Workflow stage">
              <select
                value={workflowStage}
                onChange={(event) => setWorkflowStage(event.target.value)}
                style={inputStyle}
              >
                <option value="INTAKE">Intake</option>
                <option value="DUE_DILIGENCE">Due diligence</option>
                <option value="REVIEW">Review</option>
                <option value="ESCALATION">Escalation</option>
                <option value="AWAITING_HUMAN_REVIEW">Awaiting human review</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Priority">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                style={inputStyle}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Requested amount reference">
              <input
                value={requestedAmount}
                onChange={(event) => setRequestedAmount(event.target.value)}
                inputMode="decimal"
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordWorkflow()}
            >
              Record Partner Workflow
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This console records coordination posture only. It does not create
              a final lender commitment or borrower-facing disclosure.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Partner Workflow Records</h2>
            {data.workflows.rows.length === 0 ? (
              <EmptyState>
                No partner workflow records are available for the current
                governed scope.
              </EmptyState>
            ) : (
              data.workflows.rows.map((row) => {
                const workflow = workflowRecord(row);
                const id = stringValue(workflow.id);

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedWorkflowId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedWorkflowId
                          ? "2px solid #1f4f7a"
                          : "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#ffffff",
                      color: "#172033",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{stringValue(workflow.partnerName) ?? shortId(id)}</strong>
                      <StatusPill ok={workflow.finalActionAllowed !== true}>
                        {normalizeStatus(workflow.status)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {normalizeStatus(workflow.partnerType)} /{" "}
                      {normalizeStatus(workflow.workflowStage)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Diligence {normalizeStatus(workflow.dueDiligenceStatus)} /
                      Disclosure {normalizeStatus(workflow.disclosureStatus)} /
                      Due {formatDateTime(workflow.dueAt)}
                    </span>
                  </button>
                );
              })
            )}
            <div
              style={{
                display: "grid",
                gap: 6,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#f8fafc",
              }}
            >
              <strong>Selected Workflow</strong>
              <span style={{ color: "#475569" }}>{shortId(selected.id)}</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Final action allowed: {normalizeStatus(selected.finalActionAllowed)}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Borrower disclosure allowed:{" "}
                {normalizeStatus(selected.borrowerDisclosureAllowed)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
