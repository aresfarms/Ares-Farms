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
  ModuleScope,
  StatusPill,
  SummaryGrid,
  emptyScope,
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
 * Operator Demo Handoff
 *
 * Master Volume Governance:
 * - Vol 0: gives operators a plain orientation layer after module completion.
 * - Vol I: preserves constitutional hierarchy and accountable handoff.
 * - Vol II: keeps borrower, partner, agency, notice, payment, and report
 *   boundaries explicit before production activation.
 * - Vol III: reads only replay-safe backend/admin surfaces used by Modules 01-32.
 * - Vol III-B: surfaces trace, classification, observability, and evidence posture.
 * - Vol IV: supports training, walk-through, recovery, and audit preparation.
 * - Vol V: enforces advisory-only claims, controlled disclosure, replay, and
 *   human-review requirements.
 */

const actorId = "operator-demo-handoff";

type DemoSurface = {
  step: string;
  label: string;
  href: string;
  moduleRef: string;
  boundary: string;
  path: (scope: ModuleScope) => string | null;
  collectionKeys: string[];
};

type DemoSurfaceResult = DemoSurface & LoadResult;

type DemoData = {
  applications: LoadResult;
  surfaces: DemoSurfaceResult[];
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

const demoSurfaces: DemoSurface[] = [
  {
    step: "01",
    label: "Application Intake",
    href: "/applications",
    moduleRef: "Module 03",
    boundary: "Submitted application remains pending review.",
    path: (scope) =>
      `/api/applications/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeProperty=true`,
    collectionKeys: ["applications"],
  },
  {
    step: "02",
    label: "Documents and Handoff",
    href: "/documents",
    moduleRef: "Module 04",
    boundary: "Metadata and storage intent only; raw content remains blocked.",
    path: (scope) =>
      `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    collectionKeys: ["documents"],
  },
  {
    step: "03",
    label: "Operator Queue",
    href: "/operator-queue",
    moduleRef: "Module 02",
    boundary: "Operator review opens without automated final action.",
    path: (scope) =>
      `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    collectionKeys: ["queueItems"],
  },
  {
    step: "04",
    label: "Source and Connector Check",
    href: "/connectors",
    moduleRef: "Module 10",
    boundary: "Advisory source check only; no live external request.",
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["connectorRecords"],
  },
  {
    step: "05",
    label: "Rule Overlay Review",
    href: "/rules",
    moduleRef: "Module 06",
    boundary: "Rules are advisory and require human review.",
    path: (scope) =>
      `/api/rules/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeRules=true&includeOverlays=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["ruleRecords"],
  },
  {
    step: "06",
    label: "Human Review",
    href: "/reviews",
    moduleRef: "Module 05",
    boundary: "Adverse-action candidate is not a final notice.",
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
    collectionKeys: ["reviews"],
  },
  {
    step: "07",
    label: "Credentialed Source Readiness",
    href: "/source-ingestion",
    moduleRef: "Module 17",
    boundary: "Ready-not-started posture; no agency data fetched.",
    path: (scope) =>
      `/api/connectors/credentialed-ingestion/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeCredential=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["credentialedIngestionRecords"],
  },
  {
    step: "08",
    label: "Environmental Compliance",
    href: "/environmental-compliance",
    moduleRef: "Module 21",
    boundary: "Environmental pathway review only; no official environmental report.",
    path: (scope) =>
      `/api/governance/environmental-compliance/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true&includeFeeControl=true`,
    collectionKeys: ["environmentalComplianceRecords"],
  },
  {
    step: "09",
    label: "Source Legal Review",
    href: "/source-legal-review",
    moduleRef: "Module 23",
    boundary: "Legal/licensing review evidence only; not legal advice.",
    path: () =>
      `/api/governance/source-legal-review?actorId=${actorId}&limit=6`,
    collectionKeys: ["sourceLegalReviews"],
  },
  {
    step: "10",
    label: "Live Scraper Activation",
    href: "/live-scraper-activation",
    moduleRef: "Module 22",
    boundary: "Activation-readiness only; live external fetch remains blocked.",
    path: () =>
      `/api/governance/live-scraper-activation?actorId=${actorId}&limit=6`,
    collectionKeys: ["sourceReviews"],
  },
  {
    step: "11",
    label: "Source Promotion Packets",
    href: "/source-promotion-packets",
    moduleRef: "Module 24",
    boundary: "Promotion packet evidence only; no source activation approval.",
    path: () =>
      `/api/governance/source-promotion-packets?actorId=${actorId}&limit=6`,
    collectionKeys: ["sourcePromotionPackets"],
  },
  {
    step: "12",
    label: "Source Production Readiness",
    href: "/source-production-readiness",
    moduleRef: "Module 25",
    boundary:
      "Final production readiness evidence only; no source promotion or live fetch.",
    path: () =>
      `/api/governance/source-production-readiness?actorId=${actorId}&limit=6`,
    collectionKeys: ["sourceProductionReadinessReviews"],
  },
  {
    step: "13",
    label: "Controlled Promotion Activation",
    href: "/controlled-promotion-activation",
    moduleRef: "Module 26",
    boundary:
      "Activation ceremony review only; no production activation or live fetch.",
    path: () =>
      `/api/governance/controlled-promotion-activation?actorId=${actorId}&limit=6`,
    collectionKeys: ["controlledPromotionActivationReviews"],
  },
  {
    step: "14",
    label: "Production Portal Readiness",
    href: "/production-portal-readiness",
    moduleRef: "Module 27",
    boundary:
      "Launch preflight review only; no production publication, public verification, payment capture, notice send, official report, or live external action.",
    path: () =>
      `/api/governance/production-portal-readiness?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionPortalReadinessReviews"],
  },
  {
    step: "15",
    label: "Production Launch Evidence",
    href: "/production-launch-evidence",
    moduleRef: "Module 28",
    boundary:
      "Go-live evidence packet only; no production release, public verification, payment capture, notice send, official report, or live external action.",
    path: () =>
      `/api/governance/production-launch-evidence?actorId=${actorId}&limit=6`,
    collectionKeys: ["launchEvidencePackets"],
  },
  {
    step: "16",
    label: "Deployment Environment Readiness",
    href: "/deployment-environment-readiness",
    moduleRef: "Module 29",
    boundary:
      "Deployment environment review only; no release-candidate approval, production deployment, secret activation, DNS cutover, migration, or go-live release.",
    path: () =>
      `/api/governance/deployment-environment-readiness?actorId=${actorId}&limit=6`,
    collectionKeys: ["deploymentEnvironmentReviews"],
  },
  {
    step: "17",
    label: "Release Candidate Freeze",
    href: "/release-candidate-freeze",
    moduleRef: "Module 30",
    boundary:
      "Freeze plan review only; no release-candidate freeze approval, candidate freeze, deployment, secret activation, DNS cutover, migration, or go-live release.",
    path: () =>
      `/api/governance/release-candidate-freeze?actorId=${actorId}&limit=6`,
    collectionKeys: ["releaseCandidateFreezePlans"],
  },
  {
    step: "18",
    label: "Production Cutover Hold",
    href: "/production-cutover-hold",
    moduleRef: "Module 31",
    boundary:
      "Production cutover hold review only; no cutover approval, launch hold release, deployment, secret activation, DNS cutover, migration, public API exposure, portal launch, or go-live release.",
    path: () =>
      `/api/governance/production-cutover-hold?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionCutoverHoldReviews"],
  },
  {
    step: "19",
    label: "Production Release Board",
    href: "/production-release-board",
    moduleRef: "Module 32",
    boundary:
      "Release board evidence review only; no board approval, cutover authority, launch hold release, deployment, secret activation, DNS cutover, migration, public API exposure, portal launch, or go-live release.",
    path: () =>
      `/api/governance/production-release-board?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionReleaseBoardReviews"],
  },
  {
    step: "20",
    label: "Production Operations Monitoring",
    href: "/production-operations-monitoring",
    moduleRef: "Module 33",
    boundary:
      "Operations monitoring review only; no monitoring activation, on-call activation, incident bridge activation, rollback authorization, emergency hold release, cutover authority, deployment, public API exposure, portal launch, or go-live release.",
    path: () =>
      `/api/governance/production-operations-monitoring?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionOperationsMonitoringReviews"],
  },
  {
    step: "21",
    label: "Production Incident Response Readiness",
    href: "/production-incident-response-readiness",
    moduleRef: "Module 34",
    boundary:
      "Incident response readiness review only; no incident activation, incident bridge activation, rollback authorization, emergency rollback, customer communication, public status page, support escalation, cutover authority, deployment, public API exposure, portal launch, or go-live release.",
    path: () =>
      `/api/governance/production-incident-response-readiness?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionIncidentResponseReadinessReviews"],
  },
  {
    step: "22",
    label: "Production Support Communications Readiness",
    href: "/production-support-communications-readiness",
    moduleRef: "Module 35",
    boundary:
      "Support communications readiness review only; no support activation, support escalation, customer communication, regulatory communication, public status page, borrower notice, official report, public verification, cutover authority, deployment, public API exposure, portal launch, or go-live release.",
    path: () =>
      `/api/governance/production-support-communications-readiness?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionSupportCommunicationsReadinessReviews"],
  },
  {
    step: "23",
    label: "Production Final Authority",
    href: "/production-final-authority",
    moduleRef: "Module 36",
    boundary:
      "Final authority review only; no go-live approval, production launch authorization, hold release, deployment, public exposure, payment capture, notice send, official report, public verification, legal advice, official reliance, or live external action.",
    path: () =>
      `/api/governance/production-final-authority?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionFinalAuthorityReviews"],
  },
  {
    step: "24",
    label: "Production Activation Ceremony",
    href: "/production-activation-ceremony",
    moduleRef: "Module 37",
    boundary:
      "Production activation ceremony review only; no ceremony approval, ceremony execution, production activation, post-activation verification, go-live approval, hold release, deployment, secret activation, DNS cutover, database migration, public API exposure, portal launch, payment capture, notice send, official report, public verification, legal advice, official reliance, or live external action.",
    path: () =>
      `/api/governance/production-activation-ceremony?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionActivationCeremonyReviews"],
  },
  {
    step: "25",
    label: "Production Post-Activation Verification",
    href: "/production-post-activation-verification",
    moduleRef: "Module 38",
    boundary:
      "Production post-activation verification review only; no verification approval, verification start, verification completion, production health certification, activation ceremony approval, ceremony execution, production activation, go-live approval, hold release, deployment, secret activation, DNS cutover, database migration, public API exposure, portal launch, payment capture, notice send, official report, public verification, legal advice, official reliance, or live external action.",
    path: () =>
      `/api/governance/production-post-activation-verification?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionPostActivationVerificationReviews"],
  },
  {
    step: "26",
    label: "Production Reliance Verification",
    href: "/production-reliance-verification",
    moduleRef: "Module 39",
    boundary:
      "Production reliance and public verification boundary review only; no production reliance approval, public verification authority, public verification gateway, public artifact publication, external reliance disclosure, regulatory reliance, official reliance, legal advice, post-activation verification approval, production health certification, go-live approval, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action.",
    path: () =>
      `/api/governance/production-reliance-verification?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionRelianceVerificationReviews"],
  },
  {
    step: "27",
    label: "Production Regulatory Examination",
    href: "/production-regulatory-examination",
    moduleRef: "Module 40",
    boundary:
      "Production regulatory examination and evidence archive review only; no examination package approval, regulator submission, portal upload, official regulator response, archive certification, retention certification, legal hold release, external examiner disclosure, public verification, official reliance, legal advice, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action.",
    path: () =>
      `/api/governance/production-regulatory-examination?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionRegulatoryExaminationReviews"],
  },
  {
    step: "28",
    label: "Production Regulatory Response",
    href: "/production-regulatory-response",
    moduleRef: "Module 41",
    boundary:
      "Production regulatory response and corrective-action review only; no response package approval, official regulator response, corrective-action commitment, corrective-action execution, remediation execution, examiner finding closure, legal hold release, public verification, official reliance, legal advice, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, or live external action.",
    path: () =>
      `/api/governance/production-regulatory-response?actorId=${actorId}&limit=6`,
    collectionKeys: ["productionRegulatoryResponseReviews"],
  },
  {
    step: "29",
    label: "Build Preservation",
    href: "/build-preservation",
    moduleRef: "Module 42",
    boundary:
      "Build preservation and evidence archive review only; checkpoint BR-2026-06-01-M41 is recorded, tree drift and ignored sensitive files are reviewed, and no production launch, deployment, public API exposure, portal launch, payment capture, notice send, official report publication, public verification, official reliance, legal advice, regulatory response, corrective-action commitment, remediation execution, or live external action is authorized.",
    path: () =>
      `/api/governance/build-preservation?actorId=${actorId}&limit=6`,
    collectionKeys: ["buildPreservationReviews"],
  },
  {
    step: "30",
    label: "Partner Coordination",
    href: "/partners",
    moduleRef: "Module 11",
    boundary: "Lender and sponsor workflows do not create commitments.",
    path: (scope) =>
      `/api/partners/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    collectionKeys: ["partnerWorkflows"],
  },
  {
    step: "31",
    label: "Advisory Reports",
    href: "/reports",
    moduleRef: "Module 13",
    boundary: "Reports are advisory and blocked from official use.",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
  },
  {
    step: "32",
    label: "Integrated Readiness",
    href: "/module-readiness",
    moduleRef: "Module 20",
    boundary: "Readiness review only; no production promotion.",
    path: (scope) =>
      `/api/applications/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=6&includeProperty=true`,
    collectionKeys: ["applications"],
  },
];

const productionBlocks = [
  "Official report publication",
  "Live external agency call",
  "Live scraper/source fetch",
  "Unqualified source legal approval",
  "Unqualified source promotion approval",
  "Unqualified source production readiness approval",
  "Unqualified controlled activation ceremony approval",
  "Unqualified production portal launch approval",
  "Unqualified go-live release approval",
  "Unqualified deployment environment release approval",
  "Unqualified release-candidate freeze approval",
  "Unqualified production cutover approval",
  "Unqualified production release board approval",
  "Unqualified production operations monitoring approval",
  "Unqualified production incident response readiness approval",
  "Unqualified production support communications readiness approval",
  "Unqualified production final authority approval",
  "Unqualified production activation ceremony approval",
  "Unqualified production post-activation verification approval",
  "Unqualified production reliance verification approval",
  "Unqualified production regulatory examination approval",
  "Unqualified production regulatory response approval",
  "Unqualified build preservation production authority",
  "Production secret activation",
  "Public DNS cutover",
  "Production database migration",
  "Raw document-content acceptance",
  "Payment capture",
  "Final lending decision",
  "Borrower notice send",
  "Public verification exposure",
];

function applicationIdFromRow(row: unknown): string | null {
  const application = primaryRecord(row, ["application"]);

  return stringValue(application.id);
}

function applicationTitle(row: unknown): string {
  const application = primaryRecord(row, ["application"]);

  return [
    shortId(application.id),
    normalizeStatus(application.status),
    normalizeStatus(application.reviewStatus),
  ].join(" / ");
}

function isDemoApplication(row: unknown): boolean {
  const id = applicationIdFromRow(row);

  return Boolean(id?.startsWith("operator-demo-seed-"));
}

function surfaceStatus(surface: DemoSurfaceResult): string {
  if (!surface.ok) {
    return "Review";
  }

  return surface.count > 0 ? "Ready" : "Available";
}

export default function OperatorDemoHandoffPage() {
  const [data, setData] = useState<DemoData>({
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
      `/api/applications/admin?role=governance&userId=${actorId}&limit=24&includeProperty=true`,
      ["applications"]
    );
    const selectedRow =
      applications.rows.find(
        (row) => applicationIdFromRow(row) === selectedApplicationId
      ) ??
      applications.rows.find(isDemoApplication) ??
      applications.rows[0];
    const selectedId = selectedRow ? applicationIdFromRow(selectedRow) : null;
    const scope = selectedRow ? scopeFromApplicationRows([selectedRow]) : emptyScope;
    const scoped = scope.applicationId || scope.tenantId || scope.borrowerId;
    const surfaces = scoped
      ? await Promise.all(
          demoSurfaces.map(async (surface) => {
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
      : demoSurfaces.map((surface) => ({ ...surface, ...emptyLoad }));

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
        "Operator Demo Handoff",
        "Internal governed walkthrough for completed Modules 01 through 42",
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

  const demoApplications = data.applications.rows.filter(isDemoApplication).length;
  const readySurfaces = data.surfaces.filter(
    (surface) => surface.ok && surface.count > 0
  ).length;
  const reviewSurfaces = data.surfaces.filter((surface) => !surface.ok).length;

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <header style={{ display: "grid", gap: 12, padding: "18px 0 6px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 6, maxWidth: 840 }}>
              <p
                style={{
                  margin: 0,
                  color: "#596579",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0,
                  textTransform: "uppercase",
                }}
              >
                Post-Completion Handoff
              </p>
              <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.15 }}>
                Operator Demo Handoff
              </h1>
              <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
                Governed review path for seeded demo records across Modules
                01-42 without promoting production activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={refreshing}
              style={{
                minHeight: 40,
                padding: "0 14px",
                border: "1px solid #b8c2d3",
                borderRadius: 8,
                background: refreshing ? "#e8edf5" : "#ffffff",
                color: "#172033",
                cursor: refreshing ? "wait" : "pointer",
                fontWeight: 800,
              }}
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
              `Scope ${data.scope.applicationId ?? "Unscoped"}`,
              "Internal Demo Only",
              "Production Blocks Active",
            ].map((badge) => (
              <span
                key={badge}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 30,
                  maxWidth: "100%",
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "#e7eef7",
                  color: "#25344d",
                  fontSize: 13,
                  fontWeight: 800,
                  overflowWrap: "anywhere",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </header>

        <SummaryGrid
          items={[
            {
              label: "Demo Applications",
              value: demoApplications,
              color: "#2563eb",
            },
            {
              label: "Ready Surfaces",
              value: readySurfaces,
              color: "#0f766e",
            },
            {
              label: "Review Needed",
              value: reviewSurfaces,
              color: "#be123c",
            },
            {
              label: "Production Blocks",
              value: productionBlocks.length,
              color: "#7c3aed",
            },
          ]}
        />

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.85fr) minmax(0, 1.6fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <aside style={{ ...panelStyle, padding: 16, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Demo Scope</h2>
              {data.applications.rows.length === 0 ? (
                <EmptyState>
                  Run `npm run demo:seed` while the app is running to create a
                  governed demo case.
                </EmptyState>
              ) : (
                data.applications.rows.slice(0, 10).map((row) => {
                  const id = applicationIdFromRow(row);
                  const selected = id === data.scope.applicationId;

                  return (
                    <button
                      key={id ?? JSON.stringify(row)}
                      type="button"
                      onClick={() => setSelectedApplicationId(id)}
                      style={{
                        display: "grid",
                        gap: 6,
                        padding: 12,
                        border: selected
                          ? "2px solid #1f4f7a"
                          : "1px solid #d5dce8",
                        borderRadius: 8,
                        background: "#ffffff",
                        color: "#172033",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{applicationTitle(row)}</strong>
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {isDemoApplication(row)
                          ? "Seeded demo case"
                          : "Governed application"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Seed Command</h2>
              <code
                style={{
                  display: "block",
                  padding: 12,
                  borderRadius: 8,
                  background: "#111827",
                  color: "#f8fafc",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  lineHeight: 1.5,
                }}
              >
                npm run dev{"\n"}npm run demo:seed
              </code>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Active Blocks</h2>
              {productionBlocks.map((block) => (
                <div
                  key={block}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "9px 10px",
                  }}
                >
                  <span>{block}</span>
                  <StatusPill ok={true}>Blocked</StatusPill>
                </div>
              ))}
            </div>
          </aside>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Walkthrough Order</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 12,
              }}
            >
              {data.surfaces.map((surface) => (
                <Link
                  key={`${surface.step}-${surface.label}`}
                  href={surface.href}
                  style={{
                    ...panelStyle,
                    color: "#172033",
                    display: "grid",
                    gap: 10,
                    padding: 14,
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
                      {surface.step}. {surface.label}
                    </strong>
                    <StatusPill ok={surface.ok}>
                      {surfaceStatus(surface)}
                    </StatusPill>
                  </div>
                  <span style={{ color: "#475569", fontSize: 13 }}>
                    {surface.moduleRef}
                  </span>
                  <span style={{ color: "#334155", lineHeight: 1.45 }}>
                    {surface.boundary}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
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
