"use client";

import { useState } from "react";

import {
  buildPlaceLevelBrief,
  type PlaceInterest,
  type PlaceInterestTag,
  type PlaceLevelBrief,
} from "@/lib/property/placeLevelBrief";
import type { BriefFactLine } from "@/lib/property/propertyBriefIntelligence";

/**
 * InterestFirstDiscovery — "What are you interested in?" (founder direction
 * 2026-07-20). The front door for the person who has no address yet: "I don't
 * know, but I want to live in Athens, GA."
 *
 * ANONYMOUS — interests only. No name, no email, no account, no qualification
 * questions. Every answer lives in component state and is never sent anywhere;
 * only the PLACE is sent, to resolve public government facts about it. Whether
 * any of this fits the person is for a licensed professional, their lender, or
 * the agency — this never scores anyone.
 *
 * Guided one question at a time (never a form wall), then a PLACE-level Ledger:
 *   (A) the area read against what they said, (B) what's here by lane,
 *   (C) the overall read + what genuinely needs a specific address.
 *
 * The honest core is placeLevelBrief.ts, which refuses to assert tract-level
 * facts (Opportunity Zone, NMTC, flood) for a whole town — see verify:place-brief.
 */

type Step = { id: string; prompt: string; helper: string; options: { tag: PlaceInterestTag; label: string }[] };

const STEPS: Step[] = [
  {
    id: "why",
    prompt: "What draws you to this place?",
    helper: "Pick what's true — you can choose more than one, or skip.",
    options: [
      { tag: "live-here", label: "I want to live here" },
      { tag: "farm-land", label: "Land or a working farm" },
      { tag: "business", label: "Somewhere to run a business" },
    ],
  },
  {
    id: "daily",
    prompt: "What matters most, day to day?",
    helper: "This only shapes which verified facts we lead with.",
    options: [
      { tag: "cost-of-living", label: "What it costs to be here" },
      { tag: "schools-family", label: "Schools and family" },
      { tag: "healthcare", label: "Care nearby" },
      { tag: "amenities", label: "Groceries, food, getting around" },
    ],
  },
  {
    id: "steer",
    prompt: "Anything you'd want to see coming?",
    helper: "We only ever link to official sources for these.",
    options: [
      { tag: "remote-work", label: "Getting out and getting online" },
      { tag: "risk", label: "What sits around the area" },
    ],
  },
];

const ink = "#101a2b";
const line = "#d7deea";

export function InterestFirstDiscovery() {
  const [place, setPlace] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stepIndex, setStepIndex] = useState(-1); // -1 = place entry
  const [interests, setInterests] = useState<PlaceInterest[]>([]);
  const [brief, setBrief] = useState<PlaceLevelBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeName = [place.trim(), stateCode.trim().toUpperCase()].filter(Boolean).join(", ");

  function beginInterview() {
    if (!place.trim()) {
      setError("Name a town or county so we can pull its public records.");
      return;
    }
    setError(null);
    setStepIndex(0);
  }

  function choose(step: Step, tag: PlaceInterestTag, label: string) {
    setInterests((current) =>
      current.some((i) => i.tag === tag)
        ? current.filter((i) => i.tag !== tag)
        : [...current, { tag, said: label }]
    );
  }

  async function chart() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/property-facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: placeName,
          stateCode: stateCode.trim().toUpperCase() || null,
          rawInput: placeName,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; placeIntelligence?: { verifiedFacts?: BriefFactLine[] } }
        | null;
      const facts = data?.placeIntelligence?.verifiedFacts ?? [];
      setBrief(buildPlaceLevelBrief({ placeName, facts, interests }));
    } catch {
      // Never strand the visitor — build the honest empty read instead.
      setBrief(buildPlaceLevelBrief({ placeName, facts: [], interests }));
    } finally {
      setBusy(false);
    }
  }

  if (brief) {
    return <PlaceLedger brief={brief} onRestart={() => { setBrief(null); setStepIndex(-1); setInterests([]); }} />;
  }

  const step = stepIndex >= 0 ? STEPS[stepIndex] : null;

  return (
    <section
      aria-label="What are you interested in?"
      style={{ display: "grid", gap: 16, border: `1px solid ${line}`, borderRadius: 18, background: "#fff", padding: "22px 24px" }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0f766e" }}>
          What are you interested in?
        </span>
        <strong style={{ fontSize: 25, lineHeight: 1.12, color: ink }}>
          You don&apos;t need an address yet. Start with the place.
        </strong>
        <span style={{ fontSize: 13, color: "#4d596d", lineHeight: 1.6 }}>
          Anonymous — your interests only. No personal information and no qualification questions; whether
          a program fits <em>you</em> is for a licensed professional, your lender, or the agency.
        </span>
      </div>

      {step === null ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <label style={{ display: "grid", gap: 4, flex: "1 1 260px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4d596d" }}>Town or county</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") beginInterview(); }}
                placeholder="Athens"
                style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${line}`, fontSize: 14 }}
              />
            </label>
            <label style={{ display: "grid", gap: 4, width: 110 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4d596d" }}>State</span>
              <input
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") beginInterview(); }}
                placeholder="GA"
                maxLength={2}
                style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${line}`, fontSize: 14, textTransform: "uppercase" }}
              />
            </label>
          </div>
          {error && <span style={{ fontSize: 12.5, color: "#a12626" }}>{error}</span>}
          <button
            type="button"
            onClick={beginInterview}
            style={{ justifySelf: "start", padding: "10px 18px", borderRadius: 999, border: "none", background: "#0f766e", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Start with {place.trim() || "a place"} →
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 17, color: ink }}>{step.prompt}</strong>
            <span style={{ fontSize: 11, color: "#7a8aa0", fontFamily: "ui-monospace, Menlo, monospace" }}>
              {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
          <span style={{ fontSize: 12.5, color: "#4d596d" }}>{step.helper}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {step.options.map((opt) => {
              const active = interests.some((i) => i.tag === opt.tag);
              return (
                <button
                  key={opt.tag}
                  type="button"
                  onClick={() => choose(step, opt.tag, opt.label)}
                  aria-pressed={active}
                  style={{
                    padding: "9px 15px",
                    borderRadius: 999,
                    border: active ? "1px solid #0f766e" : `1px solid ${line}`,
                    background: active ? "#0f766e" : "#fff",
                    color: active ? "#fff" : "#3b475a",
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {active ? "✓ " : ""}{opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex(stepIndex + 1)}
                style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: "#0f766e", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={chart}
                disabled={busy}
                style={{ padding: "9px 18px", borderRadius: 999, border: "none", background: "#0f766e", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}
              >
                {busy ? "Charting…" : `Chart ${placeName || "this place"} →`}
              </button>
            )}
            <button
              type="button"
              onClick={() => (stepIndex < STEPS.length - 1 ? setStepIndex(stepIndex + 1) : chart())}
              style={{ background: "none", border: "none", color: "#4d596d", fontSize: 12.5, textDecoration: "underline", cursor: "pointer" }}
            >
              Skip this one
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PlaceLedger({ brief, onRestart }: { brief: PlaceLevelBrief; onRestart: () => void }) {
  return (
    <section aria-label={`Place ledger for ${brief.placeName}`} style={{ display: "grid", gap: 16 }}>
      {/* Ledger masthead, same register language as the property report. */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #d7deea" }}>
        <div style={{ padding: "18px 22px", background: "linear-gradient(180deg,#10233b,#14293f)", borderBottom: "3px solid #b8862f" }}>
          <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d4b06a", fontFamily: "Georgia, serif" }}>
            Furlong · The Land Register — Place Entry
          </span>
          <strong style={{ display: "block", fontSize: 26, color: "#f4f7fa", fontFamily: "Georgia, serif", lineHeight: 1.15 }}>
            {brief.placeName}
          </strong>
        </div>
        <div style={{ padding: "10px 22px", background: "#faf6ec" }}>
          <span style={{ fontSize: 12, color: "#96742f", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            A place is not a parcel — everything below is what the area itself publishes.
          </span>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#3b475a" }}>{brief.overall}</p>

      {brief.fitReads.length > 0 && (
        <Block title="What you said — and what the area's records say">
          <div style={{ display: "grid", gap: 10 }}>
            {brief.fitReads.map((read) => (
              <div key={read.interest.tag} style={{ border: "1px solid #e4e9f0", borderRadius: 10, padding: "12px 14px" }}>
                <strong style={{ fontSize: 13.5, color: ink }}>&ldquo;{read.interest.said}&rdquo;</strong>
                <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 700, margin: "3px 0 6px" }}>{read.lead}</div>
                {read.basis.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                    {read.basis.map((f) => (
                      <li key={f.label} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
                        <strong>{f.label}:</strong> {f.value}{" "}
                        <span style={{ color: "#7a8aa0", fontSize: 11 }}>({f.provenance.replace(/^Source:\s*/i, "")})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: 12.5, color: "#854F0B", lineHeight: 1.55 }}>{read.gap}</span>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {brief.byLane.length > 0 && (
        <Block title="What's here, by lane">
          <div style={{ display: "grid", gap: 8 }}>
            {brief.byLane.map((lane) => (
              <a key={lane.slug} href={lane.href} style={{ display: "grid", gap: 2, border: "1px solid #e4e9f0", borderRadius: 10, padding: "11px 13px", textDecoration: "none" }}>
                <strong style={{ fontSize: 13.5, color: "#0f766e" }}>{lane.label} →</strong>
                <span style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>{lane.whatsHere}</span>
              </a>
            ))}
          </div>
        </Block>
      )}

      <Block title="Name an address to answer these">
        <span style={{ fontSize: 12.5, color: "#4d596d", lineHeight: 1.6, display: "block", marginBottom: 8 }}>
          These change street to street, so we will not claim them for a whole town:
        </span>
        <div style={{ display: "grid", gap: 6 }}>
          {brief.needsAnAddress.map((item) => (
            <div key={item.label} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.55 }}>
              <strong style={{ color: ink }}>{item.label}</strong> — {item.why}
            </div>
          ))}
        </div>
        <a href="/discover" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 700, color: "#0f766e" }}>
          Have an address in {brief.placeName}? Run the full property ledger →
        </a>
      </Block>

      <Block title="What stays open">
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
          {brief.openQuestions.map((q) => (
            <li key={q} style={{ fontSize: 12.5, color: "#3b475a", lineHeight: 1.6 }}>{q}</li>
          ))}
        </ul>
      </Block>

      <button
        type="button"
        onClick={onRestart}
        style={{ justifySelf: "start", background: "none", border: `1px solid ${line}`, borderRadius: 999, padding: "8px 16px", fontSize: 13, color: "#3b475a", cursor: "pointer" }}
      >
        Chart a different place
      </button>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${line}`, borderRadius: 14, background: "#fff", padding: "16px 18px", display: "grid", gap: 8 }}>
      <strong style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#96742f", fontFamily: "Georgia, serif" }}>
        {title}
      </strong>
      {children}
    </section>
  );
}
