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
 * ONE page, ALL sources: every property + place-fact source is listed with its
 * own decision controls (plus an "approve all remaining" action) — no per-source
 * URL, no navigating one at a time.
 */

const muted = { color: "#5d687a", lineHeight: 1.6 } as const;
const card = { background: "#ffffff", border: "1px solid #d7deea", borderRadius: 12, padding: "20px 24px" } as const;

// ── Server action — record ONE property-source decision ──────────────────────
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

// ── Server action — APPROVE ALL remaining property sources at once ───────────
async function approveAllPropertySources(formData: FormData): Promise<void> {
  "use server";
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!canApproveSourceLegal(email)) {
    throw new Error("Not authorized to approve this gate (Module 45 authority required).");
  }
  const op = operatorByEmail(email)!;
  const reason =
    String(formData.get("reason") ?? "").trim() ||
    "Bulk approval of reviewed property sources (operator, Module 45 authority).";
  for (const id of PROPERTY_SOURCE_IDS) {
    const a = getRuntimeActivation(id);
    if (!a?.sourceLive) {
      recordSourceDecision({ sourceId: id, decision: "APPROVE", reviewerId: op.id, reviewerName: op.name, reason });
    }
  }
  revalidatePath("/internal/source-review");
}

// ── Server action — record a PLACE-FACT (reference source) decision ───────────
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

export default async function SourceReviewPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const operator = operatorByEmail(email);
  const mayApprove = canApproveSourceLegal(email);

  const pendingCount = PROPERTY_SOURCE_IDS.filter((id) => !getRuntimeActivation(id)?.sourceLive).length;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 80px", display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a3412" }}>
          Internal · Operator review — not public
        </span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>Source Review — all sources</h1>
        <p style={{ margin: 0, ...muted, fontSize: 14 }}>
          Signed in as <strong>{operator ? `${operator.name} (${operator.role})` : email ?? "unknown"}</strong>.{" "}
          {mayApprove ? "You may approve/reject every gate below." : "View-only — you do not hold Module 45 approve authority."}
        </p>
      </header>

      <PlaceFactReviewGroup mayApprove={mayApprove} />

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
        Property / listing sources
      </div>

      {/* Approve ALL remaining — one action for everything pending. */}
      {mayApprove && pendingCount > 0 && (
        <section style={{ ...card, display: "grid", gap: 10, borderColor: "#0f766e", background: "#f1fbfa" }}>
          <strong style={{ fontSize: 15, color: "#0f172a" }}>Approve all remaining ({pendingCount} pending)</strong>
          <form action={approveAllPropertySources} style={{ display: "grid", gap: 10, maxWidth: 640 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3b475a" }}>
              Reason / note (recorded in the audit ledger for each)
              <textarea name="reason" rows={2} placeholder="e.g. Legal + activation reviewed; approved for live serving." style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid #cbd5e1", fontFamily: "inherit" }} />
            </label>
            <button type="submit" style={btn("#0f766e")}>Approve all remaining property sources</button>
          </form>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
            Applies APPROVE (flip SOURCE_LIVE) to every property source not already live, each attributed in the audit ledger.
          </p>
        </section>
      )}

      {/* Each property source, with its own decision controls. */}
      {PROPERTY_SOURCE_IDS.map((id) => (
        <PropertySourceCard key={id} sourceId={id} mayApprove={mayApprove} />
      ))}
    </main>
  );
}

// ── One property source: summary + status + legal facts + decision + records ──
function PropertySourceCard({ sourceId, mayApprove }: { sourceId: PropertySourceId; mayApprove: boolean }) {
  const base = SOURCE_ACTIVATION[sourceId];
  const activation = getRuntimeActivation(sourceId);
  const records = recordsForReview(sourceId);
  const audit = readAuditEvents({ domain: "source-review", subject: sourceId }).slice(-5).reverse();

  const dates = records.map((c) => c.source_records[0].listingDate).filter((d): d is string => !!d).map((d) => d.slice(0, 4)).sort();
  const states = new Set(records.map((c) => c.source_records[0].state));
  const withPhoto = records.filter((c) => c.source_records[0].photoFile).length;
  const missing = records.filter((c) => {
    const r = c.source_records[0];
    return !r.state || !r.town || r.town === "Unknown" || !r.exactAddress;
  }).length;
  const pct = records.length ? Math.round((withPhoto / records.length) * 100) : 0;
  const dateRange = dates.length ? `${dates[0]}–${dates[dates.length - 1]}` : "n/a (current inventory)";
  const live = !!activation?.sourceLive;

  return (
    <section style={{ ...card, display: "grid", gap: 10, borderColor: live ? "#5bbd9e" : mayApprove ? "#fdba74" : "#d7deea" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 16, color: "#0f172a" }}>{activation?.sourceName ?? sourceId}</strong>
        <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "2px 10px",
          ...(live
            ? { color: "#0f6e56", background: "#e1f5ee", border: "1px solid #5bbd9e" }
            : { color: "#9a3412", background: "#fff7ed", border: "1px solid #fdba74" }) }}>
          {live ? "SOURCE_LIVE" : "PENDING APPROVAL"}
        </span>
      </div>

      <div style={{ ...muted, fontSize: 13.5 }}>
        {records.length.toLocaleString("en-US")} records · listing dates {dateRange} · {states.size} states · {pct}% photos · {missing} missing a field
      </div>
      <div style={{ ...muted, fontSize: 13 }}>
        Module 23 (legal): <strong>{activation?.module23}</strong> · Module 22 (activation): <strong>{activation?.module22}</strong> · SOURCE_LIVE: <strong>{String(live)}</strong>
        {activation?.reviewedByName ? ` · last decision by ${activation.reviewedByName} at ${activation.reviewedAt}` : ""}
      </div>

      <details style={{ fontSize: 13, ...muted }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#3b475a" }}>Module 23 — legal &amp; licensing facts</summary>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
          {base?.module23.facts.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <div style={{ marginTop: 6 }}>Rights: {base?.module23.license} · {base?.module23.attributionRequired}</div>
        <div>Dataset: {records[0]?.source_url ?? "—"}</div>
      </details>

      {mayApprove ? (
        <form action={decideSource} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
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
        <p style={{ margin: 0, ...muted, fontSize: 13 }}>
          View-only. Approving requires Module 45 authority. Holders: {sourceLegalApprovers().map((o) => o.name).join(", ")}.
        </p>
      )}

      {audit.length > 0 && (
        <div style={{ display: "grid", gap: 4, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
          <strong style={{ fontSize: 13, color: "#0f172a" }}>Recent decisions</strong>
          {audit.map((e, i) => (
            <div key={i} style={{ ...muted, fontSize: 12 }}>{e.ts} · <strong>{e.decision}</strong> by {e.actorName} — {e.reason || "(no reason)"}</div>
          ))}
        </div>
      )}

      {records.length > 0 && (
        <details style={{ fontSize: 13 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#3b475a" }}>
            View records ({records.length.toLocaleString("en-US")}; first {Math.min(25, records.length)})
          </summary>
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#475569" }}>
                  {["State", "County", "Town", "Type", "Price", "Address", "ID"].map((h) => (
                    <th key={h} style={{ padding: "4px 8px", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 25).map((c) => {
                  const r = c.source_records[0];
                  return (
                    <tr key={c.canonical_property_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={td}>{r.state}</td>
                      <td style={td}>{r.county}</td>
                      <td style={td}>{r.town}</td>
                      <td style={td}>{r.propertyType}</td>
                      <td style={td}>{r.price ? `$${r.price.toLocaleString("en-US")}` : "—"}</td>
                      <td style={td}>{r.exactAddress ?? "—"}</td>
                      <td style={td}>{r.listingId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

// ── Place-fact (reference) sources review group ───────────────────────────────
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
                View-only. Approving requires Module 45 authority. Holders: {sourceLegalApprovers().map((o) => o.name).join(", ")}.
              </p>
            )}

            {audit.length > 0 && (
              <div style={{ display: "grid", gap: 4, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>Recent decisions</strong>
                {audit.map((e, i) => (
                  <div key={i} style={{ ...muted, fontSize: 12 }}>{e.ts} · <strong>{e.decision}</strong> by {e.actorName} — {e.reason || "(no reason)"}</div>
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
