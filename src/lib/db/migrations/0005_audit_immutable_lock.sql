ALTER TABLE audit_events
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT true;

CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit table is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_update_block ON audit_events;

CREATE TRIGGER audit_update_block
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_update();
