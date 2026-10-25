import { fallback, type Collection, type Product } from "../data/products";

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

type Row = {
  slug: string; name: string; price: number; was_price: number | null; image: string; image2: string | null;
  alt: string; description: string; is_new: boolean; collection: Collection;
};

const fromRow = (r: Row): Product => ({
  slug: r.slug,
  name: r.name,
  price: r.price,
  was: r.was_price ?? undefined,
  img: r.image,
  img2: r.image2 ?? undefined,
  alt: r.alt || r.name,
  isNew: r.is_new,
  collection: r.collection,
  description: r.description || undefined,
});

/** Active products, newest first. Falls back to the bundled catalogue when Supabase is missing or errors. */
export async function getCatalog(): Promise<Product[]> {
  if (!URL || !KEY) return fallback;
  try {
    const res = await fetch(`${URL}/rest/v1/products?select=*&active=eq.true&order=sort_order.asc,created_at.desc`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    return ((await res.json()) as Row[]).map(fromRow);
  } catch (e) {
    console.error("catalog: falling back to bundled products", e);
    return fallback;
  }
}

/** Product pages are rendered per request; let a CDN keep them for a minute so a new product is live almost at once. */
export const cacheShort = (res: ResponseInit & { headers: Headers }) =>
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
