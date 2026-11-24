/**
 * Catalogue Z'man — source unique : le CRM (collection « zman », produits actifs, triés par ordre).
 * Plus aucune donnée produit en dur : nom, prix, galerie, textes, avantages et fiche technique viennent de la base.
 * Champs absents côté CRM → valeur vide, et l'interface masque la ligne correspondante.
 */
import { crmReady, crmUrl } from "../../lib/crm";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const extra = (row, re) => (row.details?.extra || []).find((e) => re.test(e.label))?.value ?? null;

function image(im, name) {
  const src = im.sizes?.[800] || im.url;
  const w = im.sizes?.[800] ? 800 : im.width || 1000;
  const h = im.width && im.height ? Math.round((w * im.height) / im.width) : w;
  return { src, thumb: im.sizes?.[480] || src, w, h, alt: im.alt || name };
}

function toModel(row) {
  const id = row.slug.replace(/^zman-/, "");
  const collection = row.collection || "zman";
  const d = row.details || {};
  const dim = d.dimensions;
  const images = (row.images || []).map((im) => image(im, row.name));
  const first = row.images?.[0];
  return {
    id,
    collection,
    slug: row.slug,
    brand: "Maison Sabra",
    url: "https://maisonsabra.ma/produit/" + row.slug,
    wooProductId: row.slug,
    sku: row.sku,
    name: row.name,
    colorLabel: extra(row, /couleur|color/i) || (id.length > 14 ? row.name.split(" ").slice(0, 3).join(" ") : cap(id)),
    formLabel: row.name.replace(/^[^–-]*[–-]\s*/, "") || row.name,
    tagline: row.short_description || "",
    blurb: row.short_description || "",
    officialDescription: row.description || row.short_description || "",
    benefits: (row.benefits || []).map((b) => ({ title: b.title, description: b.description })),
    materials: d.materials || null,
    color: extra(row, /couleur|color/i),
    dimensions: dim && (dim.width || dim.height || dim.depth) ? `L ${dim.width ?? "?"} × H ${dim.height ?? "?"} × P ${dim.depth ?? "?"} cm` : null,
    weight: d.weight_g ? "≈ " + d.weight_g + " g" : null,
    care: d.care || null,
    thumb: first?.sizes?.[480] || first?.url || row.image,
    images,
    price: Number(row.price),
    referencePrice: row.was_price != null ? Number(row.was_price) : null,
    stock: row.stock_left,
    stockStatus: row.stock_status,
    promoEnd: row.promotion?.ends_at,
    isNew: !!row.is_new,
  };
}

async function fetchRows(url) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { credentials: "omit", signal: AbortSignal.timeout(25000) });
      if (res.ok) return await res.json();
      const body = (await res.text().catch(() => "")).slice(0, 300);
      last = new Error("Catalogue Z'man : le CRM a répondu " + res.status + " sur " + url + (body ? " — " + body : ""));
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  throw last;
}

// Écarte les photos qui ne s'affichent pas (fichier absent en stockage : 4xx, ou erreur serveur 5xx, ou réponse qui n'est pas une image).
// Un 5xx est retenté une fois ; une erreur réseau garde l'image (on ne retire que ce qui est prouvé cassé).
async function exists(url, retry = true) {
  try {
    // GET (certaines routes média refusent HEAD), limité au premier octet : on vérifie la photo sans la télécharger.
    const res = await fetch(url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(8000) });
    res.body?.cancel().catch(() => {});
    if (res.ok) return (res.headers.get("content-type") || "").startsWith("image/");
    if (res.status >= 500 && retry) return exists(url, false);
    return false;
  } catch {
    return true;
  }
}

async function dropBroken(rows) {
  return Promise.all(
    rows.map(async (r) => {
      const ok = await Promise.all((r.images || []).map((im) => exists(im.sizes?.[800] || im.url)));
      return { ...r, images: (r.images || []).filter((_, i) => ok[i]) };
    })
  );
}

async function fromDb(collection) {
  if (!crmReady) throw new Error("Catalogue : PUBLIC_CRM_URL et PUBLIC_CRM_TENANT sont requis (aucune donnée produit locale).");
  const rows = await fetchRows(crmUrl("/products?collection=" + collection));
  const out = (await dropBroken(rows)).filter((r) => r.images?.length).map(toModel);
  if (!out.length) throw new Error("Catalogue : aucun produit actif avec photo dans la collection « " + collection + " ».");
  return out;
}

const cache = new Map();
/** Produits d'une collection du CRM (« zman », « bladi »…), chargés une fois par démarrage du serveur. Dans le navigateur : vide (le catalogue est dans la page). */
export function loadCollection(collection) {
  if (typeof window !== "undefined") return Promise.resolve([]);
  // Un échec n'est pas gardé en cache : la requête suivante réessaie au lieu d'échouer jusqu'au redémarrage.
  if (!cache.has(collection)) cache.set(collection, fromDb(collection).catch((e) => { cache.delete(collection); throw e; }));
  return cache.get(collection);
}

export const products = await loadCollection("zman");
