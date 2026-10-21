# Progress — Nuevo Amanecer (Industrial Maintenance)

Bilingual (EN/ES) marketing site for **Desarrolladora Nuevo Amanecer del Sureste
S.A. de C.V.** — industrial duct / HVAC ventilation cleaning + preventive technical
maintenance for hotels, hospitals, universities, malls and restaurants in Cancún &
Mérida. Next.js 16 + next-intl + Tailwind v4, deployed on Vercel.

> Built on the `chimney-service` repo (originally a placeholder "Riviera Hearth"
> hotel-chimney template). Reframe source of truth: `docs/reference-existing-site.md`
> (pulled from the client's live site nuevoamanecer.company).

## Status

- [x] Project scaffold (Next.js 16, Tailwind v4, Vitest, Playwright)
- [x] EN/ES i18n (locale routing, language switcher, parity-tested catalogs)
- [x] Design system + UI primitives (industrial steel-blue / cyan palette)
- [x] Pages: Home, Services, Gallery, Documented work, About, Contact
- [x] Gallery carousel + contact form (Web3Forms + mailto fallback) — TDD
- [x] SEO (per-locale metadata, hreflang, OG image, sitemap, robots)
- [x] **Reframed to real client Nuevo Amanecer** — brand, real bilingual copy
      (4 services, process, about, SEO) from their live site
- [x] **New sections:** Sectores atendidos (5) + Equipamiento (6)
- [x] **Real client photos** wired into gallery / documented-work / about; hero uses
      matching industrial stock; placeholder testimonials removed (no real ones yet)
- [x] **Real contacts:** business line (dnasolution66@gmail.com / +52 998 154 0967) + Director (Lázaro Rondón) + Comercial (Marcos Machado)
- [x] CI gate (lint → typecheck → test → build) green; 39 tests passing
- [x] AI imagery — no-face thematic SDXL originals generated + wired: twilight rooftop
      AHUs as the **hero**, gleaming spiral ductwork as the **CTA-band** background
      (kitchen hood / blower / golden-hour rooftop / clean-duct kept as spares).
      Recorded in `CREDITS.md`. Gallery/before-after deliberately stay real photos only.
  - The client's exact "real crew in AI scenes" ask is **not possible locally** — SDXL
    is text-to-image only (no faithful face-swap/LoRA pipeline); real crew photos cover it
- [x] Committed (`147a6b6`) + pushed to `main`; Vercel auto-deployed — **build green**
- [x] **Live & public** at **https://chimney-service-cancun.vercel.app/en** (HTTP 200,
      Deployment Protection off — verified). NB: the bare `chimney-service.vercel.app`
      is a **different, unrelated** project ("#1 Kitchen Chimney Service"), not ours.
- [x] Canonical/OG/sitemap URL fixed in code — `data/site.ts` `url` now points to
      `chimney-service-cancun.vercel.app` (was the wrong bare domain). Takes effect on
      next deploy. Optionally also set `NEXT_PUBLIC_SITE_URL` in Vercel (overrides it).
- [x] **Web3Forms live:** `NEXT_PUBLIC_WEB3FORMS_KEY` set in Vercel + redeployed; key is
      baked into the live bundle (verified 2026-06-23), so the contact form now submits
      directly instead of falling back to `mailto:`. (Confirm the recipient inbox is set in
      the Web3Forms dashboard — Linked Emails / form Settings — to receive leads.)
- [x] **Deployed:** stats paint-order fix + new AI hero/CTA imagery + URL fix pushed
      (`2889c9c` on `origin/main`) and live (HTTP 200, verified 2026-06-23).
- [x] **Navbar readability:** desktop links grouped into a frosted pill (matches the
      language-switcher pill), higher-contrast text + accent hover, solid accent chip for
      the active page; mobile menu links moved off the washed-out muted gray.
- [x] **SEO URL hardening:** the live site was emitting doubled `/en/en` canonicals +
      sitemap URLs and a wrong `/en/sitemap.xml` robots pointer, because the Vercel
      `NEXT_PUBLIC_SITE_URL` env var carried a stray `/en` (copied from the address bar).
      Centralised the URL into `lib/site-url.ts` (`siteOrigin`), normalised to a bare
      origin so any stray path is stripped; layout/sitemap/robots all consume it.
      Verified: a build with the bad env value now emits correct single-locale URLs.
      Optional cleanup: also delete/fix the Vercel env var (code default is already correct).
- [x] **Gallery Before/After video section:** self-hosted, trimmed MP4s in
      `/public/videos`, native HTML5 player (poster + click-to-play, muted) with
      1×/2×/3×/4× playback-speed buttons (`SpeedVideo` client component);
      `BeforeAfterVideo` section + `cleaningVideo` in `data/gallery.ts`, EN/ES copy
      under `VideoDemo`, `*.mp4` marked binary. Set `afterSrc: null` to revert the
      after cell to a placeholder.
- [x] **Borescope footage swap (2026-08-23):** replaced both clips with the client's
      duct-camera recordings (`recordingCleaning/before.mp4` 0:57–4:57,
      `after.mp4` 0:00–4:00). Each is cropped to strip the camera's burned-in
      timestamp (`crop=1671:940:124:140`, kept 16:9), encoded at 3× real time
      (`setpts=PTS/3,fps=30`) to 720p with `hqdn3d` denoise — 80s and 8.9/5.6 MB,
      down from ~82 MB/clip at 1×. Speed buttons multiply that 3× again; the
      acceleration is disclosed in the `VideoDemo.speedNote` copy.
      Rebuild (identical settings for both clips, so encoding never flatters the
      "after"): `ffmpeg -i <src> -an -vf "crop=1671:940:124:140,setpts=PTS/3,fps=30,scale=1280:720,hqdn3d=4:4:8:8" -c:v libx264 -crf 31 -maxrate 1400k -bufsize 2000k -preset slow -pix_fmt yuv420p -movflags +faststart <out>`
- [x] **4× playback stalled on the before clip (2026-08-23):** at CRF 27 that clip
      averaged ~2.0 Mbps, so 4× demanded ~8 Mbps sustained; with `preload="metadata"`
      it never buffered far enough ahead and looped `waiting`/`playing`, advancing at
      ~1.35× and looking like the speed toggle was stuck. Fixed by the `-crf 31
    -maxrate 1400k` re-encode above (887 kbps → whole clip buffers immediately).
      `SpeedVideo` also listens for `ratechange` now, so the browser's own speed menu
      can't leave the buttons showing a rate the video isn't playing at.
- [x] **Owner media manager, part 1 (2026-10-21, ADR 0002):** owner Google sign-in
      at `/admin` (allowlist `ADMIN_EMAILS`); gallery media + captions moved to the
      Cloudflare R2 bucket `nuevo-amanecer-media` with a `manifest.json`
      (`lib/media/`). The bundled gallery files above now live only in R2.
- [x] **Owner media manager, part 2 (2026-10-21):** R2 free-tier watchdog Worker
      (`watchdog/`, alerts 50%, public access off at 90%); `/admin` uploads, edits,
      reorders and deletes carousel photos, cleaning examples and before/after pairs
      (presigned uploads locked to size + SHA-256, 5 GB / 100-a-day caps with a
      reservation ledger); gallery steps through several pairs one at a time.
- [ ] Site-review improvement pass (2026-07-11) — 2 hero-contrast fixes + JSON-LD,
      WhatsApp float, CTA phone, skip link, form privacy note. Sonnet-ready plan:
      `docs/IMPROVEMENT-PLAN.md`
- [ ] Pending real details from the client: exact street addresses, office hours,
      consented testimonials, social links, logo/brand mark
- [ ] Optional: attach paid custom domain

## Resuming on another machine

Everything below is in git — clone and you're caught up. Requires Node 22+.

```bash
git clone https://github.com/Vodkadav/chimney-service.git
cd chimney-service
npm install
cp .env.example .env.local      # optional; fill in for the live contact form
npm run dev                     # http://localhost:3000 (redirects to /en)
```

Verify the gate any time: `npm run lint && npm run typecheck && npm test && npm run build`.

## Deploy state & manual steps

**Live & public:** https://chimney-service-cancun.vercel.app/en (HTTP 200, verified
2026-06-22). Auto-deploys on push to `main`. ⚠️ The bare `chimney-service.vercel.app`
is a **different, unrelated** project — never use it; ours is the `-cancun` host.

### Next session — start here (resume guide)

Everything code-side is done and deployed. Remaining work is all in the **Vercel /
Web3Forms dashboards** (no code needed):

1. **Web3Forms — finish the live contact form.** A key already exists (form
   `chimneycontactform`, key `b0b81ae9-b462-4e36-8f83-0c4c78e7e230` — public by design,
   safe to commit). It's in local `.env.local` already. To go live:
   - Vercel → Project → **Settings → Environment Variables** → add
     `NEXT_PUBLIC_WEB3FORMS_KEY = b0b81ae9-b462-4e36-8f83-0c4c78e7e230` (Production), then
     **redeploy** (NEXT_PUBLIC vars are build-time — a redeploy is required to bake it in).
   - In the **Web3Forms dashboard** set the **recipient inbox** (Linked Emails / form
     Settings) to the address that should receive leads (e.g. `dnasolution66@gmail.com`).
   - Free plan = **one** recipient. A 2nd inbox needs the Pro plan (`ccemail`, `;`-sep) —
     or just add a Gmail auto-forward. Until the key is live, the form falls back to
     `mailto:`, so the site still works.
2. _(Optional)_ `NEXT_PUBLIC_SITE_URL` — not required anymore (code fallback is now the
   correct `-cancun` URL). Only set it if/when a **custom domain** is attached.
3. _(Optional, later)_ attach a paid custom domain in Vercel → **Settings → Domains**,
   then set `NEXT_PUBLIC_SITE_URL` to it and redeploy.
4. **Pending real content from the client** (no blocker to being live): exact street
   addresses, office hours, consented testimonials, social links, logo/brand mark —
   collect via `docs/Formulario-de-Contenido.docx`; structure in `docs/reference-existing-site.md`.

Verify live any time: `curl -s -o /dev/null -w "%{http_code}" https://chimney-service-cancun.vercel.app/en` (expect 200).

## Notes

- Created 2026-06-21; reframed to Nuevo Amanecer the same day.
- Gallery media (carousel, cleaning examples, before/after) lives in R2 and is
  owner-managed; other real client photos live in `public/photos/` (work/about);
  the hero + CTA band use locally-generated no-face AI imagery (`gen-*.png`, see
  `CREDITS.md`). Content is wired from `data/*.ts` + `messages/{en,es}.json`.
- The Spanish client intake form (`docs/Formulario-de-Contenido.docx`) can still be
  used to collect the remaining real details (addresses, hours, testimonials, logo).
