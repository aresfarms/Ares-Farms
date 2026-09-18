-- Audit-chain v2 enforcement (2026-07-29).
--
-- The v2 writer (writeAuditEvent) chains every event off the TRANSACTIONAL
-- HEAD in audit_chain_heads — seeding the head on first write by anchoring
-- all historical hashes into 'MIGRATION:<manifest>' (0043's documented
-- design: "Historical v1 rows remain immutable and are anchored into v2 at
-- first write"). The v1 trigger below still compared prev_hash against the
-- TABLE TAIL, so the anchor transition was rejected and EVERY audit write
-- failed on databases with pre-v2 history ("Audit chain broken: prev_hash
-- mismatch"). This migration makes the trigger head-aware: when the v2 head
-- exists it is the chain authority (the writer holds an advisory lock and
-- updates the head in the same transaction); databases with no head yet keep
-- the original v1 tail behavior unchanged. Append-only integrity is
-- preserved in both modes — nothing here relaxes immutability.

-- Align the physical columns with the canonical schema barrel
-- (src/db/schema/auditEvents.ts declares both scores as NULLABLE — scores are
-- event-type-specific and belong to the legacy scorer's events; v2 canonical
-- events carry their integrity in the event hash instead).
ALTER TABLE audit_events ALTER COLUMN composite_score DROP NOT NULL;
ALTER TABLE audit_events ALTER COLUMN risk_score DROP NOT NULL;

CREATE OR REPLACE FUNCTION enforce_audit_insert_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v2_head TEXT;
  last_hash TEXT;
BEGIN
  IF NEW.event_hash IS NULL THEN
    RAISE EXCEPTION 'Missing event_hash';
  END IF;

  SELECT head_hash
  INTO v2_head
  FROM audit_chain_heads
  WHERE chain_name = 'audit_events_v2';

  IF v2_head IS NOT NULL THEN
    -- v2: the transactional head is the chain authority. The writer seeds or
    -- advances it inside the same transaction under an advisory lock, so an
    -- insert whose prev_hash matches the head is the only valid continuation
    -- (including the one-time 'MIGRATION:<manifest>' anchor transition).
    -- Composite/risk scores are event-type-specific in v2 (the columns are
    -- nullable by design; scores belong to the legacy scorer's events), so
    -- the v1 score requirements do not apply here — the canonical event hash
    -- covers the full payload instead.
    IF NEW.prev_hash IS DISTINCT FROM v2_head THEN
      RAISE EXCEPTION 'Audit chain broken: prev_hash mismatch (v2 head)';
    END IF;
    RETURN NEW;
  END IF;

  -- v1 fallback — no v2 head yet: original checks, unchanged.
  IF NEW.composite_score IS NULL THEN
    RAISE EXCEPTION 'Missing composite_score';
  END IF;

  IF NEW.risk_score IS NULL THEN
    RAISE EXCEPTION 'Missing risk_score';
  END IF;

  SELECT event_hash
  INTO last_hash
  FROM audit_events
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_hash IS NULL THEN
    IF NEW.prev_hash IS NOT NULL AND NEW.prev_hash <> 'GENESIS' THEN
      RAISE EXCEPTION 'Invalid genesis prev_hash';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.prev_hash IS DISTINCT FROM last_hash THEN
    RAISE EXCEPTION 'Audit chain broken: prev_hash mismatch';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
