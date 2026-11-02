/** The three collections, shown in the mega-menu, the mobile drawer and the homepage showcase. */
export type CollectionCard = {
  slug: "zman" | "bladi" | "atar";
  name: string;
  /** One short line (menu). */
  short: string;
  /** Editorial line (homepage card). */
  line: string;
  /** Null while the collection is not on sale. */
  href: string | null;
  cta?: string;
  thumb: string;
  /** Studio shots sit on white: multiply them onto this colour field. */
  tone?: string;
};

export const collections: CollectionCard[] = [
  { slug: "zman", name: "Z’man", short: "Velours et dorures", line: "L’élégance des détails.", href: "/collection-zman", cta: "Découvrir Z’man", thumb: "/img/home/zman-480.webp" },
  { slug: "bladi", name: "Bladi", short: "Cuir et tissu berbère", line: "L’âme de nos origines.", href: "/collection-bladi", cta: "Découvrir Bladi", thumb: "/maisonsabra/Awray-sac-1-_ms-1000x999-480.webp", tone: "#efe6d6" },
  { slug: "atar", name: "Atar", short: "Une nouvelle histoire se prépare", line: "Une nouvelle expression se prépare.", href: null, thumb: "" },
];
