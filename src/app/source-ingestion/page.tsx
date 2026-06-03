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
 * Module 17 - Credentialed Source Ingestion Gate
 *
 * Master Volume Governance:
 * - Vol I: keeps credentialed source actions bound to accountable authority.
 * - Vol II: protects ToS, license, credential, borrower, and sovereign data boundaries.
 * - Vol III: consumes canonical connector, credential, application, and readiness records.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports credential review, circuit-breaker handling, outage review, and recovery.
 * - Vol V: enforces source authority, provenance, anti-bulk limits, replay, and no external request.
 */

const actorId = "module-17-credentialed-source-ingestion-gate";

type ModuleData = {
  applications: LoadResult;
  credentialedIngestion: LoadResult;
  connectors: LoadResult;
  readiness: LoadResult;
  sovereign: LoadResult;
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

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function ingestionRecord(row: unknown): Record<string, unknown> {
  return primaryRecord(row, ["ingestionEvent"]);
}

export default function CredentialedSourceIngestionGatePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    credentialedIngestion: emptyLoad,
    connectors: emptyLoad,
    readiness: emptyLoad,
    sovereign: emptyLoad,
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [externalTargetDomain, setExternalTargetDomain] = useState(
    "agency-portal.example"
  );
  const [sourceType, setSourceType] = useState("GOVERNMENT_PORTAL");
  const [credentialType, setCredentialType] = useState("SESSION_TOKEN");

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
    const scope = selectedRow
      ? scopeFromApplicationRows([selectedRow])
      : emptyScope;
    const selectedId = selectedRow ? applicationIdFromRow(selectedRow) : null;
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const [credentialedIngestion, connectors, readiness, sovereign] = scoped
      ? await Promise.all([
          loadJsonSurface(
            `/api/connectors/credentialed-ingestion/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=10&includeCredential=true&includeApplication=true&includeProperty=true`,
            ["credentialedIngestionRecords"]
          ),
          loadJsonSurface(
            `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
            ["connectorRecords"]
          ),
          loadJsonSurface(
            `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true`,
            ["readinessRecords"]
          ),
          loadJsonSurface(
            `/api/governance/sovereign-consent-gateway/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=8&includeApplication=true&includeProperty=true`,
            ["gatewayRecords"]
          ),
        ])
      : [emptyLoad, emptyLoad, emptyLoad, emptyLoad];

    setSelectedApplicationId(selectedId);
    setData({
      applications,
      credentialedIngestion,
      connectors,
      readiness,
      sovereign,
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
        "Module 17 Credentialed Source Ingestion Gate",
        "Internal pre-session credentialed source review surface",
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

  const recordPreSessionReview = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/connectors/credentialed-ingestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "governance",
          userId: actorId,
          actorId,
          initiatingActorId: actorId,
          borrowerId: data.scope.borrowerId,
          tenantId: data.scope.tenantId,
          applicationId: data.scope.applicationId,
          externalTargetDomain,
          vaultRefId: `module-17-vault-ref-${data.scope.applicationId}`,
          credentialType,
          externalPlatform: externalTargetDomain,
          holdingActorId: actorId,
          licenseType: "GOVERNED_OPERATIONAL_ACCESS",
          licenseScope: {
            applicationId: data.scope.applicationId,
            accessPurpose: "pre-session-governance-review",
          },
          expiryTimestamp: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          renewalStatus: "ACTIVE",
          acquisitionMethod: "SESSION",
          sourceType,
          sourceTrustClassification: "ADVISORY",
          requestedDataCategories: [
            "application-scoped-reference",
            "public-program-reference",
          ],
          humanAuthorizationRef: "module-17-human-authorization-required",
          sourceAuthorityRef: "module-17-source-authority-review-required",
          dataResidencyZone: "US",
          sovereigntyClassification: "RESTRICTED",
          tosComplianceAttestationRef: "module-17-tos-attestation-required",
          tosPermitsAccess: true,
          licenseAuthorizesCategories: true,
          useWithinLicenseScope: true,
          whitelistApproved: true,
          baselineSyncRef: "module-17-baseline-sync-log-required",
          isolationBoundaryConfirmed: true,
          provenanceEnvelopeRef: "module-17-provenance-envelope-required",
          bulkAcquisitionRequested: false,
          metadata: {
            module: "Module 17 - Credentialed Source Ingestion Gate",
            preSessionReviewOnly: true,
            externalRequestTransmitted: false,
            dataProcessedByEngine: false,
            credentialValueStored: false,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Credentialed source review returned review."
        );
      } else {
        const ingestionEvent = primaryRecord(json, ["ingestionEvent"]);
        const result = json.result && typeof json.result === "object"
          ? (json.result as Record<string, unknown>)
          : {};

        setActionMessage(
          `Pre-session review recorded: ${shortId(
            ingestionEvent.id
          )} / ${normalizeStatus(result.sessionOutcome)}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unknown credentialed source action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [
    credentialType,
    data.scope,
    externalTargetDomain,
    loadAll,
    sourceType,
  ]);

  const readyForSessionCount = data.credentialedIngestion.rows.filter(
    (row) => ingestionRecord(row).readyForSession === true
  ).length;
  const circuitBreakerCount = data.credentialedIngestion.rows.filter(
    (row) => ingestionRecord(row).circuitBreakerTriggered === true
  ).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Credentialed Review",
    "No External Request",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="17"
          title="Credentialed Source Ingestion Gate"
          subtitle="Pre-session review for credentialed agency, license, ToS, whitelist, provenance, and isolation controls."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Ingestion Reviews",
              value: data.credentialedIngestion.count,
              color: "#2563eb",
            },
            {
              label: "Ready Not Started",
              value: readyForSessionCount,
              color: "#0f766e",
            },
            {
              label: "Circuit Breakers",
              value: circuitBreakerCount,
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
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.45fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Pre-Session Controls</h2>
            <FieldLabel label="External target domain">
              <input
                value={externalTargetDomain}
                onChange={(event) => setExternalTargetDomain(event.target.value)}
                style={inputStyle}
              />
            </FieldLabel>
            <FieldLabel label="Source type">
              <select
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
                style={inputStyle}
              >
                <option value="GOVERNMENT_PORTAL">Government portal</option>
                <option value="LICENSED_API">Licensed API</option>
                <option value="CREDENTIALED_SESSION">
                  Credentialed session
                </option>
                <option value="ENVIRONMENTAL_GIS">Environmental GIS</option>
                <option value="PUBLIC_REGISTRY">Public registry</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Credential type">
              <select
                value={credentialType}
                onChange={(event) => setCredentialType(event.target.value)}
                style={inputStyle}
              >
                <option value="SESSION_TOKEN">Session token reference</option>
                <option value="API_KEY">API key reference</option>
                <option value="LOGIN_CREDENTIAL">Login credential reference</option>
              </select>
            </FieldLabel>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void recordPreSessionReview()}
            >
              Record Pre-Session Review
            </ActionButton>
            {actionMessage ? (
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                {actionMessage}
              </p>
            ) : null}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This gate records credentialed-source readiness only. It does not
              transmit external requests, fetch official data, store credential
              values, or process data through scoring engines.
            </p>
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <div style={{ ...panelStyle, padding: 14, display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Interoperability Links</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  ["/applications", "Module 03", "Application scope"],
                  ["/connectors", "Module 10", "Connector authority"],
                  ["/promotion", "Module 14", "Live-action holds"],
                  ["/case-command", "Module 15", "Case command"],
                  ["/evidence-packets", "Module 16", "Evidence packet"],
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
              <h2 style={{ margin: 0, fontSize: 20 }}>Ingestion Reviews</h2>
              {data.credentialedIngestion.rows.length === 0 ? (
                <EmptyState>
                  No credentialed ingestion records are available for the
                  current governed scope.
                </EmptyState>
              ) : (
                data.credentialedIngestion.rows.map((row) => {
                  const ingestion = ingestionRecord(row);
                  const id =
                    stringValue(ingestion.scrapingEventId) ??
                    stringValue(ingestion.id);

                  return (
                    <div
                      key={id ?? JSON.stringify(row)}
                      style={{
                        display: "grid",
                        gap: 6,
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
                        <StatusPill ok={ingestion.externalRequestTransmitted !== true}>
                          {normalizeStatus(ingestion.sessionOutcome)}
                        </StatusPill>
                      </div>
                      <span style={{ color: "#475569" }}>
                        {stringValue(ingestion.externalTargetDomain) ??
                          "Target not recorded"}{" "}
                        / {normalizeStatus(ingestion.sourceType)}
                      </span>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        Ready {normalizeStatus(ingestion.readyForSession)} /
                        External request{" "}
                        {normalizeStatus(ingestion.externalRequestTransmitted)} /
                        Created {formatDateTime(ingestion.createdAt)}
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
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              }}
            >
              {[
                ["Connector Records", data.connectors.count, "/connectors"],
                ["Readiness Reviews", data.readiness.count, "/promotion"],
                ["Sovereign Gateways", data.sovereign.count, "/promotion"],
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
          </section>
        </section>
      </div>
    </main>
  );
}
