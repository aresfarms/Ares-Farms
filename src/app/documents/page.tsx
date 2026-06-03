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
 * Module 04 - Document Intake and Storage Handoff Workspace
 *
 * Master Volume Governance:
 * - Vol I: requires governed authority before document storage movement.
 * - Vol II: protects borrower document metadata, retention, and disclosure posture.
 * - Vol III: consumes metadata/admin reads and storage-intent handoff runtime.
 * - Vol III-B: preserves classification, evidence, and raw-content rejection.
 * - Vol IV: supports upload recovery, handoff review, and audit preparation.
 * - Vol V: enforces controlled disclosure, portability, replay, and source authority.
 */

const actorId = "module-04-document-intake";

type ModuleData = {
  applications: LoadResult;
  documents: LoadResult;
  scope: ModuleScope;
};

type HandoffState = {
  documentType: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  byteSize: string;
  checksum: string;
};

const emptyLoad: LoadResult = {
  ok: true,
  count: 0,
  rows: [],
  traceId: null,
  error: null,
  json: null,
};

const initialHandoff: HandoffState = {
  documentType: "financial_statement",
  documentName: "Financial Statement",
  fileName: "financial-statement.pdf",
  mimeType: "application/pdf",
  byteSize: "0",
  checksum: "",
};

function documentDisplayName(row: unknown): string {
  const document = primaryRecord(row, ["document"]);

  return (
    stringValue(document.documentName) ??
    stringValue(document.fileName) ??
    shortId(document.id)
  );
}

function propertyLine(row: unknown): string {
  const property = isRecord(row) && isRecord(row.property) ? row.property : {};

  return [
    stringValue(property.name),
    stringValue(property.county),
    stringValue(property.state),
  ]
    .filter(Boolean)
    .join(" / ");
}

export default function DocumentIntakePage() {
  const [data, setData] = useState<ModuleData>({
    applications: emptyLoad,
    documents: emptyLoad,
    scope: emptyScope,
  });
  const [handoff, setHandoff] = useState<HandoffState>(initialHandoff);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setActionMessage(null);

    const applications = await loadJsonSurface(
      `/api/applications/admin?role=governance&userId=${actorId}&limit=10&includeProperty=true`,
      ["applications"]
    );
    const scope = scopeFromApplicationRows(applications.rows);
    const documents =
      scope.applicationId || scope.tenantId || scope.borrowerId
        ? await loadJsonSurface(
            `/api/documents/admin?role=governance&userId=${actorId}${scopeQuery(
              scope
            )}&limit=12&includeApplication=true&includeProperty=true`,
            ["documents"]
          )
        : emptyLoad;

    setData({ applications, documents, scope });
    setLastLoadedAt(new Date().toLocaleTimeString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const contentClaims = useMemo(() => {
    return evaluateContentClaims({
      text: [
        "Module 04 Document Intake Workspace",
        "Internal document metadata and storage handoff surface",
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

  const createHandoff = useCallback(async () => {
    if (!data.scope.applicationId || !data.scope.tenantId) {
      setActionMessage("A governed application scope is required.");
      return;
    }

    setActionBusy(true);
    setActionMessage(null);

    try {
      const byteSize = Number(handoff.byteSize);
      const response = await fetch("/api/documents/storage-handoff", {
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
          documentType: handoff.documentType,
          documentName: handoff.documentName,
          fileName: handoff.fileName,
          mimeType: handoff.mimeType,
          byteSize: Number.isFinite(byteSize) ? byteSize : 0,
          checksum: handoff.checksum || null,
          storageProvider: null,
          storageBucket: null,
          metadata: {
            module: "Module 04 - Document Intake",
            rawContentAccepted: false,
            storageIntentOnly: true,
          },
        }),
      });
      const json = (await response.json()) as Record<string, unknown>;

      if (!response.ok || json.ok !== true) {
        setActionMessage(
          stringValue(json.error) ?? "Storage handoff returned review."
        );
      } else {
        const handoffRecord = isRecord(json.handoff) ? json.handoff : {};
        setActionMessage(
          `Handoff recorded: ${shortId(handoffRecord.id)} / ${normalizeStatus(
            handoffRecord.handoffStatus
          )}`
        );
        await loadAll();
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unknown handoff action error."
      );
    } finally {
      setActionBusy(false);
    }
  }, [data.scope, handoff, loadAll]);

  const badges = [
    `Claims Gate ${contentClaims.ok ? "Pass" : "Review"}`,
    `Scope ${data.scope.applicationId ?? data.scope.tenantId ?? "Unscoped"}`,
    "Metadata Only",
    "Raw Content Blocked",
  ];

  return (
    <main style={moduleShellStyle}>
      <div style={moduleContainerStyle}>
        <ModuleHeader
          moduleNumber="04"
          title="Document Intake"
          subtitle="Document metadata review and governed storage handoff intent for internal operations."
          badges={badges}
          refreshing={refreshing}
          onRefresh={() => void loadAll()}
        />

        <SummaryGrid
          items={[
            {
              label: "Documents",
              value: data.documents.count,
              color: "#0f766e",
            },
            {
              label: "Applications",
              value: data.applications.count,
              color: "#2563eb",
            },
            {
              label: "Raw Content",
              value: "Blocked",
              color: "#be123c",
            },
            {
              label: "Last Refresh",
              value: lastLoadedAt ?? "Loading",
              color: "#334155",
            },
          ]}
        />

        <section
          aria-label="Storage handoff action"
          style={{
            ...panelStyle,
            padding: 16,
            display: "grid",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 12,
            }}
          >
            <FieldLabel label="Document Type">
              <select
                value={handoff.documentType}
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    documentType: event.target.value,
                  }))
                }
                style={inputStyle}
              >
                <option value="financial_statement">Financial Statement</option>
                <option value="tax_return">Tax Return</option>
                <option value="farm_plan">Farm Plan</option>
                <option value="property_record">Property Record</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Document Name">
              <input
                value={handoff.documentName}
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    documentName: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FieldLabel>

            <FieldLabel label="File Name">
              <input
                value={handoff.fileName}
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    fileName: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FieldLabel>

            <FieldLabel label="MIME Type">
              <input
                value={handoff.mimeType}
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    mimeType: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FieldLabel>

            <FieldLabel label="Byte Size">
              <input
                value={handoff.byteSize}
                inputMode="numeric"
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    byteSize: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FieldLabel>

            <FieldLabel label="Checksum">
              <input
                value={handoff.checksum}
                onChange={(event) =>
                  setHandoff((current) => ({
                    ...current,
                    checksum: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </FieldLabel>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <ActionButton
              disabled={actionBusy || !data.scope.applicationId}
              onClick={() => void createHandoff()}
            >
              {actionBusy ? "Recording" : "Record Handoff Intent"}
            </ActionButton>
            {actionMessage ? (
              <span style={{ color: "#334155", fontWeight: 700 }}>
                {actionMessage}
              </span>
            ) : null}
          </div>
        </section>

        <section
          aria-label="Document records"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {data.documents.rows.length > 0 ? (
            data.documents.rows.map((row, index) => {
              const document = primaryRecord(row, ["document"]);

              return (
                <article
                  key={`${stringValue(document.id) ?? "document"}-${index}`}
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
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <h2 style={{ margin: 0, fontSize: 18 }}>
                        {documentDisplayName(row)}
                      </h2>
                      <span style={{ color: "#596579", fontSize: 13 }}>
                        {normalizeStatus(document.documentType)}
                      </span>
                    </div>
                    <StatusPill ok={data.documents.ok}>
                      {normalizeStatus(document.reviewStatus ?? document.status)}
                    </StatusPill>
                  </div>

                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "130px 1fr",
                      gap: 8,
                      margin: 0,
                      fontSize: 13,
                    }}
                  >
                    <dt style={{ color: "#596579", fontWeight: 800 }}>
                      Application
                    </dt>
                    <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                      {shortId(document.applicationId)}
                    </dd>

                    <dt style={{ color: "#596579", fontWeight: 800 }}>
                      Retention
                    </dt>
                    <dd style={{ margin: 0 }}>
                      {normalizeStatus(document.retentionStatus)}
                    </dd>

                    <dt style={{ color: "#596579", fontWeight: 800 }}>
                      Received
                    </dt>
                    <dd style={{ margin: 0 }}>
                      {formatDateTime(document.receivedAt ?? document.createdAt)}
                    </dd>

                    <dt style={{ color: "#596579", fontWeight: 800 }}>
                      Property
                    </dt>
                    <dd style={{ margin: 0 }}>{propertyLine(row) || "Not recorded"}</dd>
                  </dl>
                </article>
              );
            })
          ) : (
            <EmptyState>No document metadata records in current scope.</EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}

