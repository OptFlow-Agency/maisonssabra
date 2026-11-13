import { site } from "./site";
import { variant, type Product } from "./products";

const abs = (path: string) => new URL(path, site.url).href;

export const breadcrumbLd = (crumbs: [name: string, path: string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })),
});

export const organizationLd = () => ({
  "@type": "Organization",
  "@id": abs("/#organization"),
  name: site.name,
  url: site.url,
  logo: abs("/img/logo-ms.png"),
  sameAs: [site.instagram],
});

export const websiteLd = () => ({
  "@type": "WebSite",
  "@id": abs("/#website"),
  url: site.url,
  name: site.name,
  inLanguage: "fr",
  publisher: { "@id": abs("/#organization") },
});

export const productLd = (p: Product, description: string, collection: string, rating?: { average: number; count: number } | null) => ({
  "@type": "Product",
  name: p.name,
  description,
  image: (p.gallery?.length ? p.gallery : [p.img, p.img2]).filter(Boolean).map((i) => abs(i!)),
  sku: p.slug,
  brand: { "@type": "Brand", name: site.name },
  category: collection,
  offers: {
    "@type": "Offer",
    url: abs(`/produit/${p.slug}`),
    priceCurrency: "MAD",
    price: p.price,
    availability: p.purchasable === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": abs("/#organization") },
  },
  // Only genuine, approved reviews from the CMS: the block is omitted when there are none.
  ...(rating && rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count } } : {}),
});

export const itemListLd = (products: Product[]) => ({
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/produit/${p.slug}`), name: p.name, image: abs(variant(p.img, 800)) })),
});
