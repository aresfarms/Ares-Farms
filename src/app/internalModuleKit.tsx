import type { ReactNode } from "react";

export type ModuleScope = {
  applicationId: string | null;
  borrowerId: string | null;
  tenantId: string | null;
};

export type LoadResult = {
  ok: boolean;
  count: number;
  rows: unknown[];
  traceId: string | null;
  error: string | null;
  json: Record<string, unknown> | null;
};

export const emptyScope: ModuleScope = {
  applicationId: null,
  borrowerId: null,
  tenantId: null,
};

export const moduleShellStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  color: "#172033",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const moduleContainerStyle = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: "24px",
  display: "grid",
  gap: 20,
} as const;

export const panelStyle = {
  border: "1px solid #d5dce8",
  borderRadius: 8,
  background: "#ffffff",
} as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

export function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeStatus(value: unknown): string {
  const raw = stringValue(value);

  if (!raw) {
    return "Pending";
  }

  return raw
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function shortId(value: unknown): string {
  const raw = stringValue(value);

  if (!raw) {
    return "Not recorded";
  }

  if (raw.length <= 26) {
    return raw;
  }

  return `${raw.slice(0, 16)}...${raw.slice(-6)}`;
}

export function formatDateTime(value: unknown): string {
  const raw = stringValue(value);

  if (!raw) {
    return "Not recorded";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleString();
}

export function collectionFromJson(
  json: Record<string, unknown> | null,
  keys: string[]
): unknown[] {
  if (!json) {
    return [];
  }

  for (const key of keys) {
    const value = json[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function governanceTrace(json: Record<string, unknown> | null): string | null {
  const governance = isRecord(json?.governance) ? json.governance : {};

  return stringValue(governance.traceId);
}

export function primaryRecord(
  row: unknown,
  keys: string[] = [
    "application",
    "property",
    "queueItem",
    "document",
    "humanReview",
    "transition",
    "handoff",
  ]
): Record<string, unknown> {
  if (!isRecord(row)) {
    return {};
  }

  for (const key of keys) {
    const value = row[key];

    if (isRecord(value)) {
      return value;
    }
  }

  return row;
}

export function scopeQuery(
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

export function scopeFromApplicationRows(rows: unknown[]): ModuleScope {
  for (const row of rows) {
    const record = primaryRecord(row, ["application"]);
    const applicationId =
      stringValue(record.id) ?? stringValue(record.applicationId);
    const borrowerId = stringValue(record.borrowerId);
    const tenantId = stringValue(record.tenantId);

    if (applicationId || borrowerId || tenantId) {
      return {
        applicationId,
        borrowerId,
        tenantId,
      };
    }
  }

  return emptyScope;
}

export async function loadJsonSurface(
  path: string,
  collectionKeys: string[]
): Promise<LoadResult> {
  try {
    const response = await fetch(path, {
      method: "GET",
      cache: "no-store",
    });
    const json = (await response.json()) as Record<string, unknown>;
    const rows = collectionFromJson(json, collectionKeys);
    const count = numberValue(json.count) ?? rows.length;
    const ok = response.ok && json.ok === true;

    return {
      ok,
      count,
      rows,
      traceId: governanceTrace(json),
      error: ok ? null : stringValue(json.error) ?? "Surface returned review.",
      json,
    };
  } catch (error) {
    return {
      ok: false,
      count: 0,
      rows: [],
      traceId: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown module surface error.",
      json: null,
    };
  }
}

export function statusTone(ok: boolean): { background: string; color: string } {
  return ok
    ? { background: "#e6f4ee", color: "#047857" }
    : { background: "#fff1f0", color: "#b42318" };
}

export function ModuleHeader(props: {
  moduleNumber: string;
  title: string;
  subtitle: string;
  badges: string[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header style={{ display: "grid", gap: 12, padding: "18px 0 6px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 6, maxWidth: 820 }}>
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
            Module {props.moduleNumber}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              lineHeight: 1.15,
              letterSpacing: 0,
            }}
          >
            {props.title}
          </h1>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.5 }}>
            {props.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          style={{
            minHeight: 40,
            padding: "0 14px",
            border: "1px solid #b8c2d3",
            borderRadius: 8,
            background: props.refreshing ? "#e8edf5" : "#ffffff",
            color: "#172033",
            cursor: props.refreshing ? "wait" : "pointer",
            fontWeight: 800,
          }}
        >
          {props.refreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {props.badges.map((badge) => (
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
  );
}

export function SummaryGrid(props: {
  items: Array<{ label: string; value: string | number; color: string }>;
}) {
  return (
    <section
      aria-label="Module summary"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 12,
      }}
    >
      {props.items.map((item) => (
        <div
          key={item.label}
          style={{
            minHeight: 96,
            padding: 16,
            ...panelStyle,
            display: "grid",
            alignContent: "space-between",
          }}
        >
          <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
            {item.label}
          </span>
          <strong
            style={{
              color: item.color,
              fontSize: typeof item.value === "number" ? 30 : 20,
              lineHeight: 1.1,
              overflowWrap: "anywhere",
            }}
          >
            {item.value}
          </strong>
        </div>
      ))}
    </section>
  );
}

export function StatusPill(props: { ok: boolean; children: ReactNode }) {
  const tone = statusTone(props.ok);

  return (
    <span
      style={{
        display: "inline-flex",
        minHeight: 26,
        alignItems: "center",
        padding: "0 9px",
        borderRadius: 999,
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {props.children}
    </span>
  );
}

export function ActionButton(props: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        minHeight: 40,
        padding: "0 14px",
        border: "1px solid #1f4f7a",
        borderRadius: 8,
        background: props.disabled ? "#e8edf5" : "#1f4f7a",
        color: props.disabled ? "#64748b" : "#ffffff",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 800,
      }}
    >
      {props.children}
    </button>
  );
}

export function FieldLabel(props: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#596579", fontSize: 13, fontWeight: 800 }}>
        {props.label}
      </span>
      {props.children}
    </label>
  );
}

export const inputStyle = {
  minHeight: 38,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "0 10px",
  background: "#ffffff",
  color: "#172033",
  font: "inherit",
} as const;

export function EmptyState(props: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px dashed #bdc7d6",
        borderRadius: 8,
        color: "#64748b",
        background: "#f8fafc",
        fontSize: 14,
      }}
    >
      {props.children}
    </div>
  );
}

