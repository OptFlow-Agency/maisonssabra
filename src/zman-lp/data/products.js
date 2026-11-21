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
  return { src, w, h, alt: im.alt || name };
}

function toModel(row) {
  const id = row.slug.replace(/^zman-/, "");
  const d = row.details || {};
  const dim = d.dimensions;
  const images = (row.images || []).map((im) => image(im, row.name));
  const first = row.images?.[0];
  return {
    id,
    slug: row.slug,
    brand: "Maison Sabra",
    url: "https://maisonsabra.ma/produit/" + row.slug,
    wooProductId: row.slug,
    sku: row.sku,
    name: row.name,
    colorLabel: extra(row, /couleur|color/i) || cap(id),
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

async function fromDb() {
  if (!crmReady) throw new Error("Catalogue Z'man : PUBLIC_CRM_URL et PUBLIC_CRM_TENANT sont requis (aucune donnée produit locale).");
  const res = await fetch(crmUrl("/products?collection=zman"), { credentials: "omit", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Catalogue Z'man : le CRM a répondu " + res.status);
  const rows = await res.json();
  const out = rows.filter((r) => r.images?.length).map(toModel);
  if (!out.length) throw new Error("Catalogue Z'man : aucun produit actif avec photo dans la collection « zman ».");
  return out;
}

export const products = await fromDb();
