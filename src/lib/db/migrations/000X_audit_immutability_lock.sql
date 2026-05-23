-- STEP 5.4: IMMUTABILITY LOCK LAYER
-- PURPOSE: Prevent ANY modification or deletion of audit ledger rows

------------------------------------------------------------
-- 1. BLOCK ALL UPDATES
------------------------------------------------------------
CREATE OR REPLACE FUNCTION block_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT IMMUTABILITY VIOLATION: UPDATE NOT ALLOWED';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;

CREATE TRIGGER audit_events_no_update
BEFORE UPDATE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION block_audit_update();

------------------------------------------------------------
-- 2. BLOCK ALL DELETES
------------------------------------------------------------
CREATE OR REPLACE FUNCTION block_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT IMMUTABILITY VIOLATION: DELETE NOT ALLOWED';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_delete ON audit_events;

CREATE TRIGGER audit_events_no_delete
BEFORE DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION block_audit_delete();

------------------------------------------------------------
-- 3. OPTIONAL SAFETY FLAG (READABLE AUDIT STATE)
------------------------------------------------------------
ALTER TABLE audit_events
ADD COLUMN IF NOT EXISTS immutable BOOLEAN DEFAULT TRUE;
