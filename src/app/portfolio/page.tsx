"use client";

import { useEffect, useState } from "react";

export default function PortfolioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/rank", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            farms: [
              {
                tenantId: "FARM_001",
                scores: {
                  credit: 0.8,
                  liquidity: 0.6,
                  experience: 0.5,
                  collateral: 0.7,
                  acreage: 0.6,
                  sba: 0.75,
                },
                risk: { volatility: 0.3, survivability: 0.7 },
                financial: {
                  profit: { grossProfit: 50000 },
                },
              },
              {
                tenantId: "FARM_002",
                scores: {
                  credit: 0.6,
                  liquidity: 0.4,
                  experience: 0.3,
                  collateral: 0.5,
                  acreage: 0.4,
                  sba: 0.55,
                },
                risk: { volatility: 0.6, survivability: 0.4 },
                financial: {
                  profit: { grossProfit: 20000 },
                },
              },
            ],
          }),
        });

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading portfolio...</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Farm Portfolio Dashboard</h1>

      <h2>Portfolio Summary</h2>
      <pre>{JSON.stringify(data?.portfolio, null, 2)}</pre>

      <h2>Ranked Farms</h2>

      <div style={{ display: "grid", gap: 16 }}>
        {data?.ranked?.map((farm: any) => (
          <div
            key={farm.tenantId}
            style={{
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <h3>
              {farm.tenantId} — Rank #{farm.rankPosition}
            </h3>

            <p>Score: {farm.rankScore?.toFixed(2)}</p>
            <p>SBA: {farm.scores?.sba}</p>
            <p>Liquidity: {farm.scores?.liquidity}</p>
            <p>Risk: {farm.risk?.volatility}</p>
            <p>Survivability: {farm.risk?.survivability}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
