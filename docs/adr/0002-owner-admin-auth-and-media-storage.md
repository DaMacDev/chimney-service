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
- **Hosting stays on Vercel Hobby** by the owner's choice.

## Consequences

- No passwords stored; Google handles 2FA. Rotating `AUTH_SECRET` signs out.
- Vercel Hobby is for non-commercial use; this is a company site, so it runs
  outside those terms. Upgrade path: Vercel Pro, or Cloudflare via OpenNext.
- No server-side video transcoding: the owner must keep clips under the cap.
- A lockfile written on Windows misses Linux-only optional peers; regenerate it
  under Linux/WSL after dependency changes.
