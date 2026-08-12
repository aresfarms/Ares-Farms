import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { and, eq, isNull, lte } from "drizzle-orm";

import {
  plaidSecureRecords,
  syntheticFixtureLineageRecords,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  bindSyntheticFixtureLineage,
  type SyntheticFixtureContext,
} from "@/lib/testing/syntheticFixtureLineage";

const ALGORITHM = "aes-256-gcm";
const ENVELOPE_VERSION = "AES-256-GCM-envelope-v1";
const MASTER_KEY_ENV = "PLAID_DATA_ENCRYPTION_KEY";
const KEY_VERSION_ENV = "PLAID_DATA_ENCRYPTION_KEY_VERSION";

export type PlaidSecureCategory =
  | "access-token"
  | "identity"
  | "identity-match"
  | "assets"
  | "income"
  | "liabilities"
  | "statements"
  | "transactions"
  | "balance"
  | "auth";
function masterKey(): Buffer {
  const encoded = process.env[MASTER_KEY_ENV]?.trim();
  if (!encoded)
    throw new Error(
      "Plaid encrypted storage is unavailable: master key is not configured.",
    );
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32)
    throw new Error("Plaid encrypted storage requires a 256-bit master key.");
  return key;
}

function keyVersion(): string {
  const version = process.env[KEY_VERSION_ENV]?.trim();
  if (!version)
    throw new Error(
      "Plaid encrypted storage requires an explicit key version.",
    );
  return version;
}

function encryptWithKey(plaintext: Buffer, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, iv, authTag: cipher.getAuthTag() };
}

function decryptWithKey(
  ciphertext: Buffer,
  iv: Buffer,
  authTag: Buffer,
  key: Buffer,
) {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
export async function persistPlaidSecret(args: {
  subjectRef: string;
  category: PlaidSecureCategory;
  value: unknown;
  consentRef: string;
  retentionClass: string;
  expiresAt?: Date | null;
  syntheticFixtureContext?: SyntheticFixtureContext | null;
}) {
  if (!args.subjectRef.trim() || !args.consentRef.trim()) {
    throw new Error("Plaid storage requires subject and consent binding.");
  }
  const recordId = randomUUID();
  const syntheticFixture = args.syntheticFixtureContext
    ? bindSyntheticFixtureLineage(
        args.syntheticFixtureContext,
        "plaid_secure_record",
        recordId,
      )
    : null;
  const dek = randomBytes(32);
  const data = encryptWithKey(
    Buffer.from(JSON.stringify(args.value), "utf8"),
    dek,
  );
  const wrapped = encryptWithKey(dek, masterKey());

  return db.transaction(async (tx) => {
    const rows = await tx
      .insert(plaidSecureRecords)
      .values({
        id: recordId,
        subjectRef: args.subjectRef.trim(),
        dataCategory: args.category,
        ciphertextB64: data.ciphertext.toString("base64"),
        ivB64: data.iv.toString("base64"),
        authTagB64: data.authTag.toString("base64"),
        wrappedDekB64: wrapped.ciphertext.toString("base64"),
        wrapIvB64: wrapped.iv.toString("base64"),
        wrapAuthTagB64: wrapped.authTag.toString("base64"),
        keyVersion: keyVersion(),
        algorithm: ENVELOPE_VERSION,
        consentRef: args.consentRef.trim(),
        retentionClass: args.retentionClass,
        expiresAt: args.expiresAt ?? null,
        metadata: {
          encryptedAt: new Date().toISOString(),
          plaintextPersisted: false,
          syntheticFixture,
        },
      })
      .returning({ id: plaidSecureRecords.id });

    if (syntheticFixture) {
      await tx.insert(syntheticFixtureLineageRecords).values({
        syntheticPersonaId: syntheticFixture.syntheticPersonaId,
        humanVisibleName: syntheticFixture.humanVisibleName,
        testRunId: syntheticFixture.testRunId,
        fixtureVersion: syntheticFixture.fixtureVersion,
        registryVersion: syntheticFixture.registryVersion,
        lineageVersion: syntheticFixture.lineageVersion,
        environment: syntheticFixture.environment,
        operatorIdentity: syntheticFixture.operatorIdentity,
        fixtureCreatedAt: new Date(syntheticFixture.createdAt),
        scenarioId: syntheticFixture.scenarioId,
        providerTargets: [...syntheticFixture.providerTargets],
        recordType: syntheticFixture.recordType,
        recordId: syntheticFixture.recordId,
        lineageSha256: syntheticFixture.lineageSha256,
        lineagePayload: syntheticFixture,
        governanceVersion: "master-volumes-runtime-v0.1.0",
        classification: "RESTRICTED",
        replayRef: args.consentRef.trim(),
        traceId: syntheticFixture.testRunId,
        source: "plaid-secure-data-runtime",
      });
    }
    return rows[0];
  });
}

export async function readPlaidSecret<T>(
  id: string,
  subjectRef: string,
): Promise<T | null> {
  const rows = await db
    .select()
    .from(plaidSecureRecords)
    .where(
      and(
        eq(plaidSecureRecords.id, id),
        eq(plaidSecureRecords.subjectRef, subjectRef),
        isNull(plaidSecureRecords.deletedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.algorithm !== ENVELOPE_VERSION)
    throw new Error("Unsupported Plaid encryption envelope.");
  const dek = decryptWithKey(
    Buffer.from(row.wrappedDekB64, "base64"),
    Buffer.from(row.wrapIvB64, "base64"),
    Buffer.from(row.wrapAuthTagB64, "base64"),
    masterKey(),
  );
  const plaintext = decryptWithKey(
    Buffer.from(row.ciphertextB64, "base64"),
    Buffer.from(row.ivB64, "base64"),
    Buffer.from(row.authTagB64, "base64"),
    dek,
  );
  return JSON.parse(plaintext.toString("utf8")) as T;
}

export async function cryptoShredPlaidSubject(
  subjectRef: string,
): Promise<number> {
  const rows = await db
    .update(plaidSecureRecords)
    .set({
      deletedAt: new Date(),
      ciphertextB64: "PURGED",
      wrappedDekB64: "PURGED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(plaidSecureRecords.subjectRef, subjectRef.trim()),
        isNull(plaidSecureRecords.deletedAt),
      ),
    )
    .returning({ id: plaidSecureRecords.id });
  return rows.length;
}

export function plaidAtRestEncryptionReady(): boolean {
  try {
    masterKey();
    keyVersion();
    return true;
  } catch {
    return false;
  }
}
export function verifyPlaidEncryptionPrimitive(): boolean {
  const sentinel = `plaid-test-${Date.now()}-${randomBytes(8).toString("hex")}`;
  const dek = randomBytes(32);
  const data = encryptWithKey(Buffer.from(sentinel, "utf8"), dek);
  const wrapped = encryptWithKey(dek, masterKey());
  if (data.ciphertext.toString("utf8").includes(sentinel)) return false;
  const unwrapped = decryptWithKey(
    wrapped.ciphertext,
    wrapped.iv,
    wrapped.authTag,
    masterKey(),
  );
  const reopened = decryptWithKey(
    data.ciphertext,
    data.iv,
    data.authTag,
    unwrapped,
  ).toString("utf8");
  return reopened === sentinel && keyVersion().length > 0;
}

export async function purgeExpiredPlaidRecords(
  now = new Date(),
): Promise<number> {
  const rows = await db
    .update(plaidSecureRecords)
    .set({
      deletedAt: now,
      ciphertextB64: "PURGED",
      wrappedDekB64: "PURGED",
      updatedAt: now,
    })
    .where(
      and(
        isNull(plaidSecureRecords.deletedAt),
        lte(plaidSecureRecords.expiresAt, now),
      ),
    )
    .returning({ id: plaidSecureRecords.id });
  return rows.length;
}
