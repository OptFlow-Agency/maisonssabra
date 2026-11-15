export type Collection = "bladi" | "zman";

/** Pre-sized renditions of a CMS image. Bundled images follow the `name-480.webp` convention instead. */
export type Sizes = { 480?: string; 800?: string };

/** A CMS variant (colour, size…): own price, photo and stock. */
export type ProductVariant = {
  name: string; color?: string; img?: string; price: number; was?: number;
  /** False: sold out or switched off. Never inferred on the client. */
  purchasable: boolean;
  /** Units left, only when the CMS reports it as low (at or under its threshold). */
  left?: number;
};

export type Benefit = { icon: string; title: string; text?: string };

export type Product = {
  slug: string;
  name: string;
  price: number;
  /** Crossed-out price; absent when the product is not discounted. */
  was?: number;
  img: string;
  img2?: string;
  alt: string;
  isNew?: boolean;
  collection: Collection;
  description?: string;
  /** Units left, only present when the CMS reports stock as low. Absent: nothing is claimed about availability. */
  stock?: number;
  /** False when inventory is tracked and exhausted. Absent/true: can be bought. */
  purchasable?: boolean;
  /** Additional photos, in CMS order (img/img2 are the first two). */
  gallery?: string[];
  /** Active benefits in CMS order. Empty: the section is not shown. */
  benefits?: Benefit[];
  variants?: ProductVariant[];
  /** Name of a live scheduled promotion, when the CMS has one. */
  promoLabel?: string;
  shortDescription?: string;
};

type Seed = Omit<Product, "collection">;

const m = "/maisonsabra";
// Z’man studio shots (3/4 view on a light ground) and worn photos, from the Z’man shoot.
const z = "/assets/products";

const bladiSeed: Seed[] = [
  { slug: "azerwal", name: "Sac Azerwal en cuir bleu ciel et tissu berbère", price: 549, was: 890, img: `${m}/Azerwal-sac-3-_ms-1000x999.webp`, img2: `${m}/alt/azerwal.webp`, alt: "Sac Azerwal en cuir bleu ciel, rabat clouté et tissu berbère rayé" },
  { slug: "tazult", name: "Sac Tazult en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Tazult-sac-11-_ms-1000x999.webp`, img2: `${m}/alt/tazult.webp`, alt: "Sac Tazult en cuir violet et tissu berbère rayé" },
  { slug: "awray", name: "Sac Awray en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Awray-sac-1-_ms-1000x999.webp`, img2: `${m}/alt/awray.webp`, alt: "Sac Awray en cuir jaune moutarde et tissu berbère rayé" },
];

const zmanSeed: Seed[] = [
  { slug: "zman-multicolore", name: "Sac Z’man – Tissu velours multicolore & dorures", price: 549, was: 890, img: `${z}/multicolore-1.webp`, img2: `${z}/multicolore-3.webp`, alt: "Sac Z’man en velours multicolore rehaussé de dorures, chaîne dorée" },
  { slug: "zman-vert", name: "Sac Z’man – Velours vert & tissu doré", price: 549, was: 945, img: `${z}/vert-3.webp`, img2: `${z}/vert-1.webp`, alt: "Sac Z’man en velours vert sur tissu doré, chaîne dorée" },
  { slug: "zman-beige", name: "Sac Z’man – Velours beige brodé doré", price: 549, was: 949, img: `${z}/beige-5.webp`, img2: `${z}/beige-3.webp`, alt: "Sac Z’man en velours beige brodé de fils dorés, chaîne dorée" },
  { slug: "zman-rouge", name: "Sac Z’man – Velours rouge & tissu doré", price: 549, was: 990, img: `${z}/rouge-4.webp`, img2: `${z}/rouge-2.webp`, alt: "Sac Z’man en velours rouge à motifs sur tissu doré, chaîne dorée" },
  { slug: "zman-violet", name: "Sac Z’man – Violet royal & doré en velours relief", price: 549, was: 890, img: `${z}/violet-3.webp`, img2: `${z}/violet-1.webp`, alt: "Sac Z’man violet royal en velours relief doré, chaîne dorée", isNew: true },
];

/** Bundled catalogue: used only when the CMS is unreachable (see lib/catalog.ts). */
export const fallback: Product[] = [
  ...bladiSeed.map((p): Product => ({ ...p, collection: "bladi" })),
  ...zmanSeed.map((p): Product => ({ ...p, collection: "zman" })),
];

export const discount = (p: Product) => (p.was && p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0);

/**
 * Resized copies of an image. The bundled photos follow a `name-480.webp` convention; images served by the
 * CMS have their own generated names, which `fromCms()` registers here.
 */
const sized = new Map<string, Sizes>();
export const registerSizes = (src: string | undefined | null, sizes: Sizes | undefined) => {
  if (src && sizes && (sizes[480] || sizes[800])) sized.set(src, sizes);
};
export const variant = (src: string, w: 480 | 800) =>
  sized.get(src)?.[w] ?? (sized.has(src) || /^https?:/.test(src) ? src : src.replace(/\.webp$/, `-${w}.webp`));
export const srcset = (src: string) => `${variant(src, 480)} 480w, ${variant(src, 800)} 800w, ${src} 1000w`;

/** Neutral ground behind product photos (gallery, variants, cart). No colour-matched tints: the bag's own colours carry the image. */
export const tone = (_p?: Pick<Product, "slug" | "name">) => "#f4f2ef";
