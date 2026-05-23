/**
 * Canonical Schema Compatibility Layer
 *
 * Master Volume Governance:
 * - Vol I: Preserves controlled authority boundaries.
 * - Vol III: Prevents uncontrolled schema fragmentation.
 * - Vol IV: Supports stable operational migration sequencing.
 * - Vol V: Enables replay-safe canonical backend migration.
 *
 * Purpose:
 * Legacy imports using:
 *
 *   "@/lib/schema"
 *
 * are temporarily redirected into:
 *
 *   "@/db/schema"
 *
 * This compatibility layer exists ONLY during migration.
 *
 * Final Architecture Goal:
 * All schema access should eventually originate from:
 *
 *   src/db/schema/
 */

export * from "@/db/schema";
