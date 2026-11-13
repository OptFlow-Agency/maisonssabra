import { fallback, registerSizes, type Collection, type Product } from "../data/products";
import { crmReady, crmUrl } from "./crm";

type Sizes = Partial<Record<"480" | "800", string>>;
type Row = {
  slug: string; name: string; price: number; was_price: number | null;
  image: string | null; image2: string | null; image_sizes: Sizes; image2_sizes: Sizes;
  alt: string; description: string; is_new: boolean; collection: Collection | null;
};

const fromRow = (r: Row): Product => {
  // The CRM resizes uploads to its own file names; remember them so `variant()` can find the 480 / 800 versions.
  registerSizes(r.image!, r.image_sizes);
  if (r.image2) registerSizes(r.image2, r.image2_sizes);
  return {
    slug: r.slug,
    name: r.name,
    price: r.price,
    was: r.was_price ?? undefined,
    img: r.image!,
    img2: r.image2 ?? undefined,
    alt: r.alt || r.name,
    isNew: r.is_new,
    collection: r.collection as Collection,
    description: r.description || undefined,
  };
};

/** Active products in CRM order. Falls back to the bundled catalogue when the CRM is missing or errors. */
export async function getCatalog(): Promise<Product[]> {
  if (!crmReady) return fallback;
  try {
    const res = await fetch(crmUrl("/products"), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    // A product needs a photo and one of this store's two collections to be shown.
    return ((await res.json()) as Row[]).filter((r) => r.image && (r.collection === "bladi" || r.collection === "zman")).map(fromRow);
  } catch (e) {
    console.error("catalog: falling back to bundled products", e);
    return fallback;
  }
}

/** Product pages are rendered per request; let a CDN keep them for a minute so a new product is live almost at once. */
export const cacheShort = (res: ResponseInit & { headers: Headers }) =>
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
