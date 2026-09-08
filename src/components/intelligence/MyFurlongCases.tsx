"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Summary = { caseId: string; propertyAddress: string | null; customerGoal: string | null; currentStage: string; updatedAt: string };
export function MyFurlongCases() {
  const [cases, setCases] = useState<Summary[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void fetch("/api/intelligence/cases", { cache: "no-store", signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Saved cases could not be loaded."); setCases(data.cases); })
      .catch(error => { if (error.name !== "AbortError") setError(error.message); });
    return () => controller.abort();
  }, [retry]);
  return <section>
    <h1>My Furlong cases</h1><p>Your saved projects. Saving is separate from sharing; no provider is selected here.</p>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} type="button">Try again</button></div>
      : cases === null ? <p role="status">Loading your saved cases…</p>
      : cases.length === 0 ? <p>No saved cases yet. <Link href="/">Explore a property or project</Link>, then choose to save it.</p>
      : <ul style={{ padding: 0, listStyle: "none", display: "grid", gap: 14 }}>{cases.map(item => <li key={item.caseId} style={{ border: "1px solid #ccd6df", borderRadius: 12, padding: 20, background: "#fff" }}>
        <Link href={"/intelligence/cases/" + encodeURIComponent(item.caseId)} style={{ fontSize: 18, fontWeight: 700 }}>{item.propertyAddress || item.customerGoal || "Saved Furlong case"}</Link>
        <p>{item.customerGoal}</p><p>Recorded stage: {item.currentStage.replaceAll("_"," ").toLowerCase()} · Updated {new Date(item.updatedAt).toLocaleString()}</p>
      </li>)}</ul>}
    <p><Link href="/">Start another project</Link> · <Link href="/status">Check a service request</Link></p>
  </section>;
}
