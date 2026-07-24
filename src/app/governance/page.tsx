"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ADVISORY_ONLY_DISCLOSURE,
  BORROWER_PORTABILITY_DISCLOSURE,
  LENDER_READY_DISCLOSURE,
  evaluateContentClaims,
} from "@/lib/governance/contentClaimsPolicy";

/**
 * Module 01 - Governance Operations Dashboard
 *
 * Master Volume Governance:
 * - Vol 0: presents internal platform posture as coordination infrastructure.
 * - Vol I: preserves constitutional limits and accountable authority.
 * - Vol II: keeps regulated workflow records internal and non-public.
 * - Vol III: consumes completed replay-safe admin/read APIs.
 * - Vol III-B: surfaces runtime, observability, and review posture.
 * - Vol IV: supports operator review, escalation, recovery, and audit prep.
 * - Vol V: preserves classification, replay, versioning, source authority,
 *   controlled disclosure, content claims, and portability boundaries.
 */

type SurfaceId =
  | "applications"
  | "queues"
  | "reviews"
  | "reports"
  | "ledger"
  | "connectors"
  | "liveAction"
  | "sovereign"
  | "billing"
  | "evidenceIntegrity";

type SurfaceGroup = "operations" | "audit" | "promotion";

type ModuleScope = {
  applicationId: string | null;
  borrowerId: string | null;
  tenantId: string | null;
};

type SurfaceConfig = {
  id: SurfaceId;
  label: string;
  group: SurfaceGroup;
  path: string | ((scope: ModuleScope) => string);
  collectionKeys: string[];
  accent: string;
  riskLabel: string;
};

type SurfaceResult = SurfaceConfig & {
  loading: boolean;
  ok: boolean;
  count: number;
  traceId: string | null;
  statusText: string;
  rows: unknown[];
  error: string | null;
};

type ViewMode = "overview" | SurfaceGroup;

const actorId = "module-01-governance-dashboard";
const emptyScope: ModuleScope = {
  applicationId: null,
  borrowerId: null,
  tenantId: null,
};

function scopeQuery(
  scope: ModuleScope,
  keys: Array<keyof ModuleScope> = ["tenantId", "applicationId", "borrowerId"]
): string {
  const params = new URLSearchParams();

  for (const key of keys) {
    const value = scope[key];

    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `&${query}` : "";
}

const surfaces: SurfaceConfig[] = [
  {
    id: "applications",
    label: "Applications",
    group: "operations",
    path: `/api/applications/admin?role=governance&userId=${actorId}&limit=8&includeProperty=true`,
    collectionKeys: ["applications"],
    accent: "#2563eb",
    riskLabel: "Intake and review posture",
  },
  {
    id: "queues",
    label: "Operator Queue",
    group: "operations",
    path: (scope) =>
      `/api/queues/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&status=OPEN&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["queueItems"],
    accent: "#0f766e",
    riskLabel: "Open work requiring action",
  },
  {
    id: "reviews",
    label: "Human Review",
    group: "operations",
    path: (scope) =>
      `/api/reviews/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true&includeAdverseActionReviews=true&includeTransitions=true`,
    collectionKeys: ["reviews"],
    accent: "#7c3aed",
    riskLabel: "Review and transition controls",
  },
  {
    id: "reports",
    label: "Reports",
    group: "operations",
    path: (scope) =>
      `/api/reports/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["reportRecords"],
    accent: "#0891b2",
    riskLabel: "Advisory-only report records",
  },
  {
    id: "ledger",
    label: "Audit Ledger",
    group: "audit",
    path: `/api/ledger/admin?role=governance&userId=${actorId}&eventType=APPLICATION_SUBMITTED&includeCanonicalLedger=true&includeCanonicalMeta=true&limit=8`,
    collectionKeys: ["auditEvents", "canonicalLedger", "canonicalMeta"],
    accent: "#4338ca",
    riskLabel: "Evidence and replay inspection",
  },
  {
    id: "connectors",
    label: "Connectors",
    group: "audit",
    path: (scope) =>
      `/api/connectors/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeSource=true&includeAdapters=true&includeExecutions=true&includeApplication=true&includeProperty=true`,
    collectionKeys: ["connectorRecords"],
    accent: "#4d7c0f",
    riskLabel: "Source authority and adapters",
  },
  {
    id: "billing",
    label: "Billing Controls",
    group: "audit",
    path: (scope) =>
      `/api/billing/admin?role=governance&userId=${actorId}${scopeQuery(
        scope,
        ["tenantId"]
      )}&limit=8&includeEntitlement=true`,
    collectionKeys: ["billingEvents"],
    accent: "#b45309",
    riskLabel: "Institution-funded activity",
  },
  {
    id: "evidenceIntegrity",
    label: "Release Evidence Integrity",
    group: "audit",
    path: `/api/governance/release-evidence-integrity?role=governance&userId=${actorId}`,
    collectionKeys: ["integrityFindings"],
    accent: "#be123c",
    riskLabel: "Rejected or corrupted release evidence",
  },
  {
    id: "liveAction",
    label: "Live Action",
    group: "promotion",
    path: (scope) =>
      `/api/governance/live-action-readiness/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["readinessRecords"],
    accent: "#be123c",
    riskLabel: "Promotion readiness only",
  },
  {
    id: "sovereign",
    label: "Sovereign Gateway",
    group: "promotion",
    path: (scope) =>
      `/api/governance/sovereign-consent-gateway/admin?role=governance&userId=${actorId}${scopeQuery(
        scope
      )}&limit=8&includeApplication=true&includeProperty=true`,
    collectionKeys: ["gatewayRecords"],
    accent: "#854d0e",
    riskLabel: "Level 5 controls by default",
  },
];

const initialResults: SurfaceResult[] = surfaces.map((surface) => ({
  ...surface,
  loading: true,
  ok: false,
  count: 0,
  traceId: null,
  statusText: "Loading",
  rows: [],
  error: null,
}));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeStatus(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "Pending";
  }

  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function collectionFromJson(
  json: Record<string, unknown>,
  keys: string[]
): unknown[] {
  for (const key of keys) {
    const value = json[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function primaryRecord(row: unknown): Record<string, unknown> {
  if (!isRecord(row)) {
    return {};
  }

  for (const key of [
    "application",
    "queueItem",
    "humanReview",
    "report",
    "auditEvent",
    "connectorRun",
    "billingEvent",
    "review",
    "gatewayRecord",
  ]) {
    const value = row[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return row;
}

function rowTitle(row: unknown): string {
  const record = primaryRecord(row);

  return (
    stringValue(record.id) ??
    stringValue(record.applicationId) ??
    stringValue(record.reportId) ??
    stringValue(record.eventType) ??
    "Governed record"
  );
}

function rowStatus(row: unknown): string {
  const record = primaryRecord(row);
  const status =
    record.status ??
    record.reviewStatus ??
    record.decisionStatus ??
    record.reportStatus ??
    record.readinessStatus ??
    record.gatewayStatus ??
    record.eventStatus ??
    record.promotionStatus ??
    record.deliveryStatus ??
    record.queueType ??
    record.eventType;

  return normalizeStatus(status);
}

function rowMeta(row: unknown): string {
  const record = primaryRecord(row);
  const parts = [
    stringValue(record.classification),
    stringValue(record.tenantId ?? record.targetTenantId),
    stringValue(record.replayRef),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Governed metadata pending";
}

function countFromJson(json: Record<string, unknown>, rows: unknown[]): number {
  const count = json.count;

  if (typeof count === "number" && Number.isFinite(count)) {
    return count;
  }

  return rows.length;
}

function resolveSurfacePath(
  surface: SurfaceConfig,
  scope: ModuleScope
): string {
  return typeof surface.path === "function" ? surface.path(scope) : surface.path;
}

function scopeFromApplicationResult(result: SurfaceResult): ModuleScope {
  for (const row of result.rows) {
    const record = primaryRecord(row);
    const applicationId =
      stringValue(record.id) ?? stringValue(record.applicationId);
    const tenantId = stringValue(record.tenantId);
    const borrowerId = stringValue(record.borrowerId);

    if (applicationId || tenantId || borrowerId) {
      return {
        applicationId,
        borrowerId,
        tenantId,
      };
    }
  }

  return emptyScope;
}

async function loadSurface(
  surface: SurfaceConfig,
  scope: ModuleScope = emptyScope
): Promise<SurfaceResult> {
  try {
    const response = await fetch(resolveSurfacePath(surface, scope), {
      method: "GET",
      cache: "no-store",
    });
    const json = (await response.json()) as Record<string, unknown>;
    const rows = collectionFromJson(json, surface.collectionKeys);
    const governance = isRecord(json.governance) ? json.governance : {};
    const traceId = stringValue(governance.traceId);
    const ok = response.ok && json.ok === true;

    return {
      ...surface,
      loading: false,
      ok,
      count: countFromJson(json, rows),
      traceId,
      statusText: ok ? "Online" : "Review",
      rows,
      error: ok ? null : stringValue(json.error) ?? "Surface returned review.",
    };
  } catch (error) {
    return {
      ...surface,
      loading: false,
      ok: false,
      count: 0,
      traceId: null,
      statusText: "Error",
      rows: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown dashboard surface error.",
    };
  }
}

function shortTrace(traceId: string | null): string {
  if (!traceId) {
    return "No trace";
  }

  if (traceId.length <= 24) {
    return traceId;
  }

  return `${traceId.slice(0, 16)}...${traceId.slice(-5)}`;
}

function statusColor(result: SurfaceResult): string {
  if (result.loading) {
    return "#64748b";
  }

  return result.ok ? "#047857" : "#b42318";
}

function groupLabel(mode: ViewMode): string {
  if (mode === "overview") {
    return "Overview";
  }

  if (mode === "operations") {
    return "Operations";
  }

  if (mode === "audit") {
    return "Audit";
  }

  return "Promotion";
}

export default function GovernanceDashboardPage() {
  const [results, setResults] = useState<SurfaceResult[]>(initialResults);
  const [mode, setMode] = useState<ViewMode>("overview");
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentScope, setCurrentScope] = useState<ModuleScope>(emptyScope);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setResults((current) =>
      current.map((result) => ({
        ...result,
        loading: true,
      }))
    );

    const applicationSurface = surfaces.find(
      (surface) => surface.id === "applications"
    );
    const applicationResult = applicationSurface
      ? await loadSurface(applicationSurface, emptyScope)
      : null;
    const derivedScope = applicationResult
      ? scopeFromApplicationResult(applicationResult)
      : emptyScope;
    const scopedResults = await Promise.all(
      surfaces
        .filter((surface) => surface.id !== "applications")
        .map((surface) => loadSurface(surface, derivedScope))
    );
    const loaded = surfaces
      .map((surface) =>
        surface.id === "applications"
          ? applicationResult
          : scopedResults.find((result) => result.id === surface.id) ?? null
      )
      .filter((result): result is SurfaceResult => Boolean(result));

    setCurrentScope(derivedScope);
    setResults(loaded);
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 01 Governance Operations Dashboard",
        "Internal operational review surface",
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

  const visibleResults = useMemo(() => {
    if (mode === "overview") {
      return results;
    }

    return results.filter((result) => result.group === mode);
  }, [mode, results]);

  const totals = useMemo(() => {
    const online = results.filter((result) => result.ok).length;
    const review = results.filter((result) => !result.loading && !result.ok)
      .length;
    const records = results.reduce((sum, result) => sum + result.count, 0);
    const loading = results.some((result) => result.loading);

    return {
      online,
      review,
      records,
      loading,
    };
  }, [results]);

  const currentScopeLabel = useMemo(() => {
    return (
      currentScope.applicationId ??
      currentScope.tenantId ??
      currentScope.borrowerId ??
      "Unscoped"
    );
  }, [currentScope]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8fb",
        color: "#172033",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px",
          display: "grid",
          gap: 20,
        }}
      >
        <header
          style={{
            display: "grid",
            gap: 12,
            padding: "18px 0 6px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <p
                style={{
                  margin: 0,
                  color: "#596579",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0,
                  textTransform: "uppercase",
                }}
              >
                Module 01
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  lineHeight: 1.15,
                  letterSpacing: 0,
                }}
              >
                Governance Operations
              </h1>
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
                fontWeight: 700,
              }}
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {[
              `Backend ${totals.loading ? "Loading" : "Online"}`,
              `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
              `Scope ${currentScopeLabel}`,
              "Live Action Blocked",
              "Internal Only",
            ].map((item) => (
              <span
                key={item}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 30,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "#e7eef7",
                  color: "#25344d",
                  fontSize: 13,
                  fontWeight: 700,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <section
          aria-label="Governance summary"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          {[
            ["Online Surfaces", totals.online, "#047857"],
            ["Review Surfaces", totals.review, "#b42318"],
            ["Records In View", totals.records, "#4338ca"],
            ["Last Refresh", lastLoadedAt ?? "Loading", "#0f766e"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              style={{
                minHeight: 96,
                padding: 16,
                border: "1px solid #d5dce8",
                borderRadius: 8,
                background: "#ffffff",
                display: "grid",
                alignContent: "space-between",
              }}
            >
              <span
                style={{
                  color: "#596579",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {label}
              </span>
              <strong
                style={{
                  color: String(color),
                  fontSize: typeof value === "number" ? 30 : 20,
                  lineHeight: 1.1,
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </section>

        <nav
          aria-label="Governance dashboard views"
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            border: "1px solid #d5dce8",
            borderRadius: 8,
            background: "#ffffff",
            width: "fit-content",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          {(["overview", "operations", "audit", "promotion"] as ViewMode[]).map(
            (item) => {
              const active = mode === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  style={{
                    minHeight: 34,
                    padding: "0 12px",
                    border: "1px solid transparent",
                    borderRadius: 6,
                    background: active ? "#172033" : "transparent",
                    color: active ? "#ffffff" : "#334155",
                    cursor: "pointer",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {groupLabel(item)}
                </button>
              );
            }
          )}
        </nav>

        <section
          aria-label="Governance surfaces"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {visibleResults.map((result) => (
            <article
              key={result.id}
              style={{
                minHeight: 220,
                border: "1px solid #d5dce8",
                borderRadius: 8,
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  borderTop: `4px solid ${result.accent}`,
                  padding: 14,
                  display: "grid",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 18,
                        lineHeight: 1.2,
                        letterSpacing: 0,
                      }}
                    >
                      {result.label}
                    </h2>
                    <span style={{ color: "#596579", fontSize: 13 }}>
                      {result.riskLabel}
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      minHeight: 26,
                      alignItems: "center",
                      padding: "0 9px",
                      borderRadius: 999,
                      background: result.ok ? "#e6f4ee" : "#fff1f0",
                      color: statusColor(result),
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {result.statusText}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#596579", fontWeight: 700 }}>
                    Count
                  </span>
                  <span>{result.loading ? "Loading" : result.count}</span>

                  <span style={{ color: "#596579", fontWeight: 700 }}>
                    Trace
                  </span>
                  <span style={{ overflowWrap: "anywhere" }}>
                    {shortTrace(result.traceId)}
                  </span>
                </div>

                {result.error ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#b42318",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {result.error}
                  </p>
                ) : null}

                <div style={{ display: "grid", gap: 8 }}>
                  {result.rows.slice(0, 3).map((row, index) => (
                    <div
                      key={`${result.id}-${index}`}
                      style={{
                        display: "grid",
                        gap: 4,
                        paddingTop: 8,
                        borderTop: "1px solid #e3e8f0",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          color: "#172033",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {rowTitle(row)}
                      </strong>
                      <span style={{ fontSize: 13, color: "#334155" }}>
                        {rowStatus(row)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {rowMeta(row)}
                      </span>
                    </div>
                  ))}

                  {!result.loading && result.rows.length === 0 ? (
                    <div
                      style={{
                        paddingTop: 8,
                        borderTop: "1px solid #e3e8f0",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      No records in current scope.
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          aria-label="Module controls"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              title: "Content Claims",
              value: contentClaims.ok ? "Pass" : "Review",
              detail: `${contentClaims.blockCount} blocked / ${contentClaims.reviewCount} review`,
              color: contentClaims.ok ? "#047857" : "#b42318",
            },
            {
              title: "Classification",
              value: "Internal",
              detail: "Admin/read surfaces only",
              color: "#4338ca",
            },
            {
              title: "Promotion",
              value: "Held",
              detail: "Live external action remains blocked",
              color: "#be123c",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                minHeight: 110,
                border: "1px solid #d5dce8",
                borderRadius: 8,
                background: "#ffffff",
                padding: 16,
                display: "grid",
                gap: 8,
              }}
            >
              <span style={{ color: "#596579", fontWeight: 800 }}>
                {item.title}
              </span>
              <strong style={{ color: item.color, fontSize: 24 }}>
                {item.value}
              </strong>
              <span style={{ color: "#334155", fontSize: 13 }}>
                {item.detail}
              </span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
