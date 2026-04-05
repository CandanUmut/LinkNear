# Simile.ai — UI Design Principles

A distilled reference of the visual and interaction language used on [simile.ai](https://simile.ai/), derived from the live site's markup, CSS tokens, font stack, and content structure. Use this as a north star when you want the same "research-lab-as-editorial" gravitas.

---

## 1. Aesthetic in one sentence

> **A research paper rendered by a scientific instrument** — warm paper tones and a classical serif carry the gravitas, while a family of pixel display fonts and a single coral accent hint at the computational machinery underneath.

It is *not* the default SaaS look (no purple gradients, no glassmorphism, no hero illustration of a dashboard). It feels closer to an academic journal, a physics lab website, and a luxury print magazine all at once.

---

## 2. Color system

Simile uses a **paper-first palette** — the background is never pure white, the text is never pure black, and there is exactly **one chromatic accent**.

### Core tokens (lifted verbatim from the site)

| Role               | Token                | Value      | Notes                                    |
|--------------------|----------------------|------------|------------------------------------------|
| Page background    | `--color-beige`      | `#f8f6f3`  | Warm off-white. The default surface.      |
| Surface raise      | `--color-light-brown`| `#f2ede8`  | For cards, quote blocks.                 |
| Divider / deeper   | `--color-beige-dark` | `#eae3dd`  | Section separators, subtle fills.        |
| Primary text       | `--color-gray`       | `#3d3733`  | Warm near-black — never `#000`.          |
| Secondary text     | `--color-brown`      | `#494440`  | Body copy, captions.                     |
| Muted text         | `--color-gray-light` | `#706a64`  | Labels, metadata.                        |
| Disabled / hairline| `--color-gray-lighter`| `#c2beba` | Borders, placeholders.                   |
| **Signature accent**| `--color-red`       | `#e66253`  | Coral/terracotta — links, highlights, CTAs. |

### Auxiliary "instrument" palette (used in the interactive hero / dark sections)

| Role                  | Value     | Notes                                         |
|-----------------------|-----------|-----------------------------------------------|
| Deep night            | `#0d0d1a` | Near-black navy for inverted surfaces.        |
| Night surface         | `#1a1a2e` | Slightly lifted dark panel.                   |
| Instrument blue (ink) | `#2f46aa` | Deep editorial blue for data ink.             |
| Instrument blue (lit) | `#4a9fff` | Bright electric blue for live/active data.    |
| Sky tint              | `#cee0f9` | Soft background tint for data panels.         |

### Principles

1. **Warm over cool, always.** Every neutral has a brown/orange undertone. Pure neutrals (`#000`, `#fff`, `#f5f5f5`) would break the feel.
2. **One accent, used sparingly.** The coral red is a spotlight, not a theme — reserve it for the most important moment per viewport (a link, a hovered word, a single mark).
3. **Two worlds.** Beige (daylight, editorial, content) and night-navy (instrumentation, data, simulation). Use the switch to signal a shift from *reading* to *watching the machine*.
4. **Never `#000` on `#fff`.** Body text is `#494440` on `#f8f6f3`. The contrast is deliberate: high enough to be accessible, low enough to feel printed.

---

## 3. Typography

Three typeface families, each with a distinct job. This tri-family split is the single most defining move of the design.

### The three families

| Family                                    | Role            | Used for                                                   |
|-------------------------------------------|-----------------|------------------------------------------------------------|
| **Archivo** (sans, neo-grotesque)         | *Voice of the product* | Nav, body copy, buttons, UI labels, most of the page.  |
| **Junicode** (medievalist serif)          | *Voice of the thesis*  | Marquee headlines, section titles, pull quotes.        |
| **Geist Pixel** (Square / Grid / Circle / Triangle / Line) | *Voice of the machine* | Hero numerals, clock face, badges, data callouts.       |

### Principles

1. **Serif says "this matters."** Junicode is reserved for the argument — the one-line thesis of a section. Never use it for UI chrome, buttons, or metadata.
2. **Pixel fonts are a *texture*, not a typeface.** Use them at one or two sizes only, always monospaced, always for numerals, timestamps, coordinates, or short codes. They create the "instrument panel" feel — overuse and it becomes a game UI.
3. **Tight tracking on display, neutral on body.** Display headlines pull in at `-0.025em` (`--tracking-tight`); small caps / labels open up to `+0.05em` (`--tracking-wider`). Body copy stays at default.
4. **Weight range stays narrow.** Only four weights exist in the system: 300, 400, 500, 600. There is no 700 or 800 — heavy weight would feel shouty against the editorial tone.
5. **Snug line-heights.** Body uses `--leading-snug: 1.375`. Tighter than standard SaaS (`1.5–1.6`) — reads like print, not like docs.

### Scale hints (from the site)

- `--text-xs`: `12px` (labels, captions)
- `--text-sm`: `14px` (metadata, secondary UI)
- `--text-lg`: `18px` (body copy baseline)
- Display sizes are set per-component, not tokenized — they're usually in the 48–120px range in the hero.

---

## 4. Layout and spacing

### Container

- `--container-max-width: 120rem` (**1920px**) — extremely wide. The design embraces big monitors instead of capping at ~1280px like most SaaS sites.
- `--spacing-container-margin: 2rem` (32px gutter).
- Base spacing unit: `--spacing: .25rem` (4px). Everything is a multiple of 4.

### Principles

1. **Let the page breathe at wide widths.** Don't center a narrow column inside a big screen — use the full width with generous internal padding. The editorial feel depends on whitespace.
2. **Single dominant column per section.** Each section states one thing. No multi-column "feature grid" dumps. When content *is* in a grid (customers, publications), the grid is large and loose — 2–4 items max per row, with huge gaps.
3. **Alignment is the grid.** There is very little visible bordering or box-drawing. Rhythm comes from left-aligned text rails and consistent vertical spacing, not from cards.
4. **Asymmetric hero balance.** The hero pairs a dense text block on one side with a single visual artifact (the clock motif) on the other — not a symmetric 50/50 split.

---

## 5. Hero treatment

The Simile hero is the thesis of the design system. Worth copying the *structure*, not the literal clock.

- A **working, animated artifact** sits alongside the headline — in Simile's case, a clock face rendered with Geist Pixel fonts (`12 / 3 / 6 / 9 / 12 PM`). It is neither illustration nor screenshot — it's a live diagrammatic object.
- The headline is a **full sentence**, not a slogan: "Simile is a simulation platform for human behavior." Verb-first, declarative, no adjectives.
- One CTA. Always one. ("Request a demo.")
- Above the hero sits a **single-line announcement ribbon** carrying the freshest news (Series A, partnership). It's the only place the coral accent shows up in the top 20% of the page.

### Principle

> **Lead with an object, not a promise.** The reader should see *something the product does* before they see *what the company claims*.

---

## 6. Imagery, icons, graphics

1. **No stock photos. No 3D renders. No gradient meshes.** The site is almost entirely type, space, and line.
2. **Logos only as proof.** Customer logos (Wealthfront, Telstra, Suntory, CVS, GSP, Itaú) appear as monochrome SVGs in a quiet row — no "trusted by" heading larger than a small-caps label.
3. **Diagrams over illustrations.** When something must be shown, it is drawn as a schematic — thin lines, mono labels, no shading. Think scientific figure, not marketing hero.
4. **Blur is atmosphere, not chrome.** The design uses `--blur-xl: 24px` and `--blur-3xl: 64px` only as ambient background softening in dark sections — never for frosted-glass UI.

---

## 7. Motion

Quiet, short, editorial.

- **Default transition: `250ms cubic-bezier(.4, 0, .2, 1)`** (Tailwind's `ease-in-out`).
- **Only one ambient loop.** `pulse 2s cubic-bezier(.4, 0, .6, 1) infinite` — used sparingly to indicate liveness.
- **Carousel, not parallax.** Customer testimonials slide horizontally (`--slide-size: 80vw`, `--slide-spacing: 2rem`), one quote at a time. No scroll-jacking, no pinned sections, no scrollytelling.

### Principles

1. **If it doesn't clarify, don't animate it.** Motion is used to *demonstrate the simulation running* — not to decorate the page.
2. **Short durations.** Nothing longer than 400ms. The editorial tone breaks if elements swoop or bounce.
3. **No easing drama.** Standard ease-in-out everywhere. No springs, no overshoot.

---

## 8. Buttons and CTAs

- Small radius: `--radius-md: 6px`, `--radius-lg: 8px`, `--radius-xl: 12px`. Never pill-shaped, never sharp-cornered.
- Primary CTA is a **dark button on beige** (`#3d3733` bg / `#f8f6f3` text) — not the coral. Coral is for links, not actions.
- Ghost/tertiary CTAs are **underlined text with an arrow glyph** (`→`), borrowed from editorial "read more" conventions.
- No icon buttons without labels. Every button has a verb.

### Principle

> **Buttons are quiet; links do the flirting.** The attention-grabbing hover state lives on links (coral underline appearing/lifting), while buttons stay composed.

---

## 9. Content hierarchy and voice

The writing is as much a part of the UI as the type.

1. **Headlines are full sentences.** "Simile is a simulation platform for human behavior." "A trustworthy exploration of the future." "Partnering with innovative leaders." Each is a complete claim.
2. **Sub-claims are verb phrases.** "Find your audience." "De-risk decisions." "Test concepts." Imperative, short, no adjectives.
3. **Quotes are credentialed, not adjectival.** Testimonials lead with the *name + title + company* because the brand is selling rigor; the quote itself is plain language, never marketing-speak.
4. **Numbers as proof.** "$100M Series A." "15x research scope." Numbers appear in Geist Pixel when they *are* the point, and in Archivo when they're incidental.
5. **Footer is a single line.** `© 2026 Simile AI, Inc. All rights reserved. Privacy Policy.` No sitemap, no social icons, no newsletter capture. The seriousness extends to the last pixel.

---

## 10. The twelve principles, condensed

Use this as a checklist when applying the system.

1. **Warm paper, not white.** Backgrounds have brown/orange undertone. No `#fff`, no `#000`.
2. **One accent, used like a pen.** Coral `#e66253` marks one thing per viewport.
3. **Three families, three jobs.** Archivo = product. Junicode = argument. Geist Pixel = machine.
4. **Serif is for the thesis.** Never for UI chrome.
5. **Pixel fonts are texture.** Numerals and codes only, monospaced.
6. **Tight display, snug body.** `-0.025em` tracking on headlines, `1.375` leading on text.
7. **Full-width canvas.** Design for 1920px with 32px gutters; don't cap to a narrow column.
8. **Lead with an object.** Hero shows the product running before it explains anything.
9. **Motion clarifies, never decorates.** 250ms ease-in-out, no parallax, no scrollytelling.
10. **Buttons quiet, links alive.** Dark buttons, coral links, underlined "read more →".
11. **Diagrams over illustrations.** Schematic lines, mono labels — no stock, no 3D, no gradients.
12. **Writing is part of the UI.** Complete sentences for headlines, verb phrases for features, names for quotes, one-line footer.

---

## 11. Anti-patterns (things that would break the feel)

- Rounded pill buttons
- Purple/blue gradient backgrounds
- Sans-serif all the way down with no serif or pixel contrast
- Glassmorphism cards
- Emoji in headlines
- Stock photography of smiling people at laptops
- Feature grids with 6+ icon-label tiles
- Parallax scrolling hero backgrounds
- Newsletter popups
- Chat-bubble AI assistant widgets in the corner
- Mega-menus
- Pure black text on pure white

---

## 12. Minimal applied example (Tailwind-ish)

```html
<body class="bg-[#f8f6f3] text-[#494440] font-[Archivo] tracking-normal">
  <!-- Announcement ribbon -->
  <div class="border-b border-[#eae3dd] text-sm py-3 text-center">
    Simile × Gallup — join the waitlist
    <a class="text-[#e66253] underline underline-offset-4 ml-2">Learn more →</a>
  </div>

  <!-- Hero -->
  <section class="max-w-[120rem] mx-auto px-8 py-24 grid grid-cols-12 gap-8">
    <h1 class="col-span-7 font-[Junicode] text-[clamp(3rem,6vw,7.5rem)] leading-[1.05] tracking-[-0.025em] text-[#3d3733]">
      A simulation platform for human behavior.
    </h1>
    <div class="col-span-5 font-[GeistPixelSquare] text-[#3d3733]">
      <!-- live clock/diagram artifact -->
    </div>
    <div class="col-span-12 mt-12">
      <button class="bg-[#3d3733] text-[#f8f6f3] rounded-lg px-6 py-3 text-sm font-medium">
        Request a demo
      </button>
    </div>
  </section>
</body>
```

---

*Derived from inspection of simile.ai (HTML + compiled Tailwind CSS bundle), April 2026.*
