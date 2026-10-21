# Deployment Guide

The site is a standard Next.js 16 app. It deploys to **Vercel** on the free tier,
with a custom domain attachable later. Two short manual steps are required — both
described below with exact links.

---

## 1. Web3Forms key (live contact form) — ~2 min

The contact form posts to [Web3Forms](https://web3forms.com); no backend needed.
The access key is **public by design** (it lives in the page's form markup), so
it is safe to store as a public env var.

1. Open **https://web3forms.com**.
2. In the **"Create your Access Key"** box, enter the email address where you
   want contact submissions delivered, then click **Create Access Key**.
3. Open that inbox and click the verification link Web3Forms sends. The email
   contains your **Access Key** (a UUID like `a1b2c3d4-…`).
4. You'll add this key as `NEXT_PUBLIC_WEB3FORMS_KEY` in step 2 below.

> Until the key is set, the contact form still works — it falls back to opening a
> pre-filled `mailto:` link to the address in `data/site.ts`.

---

## 2. Deploy to Vercel — ~5 min

1. Go to **https://vercel.com/new** and sign in with GitHub.
2. **Import** the `Vodkadav/chimney-service` repository. Vercel auto-detects
   Next.js — no build settings to change.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL` → optional; the code fallback in `data/site.ts` is
     already the correct live URL (`https://chimney-service-cancun.vercel.app`).
     Only set this once a custom domain is attached, then point it there.
   - `NEXT_PUBLIC_WEB3FORMS_KEY` → the key from step 1.
4. Click **Deploy**. Every push to `main` then auto-deploys; pull requests get
   preview URLs.

CI (lint → typecheck → test → build) runs in GitHub Actions on every push and
gates merges; Vercel handles the actual deploy via its Git integration.

---

## 2b. Owner admin (`/admin`) — ~15 min, once

See ADR 0002. All values are secrets: set them in Vercel (Production + Preview)
and in a gitignored `.env.local`, never in the repo.

1. **UI package token.** GitHub → Settings → Developer settings → Fine-grained
   tokens → new token, repository access **only `DaMacDev/vodkadav-ui`**,
   permission **Contents: Read-only**. Save it as `VODKADAV_UI_TOKEN` both as a
   GitHub Actions secret on this repo and as a Vercel env var.
2. **Google OAuth client.** console.cloud.google.com → APIs & Services →
   OAuth consent screen (External, app name, your email) → Credentials →
   Create OAuth client ID → Web application. Authorized redirect URIs:
   `https://chimney-service-cancun.vercel.app/admin/auth/callback` and
   `http://localhost:3000/admin/auth/callback`. Copy the ID and secret into
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. `AUTH_SECRET` → output of `openssl rand -base64 48`.
4. `ADMIN_EMAILS` → the owner's Google address (comma-separate extras).
5. **Media bucket (Cloudflare R2).** Enable R2 on the Cloudflare account, then:
   ```powershell
   npx wrangler@4 login
   npx wrangler@4 r2 bucket create nuevo-amanecer-media
   npx wrangler@4 r2 bucket dev-url enable nuevo-amanecer-media
   ```
   CORS must allow `GET, PUT, HEAD` with header `content-type` from the live
   origin and `http://localhost:3000` (`wrangler r2 bucket cors set`). Create an
   R2 API token (Object Read & Write, this bucket only) and set
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` and
   `NEXT_PUBLIC_MEDIA_BASE_URL` (the printed `r2.dev` URL) for Production and
   Preview.
6. **R2 usage watchdog** (`watchdog/`, hourly Cloudflare Worker). Needs two
   tokens, stored only as Worker secrets:
   - Cloudflare API token with **Account Analytics: Read** and **Workers R2
     Storage: Edit** on this account.
   - GitHub fine-grained token with **Issues: Read and write** on this repo only.
   ```powershell
   cd watchdog
   npx wrangler@4 secret put CF_API_TOKEN
   npx wrangler@4 secret put GITHUB_TOKEN
   npx wrangler@4 deploy
   ```
   After a kill-switch issue, re-enable media with
   `npx wrangler@4 r2 bucket dev-url enable nuevo-amanecer-media`.
7. Redeploy. Sign in at `/admin`.

---

## 3. Attach a paid custom domain (later, optional)

1. Buy the domain from any registrar.
2. In Vercel: **Project → Settings → Domains → Add**, enter the domain.
3. Add the DNS records Vercel shows (an `A`/`CNAME` or nameserver change) at your
   registrar. Vercel provisions HTTPS automatically.
4. Update `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy so metadata,
   sitemap and OG tags use it.

---

## Local production check

```bash
npm ci
npm run build
npm run start   # serves the production build at http://localhost:3000
```
