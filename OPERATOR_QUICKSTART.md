# Operator Quickstart — run the loop yourself

You don't need to learn UX development. You need four small skills and one loop. An afternoon, and you're in control of the execution instead of the bot.

## Set up once
1. **Install a code editor** — VS Code (free) or Cursor. Open the `ares-farms` folder in it (File → Open Folder).
2. **Open the built-in terminal** in the editor (View → Terminal). Everything below is typed there.
3. **Add the two scripts** to the repo (drop the files in, then add the npm lines to `package.json`):
   - `scripts/verifyPublicCopy.mjs` → `"verify:public-copy": "node scripts/verifyPublicCopy.mjs"`
   - `scripts/verifyPublic.mjs` → `"verify:public": "node scripts/verifyPublic.mjs"`

## The four commands you'll use
- `npm run dev` — starts the site at http://localhost:3000 so you can look at it. Leave it running in one terminal tab.
- `npm run verify:public` — the single check. Green = done, red = tells you exactly what's wrong. (Run in a second tab.)
- `FAST=1 npm run verify:public` — same check minus the slow build, for quick edits.
- Git: `git add -A` then `git commit -m "..."` then `git push` — saves your work. (Or use the editor's Source Control panel and click the buttons.)

## The loop (this is the whole job)
1. **Make one change.** Either paste my exact code/copy into the exact file, or tell the bot one bounded task.
2. **Look at it** — refresh http://localhost:3000.
3. **Check it** — `npm run verify:public`. Red? It lists what's wrong — fix that one thing, repeat. Green?
4. **Commit** — `git add -A && git commit -m "what you did"`.
5. Next change. One at a time. Never move on with a red gate.

## How to make the bot obey
Phrase every request the same way:
> "Do [one specific thing]. Use the exact content from [file] verbatim — do not paraphrase. Then run `npm run verify:public` and paste the full output. Do not relax or edit any check to make it pass."

Then **you** run `npm run verify:public` and look at the page. The bot doesn't decide it's done — green gate + the page matching the Definition of Done decides.

## Doing the UI parts yourself (skipping the bot)
For the small public-UI fixes the bot keeps botching, you don't need the bot at all:
1. In the editor, open the file (e.g. `src/app/(public)/accessibility/page.tsx`).
2. Select all, delete, paste my verbatim copy/code for that file.
3. Save (Cmd+S). The dev server auto-reloads — look at localhost.
4. `npm run verify:public`. Green → commit.
That's it. Editing a file is: open, paste, save. You already do harder things than that every day.

## If you get stuck
Paste me the red gate output or a screenshot. Red output names the exact failing check and usually the exact string or file. I'll tell you the one line to change. We finish this the same way we got here — one verified step at a time.
