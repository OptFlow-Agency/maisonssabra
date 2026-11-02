// Shared by the cart drawer and the checkout: one source for the « 2 sacs » offer, its server check and money formatting.
import { site } from "../data/site";
import { fallback, type Product } from "../data/products";
import { fromRow, type Row } from "./catalog";

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const offerEnabled = !!(URL && KEY);
export const bundle = site.bundle;
export type Item = { slug: string; qty: number };
export type Verdict = { percent: number; discount: number };

/** 1 098 MAD, 988,20 MAD: decimals only when there are some. */
export const fmtMad = (n: number) =>
  `${n.toLocaleString("fr-FR", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

const rpc = (fn: string, body: object) =>
  fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY!, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });

/** Asks the server what the bundle code is worth for these items. null: not valid for them, or unreachable. */
export async function verify(items: Item[]): Promise<Verdict | null> {
  if (!offerEnabled || !items.length) return null;
  try {
    const res = await rpc("apply_promo", { p_code: bundle.code, p_items: items });
    if (!res.ok) return null;
    const r = (await res.json()) as { percent: number; discount: number } | null;
    return r && r.percent > 0 ? { percent: Number(r.percent), discount: Number(r.discount) || 0 } : null;
  } catch { return null; }
}

let bags: Promise<Product[]> | undefined;
/** Active products (same source as the shop), fetched once. Falls back to the bundled catalogue. */
export function loadBags(): Promise<Product[]> {
  bags ??= (async () => {
    if (!offerEnabled) return fallback;
    try {
      const res = await fetch(`${URL}/rest/v1/products?select=*&active=eq.true&order=sort_order.asc,created_at.desc`, { headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` } });
      if (!res.ok) throw new Error(String(res.status));
      return ((await res.json()) as Row[]).map(fromRow);
    } catch { return fallback; }
  })();
  return bags;
}

const probes = new Map<string, Promise<Verdict | null>>();
/** What two of this bag would earn. Also tells us whether the bag qualifies at all. Cached per slug. */
export const probe = (slug: string) => {
  if (!probes.has(slug)) probes.set(slug, verify([{ slug, qty: 2 }]));
  return probes.get(slug)!;
};

export const countBags = (lines: readonly { id: string; qty: number }[], eligible: Set<string>) =>
  lines.reduce((n, l) => n + (eligible.has(l.id) ? l.qty : 0), 0);
