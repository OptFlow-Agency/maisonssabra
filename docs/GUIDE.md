# Maison Sabra storefront: developer guide

The storefront for Maison Sabra's handmade Moroccan bags (Z’man, Bladi). It's built with Astro 7, Tailwind v4 and the Vercel adapter. The catalogue, prices, stock, offers, promo codes and orders all come from the shared CRM (Payload, `made-design-crm` repo). The storefront has no credentials and treats the CRM as the source of truth.

For colours, type, copy and UI rules, see [STYLE.md](./STYLE.md).

## Run it

Requires Node ≥ 22.

```sh
npm install
cp .env.example .env      # point it at a CRM (local or production)
npm run dev               # http://localhost:4321  (agents: astro dev --background)
npm run build             # production build into dist/
npm run preview           # serve the build
```

### Environment

| Variable | Example | Purpose |
| --- | --- | --- |
| `PUBLIC_CRM_URL` | `http://localhost:3000` | CRM base URL, with no trailing slash |
| `PUBLIC_CRM_TENANT` | `maisonsabra` | Tenant slug. Every call goes to `/api/store/<tenant>/…` |

`PUBLIC_CMS_URL` / `PUBLIC_CMS_TENANT` are accepted as aliases.

`PUBLIC_*` variables are **baked in at build time**. After changing them on Vercel, redeploy. Without a URL, pages fall back to the bundled data in `src/data/`, ordering is disabled, and the landing page shows a "mode démonstration" ribbon.

## Layout of the code

```
src/
  pages/            routes (file = URL)
  layouts/          Base.astro (html shell), Page.astro (header + footer)
  components/       main-site sections and views (Header, Hero, ProductView, CartDrawer…)
  lib/              CRM client and shared business logic (see below)
  scripts/          browser scripts: cart, product page, motion, smooth scroll
  data/             bundled fallbacks: products, collections, SEO, site info
  styles/           tokens.css (Tailwind @theme) + global.css
  zman-lp/          the Z’man / Bladi landing product page (own components, CSS and JS)
public/             static assets (images, videos, fonts not from npm)
```

### Routes

| URL | File | Notes |
| --- | --- | --- |
| `/` | `pages/index.astro` | Homepage. Sections get content from the CRM via `lib/home.ts` |
| `/boutique` | `pages/boutique.astro` | All products |
| `/collection-zman`, `/collection-bladi` | `pages/collection-*.astro` | Collection listings |
| `/produit/[slug]` | `pages/produit/[slug].astro` | SSR. Single Z’man/Bladi bags (no variants, purchasable) render `ZmanPage`; everything else renders `ProductView` |
| `/zmancollection/lp` | `pages/zmancollection/lp.astro` | Standalone Z’man landing page |
| `/commande`, `/commande/merci` | `pages/commande/` | Checkout and confirmation |
| `/sitemap.xml`, `/robots.txt` | `pages/*.ts` | Generated |

Catalogue pages use `export const prerender = false` (rendered per request). `cacheShort()` lets Vercel's CDN keep them for 60 s.

### `src/lib`: where the logic lives

| File | Role |
| --- | --- |
| `cms.ts` | Typed client for the CRM store API (`fetchProducts`, `fetchOffers`, `fetchPromos`, `checkPromo`, orders…). Server responses are memoised with stale-while-revalidate (fresh for a short TTL, served stale up to 5 min while refreshing in the background) |
| `catalog.ts` | CRM product → storefront `Product` (`fromCms`), `getCatalog()`, `cacheShort()` |
| `offer.ts` | The "2nd bag" offer, shared by the product page, cart drawer and checkout: `loadOffer`, `minUnits`, `offerOrder`, `verify` (server pricing), `loadPromos`, `fmtMad` |
| `store.ts` | Store-wide settings: free-shipping threshold, zones, announcement, trust messages, WhatsApp |
| `home.ts` | Homepage content sections with approved defaults |
| `crm.ts` | Low-level URL helper (`crmReady`, `crmUrl`) |

## CRM features you'll touch

### Offers: "Deuxième sac à −X %"
- In the CRM, under **Sales → Offers**, create an active offer linked to a promo code.
  - If the code has `secondItemOnly`, the CRM discounts one unit of the **last** cart line. The storefront therefore always sends eligible items last (`offerOrder`).
  - A bundle with quantity ≥ 2 also works as a fallback.
- `loadOffer()` picks it up. If no offer exists, the toggle is hidden.
- Only one promo code applies per order. A code typed by the customer replaces the automatic one.

### Promo codes shown on product pages
- In the CRM, under **Promo codes**, tick **Show on product page**. The code must also be active and usable.
- The CRM exposes ticked codes at `GET /api/store/<tenant>/promos`. Codes that aren't ticked stay private.
- The product page shows the codes whose product list is empty or includes that product. It leaves out the code that already drives the 2nd-bag offer.
- The CRM caches the response for 30 s, so changes take up to about a minute to appear.

When CRM-side fields change, deploy the CRM and run `pnpm payload migrate` there.

## Deploying

- Vercel deploys the **`main`** branch to production (`www.maisonsabra.ma`). Other branches get preview URLs only.
- Work on a branch, open a PR into `main`, and check the preview first.
- On the Vercel project, set `PUBLIC_CRM_URL` / `PUBLIC_CRM_TENANT` to the **production** CRM, never `localhost`.
- Checking a release: `curl -s https://www.maisonsabra.ma/produit/<slug> | grep crm-offer` should show the offer JSON, not `null`.

## Performance notes

- Navigation: Astro prefetch (`prefetchAll`, `hover`) fetches a page before the click.
- Scrolling: Lenis (`scripts/smooth.ts`). Parallax in `scripts/motion.ts` batches reads, then writes. Keep it that way: never read layout inside a write loop.
- Images: use the CRM sizes through `variant(url, 480 | 800)` from `data/products.ts`. Thumbnails get 480, slides get 800, and anything below the fold gets `loading="lazy"`.

## Conventions

- Language of the UI: French. Code and comments: English.
- Never hard-code prices, stock, discounts or policies. Read them from the CRM and hide the element when the CRM has nothing.
- Browser code builds DOM with `textContent` / helpers, never `innerHTML` with CRM data. JSON embedded with `set:html` must escape `<` (`.replace(/</g, "\\u003c")`).
- After changing code, run `graphify update .` to refresh the knowledge graph in `graphify-out/`.
- Type-check with `npx tsc --noEmit`. Run `npm run build` before opening a PR.
