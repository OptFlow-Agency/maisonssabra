// Shared by the product page, the cart drawer and the checkout: one source for the quantity offer (from the CMS),
// its server check (POST /promo) and money formatting. The CMS decides what the offer is; it also prices it.
import { fallback, type Product } from "../data/products";
import { checkPromo, cmsEnabled, fetchOffers, fetchProducts, type CartItem, type CmsOffer } from "./cms";
import { fromCms } from "./catalog";

export type Offer = CmsOffer;
export type Verdict = { percent: number; discount: number };
export type Item = CartItem;

/** 1 098 MAD, 988,20 MAD: decimals only when there are some. */
export const fmtMad = (n: number) =>
  `${n.toLocaleString("fr-FR", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

/**
 * The live "buy N, save X %" offer, or null when the CMS has none (disabled, expired, exhausted code…).
 * Only plain multi-unit bundles qualify here; "second item only" upsells belong to other flows.
 */
export async function loadOffer(): Promise<Offer | null> {
  if (!cmsEnabled) return null;
  try {
    return (await fetchOffers()).find((o) => o.type === "bundle" && o.quantity >= 2 && !o.second_item_only && o.percent > 0) ?? null;
  } catch { return null; }
}

export const qualifies = (offer: Offer, slug: string) => !offer.products.length || offer.products.includes(slug);

/** Asks the CMS what the offer's code is worth for these items. null: not valid for them, or unreachable. */
export async function verify(offer: Offer, items: Item[]): Promise<Verdict | null> {
  if (!items.length) return null;
  try {
    const r = await checkPromo(offer.code, items);
    return r && r.percent > 0 ? { percent: Number(r.percent), discount: Number(r.discount) || 0 } : null;
  } catch { return null; }
}

/** Active products (same source as the shop). Falls back to the bundled catalogue. */
export async function loadBags(): Promise<Product[]> {
  if (!cmsEnabled) return fallback;
  try { return (await fetchProducts()).map(fromCms).filter((p): p is Product => !!p); } catch { return fallback; }
}

/** Units in the cart that count toward the offer. */
export const countBags = (lines: readonly { id: string; qty: number }[], offer: Offer) =>
  lines.reduce((n, l) => n + (qualifies(offer, l.id) ? l.qty : 0), 0);
