// Store-wide, CMS-managed settings the whole storefront shares: shipping threshold, announcement, trust messages.
// The server reads them once per page and embeds them (<script id="store-config">), so the cart and checkout
// never flash a stale value; the browser falls back to fetching them if that block is missing.
import { cmsEnabled, fetchContent, fetchSettings } from "./cms";

export type StoreConfig = {
  /** Subtotal after discounts from which delivery is free. null: the CMS has no free-delivery policy. */
  freeFrom: number | null;
  /** Store-wide delivery cost when no city zone applies (the CMS default). */
  shippingCost: number;
  /** True when city zones exist: the cost is only known once the delivery city is. */
  zoned: boolean;
  /** Active delivery zones (CMS shipping-zones): the cities they cover, their cost and free-delivery threshold. */
  zones: { cities: string[]; cost: number; freeFrom: number | null }[];
  deliveryDelay: string | null;
  announcement: string | null;
  trust: { title: string; text: string | null; linkLabel: string | null; linkUrl: string | null }[];
  /** Labels of the enabled payment methods, e.g. « Paiement à la livraison ». */
  payments: string[];
  deliveryPolicyUrl: string | null;
  returnsPolicyUrl: string | null;
  /** Returns window (days) and summary, as written in the CMS. */
  returnsDays: number | null;
  returnsSummary: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

/** Nothing is claimed while the CMS can't be read: no threshold, no announcement, no trust messages. */
export const emptyConfig: StoreConfig = { freeFrom: null, shippingCost: 0, zoned: false, zones: [], deliveryDelay: null, announcement: null, trust: [], payments: [], deliveryPolicyUrl: null, returnsPolicyUrl: null, returnsDays: null, returnsSummary: null, whatsapp: null, instagram: null };

const mad = (n: number) => n.toLocaleString("fr-FR");
/** « Livraison offerte dès 1 000 MAD d’achat », built from the CMS threshold. */
export const freeShippingText = (c: Pick<StoreConfig, "freeFrom">) => (c.freeFrom != null ? `Livraison offerte dès ${mad(c.freeFrom)} MAD d’achat` : null);

const url = (v: string | null | undefined) => (v && /^https?:\/\//.test(v) ? v : null);

export async function loadStoreConfig(): Promise<StoreConfig> {
  if (!cmsEnabled) return emptyConfig;
  const [settings, content] = await Promise.allSettled([fetchSettings(), fetchContent("global")]);
  const s = settings.status === "fulfilled" ? settings.value : null;
  if (!s) return emptyConfig;
  const bar = content.status === "fulfilled" ? content.value.find((c) => c.type === "announcement") : undefined;
  return {
    freeFrom: s.shipping.free_from,
    shippingCost: s.shipping.default_cost ?? 0,
    zoned: (s.shipping.zones?.length ?? 0) > 0,
    zones: (s.shipping.zones ?? []).map((z) => ({ cities: z.cities, cost: z.cost, freeFrom: z.free_above })),
    deliveryDelay: s.shipping.delay,
    announcement: bar?.heading || bar?.body || s.announcement || null,
    trust: s.trust.map((t) => ({ title: t.title, text: t.text, linkLabel: t.link_label, linkUrl: url(t.link_url) })),
    payments: s.payment_methods.map((m) => m.label),
    deliveryPolicyUrl: url(s.policies.delivery),
    returnsPolicyUrl: url(s.policies.returns),
    returnsDays: s.returns?.window_days ?? null,
    returnsSummary: s.returns?.summary || null,
    whatsapp: s.contact.whatsapp,
    instagram: s.contact.instagram,
  };
}

/** Browser side: the server-embedded copy, else a fresh read. */
export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const raw = document.getElementById("store-config")?.textContent;
    if (raw) return JSON.parse(raw) as StoreConfig;
  } catch { /* fall through to a fresh read */ }
  return loadStoreConfig();
}

/**
 * Delivery for a cart, mirroring the CMS order hook (Orders/hooks/prepareOrder): free once what is payable *after discounts*
 * reaches the threshold; otherwise the city zone's cost (unknown until the city is) or the store default.
 * Shared by the cart drawer and checkout so both always agree with the order the CMS will create.
 */
export type ShippingQuote = { cost: number | null; free: boolean; label: string; left: number | null };
export function shippingQuote(c: Pick<StoreConfig, "freeFrom" | "shippingCost" | "zoned"> & { zones?: StoreConfig["zones"] }, payable: number, city?: string): ShippingQuote {
  const fmt = (n: number) => `${n.toLocaleString("fr-FR", Number.isInteger(n) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
  // City known and covered by a zone: that zone's cost and threshold, exactly like the CMS (zone first, then store defaults).
  const key = city?.trim().toLowerCase();
  const zone = key ? c.zones?.find((z) => z.cities.some((x) => x.trim().toLowerCase() === key)) : undefined;
  const freeFrom = zone ? zone.freeFrom : c.freeFrom;
  const left = freeFrom != null ? Math.max(0, Math.round((freeFrom - payable) * 100) / 100) : null;
  if (freeFrom != null && payable >= freeFrom) return { cost: 0, free: true, label: "Offerte", left: 0 };
  if (zone) return { cost: zone.cost, free: zone.cost === 0, label: zone.cost > 0 ? fmt(zone.cost) : "Offerte", left };
  if (c.zoned && !key) return { cost: null, free: false, label: "Selon votre ville", left };
  if (c.shippingCost > 0) return { cost: c.shippingCost, free: false, label: fmt(c.shippingCost), left };
  // No zone and no default cost: the CMS charges nothing, so say so rather than promise a threshold that changes nothing.
  return { cost: 0, free: true, label: "Offerte", left: null };
}
