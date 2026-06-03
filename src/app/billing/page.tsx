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
 * Module 12 - Billing and Payment Controls Console
 *
 * Master Volume Governance:
 * - Vol I: preserves accountable authority before any payment connector reliance.
 * - Vol II: protects tenant, entitlement, payment, refund, dispute, and reconciliation metadata.
 * - Vol III: consumes replay-safe billing and payment connector execution records.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports payment recovery, outage, dispute, refund, and reconciliation review.
 * - Vol V: enforces connector governance, credential references, isolation, replay, and no live capture.
 */

const actorId = "module-12-billing-payment-controls-console";

type ModuleData = {
  applications: LoadResult;
  billingEvents: LoadResult;
  paymentConnectors: LoadResult;
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

function billingEventRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["billingEvent"]);
}

function adapterRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["adapter"]);
}

function adapterIdFromRow(row: unknown): string | null {
  return stringValue(adapterRecord(row).adapterId);
}

function selectedAdapterFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => adapterIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

function relatedCount(row: unknown, key: "executions" | "billingEvents"): number {
  return isRecord(row) && Array.isArray(row[key]) ? row[key].length : 0;
}

export default function BillingPaymentControlsPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    billingEvents: emptyLoad,
    paymentConnectors: emptyLoad,
    scope: emptyScope,
  });
  const [selectedAdapterId, setSelectedAdapterId] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [adapterId, setAdapterId] = useState("module-12-payment-adapter");
  const [processorType, setProcessorType] = useState("STRIPE");
  const [plan, setPlan] = useState("institutional-review");
  const [amountTotal, setAmountTotal] = useState("0");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const billingEvents = scope.tenantId
      ? await loadJsonSurface(
          `/api/billing/admin?role=governance&userId=${actorId}${scopeQuery(
            scope,
            ["tenantId"]
          )}&limit=12&includeEntitlement=true`,
          ["billingEvents"]
        )
      : emptyLoad;
    const paymentConnectors = scope.tenantId
      ? await loadJsonSurface(
          `/api/billing/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
            scope,
            ["tenantId"]
          )}&limit=12&includeExecutions=true&includeBillingEvents=true`,
          ["paymentConnectors"]
        )
      : emptyLoad;
    const selected = selectedAdapterFromRows(
      paymentConnectors.rows,
      selectedAdapterId
    );

    setSelectedAdapterId(selected ? adapterIdFromRow(selected) : null);
    setData({ applications, billingEvents, paymentConnectors, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedAdapterId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedAdapter = useMemo(() => {
    return selectedAdapterFromRows(data.paymentConnectors.rows, selectedAdapterId);
  }, [data.paymentConnectors.rows, selectedAdapterId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 12 Billing and Payment Controls Console",
        "Internal payment connector and billing-event review surface",
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

  const recordConnectorReview = useCallback(async () => {
    if (!data.scope.tenantId || !adapterId) {
      setActionMessage("A governed tenant scope and adapter identifier are required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/billing/connectors", {
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
          adapterName: "Module 12 Payment Connector Review",
          processorName: "Governed payment processor reference",
          processorType,
          processorEnvironment: "TEST",
          paymentAuthorityRef: "module-12-payment-authority-review-required",
          certificationStatus: "PENDING_CERTIFICATION",
          credentialRef: "credential-vault-reference-required",
          credentialStatus: "PENDING_REVIEW",
          webhookSecretRef: "webhook-secret-reference-required",
          webhookSignatureStatus: "PENDING_VERIFICATION",
          outagePolicyRef: "module-12-outage-policy-v0.1.0",
          outageStatus: "PENDING_TEST",
          replayPolicyRef: "module-12-replay-policy-v0.1.0",
          replayStatus: "PENDING_VERIFICATION",
          schemaContractVersion: "payment-connector-schema-v0.1.0",
          refundPolicyRef: "module-12-refund-policy-v0.1.0",
          refundPolicyStatus: "PENDING_VERIFICATION",
          disputePolicyRef: "module-12-dispute-policy-v0.1.0",
          disputePolicyStatus: "PENDING_VERIFICATION",
          reconciliationPolicyRef: "module-12-reconciliation-policy-v0.1.0",
          reconciliationPolicyStatus: "PENDING_VERIFICATION",
          metadata: {
            module: "Module 12 - Billing and Payment Controls Console",
            livePaymentCaptured: false,
            secretMaterialProvided: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Payment connector review returned review."
        );
      } else {
        const adapter = primaryRecord(json, ["adapter"]);
        const result = isRecord(json.result) ? json.result : {};

        setSelectedAdapterId(stringValue(adapter.adapterId));
        setActionMessage(
          `Connector review recorded: ${shortId(
            adapter.adapterId
          )} / ${normalizeStatus(result.certificationStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown payment connector action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [adapterId, data.scope.tenantId, loadAll, processorType]);

  const recordExecutionControl = useCallback(async () => {
    if (!data.scope.tenantId || !adapterId) {
      setActionMessage("A governed tenant scope and adapter identifier are required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/billing/execution", {
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
          sessionId: `module-12-session-${Date.now()}`,
          plan,
          amountTotal: Number(amountTotal),
          currency: "usd",
          executionRef: `module-12-payment-execution-control-${Date.now()}`,
          paymentProcessorRef: "payment-processor-reference-review-required",
          operationalRunbookRef: "module-12-operational-runbook-v0.1.0",
          operationalRunbookStatus: "PENDING_REVIEW",
          schemaContractStatus: "PENDING_VERIFICATION",
          consentRef: "borrower-payment-consent-review-required",
          consentStatus: "PENDING_REVIEW",
          isolationRef: "payment-isolation-review-required",
          isolationStatus: "PENDING_VERIFICATION",
          metadata: {
            module: "Module 12 - Billing and Payment Controls Console",
            paymentProcessorActionPerformed: false,
            livePaymentCaptured: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Payment execution control returned review."
        );
      } else {
        const execution = primaryRecord(json, ["execution"]);

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
          : "Unknown payment execution action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [adapterId, amountTotal, data.scope.tenantId, loadAll, plan]);

  const selected = selectedAdapter ? adapterRecord(selectedAdapter) : {};
  const executionTotal = data.paymentConnectors.rows.reduce<number>(
    (total, row) => total + relatedCount(row, "executions"),
    0
  );
  const connectorBillingTotal = data.paymentConnectors.rows.reduce<number>(
    (total, row) => total + relatedCount(row, "billingEvents"),
    0
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.tenantId ?? "Unscoped"}`,
    "Payment Controls",
    "No Live Capture",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="12"
          title="Billing and Payment Controls"
          subtitle="Internal billing events, payment connector certification, and execution-authorization posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Billing Events",
              value: data.billingEvents.count,
              color: "#2563eb",
            },
            {
              label: "Payment Connectors",
              value: data.paymentConnectors.count,
              color: "#0f766e",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Payment Controls</h2>
            <FieldLabel label="Adapter identifier">
              <input
                value={adapterId}
                onChange={(event) => setAdapterId(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <FieldLabel label="Processor type">
              <select
                value={processorType}
                onChange={(event) => setProcessorType(event.target.value)}
                style={inputStyle}
              >
                <option value="STRIPE">Stripe reference</option>
                <option value="ACH">ACH reference</option>
                <option value="CARD">Card reference</option>
                <option value="PAYMENT_PROCESSOR">Payment processor</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Plan reference">
              <input
                value={plan}
                onChange={(event) => setPlan(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <FieldLabel label="Amount reference">
              <input
                value={amountTotal}
                onChange={(event) => setAmountTotal(event.target.value)}
                inputMode="decimal"
                style={inputStyle}
              />
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionButton
                disabled={actionBusy || !data.scope.tenantId || !adapterId}
                onClick={() => void recordConnectorReview()}
              >
                Record Connector Review
              </ActionButton>
              <ActionButton
                disabled={actionBusy || !data.scope.tenantId || !adapterId}
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
              This console records payment and billing governance posture. It
              does not capture live payments, store raw secrets, or alter
              regulated decision posture.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Payment Connector Records</h2>
            {data.paymentConnectors.rows.length === 0 ? (
              <EmptyState>
                No payment connector records are available for the current
                governed tenant scope.
              </EmptyState>
            ) : (
              data.paymentConnectors.rows.map((row) => {
                const adapter = adapterRecord(row);
                const id = stringValue(adapter.adapterId);

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedAdapterId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedAdapterId
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
                      <StatusPill ok={adapter.livePaymentCaptured !== true}>
                        {normalizeStatus(adapter.certificationStatus)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {normalizeStatus(adapter.processorType)} /{" "}
                      {normalizeStatus(adapter.processorEnvironment)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Executions {relatedCount(row, "executions")} / Related
                      billing events {relatedCount(row, "billingEvents")}
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
              <strong>Selected Connector</strong>
              <span style={{ color: "#475569" }}>
                {shortId(selected.adapterId)}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Live payments allowed: {normalizeStatus(selected.livePaymentsAllowed)}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Live payment captured: {normalizeStatus(selected.livePaymentCaptured)}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                background: "#ffffff",
              }}
            >
              <strong>Recent Billing Events</strong>
              {data.billingEvents.rows.length === 0 ? (
                <span style={{ color: "#64748b", fontSize: 13 }}>
                  No billing events are available for this tenant.
                </span>
              ) : (
                data.billingEvents.rows.slice(0, 4).map((row) => {
                  const billingEvent = billingEventRecord(row);
                  const id =
                    stringValue(billingEvent.billingEventId) ??
                    stringValue(billingEvent.id);

                  return (
                    <span key={id ?? JSON.stringify(row)} style={{ color: "#475569" }}>
                      {shortId(id)} / {normalizeStatus(billingEvent.eventStatus)} /{" "}
                      {formatDateTime(billingEvent.occurredAt)}
                    </span>
                  );
                })
              )}
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Connector-related billing rows: {connectorBillingTotal}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
