"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { GuidedIntakeFeed } from "@/lib/property/guidedIntakeFeed";
import {
  generatePossibilityMap,
  type DiscoveryAnswers, type PossibilityMap, type PossibilityItem,
} from "@/lib/discovery/possibilityEngine";

/**
 * Possibility Discovery Engine — a CONVERSATIONAL, AI-guided interview.
 *
 * Caitlin's vision (2026-06-11): it should feel like talking to a knowledgeable
 * guide, not filling out a form. One question at a time; each next question
 * adapts to the last answer. The server (/api/public/discovery/converse) drives the
 * conversation — an AI guide phrases each question (Tier-1, logged), with a
 * DETERMINISTIC floor that takes over whenever the model is unavailable or
 * uncertain. The guide is grounded only in verified facts and never says a
 * person qualifies; the Possibility Map (the 10 outputs) is produced here by the
 * VERIFIED deterministic engine from the accumulated answers + the verified feed
 * — so no number, program, or eligibility result is ever fabricated.
 *
 * Anonymous: only the person's INTERESTS (option codes) are sent. Free text is
 * PII-guarded server-side and never stored. Browse stays one click away.
 */

type Option = { value: string; label: string };
type QuestionResponse = {
  kind: "question";
  slot: string;
  prompt: string;
  options: Option[];
  multi: boolean;
  allowFreeText: boolean;
  source: "ai" | "guide";
  answers: DiscoveryAnswers;
};
type MapReadyResponse = { kind: "map-ready"; answers: DiscoveryAnswers };
type ConverseResponse = QuestionResponse | MapReadyResponse;

const EMPTY: DiscoveryAnswers = { goals: [], resources: [], constraints: [], values: [] };

export function DiscoveryEngine({ feed }: { feed: GuidedIntakeFeed }) {
  const [turns, setTurns] = useState<{ role: "assistant" | "user"; text: string }[]>([]);
  const [answers, setAnswers] = useState<DiscoveryAnswers>(EMPTY);
  const [q, setQ] = useState<QuestionResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<PossibilityMap | null>(null);
  const askedSlots = useRef<string[]>([]); // slots presented (a Skip is still "done")
  const started = useRef(false);

  async function post(payload: unknown): Promise<ConverseResponse> {
    const res = await fetch("/api/public/discovery/converse", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`converse ${res.status}`);
    return (await res.json()) as ConverseResponse;
  }

  function handle(r: ConverseResponse) {
    if (r.kind === "map-ready") {
      setAnswers(r.answers);
      setMap(generatePossibilityMap(r.answers, feed));
      setQ(null);
      return;
    }
    setAnswers(r.answers);
    if (!askedSlots.current.includes(r.slot)) askedSlots.current.push(r.slot);
    setTurns((t) => [...t, { role: "assistant", text: r.prompt }]);
    setQ(r);
    setSelected([]);
    setFreeText("");
  }

  async function start() {
    setLoading(true); setError(null); setMap(null); setTurns([]); setAnswers(EMPTY); setQ(null);
    askedSlots.current = [];
    try { handle(await post({ answers: EMPTY, turns: [], askedSlots: [] })); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer(values: string[]) {
    if (!q || loading) return;
    const labels = values.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
    const userText = labels.length ? labels.join(", ") : freeText.trim() || "(skip)";
    const nextTurns = [...turns, { role: "user" as const, text: userText }];
    setTurns(nextTurns);
    setLoading(true); setError(null);
    try {
      handle(await post({
        answers, turns: nextTurns, askedSlots: askedSlots.current,
        lastAnswer: { slot: q.slot, values, freeText: freeText.trim() || undefined },
      }));
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const toggle = (v: string) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  // ── Map view ─────────────────────────────────────────────────────────────────
  if (map) return <PossibilityMapView map={map} onBack={start} />;

  return (
    <section data-testid="discovery-engine" aria-label="Possibility discovery interview"
      style={{ display: "grid", gap: 18, maxWidth: 720, border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "24px 26px" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 18, color: "#101a2b" }}>Let's find your possibilities</strong>
        <span style={{ fontSize: 12.5, color: "#7a8aa0" }}>
          A few quick questions — like talking to a guide, not a form. Anonymous: only your interests are used, never your name.
        </span>
      </div>

      {/* conversation transcript */}
      <div data-testid="conversation" style={{ display: "grid", gap: 10 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ justifySelf: t.role === "assistant" ? "start" : "end", maxWidth: "85%",
            background: t.role === "assistant" ? "#f1f5f9" : "#0f766e", color: t.role === "assistant" ? "#1f2a3d" : "#fff",
            borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>
            {t.text}
          </div>
        ))}
        {loading && <div style={{ justifySelf: "start", fontSize: 13, color: "#9aa6b6" }}>…</div>}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "#b91c1c" }}>
          Something hiccuped. <button type="button" onClick={start} style={{ color: "#185FA5", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Start over</button>
        </div>
      )}

      {/* current question controls */}
      {q && !loading && (
        <div style={{ display: "grid", gap: 12, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }} data-testid="answer-options">
            {q.options.map((o) => {
              const on = selected.includes(o.value);
              const onClick = q.multi ? () => toggle(o.value) : () => void answer([o.value]);
              return (
                <button key={o.value} type="button" onClick={onClick} aria-pressed={q.multi ? on : undefined}
                  data-testid={`opt-${o.value}`}
                  style={{ fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                    border: `1.5px solid ${on ? "#0f766e" : "#cbd5e1"}`, background: on ? "#0f766e" : "#fff", color: on ? "#fff" : "#334155" }}>
                  {q.multi && on ? "✓ " : ""}{o.label}
                </button>
              );
            })}
          </div>

          {q.allowFreeText && (
            <input value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="…or tell me in your own words (optional)"
              style={{ fontSize: 13, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1", maxWidth: 420 }} />
          )}

          {(q.multi || q.allowFreeText) && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button type="button" data-testid="continue" onClick={() => void answer(selected)}
                style={{ fontSize: 14, fontWeight: 800, color: "#fff", background: "#0f766e", border: "none", borderRadius: 999, padding: "9px 22px", cursor: "pointer" }}>
                Continue →
              </button>
              <button type="button" data-testid="skip" onClick={() => void answer([])}
                style={{ fontSize: 12.5, fontWeight: 700, color: "#7a8aa0", background: "none", border: "none", cursor: "pointer" }}>
                Skip
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
        <Link href="/explore?lane=property-land" data-testid="discovery-browse-link"
          style={{ fontSize: 13, fontWeight: 700, color: "#185FA5", textDecoration: "underline" }}>
          Or just browse properties →
        </Link>
        <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>You can get a map without giving your name.</span>
      </div>
    </section>
  );
}

// ── The Possibility Map render (the 10 outputs) — verified deterministic engine ─
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
          ← Start over
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
                {map.property.verified.total} verified current {map.property.verified.scopeAllCategories ? "" : `${map.property.verified.scopeLabel} `}listing{map.property.verified.total === 1 ? "" : "s"}
                {" "}across {map.property.verified.totalStates} state{map.property.verified.totalStates === 1 ? "" : "s"} · as of {map.property.verified.asOf}
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {map.property.verified.states.map((s) => (
                  <span key={s.abbr} style={{ fontSize: 12, color: "#3b475a", background: "#f1f5f9", borderRadius: 999, padding: "3px 10px" }}>
                    {s.abbr}: {s.total}{s.oz ? ` · ${s.oz} OZ` : ""}{s.hubzone ? ` · ${s.hubzone} HUBZone` : ""}
                  </span>
                ))}
              </div>
              {map.property.verified.truncated && (
                <span style={{ fontSize: 11.5, color: "#7a8aa0" }}>
                  Showing the top {map.property.verified.statesShown} of {map.property.verified.totalStates} states — the {map.property.verified.total} total above counts every state.
                </span>
              )}
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
