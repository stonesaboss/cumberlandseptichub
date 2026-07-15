# Cumberland Septic Hub

A production-quality local-SEO lead-generation website for septic pumping, repair and
installation requests across **Cookeville, Crossville and the Upper Cumberland region of
Tennessee**.

Cumberland Septic Hub is an **independent referral service** — it connects property-owner
requests with independent local septic providers. It is not a septic contractor, and the
website's copy, structured data and disclosures are written to keep that accurate. Keep it
that way when editing.

## Technology stack

- [Astro](https://astro.build) 5 + TypeScript — fully static SEO pages built at deploy time
- Plain scoped CSS (no framework) with a small global design system
- Cloudflare Pages (Git integration) for hosting
- Cloudflare Pages Functions — `functions/api/lead.ts` handles form submissions server-side
- Cloudflare Turnstile for spam protection
- Optional: Cloudflare D1 (lead storage) and R2 (private photo uploads)

## Local development

```bash
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the built site locally
npm run check      # astro check (types + templates); typecheck/lint are aliases
npm run format     # prettier
```

The Astro dev server serves pages but **not** the Pages Function. To exercise the real
`/api/lead` endpoint locally:

```bash
npm run build
npx wrangler pages dev dist
```

Copy `.dev.vars.example` to `.dev.vars` first (gitignored). With `DEV_MODE=true`, delivery
is skipped, leads are logged locally and tagged `test_submission: true`, and any uploads go
under a `test/` prefix — safe development behavior that never notifies a real contractor.
Preview branches (any non-`main` `CF_PAGES_BRANCH`) get the same dev-mode handling
automatically. With no `TURNSTILE_SECRET_KEY` set, the function skips Turnstile
verification (locally only — always set it in production).

## Deployment — Cloudflare Pages

Connect the GitHub repository `stonesaboss/cumberlandseptichub` in the Cloudflare dashboard
(Workers & Pages → Create → Pages → Connect to Git):

| Setting                | Value           |
| ---------------------- | --------------- |
| Production branch      | `main`          |
| Framework preset       | Astro           |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Root directory         | `/`             |

Every push to `main` creates a production deployment; pull requests create preview
deployments. Do **not** configure GitHub Pages, create a `gh-pages` branch, or commit `dist/`.

### Environment variables

Set these in Cloudflare Pages → Settings → Environment variables. `.env.example` lists all
names. **Secrets** (encrypt in the dashboard; locally keep them in `.dev.vars`, never in git):
`TURNSTILE_SECRET_KEY`, `LEAD_WEBHOOK_SECRET`, `EMAIL_API_KEY`.

| Variable                    | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `PUBLIC_SITE_URL`           | Canonical production URL, e.g. `https://cumberlandseptichub.com`. Drives canonicals, sitemap, OG and structured-data URLs. Build-time. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key (public). Build-time — widget renders only when set. |
| `TURNSTILE_SECRET_KEY`      | Turnstile secret (server-side verification). **Secret.**       |
| `LEAD_WEBHOOK_URL`          | Webhook that receives lead JSON (Zapier/Make/custom).          |
| `LEAD_WEBHOOK_SECRET`       | Sent as `X-Webhook-Secret` header. **Secret.**                 |
| `FORM_RECIPIENT_EMAIL`      | Email recipient for leads (used with `EMAIL_API_KEY`).         |
| `EMAIL_API_KEY`             | Transactional email API key (Resend-compatible). **Secret.**   |
| `PUBLIC_ANALYTICS_ID`       | GA4 measurement ID. Analytics load only when set. Build-time.  |
| `TAG_MANAGER_ID`            | Reserved for GTM if adopted later.                             |
| `DEV_MODE`                  | `true` in `.dev.vars` for safe local testing (delivery skipped, leads tagged `test_submission`). |

`wrangler.jsonc` documents the Functions-runtime vars and carries the R2 binding
`LEAD_UPLOADS` → bucket `cumberlandseptichub-lead-photos` (create it once with
`npx wrangler r2 bucket create cumberlandseptichub-lead-photos`). The production Turnstile
site key (browser-safe by design) is committed as the widget's built-in fallback, so it
renders without any build var; override with `PUBLIC_TURNSTILE_SITE_KEY` (e.g. Cloudflare's
test key `1x00000000000000000000AA` in a local `.env`). The matching `TURNSTILE_SECRET_KEY`
secret must be set in the Pages dashboard before launch.

Build-time variables (`PUBLIC_*`, `ANALYTICS_ID`) require a redeploy to take effect.

### Turnstile setup

1. Cloudflare dashboard → Turnstile → Add site → add the production domain (and
   `localhost` for development, or use Cloudflare's documented test keys).
2. Set `PUBLIC_TURNSTILE_SITE_KEY` (Pages env var, production + preview) and
   `TURNSTILE_SECRET_KEY` (encrypted).
3. Redeploy. The widget appears above the submit button; the function rejects submissions
   whose token fails server-side verification and the form shows an accessible error and
   resets the widget.

Production must always have `TURNSTILE_SECRET_KEY` set — without it verification is skipped.

### Form delivery

`functions/api/lead.ts` validates every field server-side, verifies Turnstile, generates a
reference (`CSH-XXXXXX`), then delivers to any configured channel: webhook
(`LEAD_WEBHOOK_URL`), email (`FORM_RECIPIENT_EMAIL` + `EMAIL_API_KEY`), and/or D1. If
delivery is configured and **all** channels fail, the user gets an error (with the phone
CTA) rather than a false success — leads are never silently dropped.

**Testing the form:** run `npx wrangler pages dev dist`, submit the form, and check the
console for the `[dev] lead received` line, or point `LEAD_WEBHOOK_URL` in `.dev.vars` at a
request-bin URL.

### Optional D1 lead storage

```bash
npx wrangler d1 create cumberland-septic-leads
npx wrangler d1 migrations apply cumberland-septic-leads --remote
```

Uncomment the `d1_databases` block in `wrangler.jsonc`, paste the database id, and add the
same binding (`LEADS_DB`) in Pages → Settings → Functions → D1 bindings. To disable D1,
remove the binding — webhook/email delivery works independently.

Delete a lead: `npx wrangler d1 execute cumberland-septic-leads --remote --command "DELETE FROM leads WHERE id='CSH-XXXXXX'"`.
Retention: schedule a periodic `DELETE FROM leads WHERE created_at < ...` (Worker cron or
manual) to match your retention policy; store no more personal data than needed.

### Optional R2 photo uploads

```bash
npx wrangler r2 bucket create cumberland-septic-lead-uploads
```

Add the `LEAD_UPLOADS` binding (wrangler.jsonc + Pages dashboard). The bucket must stay
**private** — the function stores randomized object keys only, validates MIME type and
extension (JPG/PNG/HEIC), limits 4 files / 10 MB each / 25 MB combined, and rejects
SVG/HTML/scripts/archives. Never store uploads in git or `dist/`. Configure lifecycle rules
on the bucket for retention.

### Custom domain

1. Pages project → Custom domains → add the production domain.
2. Choose ONE canonical hostname (apex or www) and permanently redirect the other
   (Cloudflare redirect rule / Bulk Redirects).
3. Set `PUBLIC_SITE_URL` to the canonical URL and redeploy.

Never hard-code the `*.pages.dev` URL into metadata — everything derives from
`PUBLIC_SITE_URL`.

### Preview deployment protection

Preview builds (any non-`main` branch) automatically emit
`<meta name="robots" content="noindex, nofollow">` via the `CF_PAGES_BRANCH` check in
`src/layouts/Base.astro`, and canonicals always point at `PUBLIC_SITE_URL`. Do not submit
preview sitemaps to search engines.

## Content maintenance

### Replacing the placeholder phone number

`(931) 555-0123` is a **placeholder**. Before launch, edit `PHONE_DISPLAY` and `PHONE_TEL`
in [`src/data/site.ts`](src/data/site.ts) — every header, footer, CTA and sticky-bar
reference derives from those two constants.

### Updating the logo

Replace `public/logos/cumberland-septic-hub-emblem.png` (square, 1024×1024 recommended)
and regenerate sizes:

```bash
node -e "const s=require('sharp');const src='public/logos/cumberland-septic-hub-emblem.png';[[120,'public/logos/emblem-120.png'],[240,'public/logos/emblem-240.png'],[512,'public/logos/emblem-512.png'],[180,'public/icons/apple-touch-icon.png'],[48,'public/favicon.png'],[32,'public/icons/favicon-32.png']].forEach(([w,p])=>s(src).resize(w,w).png().toFile(p))"
```

The brand name renders as HTML text beside the emblem (see `Header.astro`) — do not bake
website text into the logo image.

### Editing services / navigation

Service and area dropdowns live in `src/data/site.ts` (`SERVICES_DROPDOWN`,
`AREAS_DROPDOWN`). Form options (`SERVICE_NEEDED_OPTIONS`, etc.) live in the same file and
are shared by the form UI and, by name, the API validation.

### Adding a location page properly

Do **not** copy an existing city page and swap names — thin doorway pages are a liability.
A new location page needs: unique title/description/H1, an original local introduction,
distinct property/service context for that county, unique FAQs, related-service links and
the request form. Use `src/pages/septic-services-sparta-tn.astro` as the structural
reference, then write genuinely local copy. Add the page to `AREAS_DROPDOWN` and the
service-area page.

### Metadata and sitemap

Each page passes `title` and `description` to its layout — keep them unique per page.
The sitemap is generated by `@astrojs/sitemap` at build (`sitemap-index.xml`), excluding
`/thank-you/`. Noindex pages: thank-you and 404 (via the `noindex` prop).

### Referral disclosure requirements

The footer disclosure, the near-form disclosure and `/referral-disclosure/` are load-bearing
compliance copy. Do not remove, shrink or bury them. Never add unverified claims: licensing,
insurance, ratings, reviews, 24/7 availability, response-time or pricing guarantees, office
addresses, or LocalBusiness/AggregateRating structured data.

## Quality checks

- `npm run check` must pass and `npm run build` must complete with zero errors before merging.
- Accessibility: keyboard-walk the nav dropdowns, FAQ accordions and the form; confirm focus
  visibility and that form errors are announced (checked via `role="status"`).
- SEO: after content changes, spot-check `dist/` output for one `<h1>` per page, unique
  titles/descriptions, correct canonicals and valid JSON-LD (e.g. Google Rich Results test).
- Lighthouse (mobile) on `/` and one service page after significant changes.

## Repository layout

```
public/            static assets (_headers, _redirects, robots.txt, images, logos, icons)
src/components/    Header, Footer, LeadForm, FaqAccordion, Breadcrumbs, CtaBand, sticky bar
src/layouts/       Base.astro (head/meta/schema), ServicePage.astro (service-page shell)
src/data/site.ts   brand, phone, nav, form options, disclosures
src/pages/         one .astro file per route
functions/api/     lead.ts — POST /api/lead Pages Function
migrations/        0001_create_leads.sql (optional D1)
```
