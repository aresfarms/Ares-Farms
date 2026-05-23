import crypto from "crypto";

// -------------------------------------
// SIMPLE HASH UTIL (DETERMINISTIC)
// -------------------------------------
function sha256(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// -------------------------------------
// IN-MEMORY FALLBACK (TEMP SAFE STATE)
// -------------------------------------
let lastHash: string | null = null;

// -------------------------------------
// LEDGER EVENT WRITER (IMMUTABLE CHAIN)
// -------------------------------------
export async function writeLedgerEvent(event: any) {
  const timestamp = new Date().toISOString();

  // 1. Normalize event payload
  const payload = {
    ...event,
    timestamp,
  };

  // 2. Serialize event deterministically
  const eventString = JSON.stringify(payload, Object.keys(payload).sort());

  // 3. Chain hash logic
  const prevHash = lastHash ?? "GENESIS";

  const eventHash = sha256(eventString + prevHash);

  // 4. Store new chain state
  lastHash = eventHash;

  // 5. Final ledger record (this is what would go to DB later)
  const ledgerRecord = {
    id: crypto.randomUUID(),
    ...payload,
    prevHash,
    eventHash,
  };

  // 6. Output (temporary console-backed persistence layer)
  console.log("🧾 LEDGER_COMMIT:", ledgerRecord);

  return ledgerRecord;
}
