# Graph Report - maisonsabra  (2026-11-24)

## Corpus Check
- 101 files · ~609,109 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 491 nodes · 1113 edges · 31 communities (29 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f945794`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_app.js|app.js]]
- [[_COMMUNITY_cart.ts|cart.ts]]
- [[_COMMUNITY_cms.ts|cms.ts]]
- [[_COMMUNITY_copy.js|copy.js]]
- [[_COMMUNITY_Layout.astro|Layout.astro]]
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
- [[_COMMUNITY_lucide-static|lucide-static]]
- [[_COMMUNITY_Astro Starter Kit Minimal|Astro Starter Kit: Minimal]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_films.ts|films.ts]]

## God Nodes (most connected - your core abstractions)
1. `../../components/ProductView.astro` - 33 edges
2. `../../layouts/Page.astro` - 20 edges
3. `refreshOffer()` - 19 edges
4. `init()` - 18 edges
5. `init()` - 16 edges
6. `money()` - 15 edges
7. `./Base.astro` - 14 edges
8. `render()` - 14 edges
9. `waHref()` - 14 edges
10. `onSubmit()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `init()` --calls--> `openCart()`  [INFERRED]
  src/zman-lp/scripts/app.js → src/scripts/cart.ts
- `initMoments()` --calls--> `fallback`  [INFERRED]
  src/zman-lp/scripts/app.js → src/data/products.ts
- `buildRecs()` --calls--> `variant()`  [INFERRED]
  src/scripts/cart-offer.ts → src/data/products.ts
- `init()` --indirect_call--> `variant()`  [INFERRED]
  src/scripts/pdp.ts → src/data/products.ts
- `loadHome()` --indirect_call--> `fromCms()`  [INFERRED]
  src/lib/home.ts → src/lib/catalog.ts

## Import Cycles
- 1-file cycle: `src/scripts/cart.ts -> src/scripts/cart.ts`

## Communities (31 total, 2 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.07
Nodes (85): esc(), noDot(), analytics, acceptUpsell(), alertBox(), applyStatic(), bagIds(), bagPrices() (+77 more)

### Community 1 - "cart.ts"
Cohesion: 0.06
Nodes (61): checkPromo(), CmsReviews, invalidateCms(), countBags(), fmtMad(), Item, loadBags(), loadOffer() (+53 more)

### Community 2 - "cms.ts"
Cohesion: 0.07
Nodes (47): ../components/Testimonials.astro, CollectionCard, collections, BASE, cached(), CartItem, CmsCollection, CmsError (+39 more)

### Community 3 - "copy.js"
Cohesion: 0.16
Nodes (29): ../../components/NotFoundView.astro, p, ./Faq.astro, ./Hero.astro, ./OrderForm.astro, ./SiteFooter.astro, ./StickyCta.astro, ./Story.astro (+21 more)

### Community 4 - "Layout.astro"
Cohesion: 0.13
Nodes (14): @fontsource-variable/montserrat/index.css, @fontsource/cormorant-garamond/latin-500.css, @fontsource/cormorant-garamond/latin-500-italic.css, @fontsource/cormorant-garamond/latin-600.css, config, jsonLd, productJsonLd(), log() (+6 more)

### Community 5 - "dependencies"
Cohesion: 0.09
Nodes (21): dependencies, astro, @astrojs/vercel, @fontsource/cormorant-garamond, @fontsource-variable/inter, @fontsource-variable/jost, @fontsource-variable/montserrat, @fontsource-variable/playfair-display (+13 more)

### Community 6 - "../../components/ProductView.astro"
Cohesion: 0.19
Nodes (13): breadcrumbLd(), itemListLd(), organizationLd(), productLd(), websiteLd(), cacheShort(), list, list (+5 more)

### Community 7 - "index.astro"
Cohesion: 0.13
Nodes (23): ./Breadcrumbs.astro, ../components/CollectionView.astro, ../components/CuratedProducts.astro, ./ProductCard.astro, ../../components/ProductView.astro, benefitIcon(), icons, Benefit (+15 more)

### Community 8 - "offer.ts"
Cohesion: 0.19
Nodes (14): @fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url, @fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url, ../components/ContactCta.astro, ../components/Reassurance.astro, site, whatsappLink(), ./Base.astro, items (+6 more)

### Community 9 - "crm.js"
Cohesion: 0.32
Nodes (10): BASE, crmErrorCode(), crmPost(), crmUrl(), TENANT, attribution(), checkPromo(), placeOrder() (+2 more)

### Community 10 - "logic.js"
Cohesion: 0.20
Nodes (9): clampQty(), computeOrder(), computeTotal(), formatPhoneDisplay(), isValidMoroccanPhone(), MSG, normalizePhone(), toE164() (+1 more)

### Community 11 - "refreshOffer"
Cohesion: 0.13
Nodes (11): ../components/BrandFilms.astro, ../components/CollectionsShowcase.astro, atar, bladi, tiles, zman, ../components/Founder.astro, ../components/Heritage.astro (+3 more)

### Community 12 - "Maison Sabra design reference"
Cohesion: 0.05
Nodes (36): Brand, Header, Homepage hero, Homepage sections (below the hero), Interaction, Maison Sabra design reference, Palette and typography, Conventions (+28 more)

### Community 13 - "Product"
Cohesion: 0.18
Nodes (13): ../components/AnnouncementBar.astro, ../../components/CartDrawer.astro, ../../components/FloatingCart.astro, ../components/Footer.astro, ../components/Header.astro, ../components/Hero.astro, ../components/Toast.astro, ../../components/WhatsAppButton.astro (+5 more)

### Community 14 - "store.ts"
Cohesion: 0.31
Nodes (8): Collection, fallback, registerSizes(), fromCms(), getCatalog(), CmsProduct, esc(), GET()

### Community 15 - "lucide-static"
Cohesion: 0.40
Nodes (3): lucide-static, ../components/HeroReassurance.astro, items

### Community 16 - "Astro Starter Kit: Minimal"
Cohesion: 0.40
Nodes (4): Astro Starter Kit: Minimal, 🧞 Commands, 🚀 Project Structure, 👀 Want to learn more?

### Community 17 - "tsconfig.json"
Cohesion: 0.50
Nodes (3): exclude, extends, include

## Knowledge Gaps
- **134 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `init()` connect `app.js` to `cart.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `lucide-static` connect `lucide-static` to `dependencies`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `lucide-static`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `init()` (e.g. with `addToCart()` and `openCart()`) actually correct?**
  _`init()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `init()` (e.g. with `variant()` and `go()`) actually correct?**
  _`init()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07058823529411765 - nodes in this community are weakly interconnected._