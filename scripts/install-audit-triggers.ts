import postgres from "postgres";

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);

  await sql`
    CREATE OR REPLACE FUNCTION prevent_audit_mutation()
    RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit_events is append-only. UPDATE/DELETE not allowed.';
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`
    DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
  `;

  await sql`
    CREATE TRIGGER audit_events_no_update
    BEFORE UPDATE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_mutation();
  `;

  await sql`
    DROP TRIGGER IF EXISTS audit_events_no_delete ON audit_events;
  `;

  await sql`
    CREATE TRIGGER audit_events_no_delete
    BEFORE DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_mutation();
  `;

  console.log("✅ audit append-only triggers installed");

  process.exit(0);
}

run();
