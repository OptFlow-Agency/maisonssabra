// Everything the homepage takes from the CMS, read through the existing store API (content-sections, collections, stories, products).
// Each part is optional: when the CMS has nothing for a section (or can't be reached) the component keeps its approved default copy
// and imagery, so the page is never blank and a section the CMS doesn't mention is never invented.
import { collections as staticCollections, type CollectionCard } from "../data/collections";
import type { Product } from "../data/products";
import { fromCms } from "./catalog";
import { cmsEnabled, fetchCollections, fetchContent, fetchProducts, fetchStories, type CmsMedia, type CmsSection } from "./cms";

export type Pic = { src: string; srcset?: string; alt: string; w?: number; h?: number };
type Link = { label: string; href: string };

export const pic = (m: CmsMedia | null | undefined, fallbackAlt = ""): Pic | null => {
  if (!m?.url) return null;
  const set = [m.sizes[480] && `${m.sizes[480]} 480w`, m.sizes[800] && `${m.sizes[800]} 800w`, m.width && `${m.url} ${m.width}w`].filter(Boolean).join(", ");
  return { src: m.sizes[800] ?? m.url, srcset: set || undefined, alt: m.alt || fallbackAlt, w: m.width ?? undefined, h: m.height ?? undefined };
};

const paragraphs = (s: string | null) => (s ? s.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean) : []);
/** Only same-site paths or http(s) links from the CMS are ever rendered as hrefs. */
const safeLink = (c: { label: string; href: string } | null): Link | null => (c && /^(\/(?!\/)|#|https?:\/\/)/.test(c.href) ? c : null);
const quiet = async <T>(p: () => Promise<T>, empty: T): Promise<T> => {
  if (!cmsEnabled) return empty;
  try { return await p(); } catch (e) { console.error("home: CMS read failed, using defaults", e); return empty; }
};

export type HomeCollection = CollectionCard & { image: Pic | null; comingSoon: boolean };

export type Home = {
  hero: { heading: string | null; body: string | null; cta: Link | null; image: Pic | null; imageMobile: Pic | null } | null;
  collections: HomeCollection[];
  featured: { heading: string | null; body: string | null; products: Product[] };
  mission: { heading: string | null; paragraphs: string[]; cta: Link | null; image: Pic | null } | null;
  craft: { heading: string | null; body: string | null; details: { pic: Pic; label: string }[] } | null;
};

export async function loadHome(catalog: Product[]): Promise<Home> {
  const [sections, cols, stories, featuredRaw] = await Promise.all([
    quiet(() => fetchContent("home"), [] as CmsSection[]),
    quiet(() => fetchCollections(), []),
    quiet(() => fetchStories("craftsmanship"), []),
    quiet(() => fetchProducts("?featured=1"), []),
  ]);
  // "global" sections come back too; the homepage only uses its own.
  const home = sections.filter((s) => s.placement === "home");
  const first = (type: string) => home.find((s) => s.type === type);

  const h = first("hero");
  const hero: Home["hero"] = h ? { heading: h.heading, body: h.body, cta: safeLink(h.cta), image: pic(h.image, h.heading ?? ""), imageMobile: pic(h.image_mobile, h.heading ?? "") } : null;

  // Collections: the CMS decides which exist, their order and whether they're on the homepage (the "featured" flag; none flagged → all).
  const live = (slug: string) => catalog.some((p) => p.collection === slug);
  const flagged = cols.filter((c) => c.featured);
  const shown = (flagged.length ? flagged : cols).slice(0, 3);
  const collections: HomeCollection[] = cmsEnabled && cols.length
    ? shown.map((c) => {
        const base = staticCollections.find((s) => s.slug === c.slug);
        const comingSoon = !live(c.slug);
        return {
          slug: c.slug as CollectionCard["slug"], name: c.name,
          short: base?.short ?? "", line: c.description || base?.line || "",
          href: comingSoon ? null : base?.href ?? "/boutique", cta: base?.cta ?? `Découvrir ${c.name}`,
          thumb: base?.thumb ?? "", tone: base?.tone, image: pic(c.image, c.name), comingSoon,
        };
      })
    : staticCollections.map((c) => ({ ...c, image: null, comingSoon: !c.href }));

  // Featured pieces: the homepage section's own list, else products flagged "featured" in the CMS, else the CMS's first products.
  const f = first("featured-products");
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  const picked = (f?.products ?? []).map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
  const flaggedProducts = featuredRaw.map(fromCms).filter((p): p is Product => !!p);
  const products = (picked.length ? picked : flaggedProducts.length ? flaggedProducts : catalog).slice(0, 6);

  const m = first("story");
  const mission: Home["mission"] = m ? { heading: m.heading, paragraphs: paragraphs(m.body), cta: safeLink(m.cta), image: pic(m.image, m.heading ?? "") } : null;

  const s = stories.find((x) => x.images.length > 0);
  const craft: Home["craft"] = s ? { heading: s.title, body: s.excerpt, details: s.images.slice(0, 3).map((i) => ({ pic: pic(i, i.caption ?? s.title)!, label: i.caption ?? i.alt })) } : null;

  return { hero, collections, featured: { heading: f?.heading ?? null, body: f?.body ?? null, products }, mission, craft };
}
