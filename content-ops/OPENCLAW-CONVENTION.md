# Article + Image Convention (OpenClaw-compatible)

How every knowledge-catalog article is created so it (a) matches the existing Astro site and editorial rules, and (b) is discovered automatically by your `placeholder-image-replacement` (OpenClaw) skill — which finds image work by **scanning the repo and auditing the rendered site**, not by reading a custom marker or manifest.

This is the pattern. Once you approve it, I apply it to every article as **new files + small registration edits**, keeping images as empty placeholder slots, and **not pushing live until you explicitly authorize** — matching your Article Creation Process.

---

## 1. How images are set up so OpenClaw finds them

Each in-article image uses your existing `ResourceImageSlot` component with an **empty field** and the same "intended asset" comment your `ResourcePage.astro` already uses:

```astro
{/* Intended asset: /images/resources/how-often-to-pump-septic-tank-hero.webp — see public/images/resources/README.md */}
<ResourceImageSlot
  src={null}
  alt="Cutaway illustration of a residential septic tank showing the settled sludge, liquid and scum layers"
  width={1600}
  height={900}
/>
```

Why this is discovered by OpenClaw's repo scan:

- **Empty image field on a known component** (`src={null}` on `ResourceImageSlot`) — matches its "missing/empty image field" and "missing visual slot supported by an existing component/template" signals.
- **Renders your styled placeholder, never a broken image** — same behavior as your hub heroes today.
- **Rich `alt` text** gives OpenClaw the subject context for generation.
- **Intended filename** is documented in `public/images/resources/README.md` (the file it treats as the resources image index).

No `@openclaw` marker and no per-article JSON manifest — those would be an unsupported contract unless you deliberately extend the skill. Everything rides on your native pattern.

> Because guide pages currently have no images, they read as "text-only cards/pages" — another thing OpenClaw flags. Adding these justified slots proactively gives it the exact slots to fill instead of guessing.

## 2. Context for generation lives in the image README

Every new image gets a row appended to `public/images/resources/README.md` (your existing "Resources Image Manifest") — **Filename · Page · Subject · Alt text** — plus a short **Generation brief** (subject, style, negatives, mobile-crop note) beneath the table. That keeps all image context in the one file OpenClaw scans and humans already use. Image content rules stay as your README already states them: no fake branding, no staged emergencies, no graphic sewage, no stock-as-local, no fabricated before/after (plus: no baked-in text/watermarks, no identifiable faces).

**Format rules (yours):** WebP, 16:9, source 1600×900, under ~300 KB, filed in `public/images/resources/`. Filename = `<article-slug>-<role>.webp`.

## 3. Filenames avoid OpenClaw's "temp" heuristics

OpenClaw flags filenames containing `placeholder`, `temp`, `sample`, `mockup`, `default`, or `generic`. Intended filenames use the real SEO name from day one (`how-often-to-pump-septic-tank-hero.webp`) so the slot is detected by the *empty field*, not by a throwaway filename — and the final asset needs no rename.

## 4. Editorial + safety rules baked into every article

- **No hard dollar figures** — factors-based, provider-determined pricing (matches your cost hub).
- **Author** = "Cumberland Septic Hub Editorial Team"; `reviewedBy` left empty unless a real qualified reviewer actually reviewed it.
- **Referral wording + disclosure**; content framed as general information deferring to on-site evaluation and the appropriate authority.
- **Cautious language** ("may / can / generally"), no diagnoses.
- **Internal links** to the relevant service page(s), the cluster hub, and the request form.
- **FAQs** as a `faqs` array so `FaqAccordion withSchema` emits FAQPage structured data automatically (no pasted JSON-LD).
- **Provisional → published:** the article's `plannedGuides` entry is replaced with a `publishedGuides` record (real `href`), per your `resources.ts` rules.

## 5. Editorial tracker (your process, not OpenClaw)

`content-ops/editorial-tracker.json` (kept **outside** OpenClaw's scanned paths so it doesn't get audited as a page): one row per article — topic, cluster, status, article location, intended image filenames, image status, published flag. This satisfies your process doc's "update the editorial tracker" step without introducing a JSON that the image scan would misread.

## 6. Publish flow (respects "no publish without authorization")

1. I create the article + slots + registration edits and the README rows/briefs — **new/edited files, no push**.
2. Images render as placeholders; OpenClaw status stays "not started" in the tracker.
3. You run OpenClaw; it scans, generates the WebP files into `public/images/resources/`, and the slots fill (set `src`, done).
4. When *you* say go, the commit is pushed → Cloudflare auto-deploys live.
