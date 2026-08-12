/**
 * verify:consent-model — proves the split-identity consent substrate:
 * core holds tokens + consent only (NO identity), consent is affirmative/
 * specific/unbundled, STOP blocks future sharing, delete-token removes the
 * platform presence with the honest retention disclosure, and the status
 * channel is PII-free + consent-gated. Test events use a TEST ledger that is
 * removed at the end.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
  recordConsent, recordStop, deleteToken, hasActiveConsent,
  consentHistory, postStatus, statusHistory, isTokenDeleted,
} from "@/lib/consent/consentLedger";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };
const TOKEN = "tok_verify_9f3a2b1c";
const MODULE = "module:five-borough-financing";
const LEDGER = path.join(process.cwd(), "data", "consent-ledger.ndjson");
const STATUS = path.join(process.cwd(), "data", "status-channel.ndjson");

// ── 1. Structural: core consent module imports NO module/PII store ───────────
const src = fs.readFileSync("src/lib/consent/consentLedger.ts", "utf8");
ok(!/listing-intake|listingStore|operatorRegistry|ListerContactPII|email:|phone:/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")),
  "core consent ledger must import/store no PII-bearing module state");
ok(/PII_PATTERNS/.test(src), "PII guard must exist in the core ledger");

// ── 2. Affirmative, specific, unbundled — blanket/PII writes refused ─────────
let refusedBlanket = false;
try { recordConsent({ token: TOKEN, action: "share-data", dataScope: "  ", toModule: MODULE, purpose: "x" }); } catch { refusedBlanket = true; }
ok(refusedBlanket, "unscoped (blanket) consent must be refused");
let refusedPii = false;
try { recordConsent({ token: TOKEN, action: "share-data", dataScope: "contact me at jane@example.com", toModule: MODULE, purpose: "financing" }); } catch { refusedPii = true; }
ok(refusedPii, "PII (email) in a consent field must be refused — core never records identity");
let refusedPhone = false;
try { recordConsent({ token: TOKEN, action: "share-data", dataScope: "call 555-123-4567", toModule: MODULE, purpose: "financing" }); } catch { refusedPhone = true; }
ok(refusedPhone, "PII (phone) must be refused");

// ── 3. No consent → no share; consent → allowed; specific to action+module ───
ok(hasActiveConsent(TOKEN, "share-data", MODULE) === false, "share must be blocked with no prior consent (ask, never assume)");
recordConsent({ token: TOKEN, action: "engage-module", dataScope: "saved properties + interest selections", toModule: MODULE, purpose: "begin tailored financing analysis with the licensed module" });
recordConsent({ token: TOKEN, action: "share-data", dataScope: "saved properties + interest selections", toModule: MODULE, purpose: "tailored financing analysis" });
ok(hasActiveConsent(TOKEN, "share-data", MODULE) === true, "explicit consent must enable exactly that share");
ok(hasActiveConsent(TOKEN, "share-data", "module:environmental") === false, "consent must be UNBUNDLED — a different module gets nothing");
ok(hasActiveConsent(TOKEN, "export-report", MODULE) === false, "consent must be PER-ACTION — export not covered by share consent");

// ── 4. Status channel: consent-gated + PII-free ───────────────────────────────
const post = postStatus({ token: TOKEN, fromModule: MODULE, status: "Proforma in progress" });
ok(post.status === "Proforma in progress" && statusHistory(TOKEN).length >= 1, "status flows after engage-module consent");
let statusPiiRefused = false;
try { postStatus({ token: TOKEN, fromModule: MODULE, status: "Call Jane at 555-987-6543" }); } catch { statusPiiRefused = true; }
ok(statusPiiRefused, "status channel must refuse PII content");
let statusNoConsent = false;
try { postStatus({ token: TOKEN, fromModule: "module:environmental", status: "Phase I ordered" }); } catch { statusNoConsent = true; }
ok(statusNoConsent, "status from a non-engaged module must be refused");

// ── 5. STOP halts all future sharing immediately ──────────────────────────────
recordStop(TOKEN);
ok(hasActiveConsent(TOKEN, "share-data", MODULE) === false, "STOP must block further sharing immediately");
recordConsent({ token: TOKEN, action: "share-data", dataScope: "saved properties", toModule: MODULE, purpose: "resume financing analysis" });
ok(hasActiveConsent(TOKEN, "share-data", MODULE) === true, "a NEW affirmative consent after stop re-enables (customer-in-control)");

// ── 6. Delete-token: platform presence removed + honest retention disclosure ─
const del = deleteToken(TOKEN);
ok(isTokenDeleted(TOKEN), "token must read deleted");
ok(hasActiveConsent(TOKEN, "share-data", MODULE) === false, "deleted token must fail every consent check");
ok(/removed your platform presence/.test(del.disclosure) && del.disclosure.includes(MODULE) && /retained by that licensed module for as long as the law requires/.test(del.disclosure),
  "honest retention disclosure must name the engaged module and state legal retention plainly");
let postDeleteRefused = false;
try { recordConsent({ token: TOKEN, action: "share-data", dataScope: "x y z scope", toModule: MODULE, purpose: "p" }); } catch { postDeleteRefused = true; }
ok(postDeleteRefused, "no new consent after deletion");

// ── 7. Append-only + token-keyed history (what the customer sees) ────────────
const hist = consentHistory(TOKEN);
ok(hist.length >= 5 && hist.every((e) => e.token.startsWith("sha256:")), "consent history is token-keyed (hashed at rest) and complete");
ok(hist.some((e) => e.type === "STOP") && hist.some((e) => e.type === "TOKEN_DELETED"), "stop + delete events preserved (append-only — nothing rewritten)");

// ── cleanup: remove TEST ledgers (runtime files, git-ignored) ─────────────────
try { fs.unlinkSync(LEDGER); } catch {}
try { fs.unlinkSync(STATUS); } catch {}

console.log("verify:consent-model — split-identity substrate checked (test ledgers removed).");
if (fail.length) {
  console.error(`\n✗  FAIL — ${fail.length} issue(s):`);
  for (const f of fail) console.error(`    ✗ ${f}`);
  process.exit(1);
}
console.log("\n✓  verify:consent-model PASS — core holds tokens + consents only (PII writes refused, no identity map); consent is affirmative/specific/unbundled and per-action; STOP halts sharing; delete removes platform presence with the honest retention disclosure; status channel is consent-gated + PII-free.");
process.exit(0);
