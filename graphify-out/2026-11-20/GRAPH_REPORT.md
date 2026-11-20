# Graph Report - maisonsabra  (2026-11-17)

## Corpus Check
- 98 files · ~583,004 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 440 nodes · 1018 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `acb0d40a`
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
- [[_COMMUNITY_crm.js|crm.js]]
- [[_COMMUNITY_logic.js|logic.js]]
- [[_COMMUNITY_Maison Sabra design reference|Maison Sabra design reference]]
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

## Communities (25 total, 2 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.07
Nodes (85): esc(), analytics, acceptUpsell(), alertBox(), applyStatic(), bagIds(), bagPrices(), capture() (+77 more)

### Community 1 - "cart.ts"
Cohesion: 0.05
Nodes (78): BASE, cached(), CartItem, checkPromo(), CmsCollection, CmsError, CmsOffer, CmsReview (+70 more)

### Community 2 - "cms.ts"
Cohesion: 0.19
Nodes (13): CollectionCard, collections, CmsMedia, CmsSection, fetchCollections(), Home, HomeCollection, Link (+5 more)

### Community 3 - "copy.js"
Cohesion: 0.18
Nodes (18): config, p(), staticProducts, jsonLd, cities, duoFaq(), faqItems(), money() (+10 more)

### Community 4 - "../../layouts/Page.astro"
Cohesion: 0.09
Nodes (28): @fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url, @fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url, ../components/AnnouncementBar.astro, ../components/CartDrawer.astro, ../components/ContactCta.astro, whatsapp, ../components/FloatingCart.astro, ../components/Footer.astro (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.08
Nodes (22): dependencies, astro, @astrojs/vercel, @fontsource/cormorant-garamond, @fontsource-variable/jost, @fontsource-variable/montserrat, lenis, lucide-static (+14 more)

### Community 6 - "../../components/ProductView.astro"
Cohesion: 0.06
Nodes (52): ../components/BrandFilms.astro, ./Breadcrumbs.astro, ../components/CollectionView.astro, ../components/CuratedProducts.astro, ../components/Founder.astro, ../components/Instagram.astro, ../../components/NotFoundView.astro, ./ProductCard.astro (+44 more)

### Community 7 - "index.astro"
Cohesion: 0.14
Nodes (9): ../components/CollectionsShowcase.astro, atar, bladi, tiles, zman, ../components/Heritage.astro, portrait, [] (+1 more)

### Community 9 - "crm.js"
Cohesion: 0.28
Nodes (11): BASE, crmErrorCode(), crmPost(), crmUrl(), TENANT, fromDb(), attribution(), checkPromo() (+3 more)

### Community 10 - "logic.js"
Cohesion: 0.22
Nodes (8): clampQty(), computeTotal(), formatPhoneDisplay(), isValidMoroccanPhone(), MSG, normalizePhone(), toE164(), validateOrder()

### Community 12 - "Maison Sabra design reference"
Cohesion: 0.25
Nodes (7): Brand, Header, Homepage hero, Homepage sections (below the hero), Interaction, Maison Sabra design reference, Palette and typography

### Community 13 - "Product"
Cohesion: 0.25
Nodes (7): Confirmed facts (from the live site), Open decisions, Platform, Product, Product Purpose, Stack, Users

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
- **103 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fallback` connect `../../components/ProductView.astro` to `app.js`, `cart.ts`?**
  _High betweenness centrality (0.322) - this node is a cross-community bridge._
- **Why does `initMoments()` connect `app.js` to `../../components/ProductView.astro`?**
  _High betweenness centrality (0.321) - this node is a cross-community bridge._
- **Why does `../../components/ProductView.astro` connect `../../components/ProductView.astro` to `cart.ts`, `../../layouts/Page.astro`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `init()` (e.g. with `applyStatic()` and `initColorCards()`) actually correct?**
  _`init()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0694938440492476 - nodes in this community are weakly interconnected._
- **Should `cart.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050187265917602995 - nodes in this community are weakly interconnected._