/**
 * Canonical Schema Bridge
 *
 * Master Volume Series Governance:
 * - Vol I: Establishes one authoritative schema authority.
 * - Vol II: Maintains controlled governance routing.
 * - Vol III: Eliminates duplicate schema infrastructure paths.
 * - Vol IV: Supports deterministic operational recovery.
 * - Vol V: Enables replayability, observability, explainability,
 *           and canonical backend migration sequencing.
 *
 * Purpose:
 * Legacy imports using:
 *
 *   "@/db/schema"
 *
 * are redirected into the governed canonical schema spine:
 *
 *   src/db/schema/
 *
 * Rule:
 * All future schema definitions must originate from:
 *
 *   src/db/schema/index.ts
 *
 * Duplicate schema definitions outside the canonical spine
 * are prohibited during future migration phases.
 */

export * from "./schema/index";
