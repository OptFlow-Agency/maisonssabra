// Shared by the product page, the cart drawer and the checkout: one source for the quantity offer (from the CMS),
// its server check (POST /promo) and money formatting. The CMS decides what the offer is; it also prices it.
import { fallback, type Product } from "../data/products";
import { checkPromo, cmsEnabled, fetchOffers, fetchProducts, fetchPromos, type CartItem, type CmsOffer, type CmsPromo } from "./cms";
import { fromCms } from "./catalog";

export type Offer = CmsOffer;
export type Verdict = { percent: number; discount: number };
export type Item = CartItem;

/** 1 098 MAD, 988,20 MAD: decimals only when there are some. */
export const fmtMad = (n: number) =>
  `${n.toLocaleString("fr-FR", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

/**
 * The live « second bag » offer, or null when the CMS has none (disabled, expired, exhausted code…).
 * A "2nd item −X %" code (second_item_only) wins; otherwise a plain "buy N, save X %" bundle.
 * The product page toggle, the cart drawer and the checkout all read this one offer, so they always agree.
 */
export async function loadOffer(): Promise<Offer | null> {
  if (!cmsEnabled) return null;
  try {
    const all = (await fetchOffers()).filter((o) => o.percent > 0);
    return all.find((o) => o.second_item_only) ?? all.find((o) => o.type === "bundle" && o.quantity >= 2) ?? null;
  } catch { return null; }
}

/** Units the cart needs before the offer applies: a second-item code always needs two. */
export const minUnits = (offer: Offer) => (offer.second_item_only ? 2 : offer.quantity);

/**
 * The CMS discounts the LAST item it receives for a second-item code: put the offer's eligible lines last
 * (stable otherwise), so an out-of-scope line at the end of the cart can't cancel the offer. Harmless for other codes.
 */
export const offerOrder = <T extends { slug: string }>(items: T[], offer: Offer | null): T[] =>
  offer?.second_item_only ? [...items.filter((i) => !qualifies(offer, i.slug)), ...items.filter((i) => qualifies(offer, i.slug))] : items;

export type Promo = CmsPromo;
/** Codes the CMS advertises for this product, minus `except` (the code already shown as the second-bag offer). */
export async function loadPromos(slug: string, except?: string): Promise<Promo[]> {
  if (!cmsEnabled) return [];
  try {
    return (await fetchPromos()).filter((p) => p.percent > 0 && p.code !== except && (!p.products.length || p.products.includes(slug)));
  } catch { return []; }
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
