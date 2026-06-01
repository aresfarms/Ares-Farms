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
 * Module 06 - Rule and Overlay Evaluation Console
 *
 * Master Volume Governance:
 * - Vol I: preserves constitutional rule hierarchy and overlay supremacy.
 * - Vol II: keeps eligibility, fair-lending, source, and adverse-action boundaries governed.
 * - Vol III: consumes replay-safe rule and overlay evaluation runtimes.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports exception review, escalation, amendment review, and audit prep.
 * - Vol V: enforces advisory-only output, explainability, replay, and source authority.
 */

const actorId = "module-06-rule-overlay-console";

type ModuleData = {
  applications: LoadResult;
  ruleEvaluations: LoadResult;
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

function evaluationRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["ruleEvaluation"]);
}

function relatedCount(row: unknown, key: "rules" | "overlays"): number {
  return isRecord(row) && Array.isArray(row[key]) ? row[key].length : 0;
}

export default function RuleOverlayConsolePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    ruleEvaluations: emptyLoad,
    scope: emptyScope,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [operation, setOperation] = useState("regulated-rule-overlay-review");
  const [farmAcreage, setFarmAcreage] = useState("120");
  const [grossRevenue, setGrossRevenue] = useState("0");
  const [debtCoverage, setDebtCoverage] = useState("0");

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const ruleEvaluations =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/rules/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeRules=true&includeOverlays=true&includeApplication=true&includeProperty=true`,
            ["ruleRecords"]
          )
        : emptyLoad;

    setData({ applications, ruleEvaluations, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 06 Rule and Overlay Console",
        "Internal advisory rule evaluation surface",
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

  const runRuleEvaluation = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rules/evaluate", {
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
          subjectId: data.scope.applicationId,
          operation,
          ruleIds: [
            "RULE-REGULATED-DECISION-HUMAN-REVIEW",
            "RULE-USDA-REGION-VERIFICATION",
            "RULE-ADVERSE-ACTION-NOTICE-GATE",
          ],
          overlayIds: [
            "OVERLAY-CONSTITUTIONAL-HUMAN-REVIEW",
            "OVERLAY-REGULATORY-SOURCE-VERIFICATION",
            "OVERLAY-REGULATORY-ADVERSE-ACTION-BLOCK",
          ],
          facts: {
            farmAcreage: Number(farmAcreage),
            grossRevenue: Number(grossRevenue),
            debtServiceCoverageRatio: Number(debtCoverage),
            applicationScope: data.scope.applicationId,
          },
          metadata: {
            module: "Module 06 - Rule and Overlay Console",
            advisoryOnly: true,
            finalDecision: false,
            regulatoryRelianceRequiresHumanReview: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Rule overlay evaluation returned review."
        );
      } else {
        const ruleEvaluation = isRecord(json.ruleEvaluation)
          ? json.ruleEvaluation
          : {};
        setActionMessage(
          `Evaluation recorded: ${shortId(
            ruleEvaluation.id
          )} / ${normalizeStatus(ruleEvaluation.finalEffect)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown rule overlay action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, debtCoverage, farmAcreage, grossRevenue, loadAll, operation]);

  const blockedCount = data.ruleEvaluations.rows.filter((row) => {
    const evaluation = evaluationRecord(row);

    return normalizeStatus(evaluation.finalEffect).includes("Block");
  }).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Advisory Only",
    "Human Review Boundary",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="06"
          title="Rule and Overlay Evaluation"
          subtitle="Internal rule, overlay, and escalation review for governed application operations."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Rule Evaluations",
              value: data.ruleEvaluations.count,
              color: "#2563eb",
            },
            {
              label: "Applications",
              value: data.applications.count,
              color: "#0f766e",
            },
            {
              label: "Blocked Effects",
              value: blockedCount,
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
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.4fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Evaluation Controls</h2>
            <FieldLabel label="Operation">
              <select
                value={operation}
                onChange={(event) => setOperation(event.target.value)}
                style={inputStyle}
              >
                <option value="regulated-rule-overlay-review">
                  Regulated rule overlay review
                </option>
                <option value="external-source-reliance-review">
                  External source reliance review
                </option>
                <option value="adverse-action-boundary-review">
                  Adverse-action boundary review
                </option>
              </select>
            </FieldLabel>
            <FieldLabel label="Farm acreage">
              <input
                value={farmAcreage}
                onChange={(event) => setFarmAcreage(event.target.value)}
                style={inputStyle}
                inputMode="decimal"
              />
            </FieldLabel>
            <FieldLabel label="Gross revenue">
              <input
                value={grossRevenue}
                onChange={(event) => setGrossRevenue(event.target.value)}
                style={inputStyle}
                inputMode="decimal"
              />
            </FieldLabel>
            <FieldLabel label="Debt-service coverage ratio">
              <input
                value={debtCoverage}
                onChange={(event) => setDebtCoverage(event.target.value)}
                style={inputStyle}
                inputMode="decimal"
              />
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void runRuleEvaluation()}
            >
              Record Advisory Evaluation
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This console records governed rule output only. It does not create
              a final lending decision, notice, or external-source reliance
              event.
            </p>
          </div>

          <div style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Recent Evaluations</h2>
            {data.ruleEvaluations.rows.length === 0 ? (
              <EmptyState>
                No rule overlay evaluations are available for the current
                governed scope.
              </EmptyState>
            ) : (
              data.ruleEvaluations.rows.map((row) => {
                const evaluation = evaluationRecord(row);

                return (
                  <div
                    key={stringValue(evaluation.id) ?? JSON.stringify(row)}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
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
                      <strong>{shortId(evaluation.id)}</strong>
                      <StatusPill ok={evaluation.advisoryOnly !== false}>
                        {normalizeStatus(evaluation.finalEffect)}
                      </StatusPill>
                    </div>
                    <span style={{ color: "#475569" }}>
                      {normalizeStatus(evaluation.operation)} /{" "}
                      {normalizeStatus(evaluation.resultStatus)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Rules {relatedCount(row, "rules")} / Overlays{" "}
                      {relatedCount(row, "overlays")} / Evaluated{" "}
                      {formatDateTime(evaluation.evaluatedAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
