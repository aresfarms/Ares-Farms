"use client";

import { useEffect, useState } from "react";
import {
  parsePropertyComparisonIntake,
  PROPERTY_COMPARISON_MAX,
} from "@/lib/intelligence/propertyComparisonIntake";
import styles from "./FurlongExperience.module.css";

const STORAGE_KEY = "furlong:property-comparison-access:v1";

type CreatedComparison = {
  comparisonId: string;
  accessToken: string;
  propertyCount: number;
  requestedResultCount: number;
  expiresAt: string;
};

type ComparisonStatus = {
  status: string;
  propertyCount: number;
  completedCount: number;
  failedCount: number;
  items: Array<{ id: string; submittedAddress: string; status: string }>;
};

export function PropertyComparisonFrontDoor() {
  const [addressesText, setAddressesText] = useState("");
  const [excludedAddressesText, setExcludedAddressesText] = useState("");
  const [requestedResultCount, setRequestedResultCount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedComparison | null>(null);
  const [status, setStatus] = useState<ComparisonStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!created) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/public/property-comparisons/${created.comparisonId}`, {
          headers: { Authorization: `Bearer ${created.accessToken}` },
          cache: "no-store",
        });
        const result = await response.json() as {
          ok?: boolean;
          comparison?: Omit<ComparisonStatus, "items">;
          items?: ComparisonStatus["items"];
        };
        if (!stopped && response.ok && result.ok && result.comparison && result.items) {
          const next = { ...result.comparison, items: result.items };
          setStatus(next);
          if (!["COMPLETED", "PARTIAL", "FAILED", "AWAITING_EVIDENCE", "HELD"].includes(next.status)) {
            timer = setTimeout(() => void refresh(), 5_000);
          }
        }
      } catch {
        if (!stopped) timer = setTimeout(() => void refresh(), 10_000);
      }
    };
    void refresh();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [created]);

  async function prepareComparison() {
    const parsed = parsePropertyComparisonIntake({
      addressesText, excludedAddressesText, requestedResultCount,
    });
    if (!parsed.ok) {
      setCreated(null);
      setError(parsed.error);
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/public/property-comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressesText, excludedAddressesText, requestedResultCount }),
      });
      const result = await response.json() as {
        ok?: boolean; error?: string; comparisonId?: string; accessToken?: string;
        propertyCount?: number; requestedResultCount?: number; expiresAt?: string;
      };
      if (!response.ok || !result.ok || !result.comparisonId || !result.accessToken ||
          !result.propertyCount || !result.requestedResultCount || !result.expiresAt) {
        throw new Error(result.error || "Furlong could not save this comparison.");
      }
      const value: CreatedComparison = {
        comparisonId: result.comparisonId,
        accessToken: result.accessToken,
        propertyCount: result.propertyCount,
        requestedResultCount: result.requestedResultCount,
        expiresAt: result.expiresAt,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setCreated(value);
    } catch (caught) {
      setCreated(null);
      setError(caught instanceof Error ? caught.message : "Furlong could not save this comparison.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.compare} aria-labelledby="compare-properties-heading">
    <div>
      <p className={styles.eyebrow}>Compare a list</p>
      <h2 id="compare-properties-heading">Which properties should Furlong narrow down?</h2>
      <p>Paste one complete U.S. address per line. Furlong accepts up to {PROPERTY_COMPARISON_MAX.toLocaleString("en-US")} addresses and keeps excluded properties out of the comparison.</p>
    </div>
    <label htmlFor="comparison-addresses">Properties to compare</label>
    <textarea id="comparison-addresses" rows={8} value={addressesText}
      onChange={(event) => setAddressesText(event.target.value)}
      placeholder={"101 Main Street, Town, MD 21000\n205 Market Street, Town, MD 21000"} />
    <div className={styles.compareControls}>
      <label htmlFor="comparison-result-count">Return the best</label>
      <select id="comparison-result-count" value={requestedResultCount}
        onChange={(event) => setRequestedResultCount(Number(event.target.value))}>
        {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
      </select>
    </div>
    <details>
      <summary>Exclude specific addresses</summary>
      <label htmlFor="comparison-exclusions">Addresses to exclude</label>
      <textarea id="comparison-exclusions" rows={3} value={excludedAddressesText}
        onChange={(event) => setExcludedAddressesText(event.target.value)}
        placeholder="One excluded address per line" />
    </details>
    <button type="button" className={styles.primary} onClick={() => void prepareComparison()} disabled={busy}>
      {busy ? "Saving comparison…" : "Prepare this comparison"}
    </button>
    <p className={styles.note}>Preparing the list does not rank it. Each retained address must pass property verification and receive the same evidence-based analysis before Furlong compares profitability.</p>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    {created ? <div role="status" className={styles.accepted}>
      <strong>{created.propertyCount.toLocaleString("en-US")} properties queued for a top-{created.requestedResultCount} comparison.</strong>
      <p>Comparison reference: {created.comparisonId}. Keep this browser session open or save the recovery token shown below. Furlong stores only its hash.</p>
      <code>{created.accessToken}</code>
      <p>Batch verification and ranking have not started merely because intake succeeded.</p>
    </div> : null}
    {status ? <div className={styles.progress} aria-live="polite">
      <strong>Current status: {status.status.replaceAll("_", " ").toLowerCase()}</strong>
      <p>{status.completedCount} of {status.propertyCount} analyses completed · {status.failedCount} failed or unverifiable.</p>
      <ul>
        {status.items.slice(0, 10).map((item) => <li key={item.id}>
          <span>{item.submittedAddress}</span><strong>{item.status.replaceAll("_", " ").toLowerCase()}</strong>
        </li>)}
      </ul>
      {status.items.length > 10 ? <p>Showing the first 10 of {status.items.length} records.</p> : null}
    </div> : null}
  </section>;
}
