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
 * Module 08 - Notice Lifecycle Console
 *
 * Master Volume Governance:
 * - Vol I: requires accountable authority for borrower notice lifecycle actions.
 * - Vol II: preserves adverse-action, appeal, redaction, retention, and delivery boundaries.
 * - Vol III: records replay-safe notice packet and provider-execution control state.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports retries, returned notices, disputes, recovery, and audit prep.
 * - Vol V: enforces controlled disclosure, consent, replay, and provider-action limits.
 */

const actorId = "module-08-notice-lifecycle-console";

type ModuleData = {
  applications: LoadResult;
  notices: LoadResult;
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

function deliveryRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["delivery"]);
}

function deliveryIdFromRow(row: unknown): string | null {
  return stringValue(deliveryRecord(row).id);
}

function selectedDeliveryFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => deliveryIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

function arrayCount(row: unknown, key: string): number {
  return isRecord(row) && Array.isArray(row[key]) ? row[key].length : 0;
}

export default function NoticeLifecycleConsolePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    notices: emptyLoad,
    scope: emptyScope,
  });
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [decisionNoticeId, setDecisionNoticeId] = useState("");
  const [noticeType, setNoticeType] = useState("APPLICATION_STATUS_NOTICE");
  const [deliveryChannel, setDeliveryChannel] = useState("SECURE_PORTAL");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const notices =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
            ["noticeRecords"]
          )
        : emptyLoad;
    const nextDelivery = selectedDeliveryFromRows(notices.rows, selectedDeliveryId);

    setSelectedDeliveryId(nextDelivery ? deliveryIdFromRow(nextDelivery) : null);
    setData({ applications, notices, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedDeliveryId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedDelivery = useMemo(() => {
    return selectedDeliveryFromRows(data.notices.rows, selectedDeliveryId);
  }, [data.notices.rows, selectedDeliveryId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 08 Notice Lifecycle Console",
        "Internal notice packet and provider-control surface",
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

  const recordNoticePacket = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId || !decisionNoticeId) {
      setActionMessage(
        "A governed application scope and decision-notice reference are required."
      );
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/notices/deliver", {
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
          decisionNoticeId,
          noticeType,
          deliveryChannel,
          noticePacketRef: `notice-packet-${Date.now()}`,
          redactionProfileRef: "module-08-redaction-profile-v0.1.0",
          redactionStatus: "REDACTION_REVIEW_REQUIRED",
          appealPacketRef: "module-08-appeal-rights-packet-v0.1.0",
          retentionPolicyRef: "module-08-retention-policy-v0.1.0",
          deliveryTrackingRef: `tracking-review-${Date.now()}`,
          deliveryProviderRef: null,
          deliveryProviderConfigured: false,
          metadata: {
            module: "Module 08 - Notice Lifecycle Console",
            externalDeliveryPerformed: false,
            providerActionPerformed: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Notice packet control returned review."
        );
      } else {
        const delivery = isRecord(json.delivery) ? json.delivery : {};

        setSelectedDeliveryId(stringValue(delivery.id));
        setActionMessage(
          `Notice packet recorded: ${shortId(delivery.id)} / ${normalizeStatus(
            delivery.deliveryStatus
          )}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown notice packet action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, decisionNoticeId, deliveryChannel, loadAll, noticeType]);

  const recordProviderControl = useCallback(async () => {
    const delivery = selectedDelivery ? deliveryRecord(selectedDelivery) : {};
    const deliveryId = stringValue(delivery.id);
    const noticeDecisionId =
      stringValue(delivery.decisionNoticeId) || decisionNoticeId;

    if (!data.scope.applicationId || !data.scope.tenantId || !deliveryId) {
      setActionMessage("A selected notice delivery record is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/notices/provider-execution", {
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
          deliveryId,
          decisionNoticeId: noticeDecisionId,
          providerId: "module-08-provider-control",
          providerType: "SECURE_PORTAL",
          providerAdapterStatus: "PENDING_REVIEW",
          providerExecutionRef: `provider-control-${Date.now()}`,
          credentialRef: "credential-reference-required",
          credentialStatus: "PENDING_REVIEW",
          retryPolicyRef: "module-08-retry-policy-v0.1.0",
          returnedMailPolicyRef: "module-08-returned-mail-policy-v0.1.0",
          failedDeliveryPolicyRef: "module-08-failed-delivery-policy-v0.1.0",
          disputeIntakeRef: "module-08-dispute-intake-v0.1.0",
          outagePolicyRef: "module-08-outage-policy-v0.1.0",
          outageStatus: "PENDING_TEST",
          replayPolicyRef: "module-08-replay-policy-v0.1.0",
          replayStatus: "PENDING_VERIFICATION",
          operationalRunbookRef: "module-08-operational-runbook-v0.1.0",
          operationalRunbookStatus: "PENDING_REVIEW",
          schemaContractVersion: "notice-provider-contract-v0.1.0",
          schemaContractStatus: "PENDING_VERIFICATION",
          consentRef: "borrower-notice-consent-review-required",
          consentStatus: "PENDING_REVIEW",
          isolationRef: "notice-provider-isolation-review-required",
          isolationStatus: "PENDING_VERIFICATION",
          metadata: {
            module: "Module 08 - Notice Lifecycle Console",
            externalProviderActionPerformed: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Provider control returned review."
        );
      } else {
        const execution = isRecord(json.execution) ? json.execution : {};

        setActionMessage(
          `Provider control recorded: ${shortId(
            execution.id
          )} / ${normalizeStatus(execution.executionStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown provider-control action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, decisionNoticeId, loadAll, selectedDelivery]);

  const selectedDeliveryRecord = selectedDelivery
    ? deliveryRecord(selectedDelivery)
    : {};
  const providerExecutionCount = data.notices.rows.reduce<number>(
    (total, row) => total + arrayCount(row, "providerExecutions"),
    0
  );
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Packet Control",
    "No External Provider Action",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="08"
          title="Notice Lifecycle"
          subtitle="Internal notice packet, provider-control, receipt, and exception posture."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Notice Records",
              value: data.notices.count,
              color: "#2563eb",
            },
            {
              label: "Provider Controls",
              value: providerExecutionCount,
              color: "#7c3aed",
            },
            {
              label: "Selected Packet",
              value: shortId(selectedDeliveryRecord.id),
              color: "#0f766e",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Notice Controls</h2>
            <FieldLabel label="Decision notice reference">
              <input
                value={decisionNoticeId}
                onChange={(event) => setDecisionNoticeId(event.target.value)}
                style={inputStyle}
                placeholder="Paste Module 07 decision notice id"
              />
            </FieldLabel>
            <FieldLabel label="Notice type">
              <select
                value={noticeType}
                onChange={(event) => setNoticeType(event.target.value)}
                style={inputStyle}
              >
                <option value="APPLICATION_STATUS_NOTICE">
                  Application status notice
                </option>
                <option value="ADVERSE_ACTION_NOTICE">
                  Adverse-action notice packet
                </option>
                <option value="INCOMPLETE_APPLICATION_NOTICE">
                  Incomplete application notice
                </option>
              </select>
            </FieldLabel>
            <FieldLabel label="Delivery channel">
              <select
                value={deliveryChannel}
                onChange={(event) => setDeliveryChannel(event.target.value)}
                style={inputStyle}
              >
                <option value="SECURE_PORTAL">Secure portal</option>
                <option value="EMAIL_REVIEW">Email review</option>
                <option value="MAIL_REVIEW">Mail review</option>
              </select>
            </FieldLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionButton
                disabled={
                  actionBusy || !data.scope.applicationId || !decisionNoticeId
                }
                onClick={() => void recordNoticePacket()}
              >
                Record Notice Packet
              </ActionButton>
              <ActionButton
                disabled={actionBusy || !selectedDeliveryId}
                onClick={() => void recordProviderControl()}
              >
                Record Provider Control
              </ActionButton>
            </div>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              Provider controls remain internal. This module does not transmit
              external notices or call a provider.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Notice Records</h2>
            {data.notices.rows.length === 0 ? (
              <EmptyState>
                No notice lifecycle records are available for the current
                governed scope.
              </EmptyState>
            ) : (
              data.notices.rows.map((row) => {
                const delivery = deliveryRecord(row);
                const id = stringValue(delivery.id);

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedDeliveryId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedDeliveryId
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
                      <StatusPill ok={delivery.externalDeliveryPerformed !== true}>
                        {normalizeStatus(delivery.deliveryStatus)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {normalizeStatus(delivery.noticeType)} /{" "}
                      {normalizeStatus(delivery.deliveryChannel)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Provider controls {arrayCount(row, "providerExecutions")} /
                      Receipts {arrayCount(row, "receipts")} / Prepared{" "}
                      {formatDateTime(delivery.deliveryPreparedAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
