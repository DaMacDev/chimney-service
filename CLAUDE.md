# Nuevo Amanecer — project notes

Premium bilingual (EN/ES) marketing site for Desarrolladora Nuevo Amanecer del
Sureste S.A. de C.V., an industrial duct/HVAC ventilation cleaning and preventive
maintenance company serving Cancún and Mérida. Reframed from an original
"Riviera Hearth" hotel-chimney template — see `PROGRESS.md`. Next.js 16
(App Router) + next-intl + Tailwind v4 + Vitest + Playwright. Deploys to Vercel.

Rules profile: rigor — exempt: i18n-no-hardcoded-strings (EN/ES market — locale
parity is EN+ES here, enforced by `messages/messages.test.ts`, not the historical
EN+ES+DA set)

## Conventions

- **All user-facing copy** lives in `messages/en.json` + `messages/es.json`. Keys
  must stay in parity (enforced by `messages/messages.test.ts`). No hardcoded
  strings in components. Exception: the Spanish-only owner tool under `/admin`
  keeps its copy in `lib/admin/copy.ts` and its controls on `@vodkadav/ui`
  (ADR 0002).
- **Lockfile:** regenerate `package-lock.json` under Linux/WSL after dependency
  changes; npm on Windows drops Linux-only optional peers and CI's `npm ci` fails.
- **Brand & contact** in `data/site.ts`; **content structure** (services,
  features, stats, gallery, videos, testimonials) in the other `data/*.ts`.
- **TDD** for interactive components (carousel, contact form, YouTube facade,
  language switcher) — Vitest + Testing Library.
- Design tokens are CSS variables in `app/globals.css`; UI primitives in
  `components/ui` consume them, so a palette change is one place.
- Run `npm run lint && npm run typecheck && npm test && npm run build` before
  committing — this is the CI gate.
