import { createHash, timingSafeEqual } from "node:crypto";

const LOCALHOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function readRequiredSecret(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function missingRequiredSecretDetail(name: string): string {
  return `${name} is not configured for this environment.`;
}

export function secureCompare(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function requireBearerToken(
  authorizationHeader: string | null | undefined,
  expectedSecret: string
): boolean {
  const raw = authorizationHeader?.trim() ?? "";
  const provided = raw.replace(/^Bearer\s+/i, "");
  return provided.length > 0 && secureCompare(provided, expectedSecret);
}

export async function readJsonBodyWithLimit<T>(
  request: Request,
  options: {
    maxBytes: number;
  }
): Promise<{ ok: true; body: T } | { ok: false; status: number; error: string }> {
  const contentLengthHeader = request.headers.get("content-length");
  const declaredLength = contentLengthHeader
    ? Number.parseInt(contentLengthHeader, 10)
    : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > options.maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Request body exceeds the allowed size for this endpoint.",
    };
  }

  const raw = await request.text().catch(() => "");
  const byteLength = Buffer.byteLength(raw, "utf8");

  if (byteLength > options.maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Request body exceeds the allowed size for this endpoint.",
    };
  }

  try {
    return {
      ok: true,
      body: (raw ? JSON.parse(raw) : {}) as T,
    };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Request body must be valid JSON.",
    };
  }
}

export function sha256Digest(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function isLoopbackHostname(hostname: string): boolean {
  return LOCALHOSTS.has(hostname.trim().toLowerCase());
}
