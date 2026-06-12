/**
 * Navigator session privacy (CRITICAL fix, 2026-06-11).
 *
 * HARD RULE: anonymous means anonymous in the USER EXPERIENCE, not just the
 * database. The Navigator is EPHEMERAL BY DEFAULT:
 *  - conversation lives in memory for the active page only;
 *  - NOTHING conversation-related is written to localStorage/sessionStorage/
 *    IndexedDB/cookies unless the visitor EXPLICITLY opts in;
 *  - on load/refresh/revisit/new tab, no prior visible conversation restores
 *    by default — every fresh load starts at the opening question;
 *  - the old auto-resume ("Welcome back — continuing your journey") is REMOVED.
 *
 * ALLOWED EXCEPTION — explicit, device-local opt-in: "Continue this anonymous
 * journey on this device?" Only after the visitor affirmatively enables it does
 * this module persist journey state, and even then PROTECTED-CLASS DISCLOSURES
 * ARE NEVER DURABLY STORED — they are redacted from any saved copy (the live
 * in-memory conversation is untouched; G-2 results never use them either way).
 *
 * Allowed in storage by default: nothing conversation-related. (Anonymous
 * security telemetry/replay hashes live SERVER-side in governed ledgers, never
 * in browser storage.) This module is the ONLY writer of Navigator browser
 * storage — the verifier asserts that structurally.
 */

import type { JourneyState } from "./narrativeInterpreter";

export const JOURNEY_KEY = "furlong-navigator-journey-v2"; // exists ONLY after opt-in
export const OPT_IN_KEY = "furlong-navigator-continuity-opt-in"; // "yes" only by explicit user action
/** The v1 key that caused the bug — actively purged everywhere. */
export const LEGACY_KEY = "furlong-navigator-journey-v1";

export const OPT_IN_PROMPT = "Continue this anonymous journey on this device?";
export const SAVE_JOURNEY_CONSENT_COPY =
  "Saving is optional. If you save this journey, Furlong will store your conversation, search criteria, " +
  "saved properties, and results so you can return later. Public Navigator remains anonymous when you do not save.";

export type Turn = { role: "guide" | "you"; text: string };

// ── Protected-class disclosure detection (belt-and-suspenders, G-2) ──────────
// Even under opt-in, these are NEVER durably stored — redacted in saved copies.
const PROTECTED_CLASS_DISCLOSURE: RegExp[] = [
  /\b(?:gay|lesbian|bisexual|transgender|queer|nonbinary|straight)\b/i,
  /\bsexual orientation\b/i,
  /\bI(?:'m| am)\s+(?:a\s+)?(?:black|white|hispanic|latino|latina|asian|native american|jewish|muslim|christian|catholic|hindu|buddhist)\b/i,
  /\bmy\s+(?:race|religion|ethnicity|national origin|disability|gender identity)\b/i,
  /\bI(?:'m| am)\s+disabled\b/i,
  /\bI have a disability\b/i,
  /\b(?:my|our) (?:husband|wife) and I\b.{0,30}\b(?:race|religion|ethnic)/i,
  /\bpregnan(?:t|cy)\b/i,
];

export function containsProtectedClassDisclosure(text: string): boolean {
  return PROTECTED_CLASS_DISCLOSURE.some((re) => re.test(text));
}

export const REDACTED_PLACEHOLDER = "[private detail not saved — it stays in this conversation only]";

/** Redact protected-class disclosures from a transcript copy bound for storage. */
export function redactForStorage(turns: Turn[]): Turn[] {
  return turns.map((t) =>
    t.role === "you" && containsProtectedClassDisclosure(t.text)
      ? { ...t, text: REDACTED_PLACEHOLDER }
      : t,
  );
}

/** Scrub protected-class disclosures from journey story fragments before storage. */
function redactJourneyForStorage(j: JourneyState): JourneyState {
  return { ...j, story: j.story.map((s) => (containsProtectedClassDisclosure(s) ? REDACTED_PLACEHOLDER : s)) };
}

// ── storage operations (the ONLY Navigator browser-storage writer) ───────────
const ss = () => (typeof window !== "undefined" ? window.sessionStorage : null);

export function isContinuityOptedIn(): boolean {
  try { return ss()?.getItem(OPT_IN_KEY) === "yes"; } catch { return false; }
}

export function optInToContinuity(): void {
  try { ss()?.setItem(OPT_IN_KEY, "yes"); } catch { /* best effort */ }
}

export function revokeContinuity(): void {
  try { ss()?.removeItem(OPT_IN_KEY); ss()?.removeItem(JOURNEY_KEY); } catch { /* best effort */ }
}

/** Wipe everything Navigator-related from browser storage (Start Over). */
export function clearNavigatorSession(): void {
  try {
    const s = ss();
    s?.removeItem(JOURNEY_KEY);
    s?.removeItem(OPT_IN_KEY);
    s?.removeItem(LEGACY_KEY);
    if (typeof window !== "undefined") window.localStorage?.removeItem(LEGACY_KEY);
  } catch { /* best effort */ }
}

/**
 * Persist the journey ONLY when the visitor has opted in. Default: writes
 * nothing. Saved copies are protected-class-redacted.
 */
export function saveJourneyIfOptedIn(journey: JourneyState, turns: Turn[]): void {
  if (!isContinuityOptedIn()) return; // EPHEMERAL DEFAULT — nothing stored
  try {
    ss()?.setItem(JOURNEY_KEY, JSON.stringify({
      journey: redactJourneyForStorage(journey),
      turns: redactForStorage(turns).slice(-30),
    }));
  } catch { /* best effort */ }
}

/**
 * Load a saved journey ONLY when opt-in is recorded. Never restores anything
 * by default; also purges the buggy v1 key on every call.
 */
export function loadJourneyIfOptedIn(): { journey: JourneyState; turns: Turn[] } | null {
  try {
    // Purge the legacy auto-resume key unconditionally (the bug).
    ss()?.removeItem(LEGACY_KEY);
    if (typeof window !== "undefined") window.localStorage?.removeItem(LEGACY_KEY);
    if (!isContinuityOptedIn()) return null;
    const raw = ss()?.getItem(JOURNEY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { journey: JourneyState; turns: Turn[] };
    if (!parsed?.journey || !Array.isArray(parsed.turns)) return null;
    return parsed;
  } catch { return null; }
}
