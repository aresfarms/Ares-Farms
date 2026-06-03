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
  isRecord,
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
 * Module 10 - Connector Certification Console
 *
 * Master Volume Governance:
 * - Vol I: preserves accountable connector-promotion authority.
 * - Vol II: blocks ungoverned USDA, SBA, property, and institutional source reliance.
 * - Vol III: records replay-safe source, adapter, and execution-control state.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports outage review, credential review, escalation, and recovery.
 * - Vol V: enforces source authority, consent, isolation, replay, and controlled disclosure.
 */

const actorId = "module-10-connector-certification-console";

type ModuleData = {
  applications: LoadResult;
  connectors: LoadResult;
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

function connectorRun(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["connectorRun"]);
}

function connectorRunIdFromRow(row: unknown): string | null {
  return stringValue(connectorRun(row).id);
}

function selectedConnectorFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => connectorRunIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

function adapterCount(row: unknown): number {
  return isRecord(row) && Array.isArray(row.adapters) ? row.adapters.length : 0;
}

function executionCount(row: unknown): number {
  return isRecord(row) && Array.isArray(row.executions)
    ? row.executions.length
    : 0;
}

export default function ConnectorCertificationConsolePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    connectors: emptyLoad,
    scope: emptyScope,
  });
  const [selectedConnectorRunId, setSelectedConnectorRunId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState("usda-fsa");
  const [queryType, setQueryType] = useState("program_reference");
  const [adapterId, setAdapterId] = useState("module-10-usda-fsa-adapter");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const connectors =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
            ["connectorRecords"]
          )
        : emptyLoad;
    const nextConnector = selectedConnectorFromRows(
      connectors.rows,
      selectedConnectorRunId
    );

    setSelectedConnectorRunId(
      nextConnector ? connectorRunIdFromRow(nextConnector) : null
    );
    setData({ applications, connectors, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedConnectorRunId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedConnector = useMemo(() => {
    return selectedConnectorFromRows(data.connectors.rows, selectedConnectorRunId);
  }, [data.connectors.rows, selectedConnectorRunId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 10 Connector Certification Console",
        "Internal source authority and adapter review surface",
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

  const recordSourceCheck = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/connectors/source-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          applicationId: data.scope.applicationId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          sourceId,
          connectorType: sourceId,
          queryType,
          query: {
            applicationId: data.scope.applicationId,
            reviewPurpose: "module-10-source-authority-review",
          },
          metadata: {
            module: "Module 10 - Connector Certification Console",
            liveCallPerformed: false,
            officialDataFetched: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Source check returned review."
        );
      } else {
        const run = isRecord(json.connectorRun) ? json.connectorRun : {};

        setSelectedConnectorRunId(stringValue(run.id));
        setActionMessage(
          `Source check recorded: ${shortId(run.id)} / ${normalizeStatus(
            run.status
          )}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown source-check action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, loadAll, queryType, sourceId]);

  const recordAdapterReview = useCallback(async () => {
    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/connectors/adapters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          actorId,
          tenantId: data.scope.tenantId,
          adapterId,
          adapterName: "Module 10 Source Adapter Review",
          adapterType: sourceId === "sba" ? "SBA" : sourceId === "property-records" ? "PROPERTY" : "USDA",
          sourceId,
          sourceAuthorityRef: "source-authority-review-required",
          certificationStatus: "PENDING_CERTIFICATION",
          credentialRef: "credential-vault-reference-required",
          credentialStatus: "PENDING_REVIEW",
          outagePolicyRef: "module-10-outage-policy-v0.1.0",
          outageStatus: "PENDING_TEST",
          replayPolicyRef: "module-10-replay-policy-v0.1.0",
          replayStatus: "PENDING_VERIFICATION",
          schemaContractVersion: "connector-schema-contract-v0.1.0",
          metadata: {
            module: "Module 10 - Connector Certification Console",
            liveCallPerformed: false,
            promotionBoundary: "production-live-action-gate-required",
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Adapter certification review returned review."
        );
      } else {
        const adapter = isRecord(json.adapter) ? json.adapter : {};
        const result = isRecord(json.result) ? json.result : {};

        setActionMessage(
          `Adapter review recorded: ${shortId(
            adapter.adapterId
          )} / ${normalizeStatus(result.certificationStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown adapter-review action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [adapterId, data.scope.tenantId, loadAll, sourceId]);

  const recordExecutionControl = useCallback(async () => {
    const run = selectedConnector ? connectorRun(selectedConnector) : {};
    const connectorRunId = stringValue(run.id);

    if (!data.scope.applicationId || !data.scope.tenantId || !connectorRunId) {
      setActionMessage("A selected connector source-check record is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/connectors/execution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          applicationId: data.scope.applicationId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          connectorRunId,
          adapterId,
          sourceId: stringValue(run.sourceId) ?? sourceId,
          executionRef: `connector-execution-control-${Date.now()}`,
          operationalRunbookRef: "module-10-operational-runbook-v0.1.0",
          operationalRunbookStatus: "PENDING_REVIEW",
          consentRef: "borrower-source-consent-review-required",
          consentStatus: "PENDING_REVIEW",
          isolationRef: "connector-isolation-review-required",
          isolationStatus: "PENDING_VERIFICATION",
          schemaContractStatus: "PENDING_VERIFICATION",
          metadata: {
            module: "Module 10 - Connector Certification Console",
            liveCallPerformed: false,
            officialDataFetched: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Execution control returned review."
        );
      } else {
        const execution = isRecord(json.execution) ? json.execution : {};

        setActionMessage(
          `Execution control recorded: ${shortId(
            execution.id
          )} / ${normalizeStatus(execution.executionStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown execution-control action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [adapterId, data.scope, loadAll, selectedConnector, sourceId]);

  const selectedRun = selectedConnector ? connectorRun(selectedConnector) : {};
  const adapterTotal = data.connectors.rows.reduce<number>(
    (total, row) => total + adapterCount(row),
    0
  );
  const executionTotal = data.connectors.rows.reduce<number>(
    (total, row) => total + executionCount(row),
    0
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Source Authority",
    "No Live External Calls",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="10"
          title="Connector Certification"
          subtitle="Internal source authority, adapter review, and execution-control posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Connector Runs",
              value: data.connectors.count,
              color: "#4d7c0f",
            },
            {
              label: "Adapter Records",
              value: adapterTotal,
              color: "#2563eb",
            },
            {
              label: "Execution Controls",
              value: executionTotal,
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Connector Controls</h2>
            <FieldLabel label="Source">
              <select
                value={sourceId}
                onChange={(event) => {
                  const next = event.target.value;

                  setSourceId(next);
                  setQueryType(
                    next === "property-records"
                      ? "property_record"
                      : next === "sba"
                        ? "program_reference"
                        : "program_reference"
                  );
                }}
                style={inputStyle}
              >
                <option value="usda-fsa">USDA Farm Service Agency</option>
                <option value="sba">Small Business Administration</option>
                <option value="property-records">Property Records Source</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Query type">
              <select
                value={queryType}
                onChange={(event) => setQueryType(event.target.value)}
                style={inputStyle}
              >
                <option value="program_reference">Program reference</option>
                <option value="farm_service_context">Farm service context</option>
                <option value="small_business_context">Small business context</option>
                <option value="property_record">Property record</option>
                <option value="parcel_context">Parcel context</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Adapter identifier">
              <input
                value={adapterId}
                onChange={(event) => setAdapterId(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionButton
                disabled={actionBusy || !data.scope.applicationId}
                onClick={() => void recordSourceCheck()}
              >
                Record Source Check
              </ActionButton>
              <ActionButton
                disabled={actionBusy || !adapterId}
                onClick={() => void recordAdapterReview()}
              >
                Record Adapter Review
              </ActionButton>
              <ActionButton
                disabled={actionBusy || !selectedConnectorRunId}
                onClick={() => void recordExecutionControl()}
              >
                Record Execution Control
              </ActionButton>
            </div>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This console stages source, adapter, and execution controls. Live
              external calls and official source fetches remain blocked here.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Connector Lifecycle</h2>
            {data.connectors.rows.length === 0 ? (
              <EmptyState>
                No connector lifecycle records are available for the current
                governed scope.
              </EmptyState>
            ) : (
              data.connectors.rows.map((row) => {
                const run = connectorRun(row);
                const id = stringValue(run.id);
                const source = isRecord(row) && isRecord(row.source) ? row.source : {};

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedConnectorRunId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedConnectorRunId
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
                      <strong>{shortId(id)}</strong>
                      <StatusPill ok={run.liveCallPerformed !== true}>
                        {normalizeStatus(run.status)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {stringValue(source.sourceName) ?? normalizeStatus(run.sourceId)} /{" "}
                      {normalizeStatus(run.queryType)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Adapters {adapterCount(row)} / Execution controls{" "}
                      {executionCount(row)} / Requested{" "}
                      {formatDateTime(run.requestedAt)}
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
              <strong>Selected Run</strong>
              <span style={{ color: "#475569" }}>{shortId(selectedRun.id)}</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Live call performed: {normalizeStatus(selectedRun.liveCallPerformed)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
