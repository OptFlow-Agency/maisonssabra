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
  /** Free delivery is judged on the amount actually payable (after discounts), so the cart never promises what checkout would charge. */
  freeShippingAfterDiscount: true,
  /**
   * « 2 sacs = -10 % ». The discount itself lives in Supabase: this code must exist (admin → Codes promo), be active,
   * cover every bag that should qualify, and have « 2e article » UNCHECKED. The cart only shows an offer or a discount
   * that `apply_promo` has confirmed, and `place_order` recomputes it at checkout.
   */
  bundle: { code: "BAG23", minBags: 2 },
} as const;

export const whatsappLink = (text: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}` : "";
