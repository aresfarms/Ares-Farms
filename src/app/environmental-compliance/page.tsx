"use client";

import Link from "next/link";
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
 * Module 21 - Environmental Compliance Review
 *
 * Master Volume Governance:
 * - Vol I: preserves Environmental Engineering Spoke authority and Banker
 *   Spoke isolation.
 * - Vol II: keeps NEPA / USDA environmental pathway review advisory,
 *   regulated, and human-review bound.
 * - Vol III: consumes canonical environmental_compliance_records and borrower
 *   protection fee controls through governed admin-read APIs.
 * - Vol III-B: carries classification, observability, version lineage, and
 *   record access through the runtime boundary.
 * - Vol IV: supports environmental exception review, escalation, recovery, and
 *   evidence preparation.
 * - Vol V: enforces provider-license verification, borrower fee autonomy,
 *   source authority, controlled disclosure, and no official report posture.
 * - Vol VI: implements a portable internal vertical surface without live
 *   provider engagement or external environmental action.
 */

const actorId = "module-21-environmental-compliance-review";

type ModuleData = {
  applications: LoadResult;
  environmentalCompliance: LoadResult;
  sourceIngestion: LoadResult;
  promotion: LoadResult;
  evidence: LoadResult;
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

const safeStatusMessages = [
  "Your document was received.",
  "Human review is pending.",
  "More information may be needed.",
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function complianceRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["complianceRecord"]);
}

function feeControl(row: unknown): Record<string, unknown> {
  if (isRecord(row) && isRecord(row.feeControl)) {
    return row.feeControl;
  }

  return {};
}

function blockerList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => normalizeStatus(item)).filter(Boolean)
    : [];
}

function money(value: unknown): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function EnvironmentalComplianceReviewPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    environmentalCompliance: emptyLoad,
    sourceIngestion: emptyLoad,
    promotion: emptyLoad,
    evidence: emptyLoad,
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pathwayType, setPathwayType] = useState("USDA_BI_REAL_ESTATE");
  const [assessmentType, setAssessmentType] = useState("PHASE_I_ESA");
  const [providerType, setProviderType] = useState(
    "ENVIRONMENTAL_ENGINEERING_SPOKE"
  );
  const [assessmentOutcome, setAssessmentOutcome] = useState("CLEARED");
  const [providerLicenseVerified, setProviderLicenseVerified] = useState(true);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=14&includeProperty=true`,
      ["applications"]
    );
    const selectedRow =
      applications.rows.find(
        (row) => applicationIdFromRow(row) === selectedApplicationId
      ) ?? applications.rows[0];
    const selectedId = selectedRow ? applicationIdFromRow(selectedRow) : null;
    const scope = selectedRow
      ? scopeFromApplicationRows([selectedRow])
      : emptyScope;
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const [
      environmentalCompliance,
      sourceIngestion,
      promotion,
      evidence,
    ] = scoped
      ? await Promise.all([
          loadJsonSurface(
            `/api/governance/environmental-compliance/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=10&includeApplication=true&includeProperty=true&includeFeeControl=true`,
            ["environmentalComplianceRecords"]
          ),
          loadJsonSurface(
            `/api/connectors/credentialed-ingestion/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=6&includeCredential=true&includeApplication=true&includeProperty=true`,
            ["credentialedIngestionRecords"]
          ),
          loadJsonSurface(
            `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=6&includeApplication=true&includeProperty=true`,
            ["readinessRecords"]
          ),
          loadJsonSurface(
            `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=6&includeApplication=true&includeProperty=true`,
            ["reports"]
          ),
        ])
      : [emptyLoad, emptyLoad, emptyLoad, emptyLoad];

    setSelectedApplicationId(selectedId);
    setData({
      applications,
      environmentalCompliance,
      sourceIngestion,
      promotion,
      evidence,
      scope,
    });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 21 Environmental Compliance Review",
        "Internal environmental pathway review surface",
        ADVISORY_ONLY_DISCLOSURE,
        BORROWER_PORTABILITY_DISCLOSURE,
        LENDER_READY_DISCLOSURE,
        ...safeStatusMessages,
        "No official environmental report has been generated.",
        "No live environmental provider action has been performed.",
      ],
      context: {
        borrowerPortabilityAvailable: true,
        freeTierBaselineReadinessAvailable: true,
        lenderReadyDisclosurePresent: true,
      },
    });
  }, []);

  const recordEnvironmentalReview = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/governance/environmental-compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          actorId,
          tenantId: data.scope.tenantId,
          borrowerId: data.scope.borrowerId,
          applicationId: data.scope.applicationId,
          journeyId: data.scope.applicationId,
          pathwayType,
          triggeringPathway: `${pathwayType}_ENVIRONMENTAL_REVIEW`,
          realPropertyCollateral: pathwayType !== "EQUIPMENT_FINANCING",
          environmentalStatuteTriggered: pathwayType !== "WORKING_CAPITAL",
          assessmentType,
          assessmentProviderType: providerType,
          providerName:
            providerType === "APPROVED_EXTERNAL_FIRM"
              ? "Approved External Environmental Firm"
              : "Environmental Engineering Spoke",
          providerLicenseRef: providerLicenseVerified
            ? `license://${data.scope.applicationId}/environmental-provider`
            : null,
          providerLicenseVerified,
          assessmentOutcome,
          feeAmount: 225000,
          standardMarketRateAmount: 250000,
          feeDisclosureRef: `fee-disclosure://${data.scope.applicationId}/environmental`,
          feeDisclosedBeforeInitiation: true,
          borrowerExternalFirmRightPreserved: true,
          noFeeSurchargeOrPreference: true,
          spokeIsolationConfirmed: true,
          bankerSpokeIsolated: true,
          auditAnchorRef: `audit://${data.scope.applicationId}/environmental-review`,
          escalationRef:
            assessmentOutcome === "CLEARED"
              ? null
              : `escalation://${data.scope.applicationId}/environmental-review`,
          metadata: {
            module: "Module 21 - Environmental Compliance Review",
            advisoryOnly: true,
            officialEnvironmentalReportGenerated: false,
            liveExternalActionPerformed: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ??
            "Environmental compliance review returned review."
        );
      } else {
        const record = primaryRecord(json, ["complianceRecord"]);
        const result = isRecord(json.result) ? json.result : {};

        setActionMessage(
          `Environmental review recorded: ${shortId(
            record.complianceRecordId ?? record.id
          )} / ${normalizeStatus(result.loanPathwayAdvancementAllowed)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown environmental compliance action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [
    assessmentOutcome,
    assessmentType,
    data.scope,
    loadAll,
    pathwayType,
    providerLicenseVerified,
    providerType,
  ]);

  const blockedCount = data.environmentalCompliance.rows.filter((row) => {
    const record = complianceRecord(row);

    return record.loanPathwayAdvancementAllowed !== true;
  }).length;
  const triggeredCount = data.environmentalCompliance.rows.filter((row) => {
    const record = complianceRecord(row);

    return record.environmentalAssessmentTriggered === true;
  }).length;
  const unsafeActionCount = data.environmentalCompliance.rows.filter((row) => {
    const record = complianceRecord(row);

    return (
      record.officialReportGenerated === true ||
      record.liveExternalActionPerformed === true
    );
  }).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Internal Only",
    "No Official Reports",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="21"
          title="Environmental Compliance Review"
          subtitle="Environmental pathway, provider-license, fee-control, spoke-isolation, and audit-anchor review without official environmental reports or live provider action."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Compliance Records",
              value: data.environmentalCompliance.count,
              color: "#2563eb",
            },
            {
              label: "Triggered Reviews",
              value: triggeredCount,
              color: "#7c3aed",
            },
            {
              label: "Blocked or Pending",
              value: blockedCount,
              color: blockedCount > 0 ? "#be123c" : "#0f766e",
            },
            {
              label: "Unsafe Actions",
              value: unsafeActionCount,
              color: unsafeActionCount > 0 ? "#be123c" : "#0f766e",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Review Controls</h2>

            <FieldLabel label="Application scope">
              <select
                value={selectedApplicationId ?? ""}
                onChange={(event) =>
                  setSelectedApplicationId(event.target.value || null)
                }
                style={inputStyle}
              >
                {data.applications.rows.length === 0 ? (
                  <option value="">No applications loaded</option>
                ) : null}
                {data.applications.rows.map((row) => {
                  const application = primaryRecord(row, ["application"]);
                  const id = applicationIdFromRow(row);

                  return (
                    <option key={id ?? JSON.stringify(row)} value={id ?? ""}>
                      {shortId(id)} / {normalizeStatus(application.reviewStatus)}
                    </option>
                  );
                })}
              </select>
            </FieldLabel>

            <FieldLabel label="Pathway">
              <select
                value={pathwayType}
                onChange={(event) => setPathwayType(event.target.value)}
                style={inputStyle}
              >
                <option value="USDA_BI_REAL_ESTATE">USDA BI real estate</option>
                <option value="COMMUNITY_FACILITIES">
                  Community facilities
                </option>
                <option value="REAP_INSTALLATION">REAP installation</option>
                <option value="EQUIPMENT_FINANCING">
                  Equipment financing
                </option>
                <option value="WORKING_CAPITAL">Working capital</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Assessment type">
              <select
                value={assessmentType}
                onChange={(event) => setAssessmentType(event.target.value)}
                style={inputStyle}
              >
                <option value="NEPA_SCREENING">NEPA screening</option>
                <option value="PHASE_I_ESA">Phase I ESA</option>
                <option value="PHASE_II_ESA">Phase II ESA</option>
                <option value="PHASE_III_ESA">Phase III ESA</option>
                <option value="STATE_ENVIRONMENTAL_REVIEW">
                  State environmental review
                </option>
              </select>
            </FieldLabel>

            <FieldLabel label="Provider type">
              <select
                value={providerType}
                onChange={(event) => setProviderType(event.target.value)}
                style={inputStyle}
              >
                <option value="ENVIRONMENTAL_ENGINEERING_SPOKE">
                  Environmental Engineering Spoke
                </option>
                <option value="APPROVED_EXTERNAL_FIRM">
                  Approved external firm
                </option>
              </select>
            </FieldLabel>

            <FieldLabel label="Assessment outcome">
              <select
                value={assessmentOutcome}
                onChange={(event) => setAssessmentOutcome(event.target.value)}
                style={inputStyle}
              >
                <option value="CLEARED">Lineage confirmed</option>
                <option value="CONDITIONAL">Conditional review</option>
                <option value="ESCALATED">Escalated review</option>
                <option value="FAILED">Failed gate</option>
              </select>
            </FieldLabel>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#334155",
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={providerLicenseVerified}
                onChange={(event) =>
                  setProviderLicenseVerified(event.target.checked)
                }
              />
              Provider license verified
            </label>

            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordEnvironmentalReview()}
            >
              Record Environmental Review
            </ActionButton>

            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}

            <div style={{ display: "grid", gap: 6 }}>
              {safeStatusMessages.map((message) => (
                <StatusPill key={message} ok>
                  {message}
                </StatusPill>
              ))}
            </div>
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <div style={{ ...panelStyle, padding: 14, display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Interoperability Links</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
                  gap: 10,
                }}
              >
                {[
                  ["/applications", "Module 03", "Application scope"],
                  ["/source-ingestion", "Module 17", "Source authority"],
                  ["/promotion", "Module 14", "Live-action holds"],
                  ["/evidence-packets", "Module 16", "Evidence packet"],
                  ["/case-command", "Module 15", "Case command"],
                ].map(([href, moduleNumber, label]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "grid",
                      gap: 4,
                      padding: 12,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      color: "#172033",
                      textDecoration: "none",
                    }}
                  >
                    <strong>{moduleNumber}</strong>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ ...panelStyle, padding: 14, display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Environmental Records</h2>
              {data.environmentalCompliance.rows.length === 0 ? (
                <EmptyState>
                  No environmental compliance records are available for the
                  current governed scope.
                </EmptyState>
              ) : (
                data.environmentalCompliance.rows.map((row) => {
                  const record = complianceRecord(row);
                  const fee = feeControl(row);
                  const blockers = blockerList(record.blockerReasons);
                  const id =
                    stringValue(record.complianceRecordId) ??
                    stringValue(record.id);
                  const safe =
                    record.officialReportGenerated !== true &&
                    record.liveExternalActionPerformed !== true &&
                    record.loanPathwayAdvancementAllowed === true;

                  return (
                    <div
                      key={id ?? JSON.stringify(row)}
                      style={{
                        display: "grid",
                        gap: 8,
                        padding: 12,
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>{shortId(id)}</strong>
                        <StatusPill ok={safe}>
                          {normalizeStatus(record.assessmentRequirementStatus)}
                        </StatusPill>
                      </div>

                      <span style={{ color: "#475569" }}>
                        {normalizeStatus(record.pathwayType)} /{" "}
                        {normalizeStatus(record.assessmentType)} /{" "}
                        {normalizeStatus(record.assessmentOutcome)}
                      </span>

                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        Provider {normalizeStatus(record.assessmentProviderType)}
                        {" / "}
                        License {normalizeStatus(record.providerLicenseVerified)}
                        {" / "}
                        Fee {money(record.feeAmount)}
                      </span>

                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        Fee disclosure {normalizeStatus(fee.disclosureStatus)}
                        {" / "}
                        External firm right{" "}
                        {normalizeStatus(
                          record.borrowerExternalFirmRightPreserved
                        )}
                        {" / "}
                        Spoke isolation{" "}
                        {normalizeStatus(record.spokeIsolationConfirmed)}
                      </span>

                      {blockers.length > 0 ? (
                        <span style={{ color: "#be123c", fontSize: 13 }}>
                          Blockers: {blockers.join(", ")}
                        </span>
                      ) : null}

                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        Official report{" "}
                        {normalizeStatus(record.officialReportGenerated)}
                        {" / "}
                        Live action{" "}
                        {normalizeStatus(record.liveExternalActionPerformed)}
                        {" / "}
                        Created {formatDateTime(record.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              }}
            >
              {[
                ["Source Reviews", data.sourceIngestion.count, "/source-ingestion"],
                ["Promotion Holds", data.promotion.count, "/promotion"],
                ["Evidence Records", data.evidence.count, "/evidence-packets"],
              ].map(([label, value, href]) => (
                <Link
                  key={label}
                  href={String(href)}
                  style={{
                    ...panelStyle,
                    padding: 14,
                    display: "grid",
                    gap: 8,
                    color: "#172033",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
                    {label}
                  </span>
                  <strong style={{ fontSize: 26 }}>{String(value)}</strong>
                </Link>
              ))}
            </div>

            {!contentClaims.ok ? (
              <div style={{ ...panelStyle, padding: 14, color: "#be123c" }}>
                Content claims review is required before promotion.
              </div>
            ) : null}

            <div style={{ ...panelStyle, padding: 14, display: "grid", gap: 6 }}>
              <strong>Governance Boundary</strong>
              <span style={{ color: "#475569", lineHeight: 1.5 }}>
                This surface records review posture only. It does not generate
                official environmental reports, make loan or permitting
                determinations, contact providers, fetch live agency data, or
                perform external action.
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                Last refresh: {lastLoadedAt ?? "Not loaded"}
              </span>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
