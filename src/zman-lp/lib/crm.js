/**
 * Commandes → le CRM de Maison Sabra (Payload), même base que la boutique.
 * `POST /orders` recalcule les prix côté serveur à partir du catalogue (par `slug`), valide le code promo,
 * crée la commande (statut « new ») et renvoie { order_number }. Les prix envoyés par le navigateur
 * ne sont donc jamais pris en compte.
 */
import { crmReady, crmPost, crmErrorCode } from "../../lib/crm";

export { crmReady };

/** id produit de la page (« rouge ») → slug du catalogue (« zman-rouge »). */
export const slugOf = (id) => "zman-" + id;

/** [ "rouge", "rouge", "vert" ] → [{ slug: "zman-rouge", qty: 1 }, …] — un élément par sac, l'ordre est conservé. */
export function toItems(ids) {
  return ids.map(function (id) { return { slug: slugOf(id), qty: 1 }; });
}

/** Source d'attribution : page, référent et paramètres UTM / fbclid de l'URL. */
function attribution() {
  var q = new URLSearchParams(location.search);
  return {
    landingPage: location.pathname,
    referrer: document.referrer || undefined,
    utmSource: q.get("utm_source") || undefined,
    utmMedium: q.get("utm_medium") || undefined,
    utmCampaign: q.get("utm_campaign") || undefined,
    fbclid: q.get("fbclid") || undefined,
  };
}

/**
 * Enregistre la commande. `customer` = { firstName, lastName, phone, address, city }, `ids` = un id produit par sac.
 * Renvoie { orderNumber }. Erreur `invalid_promo` : e.code === "invalid_promo".
 */
export async function placeOrder(customer, ids, promo, signal) {
  var res = await crmPost("/orders", Object.assign({
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    items: toItems(ids),
    source: "landing-page",
    attribution: attribution(),
  }, promo ? { promo: promo } : {}), signal);
  if (!res.ok) {
    var code = await crmErrorCode(res);
    var e = new Error(code || String(res.status));
    e.status = res.status;
    if (code) e.code = code;
    throw e;
  }
  var r = await res.json();
  return { orderNumber: r && r.order_number != null ? String(r.order_number) : "" };
}

/**
 * Interroge le CRM pour un code promo (même règle que la boutique et le panier).
 * Renvoie { percent, discount } si le code est actif ET valable pour ces sacs, sinon null.
 * `discount` = montant de la réduction (MAD) calculé par le serveur pour exactement ces articles.
 */
export async function checkPromo(code, ids, signal) {
  var res = await crmPost("/promo", { code: code, items: toItems(ids) }, signal);
  if (!res.ok) { var e = new Error(String(res.status)); e.status = res.status; throw e; }
  var r = await res.json();
  return r && r.percent > 0 ? { percent: Number(r.percent), discount: Number(r.discount) || 0 } : null;
}
