// Typed client for the Maison Sabra CMS store API (made-design-crm: src/endpoints/store).
// Runs on the server (pages) and in the browser (cart, product page, checkout). Only public, read-mostly endpoints
// are used: no credentials exist on the storefront. The CMS stays authoritative for prices, stock and discounts.

const BASE = (import.meta.env.PUBLIC_CMS_URL as string | undefined)?.replace(/\/$/, "");
const TENANT = (import.meta.env.PUBLIC_CMS_TENANT as string | undefined) || "maisonsabra";

export const cmsEnabled = !!BASE;
const endpoint = (path: string) => `${BASE}/api/store/${TENANT}/${path}`;

/* ---------- Wire types (mirrors endpoints/store/serialize.ts and index.ts) ---------- */
export type CmsMedia = { url: string; alt: string; width: number | null; height: number | null; sizes: { 480?: string; 800?: string } };

export type CmsVariant = {
  name: string; sku: string | null; price: number; was_price: number | null; color: string | null; image: CmsMedia | null;
  stock_status: StockStatus; purchasable: boolean; stock_left: number | null;
};
export type StockStatus = "untracked" | "in_stock" | "low_stock" | "out_of_stock";

export type CmsProduct = {
  slug: string; name: string; price: number; was_price: number | null;
  image: string | null; image2: string | null; image_sizes: CmsMedia["sizes"]; image2_sizes: CmsMedia["sizes"];
  alt: string; description: string; is_new: boolean; collection: string | null; collections: string[]; sort_order: number;
  short_description: string | null;
  images: (CmsMedia & { kind: string })[];
  benefits: { icon: string; title: string; description: string | null }[];
  promotion: { label: string | null; ends_at: string | null } | null;
  stock_status: StockStatus; purchasable: boolean; stock_left: number | null;
  variants: CmsVariant[];
  featured: boolean; related: string[];
};

export type CmsOffer = {
  id: string; title: string; type: "bundle" | "upsell"; quantity: number; percent: number; code: string; second_item_only: boolean;
  min_subtotal: number | null; badge: string | null; default_selected: boolean; duration_seconds: number | null;
  /** Eligible product slugs. Empty: every product. */
  products: string[]; ends_at: string | null;
};

export type CmsSettings = {
  store_name: string; tagline: string | null; announcement: string | null;
  contact: { phone: string | null; whatsapp: string | null; email: string | null; instagram: string | null };
  shipping: { default_cost: number; free_from: number | null; delay: string | null };
  trust: { title: string; text: string | null; link_label: string | null; link_url: string | null }[];
  payment_methods: { key: string; label: string; description: string | null }[];
  returns: { window_days: number | null; summary: string | null };
  low_stock_threshold: number;
  policies: { delivery: string | null; returns: string | null };
};

export type CmsReview = { author: string; title: string | null; text: string; rating: number | null; photo: CmsMedia | null; verified: boolean; source: string; reply: string | null; date: string };
export type CmsReviews = { count: number; average: number | null; reviews: CmsReview[] };

export type CmsCollection = { slug: string; name: string; description: string; image: CmsMedia | null; hero_image: CmsMedia | null; featured: boolean; seasonal: boolean; season_label: string | null; featured_products: string[] };

export type CmsSection = {
  id: string; placement: string; type: string; kicker: string | null; heading: string | null; body: string | null;
  image: CmsMedia | null; image_mobile: CmsMedia | null; cta: { label: string; href: string } | null; products: string[]; collection: string | null;
  story?: string | null;
};

/** Brand stories (kind "craftsmanship" is only returned once the CMS marks its claims as verified). */
export type CmsStory = {
  slug: string; title: string; kind: string; kicker: string | null; excerpt: string | null; body: string[];
  cover: CmsMedia | null; images: (CmsMedia & { caption: string | null })[]; products: string[]; published_at: string | null;
};

export type PromoVerdict = { percent: number; discount: number };
export type OrderResult = { order_number: number; total: number; discount: number };

/** Error codes the CMS returns as `{ error }` (see StoreError in endpoints/store/helpers.ts). */
export class CmsError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

/* ---------- Transport ---------- */
async function request<T>(path: string, init?: RequestInit & { timeout?: number }): Promise<T> {
  if (!BASE) throw new CmsError("cms_disabled", 0);
  const res = await fetch(endpoint(path), { ...init, signal: AbortSignal.timeout(init?.timeout ?? 4000) });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new CmsError((body as { error?: string } | null)?.error ?? "server_error", res.status);
  return body as T;
}

/** Short in-memory memo: collapses the several identical reads one page render (or one browser page) makes. */
const memo = new Map<string, { at: number; value: Promise<unknown> }>();
const cached = <T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> => {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>;
  const value = load().catch((e) => { memo.delete(key); throw e; });
  memo.set(key, { at: Date.now(), value });
  return value;
};

/** Forget cached reads (after a purchase attempt failed on stale data). */
export const invalidateCms = () => memo.clear();

const browser = typeof window !== "undefined";
// Display data may be a little stale (the CDN holds it ~60 s anyway); the browser re-reads sooner so the cart notices an offer going off.
const TTL = browser ? 20_000 : 10_000;

export const fetchProducts = (q = "") => cached(`products${q}`, TTL, () => request<CmsProduct[]>(`products${q}`));
export const fetchSettings = () => cached("settings", TTL, () => request<CmsSettings | null>("settings"));
export const fetchOffers = () => cached("offers", TTL, () => request<CmsOffer[]>("offers"));
export const fetchCollections = () => cached("collections", TTL, () => request<CmsCollection[]>("collections"));
export const fetchContent = (placement: string) => cached(`content${placement}`, TTL, () => request<CmsSection[]>(`content?placement=${encodeURIComponent(placement)}`));
export const fetchStories = (kind: string) => cached(`stories${kind}`, TTL, () => request<CmsStory[]>(`stories?kind=${encodeURIComponent(kind)}`));
export const fetchReviews = (product?: string) => cached(`reviews${product ?? ""}`, TTL, () => request<CmsReviews>(`reviews${product ? `?product=${encodeURIComponent(product)}` : ""}`));

export type CartItem = { slug: string; qty: number; variant?: string };
const post = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), timeout: 10_000 });

/** What the CMS says this code is worth for these items. null: not valid for them. Throws when unreachable. */
export const checkPromo = (code: string, items: CartItem[]) => post<PromoVerdict | null>("promo", { code, items });
export const placeOrder = (body: object) => post<OrderResult>("orders", body);
