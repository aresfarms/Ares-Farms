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
  EmptyState,
  LoadResult,
  ModuleHeader,
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
  loadJsonSurface,
  moduleContainerStyle,
  moduleShellStyle,
  panelStyle,
  primaryRecord,
  scopeFromApplicationRows,
  scopeQuery,
  shortId,
  stringValue,
} from "@/app/internalModuleKit";

/**
 * Module 20 - Integrated Module Readiness Control Tower
 *
 * Master Volume Governance:
 * - Vol 0: preserves whole-platform orientation before additional expansion.
 * - Vol I: keeps module progression subordinate to constitutional governance.
 * - Vol II: protects regulated, borrower, partner, and sovereign boundaries.
 * - Vol III: consumes replay-safe backend surfaces rather than bypassing modules.
 * - Vol III-B: surfaces classification, observability, version, and evidence posture.
 * - Vol IV: supports readiness review, deployment handoff, rollback, and operator controls.
 * - Vol V: enforces claims governance, replay, controlled disclosure, and human review.
 */

const actorId = "module-20-integrated-module-readiness-control-tower";

type ReadinessSurface = {
  moduleNumber: string;
  label: string;
  href: string;
  path: (scope: ModuleScope) => string | null;
  collectionKeys: string[];
  readinessRole: string;
};

type ReadinessResult = ReadinessSurface & LoadResult;

type ModuleData = {
  applications: LoadResult;
  surfaces: ReadinessResult[];
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

const moduleSurfaces: ReadinessSurface[] = [
  {
    moduleNumber: "01",
    label: "Governance Operations",
    href: "/governance",
    path: () =>
      `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=4`,
    collectionKeys: ["auditEvents", "canonicalLedgerRows", "canonicalMeta"],
    readinessRole: "Governance, audit, and replay posture",
  },
  {
    moduleNumber: "02",
    label: "Operator Queue",
    href: "/operator-queue",
    path: (scope) =>
      `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["queueItems"],
    readinessRole: "Operator queue interoperability",
  },
  {
    moduleNumber: "03",
    label: "Application Operations",
    href: "/applications",
    path: (scope) =>
      `/api/applications/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeProperty=true`,
    collectionKeys: ["applications"],
    readinessRole: "Application and property scope",
  },
  {
    moduleNumber: "04",
    label: "Document Intake",
    href: "/documents",
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["documents"],
    readinessRole: "Document metadata and storage handoff",
  },
  {
    moduleNumber: "05",
    label: "Human Review",
    href: "/reviews",
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true&includeTransitions=true`,
    collectionKeys: ["reviews"],
    readinessRole: "Human review and transition controls",
  },
  {
    moduleNumber: "06",
    label: "Rules and Overlays",
    href: "/rules",
    path: (scope) =>
      `/api/rules/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeRules=true&includeOverlays=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["ruleRecords"],
    readinessRole: "Advisory rule and overlay posture",
  },
  {
    moduleNumber: "07",
    label: "Decision Controls",
    href: "/decisions",
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
    collectionKeys: ["reviews"],
    readinessRole: "Final-action gate dependencies",
  },
  {
    moduleNumber: "08",
    label: "Notice Lifecycle",
    href: "/notices",
    path: (scope) =>
      `/api/notices/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeProviderExecutions=true&includeReceipts=true&includeResolutions=true`,
    collectionKeys: ["noticeRecords"],
    readinessRole: "Notice packet and exception controls",
  },
  {
    moduleNumber: "09",
    label: "Audit Replay",
    href: "/audit-replay",
    path: () =>
      `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=4`,
    collectionKeys: ["auditEvents", "canonicalLedgerRows", "canonicalMeta"],
    readinessRole: "Replay evidence and ledger access",
  },
  {
    moduleNumber: "10",
    label: "Connector Certification",
    href: "/connectors",
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["connectorRecords"],
    readinessRole: "Source authority and adapter controls",
  },
  {
    moduleNumber: "11",
    label: "Partner Workflows",
    href: "/partners",
    path: (scope) =>
      `/api/partners/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["partnerWorkflows"],
    readinessRole: "Lender and sponsor coordination posture",
  },
  {
    moduleNumber: "12",
    label: "Billing Controls",
    href: "/billing",
    path: (scope) =>
      scope.tenantId
        ? `/api/billing/admin?role=governance&userId=${actorId}${scopeQuery(
            scope,
            ["tenantId"]
          )}&limit=4&includeEntitlement=true`
        : null,
    collectionKeys: ["billingEvents"],
    readinessRole: "Billing and entitlement posture",
  },
  {
    moduleNumber: "13",
    label: "Reports",
    href: "/reports",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    readinessRole: "Advisory report and export posture",
  },
  {
    moduleNumber: "14",
    label: "Promotion Gate",
    href: "/promotion",
    path: (scope) =>
      `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["readinessRecords"],
    readinessRole: "Live-action readiness and hold posture",
  },
  {
    moduleNumber: "15",
    label: "Case Command",
    href: "/case-command",
    path: (scope) =>
      `/api/applications/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeProperty=true`,
    collectionKeys: ["applications"],
    readinessRole: "Cross-module case scope",
  },
  {
    moduleNumber: "16",
    label: "Evidence Packets",
    href: "/evidence-packets",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&reportType=GOVERNANCE_EVIDENCE_SUMMARY&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    readinessRole: "Evidence packet advisory summaries",
  },
  {
    moduleNumber: "17",
    label: "Source Ingestion",
    href: "/source-ingestion",
    path: (scope) =>
      `/api/connectors/credentialed-ingestion/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeCredential=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["credentialedIngestionRecords"],
    readinessRole: "Credentialed source pre-session posture",
  },
  {
    moduleNumber: "18",
    label: "Exception Remediation",
    href: "/exception-remediation",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&reportType=EXCEPTION_REMEDIATION_MEMO&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    readinessRole: "Remediation memo and recovery posture",
  },
  {
    moduleNumber: "19",
    label: "Data Rights",
    href: "/data-rights",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&reportType=BORROWER_PORTABILITY_PACKAGE_SUMMARY&limit=4&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    readinessRole: "Borrower review, export, and transport posture",
  },
  {
    moduleNumber: "21",
    label: "Environmental Compliance",
    href: "/environmental-compliance",
    path: (scope) =>
      `/api/governance/environmental-compliance/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=4&includeApplication=true&includeProperty=true&includeFeeControl=true`,
    collectionKeys: ["environmentalComplianceRecords"],
    readinessRole:
      "Environmental pathway, fee, provider-license, and spoke-isolation posture",
  },
  {
    moduleNumber: "22",
    label: "Live Scraper Activation",
    href: "/live-scraper-activation",
    path: () =>
      `/api/governance/live-scraper-activation?actorId=${actorId}&limit=4`,
    collectionKeys: ["sourceReviews"],
    readinessRole:
      "Scraper/source-stack activation gate, live-fetch block, and human-promotion posture",
  },
  {
    moduleNumber: "23",
    label: "Source Legal Review",
    href: "/source-legal-review",
    path: () =>
      `/api/governance/source-legal-review?actorId=${actorId}&limit=4`,
    collectionKeys: ["sourceLegalReviews"],
    readinessRole:
      "Source ToS, licensing, anti-bulk, permitted-use, and qualified-review posture",
  },
  {
    moduleNumber: "24",
    label: "Source Promotion Packets",
    href: "/source-promotion-packets",
    path: () =>
      `/api/governance/source-promotion-packets?actorId=${actorId}&limit=4`,
    collectionKeys: ["sourcePromotionPackets"],
    readinessRole:
      "Source promotion evidence packet, replay, provenance, adapter, monitoring, rollback, and human-approval posture",
  },
  {
    moduleNumber: "25",
    label: "Source Production Readiness",
    href: "/source-production-readiness",
    path: () =>
      `/api/governance/source-production-readiness?actorId=${actorId}&limit=4`,
    collectionKeys: ["sourceProductionReadinessReviews"],
    readinessRole:
      "Final controlled-promotion readiness, activation ceremony, kill-switch, rollback, incident, audit, claims, and human-approval posture",
  },
  {
    moduleNumber: "26",
    label: "Controlled Promotion Activation",
    href: "/controlled-promotion-activation",
    path: () =>
      `/api/governance/controlled-promotion-activation?actorId=${actorId}&limit=4`,
    collectionKeys: ["controlledPromotionActivationReviews"],
    readinessRole:
      "Activation ceremony review, approver quorum, environment lock, kill-switch, rollback, audit, and post-activation verification posture",
  },
  {
    moduleNumber: "27",
    label: "Production Portal Readiness",
    href: "/production-portal-readiness",
    path: () =>
      `/api/governance/production-portal-readiness?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionPortalReadinessReviews"],
    readinessRole:
      "Production portal launch preflight, portable surface, auth, security, audit, replay, claims, rollback, incident, support, and launch-hold posture",
  },
  {
    moduleNumber: "28",
    label: "Production Launch Evidence",
    href: "/production-launch-evidence",
    path: () =>
      `/api/governance/production-launch-evidence?actorId=${actorId}&limit=4`,
    collectionKeys: ["launchEvidencePackets"],
    readinessRole:
      "Go-live evidence packet, final launch hold, production auth, security, audit, backend, claims, support, rollback, and qualified-release posture",
  },
  {
    moduleNumber: "29",
    label: "Deployment Environment Readiness",
    href: "/deployment-environment-readiness",
    path: () =>
      `/api/governance/deployment-environment-readiness?actorId=${actorId}&limit=4`,
    collectionKeys: ["deploymentEnvironmentReviews"],
    readinessRole:
      "Deployment environment, release-candidate, secrets, migrations, DNS, CDN, TLS, WAF, monitoring, backup, rollback, incident, support, and release-manager posture",
  },
  {
    moduleNumber: "30",
    label: "Release Candidate Freeze",
    href: "/release-candidate-freeze",
    path: () =>
      `/api/governance/release-candidate-freeze?actorId=${actorId}&limit=4`,
    collectionKeys: ["releaseCandidateFreezePlans"],
    readinessRole:
      "Release-candidate freeze, final build, typecheck, backend smoke, integration smoke, content claims, release notes, secrets, migrations, edge, monitoring, backup, rollback, incident, support, communications, and release-manager posture",
  },
  {
    moduleNumber: "31",
    label: "Production Cutover Hold",
    href: "/production-cutover-hold",
    path: () =>
      `/api/governance/production-cutover-hold?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionCutoverHoldReviews"],
    readinessRole:
      "Production cutover hold, launch hold, deployment hold, freeze hold, secrets, migrations, DNS, CDN, TLS, WAF, monitoring, backup, rollback, incident, support, public API exposure, portal launch, and release-manager posture",
  },
  {
    moduleNumber: "32",
    label: "Production Release Board",
    href: "/production-release-board",
    path: () =>
      `/api/governance/production-release-board?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionReleaseBoardReviews"],
    readinessRole:
      "Production release board evidence, quorum, release-manager, security, compliance, operations, support, public-copy, incident, rollback, communications, launch hold, cutover authority, public API exposure, and production portal launch posture",
  },
  {
    moduleNumber: "33",
    label: "Production Operations Monitoring",
    href: "/production-operations-monitoring",
    path: () =>
      `/api/governance/production-operations-monitoring?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionOperationsMonitoringReviews"],
    readinessRole:
      "Production operations monitoring, alerting, on-call, incident bridge, rollback, backup, restore, audit export, support, communications, emergency hold, and kill-switch posture",
  },
  {
    moduleNumber: "34",
    label: "Production Incident Response Readiness",
    href: "/production-incident-response-readiness",
    path: () =>
      `/api/governance/production-incident-response-readiness?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionIncidentResponseReadinessReviews"],
    readinessRole:
      "Production incident command, severity, escalation, incident bridge, rollback, data integrity, replay, support, communications, public status, emergency hold, and kill-switch posture",
  },
  {
    moduleNumber: "35",
    label: "Production Support Communications Readiness",
    href: "/production-support-communications-readiness",
    path: () =>
      `/api/governance/production-support-communications-readiness?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionSupportCommunicationsReadinessReviews"],
    readinessRole:
      "Production support routing, customer-safe language, public status, support escalation, accessibility, translation, redaction, data rights, audit, replay, notice boundaries, and communications freeze posture",
  },
  {
    moduleNumber: "36",
    label: "Production Final Authority",
    href: "/production-final-authority",
    path: () =>
      `/api/governance/production-final-authority?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionFinalAuthorityReviews"],
    readinessRole:
      "Production final authority, go-live, qualified release manager, constitutional authority, hold release, deployment, public exposure, support communications, audit, replay, privacy, redaction, claims, and live-action posture",
  },
  {
    moduleNumber: "37",
    label: "Production Activation Ceremony",
    href: "/production-activation-ceremony",
    path: () =>
      `/api/governance/production-activation-ceremony?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionActivationCeremonyReviews"],
    readinessRole:
      "Production activation ceremony, dual-control quorum, credential release, deployment sequence, monitoring, rollback, incident, support, communications, audit, replay, privacy, redaction, claims, post-activation verification, public exposure, and live-action posture",
  },
  {
    moduleNumber: "38",
    label: "Production Post-Activation Verification",
    href: "/production-post-activation-verification",
    path: () =>
      `/api/governance/production-post-activation-verification?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionPostActivationVerificationReviews"],
    readinessRole:
      "Production post-activation verification, watch-window ownership, synthetic health checks, public surface checks, audit/replay export, monitoring, rollback, support, communications, privacy, redaction, claims, production health, public exposure, and live-action posture",
  },
  {
    moduleNumber: "39",
    label: "Production Reliance Verification",
    href: "/production-reliance-verification",
    path: () =>
      `/api/governance/production-reliance-verification?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionRelianceVerificationReviews"],
    readinessRole:
      "Production reliance, public verification, public verification gateway, public artifact publication, external reliance disclosure, regulatory reliance, official reliance, legal advice, public claims, audit/replay, public DTO, source authority, report, notice, payment, public exposure, and live-action posture",
  },
  {
    moduleNumber: "40",
    label: "Production Regulatory Examination",
    href: "/production-regulatory-examination",
    path: () =>
      `/api/governance/production-regulatory-examination?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionRegulatoryExaminationReviews"],
    readinessRole:
      "Production regulatory examination, evidence archive, retention, legal hold, regulator submission, portal upload, official regulator response, examiner disclosure, audit/replay, redaction, public records, public verification, official reliance, legal advice, report, notice, payment, public exposure, and live-action posture",
  },
  {
    moduleNumber: "41",
    label: "Production Regulatory Response",
    href: "/production-regulatory-response",
    path: () =>
      `/api/governance/production-regulatory-response?actorId=${actorId}&limit=4`,
    collectionKeys: ["productionRegulatoryResponseReviews"],
    readinessRole:
      "Production regulatory response, corrective action, remediation, examiner finding closure, legal hold, official regulator response, audit/replay, redaction, public records, public verification, official reliance, legal advice, report, notice, payment, public exposure, and live-action posture",
  },
  {
    moduleNumber: "42",
    label: "Build Preservation",
    href: "/build-preservation",
    path: () =>
      `/api/governance/build-preservation?actorId=${actorId}&limit=4`,
    collectionKeys: ["buildPreservationReviews"],
    readinessRole:
      "Build preservation, checkpoint BR-2026-06-01-M41, backend verification, production build evidence, route inventory, event contracts, handoffs, public surfaces, tree drift detection, ignored sensitive files, Master Volume 0-VI conformance, archive evidence, and production authority blocks",
  },
];

function readinessScore(surface: ReadinessResult): string {
  if (!surface.ok) {
    return "Review";
  }

  if (surface.count > 0) {
    return "Connected";
  }

  return "Available";
}

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

export default function IntegratedModuleReadinessControlTowerPage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    surfaces: [],
    scope: emptyScope,
  });
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);

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
    const surfaces = scoped
      ? await Promise.all(
          moduleSurfaces.map(async (surface) => {
            const path = surface.path(scope);
            const result = path
              ? await loadJsonSurface(path, surface.collectionKeys)
              : emptyLoad;

            return {
              ...surface,
              ...result,
            };
          })
        )
      : moduleSurfaces.map((surface) => ({ ...surface, ...emptyLoad }));

    setSelectedApplicationId(selectedId);
    setData({ applications, surfaces, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, [selectedApplicationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 20 Integrated Module Readiness Control Tower",
        "Internal readiness control surface for governed modules 01 through 42",
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

  const connected = data.surfaces.filter((surface) => surface.ok).length;
  const active = data.surfaces.filter((surface) => surface.count > 0).length;
  const review = data.surfaces.filter((surface) => !surface.ok).length;
  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Modules 01-42 Linked",
    "No Production Promotion",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="20"
          title="Integrated Module Readiness Control Tower"
          subtitle="Whole-system readiness view connecting governed modules 01 through 42 without promoting live external actions."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Applications",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Connected Modules",
              value: connected,
              color: "#0f766e",
            },
            {
              label: "Modules With Records",
              value: active,
              color: "#7c3aed",
            },
            {
              label: "Review Needed",
              value: review,
              color: "#be123c",
            },
          ]}
        />

        <section
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 6, maxWidth: 760 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>
                Post-Completion Handoff
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                Review the seeded internal demo case across Modules 01-42 while
                production promotion, live external calls, official reports,
                payments, notices, and final decisions remain blocked.
              </p>
            </div>
            <Link
              href="/operator-demo"
              style={{
                minHeight: 40,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 14px",
                border: "1px solid #1f4f7a",
                borderRadius: 8,
                background: "#1f4f7a",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Open Handoff
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.8fr) minmax(0, 1.5fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Readiness Scope</h2>
            {data.applications.rows.length === 0 ? (
              <EmptyState>No governed applications are available yet.</EmptyState>
            ) : (
              data.applications.rows.slice(0, 8).map((row) => {
                const application = primaryRecord(row, ["application"]);
                const id = stringValue(application.id);
                const activeScope = id === data.scope.applicationId;

                return (
                  <button
                    key={id ?? JSON.stringify(row)}
                    type="button"
                    onClick={() => setSelectedApplicationId(id)}
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: 12,
                      border: activeScope
                        ? "2px solid #1f4f7a"
                        : "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#ffffff",
                      color: "#172033",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{shortId(id)}</strong>
                    <span style={{ color: "#64748b", fontSize: 13 }}>
                      Tenant {shortId(application.tenantId)}
                    </span>
                  </button>
                );
              })
            )}
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              This tower confirms module connectivity and evidence posture. It
              does not activate production auth, live external calls, notice
              sends, payment capture, or official report publication.
            </p>
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Module Interoperability</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {data.surfaces.map((surface) => (
                <Link
                  key={`${surface.moduleNumber}-${surface.label}`}
                  href={surface.href}
                  style={{
                    ...panelStyle,
                    padding: 14,
                    color: "#172033",
                    display: "grid",
                    gap: 10,
                    textDecoration: "none",
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
                    <strong>
                      Module {surface.moduleNumber} / {surface.label}
                    </strong>
                    <StatusPill ok={surface.ok}>
                      {readinessScore(surface)}
                    </StatusPill>
                  </div>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    {surface.readinessRole}
                  </span>
                  <span style={{ color: "#475569", fontSize: 13 }}>
                    Records {surface.count} / Trace{" "}
                    {shortId(surface.traceId ?? "Not recorded")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
          Last refresh: {lastLoadedAt ?? "Not loaded"}
        </p>
      </div>
    </main>
  );
}
