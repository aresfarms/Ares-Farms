# DEPLOY_PREVIEW.md — locked, password-protected preview on Railway

A persistent, password-protected preview Stuart can open anytime (works when your
laptop is off). It's a **locked preview, not a launch**: whole-site password wall,
`noindex`, internal routes still behind operator login, placeholder/government data,
**Public Alpha PENDING**.

> **No secrets in this file.** Every secret below is something you generate and paste
> into Railway's env vars — never into the code or the repo.

---

## Why `railway up` (not "deploy from GitHub")

The current app lives in your **local working tree** (it is intentionally *not*
merged/pushed — Alpha PENDING). "Deploy from GitHub" builds whatever is on GitHub,
which is an old snapshot and will fail. `railway up` uploads your **local code**
directly — no commit, no push, no merge. It respects `.gitignore`, so `data/`,
`node_modules`, and `.env.local` are excluded (runtime state + secrets stay out);
`railway.json` and the app code go up.

---

## One-time setup

### 1. Install the Railway CLI
```bash
brew install railway        # or:  npm i -g @railway/cli
```

### 2. Authenticate with your token
Railway → avatar → **Account Settings → Tokens → Create Token**. Then:
```bash
export RAILWAY_TOKEN=<paste your token here>     # do NOT commit this
```

### 3. Create the project + link it
In the Railway dashboard: **New Project** (empty). Then locally:
```bash
cd ~/ares-farms
railway link                 # select the project you just made
```

### 4. In the dashboard, add the two pieces of persistence
- **Postgres** — “+ New → Database → Postgres” (one click). Used only for the
  operator `users` table.
- **Volume** — on the app service: “+ Volume”, **mount path `/app/data`**. This is
  what persists the six file stores (audit ledger, anonymous tokens, source
  approvals, refresh state, live overlay). No DB migration needed for those.

### 5. Set env vars (app service → Variables)
Generate secrets locally and paste the values in. **Names only here:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | reference the Postgres: `${{Postgres.DATABASE_URL}}` |
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://<your-railway-domain>` (fill after step 7) |
| `NEXTAUTH_SECRET` | generate: `openssl rand -base64 32` |
| `AUTH_CREDENTIALS_MODE` | `email-allowlist` |
| `AUTH_CREDENTIAL_EMAIL_ALLOWLIST` | `chudson@aresfarmsinc.com,sfraas@aresfarmsinc.com,frances@aresfarmsinc.com` |
| `AUTH_CREDENTIAL_SHARED_SECRET` | generate: `openssl rand -base64 24` — this is the **operator login password** |
| `API_AUTH_ENFORCEMENT` | `required` |
| `RATE_LIMITING_ENABLED` | `true` |
| `API_RATE_LIMIT_WINDOW_SECONDS` | `60` |
| `API_RATE_LIMIT_MAX` | `120` |
| `ROLE_PROVISIONING_MODE` | `governed-admin-only` |
| `PREVIEW_BASIC_AUTH_USER` | `stuart` |
| `PREVIEW_BASIC_AUTH_PASSWORD` | generate: `openssl rand -base64 9` — the **wall password you give Stuart** |
| `PREVIEW_NOINDEX` | `1` |
| `SI_API_KEY` | only if you want live scraping in preview (optional) |

Keep a note of the two generated passwords (operator login + Stuart's wall password)
— you'll need them in steps 7–8.

---

## Deploy

### 6. Ship the local code
```bash
railway up
```
Builds with `npm install && next build`, starts `next start` (per `railway.json`).

### 7. Generate the public domain
Service → **Settings → Networking → Generate Domain**. Copy it into `NEXTAUTH_URL`
(step 5) and redeploy (`railway up` again, or “Redeploy” in the dashboard).

### 8. One-time: migrate + seed the data (on the service shell)
Open the service shell in the dashboard (or `railway run bash`) and:
```bash
npm run db:migrate:governance      # creates the users table + governance spine (idempotent)
```
Then in the browser:
1. Open the preview URL → the **wall password** prompt → enter `stuart` / your
   `PREVIEW_BASIC_AUTH_PASSWORD`.
2. Log in as **chudson@aresfarmsinc.com** with the `AUTH_CREDENTIAL_SHARED_SECRET`
   as the password (this provisions your operator identity).
3. Go to **/internal/source-review** and **approve HUD + USDA** — the real Module 22/23 step.
   Listings go live on the volume. (Optional fallback if a deeper operator screen
   errors on a missing table: `npx drizzle-kit migrate`.)

---

## Send Stuart
Send privately: the **preview URL**, username **`stuart`**, and the
**`PREVIEW_BASIC_AUTH_PASSWORD`**. It works whenever — your laptop can be off.

---

## After you're done
- **Rotate the Railway token** you generated (Account Settings → Tokens → delete +
  regenerate). It was used in the CLI; treat any token that's been pasted around as
  spent.

---

## What's enforced (sanity check)
- **Whole preview password-walled** — `proxy.ts` `previewGate()` returns `401` to
  anyone without `PREVIEW_BASIC_AUTH_*`. Layered *above* the operator gate.
- **Internal routes still require login** — `/governance`, `/operator-queue`,
  `/portal/*`, `/internal/source-review`, `/api/*` stay auth-gated even after the wall.
- **noindex** — 401s carry `X-Robots-Tag: noindex`; `robots.ts` is disallow-all when
  `PREVIEW_NOINDEX=1`.
- **Not a launch** — placeholder/government data, Public Alpha PENDING, nothing
  merged to `main`.
