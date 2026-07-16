import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

const DEFAULT_CLAMSCAN_BINARY = "/opt/homebrew/bin/clamscan";
const DEFAULT_FRESHCLAM_BINARY = "/opt/homebrew/bin/freshclam";
const DEFAULT_DATABASE_DIR = "/opt/homebrew/var/lib/clamav";
const DEFAULT_SIGNATURE_MAX_AGE_DAYS = 3;
const BOOTSTRAP_TTL_MS = 6 * 60 * 60 * 1000;

export type LocalMalwareScanResult = {
  provider: string;
  verdict: "clean" | "malicious" | "error";
  detail: string;
};

let bootstrapPromise: Promise<void> | null = null;
let lastBootstrapAt = 0;

function providerName(): string {
  return process.env.PROPERTY_UPLOAD_SCAN_PROVIDER?.trim() || "clamav-local";
}

function clamscanBinary(): string {
  return process.env.PROPERTY_UPLOAD_SCAN_CLAMAV_BINARY?.trim() || DEFAULT_CLAMSCAN_BINARY;
}

function freshclamBinary(): string {
  return (
    process.env.PROPERTY_UPLOAD_SCAN_CLAMAV_FRESHCLAM_BINARY?.trim() ||
    DEFAULT_FRESHCLAM_BINARY
  );
}

function databaseDirectory(): string {
  return (
    process.env.PROPERTY_UPLOAD_SCAN_CLAMAV_DATABASE_DIR?.trim() || DEFAULT_DATABASE_DIR
  );
}

function signatureMaxAgeDays(): number {
  const raw = Number(process.env.PROPERTY_UPLOAD_SCAN_CLAMAV_MAX_SIGNATURE_AGE_DAYS);
  if (Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }

  return DEFAULT_SIGNATURE_MAX_AGE_DAYS;
}

function tempExtension(mediaType: string): string {
  if (mediaType === "image/png") return ".png";
  if (mediaType === "image/webp") return ".webp";
  if (mediaType === "image/heic") return ".heic";
  if (mediaType === "image/heif") return ".heif";
  return ".jpg";
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function databaseFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir).catch(() => [] as string[]);

  return entries
    .filter((entry) => /\.(cld|cvd|cud)$/i.test(entry))
    .map((entry) => join(dir, entry));
}

async function newestMtimeMs(paths: string[]): Promise<number> {
  let newest = 0;

  for (const path of paths) {
    const metadata = await stat(path).catch(() => null);
    if (metadata && metadata.mtimeMs > newest) {
      newest = metadata.mtimeMs;
    }
  }

  return newest;
}

async function signaturesNeedRefresh(dir: string): Promise<boolean> {
  const files = await databaseFiles(dir);

  if (files.length === 0) {
    return true;
  }

  const newest = await newestMtimeMs(files);
  const ageMs = Date.now() - newest;
  return ageMs > signatureMaxAgeDays() * 24 * 60 * 60 * 1000;
}

async function runFreshclam(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  const configPath = join(dir, "freshclam.local.conf");
  const logPath = join(dir, "freshclam.log");
  const config = [
    `DatabaseDirectory ${dir}`,
    "DatabaseMirror database.clamav.net",
    `UpdateLogFile ${logPath}`,
    "LogTime yes",
    "Foreground yes",
    "Checks 1",
  ].join("\n");

  await writeFile(configPath, `${config}\n`);

  await execFile(
    freshclamBinary(),
    ["--stdout", "--config-file", configPath],
    {
      timeout: 180_000,
      maxBuffer: 8 * 1024 * 1024,
      env: {
        ...process.env,
        FRESHCLAM_CLIENT_EXECUTABLE: freshclamBinary(),
      },
    }
  );
}

async function ensureScannerReady(): Promise<void> {
  const now = Date.now();
  if (now - lastBootstrapAt < BOOTSTRAP_TTL_MS) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const dbDir = databaseDirectory();

      if (!(await pathExists(clamscanBinary()))) {
        throw new Error("ClamAV scanner binary is not installed.");
      }

      await mkdir(dbDir, { recursive: true });

      if (await signaturesNeedRefresh(dbDir)) {
        await runFreshclam(dbDir);
      }

      const files = await databaseFiles(dbDir);
      if (files.length === 0) {
        throw new Error("ClamAV signatures are not available after refresh.");
      }

      lastBootstrapAt = Date.now();
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}

function infectedDetail(stdout: string, fallback: string): string {
  const line = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.endsWith("FOUND"));

  if (!line) {
    return fallback;
  }

  return line.replace(/\s+FOUND$/, "").trim();
}

export async function scanWithLocalClamAv(input: {
  bytes: Uint8Array;
  mediaType: string;
  fileName?: string | null;
}): Promise<LocalMalwareScanResult> {
  await ensureScannerReady();

  const tempDir = await mkdtemp(join(tmpdir(), "furlong-upload-scan-"));
  const fileName = (input.fileName?.trim() || "upload-image") + tempExtension(input.mediaType);
  const targetPath = join(tempDir, fileName.replace(/[^\w.-]+/g, "-"));

  try {
    await writeFile(targetPath, input.bytes);

    try {
      const { stdout } = await execFile(
        clamscanBinary(),
        ["--stdout", "--no-summary", "--database", databaseDirectory(), targetPath],
        {
          timeout: 60_000,
          maxBuffer: 8 * 1024 * 1024,
        }
      );

      return {
        provider: providerName(),
        verdict: "clean",
        detail:
          stdout.trim() ||
          "Local ClamAV scanning cleared the uploaded image against current signatures.",
      };
    } catch (error) {
      const exitCode = typeof error === "object" && error !== null && "code" in error
        ? Number((error as { code?: unknown }).code)
        : null;
      const stdout = typeof error === "object" && error !== null && "stdout" in error
        ? String((error as { stdout?: unknown }).stdout ?? "")
        : "";
      const stderr = typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "")
        : "";

      if (exitCode === 1) {
        return {
          provider: providerName(),
          verdict: "malicious",
          detail: infectedDetail(
            stdout,
            "Local ClamAV scanning detected a malware signature match in the uploaded file."
          ),
        };
      }

      return {
        provider: providerName(),
        verdict: "error",
        detail:
          stderr.trim() ||
          stdout.trim() ||
          (error instanceof Error
            ? error.message
            : "Local ClamAV scanning failed unexpectedly."),
      };
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function readClamAvSignatureStatus(): Promise<{
  databaseDirectory: string;
  signatureFiles: string[];
  newestSignatureUpdatedAt: string | null;
}> {
  const dbDir = databaseDirectory();
  const files = await databaseFiles(dbDir);
  const newest = await newestMtimeMs(files);

  return {
    databaseDirectory: dbDir,
    signatureFiles: files,
    newestSignatureUpdatedAt: newest > 0 ? new Date(newest).toISOString() : null,
  };
}

export async function readClamAvVersion(): Promise<string> {
  const { stdout } = await execFile(clamscanBinary(), ["--version"], {
    timeout: 10_000,
    maxBuffer: 1024 * 1024,
  });

  return stdout.trim();
}

export async function readFreshclamLogTail(): Promise<string | null> {
  const logPath = join(databaseDirectory(), "freshclam.log");

  if (!(await pathExists(logPath))) {
    return null;
  }

  const contents = await readFile(logPath, "utf8").catch(() => "");
  if (!contents.trim()) {
    return null;
  }

  return contents.trim().split("\n").slice(-20).join("\n");
}
