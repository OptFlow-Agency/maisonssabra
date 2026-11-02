import type { Product } from "../data/products";
import { tone, variant } from "../data/products";
import { fmtMad, type Verdict } from "../lib/offer";

type Line = { id: string; name: string; price: number; img: string; qty: number };
export type OfferView = {
  lines: readonly Line[];
  bags: Product[];
  eligible: Map<string, Verdict | null>; // slug -> what two of it earn (null: does not qualify)
  count: number; // eligible bags in the cart, by quantity
  min: number;
  verdict: Verdict | null; // server-confirmed discount for the current cart (count >= min)
  showAll: boolean;
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const check = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

/** Two segments, one per bag: distinct from the continuous free-delivery bar. */
function segments(filled: number, total: number) {
  const row = el("div", "grid gap-1.5");
  row.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
  row.setAttribute("aria-hidden", "true");
  for (let i = 0; i < total; i++) row.append(el("span", `h-1 ${i < filled ? "bg-burgundy" : "bg-gold/35"} transition-colors duration-500 motion-reduce:transition-none`));
  return row;
}

export function buildOffer(v: OfferView): HTMLElement | null {
  if (!v.lines.length) return null;
  const pct = v.verdict?.percent ?? [...v.eligible.values()].find(Boolean)?.percent;
  if (!pct) return null; // the server has not confirmed an offer for this cart: show nothing rather than promise it

  if (v.count >= v.min && v.verdict) {
    const s = el("section", "grid gap-3 border border-gold/50 bg-cream p-4");
    s.setAttribute("aria-label", "Offre deux sacs");
    const head = el("div", "flex items-start gap-3 text-burgundy");
    const ic = el("span", "mt-0.5 shrink-0"); ic.innerHTML = check;
    const txt = el("div", "grid gap-1");
    txt.append(el("h3", "m-0 font-display text-[1.375rem] leading-tight font-medium", "Votre avantage Maison Sabra est activé."), el("p", "m-0 text-sm text-ink-soft", `${v.verdict.percent} % de réduction appliqués à votre sélection.`));
    head.append(ic, txt);
    s.append(head, segments(v.min, v.min));
    return s;
  }
  if (v.count >= v.min) return null; // two bags but the server did not confirm (yet): no promise

  const cart = v.lines.find((l) => v.eligible.get(l.id));
  const ex = cart ? v.eligible.get(cart.id) : null;
  const s = el("section", "grid gap-3 border border-gold/50 bg-cream p-4");
  s.setAttribute("aria-labelledby", "offer-title");
  s.append(
    el("p", "m-0 text-[0.6875rem] leading-none font-semibold tracking-[0.2em] text-rose-dusty uppercase", "Une attention pour vous"),
    Object.assign(el("h3", "m-0 font-display text-[1.5rem] leading-[1.1] font-medium text-burgundy", `Un deuxième sac, et −${pct} % sur les deux.`), { id: "offer-title" }),
    el("p", "m-0 text-sm text-ink-soft", `Ajoutez un deuxième sac et profitez de ${pct} % de réduction sur les deux pièces.`),
  );
  if (cart && ex && ex.discount > 0) s.append(el("p", "m-0 text-sm text-burgundy", `Exemple : deux sacs à ${fmtMad(cart.price)}, vous économisez ${fmtMad(ex.discount)}.`));
  const prog = el("div", "grid gap-2");
  prog.append(segments(v.count, v.min), el("p", "m-0 text-[0.8125rem] text-ink", `${v.count} sac sur ${v.min} · Il ne vous manque qu’un sac pour profiter de −${pct} %.`));
  s.append(prog);
  const cta = el("button", "btn-ghost w-full", "+ Choisir mon deuxième sac");
  cta.type = "button"; cta.setAttribute("data-offer-choose", "true");
  s.append(cta);
  return s;
}

export function buildRecs(v: OfferView): HTMLElement | null {
  if (!v.lines.length || v.count >= v.min || v.count === 0) return null;
  const inCart = new Set(v.lines.map((l) => l.id));
  const mine = new Set(v.lines.map((l) => v.bags.find((b) => b.slug === l.id)?.collection));
  const cands = v.bags
    .filter((b) => !inCart.has(b.slug) && v.eligible.get(b.slug))
    .sort((a, b) => Number(mine.has(b.collection)) - Number(mine.has(a.collection))); // same collection (other colour or model) first
  if (!cands.length) return null;
  const shown = v.showAll ? cands : cands.slice(0, 2);

  const s = el("section", "grid gap-3");
  s.setAttribute("aria-labelledby", "recs-title");
  s.dataset.recs = "true";
  s.append(Object.assign(el("h3", "m-0 font-display text-[1.25rem] leading-tight font-medium text-burgundy", "Complétez votre sélection"), { id: "recs-title" }));
  const ul = el("ul", "m-0 grid list-none divide-y divide-gold/40 p-0");
  shown.forEach((b) => {
    const li = el("li", "grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-3");
    const frame = el("span", "block aspect-[4/5] overflow-hidden"); frame.style.background = tone(b);
    const img = el("img", "size-full object-cover mix-blend-multiply"); img.src = variant(b.img, 480); img.alt = ""; img.width = 56; img.height = 70; img.loading = "lazy";
    frame.append(img);
    const info = el("div", "grid min-w-0 gap-0.5");
    info.append(el("p", "m-0 line-clamp-2 text-[0.875rem] leading-snug font-medium text-burgundy", b.name), el("p", "m-0 text-sm tabular-nums text-ink-soft", fmtMad(b.price)));
    const add = el("button", "inline-flex min-h-11 min-w-[5.75rem] cursor-pointer items-center justify-center rounded-none border border-burgundy bg-transparent px-3 text-[0.75rem] font-semibold tracking-[0.1em] text-burgundy uppercase transition-colors duration-200 hover:bg-burgundy hover:text-cream-soft", "+ Ajouter");
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
