# Graph Report - maisonsabra  (2026-11-24)

## Corpus Check
- 99 files · ~607,440 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 468 nodes · 1097 edges · 30 communities (28 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `376e5993`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_app.js|app.js]]
- [[_COMMUNITY_cart.ts|cart.ts]]
- [[_COMMUNITY_cms.ts|cms.ts]]
- [[_COMMUNITY_copy.js|copy.js]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_....componentsProductView.astro|../../components/ProductView.astro]]
- [[_COMMUNITY_index.astro|index.astro]]
- [[_COMMUNITY_offer.ts|offer.ts]]
- [[_COMMUNITY_crm.js|crm.js]]
- [[_COMMUNITY_logic.js|logic.js]]
- [[_COMMUNITY_refreshOffer|refreshOffer]]
- [[_COMMUNITY_Maison Sabra design reference|Maison Sabra design reference]]
- [[_COMMUNITY_Product|Product]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_Astro Starter Kit Minimal|Astro Starter Kit: Minimal]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_films.ts|films.ts]]
- [[_COMMUNITY_fmtMad|fmtMad]]

## God Nodes (most connected - your core abstractions)
1. `../../components/ProductView.astro` - 33 edges
2. `../../layouts/Page.astro` - 20 edges
3. `refreshOffer()` - 19 edges
4. `init()` - 18 edges
5. `init()` - 16 edges
6. `money()` - 16 edges
7. `./Base.astro` - 14 edges
8. `render()` - 14 edges
9. `waHref()` - 14 edges
10. `onSubmit()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `initMoments()` --calls--> `fallback`  [INFERRED]
  src/zman-lp/scripts/app.js → src/data/products.ts
- `buildRecs()` --calls--> `variant()`  [INFERRED]
  src/scripts/cart-offer.ts → src/data/products.ts
- `init()` --indirect_call--> `variant()`  [INFERRED]
  src/scripts/pdp.ts → src/data/products.ts
- `loadHome()` --indirect_call--> `fromCms()`  [INFERRED]
  src/lib/home.ts → src/lib/catalog.ts
- `loadBags()` --indirect_call--> `fromCms()`  [INFERRED]
  src/lib/offer.ts → src/lib/catalog.ts

## Import Cycles
- 1-file cycle: `src/scripts/cart.ts -> src/scripts/cart.ts`

## Communities (30 total, 2 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.07
Nodes (86): openCart(), esc(), noDot(), analytics, acceptUpsell(), alertBox(), applyStatic(), bagIds() (+78 more)

### Community 1 - "cart.ts"
Cohesion: 0.12
Nodes (23): invalidateCms(), addToCart(), buyable(), clearCart(), close(), commit(), count(), dlg (+15 more)

### Community 2 - "cms.ts"
Cohesion: 0.09
Nodes (29): ../components/Testimonials.astro, BASE, cached(), checkPromo(), CmsCollection, CmsError, CmsReview, CmsSettings (+21 more)

### Community 3 - "copy.js"
Cohesion: 0.12
Nodes (32): @fontsource-variable/montserrat/index.css, @fontsource/cormorant-garamond/latin-500.css, @fontsource/cormorant-garamond/latin-500-italic.css, @fontsource/cormorant-garamond/latin-600.css, CmsPromo, ./Faq.astro, ./OrderForm.astro, ./SiteFooter.astro (+24 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (25): dependencies, astro, @astrojs/vercel, @fontsource/cormorant-garamond, @fontsource-variable/inter, @fontsource-variable/jost, @fontsource-variable/montserrat, @fontsource-variable/playfair-display (+17 more)

### Community 6 - "../../components/ProductView.astro"
Cohesion: 0.06
Nodes (44): ../components/AnnouncementBar.astro, ../components/BrandFilms.astro, ../../components/CartDrawer.astro, ../components/CollectionsShowcase.astro, atar, bladi, tiles, zman (+36 more)

### Community 7 - "index.astro"
Cohesion: 0.07
Nodes (40): @fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url, @fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url, ./Breadcrumbs.astro, ../components/CollectionView.astro, ../components/ContactCta.astro, ../components/CuratedProducts.astro, ./ProductCard.astro, ../../components/ProductView.astro (+32 more)

### Community 8 - "offer.ts"
Cohesion: 0.15
Nodes (22): tone(), CartItem, CmsOffer, fetchOffers(), fetchProducts(), fetchPromos(), countBags(), Item (+14 more)

### Community 9 - "crm.js"
Cohesion: 0.17
Nodes (20): BASE, crmErrorCode(), crmPost(), crmUrl(), TENANT, cache, cap(), dropBroken() (+12 more)

### Community 10 - "logic.js"
Cohesion: 0.20
Nodes (9): clampQty(), computeOrder(), computeTotal(), formatPhoneDisplay(), isValidMoroccanPhone(), MSG, normalizePhone(), toE164() (+1 more)

### Community 11 - "refreshOffer"
Cohesion: 0.29
Nodes (10): Product, fmtMad(), Verdict, el(), buildOffer(), buildRecs(), el(), Line (+2 more)

### Community 12 - "Maison Sabra design reference"
Cohesion: 0.25
Nodes (7): Brand, Header, Homepage hero, Homepage sections (below the hero), Interaction, Maison Sabra design reference, Palette and typography

### Community 13 - "Product"
Cohesion: 0.25
Nodes (7): Confirmed facts (from the live site), Open decisions, Platform, Product, Product Purpose, Stack, Users

### Community 14 - "store.ts"
Cohesion: 0.27
Nodes (10): fetchContent(), fetchSettings(), emptyConfig, freeShippingText(), getStoreConfig(), loadStoreConfig(), mad(), shippingQuote (+2 more)

### Community 16 - "Astro Starter Kit: Minimal"
Cohesion: 0.40
Nodes (4): Astro Starter Kit: Minimal, 🧞 Commands, 🚀 Project Structure, 👀 Want to learn more?

### Community 17 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): exclude, extends, include

### Community 28 - "fmtMad"
Cohesion: 0.20
Nodes (12): CollectionCard, collections, CmsMedia, CmsSection, Home, HomeCollection, Link, loadHome() (+4 more)

## Knowledge Gaps
- **118 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `init()` connect `app.js` to `cart.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `init()` (e.g. with `addToCart()` and `openCart()`) actually correct?**
  _`init()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `init()` (e.g. with `variant()` and `go()`) actually correct?**
  _`init()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07003475006682705 - nodes in this community are weakly interconnected._
- **Should `cart.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Should `cms.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09462365591397849 - nodes in this community are weakly interconnected._