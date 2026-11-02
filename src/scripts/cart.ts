import { lockScroll } from "./smooth";
import { site } from "../data/site";
import { bundle, countBags, fmtMad, loadBags, offerEnabled, probe, verify, type Verdict } from "../lib/offer";
import { buildOffer, buildRecs } from "./cart-offer";
import type { Product } from "../data/products";

// Cart lives in localStorage; checkout (/commande) reads it and sends the order to Supabase.
export type Line = { id: string; name: string; price: number; img: string; qty: number };

const KEY = "ms-cart";
const FREE_FROM = site.freeShippingFrom; // MAD, free delivery threshold from the live site
const MAX_QTY = 9;
const fmt = fmtMad;

let lines: Line[] = [];
try { lines = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { lines = []; }

const count = () => lines.reduce((n, l) => n + l.qty, 0);
export const getLines = (): readonly Line[] => lines;
export const clearCart = () => { lines = []; commit(); };
export const subtotal = () => lines.reduce((n, l) => n + l.qty * l.price, 0);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} };

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

/* ---------- « 2 sacs » offer: shown and applied only when the server (apply_promo) confirms it ---------- */
const offer = { bags: [] as Product[], eligible: new Map<string, Verdict | null>(), verdict: null as Verdict | null, showAll: false, ready: false };
let offerSeq = 0;
const eligibleSet = () => new Set([...offer.eligible].filter(([, v]) => v).map(([k]) => k));
const live = (msg: string) => { const l = document.querySelector<HTMLElement>("[data-cart-live]"); if (l) { l.textContent = ""; setTimeout(() => (l.textContent = msg), 50); } };
export const getBundleVerdict = () => offer.verdict;

async function refreshOffer() {
  if (!offerEnabled) return;
  const my = ++offerSeq;
  const wasUnlocked = !!offer.verdict;
  if (!lines.length) { offer.verdict = null; render(); return; }
  if (!offer.ready) {
    offer.bags = await loadBags();
    const res = await Promise.all(offer.bags.map(async (b) => [b.slug, await probe(b.slug)] as const));
    res.forEach(([k, v]) => offer.eligible.set(k, v));
    offer.ready = true;
  }
  if (my !== offerSeq) return;
  const n = countBags(lines, eligibleSet());
  const v = n >= bundle.minBags ? await verify(lines.map((l) => ({ slug: l.id, qty: l.qty }))) : null;
  if (my !== offerSeq) return;
  offer.verdict = v;
  render();
  if (v && !wasUnlocked) live(`Votre avantage de ${v.percent} % est débloqué. Réduction : ${fmtMad(v.discount)}.`);
  if (!v && wasUnlocked) live("Votre réduction deux sacs n’est plus appliquée.");
}

export function addToCart(item: Omit<Line, "qty">) {
  const l = lines.find((x) => x.id === item.id);
  if (l) l.qty = Math.min(MAX_QTY, l.qty + 1); else lines.push({ ...item, qty: 1 });
  commit();
}
const setQty = (id: string, q: number) => {
  const l = lines.find((x) => x.id === id);
  if (!l) return;
  if (q <= 0) lines = lines.filter((x) => x.id !== id); else l.qty = Math.min(MAX_QTY, q);
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
    const li = el("li", "grid grid-cols-[4.5rem_1fr] gap-4 py-5");
    const img = el("img", "size-18 bg-white object-cover");
    img.src = l.img; img.alt = ""; img.width = 72; img.height = 72;
    const body = el("div", "grid min-w-0 content-between gap-3");
    const top = el("div", "grid gap-1");
    top.append(el("p", "m-0 line-clamp-2 font-display text-lg leading-tight text-burgundy", l.name), el("p", "m-0 text-sm tabular-nums text-ink-soft", fmt(l.price)));
    const row = el("div", "flex items-center justify-between gap-3");
    const step = el("div", "flex items-center border border-burgundy/30");
    const btn = (label: string, glyph: string, q: number) => {
      const b = el("button", "grid size-10 cursor-pointer place-items-center border-0 bg-transparent text-lg leading-none text-burgundy hover:bg-rose/20", glyph);
      b.type = "button"; b.setAttribute("aria-label", `${label} : ${l.name}`);
      b.addEventListener("click", () => setQty(l.id, q));
      return b;
    };
    const qty = el("span", "grid min-w-8 place-items-center text-sm font-semibold tabular-nums", String(l.qty));
    qty.setAttribute("aria-label", `Quantité ${l.qty}`);
    step.append(btn("Diminuer la quantité", "−", l.qty - 1), qty, btn("Augmenter la quantité", "+", l.qty + 1));
    const rm = el("button", "min-h-10 cursor-pointer border-0 bg-transparent p-0 text-sm text-ink-soft underline underline-offset-4 hover:text-rose-dusty", "Retirer");
    rm.type = "button"; rm.setAttribute("aria-label", `Retirer du panier : ${l.name}`);
    rm.addEventListener("click", () => setQty(l.id, 0));
    row.append(step, rm);
    body.append(top, row);
    li.append(img, body);
    return li;
  }));

  const has = n > 0;
  empty.hidden = has;
  foot.hidden = !has;
  list.hidden = !has;
  extras.hidden = !has;

  // Offer + recommendations (rebuilt, then focus is restored if a button inside was the active element)
  const view = { lines, bags: offer.bags, eligible: offer.eligible, count: countBags(lines, eligibleSet()), min: bundle.minBags, verdict: offer.verdict, showAll: offer.showAll };
  const active = document.activeElement as HTMLElement | null;
  const keep = active?.dataset.recMore ? "[data-rec-more]" : active?.dataset.recAdd ? `[data-rec-add="${active.dataset.recAdd}"]` : "";
  dlg.querySelector<HTMLElement>("[data-cart-offer]")!.replaceChildren(...[buildOffer(view)].filter(Boolean) as Node[]);
  dlg.querySelector<HTMLElement>("[data-cart-recs]")!.replaceChildren(...[buildRecs(view)].filter(Boolean) as Node[]);
  if (keep) dlg.querySelector<HTMLElement>(keep)?.focus();

  // Summary: every figure comes from the cart or from the server's own answer.
  const sub = subtotal();
  const discount = offer.verdict?.discount ?? 0;
  const payable = sub - discount;
  const dRow = dlg.querySelector<HTMLElement>("[data-sum-discount-row]")!;
  dRow.hidden = discount <= 0;
  dlg.querySelector<HTMLElement>("[data-sum-discount-label]")!.textContent = offer.verdict ? `Offre ${bundle.minBags} sacs (−${offer.verdict.percent} %)` : "";
  dlg.querySelector<HTMLElement>("[data-sum-discount]")!.textContent = `−${fmt(discount)}`;
  dlg.querySelector<HTMLElement>("[data-sum-sub]")!.textContent = fmt(sub);
  const basis = site.freeShippingAfterDiscount ? payable : sub;
  const free = basis >= FREE_FROM;
  dlg.querySelector<HTMLElement>("[data-sum-ship]")!.textContent = free ? "Offerte" : "Calculée à la commande";
  total.textContent = fmt(payable);
  const left = FREE_FROM - basis;
  msg.textContent = left > 0 ? `Plus que ${fmt(left)} pour la livraison offerte` : "Livraison offerte";
  bar.style.setProperty("--w", `${Math.min(100, (basis / FREE_FROM) * 100)}%`);
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
