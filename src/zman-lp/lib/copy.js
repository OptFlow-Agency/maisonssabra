import { config as C } from "../data/config.js";
import { products as P } from "../data/products.js";
import { computeOrder, formatMAD } from "./logic.js";

export const money = (n) => formatMAD(n, C.currency);
export const freeShip = !!(C.shipping && C.shipping.freeNationwide);
export const shipLong = freeShip ? "Livraison offerte partout au Maroc · Payez à la réception, après inspection" : "Paiement à la livraison · Frais de livraison selon votre ville";
export const shipShort = freeShip ? "Livraison gratuite partout au Maroc · Paiement à la livraison" : "Paiement à la livraison · Frais de livraison selon la ville";
export const shipMicro = freeShip ? "Livraison gratuite" : "Paiement à la livraison";
export const shipFrag = freeShip ? "Livraison Gratuite" : "Frais de livraison selon la ville";
export const noDot = (s) => String(s).replace(/\.$/, "");
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const waHref = (msg) => "https://wa.me/" + C.contact.whatsappNumber + (msg ? "?text=" + encodeURIComponent(msg) : "");

export const cities = ["Casablanca","Rabat","Marrakech","Fès","Tanger","Agadir","Meknès","Oujda","Kénitra","Tétouan","Salé","Témara","Mohammedia","El Jadida","Béni Mellal","Nador","Settat","Safi","Essaouira","Laâyoune","Dakhla","Errachidia","Khouribga","Larache","Ouarzazate","Taza","Al Hoceïma"];

export function faqItems() {
  return [
    ["Puis-je ouvrir le colis avant de payer ?", "Oui. Vous inspectez le sac avec le livreur et vous ne payez que s’il vous plaît."],
    ["Livrez-vous dans ma ville ?", "Livraison gratuite partout au Maroc. Délai : [À CONFIRMER]."],
    ["Et si la couleur ne me convient pas ?", "Retour ou échange possible sous 3 jours."],
    ["Les couleurs sont-elles fidèles aux photos ?", "[À CONFIRMER : photo ou vidéo réelle de la pièce par WhatsApp avant expédition]"],
    ["Comment entretenir le velours brodé ?", "[À CONFIRMER]"],
    ["Puis-je l’offrir ?", "Oui, l’écrin est offert. [À CONFIRMER : carte message]"],
    ["Comment vous joindre ?", '<a href="' + waHref() + '">Sur WhatsApp, 7j/7.</a>'],
  ];
}

/** JSON-LD Product/Offer (sans note, stock ni livraison inventés). */
export function productJsonLd(origin, list = P) {
  const abs = (src) => (/^https?:/.test(src) ? src : new URL(src, origin).href);
  return {
    "@context": "https://schema.org",
    "@graph": list.map((p) => ({
      "@type": "Product", "@id": p.url, name: p.name, url: p.url, brand: { "@type": "Brand", name: p.brand }, color: p.color, material: p.materials,
      description: p.officialDescription, image: p.images.map((i) => abs(i.src)),
      offers: { "@type": "Offer", price: String(p.price), priceCurrency: C.currency, availability: p.stockStatus && p.stockStatus !== "untracked" ? "https://schema.org/" + (p.stockStatus === "out_of_stock" ? "OutOfStock" : "InStock") : undefined, url: p.url },
    })),
  };
}
