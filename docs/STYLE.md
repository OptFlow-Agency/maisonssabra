# Maison Sabra: style guide

How the storefront should look, read and behave. The canonical values live in code:
- `src/styles/tokens.css` for the main site (Tailwind `@theme`, so each token is also a utility class).
- `src/zman-lp/styles/global.css` for the landing product page (plain CSS variables).

If this file and the code disagree, the code wins. Fix this file.

Brand background and homepage composition: [`DESIGN.md`](../DESIGN.md). Audience and confirmed facts: [`PRODUCT.md`](../PRODUCT.md).

## Brand in one line

Handmade Moroccan bags, presented with warmth and restraint: ivory grounds, burgundy accents, antique gold details, and the product photography doing the talking. Keep the **MS** monogram.

## Colour

| Token (main site) | Value | Use |
| --- | --- | --- |
| `burgundy` | `#78143a` | Primary: buttons, links, readable accents |
| `burgundy-deep` | `#4d0206` | Depth, text on champagne (13:1 on ivory) |
| `rose` (champagne) | `#efc383` | CTA on dark backgrounds, highlights |
| `rose-dusty` (bronze) | `#8f5a1c` | Hover on light, white text 5.9:1 |
| `ivory` | `#fff9f2` | Page ground |
| `card-beige` | `#f5ecde` | Collection cards |
| `ink` / `ink-soft` | `#090806` / `#57504a` | Body text / secondary text |
| `gold` | `#b08231` | **Decorative only**: monograms, rules, small ornaments |

Landing page equivalents: `--burgundy #6e1e3a`, `--ivory #faf6ef`, `--espresso #2a1d18` (text), `--muted #6b5a50`, `--gold #a98440`, `--line #ddd1bd`, `--ok #1d6b46`, `--err #a4262c`.

Rules:
- **Gold is never body text.** It reaches only about 1.8:1 contrast. Use burgundy for anything that has to be read.
- Keep text at WCAG AA contrast at least: 4.5:1 for body, 3:1 for large text.
- Product photos sit on a neutral `#f4f2ef`, never a tint matched to the bag's colour.

## Typography

| Role | Main site | Landing page |
| --- | --- | --- |
| Display / headings | Cormorant Garamond 500/600 (`font-display`) | Playfair Display (`--serif`) |
| Body, nav, controls | Montserrat (`font-body`) | Inter (`--sans`) |
| Labels / eyebrows | Montserrat, uppercase, tracked `.16–.18em` | Montserrat (`--label`) |

- Sizes use the fluid scale `text-step--1` … `text-step-5`. Don't invent one-off pixel sizes.
- Italic serif is for short accents only (one or two words, as in "Éclats de *Tradition*").
- **The ampersand:** render "&" in the sans font, upright (`.amp`). The italic serif "&" is unreadable for some customers.
- Product names are never truncated or clamped.

## Copy (French)

- Tone: warm, precise, unhurried. Use "vous". Talk about craft and gifting, never hype.
- Typography of the language:
  - Typographic apostrophe: `’`, not `'`.
  - Guillemets with non-breaking spaces: `« Texte »`.
  - Use a real minus sign for discounts: `−15 %` (`−` U+2212 followed by a space).
  - Put a space before `%` and before `:` `;` `!` `?`.
- Money: `1 098 MAD`. Use `fmtMad()` / `money()` and show decimals only when there are some (`988,20 MAD`).
- **Only verified claims.** No invented delivery times, cities, hours, stock levels or guarantees. If the CRM doesn't provide a message, hide the element instead of writing a placeholder.
- Show a struck-through original price and « Économisez X MAD (−Y %) » only when the original price is really higher.

## Layout

- Mobile first. Check 360 px, 768 px and 1280 px.
- Breakpoints: `split` at 60rem (two-column layouts), `nav` at 78rem (full navigation).
- Side gutter `--gutter: clamp(1rem, 4vw, 3rem)`, max content width `--max: 90rem`.
- Radius: 12px for the floating header and its menus, 14px (`--r`) for landing page cards. Pills are fully rounded.
- No horizontal scroll at any width.

## Components

- **Buttons:** burgundy fill as primary, outlined burgundy as secondary, champagne fill on dark backgrounds. Labels are verbs: « Ajouter au panier », « Commander directement ».
- **Product card:** square photo, then a worn photo on hover, collection label, full name, current price (dominant), struck price, and at most one quiet note (low stock or « Nouveau »).
- **Promo code pill:** a small rounded pill with the `CODE · −X %` text and a « Copier » button. Announce the copy confirmation through a hidden `role="status"` element.
- **2nd-bag toggle:** a real `role="switch"` checkbox, off by default. When on, it shows the second-bag picker and the CRM-verified saving.
- **Badges / notes:** one per card at most. Small uppercase label type.

## Motion

- Easing: `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`). Durations around 1 s for reveals, faster for UI feedback.
- Product motion is restrained: gentle rise and fade, subtle parallax. Nothing bounces.
- Always respect `prefers-reduced-motion`: disable animations and smooth scroll.
- Animate `transform` and `opacity` only. Never animate layout properties.

## Accessibility

- Show a visible focus ring everywhere (`:focus-visible`, a 3px gold or burgundy outline with an offset).
- Touch targets are at least 44 × 44 px.
- Each page has one `h1` and headings in order. Every image has `alt`: decorative images get `alt=""`, product images get the product name and colour.
- Use native elements first (`button`, `dialog`, `fieldset`/`legend`, radio and checkbox). Live updates such as the cart, promo or stock go through `role="status"`.
- Arabic quotes get `lang="ar" dir="rtl"`.

## Imagery

- Use the CRM photo sizes: 480 px for thumbnails, 800 px for gallery slides. Never load the 1000 px original for a thumbnail.
- Always set `width`/`height` to avoid layout shift. Images below the fold use `loading="lazy"`, and the hero image uses `fetchpriority="high"`.
- Use real product and atelier photography only. No AI-generated portraits.
