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
 * Module 13 - Reports and Advisory Export Console
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional disclosure controls for generated artifacts.
 * - Vol II: protects borrower, application, report, advisory, and regulatory-use boundaries.
 * - Vol III: consumes replay-safe report records and governed export lineage.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports report review, escalation, retention, and audit preparation.
 * - Vol V: enforces advisory-only artifacts, controlled disclosure, explainability, and replay.
 */

const actorId = "module-13-reports-advisory-export-console";

type ModuleData = {
  applications: LoadResult;
  reports: LoadResult;
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

function reportRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["report"]);
}

function reportIdFromRow(row: unknown): string | null {
  const report = reportRecord(row);

  return stringValue(report.reportId) ?? stringValue(report.id);
}

function selectedReportFromRows(rows: unknown[], selectedId: string | null) {
  return rows.find((row) => reportIdFromRow(row) === selectedId) ?? rows[0] ?? null;
}

export default function ReportsAdvisoryExportPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    reports: emptyLoad,
    scope: emptyScope,
  });
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [reportType, setReportType] = useState("READINESS_SUMMARY");
  const [reportFocus, setReportFocus] = useState("module-13-advisory-review");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const reports =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true`,
            ["reportRecords"]
          )
        : emptyLoad;
    const selected = selectedReportFromRows(reports.rows, selectedReportId);

    setSelectedReportId(selected ? reportIdFromRow(selected) : null);
    setData({ applications, reports, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedReportId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const selectedReport = useMemo(() => {
    return selectedReportFromRows(data.reports.rows, selectedReportId);
  }, [data.reports.rows, selectedReportId]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 13 Reports and Advisory Export Console",
        "Internal advisory report record and export-governance surface",
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

  const recordAdvisoryReport = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          applicationId: data.scope.applicationId,
          reportType,
          metadata: {
            role: "governance",
            module: "Module 13 - Reports and Advisory Export Console",
            advisoryOnly: true,
            officialUseAllowed: false,
            externalReportGenerated: false,
          },
          payload: {
            focus: reportFocus,
            governedScope: data.scope,
            advisoryOnly: true,
            officialUseAllowed: false,
            humanReviewRequired: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Advisory report returned review."
        );
      } else {
        const report = primaryRecord(json, ["reportRecord"]);
        const id = stringValue(report.reportId) ?? stringValue(report.id);

        setSelectedReportId(id);
        setActionMessage(
          `Advisory report recorded: ${shortId(
            id
          )} / ${normalizeStatus(report.reportStatus)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown report generation action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, loadAll, reportFocus, reportType]);

  const advisoryCount = data.reports.rows.filter(
    (row) => reportRecord(row).advisoryOnly === true
  ).length;
  const externalCount = data.reports.rows.filter(
    (row) => reportRecord(row).externalReportGenerated === true
  ).length;
  const selected = selectedReport ? reportRecord(selectedReport) : {};
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Advisory Artifact",
    "Not Official Report",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="13"
          title="Reports and Advisory Export"
          subtitle="Internal advisory report records, export posture, classification, and human-review boundaries."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Report Records",
              value: data.reports.count,
              color: "#2563eb",
            },
            {
              label: "Advisory Records",
              value: advisoryCount,
              color: "#0f766e",
            },
            {
              label: "External Reports",
              value: externalCount,
              color: "#be123c",
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
            <h2 style={{ margin: 0, fontSize: 20 }}>Report Controls</h2>
            <FieldLabel label="Report type">
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
                style={inputStyle}
              >
                <option value="READINESS_SUMMARY">Readiness summary</option>
                <option value="APPLICATION_REVIEW_SUMMARY">
                  Application review summary
                </option>
                <option value="GOVERNANCE_EVIDENCE_SUMMARY">
                  Governance evidence summary
                </option>
                <option value="HUMAN_REVIEW_PACKET">Human review packet</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Report focus">
              <input
                value={reportFocus}
                onChange={(event) => setReportFocus(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordAdvisoryReport()}
            >
              Record Advisory Report
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This console creates governed advisory report records only. It
              does not create an official report, regulatory filing, public
              verification artifact, or lender reliance packet.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Report Records</h2>
            {data.reports.rows.length === 0 ? (
              <EmptyState>
                No report records are available for the current governed scope.
              </EmptyState>
            ) : (
              data.reports.rows.map((row) => {
                const report = reportRecord(row);
                const id = reportIdFromRow(row);

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedReportId(id)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border:
                        id === selectedReportId
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
                      <strong>{normalizeStatus(report.reportType)}</strong>
                      <StatusPill ok={report.officialUseAllowed !== true}>
                        {normalizeStatus(report.reportStatus)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>{shortId(id)}</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Advisory {normalizeStatus(report.advisoryOnly)} /
                      Official use {normalizeStatus(report.officialUseAllowed)} /
                      Generated {formatDateTime(report.generatedAt)}
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
              <strong>Selected Report</strong>
              <span style={{ color: "#475569" }}>{shortId(selected.reportId)}</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Borrower disclosure allowed:{" "}
                {normalizeStatus(selected.borrowerDisclosureAllowed)}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                External report generated:{" "}
                {normalizeStatus(selected.externalReportGenerated)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
