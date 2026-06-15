/**
 * verify:navigator-experience — NAVIGATOR-FIRST-15-SECONDS-001.
 *
 * This step is DOCTRINE ONLY (no UI change). The gate therefore HARD-asserts the
 * doctrine document is complete and well-formed (the real deliverable), and runs
 * the first-touch SOURCE anti-drift checks as ADVISORY warnings — because the
 * approved first-touch UI lives on an as-yet-unmerged branch, and main's current
 * Navigator predates this doctrine. A future, founder-approved UX branch should
 * flip the advisory block to hard by setting NAV_EXPERIENCE_ENFORCE_SOURCE=1.
 *
 * The felt success criteria (§8) remain a HUMAN review step; this gate is a
 * floor, never a substitute for founder review.
 */
import * as fs from "node:fs";

const DOC = "docs/doctrine/NAVIGATOR_FIRST_15_SECONDS_001.md";
const fail: string[] = [];
const warn: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

// ── HARD: doctrine document completeness ─────────────────────────────────────
ok(fs.existsSync(DOC), "doctrine doc exists");
const raw = fs.existsSync(DOC) ? fs.readFileSync(DOC, "utf8") : "";
// Flatten markdown wrapping (blockquote markers + line breaks) so phrase
// assertions match regardless of where prose wraps.
const doc = raw.replace(/^>\s?/gm, " ").replace(/\s+/g, " ");

ok(/NAVIGATOR-FIRST-15-SECONDS-001/.test(doc), "doc carries the doctrine id");
ok(/first 15 seconds of Furlong must feel like a trusted guide inviting a conversation, not a portal asking for intake/i.test(doc),
  "§1 core constitutional rule present verbatim");
ok(/Furlong's first 15 seconds are not onboarding\.[\s\S]*They are an invitation\./.test(doc),
  "constitutional lock present verbatim");
ok(/make room for the user's story/.test(doc), "lock: platform makes room for the user's story");

// Required feeling list (§1) and forbidden-feel list (§2).
for (const feeling of ["welcome", "curious", "unjudged", "unpressured", "free to start messy", "safe to ask a strange question"]) {
  ok(doc.includes(feeling), `§1 names the feeling: "${feeling}"`);
}
for (const notLike of ["bank portal", "lender intake form", "real estate lead funnel", "government application", "CRM", "self-help worksheet", "brochure", "onboarding flow", "dashboard", "checklist"]) {
  ok(doc.includes(notLike), `§2 forbids feeling like: "${notLike}"`);
}

// Emotional target (§3), interaction rule (§4), language target (§5).
ok(/Tell me what's going on\./.test(doc) && /Please begin our process\./.test(doc), "§3 emotional target contrast present");
ok(/input is the primary visual and functional center/i.test(doc), "§4 input-is-the-center rule present");
ok(/What are you trying to figure out\?/.test(doc) && /What's going on\?/.test(doc), "§5 acceptable openings present");
for (const forbidden of ["Who are you?", "Tell us about yourself.", "What is your profile?", "What type of user are you?", "Please select a pathway."]) {
  ok(doc.includes(forbidden), `§5 records forbidden opening: "${forbidden}"`);
}

// Examples rule (§6), controls rule (§7), success criteria (§8).
ok(/Examples: farm · business · inherited property · financing · job loss · just exploring/.test(doc), "§6 allowed subtle examples line present");
ok(/chip wall/i.test(doc) && /category picker/i.test(doc), "§6 names the forbidden example forms");
ok(/secondary/i.test(doc) && /invitation to speak \*\*before\*\*|invitation to speak before/i.test(doc), "§7 controls-are-secondary rule present");
ok(/This feels like I can just start talking\./.test(doc), "§8 success sentence present");

// Anti-drift assertions (§9) — all six named.
for (const drift of ["identity-first", "Discovery-Promise panel", "starter-chip wall", "[Dd]uplicated", "buried", "qualification"]) {
  ok(new RegExp(drift).test(doc), `§9 anti-drift item present: /${drift}/`);
}

// Branch review table (§10) + debug-branch note (§13).
for (const b of ["build-navigator-conversational-ux @ edddcea", "build-navigator-radical-simplification @ bc5b948", "build-navigator-foundation @ 55d36dc", "build-navigator-debug-001 @ 4c36037"]) {
  ok(doc.includes(b), `§10/§13 records branch status: ${b}`);
}
ok(/Do not merge these UX branches unless separately approved/i.test(doc), "§10 do-not-merge instruction recorded");

// ── ADVISORY: first-touch source anti-drift (non-failing unless enforced) ────
const ENFORCE = process.env.NAV_EXPERIENCE_ENFORCE_SOURCE === "1";
const note = (c: boolean, m: string) => { if (!c) (ENFORCE ? fail : warn).push(m); };
{
  const nav = fs.existsSync("src/components/navigator/FurlongNavigator.tsx")
    ? fs.readFileSync("src/components/navigator/FurlongNavigator.tsx", "utf8") : "";
  const page = fs.existsSync("src/app/(public)/discover/page.tsx")
    ? fs.readFileSync("src/app/(public)/discover/page.tsx", "utf8") : "";
  const interp = fs.existsSync("src/lib/navigator/narrativeInterpreter.ts")
    ? fs.readFileSync("src/lib/navigator/narrativeInterpreter.ts", "utf8") : "";

  note(!/who are you/i.test(interp), "opening prompt is not identity-first ('who are you')");
  note(!/doesn't sell you anything[\s\S]{0,200}possibilities[\s\S]{0,80}costs/i.test(nav), "no large Discovery-Promise panel on first touch");
  note(!/data-testid="conversation-starters"|data-testid="starter"/.test(nav), "no starter-chip wall on first touch");
  note(!/Start your journey here/.test(page) || !/<strong[^>]*>Furlong Navigator<\/strong>/.test(nav),
    "page header and widget header are not duplicated");
  note(!/\b(intake form|application form|qualification|please provide the following)\b/i.test(nav),
    "no application/intake/qualification language in the first-touch component");
}

if (warn.length) {
  console.warn(`\n⚠  verify:navigator-experience ADVISORY — ${warn.length} first-touch drift item(s) on the CURRENT (pre-doctrine) UI (not failing; doctrine-only step):`);
  for (const w of warn) console.warn("    ⚠ " + w);
  console.warn("    → a founder-approved UX branch should resolve these, then run with NAV_EXPERIENCE_ENFORCE_SOURCE=1.");
}
if (fail.length) {
  console.error(`\n✗  verify:navigator-experience FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log(`✓  verify:navigator-experience PASS — NAVIGATOR-FIRST-15-SECONDS-001 doctrine complete and locked (constitutional rule, feeling targets, forbidden-feel list, emotional/interaction/language/example/controls rules, success criteria, six anti-drift assertions, branch review table). First-touch source checks ran ADVISORY (${warn.length} drift note(s) on the current pre-doctrine UI). Felt criteria remain a human-review floor. No UI/routing/security/production change.`);
process.exit(0);
