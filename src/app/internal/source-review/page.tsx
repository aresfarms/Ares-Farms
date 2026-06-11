import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  canApproveSourceLegal,
  operatorByEmail,
  sourceLegalApprovers,
} from "@/lib/auth/operatorRegistry";
import { readAuditEvents } from "@/lib/property/auditLedger";
import {
  PROPERTY_SOURCE_IDS,
  recordsForReview,
} from "@/lib/property/propertyData";
import type { PropertySourceId } from "@/lib/property/propertyTypes";
import { SOURCE_ACTIVATION } from "@/lib/property/sourceActivation";
import {
  getRuntimeActivation,
  recordSourceDecision,
  type ReviewDecision,
} from "@/lib/property/sourceActivationStore";
import { PLACE_FACT_ACTIVATIONS } from "@/lib/place-facts/placeFactActivation";
import {
  listRuntimePlaceFactActivations,
  readPlaceFactAudit,
  recordPlaceFactDecision,
  type PlaceFactDecision,
} from "@/lib/place-facts/placeFactActivationStore";

/**
 * Internal Source Review screen (Module 02 / 05 pattern) — operator-only.
 *
 * Lives under /internal, so the server-side auth gate (src/proxy.ts) already
 * blocks anonymous access. VIEWING is open to any authenticated operator; the
 * APPROVE/REJECT controls are gated by Module 45 authority (operatorRegistry).
 * Approving flips the runtime SOURCE_LIVE overlay and writes the audit ledger —
 * the ONLY way a source goes live. The build never self-approves.
 *
 * Generalized: one screen per source (USDA now; HUD/GSA/Treasury/FDIC later).
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;
const card = { background: "#ffffff", border: "1px solid #d7deea", borderRadius: 12, padding: "20px 24px" } as const;

// ── Server action — record an operator decision ──────────────────────────────
async function decideSource(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email)) {
    throw new Error("Not authorized to approve this gate (Module 45 authority required).");
  }
  const op = operatorByEmail(email)!;
  const sourceId = String(formData.get("sourceId") ?? "");
  const decision = String(formData.get("decision") ?? "") as ReviewDecision;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["APPROVE", "REJECT", "HOLD"].includes(decision)) throw new Error("Invalid decision.");
  recordSourceDecision({ sourceId, decision, reviewerId: op.id, reviewerName: op.name, reason });
  revalidatePath("/internal/source-review");
}

// ── Server action — record a PLACE-FACT (reference source) decision ───────────
// Same operator wall + Module 45 authority + audit-ledger write. Approving flips
// liveFetchAllowed:true (turns on the live request-time fetch). It does NOT turn
// on the data — the citable public-domain snapshot already renders regardless.
async function decidePlaceFact(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email)) {
    throw new Error("Not authorized to approve this gate (Module 45 authority required).");
  }
  const op = operatorByEmail(email)!;
  const sourceId = String(formData.get("sourceId") ?? "");
  const decision = String(formData.get("decision") ?? "") as PlaceFactDecision;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!["APPROVE", "REJECT", "HOLD"].includes(decision)) throw new Error("Invalid decision.");
  recordPlaceFactDecision({ sourceId, decision, reviewerId: op.id, reviewerName: op.name, reason });
  revalidatePath("/internal/source-review");
}

export default async function SourceReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const sourceParam = (Array.isArray(resolved.source) ? resolved.source[0] : resolved.source) ?? "usda";
  const sourceId = (PROPERTY_SOURCE_IDS.includes(sourceParam as PropertySourceId) ? sourceParam : "usda") as PropertySourceId;

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const operator = operatorByEmail(email);
  const mayApprove = canApproveSourceLegal(email);

  const base = SOURCE_ACTIVATION[sourceId];
  const activation = getRuntimeActivation(sourceId);
  const records = recordsForReview(sourceId);
  const audit = readAuditEvents({ domain: "source-review", subject: sourceId }).slice(-10).reverse();

  // Summary.
  const dates = records.map((c) => c.source_records[0].listingDate).filter((d): d is string => !!d).map((d) => d.slice(0, 4)).sort();
  const states = new Set(records.map((c) => c.source_records[0].state));
  const withPhoto = records.filter((c) => c.source_records[0].photoFile).length;
  const missing = records.filter((c) => {
    const r = c.source_records[0];
    return !r.state || !r.town || r.town === "Unknown" || !r.exactAddress;
  });
  const pct = records.length ? Math.round((withPhoto / records.length) * 100) : 0;
  const dateRange = dates.length ? `${dates[0]}–${dates[dates.length - 1]}` : "n/a (current inventory)";

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px", display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a3412" }}>
          Internal · Operator review — not public
        </span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Source Review — {activation?.sourceName ?? sourceId}</h1>
        <p style={{ margin: 0, ...muted, fontSize: 14 }}>
          Signed in as <strong>{operator ? `${operator.name} (${operator.role})` : email ?? "unknown"}</strong>.{" "}
          {mayApprove ? "You may approve/reject this gate." : "View-only — you do not hold Module 45 approve authority for this gate."}
        </p>
        <nav style={{ display: "flex", gap: 8 }}>
          {PROPERTY_SOURCE_IDS.map((id) => (
            <a key={id} href={`/internal/source-review?source=${id}`}
              style={{ fontSize: 13, fontWeight: 700, textDecoration: "none", padding: "5px 12px", borderRadius: 999,
                border: `1px solid ${id === sourceId ? "#0f766e" : "#cbd5e1"}`, background: id === sourceId ? "#0f766e" : "#fff", color: id === sourceId ? "#fff" : "#334155" }}>
              {id.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>

      {/* ── Place-fact (reference) sources — shown FIRST so OZ + HUBZone are
            clearly "in for approval", not buried under the property records. ── */}
      <PlaceFactReviewGroup mayApprove={mayApprove} />

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
        Property / listing sources
      </div>

      {/* Summary + status */}
      <section style={{ ...card, display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Summary</strong>
        <div style={{ ...muted, fontSize: 14 }}>
          {records.length.toLocaleString("en-US")} records · listing dates {dateRange} · {states.size} states ·{" "}
          {pct}% with photos · {missing.length} rows missing a required field ·{" "}
          {dates.length && dates[dates.length - 1] < "2024" ? "VINTAGE (historical snapshot)" : "current inventory"}
        </div>
        <div style={{ ...muted, fontSize: 14 }}>
          Status — Module 23 (legal): <strong>{activation?.module23}</strong> · Module 22 (activation):{" "}
          <strong>{activation?.module22}</strong> · SOURCE_LIVE: <strong>{String(activation?.sourceLive)}</strong>
          {activation?.reviewedByName ? ` · last decision by ${activation.reviewedByName} at ${activation.reviewedAt}` : ""}
        </div>
      </section>

      {/* Module 23 legal facts */}
      <section style={{ ...card, display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Module 23 — legal &amp; licensing facts</strong>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          {base?.module23.facts.map((f) => <li key={f} style={{ ...muted, fontSize: 14 }}>{f}</li>)}
        </ul>
        <div style={{ ...muted, fontSize: 13 }}>Rights: {base?.module23.license} · {base?.module23.attributionRequired}</div>
        <div style={{ ...muted, fontSize: 13 }}>Dataset: {records[0]?.source_url ?? "—"}</div>
      </section>

      {/* Decision controls */}
      <section style={{ ...card, display: "grid", gap: 10, borderColor: mayApprove ? "#0f766e" : "#d7deea" }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Decision</strong>
        {mayApprove ? (
          <form action={decideSource} style={{ display: "grid", gap: 10, maxWidth: 640 }}>
            <input type="hidden" name="sourceId" value={sourceId} />
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3b475a" }}>
              Reason / note (recorded in the audit ledger)
              <textarea name="reason" rows={2} required style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" name="decision" value="APPROVE" style={btn("#0f766e")}>Approve (flip SOURCE_LIVE)</button>
              <button type="submit" name="decision" value="REJECT" style={btn("#9a3412")}>Reject</button>
              <button type="submit" name="decision" value="HOLD" style={btn("#475569")}>Hold</button>
            </div>
          </form>
        ) : (
          <p style={{ margin: 0, ...muted, fontSize: 14 }}>
            View-only. Approving this gate requires Module 45 authority. Holders (no single-person bottleneck):{" "}
            {sourceLegalApprovers().map((o) => o.name).join(", ")}.
          </p>
        )}
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
          Approval is the ONLY way a source goes live; every decision is attributed in the audit ledger.
        </p>
      </section>

      {/* Recent decisions (audit ledger) */}
      {audit.length > 0 && (
        <section style={{ ...card, display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 15, color: "#0f172a" }}>Audit ledger — recent decisions</strong>
          {audit.map((e, i) => (
            <div key={i} style={{ ...muted, fontSize: 13 }}>
              {e.ts} · <strong>{e.decision}</strong> by {e.actorName} — {e.reason || "(no reason)"}
            </div>
          ))}
        </section>
      )}

      {/* Records table (first 100) */}
      <section style={{ ...card, display: "grid", gap: 8, overflowX: "auto" }}>
        <strong style={{ fontSize: 15, color: "#0f172a" }}>Records ({records.length.toLocaleString("en-US")}; showing first {Math.min(100, records.length)})</strong>
        <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#475569" }}>
              {["State", "County", "Town", "Type", "Price", "Listing date", "Address", "Photo", "ID", "Flags"].map((h) => (
                <th key={h} style={{ padding: "4px 8px", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 100).map((c) => {
              const r = c.source_records[0];
              const flag = !r.exactAddress || !r.town || r.town === "Unknown";
              return (
                <tr key={c.canonical_property_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{r.state}</td>
                  <td style={td}>{r.county}</td>
                  <td style={td}>{r.town}</td>
                  <td style={td}>{r.propertyType}</td>
                  <td style={td}>{r.price ? `$${r.price.toLocaleString("en-US")}` : "—"}</td>
                  <td style={td}>{r.listingDate ?? (r.isCurrent ? "current" : "—")}</td>
                  <td style={td}>{r.exactAddress ?? "—"}</td>
                  <td style={td}>{r.photoFile ? "✓" : "—"}</td>
                  <td style={td}>{r.listingId}</td>
                  <td style={{ ...td, color: flag ? "#9a3412" : "#94a3b8" }}>{flag ? "missing field" : "ok"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}

// ── Place-fact (reference) sources review group ───────────────────────────────
// Distinct from property/listing sources: approval here gates ONLY the live
// request-time fetch (liveFetchAllowed). The citable public-domain SNAPSHOT
// already renders and keeps rendering — approving does NOT "turn on the data".
function PlaceFactReviewGroup({ mayApprove }: { mayApprove: boolean }) {
  const sources = listRuntimePlaceFactActivations();
  return (
    <section style={{ ...card, display: "grid", gap: 14, borderColor: "#c7b3e6", background: "#faf8ff" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6d28d9" }}>
          Place-fact (reference) sources
        </span>
        <strong style={{ fontSize: 16, color: "#0f172a" }}>Opportunity Zones &amp; HUBZone — live-fetch activation</strong>
        <p style={{ margin: 0, ...muted, fontSize: 13 }}>
          These are published public-domain government boundary facts. The citable{" "}
          <strong>snapshot already renders</strong> on governed surfaces. Approval here flips{" "}
          <strong>liveFetchAllowed → true</strong> (enables the live request-time fetch) — it does{" "}
          <strong>not</strong> turn on the data. Same Module 22/23 + Module 45 authority, same audit ledger.
        </p>
      </div>

      {sources.map((s) => {
        const base = PLACE_FACT_ACTIVATIONS[s.sourceId];
        const audit = readPlaceFactAudit(s.sourceId, 5);
        const live = s.module22 === "APPROVED" && s.module23 === "APPROVED" && s.liveFetchAllowed;
        return (
          <div key={s.sourceId} style={{ border: "1px solid #d7deea", borderRadius: 10, background: "#fff", padding: "16px 18px", display: "grid", gap: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 15, color: "#0f172a" }}>{s.sourceName}</strong>
              <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "2px 10px",
                ...(live
                  ? { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" }
                  : { color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74" }) }}>
                {live ? "LIVE FETCH ACTIVATED" : "PENDING — live fetch gated"}
              </span>
            </div>
            <div style={{ ...muted, fontSize: 13 }}>
              Module 23 (legal): <strong>{s.module23}</strong> · Module 22 (live fetch):{" "}
              <strong>{s.module22}</strong> · liveFetchAllowed: <strong>{String(s.liveFetchAllowed)}</strong> ·
              snapshotRenderAllowed: <strong>{String(s.snapshotRenderAllowed)}</strong> (snapshot renders regardless)
              {s.reviewedByName ? ` · last decision by ${s.reviewedByName} at ${s.reviewedAt}` : ""}
            </div>
            <details style={{ fontSize: 13, ...muted }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "#3b475a" }}>Module 23 — legal &amp; licensing facts</summary>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
                {base?.module23.facts.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <div style={{ marginTop: 6 }}>Rights: {base?.module23.license} · {base?.module23.attributionRequired}</div>
            </details>

            {mayApprove ? (
              <form action={decidePlaceFact} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
                <input type="hidden" name="sourceId" value={s.sourceId} />
                <label style={{ fontSize: 13, fontWeight: 600, color: "#3b475a" }}>
                  Reason / note (recorded in the audit ledger)
                  <textarea name="reason" rows={2} required style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" name="decision" value="APPROVE" style={btn("#6d28d9")}>Approve (enable live fetch)</button>
                  <button type="submit" name="decision" value="REJECT" style={btn("#9a3412")}>Reject</button>
                  <button type="submit" name="decision" value="HOLD" style={btn("#475569")}>Hold</button>
                </div>
              </form>
            ) : (
              <p style={{ margin: 0, ...muted, fontSize: 13 }}>
                View-only. Approving requires Module 45 authority. Holders:{" "}
                {sourceLegalApprovers().map((o) => o.name).join(", ")}.
              </p>
            )}

            {audit.length > 0 && (
              <div style={{ display: "grid", gap: 4, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>Audit ledger — recent decisions</strong>
                {audit.map((e, i) => (
                  <div key={i} style={{ ...muted, fontSize: 12 }}>
                    {e.ts} · <strong>{e.decision}</strong> by {e.actorName} — {e.reason || "(no reason)"}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
        Approval is the ONLY governed way the live fetch is enabled; every decision is attributed in the audit ledger. The build never self-approves.
      </p>
    </section>
  );
}

const td = { padding: "4px 8px", color: "#334155", whiteSpace: "nowrap" as const };
function btn(bg: string) {
  return { background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" } as const;
}
