export const site = {
  name: "Maison Sabra",
  url: "https://maisonsabra.ma",
  locale: "fr_MA",
  tagline: "Sacs artisanaux marocains",
  description: "Sacs et pochettes artisanaux en velours, cuir et tissu berbère, inspirés du patrimoine marocain.",
  ogImage: "/img/hero-zman-beige.webp",
  instagram: "https://www.instagram.com/maison_sabra",
  // Fallback WhatsApp number (international format, no "+"). The CMS value (settings → contact) wins when set.
  whatsapp: "",
  // Shipping thresholds, low-stock limits, offers and discounts are managed in the CMS: see lib/store.ts and lib/offer.ts.
} as const;

export const whatsappLink = (text: string, number?: string | null) => {
  const n = number || site.whatsapp;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "";
};
