import { lockScroll } from "./smooth";
import { countBags, fmtMad, loadBags, loadOffer, qualifies, verify, type Offer, type Verdict } from "../lib/offer";
import { emptyConfig, getStoreConfig, loadStoreConfig, shippingQuote, type StoreConfig } from "../lib/store";
import { invalidateCms } from "../lib/cms";
import { buildOffer, buildRecs } from "./cart-offer";
import type { Product } from "../data/products";

// Cart lives in localStorage; checkout (/commande) reads it and sends the order to the CMS.
// `id` is the product slug; `variant` is the CMS variant name when the product has variants.
export type Line = { id: string; name: string; price: number; img: string; qty: number; variant?: string; unavailable?: boolean };

const KEY = "ms-cart";
const MAX_QTY = 9;
const fmt = fmtMad;

let lines: Line[] = [];
try { lines = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { lines = []; }

const same = (a: { id: string; variant?: string }, b: { id: string; variant?: string }) => a.id === b.id && (a.variant ?? "") === (b.variant ?? "");
const count = () => buyable().reduce((n, l) => n + l.qty, 0);
const buyable = () => lines.filter((l) => !l.unavailable);
export const getLines = (): readonly Line[] => lines;
/** What can actually be ordered: lines the catalogue no longer sells are left out. */
export const getBuyableLines = (): readonly Line[] => buyable();
export const clearCart = () => { lines = []; commit(); };
export const subtotal = () => buyable().reduce((n, l) => n + l.qty * l.price, 0);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} };

// Store settings from the CMS: delivery threshold and cost, payment methods, returns, contact (empty: nothing is claimed).
let store: StoreConfig = emptyConfig;
getStoreConfig().then((c) => { store = c; render(); }).catch(() => {});

function commit() {
  save();
  const n = count();
  document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((el) => {
    const changed = el.textContent !== String(n);
    el.textContent = String(n);
    if (changed) el.animate([{ transform: "scale(1.5)" }, { transform: "scale(1)" }], { duration: 400, easing: "cubic-bezier(0.16,1,0.3,1)" });
  });
  document.querySelectorAll<HTMLElement>("[data-cart-link]").forEach((el) => el.setAttribute("aria-label", `Panier, ${n} article${n > 1 ? "s" : ""}`));
  document.dispatchEvent(new CustomEvent("cart:change", { detail: { count: n } }));
  render();
  refreshOffer();
}

/* ---------- Quantity offer: defined by the CMS, shown and applied only when the CMS (POST /promo) confirms it ---------- */
const offer = { cfg: null as Offer | null, bags: [] as Product[], eligible: new Map<string, Verdict | null>(), verdict: null as Verdict | null, example: null as Verdict | null, showAll: false };
let offerSeq = 0;
const live = (msg: string) => { const l = document.querySelector<HTMLElement>("[data-cart-live]"); if (l) { l.textContent = ""; setTimeout(() => (l.textContent = msg), 50); } };
export const getBundleVerdict = () => offer.verdict;
export const getOffer = () => offer.cfg;

/** Brings saved lines in line with the live catalogue: current price, and « no longer available » when a product or variant is gone or sold out. */
function reconcile(bags: Product[]) {
  let changed = false;
  for (const l of lines) {
    const p = bags.find((b) => b.slug === l.id);
    const v = l.variant ? p?.variants?.find((x) => x.name === l.variant) : undefined;
    const gone = !p || p.purchasable === false || (!!l.variant && (!v || !v.purchasable));
    const price = v?.price ?? p?.price;
    if (!!l.unavailable !== gone) { l.unavailable = gone || undefined; changed = true; }
    if (!gone && price != null && price !== l.price) { l.price = price; changed = true; }
  }
  return changed;
}

/** Re-reads the catalogue and offer from the CMS right now (e.g. after checkout was refused on stale data). */
export function resyncCart() { invalidateCms(); return refreshOffer(); }

async function refreshOffer() {
  const my = ++offerSeq;
  const wasUnlocked = !!offer.verdict;
  if (!lines.length) { offer.verdict = null; offer.example = null; render(); return; }
  const [cfg, bags, fresh] = await Promise.all([loadOffer(), loadBags(), loadStoreConfig().catch(() => null)]);
  if (my !== offerSeq) return;
  if (fresh) store = fresh;
  offer.bags = bags;
  if (reconcile(bags)) { save(); document.dispatchEvent(new CustomEvent("cart:change", { detail: { count: count() } })); }
  offer.cfg = cfg;
  offer.eligible = new Map(cfg ? bags.map((b) => [b.slug, qualifies(cfg, b.slug) ? { percent: cfg.percent, discount: 0 } : null] as const) : []);
  if (!cfg) { offer.verdict = null; offer.example = null; render(); if (wasUnlocked) live("Votre réduction n’est plus appliquée."); return; }

  const items = buyable().map((l) => ({ slug: l.id, qty: l.qty, ...(l.variant ? { variant: l.variant } : {}) }));
  const n = countBags(buyable(), cfg);
  const v = n >= cfg.quantity ? await verify(cfg, items) : null;
  // An example of what the next unit earns, taken from the CMS pricing of the first qualifying line.
  const first = buyable().find((l) => qualifies(cfg, l.id));
  const ex = !v && first ? await verify(cfg, [{ slug: first.id, qty: cfg.quantity, ...(first.variant ? { variant: first.variant } : {}) }]) : null;
  if (my !== offerSeq) return;
  offer.verdict = v;
  offer.example = ex;
  render();
  if (v && !wasUnlocked) live(`Votre avantage de ${v.percent} % est débloqué. Réduction : ${fmtMad(v.discount)}.`);
  if (!v && wasUnlocked) live("Votre réduction n’est plus appliquée.");
}

export function addToCart(item: Omit<Line, "qty" | "unavailable">) {
  const l = lines.find((x) => same(x, item));
  if (l) l.qty = Math.min(MAX_QTY, l.qty + 1); else lines.push({ ...item, qty: 1 });
  commit();
}
const setQty = (target: Line, q: number) => {
  const l = lines.find((x) => same(x, target));
  if (!l) return;
  if (q <= 0) lines = lines.filter((x) => x !== l); else l.qty = Math.min(MAX_QTY, q);
  commit();
};

/* ---------- Drawer ---------- */
const dlg = document.querySelector<HTMLDialogElement>("[data-cart-dialog]");
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
let opener: HTMLElement | null = null;

function open() {
  if (!dlg || dlg.open) return;
  opener = document.activeElement as HTMLElement | null;
  dlg.showModal();
  lockScroll(true);
  requestAnimationFrame(() => (dlg.dataset.open = "true"));
}
/** Opens the cart drawer; a no-op if it is already open or the page has none. */
export const openCart = () => open();
function close() {
  if (!dlg || !dlg.open) return;
  dlg.dataset.open = "false";
  const done = () => { dlg.close(); lockScroll(false); opener?.focus(); };
  matchMedia("(prefers-reduced-motion: reduce)").matches ? done() : setTimeout(done, 380);
}

function render() {
  if (!dlg) return;
  const list = dlg.querySelector<HTMLElement>("[data-cart-lines]")!;
  const empty = dlg.querySelector<HTMLElement>("[data-cart-empty]")!;
  const foot = dlg.querySelector<HTMLElement>("[data-cart-foot]")!;
  const extras = dlg.querySelector<HTMLElement>("[data-cart-extras]")!;
  const bar = dlg.querySelector<HTMLElement>("[data-free-bar]")!;
  const msg = dlg.querySelector<HTMLElement>("[data-free-msg]")!;
  const total = dlg.querySelector<HTMLElement>("[data-cart-total]")!;
  const n = count();
  dlg.querySelector<HTMLElement>("[data-cart-title-count]")!.textContent = n ? `${n} article${n > 1 ? "s" : ""}` : "";

  list.replaceChildren(...lines.map((l) => {
    // Catalogue facts for this line (original price, low stock), straight from the CMS read in refreshOffer().
    const p = offer.bags.find((b) => b.slug === l.id);
    const v = l.variant ? p?.variants?.find((x) => x.name === l.variant) : undefined;
    const was = (v ? v.was : p?.was) ?? 0;
    const left = v ? v.left : p?.stock;
    const li = el("li", `grid grid-cols-[5.5rem_1fr] gap-4 py-4${l.unavailable ? " opacity-70" : ""}`);
    const frame = el("span", "block aspect-square overflow-hidden rounded-md bg-[#f4f2ef]");
    const img = el("img", "size-full object-cover");
    img.src = l.img; img.alt = ""; img.width = 88; img.height = 88; img.decoding = "async";
    frame.append(img);
    const body = el("div", "grid min-w-0 content-between gap-2.5");
    const top = el("div", "grid gap-1");
    const head = el("div", "flex items-start justify-between gap-2");
    head.append(el("p", "m-0 line-clamp-2 text-[0.9375rem] leading-snug font-medium text-ink", l.name));
    const rm = el("button", "-mt-1.5 -mr-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-soft transition-colors hover:bg-gold/10 hover:text-burgundy");
    rm.type = "button"; rm.setAttribute("aria-label", `Retirer du panier : ${l.name}`);
    rm.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    rm.addEventListener("click", () => setQty(l, 0));
    head.append(rm);
    top.append(head);
    if (l.variant) top.append(el("p", "m-0 text-[0.8125rem] text-ink-soft", `Coloris : ${l.variant}`));
    if (l.unavailable) top.append(el("p", "m-0 text-[0.8125rem] font-semibold text-rose-dusty", "Plus disponible : non compté dans votre commande"));
    else {
      const price = el("p", "m-0 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums");
      price.append(el("span", "font-semibold text-burgundy", fmt(l.price)));
      if (was > l.price) price.append(el("s", "text-[0.8125rem] text-ink-soft", fmt(was)));
      top.append(price);
      if (was > l.price) top.append(el("p", "m-0 text-[0.75rem] font-semibold text-rose-dusty tabular-nums", `Vous économisez ${fmt((was - l.price) * l.qty)}`));
      if (left != null && left > 0) top.append(el("p", "m-0 text-[0.75rem] text-ink-soft", `Plus que ${left} ${left > 1 ? "pièces disponibles" : "pièce disponible"}`));
    }
    const row = el("div", "flex items-center justify-between gap-3");
    const step = el("div", "flex items-center rounded-md border border-gold/50");
    const btn = (label: string, glyph: string, q: number, disabled = false) => {
      const b = el("button", "grid size-10 cursor-pointer place-items-center border-0 bg-transparent text-lg leading-none text-burgundy hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-35", glyph);
      b.type = "button"; b.setAttribute("aria-label", `${label} : ${l.name}`); b.disabled = disabled;
      b.addEventListener("click", () => setQty(l, q));
      return b;
    };
    const qty = el("span", "grid min-w-7 place-items-center text-sm font-semibold tabular-nums", String(l.qty));
    qty.setAttribute("aria-label", `Quantité ${l.qty}`);
    if (!l.unavailable) {
      step.append(btn("Diminuer la quantité", "−", l.qty - 1), qty, btn("Augmenter la quantité", "+", l.qty + 1, l.qty >= MAX_QTY || (left != null && l.qty >= left)));
      row.append(step, el("span", "text-sm font-semibold text-ink tabular-nums", fmt(l.price * l.qty)));
    }
    body.append(top, row);
    li.append(frame, body);
    return li;
  }));

  const has = lines.length > 0;
  empty.hidden = has;
  foot.hidden = !has;
  list.hidden = !has;
  extras.hidden = !has;

  // Offer + recommendations (rebuilt, then focus is restored if a button inside was the active element)
  const cfg = offer.cfg;
  const view = { lines: buyable(), bags: offer.bags, eligible: offer.eligible, count: cfg ? countBags(buyable(), cfg) : 0, min: cfg?.quantity ?? 0, verdict: offer.verdict, example: offer.example, title: cfg?.title ?? "", badge: cfg?.badge ?? null, showAll: offer.showAll };
  const active = document.activeElement as HTMLElement | null;
  const keep = active?.dataset.recMore ? "[data-rec-more]" : active?.dataset.recAdd ? `[data-rec-add="${active.dataset.recAdd}"]` : "";
  dlg.querySelector<HTMLElement>("[data-cart-offer]")!.replaceChildren(...[cfg ? buildOffer(view) : null].filter(Boolean) as Node[]);
  dlg.querySelector<HTMLElement>("[data-cart-recs]")!.replaceChildren(...[buildRecs(view)].filter(Boolean) as Node[]);
  if (keep) dlg.querySelector<HTMLElement>(keep)?.focus();

  // Summary: every figure comes from the cart or from the server's own answer.
  const sub = subtotal();
  const discount = offer.verdict?.discount ?? 0;
  const payable = sub - discount;
  const dRow = dlg.querySelector<HTMLElement>("[data-sum-discount-row]")!;
  dRow.hidden = discount <= 0;
  dlg.querySelector<HTMLElement>("[data-sum-discount-label]")!.textContent = offer.verdict && cfg ? `${cfg.title} (−${offer.verdict.percent} %)` : "";
  dlg.querySelector<HTMLElement>("[data-sum-discount]")!.textContent = `−${fmt(discount)}`;
  dlg.querySelector<HTMLElement>("[data-sum-sub]")!.textContent = fmt(sub);
  // Delivery: the same rule the CMS applies when it prices the order (lib/store → shippingQuote), on what is payable after discounts.
  const q = shippingQuote(store, payable);
  const ship = dlg.querySelector<HTMLElement>("[data-cart-ship]")!;
  ship.hidden = q.left == null; // no threshold that changes anything: no progress bar
  if (store.freeFrom != null && q.left != null) {
    const check = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    if (q.free) { msg.innerHTML = `<span class="text-burgundy">${check}</span>`; msg.append(el("span", "font-semibold text-burgundy", "Livraison offerte débloquée !")); }
    else { msg.replaceChildren(document.createTextNode("Encore "), el("strong", "font-semibold text-burgundy", fmt(q.left)), document.createTextNode(" pour profiter de la livraison offerte.")); }
    bar.style.setProperty("--w", `${Math.min(100, (payable / store.freeFrom) * 100)}%`);
  }
  dlg.querySelector<HTMLElement>("[data-sum-ship]")!.textContent = q.label;
  dlg.querySelector<HTMLElement>("[data-total-label]")!.textContent = q.cost == null ? "Total hors livraison" : "Total";
  total.textContent = fmt(payable + (q.cost ?? 0));

  // Reassurance: only verified store settings (payment methods, returns policy, WhatsApp help). Nothing configured: nothing shown.
  const trust = dlg.querySelector<HTMLElement>("[data-cart-trust]")!;
  const items = [
    ...store.payments.slice(0, 1).map((t) => ({ t, href: null as string | null })),
    ...(store.returnsPolicyUrl ? [{ t: "Retours et échanges", href: store.returnsPolicyUrl }] : []),
    ...(store.whatsapp ? [{ t: "Assistance WhatsApp", href: `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` }] : []),
  ];
  trust.hidden = !items.length;
  trust.replaceChildren(...items.map(({ t, href }) => {
    const li = el("li", "inline-flex items-center gap-1.5");
    li.append(el("span", "size-1 rotate-45 bg-gold"));
    if (href) { const a = el("a", "text-ink-soft underline decoration-gold/50 underline-offset-2 hover:text-burgundy", t) as HTMLAnchorElement; a.href = href; a.target = "_blank"; a.rel = "noopener"; li.append(a); }
    else li.append(document.createTextNode(t));
    return li;
  }));
  const go = dlg.querySelector<HTMLAnchorElement>("[data-cart-foot] a[href='/commande']");
  if (go) { go.toggleAttribute("aria-disabled", !n); go.style.pointerEvents = n ? "" : "none"; go.style.opacity = n ? "" : "0.5"; }
}

/* ---------- Quick add (product cards): confirm in place, never take over the screen ---------- */
const toast = document.querySelector<HTMLElement>("[data-toast]");
let toastTimer: number | undefined;
function showToast(name: string) {
  if (!toast) return;
  toast.querySelector<HTMLElement>("[data-toast-name]")!.textContent = name;
  toast.dataset.show = "true";
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.dataset.show = "false"), 4200);
}
function flashAdded(btn: HTMLElement) {
  const label = btn.querySelector<HTMLElement>("[data-add-label]");
  btn.dataset.added = "true";
  if (label) label.textContent = "✓ Ajouté";
  window.setTimeout(() => { btn.dataset.added = "false"; if (label) label.textContent = "+ Ajouter"; }, 1800);
}

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;

  const recAdd = t.closest<HTMLElement>("[data-rec-add]");
  if (recAdd) {
    addToCart({ id: recAdd.dataset.recAdd!, name: recAdd.dataset.name!, price: Number(recAdd.dataset.price), img: recAdd.dataset.img! });
    live(`${recAdd.dataset.name} ajouté au panier.`);
    return;
  }
  if (t.closest("[data-rec-more]")) { offer.showAll = true; render(); dlg?.querySelector<HTMLElement>("[data-rec-add]")?.focus(); return; }
  if (t.closest("[data-offer-choose]")) {
    const recs = dlg?.querySelector<HTMLElement>("[data-recs]");
    recs?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    recs?.querySelector<HTMLElement>("[data-rec-add]")?.focus({ preventScroll: true });
    return;
  }

  const quick = t.closest<HTMLElement>("[data-quick-add]");
  if (quick) {
    addToCart({ id: quick.dataset.quickAdd!, name: quick.dataset.name!, price: Number(quick.dataset.price), img: quick.dataset.img! });
    flashAdded(quick);
    showToast(quick.dataset.name!);
    return;
  }

  const add = t.closest<HTMLElement>("[data-add]");
  if (add) {
    addToCart({ id: add.dataset.add!, name: add.dataset.name!, price: Number(add.dataset.price), img: add.dataset.img! });
    open();
    return;
  }

  const buy = t.closest<HTMLElement>("[data-buy]");
  if (buy) {
    addToCart({ id: buy.dataset.buy!, name: buy.dataset.name!, price: Number(buy.dataset.price), img: buy.dataset.img! });
    location.assign("/commande");
    return;
  }

  const link = t.closest<HTMLElement>("[data-cart-link]");
  if (link && dlg) { e.preventDefault(); open(); return; }

  if (t.closest("[data-cart-close]")) { close(); return; }
  if (t === dlg) close(); // click on the backdrop

  const wish = t.closest<HTMLButtonElement>("[data-wish]");
  if (wish) {
    const on = wish.getAttribute("aria-pressed") !== "true";
    wish.setAttribute("aria-pressed", String(on));
    wish.setAttribute("aria-label", `${on ? "Retirer de" : "Ajouter à"} la liste de souhaits : ${wish.dataset.wish}`);
  }
});
dlg?.addEventListener("cancel", (e) => { e.preventDefault(); close(); });

commit();
