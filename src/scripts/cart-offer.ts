import type { Product } from "../data/products";
import { variant } from "../data/products";
import { fmtMad, type Verdict } from "../lib/offer";

type Line = { id: string; name: string; price: number; img: string; qty: number };
export type OfferView = {
  lines: readonly Line[];
  bags: Product[];
  eligible: Map<string, Verdict | null>; // slug -> what two of it earn (null: does not qualify)
  count: number; // eligible bags in the cart, by quantity
  min: number;
  secondOnly: boolean; // CMS code discounts the second bag only ("2e sac −X %")
  verdict: Verdict | null; // server-confirmed discount for the current cart (count >= min)
  example: Verdict | null; // server-confirmed discount for `min` units of the first qualifying line
  title: string; // CMS offer title
  badge: string | null; // CMS offer badge, e.g. « Recommandé »
  showAll: boolean;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const check = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

export function buildOffer(v: OfferView): HTMLElement | null {
  if (!v.lines.length) return null;
  const pct = v.verdict?.percent ?? [...v.eligible.values()].find(Boolean)?.percent; // the CMS offer's percentage, never a constant
  if (!pct) return null; // the server has not confirmed an offer for this cart: show nothing rather than promise it
  const duo = v.min === 2;

  // Unlocked: a quiet confirmation with the exact amount the server computed. The summary below carries the breakdown.
  if (v.count >= v.min && v.verdict) {
    const s = el("section", "flex items-start gap-3 rounded-md border border-burgundy/25 bg-white px-4 py-3.5");
    s.setAttribute("aria-label", v.title);
    const ic = el("span", "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-burgundy text-cream-soft"); ic.innerHTML = check;
    const txt = el("div", "grid gap-0.5");
    txt.append(
      el("p", "m-0 font-display text-[1.25rem] leading-tight font-medium text-burgundy", v.secondOnly ? "Votre 2e sac à prix réduit est activé !" : duo ? "Votre avantage duo est activé !" : `${v.title} : avantage activé !`),
      el("p", "m-0 text-[0.8125rem] text-ink-soft", v.secondOnly ? `${v.verdict.percent} % de réduction appliqués à votre deuxième sac.` : `${v.verdict.percent} % de réduction appliqués à votre sélection.`),
      el("p", "m-0 text-[0.8125rem] font-semibold text-rose-dusty tabular-nums", `Vous économisez ${fmtMad(v.verdict.discount)}`),
    );
    s.append(ic, txt);
    return s;
  }
  if (v.count >= v.min) return null; // enough bags but the server did not confirm (yet): no promise
  if (v.count === 0) return null; // nothing in the cart qualifies: the offer is not for this cart

  const missing = v.min - v.count;
  const unit = (n: number) => (n > 1 ? "sacs" : "sac");
  const s = el("section", "grid gap-2 rounded-md bg-card-beige px-4 py-4");
  s.setAttribute("aria-labelledby", "offer-title");
  if (v.badge) s.append(el("p", "m-0 text-[0.625rem] leading-none font-semibold tracking-[0.2em] text-rose-dusty uppercase", v.badge));
  s.append(
    Object.assign(el("h3", "m-0 font-display text-[1.375rem] leading-[1.15] font-medium text-burgundy", v.secondOnly && missing === 1 ? `Votre deuxième sac à −${pct} % !` : duo && missing === 1 ? `Votre deuxième sac vous fait économiser ${pct} % !` : `${v.title} : −${pct} % dès ${v.min} ${unit(v.min)}`), { id: "offer-title" }),
    el("p", "m-0 text-[0.8125rem] text-ink-soft", v.secondOnly && missing === 1 ? `Ajoutez un deuxième sac : il vous est proposé à −${pct} %.` : duo && missing === 1 ? "Ajoutez un deuxième sac et profitez de notre avantage duo." : `Ajoutez ${missing} ${unit(missing)} de plus pour profiter de ${pct} % de réduction.`),
  );
  if (v.example && v.example.discount > 0) s.append(el("p", "m-0 text-[0.8125rem] text-burgundy tabular-nums", v.secondOnly ? `Soit ${fmtMad(v.example.discount)} d’économie sur le deuxième sac.` : `Soit ${fmtMad(v.example.discount)} d’économie sur ${v.min} sacs.`));
  const cta = el("button", "btn-ghost mt-1 min-h-11 w-full", duo && missing === 1 ? "+ Choisir mon deuxième sac" : "+ Choisir un autre sac");
  cta.type = "button"; cta.setAttribute("data-offer-choose", "true");
  s.append(cta);
  return s;
}

export function buildRecs(v: OfferView): HTMLElement | null {
  if (!v.lines.length) return null;
  if (v.min > 0 && v.count >= v.min && v.verdict) return null; // offer unlocked: keep the path to checkout clear
  const pushOffer = v.min > 0 && v.count > 0; // the cart is on its way to the offer: only bags that count toward it
  const inCart = new Set(v.lines.map((l) => l.id));
  const mine = new Set(v.lines.map((l) => v.bags.find((b) => b.slug === l.id)?.collection));
  const cands = v.bags
    .filter((b) => !inCart.has(b.slug) && (!pushOffer || v.eligible.get(b.slug)) && b.purchasable !== false && !b.variants?.length && mine.size > 0) // sold out, or needs a choice of variant: not a one-tap add
    .filter((b) => pushOffer || mine.has(b.collection)) // no offer in play: other colours or models of what she chose
    .sort((a, b) => Number(mine.has(b.collection)) - Number(mine.has(a.collection))); // same collection (other colour or model) first
  if (!cands.length) return null;
  const shown = v.showAll ? cands : cands.slice(0, 2);

  const s = el("section", "grid gap-3");
  s.setAttribute("aria-labelledby", "recs-title");
  s.dataset.recs = "true";
  s.append(Object.assign(el("h3", "m-0 text-[0.6875rem] font-semibold tracking-[0.18em] text-ink-soft uppercase", "Complétez votre sélection"), { id: "recs-title" }));
  const ul = el("ul", "m-0 grid list-none divide-y divide-gold/40 p-0");
  shown.forEach((b) => {
    const li = el("li", "grid grid-cols-[4rem_1fr_auto] items-center gap-3 py-3");
    const frame = el("span", "block aspect-square overflow-hidden rounded-md bg-[#f4f2ef]");
    const img = el("img", "size-full object-cover"); img.src = variant(b.img, 480); img.alt = ""; img.width = 64; img.height = 64; img.loading = "lazy";
    frame.append(img);
    const info = el("div", "grid min-w-0 gap-0.5");
    const price = el("p", "m-0 flex items-baseline gap-2 text-sm tabular-nums");
    price.append(el("span", "font-semibold text-burgundy", fmtMad(b.price)));
    if (b.was && b.was > b.price) price.append(el("s", "text-[0.75rem] text-ink-soft", fmtMad(b.was)));
    info.append(el("p", "m-0 text-[0.625rem] font-semibold tracking-[0.14em] text-ink-soft uppercase", b.collection === "zman" ? "Collection Z’man" : "Collection Bladi"), el("p", "m-0 line-clamp-2 text-[0.875rem] leading-snug font-medium text-ink", b.name), price);
    const add = el("button", "inline-flex min-h-10 min-w-[5.5rem] cursor-pointer items-center justify-center rounded-md border border-burgundy bg-transparent px-3 text-[0.75rem] font-semibold tracking-[0.1em] text-burgundy uppercase transition-colors duration-200 hover:bg-burgundy hover:text-cream-soft", "+ Ajouter");
    add.type = "button"; add.dataset.recAdd = b.slug; add.setAttribute("data-rec-add", b.slug); add.dataset.name = b.name; add.dataset.price = String(b.price); add.dataset.img = variant(b.img, 480);
    add.setAttribute("aria-label", `Ajouter au panier : ${b.name}`);
    li.append(frame, info, add);
    ul.append(li);
  });
  s.append(ul);
  if (cands.length > 2 && !v.showAll) {
    const more = el("button", "min-h-11 w-fit cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold tracking-[0.12em] text-burgundy uppercase underline decoration-gold underline-offset-[0.5em]", `Voir les autres sacs (${cands.length - 2})`);
    more.type = "button"; more.setAttribute("data-rec-more", "true"); more.setAttribute("aria-expanded", "false");
    s.append(more);
  }
  return s;
}
