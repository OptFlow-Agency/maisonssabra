// Store-wide, CMS-managed settings the whole storefront shares: shipping threshold, announcement, trust messages.
// The server reads them once per page and embeds them (<script id="store-config">), so the cart and checkout
// never flash a stale value; the browser falls back to fetching them if that block is missing.
import { cmsEnabled, fetchContent, fetchSettings } from "./cms";

export type StoreConfig = {
  /** Subtotal after discounts from which delivery is free. null: the CMS has no free-delivery policy. */
  freeFrom: number | null;
  deliveryDelay: string | null;
  announcement: string | null;
  trust: { title: string; text: string | null; linkLabel: string | null; linkUrl: string | null }[];
  /** Labels of the enabled payment methods, e.g. « Paiement à la livraison ». */
  payments: string[];
  deliveryPolicyUrl: string | null;
  returnsPolicyUrl: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

/** Nothing is claimed while the CMS can't be read: no threshold, no announcement, no trust messages. */
export const emptyConfig: StoreConfig = { freeFrom: null, deliveryDelay: null, announcement: null, trust: [], payments: [], deliveryPolicyUrl: null, returnsPolicyUrl: null, whatsapp: null, instagram: null };

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
    deliveryDelay: s.shipping.delay,
    announcement: bar?.heading || bar?.body || s.announcement || null,
    trust: s.trust.map((t) => ({ title: t.title, text: t.text, linkLabel: t.link_label, linkUrl: url(t.link_url) })),
    payments: s.payment_methods.map((m) => m.label),
    deliveryPolicyUrl: url(s.policies.delivery),
    returnsPolicyUrl: url(s.policies.returns),
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
