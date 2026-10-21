# ADR 0002 — Owner admin: auth and media storage

- Status: Accepted
- Date: 2026-10-20

## Context

The company owner must add, edit, reorder and delete gallery media (carousel
photos, cleaning examples, before/after pairs) without a developer, at zero
monthly cost. There is exactly one editor.

## Decision

- **Login:** Google sign-in (OAuth code flow + PKCE via `arctic`) for an email
  allowlist (`ADMIN_EMAILS`). Session is a stateless HMAC-SHA256-signed,
  httpOnly, `SameSite=Lax` cookie (7 days) — no user table or session store.
  Every admin page and API checks the session server-side (`requireAdmin`), not
  only in the proxy.
- **Admin UI:** Spanish-only `/admin`, outside the EN/ES locale routes, built on
  the private `@vodkadav/ui` package (fetched in CI and on Vercel with a
  read-only token scoped to that repo).
- **Media storage (#6):** Cloudflare R2 (free tier, no egress fees) plus one
  JSON manifest in the same bucket for captions (Spanish, optional English) and
  order. Uploads go browser → R2 via short-lived presigned URLs (Vercel
  functions cap request bodies at ~4.5 MB). Caps: video 50 MB, image 10 MB.
  Each save keeps the previous manifest version for rollback.
- **Never pay for R2 (owner requirement).** Cloudflare has no spending cap, so:
  admin uploads enforce a 5 GB total budget plus per-file and daily caps; media
  is content-hashed and cached forever, videos don't preload, and the manifest
  is read per build, not per visitor; a Cloudflare Worker running every 10 min
  (`watchdog/`, #12) sums month-to-date usage across the account, opens a
  GitHub issue at 50% of any free limit and switches off the bucket's public
  r2.dev URL at 90%.
- **Hosting stays on Vercel Hobby** by the owner's choice.

## Consequences

- No passwords stored; Google handles 2FA. Rotating `AUTH_SECRET` signs out.
- Vercel Hobby is for non-commercial use; this is a company site, so it runs
  outside those terms. Upgrade path: Vercel Pro, or Cloudflare via OpenNext.
- No server-side video transcoding: the owner must keep clips under the cap.
- When the watchdog trips, gallery media stops loading until the 1st of the
  next month or a manual `wrangler r2 bucket dev-url enable`. Analytics lag a
  few minutes and checks run every 10 min, so the stop lands a little past 90%.
- A lockfile written on Windows misses Linux-only optional peers; regenerate it
  under Linux/WSL after dependency changes.
