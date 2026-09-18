import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { buildAnswerExport, sha256 } from "@/lib/intelligence/furlongAnswerExport";
import { POST as exportCase } from "@/app/api/intelligence/cases/[caseId]/export/route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { GET, POST } from "@/app/api/intelligence/cases/[caseId]/route";
import { GET as listCases } from "@/app/api/intelligence/cases/route";
import { propertyFurlongAnswer, furlongAnswerHtml, publicEvidenceUrl, ANSWER_QUESTIONS } from "@/lib/property/furlongAnswer";
import { savedCaseAnswer } from "@/lib/intelligence/furlongCaseAnswer";
import { isProtectedPage } from "@/lib/auth/protectedRoutes";
import { evaluateProtectedPageRole } from "@/lib/auth/pageRolePolicy";
import type { LaneWorkspaceProps } from "@/components/property/lanes/GovernedLaneChassis";

async function main() {
  let checks = 0;
  function check(value: unknown, message: string) { assert.ok(value, message); checks++; }
  const base = {
    propertyId: "imported:place-facts", title: "Example parcel", location: "Maryland", propertyType: "Agricultural",
    priceLabel: "$629,000 assessment", pauseLine: "", financingLanes: [], intelligence: null,
    propertyRecord: { exactAddress: "Example parcel one", assessedTotalValue: 629000, price: null },
  } as unknown as LaneWorkspaceProps;
  const pending = propertyFurlongAnswer(base);
  check(pending.price.amount === null, "Assessment must never become transaction price.");
  check(pending.sections.length === 5, "All five customer questions required.");
  check(!pending.sections.some(section => /alfalfa|2\.14|9,922|4,639/.test(section.text)), "No unsupported legacy crop or DSCR output.");
  const other = propertyFurlongAnswer({ ...base, propertyRecord: { ...base.propertyRecord!, exactAddress: "Example parcel two" } });
  check(other.subjectId !== pending.subjectId, "Different imported properties must not overwrite comparison slots.");
  const listing = propertyFurlongAnswer({ ...base, propertyRecord: { ...base.propertyRecord!, price: 2500000,
    listingSourceName: "Fixture approved listing", listingSourceUrl: "https://example.org/listing",
    listingSourceAsOf: "2026-09-08", priceEvidence: { status: "current-asking-price", reason: "Fixture", observedAt: "2026-09-08" } } });
  check(listing.price.amount === 2500000, "A current source-backed price must be retained.");
  const stale = propertyFurlongAnswer({ ...base, propertyRecord: { ...listingRecord(), priceEvidence: { status: "price-pending", reason: "Stale", observedAt: "2026-01-01" } } });
  check(stale.price.amount === null, "Stale price must stay pending.");
  function listingRecord() { return { ...base.propertyRecord!, price: 2500000, listingSourceName: "Fixture", listingSourceUrl: "https://example.org/listing", listingSourceAsOf: "2026-01-01" }; }
  check(publicEvidenceUrl("javascript:alert(1)") === null, "Reject executable source URLs.");
  check(publicEvidenceUrl("https://user:password@example.org") === null, "Reject credential-bearing source URLs.");
  const malicious = { ...pending, title: '<script>alert("x")</script>' };
  const html = furlongAnswerHtml(malicious, "2026-09-08T00:00:00Z");
  check(!html.includes("<script>") && html.includes("&lt;script&gt;"), "Portable HTML must escape all text.");
  check(ANSWER_QUESTIONS.every(([, question]) => html.includes(question)), "Export uses all five canonical sections.");
  const saved = savedCaseAnswer({ caseId: "case-fixture", currentStage: "PROPERTY_ANALYSIS", caseStatus: "OPEN", outcomeStatus: "NOT_STARTED", propertySnapshot: { answerSnapshot: listing } });
  const packet = await buildAnswerExport(saved, "2026-09-08T12:00:00.000Z", "fixture-v1");
  const replay = await buildAnswerExport(saved, "2026-09-08T12:00:00.000Z", "fixture-v1");
  check(packet.bytes.equals(replay.bytes), "Exact export inputs produce byte-identical PDF/HTML/JSON package.");
  check(packet.manifest.files.every(file => file.sha256 === sha256(packet.files.find(item => item.name === file.name)!.bytes)), "Each exported file hash matches its manifest.");
  check(packet.manifest.files.length === 3 && packet.bytes.readUInt32LE() === 0x04034b50, "ZIP contains human-readable and machine-readable output.");
  if (process.argv.includes("--render-fixture")) {
    mkdirSync("tmp/pdfs/customer-experience", { recursive: true });
    writeFileSync("tmp/pdfs/customer-experience/Furlong-Answer.pdf", packet.files.find(file => file.name.endsWith(".pdf"))!.bytes);
    writeFileSync("tmp/pdfs/customer-experience/Furlong-Answer.zip", packet.bytes);
  }
  check(saved.sections.every(section => section.status === "SCREENING"), "Customer snapshot cannot self-certify verification.");
  check(saved.sections.map(section => section.text).join() === listing.sections.map(section => section.text).join(), "Saved snapshot preserves answer wording.");
  check(isProtectedPage("/intelligence/cases") && isProtectedPage("/intelligence/cases/example"), "Saved-case pages require sign-in.");
  check(evaluateProtectedPageRole("/intelligence/cases", "user").allowed, "Customers can reach their own case surface.");

  // Test real route handlers with a strictly in-memory DB double. No network
  // or database writes are permitted in this test, including failure paths.
  const originalSelect = db.select;
  const originalInsert = db.insert;
  const originalUpdate = db.update;
  const originalTransaction = db.transaction;
  const previousEnforcement = process.env.API_AUTH_ENFORCEMENT;
  process.env.API_AUTH_ENFORCEMENT = "required";
  let rows: unknown[][] = [];
  let selections = 0;
  let mutations = 0;
  (db as unknown as { select: unknown }).select = () => {
    selections++;
    const result = rows.shift() ?? [];
    const chain: Record<string, unknown> = {};
    for (const method of ["from","where","orderBy"]) chain[method] = () => chain;
    chain.limit = async () => result;
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
    return chain;
  };
  (db as unknown as { insert: unknown }).insert = () => { mutations++; throw new Error("Unexpected test write"); };
  (db as unknown as { update: unknown }).update = () => { mutations++; throw new Error("Unexpected test write"); };
  const fixture = { caseId: "case-fixture", ownerActorId: "owner@example.invalid", currentStage: "PROPERTY_ANALYSIS", caseStatus: "OPEN", outcomeStatus: "NOT_STARTED", propertySnapshot: { privateSentinel: "DO_NOT_DISCLOSE" }, replayRef: "fixture-v1", updatedAt: new Date("2026-09-08T12:00:00.000Z") };
  const context = { params: Promise.resolve({ caseId: "case-fixture" }) };
  function request(actor: string | null, method = "GET", body?: unknown, query = "") {
    return new NextRequest("http://localhost/api/intelligence/cases/case-fixture" + query, {
      method, headers: { ...(actor ? { "x-ares-authenticated-user-id": actor, "x-ares-authenticated-role": "user" } : {}), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  try {
    let response: Response = await GET(request(null), context);
    check(response.status === 403 && selections === 0, "Anonymous caller denied before DB access.");
    rows = [[fixture], [], []];
    response = await GET(request("other@example.invalid"), context);
    check(response.status === 404 && !(await response.text()).includes("DO_NOT_DISCLOSE"), "Cross-owner read denied without leakage.");
    rows = [[fixture], [], []];
    response = await GET(request("owner@example.invalid"), context);
    check(response.status === 200 && response.headers.get("Cache-Control")?.includes("no-store"), "Owner read allowed, uncached.");
    for (const action of ["save","append-event","record-outcome"]) {
      rows = [[fixture]];
      response = await POST(request("other@example.invalid", "POST", { action, case: {} }), context);
      check(response.status === 404 && mutations === 0, "Cross-owner " + action + " denied before mutation.");
    }
    rows = [[fixture], [], []];
    response = await GET(request("other@example.invalid","GET",undefined,"?role=admin&userId=owner@example.invalid"), context);
    check(response.status === 404, "Query-claimed privilege cannot change ownership.");
    rows = [[]];
    response = await POST(request("owner@example.invalid","POST",{ action: "append-event" }), context);
    check(response.status === 404 && mutations === 0, "Cannot append events to an unsaved case.");
    response = await listCases(request(null));
    check(response.status === 401, "Anonymous case listing denied.");
    response = await exportCase(request(null, "POST", {}), context);
    check(response.status === 401, "Anonymous export denied.");
    response = await exportCase(request("owner@example.invalid", "POST", { consent: "no" }), context);
    check(response.status === 400, "Export requires explicit personal-download consent.");
    const exportBody = { consent: "furlong-answer-personal-download-v1", expectedRecordVersion: "fixture-v1" };
    rows = [[fixture]];
    response = await exportCase(request("other@example.invalid", "POST", exportBody), context);
    check(response.status === 404, "Cross-owner export denied.");
    rows = [[fixture]];
    response = await exportCase(request("owner@example.invalid", "POST", { ...exportBody, expectedRecordVersion: "old" }), context);
    check(response.status === 409, "Changed case blocks stale export.");
    let audited: Record<string, unknown> | null = null;
    (db as unknown as { transaction: unknown }).transaction = async () => { throw new Error("Audit unavailable"); };
    rows = [[fixture]];
    response = await exportCase(request("owner@example.invalid", "POST", exportBody), context);
    check(response.status === 503, "Audit failure releases no export bytes.");
    (db as unknown as { transaction: unknown }).transaction = async (operation: (tx: unknown) => unknown) => operation({
      execute: async () => ({ rows: [{ head_hash: "fixture-chain-head" }] }),
      insert: () => ({ values: async (value: Record<string, unknown>) => { audited = value; } }),
    });
    rows = [[fixture]];
    response = await exportCase(request("owner@example.invalid", "POST", exportBody), context);
    check(response.status === 200 && response.headers.get("Content-Type") === "application/zip", "Owner receives package only after canonical audit succeeds.");
    check(audited && JSON.stringify(audited).includes("manifestHash") && JSON.stringify(audited).includes("furlong-answer-personal-download-v1"), "Audit records manifest, consent, requester and replay input.");
    check(response.headers.has("X-Furlong-Audit-Id") && response.headers.has("X-Furlong-Manifest-SHA256"), "Download exposes audit and integrity references.");
    check(!JSON.stringify(audited).includes("DO_NOT_DISCLOSE"), "Unrelated raw case data excluded from export audit.");
  } finally {
    db.select = originalSelect; db.insert = originalInsert; db.update = originalUpdate; db.transaction = originalTransaction;
    if (previousEnforcement === undefined) delete process.env.API_AUTH_ENFORCEMENT; else process.env.API_AUTH_ENFORCEMENT = previousEnforcement;
  }
  const store = readFileSync("src/lib/intelligence/furlongCaseStore.ts","utf8");
  check(store.includes("if (input.verified) await db.update"), "Unverified outcomes do not complete case stages.");
  check(store.includes("setWhere:") && store.includes('ownerActorId: sql'), "Upsert cannot silently transfer ownership.");
  const page = readFileSync("src/app/intelligence/cases/[caseId]/page.tsx","utf8");
  check(!page.includes('read("reviewOutcome")'), "URL parameters cannot manufacture reviewed outcomes.");
  console.log(JSON.stringify({ ok: true, rule: "FURLONG-CUSTOMER-EXPERIENCE-2026-09-08", checks, database: "in-memory-double", liveCertification: false }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
