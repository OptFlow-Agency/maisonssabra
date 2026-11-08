import { lockScroll } from "./smooth";
import { countBags, fmtMad, loadBags, loadOffer, qualifies, verify, type Offer, type Verdict } from "../lib/offer";
import { getStoreConfig, loadStoreConfig } from "../lib/store";
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

// Free-delivery threshold from the CMS (null: no policy, so the progress bar is not shown).
let freeFrom: number | null = null;
getStoreConfig().then((c) => { freeFrom = c.freeFrom; render(); });

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
  const [cfg, bags, store] = await Promise.all([loadOffer(), loadBags(), loadStoreConfig().catch(() => null)]);
  if (my !== offerSeq) return;
  if (store) freeFrom = store.freeFrom;
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
  dlg.querySelector<HTMLElement>("[data-cart-title-count]")!.textContent = n ? ` (${n})` : "";

  list.replaceChildren(...lines.map((l) => {
    const li = el("li", `grid grid-cols-[4.5rem_1fr] gap-4 py-5${l.unavailable ? " opacity-70" : ""}`);
    const img = el("img", "size-18 bg-white object-cover");
    img.src = l.img; img.alt = ""; img.width = 72; img.height = 72;
    const body = el("div", "grid min-w-0 content-between gap-3");
    const top = el("div", "grid gap-1");
    top.append(el("p", "m-0 line-clamp-2 font-display text-lg leading-tight text-burgundy", l.name));
    if (l.variant) top.append(el("p", "m-0 text-sm text-ink-soft", l.variant));
    top.append(l.unavailable ? el("p", "m-0 text-sm font-semibold text-rose-dusty", "Plus disponible : non compté dans votre commande") : el("p", "m-0 text-sm tabular-nums text-ink-soft", fmt(l.price)));
    const row = el("div", "flex items-center justify-between gap-3");
    const step = el("div", "flex items-center border border-burgundy/30");
    const btn = (label: string, glyph: string, q: number) => {
      const b = el("button", "grid size-10 cursor-pointer place-items-center border-0 bg-transparent text-lg leading-none text-burgundy hover:bg-rose/20", glyph);
      b.type = "button"; b.setAttribute("aria-label", `${label} : ${l.name}`);
      b.addEventListener("click", () => setQty(l, q));
      return b;
    };
    const qty = el("span", "grid min-w-8 place-items-center text-sm font-semibold tabular-nums", String(l.qty));
    qty.setAttribute("aria-label", `Quantité ${l.qty}`);
    if (!l.unavailable) step.append(btn("Diminuer la quantité", "−", l.qty - 1), qty, btn("Augmenter la quantité", "+", l.qty + 1));
    const rm = el("button", "min-h-10 cursor-pointer border-0 bg-transparent p-0 text-sm text-ink-soft underline underline-offset-4 hover:text-rose-dusty", "Retirer");
    rm.type = "button"; rm.setAttribute("aria-label", `Retirer du panier : ${l.name}`);
    rm.addEventListener("click", () => setQty(l, 0));
    row.append(l.unavailable ? el("span") : step, rm);
    body.append(top, row);
    li.append(img, body);
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
  dlg.querySelector<HTMLElement>("[data-cart-recs]")!.replaceChildren(...[cfg ? buildRecs(view) : null].filter(Boolean) as Node[]);
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
  // Delivery is judged on what is actually payable (the CMS applies the same rule when it prices the order).
  const ship = dlg.querySelector<HTMLElement>("[data-cart-ship]")!;
  ship.hidden = freeFrom == null;
  const sumShip = dlg.querySelector<HTMLElement>("[data-sum-ship]")!;
  if (freeFrom != null) {
    const free = payable >= freeFrom;
    sumShip.textContent = free ? "Offerte" : "Calculée à la commande";
    const left = freeFrom - payable;
    msg.textContent = left > 0 ? `Plus que ${fmt(left)} pour la livraison offerte` : "Livraison offerte";
    bar.style.setProperty("--w", `${Math.min(100, (payable / freeFrom) * 100)}%`);
  } else sumShip.textContent = "Calculée à la commande";
  total.textContent = fmt(payable);
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
