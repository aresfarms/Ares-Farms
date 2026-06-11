"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { GuidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import {
  generatePossibilityMap,
  type DiscoveryAnswers, type PersonaId, type GoalId, type TimeHorizon,
  type ResourceId, type ConstraintId, type ValueId, type PropertyInterest,
} from "@/lib/discovery/possibilityEngine";

/**
 * Possibility Discovery Engine — the guided, possibility-first front door
 * (anonymous, in-session). Caitlin's vision (2026-06-11):
 *   Person → Goals → Constraints → Possibilities → Pathways → Actions.
 * The property search is ONE possible destination, never assumed to be THE one.
 *
 * DOCTRINE (mirrors GuidedIntake): everything lives in component state; NOTHING
 * about the person is sent to a server. The Possibility Map is computed in the
 * browser by the deterministic routing layer (possibilityEngine) from these
 * answers + the verified feed the page already rendered. No PII, no qualification
 * — the map is education + routing, never a determination. "Confirm with a
 * licensed professional" is built into every output, and Human Review is always
 * shown.
 */

// ── small UI helpers (match GuidedIntake's inline-style vocabulary) ──────────
function Chip({ on, color, children, onClick }: { on: boolean; color: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      style={{ fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "5px 13px", cursor: "pointer",
        border: `1.5px solid ${on ? color : "#cbd5e1"}`, background: on ? color : "#fff", color: on ? "#fff" : "#334155" }}>
      {children}
    </button>
  );
}
function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: "#1f2a3d" }}>{label}{hint ? <span style={{ fontWeight: 400, color: "#7a8aa0" }}> · {hint}</span> : null}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
    </div>
  );
}

const PERSONAS: [PersonaId, string][] = [
  ["individual", "Individual"], ["family", "Family"], ["farmer", "Farmer"], ["rancher", "Rancher"],
  ["landowner", "Landowner"], ["business-owner", "Business Owner"], ["investor", "Investor"],
  ["nonprofit", "Nonprofit"], ["municipality", "Municipality"], ["tribal", "Tribal Organization"],
  ["developer", "Developer"], ["veteran", "Veteran"], ["retiree", "Retiree"], ["student", "Student"], ["other", "Other"],
];
const GOALS: [GoalId, string][] = [
  ["buy-land", "Buy land"], ["start-expand-farm", "Start / expand a farm"], ["retire", "Retire"],
  ["generate-income", "Generate income"], ["preserve-family-land", "Preserve family land"],
  ["buy-sell-business", "Buy / sell a business"], ["improve-environment", "Improve environmental outcomes"],
  ["develop", "Develop"], ["create-housing", "Create housing"], ["reduce-debt", "Reduce debt"],
  ["improve-cash-flow", "Improve cash flow"], ["access-programs", "Access programs"],
  ["access-financing", "Access financing"], ["build-wealth", "Build generational wealth"],
  ["passive-income", "Passive income"], ["evaluate-opportunities", "Evaluate opportunities"],
  ["not-sure", "I'm not sure yet"],
];
const HORIZONS: [TimeHorizon, string][] = [
  ["immediate", "Immediate (0–6mo)"], ["near", "Near (6–24mo)"], ["mid", "Mid (2–5y)"], ["long", "Long (5–10y)"], ["legacy", "Legacy (10+y)"],
];
const RESOURCES: [ResourceId, string][] = [
  ["land", "Land"], ["business", "Business"], ["farm", "Farm"], ["equipment", "Equipment"], ["livestock", "Livestock"],
  ["housing", "Housing"], ["savings", "Savings"], ["retirement-assets", "Retirement assets"], ["credit-access", "Credit access"],
  ["family-support", "Family support"], ["industry-experience", "Industry experience"], ["professional-licenses", "Professional licenses"], ["none", "None of these"],
];
const CONSTRAINTS: [ConstraintId, string][] = [
  ["limited-capital", "Limited capital"], ["credit", "Credit"], ["experience", "Experience"], ["time", "Time"],
  ["physical", "Physical"], ["regulatory", "Regulatory"], ["environmental", "Environmental"], ["market-uncertainty", "Market uncertainty"],
  ["labor", "Labor"], ["geographic", "Geographic"], ["unsure-where-to-start", "Unsure where to start"],
];
const VALUES: [ValueId, string][] = [
  ["income", "Income"], ["stability", "Stability"], ["family-legacy", "Family legacy"], ["environmental-stewardship", "Environmental stewardship"],
  ["community-impact", "Community impact"], ["growth", "Growth"], ["risk-reduction", "Risk reduction"], ["retirement-security", "Retirement security"],
  ["lifestyle", "Lifestyle"], ["independence", "Independence"],
];

const CAT_LABELS: Record<string, string> = {
  homes: "Homes", "farms-ranches": "Farms & Ranches", land: "Land", commercial: "Commercial",
  hospitality: "Hospitality", businesses: "Businesses", misc: "Misc",
};

export function DiscoveryEngine({ feed }: { feed: GuidedIntakeFeed }) {
  const [persona, setPersona] = useState<PersonaId | undefined>();
  const [goals, setGoals] = useState<GoalId[]>([]);
  const [horizon, setHorizon] = useState<TimeHorizon | undefined>();
  const [resources, setResources] = useState<ResourceId[]>([]);
  const [constraints, setConstraints] = useState<ConstraintId[]>([]);
  const [values, setValues] = useState<ValueId[]>([]); // click order = priority order
  const [propertyInterest, setPropertyInterest] = useState<PropertyInterest | undefined>();
  const [pStates, setPStates] = useState<string[]>([]);
  const [pCats, setPCats] = useState<string[]>([]);
  const [financingRequired, setFinancingRequired] = useState(false);
  const [alreadyOwn, setAlreadyOwn] = useState(false);
  const [shown, setShown] = useState(false);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const availableCats = useMemo(() => {
    const src = pStates.length ? feed.states.filter((s) => pStates.includes(s.abbr)) : feed.states;
    const agg = new Map<string, number>();
    for (const s of src) for (const [k, v] of Object.entries(s.byCategory)) agg.set(k, (agg.get(k) ?? 0) + (v ?? 0));
    return [...agg.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  }, [pStates, feed.states]);

  const answers: DiscoveryAnswers = {
    persona, goals, timeHorizon: horizon, resources, constraints, values, propertyInterest,
    property: propertyInterest && propertyInterest !== "no"
      ? { states: pStates, categories: pCats, financingRequired, alreadyOwn }
      : undefined,
  };

  const map = useMemo(() => (shown ? generatePossibilityMap(answers, feed) : null), [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  if (shown && map) {
    return <PossibilityMapView map={map} onBack={() => setShown(false)} />;
  }

  const showProperty = propertyInterest === "yes" || propertyInterest === "maybe";

  return (
    <section data-testid="discovery-engine" aria-label="Possibility discovery"
      style={{ display: "grid", gap: 22, maxWidth: 760, border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "26px 28px" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: 22, color: "#101a2b", lineHeight: 1.2 }}>What are you trying to accomplish?</strong>
        <span style={{ fontSize: 13.5, color: "#5d687a", lineHeight: 1.5 }}>
          No right or wrong answers. We're not here to sell you something — we help you understand your possibilities.
          This is anonymous: your answers stay in your browser, nothing is sent or stored, and none of it is ever sold.
        </span>
      </div>

      <Group label="1 · Who are you?">
        {PERSONAS.map(([id, label]) => (
          <Chip key={id} on={persona === id} color="#185FA5" onClick={() => setPersona(persona === id ? undefined : id)}>{label}</Chip>
        ))}
      </Group>

      <Group label="2 · What are you trying to accomplish?" hint="choose any">
        {GOALS.map(([id, label]) => (
          <Chip key={id} on={goals.includes(id)} color="#0f766e" onClick={() => toggle(goals, id, setGoals)}>{label}</Chip>
        ))}
      </Group>

      <Group label="3 · Time horizon">
        {HORIZONS.map(([id, label]) => (
          <Chip key={id} on={horizon === id} color="#534AB7" onClick={() => setHorizon(horizon === id ? undefined : id)}>{label}</Chip>
        ))}
      </Group>

      <Group label="4 · Resources you have" hint="choose any">
        {RESOURCES.map(([id, label]) => (
          <Chip key={id} on={resources.includes(id)} color="#3B6D11" onClick={() => toggle(resources, id, setResources)}>{label}</Chip>
        ))}
      </Group>

      <Group label="5 · Constraints" hint="choose any — no judgment">
        {CONSTRAINTS.map(([id, label]) => (
          <Chip key={id} on={constraints.includes(id)} color="#993556" onClick={() => toggle(constraints, id, setConstraints)}>{label}</Chip>
        ))}
      </Group>

      <Group label="6 · What matters most" hint="tap in order of importance">
        {VALUES.map(([id, label]) => {
          const rank = values.indexOf(id);
          return (
            <Chip key={id} on={rank >= 0} color="#854F0B" onClick={() => toggle(values, id, setValues)}>
              {rank >= 0 ? `${rank + 1} · ` : ""}{label}
            </Chip>
          );
        })}
      </Group>

      <Group label="7 · Interested in property?" hint="property is one option — never assumed">
        {(["yes", "maybe", "no"] as PropertyInterest[]).map((v) => (
          <Chip key={v} on={propertyInterest === v} color="#185FA5" onClick={() => setPropertyInterest(propertyInterest === v ? undefined : v)}>
            {v === "yes" ? "Yes" : v === "maybe" ? "Maybe" : "No"}
          </Chip>
        ))}
      </Group>

      {showProperty && (
        <div style={{ display: "grid", gap: 14, borderLeft: "3px solid #FAEEDA", paddingLeft: 16 }}>
          <Group label="Property — which states?" hint="only states with current inventory">
            {feed.states.map((s) => (
              <Chip key={s.abbr} on={pStates.includes(s.abbr)} color="#0f766e" onClick={() => toggle(pStates, s.abbr, setPStates)}>{s.abbr} · {s.total}</Chip>
            ))}
          </Group>
          {availableCats.length > 0 && (
            <Group label="Property — what kind?">
              {availableCats.map(([cat, n]) => (
                <Chip key={cat} on={pCats.includes(cat)} color="#6d28d9" onClick={() => toggle(pCats, cat, setPCats)}>{CAT_LABELS[cat] ?? cat} · {n}</Chip>
              ))}
            </Group>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#3b475a" }}>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={financingRequired} onChange={(e) => setFinancingRequired(e.target.checked)} /> Financing likely needed
            </label>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={alreadyOwn} onChange={(e) => setAlreadyOwn(e.target.checked)} /> I already own property
            </label>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 18 }}>
        <button type="button" data-testid="discovery-generate" onClick={() => setShown(true)}
          style={{ fontSize: 15, fontWeight: 800, color: "#fff", background: "#0f766e", border: "none", borderRadius: 999, padding: "12px 26px", cursor: "pointer" }}>
          Show my possibilities →
        </button>
        <Link href="/explore?lane=property-land" data-testid="discovery-browse-link"
          style={{ fontSize: 13.5, fontWeight: 700, color: "#185FA5", textDecoration: "underline" }}>
          Or just browse properties →
        </Link>
        <span style={{ fontSize: 12, color: "#9aa6b6" }}>You can get a map without giving your name.</span>
      </div>
    </section>
  );
}

// ── The Possibility Map render (the 10 outputs) ──────────────────────────────
import type { PossibilityMap, PossibilityItem } from "@/lib/discovery/possibilityEngine";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 16, color: "#101a2b" }}>
        <span style={{ color: "#9aa6b6", fontWeight: 700 }}>{n}.</span> {title}
      </h3>
      {children}
    </section>
  );
}
function ItemList({ items }: { items: PossibilityItem[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ border: "1px solid #e6ebf2", borderRadius: 10, padding: "10px 14px", display: "grid", gap: 3 }}>
          <strong style={{ fontSize: 13.5, color: "#1f2a3d" }}>{it.label}</strong>
          <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.5 }}>{it.description}</span>
          <span style={{ fontSize: 12, color: "#7a8aa0" }}>Confirm with {it.confirmWith}.</span>
        </div>
      ))}
    </div>
  );
}

function PossibilityMapView({ map, onBack }: { map: PossibilityMap; onBack: () => void }) {
  return (
    <section data-testid="possibility-map" aria-label="Your possibility map"
      style={{ display: "grid", gap: 26, maxWidth: 820, border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "28px 30px" }}>
      <div style={{ display: "grid", gap: 8 }}>
        <button type="button" onClick={onBack} style={{ justifySelf: "start", fontSize: 12.5, fontWeight: 700, color: "#185FA5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          ← Change my answers
        </button>
        <h2 style={{ margin: 0, fontSize: 24, color: "#101a2b" }}>{map.headline}</h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "#5d687a", lineHeight: 1.55 }}>{map.summary}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {map.themes.map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, color: "#3b475a", background: "#f1f5f9", borderRadius: 999, padding: "4px 11px" }}>{t}</span>
          ))}
        </div>
      </div>

      <Section n={2} title="Recommended pathways to explore">
        <div style={{ display: "grid", gap: 12 }}>
          {map.pathways.map((p) => (
            <div key={p.id} style={{ border: "1px solid #e6ebf2", borderRadius: 12, padding: "14px 16px", display: "grid", gap: 7 }}>
              <strong style={{ fontSize: 15, color: "#101a2b" }}>{p.title}</strong>
              <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.5 }}>{p.whyItFits}</span>
              <ul style={{ margin: "2px 0 0", paddingLeft: 18, display: "grid", gap: 4 }}>
                {p.exploreSteps.map((s, i) => <li key={i} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.45 }}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {map.risks.length > 0 && (
        <Section n={3} title="Risks & constraints to keep in mind">
          <div style={{ display: "grid", gap: 7 }}>
            {map.risks.map((r) => (
              <div key={r.constraint} style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.5 }}>
                <strong style={{ color: "#3b475a" }}>{r.note}</strong> {r.mitigationToExplore}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section n={4} title="Available programs to look into"><ItemList items={map.programs} /></Section>
      <Section n={5} title="Financing options to explore"><ItemList items={map.financing} /></Section>
      <Section n={6} title="Revenue opportunities to read about"><ItemList items={map.revenue} /></Section>
      <Section n={7} title="Environmental opportunities"><ItemList items={map.environmental} /></Section>

      <Section n={8} title="Property opportunities">
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#5d687a", lineHeight: 1.5 }}>{map.property.note}</span>
          {map.property.relevant && map.property.verified && (
            <div style={{ display: "grid", gap: 6, border: "1px solid #e6ebf2", borderRadius: 10, padding: "12px 14px" }}>
              <strong style={{ fontSize: 13.5, color: "#1f2a3d" }}>
                {map.property.verified.totalCurrent} verified current listing{map.property.verified.totalCurrent === 1 ? "" : "s"} · as of {map.property.verified.asOf}
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {map.property.verified.states.map((s) => (
                  <span key={s.abbr} style={{ fontSize: 12, color: "#3b475a", background: "#f1f5f9", borderRadius: 999, padding: "3px 10px" }}>
                    {s.abbr}: {s.total}{s.oz ? ` · ${s.oz} OZ` : ""}{s.hubzone ? ` · ${s.hubzone} HUBZone` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link href={map.property.exploreHref} style={{ fontSize: 13.5, fontWeight: 700, color: "#185FA5", textDecoration: "underline" }}>
            Browse properties →
          </Link>
        </div>
      </Section>

      <Section n={9} title="Suggested next actions">
        <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
          {map.nextActions.map((a, i) => <li key={i} style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.5 }}>{a}</li>)}
        </ol>
      </Section>

      {/* #10 — the safety valve, made prominent */}
      <section data-testid="human-review" style={{ display: "grid", gap: 8, border: "2px solid #0f766e", borderRadius: 12, background: "#f0fdfa", padding: "16px 18px" }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#0f5c52" }}>10. Talk to a licensed professional</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#3b475a", lineHeight: 1.55 }}>{map.humanReview.message}</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
          {map.humanReview.routeTo.map((r, i) => <li key={i} style={{ fontSize: 12.5, color: "#3b475a" }}>{r}</li>)}
        </ul>
      </section>
    </section>
  );
}
