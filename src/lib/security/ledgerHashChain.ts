/**
 * Ledger hash chain — tamper-evident append-only NDJSON (Tier 2B).
 *
 * Each appended event gains { prevHash, hash } where
 * hash = sha256(prevHash + canonical(payload)). Editing or deleting any chained
 * line breaks every subsequent hash; verifyLedgerChain detects it. Legacy
 * (pre-chain) lines are grandfathered: verification starts at the first
 * chained entry and reports how many legacy lines precede it.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const GENESIS = "GENESIS";
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;
const LOCK_RETRY_MS = 10;
const lockWaitBuffer = new Int32Array(new SharedArrayBuffer(4));

function canonical(payload: Record<string, unknown>): string {
  const rest: Record<string, unknown> = {};
  for (const k of Object.keys(payload).sort()) {
    if (k === "hash" || k === "prevHash") continue;
    rest[k] = payload[k];
  }
  return JSON.stringify(rest);
}
function digest(prevHash: string, payload: Record<string, unknown>): string {
  return createHash("sha256").update(prevHash + canonical(payload)).digest("hex");
}

function withLedgerLock<T>(filePath: string, operation: () => T): T {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lockPath = `${filePath}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let lockFd: number | null = null;

  while (lockFd === null) {
    try {
      lockFd = fs.openSync(lockPath, "wx", 0o600);
    } catch (error) {
      const code = error instanceof Error && "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : null;
      if (code !== "EEXIST") throw error;

      let lockAge: number;
      try {
        lockAge = Date.now() - (fs.statSync(lockPath).mtimeMs || Date.now());
      } catch (statError) {
        const statCode = statError instanceof Error && "code" in statError
          ? String((statError as NodeJS.ErrnoException).code)
          : null;
        if (statCode === "ENOENT") continue;
        throw statError;
      }
      if (lockAge > STALE_LOCK_MS) {
        try {
          fs.unlinkSync(lockPath);
        } catch (unlinkError) {
          const unlinkCode = unlinkError instanceof Error && "code" in unlinkError
            ? String((unlinkError as NodeJS.ErrnoException).code)
            : null;
          if (unlinkCode !== "ENOENT") throw unlinkError;
        }
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for the audit-ledger lock: ${path.basename(filePath)}`);
      }
      Atomics.wait(lockWaitBuffer, 0, 0, LOCK_RETRY_MS);
    }
  }

  try {
    return operation();
  } finally {
    fs.closeSync(lockFd);
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // A stale-lock recovery may already have removed it; the append itself is complete.
    }
  }
}

/** Append payload with chain fields; returns the chained record. */
export function chainAppend(filePath: string, payload: Record<string, unknown>): Record<string, unknown> {
  return withLedgerLock(filePath, () => {
    let prevHash = GENESIS;
    try {
      const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const e = JSON.parse(lines[i]);
        if (typeof e.hash === "string") { prevHash = e.hash; break; }
      }
    } catch { /* first entry */ }
    const record = { ...payload, prevHash, hash: digest(prevHash, payload) };
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", {
      encoding: "utf8",
      mode: 0o600,
    });
    return record;
  });
}

type LedgerVerification = { ok: boolean; chained: number; legacy: number; brokenAt: number | null };

function verifyLedgerContent(content: string): LedgerVerification {
  const lines = content.split("\n").filter(Boolean);
  let prevHash = GENESIS, chained = 0, legacy = 0;
  for (let i = 0; i < lines.length; i++) {
    let e: Record<string, unknown>;
    try { e = JSON.parse(lines[i]); } catch { return { ok: false, chained, legacy, brokenAt: i }; }
    if (typeof e.hash !== "string") {
      if (chained === 0) { legacy++; continue; }
      return { ok: false, chained, legacy, brokenAt: i };
    }
    if (e.prevHash !== prevHash || digest(prevHash, e) !== e.hash) return { ok: false, chained, legacy, brokenAt: i };
    prevHash = e.hash as string; chained++;
  }
  return { ok: true, chained, legacy, brokenAt: null };
}

/** Verify the chain; returns ok + where it broke + legacy (pre-chain) count. */
export function verifyLedgerChain(filePath: string): LedgerVerification {
  try {
    return verifyLedgerContent(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { ok: true, chained: 0, legacy: 0, brokenAt: null };
  }
}

export type ForensicLedgerRolloverResult = Readonly<{
  ok: true;
  action: "ROLLED_OVER";
  originalSha256: string;
  originalLineCount: number;
  brokenAtIndex: number;
  brokenAtLine: number;
  archivePath: string;
  manifestPath: string;
  newLedgerPath: string;
}>;

/**
 * Preserve a broken ledger byte-for-byte and start a new, independently
 * verifiable chain. This never repairs or rewrites historical evidence.
 *
 * The verify/archive/replace sequence shares the same cross-process lock used
 * by chainAppend, preventing a writer from landing between verification and
 * preservation.
 */
export function forensicRolloverLedger(
  filePath: string,
  input: Readonly<{
    preservedAt: string;
    reason: string;
    actorId: string;
  }>,
): ForensicLedgerRolloverResult {
  return withLedgerLock(filePath, () => {
    const fd = fs.openSync(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) {
      fs.closeSync(fd);
      throw new Error("Audit ledger rollover requires a regular, non-symlink file.");
    }

    const original = fs.readFileSync(fd);
    const verification = verifyLedgerContent(original.toString("utf8"));
    if (verification.ok || verification.brokenAt === null) {
      fs.closeSync(fd);
      throw new Error("Audit ledger is intact; forensic rollover is not permitted.");
    }

    const originalSha256 = createHash("sha256").update(original).digest("hex");
    const originalLineCount = original.toString("utf8").split("\n").filter(Boolean).length;
    const stamp = input.preservedAt.replace(/[^0-9A-Za-z]/g, "-");
    const baseName = path.basename(filePath, path.extname(filePath));
    const directory = path.dirname(filePath);
    const archiveName = `${baseName}.forensic-${stamp}-${originalSha256.slice(0, 12)}.ndjson`;
    const manifestName = `${archiveName}.manifest.json`;
    const archivePath = path.join(directory, archiveName);
    const manifestPath = path.join(directory, manifestName);
    const manifestTempPath = `${manifestPath}.tmp`;

    const manifest = {
      schemaVersion: 1,
      classification: "RESTRICTED_FORENSIC_EVIDENCE",
      event: "AUDIT_LEDGER_FORENSIC_ROLLOVER",
      preservedAt: input.preservedAt,
      preservedBy: input.actorId,
      reason: input.reason,
      sourceLedger: path.basename(filePath),
      archiveLedger: archiveName,
      originalSha256,
      originalBytes: original.byteLength,
      originalLineCount,
      brokenAtIndex: verification.brokenAt,
      brokenAtLine: verification.brokenAt + 1,
      verifiedEntriesBeforeBreak: verification.chained,
      legacyEntries: verification.legacy,
      preservationRule: "Original bytes preserved; historical chain not repaired or rewritten.",
    } as const;

    fs.writeFileSync(manifestTempPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    try {
      const current = fs.lstatSync(filePath);
      if (current.isSymbolicLink() || current.dev !== stat.dev || current.ino !== stat.ino) {
        throw new Error("Audit ledger changed identity during forensic rollover.");
      }
      fs.linkSync(filePath, archivePath);
      fs.unlinkSync(filePath);
      fs.chmodSync(archivePath, 0o600);
      fs.linkSync(manifestTempPath, manifestPath);
      fs.unlinkSync(manifestTempPath);

      const payload = {
        ts: input.preservedAt,
        actorId: input.actorId,
        actorName: "Governed forensic rollover",
        domain: "audit-ledger-integrity",
        subject: path.basename(filePath),
        decision: "FORENSIC_ROLLOVER",
        reason: input.reason,
        detail: {
          archiveLedger: archiveName,
          manifest: manifestName,
          originalSha256,
          originalLineCount,
          brokenAtIndex: verification.brokenAt,
          brokenAtLine: verification.brokenAt + 1,
        },
      };
      const record = { ...payload, prevHash: GENESIS, hash: digest(GENESIS, payload) };
      fs.writeFileSync(filePath, `${JSON.stringify(record)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      try { if (fs.existsSync(manifestTempPath)) fs.unlinkSync(manifestTempPath); } catch { /* preserve primary error */ }
      throw error;
    } finally {
      fs.closeSync(fd);
    }

    return {
      ok: true,
      action: "ROLLED_OVER",
      originalSha256,
      originalLineCount,
      brokenAtIndex: verification.brokenAt,
      brokenAtLine: verification.brokenAt + 1,
      archivePath,
      manifestPath,
      newLedgerPath: filePath,
    };
  });
}
