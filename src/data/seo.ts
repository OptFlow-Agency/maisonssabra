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

export const productLd = (p: Product, description: string, collection: string) => ({
  "@type": "Product",
  name: p.name,
  description,
  image: [p.img, p.img2].filter(Boolean).map((i) => abs(i!)),
  sku: p.slug,
  brand: { "@type": "Brand", name: site.name },
  category: collection,
  offers: {
    "@type": "Offer",
    url: abs(`/produit/${p.slug}`),
    priceCurrency: "MAD",
    price: p.price,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": abs("/#organization") },
  },
});

export const itemListLd = (products: Product[]) => ({
  "@type": "ItemList",
  itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/produit/${p.slug}`), name: p.name, image: abs(variant(p.img, 800)) })),
});
