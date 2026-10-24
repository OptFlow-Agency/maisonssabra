import { lockScroll } from "./smooth";

// Cart lives in localStorage; checkout (/commande) reads it and sends the order to Supabase.
export type Line = { id: string; name: string; price: number; img: string; qty: number };

const KEY = "ms-cart";
const FREE_FROM = 1000; // dhs, free delivery threshold from the live site
const MAX_QTY = 9;
const fmt = (n: number) => `${n.toLocaleString("fr-FR")} dhs`;

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
  const bar = dlg.querySelector<HTMLElement>("[data-free-bar]")!;
  const msg = dlg.querySelector<HTMLElement>("[data-free-msg]")!;
  const total = dlg.querySelector<HTMLElement>("[data-cart-total]")!;
  const n = count();
  dlg.querySelector<HTMLElement>("[data-cart-title-count]")!.textContent = n ? ` (${n})` : "";

  list.replaceChildren(...lines.map((l) => {
    const li = el("li", "grid grid-cols-[4.5rem_1fr] gap-4 py-5");
    const img = el("img", "size-18 bg-white object-cover");
    img.src = l.img; img.alt = ""; img.width = 72; img.height = 72;
    const body = el("div", "grid content-between gap-3");
    const top = el("div", "grid gap-1");
    top.append(el("p", "m-0 font-display text-lg leading-tight text-burgundy", l.name), el("p", "m-0 text-sm tabular-nums text-ink-soft", fmt(l.price)));
    const row = el("div", "flex items-center justify-between gap-3");
    const step = el("div", "flex items-center border border-burgundy/30");
    const btn = (label: string, glyph: string, q: number) => {
      const b = el("button", "grid size-9 cursor-pointer place-items-center border-0 bg-transparent text-lg leading-none text-burgundy hover:bg-rose/20", glyph);
      b.type = "button"; b.setAttribute("aria-label", `${label} : ${l.name}`);
      b.addEventListener("click", () => setQty(l.id, q));
      return b;
    };
    const qty = el("span", "grid min-w-8 place-items-center text-sm font-semibold tabular-nums", String(l.qty));
    qty.setAttribute("aria-label", `Quantité ${l.qty}`);
    step.append(btn("Diminuer la quantité", "−", l.qty - 1), qty, btn("Augmenter la quantité", "+", l.qty + 1));
    const rm = el("button", "cursor-pointer border-0 bg-transparent p-0 text-sm text-ink-soft underline underline-offset-4 hover:text-rose-dusty", "Retirer");
    rm.type = "button"; rm.setAttribute("aria-label", `Retirer du panier : ${l.name}`);
    rm.addEventListener("click", () => setQty(l.id, 0));
    row.append(step, rm);
    body.append(top, row);
    li.append(img, body);
    return li;
  }));

  empty.hidden = n > 0;
  foot.hidden = n === 0;
  list.hidden = n === 0;
  const sub = subtotal();
  total.textContent = fmt(sub);
  const left = FREE_FROM - sub;
  msg.textContent = left > 0 ? `Plus que ${fmt(left)} pour la livraison gratuite` : "Livraison gratuite offerte";
  bar.style.setProperty("--w", `${Math.min(100, (sub / FREE_FROM) * 100)}%`);
}

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;

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
