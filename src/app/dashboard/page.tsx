"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev",
        },
        body: JSON.stringify({
          creditScore: 700,
          liquidity: 100000,
          experienceLevel: 3,
          collateralEquity: 120000,
          acreage: 50,
        }),
      });

      const json = await res.json();
      setData(json);
    }

    load();
  }, []);

  if (!data) {
    return <div style={{ padding: 24 }}>Loading Farm Loan Decision Dashboard...</div>;
  }

  const decision = data.decision || {};
  const scores = data.scores || {};

  return (
    <main style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Farm Loan Decision Dashboard</h1>

      <h2>Tenant ID: {data.tenantId}</h2>

      <h2>SBA Score: {(scores.sba * 100).toFixed(1)}%</h2>

      <h3>Score Breakdown</h3>
      <ul>
        <li>Credit: {(scores.credit * 100).toFixed(1)}%</li>
        <li>Liquidity: {(scores.liquidity * 100).toFixed(1)}%</li>
        <li>Experience: {(scores.experience * 100).toFixed(1)}%</li>
        <li>Collateral: {(scores.collateral * 100).toFixed(1)}%</li>
        <li>Acreage: {(scores.acreage * 100).toFixed(1)}%</li>
      </ul>

      <h3>Farm Recommendations</h3>

      <h4>Crops</h4>
      <ul>
        {decision.crops?.length ? (
          decision.crops.map((c: string, i: number) => <li key={i}>{c}</li>)
        ) : (
          <li>No crop recommendations yet.</li>
        )}
      </ul>

      <h4>Livestock</h4>
      <ul>
        {decision.livestock?.length ? (
          decision.livestock.map((l: string, i: number) => <li key={i}>{l}</li>)
        ) : (
          <li>No livestock recommendations yet.</li>
        )}
      </ul>

      <h4>Equipment</h4>
      <ul>
        {decision.equipment?.length ? (
          decision.equipment.map((e: string, i: number) => <li key={i}>{e}</li>)
        ) : (
          <li>No equipment recommendations yet.</li>
        )}
      </ul>

      <h4>Vendors</h4>
      <ul>
        {decision.vendors?.length ? (
          decision.vendors.map((v: string, i: number) => <li key={i}>{v}</li>)
        ) : (
          <li>No vendor recommendations yet.</li>
        )}
      </ul>

      <h3>Compliance Notice</h3>
      <p>
        AI-GENERATED INFORMATION ONLY — NOT AN OFFICIAL REPORT — NOT VALID FOR
        PERMITTING, FINANCING, LEGAL, OR REGULATORY USE.
      </p>
    </main>
  );
}
