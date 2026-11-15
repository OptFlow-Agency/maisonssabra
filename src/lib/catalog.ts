import { fallback, registerSizes, type Collection, type Product } from "../data/products";
import { cmsEnabled, fetchProducts, type CmsProduct } from "./cms";

/** Shared by the server (pages) and the browser (cart recommendations): CMS payload → storefront product. */
export function fromCms(r: CmsProduct): Product | null {
  const imgs = r.images.filter((i) => i.url);
  const first = imgs[0]?.url ?? r.image;
  if (!first) return null; // a product without a photo can't be shown
  registerSizes(first, imgs[0]?.sizes ?? r.image_sizes);
  imgs.forEach((i) => registerSizes(i.url, i.sizes));
  const second = imgs[1]?.url ?? r.image2 ?? undefined;
  registerSizes(second, imgs[1]?.sizes ?? r.image2_sizes);

  const variants = r.variants.map((v) => {
    registerSizes(v.image?.url, v.image?.sizes);
    return { name: v.name, color: v.color ?? undefined, img: v.image?.url, price: v.price, was: v.was_price ?? undefined, purchasable: v.purchasable, left: v.stock_left ?? undefined };
  });

  return {
    slug: r.slug,
    name: r.name,
    price: r.price,
    was: r.was_price ?? undefined,
    img: first,
    img2: second,
    gallery: imgs.map((i) => i.url),
    alt: r.alt || r.name,
    isNew: r.is_new,
    collection: (r.collection ?? "bladi") as Collection,
    description: r.description || undefined,
    shortDescription: r.short_description ?? undefined,
    stock: r.stock_left ?? undefined,
    purchasable: r.purchasable,
    benefits: r.benefits.map((b) => ({ icon: b.icon, title: b.title, text: b.description ?? undefined })),
    variants: variants.length ? variants : undefined,
    promoLabel: r.promotion?.label ?? undefined,
  };
}

/** Active products in the CMS's order. Falls back to the bundled catalogue only when the CMS is unreachable. */
export async function getCatalog(): Promise<Product[]> {
  if (!cmsEnabled) return fallback;
  try {
    return (await fetchProducts()).map(fromCms).filter((p): p is Product => !!p);
  } catch (e) {
    console.error("catalog: CMS unreachable, falling back to bundled products", e);
    return fallback;
  }
}

/** Product pages are rendered per request; let a CDN keep them for a minute so CMS edits are live almost at once. */
export const cacheShort = (res: ResponseInit & { headers: Headers }) =>
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
