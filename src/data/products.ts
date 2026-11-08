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

const bladiSeed: Seed[] = [
  { slug: "azerwal", name: "Sac Azerwal en cuir bleu ciel et tissu berbère", price: 549, was: 890, img: `${m}/Azerwal-sac-3-_ms-1000x999.webp`, img2: `${m}/alt/azerwal.webp`, alt: "Sac Azerwal en cuir bleu ciel, rabat clouté et tissu berbère rayé" },
  { slug: "tazult", name: "Sac Tazult en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Tazult-sac-11-_ms-1000x999.webp`, img2: `${m}/alt/tazult.webp`, alt: "Sac Tazult en cuir violet et tissu berbère rayé" },
  { slug: "awray", name: "Sac Awray en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Awray-sac-1-_ms-1000x999.webp`, img2: `${m}/alt/awray.webp`, alt: "Sac Awray en cuir jaune moutarde et tissu berbère rayé" },
];

const zmanSeed: Seed[] = [
  { slug: "zman-multicolore", name: "Sac Z’man – Tissu velours multicolore & dorures", price: 549, was: 890, img: `${m}/083A5723-_ms-1000x988.webp`, img2: `${m}/alt/multicolore.webp`, alt: "Sac Z’man en velours multicolore rehaussé de dorures, chaîne dorée" },
  { slug: "zman-vert", name: "Sac Z’man – Velours vert & tissu doré", price: 549, was: 945, img: `${m}/083A5723ms-verte-_ms-1000x988.webp`, img2: `${m}/alt/vert.webp`, alt: "Sac Z’man en velours vert sur tissu doré, chaîne dorée" },
  { slug: "zman-beige", name: "Sac Z’man – Velours beige brodé doré", price: 549, was: 949, img: `${m}/083A5723ms-blan-casser-_ms-1000x988.webp`, img2: `${m}/alt/beige.webp`, alt: "Sac Z’man en velours beige brodé de fils dorés, chaîne dorée" },
  { slug: "zman-rouge", name: "Sac Z’man – Velours rouge & tissu doré", price: 549, was: 990, img: `${m}/083A5723ms-rouge-_ms-1000x988.webp`, alt: "Sac Z’man en velours rouge à motifs sur tissu doré, chaîne dorée" },
  { slug: "zman-violet", name: "Sac Z’man – Violet royal & doré en velours relief", price: 549, was: 890, img: `${m}/083A5538-_ms-1000x988.webp`, img2: `${m}/alt/violet.webp`, alt: "Sac Z’man violet royal en velours relief doré, chaîne dorée", isNew: true },
];

/** Bundled catalogue: used only when Supabase is unreachable (see lib/catalog.ts). */
export const fallback: Product[] = [
  ...bladiSeed.map((p): Product => ({ ...p, collection: "bladi" })),
  ...zmanSeed.map((p): Product => ({ ...p, collection: "zman" })),
];

export const discount = (p: Product) => (p.was && p.was > p.price ? Math.round((1 - p.price / p.was) * 100) : 0);

/** Responsive variants generated next to each source file: `name-480.webp`, `name-800.webp`. */
const sizeOf = new Map<string, Sizes>();
/** Remember the renditions the CMS generated for an image (their names do not follow the bundled convention). */
export const registerSizes = (src: string | undefined | null, sizes: Sizes | undefined) => { if (src && sizes && (sizes[480] || sizes[800])) sizeOf.set(src, sizes); };
export const variant = (src: string, w: 480 | 800) => sizeOf.get(src)?.[w] ?? (sizeOf.has(src) || /^https?:/.test(src) ? src : src.replace(/\.webp$/, `-${w}.webp`));
export const srcset = (src: string) => `${variant(src, 480)} 480w, ${variant(src, 800)} 800w, ${src} 1000w`;

/** Neutral ivory field behind each photo: studio shots are on white, so they multiply onto it and the bag keeps its true colours. */
export const tone = (_p?: Pick<Product, "slug" | "name">) => "#efe6d6";
