"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parsePropertyComparisonIntake, PROPERTY_COMPARISON_MAX } from "@/lib/intelligence/propertyComparisonIntake";
import { readComparisonAccess, saveComparisonAccess, type SavedComparisonAccess } from "@/lib/intelligence/propertyComparisonAccess";
import type { PropertyReportPreparation } from "@/lib/intelligence/propertyReportPreparation";
import styles from "./FurlongExperience.module.css";

type ComparisonStatus = {
  status: string; propertyCount: number; completedCount: number; failedCount: number;
  items: Array<{
    id: string; submittedAddress: string; normalizedAddress: string | null;
    propertyId: string | null; status: string; reportPreparation: PropertyReportPreparation;
    resultSnapshot?: { evidenceCapture?: { capturedAt: string; checklist: Array<{ domain: string; status: string; action: string }> } };
  }>;
};
const terminal = new Set(["COMPLETED", "PARTIAL", "FAILED", "AWAITING_EVIDENCE", "HELD"]);

export function PropertyComparisonFrontDoor(props: {
  initialAddress?: string; comparisonId?: string; reportSalesOpen?: boolean;
} = {}) {
  const single = props.initialAddress !== undefined;
  const [addressesText, setAddressesText] = useState(props.initialAddress ?? "");
  const [excludedAddressesText, setExcludedAddressesText] = useState("");
  const [requestedResultCount, setRequestedResultCount] = useState(single ? 1 : 5);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<SavedComparisonAccess | null>(null);
  const [status, setStatus] = useState<ComparisonStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(20);
  const [recoveryId, setRecoveryId] = useState(props.comparisonId ?? "");
  const [recoveryToken, setRecoveryToken] = useState("");

  useEffect(() => {
    // An address link must never silently reopen another property's last case.
    if (!props.comparisonId && single) return;
    const saved = readComparisonAccess(window.sessionStorage, props.comparisonId);
    if (saved) setCreated(saved);
  }, [props.comparisonId, single]);

  useEffect(() => {
    if (!created) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/public/property-comparisons/${created.comparisonId}`, {
          headers: { Authorization: `Bearer ${created.accessToken}` }, cache: "no-store",
        });
        const result = await response.json() as {
          ok?: boolean; error?: string; comparison?: Omit<ComparisonStatus, "items">; items?: ComparisonStatus["items"];
        };
        if (stopped) return;
        if (!response.ok || !result.ok || !result.comparison || !result.items) {
          setError(result.error || "The saved property could not be reopened. Check its reference and recovery token.");
          if (response.status >= 500) timer = setTimeout(() => void refresh(), 15_000);
          return;
        }
        const next = { ...result.comparison, items: result.items };
        setStatus(next);
        setError(null);
        if (!terminal.has(next.status)) timer = setTimeout(() => void refresh(), 5_000);
      } catch {
        if (!stopped) {
          setError("The connection was interrupted. Your saved work remains available; retrying…");
          timer = setTimeout(() => void refresh(), 15_000);
        }
      }
    };
    void refresh();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [created, refreshCount]);

  function remember(value: SavedComparisonAccess) {
    setCreated(value);
    setRecoveryId(value.comparisonId);
    try { saveComparisonAccess(window.sessionStorage, value); }
    catch { setError("This browser could not save the recovery token. Copy the reference and token below before leaving."); }
    if (single) {
      const url = new URL(window.location.href);
      url.searchParams.set("comparisonId", value.comparisonId);
      window.history.replaceState(null, "", url);
    }
  }

  async function prepareComparison() {
    if (busy) return;
    const parsed = parsePropertyComparisonIntake({ addressesText, excludedAddressesText, requestedResultCount });
    if (!parsed.ok) { setError(parsed.error); return; }
    if (single && parsed.value.addresses.length !== 1) { setError("Enter one complete address for this report."); return; }
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/public/property-comparisons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressesText, excludedAddressesText, requestedResultCount }),
      });
      const result = await response.json() as Partial<SavedComparisonAccess> & { ok?: boolean; error?: string };
      if (!response.ok || !result.ok || !result.comparisonId || !result.accessToken ||
          !result.propertyCount || !result.requestedResultCount || !result.expiresAt) {
        throw new Error(result.error || "Furlong could not save this property.");
      }
      setStatus(null); setVisibleCount(20);
      remember(result as SavedComparisonAccess);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Furlong could not save this property."); }
    finally { setBusy(false); }
  }

  async function recover() {
    if (busy) return;
    if (!/^[0-9a-f-]{36}$/i.test(recoveryId.trim()) || !/^furlong-comparison-[A-Za-z0-9_-]{43}$/.test(recoveryToken.trim())) {
      setError("Enter the saved reference and complete recovery token."); return;
    }
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/public/property-comparisons/${recoveryId.trim()}`, {
        headers: { Authorization: `Bearer ${recoveryToken.trim()}` }, cache: "no-store",
      });
      const result = await response.json() as { ok?: boolean; error?: string; comparison?: {
        propertyCount: number; requestedResultCount: number; expiresAt: string;
      } };
      if (!response.ok || !result.ok || !result.comparison) throw new Error(result.error || "This reference and recovery token could not be verified.");
      setStatus(null); setVisibleCount(20);
      remember({ ...result.comparison, comparisonId: recoveryId.trim(), accessToken: recoveryToken.trim() });
      setRecoveryToken("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The saved work could not be reopened."); }
    finally { setBusy(false); }
  }

  return <section className={styles.compare} aria-labelledby="compare-properties-heading">
    <div>
      <p className={styles.eyebrow}>{single ? "Prepare your property report" : "Compare a list"}</p>
      <h2 id="compare-properties-heading">{single ? "Build the evidence for this property." : "Which properties should Furlong narrow down?"}</h2>
      <p>{single ? "Save this property, follow the source checks and reopen the results here. Payment becomes available only when the analysis and finished report pass verification." :
        `Paste one complete U.S. address per line, up to ${PROPERTY_COMPARISON_MAX.toLocaleString("en-US")} addresses.`}</p>
    </div>
    {!created ? <>
      <label htmlFor="comparison-addresses">{single ? "Property address" : "Properties to compare"}</label>
      <textarea id="comparison-addresses" rows={single ? 2 : 8} value={addressesText}
        onChange={event => setAddressesText(event.target.value)} placeholder="Street address, city, state and ZIP" />
      {!single ? <>
        <div className={styles.compareControls}>
          <label htmlFor="comparison-result-count">Return the best</label>
          <select id="comparison-result-count" value={requestedResultCount} onChange={event => setRequestedResultCount(Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map(count => <option key={count} value={count}>{count}</option>)}
          </select>
        </div>
        <details><summary>Exclude specific addresses</summary>
          <label htmlFor="comparison-exclusions">Addresses to exclude</label>
          <textarea id="comparison-exclusions" rows={3} value={excludedAddressesText} onChange={event => setExcludedAddressesText(event.target.value)} />
        </details>
      </> : null}
      <button type="button" className={styles.primary} onClick={() => void prepareComparison()} disabled={busy}>
        {busy ? "Saving…" : single ? "Save and prepare this property" : "Prepare this comparison"}
      </button>
      <p className={styles.note}>Source checks run after the property is saved. Saving does not establish feasibility, rank uses or start a paid order.</p>
    </> : null}
    <details open={Boolean(props.comparisonId && !created)}>
      <summary>Reopen saved work</summary>
      <label htmlFor="comparison-recovery-id">Saved reference</label>
      <input id="comparison-recovery-id" value={recoveryId} onChange={event => setRecoveryId(event.target.value)} autoComplete="off" />
      <label htmlFor="comparison-recovery-token">Recovery token</label>
      <input id="comparison-recovery-token" type="password" value={recoveryToken} onChange={event => setRecoveryToken(event.target.value)} autoComplete="off" />
      <button type="button" className={styles.secondary} disabled={busy} onClick={() => void recover()}>Reopen</button>
    </details>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    {created ? <div className={styles.accepted}>
      <strong>{created.propertyCount.toLocaleString("en-US")} {created.propertyCount === 1 ? "property saved" : "properties saved"}.</strong>
      <p>Reference: {created.comparisonId}</p>
      <details><summary>Save your private recovery token</summary>
        <p>Keep this reference and token together to reopen the work in another browser. Anyone with the token can access it.</p>
        <code style={{ overflowWrap: "anywhere" }}>{created.accessToken}</code>
      </details>
      <button type="button" className={styles.secondary} disabled={busy} onClick={() => { setCreated(null); setStatus(null); setError(null);
        if (single) { const url = new URL(window.location.href); url.searchParams.delete("comparisonId"); window.history.replaceState(null, "", url); } }}>Start another property or list</button>
    </div> : null}
    {status && created ? <div className={styles.progress}>
      <p role="status">{status.completedCount} of {status.propertyCount} analyses completed · {status.failedCount} could not be verified.</p>
      <button type="button" className={styles.secondary} onClick={() => setRefreshCount(n => n + 1)}>Refresh status</button>
      {status.items.slice(0, visibleCount).map(item => <article key={item.id}>
        <h3>{item.normalizedAddress || item.submittedAddress}</h3>
        <p>{item.status === "NEEDS_EVIDENCE" ? "Evidence needed before the report can be completed." : item.status.replaceAll("_", " ").toLowerCase()}</p>
        {item.resultSnapshot?.evidenceCapture ? <p>Public-source check: {new Date(item.resultSnapshot.evidenceCapture.capturedAt).toLocaleString()}. Evidence found still needs to support the specific proposed uses.</p> : null}
        {item.reportPreparation?.missingEvidence.length ? <details open={single}>
          <summary>What this property still needs</summary>
          <ul>{item.reportPreparation.missingEvidence.map((gap, i) => <li key={i}>{gap}</li>)}</ul>
        </details> : null}
        {item.reportPreparation?.evidenceReady && item.propertyId ? <>
          <p>The saved economic analysis passed its current evidence checks. The property facts and finished PDF are checked again before checkout.</p>
          {props.reportSalesOpen ? <Link className={styles.primary} href={`/purchase?${new URLSearchParams({
            product: "focused_property_report", address: item.normalizedAddress || item.submittedAddress,
            propertyId: item.propertyId, analysisComparisonId: created.comparisonId,
          })}`}>Prepare the $49 Property Report</Link> : props.reportSalesOpen === false ? <p>Report sales have not opened yet.</p> :
            <Link href={`/property-evidence?${new URLSearchParams({ address: item.normalizedAddress || item.submittedAddress, comparisonId: created.comparisonId })}`}>Open report preparation</Link>}
        </> : null}
      </article>)}
      {status.items.length > visibleCount ? <button type="button" className={styles.secondary} onClick={() => setVisibleCount(n => n + 20)}>Show more properties</button> : null}
    </div> : created ? <p role="status">Loading saved work…</p> : null}
  </section>;
}
