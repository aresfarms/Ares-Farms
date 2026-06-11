/**
 * Ingest sanitizer — source-ingested content must be sanitized before render
 * (Tier 1). Strips markup, control characters, and event-handler/script
 * vectors from free text that originated outside the platform (scraped feeds,
 * broker submissions). Plain-text-in, plain-text-out; never trusts upstream.
 */
export function sanitizeIngestText(input: string | null | undefined, maxLen = 2000): string {
  if (!input) return "";
  let t = String(input);
  t = t.replace(/<[^>]*>/g, " "); // strip tags entirely
  t = t.replace(/javascript\s*:/gi, "");
  t = t.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  // control characters except newline/tab (unicode escapes, never raw bytes)
  t = t.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t.slice(0, maxLen);
}
