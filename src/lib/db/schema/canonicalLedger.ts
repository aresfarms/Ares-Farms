/**
 * Canonical Ledger Schema Compatibility Bridge
 *
 * Master Volume Governance:
 * - Vol I: Preserves one constitutional schema authority.
 * - Vol III: Removes duplicate canonical ledger table definitions.
 * - Vol IV: Supports safe migration of legacy imports.
 * - Vol V: Keeps canonical source, replay, and version lineage singular.
 *
 * Purpose:
 * Legacy imports using:
 *
 *   "@/lib/db/schema/canonicalLedger"
 *
 * must resolve to the canonical schema module:
 *
 *   "@/db/schema/canonicalLedger"
 */

export * from "@/db/schema/canonicalLedger";
