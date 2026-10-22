export type Product = {
  slug: string;
  name: string;
  price: number;
  was: number;
  img: string;
  img2?: string;
  alt: string;
  isNew?: boolean;
};

const m = "/maisonsabra";

export const bladi: Product[] = [
  { slug: "azerwal", name: "Sac Azerwal en cuir bleu ciel et tissu berbère", price: 549, was: 890, img: `${m}/Azerwal-sac-3-_ms-1000x999.webp`, img2: `${m}/alt/azerwal.webp`, alt: "Sac Azerwal en cuir bleu ciel, rabat clouté et tissu berbère rayé" },
  { slug: "tazult", name: "Sac Tazult en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Tazult-sac-11-_ms-1000x999.webp`, img2: `${m}/alt/tazult.webp`, alt: "Sac Tazult en cuir violet et tissu berbère rayé" },
  { slug: "awray", name: "Sac Awray en cuir et tissu berbère", price: 549, was: 890, img: `${m}/Awray-sac-1-_ms-1000x999.webp`, img2: `${m}/alt/awray.webp`, alt: "Sac Awray en cuir jaune moutarde et tissu berbère rayé" },
];

export const zman: Product[] = [
  { slug: "zman-multicolore", name: "Sac Z’man – Tissu velours multicolore & dorures", price: 549, was: 890, img: `${m}/083A5723-_ms-1000x988.webp`, img2: `${m}/alt/multicolore.webp`, alt: "Sac Z’man en velours multicolore rehaussé de dorures, chaîne dorée" },
  { slug: "zman-vert", name: "Sac Z’man – Velours vert & tissu doré", price: 549, was: 945, img: `${m}/083A5723ms-verte-_ms-1000x988.webp`, img2: `${m}/alt/vert.webp`, alt: "Sac Z’man en velours vert sur tissu doré, chaîne dorée" },
  { slug: "zman-beige", name: "Sac Z’man – Velours beige brodé doré", price: 549, was: 949, img: `${m}/083A5723ms-blan-casser-_ms-1000x988.webp`, img2: `${m}/alt/beige.webp`, alt: "Sac Z’man en velours beige brodé de fils dorés, chaîne dorée" },
  { slug: "zman-rouge", name: "Sac Z’man – Velours rouge & tissu doré", price: 549, was: 990, img: `${m}/083A5723ms-rouge-_ms-1000x988.webp`, alt: "Sac Z’man en velours rouge à motifs sur tissu doré, chaîne dorée" },
  { slug: "zman-violet", name: "Sac Z’man – Violet royal & doré en velours relief", price: 549, was: 890, img: `${m}/083A5538-_ms-1000x988.webp`, img2: `${m}/alt/violet.webp`, alt: "Sac Z’man violet royal en velours relief doré, chaîne dorée", isNew: true },
];

export const discount = (p: Product) => Math.round((1 - p.price / p.was) * 100);
