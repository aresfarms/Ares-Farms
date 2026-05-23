-- STEP 5.1 INSERT IMMUTABILITY TRIGGER

CREATE OR REPLACE FUNCTION enforce_audit_insert_integrity()
RETURNS TRIGGER AS $$
DECLARE
  last_hash TEXT;
BEGIN

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

  IF NEW.event_hash IS NULL THEN
    RAISE EXCEPTION 'Missing event_hash';
  END IF;

  IF NEW.composite_score IS NULL THEN
    RAISE EXCEPTION 'Missing composite_score';
  END IF;

  IF NEW.risk_score IS NULL THEN
    RAISE EXCEPTION 'Missing risk_score';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_insert ON audit_events;

CREATE TRIGGER audit_events_no_insert
BEFORE INSERT ON audit_events
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_insert_integrity();
