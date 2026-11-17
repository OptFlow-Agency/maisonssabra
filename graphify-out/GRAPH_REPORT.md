# Graph Report - maisonsabra  (2026-11-16)

## Corpus Check
- 99 files · ~581,848 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 440 nodes · 1018 edges · 28 communities (26 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abcd4e10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_app.js|app.js]]
- [[_COMMUNITY_cart.ts|cart.ts]]
- [[_COMMUNITY_cms.ts|cms.ts]]
- [[_COMMUNITY_copy.js|copy.js]]
- [[_COMMUNITY_....layoutsPage.astro|../../layouts/Page.astro]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_....componentsProductView.astro|../../components/ProductView.astro]]
- [[_COMMUNITY_index.astro|index.astro]]
- [[_COMMUNITY_seo.ts|seo.ts]]
- [[_COMMUNITY_crm.js|crm.js]]
- [[_COMMUNITY_logic.js|logic.js]]
- [[_COMMUNITY_catalog.ts|catalog.ts]]
- [[_COMMUNITY_Maison Sabra design reference|Maison Sabra design reference]]
- [[_COMMUNITY_Product|Product]]
- [[_COMMUNITY_Product|Product]]
- [[_COMMUNITY_events.js|events.js]]
- [[_COMMUNITY_Astro Starter Kit Minimal|Astro Starter Kit: Minimal]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_films.ts|films.ts]]

## God Nodes (most connected - your core abstractions)
1. `../../components/ProductView.astro` - 33 edges
2. `../../layouts/Page.astro` - 20 edges
3. `money()` - 19 edges
4. `refreshOffer()` - 17 edges
5. `init()` - 15 edges
6. `./Base.astro` - 14 edges
7. `waHref()` - 14 edges
8. `render()` - 13 edges
9. `onSubmit()` - 13 edges
10. `route()` - 13 edges

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

## Communities (28 total, 2 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.07
Nodes (85): esc(), analytics, acceptUpsell(), alertBox(), applyStatic(), bagIds(), bagPrices(), capture() (+77 more)

### Community 1 - "cart.ts"
Cohesion: 0.07
Nodes (50): checkPromo(), fetchOffers(), fetchReviews(), invalidateCms(), countBags(), fmtMad(), Item, loadBags() (+42 more)

### Community 2 - "cms.ts"
Cohesion: 0.07
Nodes (42): CollectionCard, collections, BASE, cached(), CartItem, CmsCollection, CmsError, CmsMedia (+34 more)

### Community 3 - "copy.js"
Cohesion: 0.18
Nodes (18): config, p(), staticProducts, jsonLd, cities, duoFaq(), faqItems(), money() (+10 more)

### Community 4 - "../../layouts/Page.astro"
Cohesion: 0.09
Nodes (29): @fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url, @fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url, ../components/AnnouncementBar.astro, ../components/CartDrawer.astro, ../components/ContactCta.astro, whatsapp, ../components/FloatingCart.astro, ../components/Footer.astro (+21 more)

### Community 5 - "dependencies"
Cohesion: 0.08
Nodes (22): dependencies, astro, @astrojs/vercel, @fontsource/cormorant-garamond, @fontsource-variable/jost, @fontsource-variable/montserrat, lenis, lucide-static (+14 more)

### Community 6 - "../../components/ProductView.astro"
Cohesion: 0.14
Nodes (19): ./ProductCard.astro, ../../components/ProductView.astro, benefitIcon(), icons, Benefit, bladiSeed, discount(), ProductVariant (+11 more)

### Community 7 - "index.astro"
Cohesion: 0.12
Nodes (13): ../components/BrandFilms.astro, ../components/CollectionsShowcase.astro, atar, bladi, tiles, zman, ../components/Founder.astro, ../components/Heritage.astro (+5 more)

### Community 8 - "seo.ts"
Cohesion: 0.18
Nodes (12): ../../components/NotFoundView.astro, breadcrumbLd(), itemListLd(), cacheShort(), list, list, p, ../data/seo (+4 more)

### Community 9 - "crm.js"
Cohesion: 0.28
Nodes (11): BASE, crmErrorCode(), crmPost(), crmUrl(), TENANT, fromDb(), attribution(), checkPromo() (+3 more)

### Community 10 - "logic.js"
Cohesion: 0.22
Nodes (8): clampQty(), computeTotal(), formatPhoneDisplay(), isValidMoroccanPhone(), MSG, normalizePhone(), toE164(), validateOrder()

### Community 11 - "catalog.ts"
Cohesion: 0.29
Nodes (9): Collection, fallback, registerSizes(), fromCms(), getCatalog(), CmsProduct, fetchProducts(), esc() (+1 more)

### Community 12 - "Maison Sabra design reference"
Cohesion: 0.25
Nodes (7): Brand, Header, Homepage hero, Homepage sections (below the hero), Interaction, Maison Sabra design reference, Palette and typography

### Community 13 - "Product"
Cohesion: 0.25
Nodes (7): Confirmed facts (from the live site), Open decisions, Platform, Product, Product Purpose, Stack, Users

### Community 14 - "Product"
Cohesion: 0.36
Nodes (6): ./Breadcrumbs.astro, ./CatalogCard.astro, ../components/CollectionView.astro, ../components/CuratedProducts.astro, Product, ../data/products

### Community 15 - "events.js"
Cohesion: 0.47
Nodes (3): log(), track(), uuid()

### Community 16 - "Astro Starter Kit: Minimal"
Cohesion: 0.40
Nodes (4): Astro Starter Kit: Minimal, 🧞 Commands, 🚀 Project Structure, 👀 Want to learn more?

### Community 17 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): exclude, extends, include

## Knowledge Gaps
- **102 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fallback` connect `catalog.ts` to `app.js`, `cart.ts`, `../../components/ProductView.astro`?**
  _High betweenness centrality (0.322) - this node is a cross-community bridge._
- **Why does `initMoments()` connect `app.js` to `catalog.ts`?**
  _High betweenness centrality (0.321) - this node is a cross-community bridge._
- **Why does `../../components/ProductView.astro` connect `../../components/ProductView.astro` to `cart.ts`, `cms.ts`, `../../layouts/Page.astro`, `seo.ts`, `Product`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `init()` (e.g. with `applyStatic()` and `initColorCards()`) actually correct?**
  _`init()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0694938440492476 - nodes in this community are weakly interconnected._
- **Should `cart.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._