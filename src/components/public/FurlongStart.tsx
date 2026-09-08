"use client";

import { useRef, useState } from "react";
import { FurlongNavigator } from "@/components/navigator/FurlongNavigator";
import { HomePropertyFrontDoor } from "@/components/public/HomePropertyFrontDoor";
import styles from "./FurlongExperience.module.css";

export const STARTING_EXAMPLES = [
  "I found a property—help me evaluate it.",
  "I want to buy or expand a business.",
  "I own land—help me explore its possibilities.",
] as const;

/** TECH-UX-001 / CONST-CONSENT-001. Suggestions are optional, editable, and
 * never submitted automatically. The question stays in page memory, not a URL. */
export function FurlongStart() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  return <section id="explore" className={styles.start} aria-labelledby="furlong-start-heading">
    <p className={styles.eyebrow}>Your property. Your possibilities. Your next step.</p>
    <h1 id="furlong-start-heading">What are you trying to figure out?</h1>
    <p>Start with a property, business, project, or an idea you are still working out.</p>
    {submitted === null ? <>
      <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) setSubmitted(question.trim()); }}>
        <label htmlFor="furlong-start-question">Your question or project</label>
        <textarea id="furlong-start-question" ref={field} value={question} maxLength={2000}
          onChange={(event) => setQuestion(event.target.value)} rows={3} required
          placeholder="Tell us what you have in mind…"
          aria-describedby="furlong-start-privacy" />
        <button type="submit" className={styles.primary}>Explore my options</button>
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
    <p id="furlong-start-privacy" className={styles.note}>No account needed to explore. Do not enter account numbers or sensitive financial documents here.
      Core exploration is free; optional professional work is quoted separately.</p>
    <details className={styles.address}>
      <summary>Already have a property address? Check the property directly</summary>
      <HomePropertyFrontDoor />
    </details>
  </section>;
}
