"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { JourneyState } from "@/lib/navigator/narrativeInterpreter";
import type { PathwayAssessment } from "@/lib/navigator/possibilityCheck";
import type { DecisionSummary } from "@/lib/navigator/decisionFramework";

/**
 * Furlong Navigator — the governed conversational front door (spec 2026-06-11 +
 * addendum). ONE conversation: a warm open question and a single free-text box.
 * NO chip grid, NO persona picker, NO multi-question form. The visitor types in
 * their own words; the engine walks the spine and returns pathways with
 * confidence, why-shown, effort/risk, and honest three-answer states.
 *
 * Anonymous journey memory: the journey state lives in sessionStorage only —
 * explored pathways, property reference, conversation — no identity, nothing
 * server-stored, nothing sold. "Continue your journey" works on return within
 * the session; clearing the tab clears the journey.
 */

type Turn = { role: "guide" | "you"; text: string };

type Reply =
  | { kind: "question"; node: string; text: string; journey: JourneyState }
  | { kind: "refusal"; refusal: string; text: string; journey: JourneyState }
  | { kind: "pathways"; node: string; text: string; pathways: PathwayAssessment[]; graphChain: string[]; programsSeam: string; decision: DecisionSummary; journey: JourneyState };

const MEM_KEY = "furlong-navigator-journey-v1"; // sessionStorage — anonymous, ephemeral

const CONF_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  high: { label: "High confidence", bg: "#e1f5ee", fg: "#0F6E56" },
  medium: { label: "Medium confidence", bg: "#FAEEDA", fg: "#854F0B" },
  low: { label: "Low confidence", bg: "#FBEAF0", fg: "#993556" },
  "cant-determine": { label: "Can't determine", bg: "#eef2f7", fg: "#5d687a" },
};

const ANSWER_STYLE: Record<string, { label: string; color: string }> = {
  YES: { label: "YES — here's how", color: "#0F6E56" },
  NO: { label: "NO — here's why", color: "#993C1D" },
  CANT_DETERMINE: { label: "CAN'T DETERMINE — here's why + who to confirm with", color: "#5d687a" },
};

export function FurlongNavigator() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [journey, setJourney] = useState<JourneyState | null>(null);
  const [pathways, setPathways] = useState<PathwayAssessment[] | null>(null);
  const [graphChain, setGraphChain] = useState<string[]>([]);
  const [programsSeam, setProgramsSeam] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionSummary | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [resumed, setResumed] = useState(false);
  const started = useRef(false);

  async function post(payload: unknown): Promise<Reply> {
    const res = await fetch("/api/public/navigator/converse", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`navigator ${res.status}`);
    return (await res.json()) as Reply;
  }

  function remember(j: JourneyState, t: Turn[]) {
    try { sessionStorage.setItem(MEM_KEY, JSON.stringify({ journey: j, turns: t.slice(-30) })); } catch { /* memory is best-effort */ }
  }

  function handle(r: Reply, t: Turn[]) {
    const next = [...t, { role: "guide" as const, text: r.text }];
    setTurns(next);
    setJourney(r.journey);
    if (r.kind === "pathways") {
      setPathways(r.pathways);
      setGraphChain(r.graphChain);
      setProgramsSeam(r.programsSeam);
      setDecision(r.decision);
    }
    remember(r.journey, next);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Continue your journey — anonymous session memory only.
    try {
      const saved = sessionStorage.getItem(MEM_KEY);
      if (saved) {
        const { journey: j, turns: t } = JSON.parse(saved) as { journey: JourneyState; turns: Turn[] };
        if (j && Array.isArray(t) && t.length) {
          setJourney(j); setTurns(t); setResumed(true); setLoading(false);
          return;
        }
      }
    } catch { /* fresh start */ }
    void (async () => {
      try { handle(await post({}), []); } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    const t = [...turns, { role: "you" as const, text: msg }];
    setTurns(t); setInput(""); setLoading(true);
    try { handle(await post({ message: msg, journey }), t); }
    catch { setTurns([...t, { role: "guide", text: "Something hiccuped — say that again?" }]); }
    finally { setLoading(false); }
  }

  return (
    <section data-testid="furlong-navigator" aria-label="Furlong Navigator"
      style={{ display: "grid", gap: 18, maxWidth: 780, border: "1px solid #d7deea", borderRadius: 16, background: "#fff", padding: "24px 26px" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong style={{ fontSize: 19, color: "#101a2b" }}>Furlong Navigator</strong>
        <span style={{ fontSize: 12.5, color: "#7a8aa0" }}>
          A guide through uncertain waters — anonymous, no account, and we don't sell you anything.
          {resumed && " Welcome back — continuing your journey."}
        </span>
      </div>

      {/* the conversation */}
      <div data-testid="navigator-conversation" style={{ display: "grid", gap: 10 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ justifySelf: t.role === "guide" ? "start" : "end", maxWidth: "88%",
            background: t.role === "guide" ? "#f1f5f9" : "#0f766e", color: t.role === "guide" ? "#1f2a3d" : "#fff",
            borderRadius: 14, padding: "10px 14px", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {t.text}
          </div>
        ))}
        {loading && <div style={{ justifySelf: "start", fontSize: 13, color: "#9aa6b6" }}>…</div>}
      </div>

      {/* pathway assessments */}
      {pathways && (
        <div data-testid="navigator-pathways" style={{ display: "grid", gap: 12 }}>
          {programsSeam && (
            <p data-testid="programs-seam" style={{ margin: 0, fontSize: 12.5, color: "#7a8aa0", lineHeight: 1.5 }}>{programsSeam}</p>
          )}
          {pathways.map((p) => {
            const conf = CONF_STYLE[p.confidence];
            const ans = ANSWER_STYLE[p.answer];
            return (
              <div key={p.id} data-testid={`pathway-${p.id}`} style={{ border: "1px solid #e6ebf2", borderRadius: 12, padding: "14px 16px", display: "grid", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15, color: "#101a2b" }}>{p.title}</strong>
                  <span style={{ fontSize: 11.5, fontWeight: 800, background: conf.bg, color: conf.fg, borderRadius: 999, padding: "3px 11px" }}>{conf.label}</span>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: ans.color }}>{ans.label}</span>
                <span style={{ fontSize: 13, color: "#3b475a", lineHeight: 1.5 }}>{p.detail}</span>
                {p.reroute && <span style={{ fontSize: 12.5, color: "#854F0B", lineHeight: 1.5 }}>↪ {p.reroute}</span>}
                <span style={{ fontSize: 12, color: "#7a8aa0", lineHeight: 1.45 }}>{p.whyShown}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11.5, color: "#5d687a" }}>
                  <span style={{ background: "#f1f5f9", borderRadius: 999, padding: "2px 9px" }}>effort: {p.effort}</span>
                  <span style={{ background: "#f1f5f9", borderRadius: 999, padding: "2px 9px" }}>risk: {p.risk}</span>
                  <span style={{ background: "#f1f5f9", borderRadius: 999, padding: "2px 9px" }}>time to start: {p.timeToStart}</span>
                  <span style={{ background: "#f1f5f9", borderRadius: 999, padding: "2px 9px" }}>evidence: {p.evidenceStrength}</span>
                </div>
                {p.profitability ? (
                  <span style={{ fontSize: 12.5, color: "#1f2a3d" }}>
                    {`$${p.profitability.low.toLocaleString()}–${p.profitability.high.toLocaleString()} ${p.profitability.unit}`}
                    <span style={{ color: "#7a8aa0" }}> · {p.profitability.framing} (basis: {p.profitability.basis}, verified {p.profitability.lastVerified})</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "#9aa6b6" }}>{p.profitabilityNote}</span>
                )}
                {p.requiredConfirmations.length > 0 && (
                  <span style={{ fontSize: 12, color: "#5d687a" }}>Confirm with: {p.requiredConfirmations.join(" · ")}</span>
                )}
              </div>
            );
          })}

          {/* Navigator Decision Framework — the four canonical questions
              (addendum 2026-06-11): Achievable · Obstacles · Alternatives ·
              Probability. Advisory only — pathways, not promises. */}
          {decision && (
            <div data-testid="decision-framework" style={{ display: "grid", gap: 10, border: "1.5px solid #d7deea", borderRadius: 12, padding: "16px 18px", background: "#fbfcfe" }}>
              <strong style={{ fontSize: 15, color: "#101a2b" }}>Where this leaves you</strong>
              <div data-testid="decision-achievable" style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#0F6E56" }}>Achievable</span>
                {decision.achievable.length ? decision.achievable.map((a, i) => (
                  <span key={i} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}><strong>{a.pathway}:</strong> {a.how}</span>
                )) : <span style={{ fontSize: 12.5, color: "#7a8aa0" }}>Nothing is confirmable as achievable yet — the confirmations below come first.</span>}
              </div>
              <div data-testid="decision-obstacles" style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#993C1D" }}>Obstacles</span>
                {decision.obstacles.slice(0, 5).map((o, i) => (
                  <span key={i} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}><strong>{o.pathway}:</strong> {o.obstacle}</span>
                ))}
              </div>
              <div data-testid="decision-alternatives" style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#854F0B" }}>Alternatives</span>
                {decision.alternatives.slice(0, 4).map((a, i) => (
                  <span key={i} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.5 }}><strong>{a.from}:</strong> {a.alternative}</span>
                ))}
              </div>
              <div data-testid="decision-probability" style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#534AB7" }}>Probability</span>
                <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{decision.probability.assessment}</span>
                <span style={{ fontSize: 11.5, color: "#7a8aa0", lineHeight: 1.5 }}>{decision.probability.advisory}</span>
              </div>
            </div>
          )}

          {/* discovery graph — pathways cross, diverge, reconnect */}
          {graphChain.length > 1 && (
            <div data-testid="discovery-graph" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, border: "1px dashed #cbd5e1", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#7a8aa0", marginRight: 4 }}>CONNECTED PATHWAYS</span>
              {graphChain.map((id, i) => (
                <span key={id} style={{ fontSize: 12, color: "#3b475a" }}>
                  {i > 0 && <span style={{ color: "#9aa6b6" }}> → </span>}
                  {id.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* the ONE free-text box — the whole input surface */}
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
        <input
          data-testid="navigator-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          placeholder="Type in your own words — or paste any listing link or address…"
          style={{ flex: 1, fontSize: 14, padding: "11px 14px", borderRadius: 12, border: "1.5px solid #cbd5e1" }}
        />
        <button type="button" data-testid="navigator-send" onClick={() => void send()}
          style={{ fontSize: 14, fontWeight: 800, color: "#fff", background: "#0f766e", border: "none", borderRadius: 999, padding: "0 22px", cursor: "pointer" }}>
          Send
        </button>
      </div>

      <span style={{ fontSize: 11.5, color: "#9aa6b6" }}>
        Pathways, not promises — every number is a range with its basis, every No comes with a reroute, and
        "can't determine" is an honest answer. <Link href="/explore" style={{ color: "#185FA5" }}>Or browse the map →</Link>
      </span>
    </section>
  );
}
