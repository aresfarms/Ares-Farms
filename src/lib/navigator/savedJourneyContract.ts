/**
 * Saved Journey Accounts — the CONTRACT (spec 2026-06-11), build-ready and
 * gated OFF until the authenticated account layer ships.
 *
 * CORE RULE: Furlong may remember a journey only when the user asks it to.
 * Anonymous discovery remains the default; no account is required to use the
 * Navigator; no visible conversation history persists by default. Only AFTER
 * login + explicit consent may the items below be stored — and an anonymous
 * session attaches to an account ONLY after consent, never silently.
 *
 * `SAVED_JOURNEYS_LIVE=false` until: secure auth (email verification, MFA-ready,
 * session expiry, secure cookies, CSRF, rate limiting, abuse monitoring, reset
 * protection, account deletion), the storage below in governed tables, the
 * account-level controls (delete/export/rename/remove-property/clear-all/
 * revoke-consent), and the My Journeys dashboard — all human-reviewed. Saved
 * journeys must pass ALL existing guardrails (no owner identity, no demographic
 * profiling, no steering, no proprietary listing copy, no guarantees, no
 * "you qualify", nothing sold or shared) — the output gate runs on saved
 * content too.
 */

export const SAVED_JOURNEYS_LIVE = false;

export const SAVE_FLOW_STEPS = [
  "Pause Navigator",
  "Show account prompt",
  "Explain what will be saved",
  "Require consent",
  "Authenticate user",
  "Create saved_journey",
  "Attach current anonymous session to the authenticated account ONLY after consent",
  "Resume Navigator",
] as const;

// ── Data model contracts (tables land with the auth build) ───────────────────
export interface SavedJourney {
  journey_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status: "active" | "archived";
  privacy_scope: "private";
  source_session_id: string;
  consent_record_id: string;
}

export interface SavedJourneyMessage {
  message_id: string;
  journey_id: string;
  role: "guide" | "you";
  content: string;
  created_at: string;
  /** e.g. ["protected-class-redacted"] — redaction happens BEFORE storage. */
  sensitivity_flags: string[];
  scrub_status: "scrubbed" | "clean";
  audit_hash: string;
}

export interface SavedProperty {
  saved_property_id: string;
  journey_id: string;
  address_or_parcel_ref: string;
  source_url_ref: string | null;
  source_type: string;
  canonical_property_id: string | null;
  saved_at: string;
  analysis_status: "pending" | "complete" | "cant-determine";
}

export interface SavedPathwayResult {
  result_id: string;
  journey_id: string;
  pathway_type: string;
  answer_state: "YES" | "NO" | "CANT_DETERMINE";
  confidence: string;
  basis_refs: string[];
  obstacles: string[];
  alternatives: string[];
  last_verified_at: string | null;
  output_hash: string;
}

export interface SavedSearchCriteria {
  criteria_id: string;
  journey_id: string;
  goal_text: string;
  region: string | null;
  budget_range: string | null;
  property_type: string | null;
  intended_use: string | null;
  constraints: string[];
  created_at: string;
}

/** Account-level controls the build must ship with. */
export const ACCOUNT_CONTROLS = [
  "delete saved journey", "export saved journey", "rename saved journey",
  "remove a saved property", "clear all saved Navigator data", "revoke journey consent",
] as const;
