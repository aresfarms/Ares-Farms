/**
 * REALITY-SEC-001 §3.7 — Navigator rate limits (pure sliding-window policy).
 *
 * Per-action budgets for the public Navigator surfaces, keyed by an ANONYMOUS
 * session hash (never an identity). Graceful by design — the locked message is
 * the only thing a limited visitor sees. The route holds the (in-memory)
 * window store; this module is the policy + decision function so it stays
 * testable and replayable.
 */

export const RATE_LIMIT_MESSAGE = "We need to slow this down for security. You can continue shortly.";

export type RateAction =
  | "navigator-message" | "link-ingestion" | "ordinance-lookup" | "parcel-resolution"
  | "market-comp" | "pro-forma" | "map-exploration" | "refusal-trigger";

/** Budgets: max events per rolling window (ms). */
export const RATE_BUDGETS: Record<RateAction, { max: number; windowMs: number }> = {
  "navigator-message": { max: 30, windowMs: 60_000 },
  "link-ingestion": { max: 6, windowMs: 60_000 },
  "ordinance-lookup": { max: 10, windowMs: 60_000 },
  "parcel-resolution": { max: 10, windowMs: 60_000 },
  "market-comp": { max: 10, windowMs: 60_000 },
  "pro-forma": { max: 4, windowMs: 60_000 },
  "map-exploration": { max: 60, windowMs: 60_000 },
  "refusal-trigger": { max: 5, windowMs: 120_000 },
};

export interface RateDecision { allowed: boolean; message?: string; retryAfterMs?: number }

/**
 * Decide given the prior event timestamps for (session, action). Pure: caller
 * passes timestamps; we return the decision + the pruned window.
 */
export function decideRate(action: RateAction, priorTimestamps: number[], now: number): RateDecision & { window: number[] } {
  const { max, windowMs } = RATE_BUDGETS[action];
  const window = priorTimestamps.filter((t) => now - t < windowMs);
  if (window.length >= max) {
    const retryAfterMs = windowMs - (now - window[0]);
    return { allowed: false, message: RATE_LIMIT_MESSAGE, retryAfterMs, window };
  }
  return { allowed: true, window: [...window, now] };
}
