"use client";

import { useRef, useState } from "react";
import { FurlongNavigator } from "@/components/navigator/FurlongNavigator";
import { HomePropertyFrontDoor } from "@/components/public/HomePropertyFrontDoor";
import { PropertyComparisonFrontDoor } from "@/components/public/PropertyComparisonFrontDoor";
import styles from "./FurlongExperience.module.css";

type StartMode = "single" | "compare" | null;

export const STARTING_EXAMPLES = [
  "I want to buy or expand a business.",
  "I own land—help me explore its possibilities.",
] as const;

/** TECH-UX-001 / CONST-CONSENT-001. The public entrance begins with the two
 * property decisions Furlong can govern. Open-ended exploration remains
 * optional and never submits text automatically. */
export function FurlongStart() {
  const [mode, setMode] = useState<StartMode>(null);
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  return <section id="explore" className={styles.start} aria-labelledby="furlong-start-heading">
    <p className={styles.eyebrow}>Property intelligence starts with the property.</p>
    <h1 id="furlong-start-heading">What do you want Furlong to investigate?</h1>
    <p>Analyze one property in depth or prepare a list for evidence-based comparison.</p>

    <div className={styles.startChoices} aria-label="Choose how to begin">
      <button type="button" aria-pressed={mode === "single"} onClick={() => setMode("single")}>
        <strong>Investigate one property</strong>
        <span>Test the whole building or parcel and rank its strongest uses.</span>
      </button>
      <button type="button" aria-pressed={mode === "compare"} onClick={() => setMode("compare")}>
        <strong>Compare a list of properties</strong>
        <span>Submit 1–1,000 addresses and choose whether to return the best 1–5.</span>
      </button>
    </div>

    {mode === "single" ? <div className={styles.modePanel}><HomePropertyFrontDoor /></div> : null}
    {mode === "compare" ? <div className={styles.modePanel}><PropertyComparisonFrontDoor /></div> : null}

    <details className={styles.exploreQuestion}>
      <summary>I do not have a property yet</summary>
      {submitted === null ? <>
        <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) setSubmitted(question.trim()); }}>
          <label htmlFor="furlong-start-question">What are you trying to accomplish?</label>
          <textarea id="furlong-start-question" ref={field} value={question} maxLength={2000}
            onChange={(event) => setQuestion(event.target.value)} rows={3} required
            placeholder="Describe the kind of property or enterprise you want to explore."
            aria-describedby="furlong-start-privacy" />
          <button type="submit" className={styles.primary}>Explore possibilities</button>
        </form>
        <div className={styles.examples} aria-label="Optional starting examples">
          <span>Need a starting point?</span>
          {STARTING_EXAMPLES.map((example) => <button type="button" key={example}
            onClick={() => { setQuestion(example); field.current?.focus(); }}>{example}</button>)}
        </div>
      </> : <div className={styles.conversation}>
        <FurlongNavigator initialMessage={submitted} />
        <button type="button" onClick={() => { setSubmitted(null); setQuestion(""); }}>Start a different question</button>
      </div>}
    </details>

    <p id="furlong-start-privacy" className={styles.note}>No Social Security number or personal financial account information is required for property and enterprise analysis.</p>
  </section>;
}
