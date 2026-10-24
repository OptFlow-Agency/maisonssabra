export const site = {
  name: "Maison Sabra",
  url: "https://maisonsabra.ma",
  locale: "fr_MA",
  tagline: "Sacs artisanaux marocains",
  description: "Sacs et pochettes artisanaux en velours, cuir et tissu berbère, inspirés du patrimoine marocain.",
  ogImage: "/img/hero-zman-beige.webp",
  instagram: "https://www.instagram.com/maison_sabra",
  // International format without "+" or spaces, e.g. "212612345678". The WhatsApp button stays hidden while this is empty.
  whatsapp: "",
  freeShippingFrom: 1000,
} as const;

export const whatsappLink = (text: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}` : "";
