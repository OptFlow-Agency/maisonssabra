# Maison Sabra design reference

## Brand
Maison Sabra presents handmade Moroccan bags through warm ivory, burgundy, antique gold, and product photography. The language is French. Preserve the MS monogram and existing product truth.

## Palette and typography
Use the canonical values in `src/styles/tokens.css`: burgundy #78143a, deep burgundy #4d0206, ivory #f5ecde, deeper ivory #ece0cc, and champagne #efc383. Gold is decorative; use burgundy for readable accents. Cormorant Garamond carries expressive headings; Montserrat carries navigation, descriptions, and controls.

## Homepage hero
A house-level hero, never tied to one collection. A full-bleed riad arcade (`/img/hero/arches.webp`) sits under the floating header; the central arch frames a centered stack: eyebrow, “Éclats de Tradition” in Cormorant (uppercase with an italic “Tradition”), the heritage line, and an outlined burgundy CTA to the boutique. The three collections (Z’man, Bladi, Atar “Bientôt”) are listed along the floor line from `src/data/collections.ts`, so new collections appear automatically.

## Header
A floating bar (12px radius, white at 85% with blur, gold hairline border) inset by the gutter and 0.75rem from the top. `--header-h` holds its total footprint; the homepage hero pulls up by that amount to sit beneath it. The mega-menu and mobile drawer drop below with the same 12px radius.

## Homepage sections (below the hero)
Every section sits on the light ivory ground (`bg-ivory`, #faf6ef) except the burgundy films band. Order: Collections → Nos pièces emblématiques → Reassurance → Heritage (`#maison`) → Brand films (`#notre-histoire`) → Testimonials → SEO discovery copy → WhatsApp CTA → Instagram. Content comes from the CMS through `src/lib/home.ts`, with approved defaults when the CMS has nothing.

Product cards (`ProductCard.astro`): square photo on a neutral `#f4f2ef` ground (no colour-matched tints), worn photo on hover, collection label, full name (never clamped; rows align through CSS subgrid), current price dominant, struck original price, and « Économisez X MAD (−Y %) » only when the original price is genuinely higher. At most one quiet note (CMS low stock, else « Nouveau »). « + Ajouter » uses the shared `data-add` cart handler.

Only verified claims: reassurance messages come from CMS settings and hide when absent; no invented hours, cities, delays or policies anywhere in the copy.

## Interaction
The primary hero link opens the boutique. The bag and price open the featured product. Each thumbnail opens its corresponding colorway. Provide visible keyboard focus, generous touch targets, and restrained product motion that respects reduced-motion preferences.
