// Product page: gallery, colourway switch, CMS variants, stock, benefits, reviews, quantity offer, sticky buy bar.
// Everything shown comes from the CMS (via the page data or the store API); nothing commercial is hardcoded here.
import { addToCart } from "./cart";
import { fmtMad, loadBags, loadOffer, qualifies, verify, type Offer, type Verdict } from "../lib/offer";
import { fetchReviews, type CmsReviews } from "../lib/cms";
import { tone } from "../data/products";
import type { Product } from "../data/products";

type Pic = { src: string; w480: string; w800: string };
type Var = { name: string; color: string | null; price: number; was: number | null; img: Pic | null; buyable: boolean; left: number | null };
type V = {
  slug: string; name: string; short: string; price: number; was: number | null; save: number; pct: number; alt: string; copy: string;
  imgs: Pic[]; thumb: string; perks: { title: string; text: string | null; icon: string }[]; left: number | null; buyable: boolean; promo: string | null; variants: Var[];
};
type PageData = { family: V[]; reviews: Record<string, CmsReviews | null> };

const root = document.querySelector<HTMLElement>("[data-pdp]");
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const $$ = <T extends HTMLElement = HTMLElement>(s: string) => [...root.querySelectorAll<T>(s)];
  const page: PageData = JSON.parse(document.getElementById("pdp-data")!.textContent!);
  const data = page.family;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const set = (s: string, t: string) => $$(s).forEach((n) => (n.textContent = t));
  const show = (n: HTMLElement, on: boolean) => n.classList.toggle("hidden", !on);
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

  let cur = data.find((d) => d.slug === root.dataset.slug)!;
  let vi = Math.max(0, cur.variants.findIndex((v) => v.buyable)); // selected CMS variant (index into cur.variants)
  let qty = 1;
  let offerCfg: Offer | null = null;
  let second: Product | undefined;
  let one: Verdict | null = null; // what the offer's quantity of the current bag earns, per the CMS
  let pair: Verdict | null = null; // exact verdict for the chosen pair
  let bags: Product[] = [];
  let eligible: Product[] = [];
  let seq = 0;

  const sel = (): Var | undefined => cur.variants[vi];
  const unitPrice = () => sel()?.price ?? cur.price;
  const unitWas = () => sel()?.was ?? cur.was;
  const buyable = () => (sel() ? sel()!.buyable : cur.buyable);
  const leftNow = () => (sel() ? sel()!.left : cur.left);
  const photos = (): Pic[] => { const im = sel()?.img; return im ? [im, ...cur.imgs.filter((i) => i.src !== im.src)] : cur.imgs; };
  const thumbNow = () => sel()?.img?.w480 ?? cur.thumb;

  /* ---------- Gallery ---------- */
  const track = $("[data-track]");
  const thumbs = $("[data-thumbs]");
  const counter = $("[data-counter]");
  const dots = $("[data-dots]");
  let zoomed: HTMLImageElement | null = null;

  const slideW = () => track.clientWidth || 1;
  const index = () => Math.round(track.scrollLeft / slideW());
  const syncIndex = () => {
    const i = index(), n = track.children.length;
    counter.textContent = `${i + 1} / ${n}`;
    dots.querySelectorAll<HTMLElement>("[data-dot]").forEach((d, k) => (d.dataset.on = String(k === i)));
    thumbs.querySelectorAll<HTMLElement>("[data-thumb]").forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
  };
  track.addEventListener("scroll", () => requestAnimationFrame(syncIndex), { passive: true });
  thumbs.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-thumb]");
    if (b) track.scrollTo({ left: Number(b.dataset.thumb) * slideW(), behavior: reduce ? "auto" : "smooth" });
  });

  // Desktop zoom: hover magnifies the area under the pointer, for embroidery and fabric.
  if (finePointer) {
    track.addEventListener("pointermove", (e) => {
      const img = (e.target as HTMLElement).closest("[data-slide]")?.querySelector("img");
      if (!img || e.pointerType !== "mouse") return;
      const r = img.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      img.style.transform = "scale(2)";
      zoomed = img;
    });
    track.addEventListener("pointerleave", () => { if (zoomed) { zoomed.style.transform = ""; zoomed = null; } });
  }

  const img = (pic: Pic, i: number, v: V) => {
    const el = document.createElement("img");
    el.src = i === 0 ? pic.w800 : pic.w480;
    el.alt = i === 0 ? v.alt : `${v.name}, autre vue`;
    el.width = 1000; el.height = 988;
    el.decoding = "async";
    el.sizes = "(min-width: 60rem) 48vw, 100vw";
    el.className = "aspect-[1000/988] w-full object-cover mix-blend-multiply transition-transform duration-500 ease-(--ease-out)";
    return el;
  };
  function buildGallery(v: V) {
    const imgs = photos();
    track.replaceChildren(...imgs.map((src, i) => {
      const s = document.createElement("div");
      s.className = "group/slide relative w-full shrink-0 snap-center overflow-hidden min-[60rem]:cursor-zoom-in";
      s.dataset.slide = "";
      s.setAttribute("aria-label", `${i + 1} sur ${imgs.length}`);
      s.append(img(src, i, v));
      return s;
    }));
    track.scrollLeft = 0;
    const many = imgs.length > 1;
    thumbs.replaceChildren(...(many ? imgs.map((src, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button"; b.dataset.thumb = String(i); b.setAttribute("aria-label", `Vue ${i + 1}`);
      b.className = "block w-full cursor-pointer overflow-hidden border-0 p-0 ring-1 ring-burgundy/20 transition-shadow duration-300 aria-[current=true]:ring-2 aria-[current=true]:ring-burgundy hover:ring-burgundy/60";
      b.style.background = tone();
      const t = document.createElement("img");
      t.src = src.w480; t.alt = ""; t.width = 72; t.height = 72; t.loading = "lazy";
      t.className = "aspect-square w-full object-cover mix-blend-multiply";
      b.append(t); li.append(b);
      return li;
    }) : []));
    dots.replaceChildren(...(many ? imgs.map(() => {
      const d = document.createElement("span");
      d.dataset.dot = ""; d.className = "size-1.5 rounded-full bg-burgundy/30 transition-[background-color,width] duration-300 data-[on=true]:w-5 data-[on=true]:bg-burgundy";
      return d;
    }) : []));
    show(counter, many); show(dots, many);
    syncIndex();
    if (!reduce) track.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" });
  }

  /* ---------- Money, stock, availability ---------- */
  const secondPrice = () => second?.price ?? unitPrice();
  const total = () => {
    if (qty === 1) return unitPrice();
    const d = pair ?? one;
    return unitPrice() + secondPrice() - (d?.discount ?? 0);
  };
  const pctOf = (price: number, was: number | null) => (was && was > price ? Math.round((1 - price / was) * 100) : 0);

  function paintPrice() {
    const price = unitPrice(), was = unitWas();
    const pct = pctOf(price, was);
    set("[data-price]", fmtMad(price));
    // The strike-through, percentage and saving appear only when the CMS price really is lower than the compare-at price.
    const wasEl = $("[data-was]");
    wasEl.lastChild!.textContent = fmtMad(was ?? 0);
    show(wasEl, pct > 0); show($("[data-pct]"), pct > 0); show($("[data-save]"), pct > 0);
    $("[data-pct]").textContent = `−${pct} %`;
    $("[data-save]").textContent = `Vous économisez ${fmtMad((was ?? price) - price)}`;
  }
  function paintStock() {
    const left = leftNow(), ok = buyable();
    // « Plus que N » only when the CMS reports a genuinely low quantity for the selected variant (it applies its own threshold).
    const low = ok && typeof left === "number" && left > 0;
    show($("[data-stock]"), low);
    if (low) $("[data-stock-text]").textContent = `Plus que ${left} ${left! > 1 ? "pièces disponibles" : "pièce disponible"}`;
    show($("[data-soldout]"), !ok);
    $$<HTMLButtonElement>("[data-pdp-buy], [data-pdp-add]").forEach((b) => {
      b.disabled = !ok;
      if (b.hasAttribute("data-pdp-add")) b.textContent = ok ? "Ajouter au panier" : "Indisponible";
    });
  }
  function paint() {
    const t = fmtMad(total());
    set("[data-total]", t); set("[data-total-mirror]", t);
    set("[data-total-label]", qty === 2 ? "Total des deux sacs" : "Total");
    set("[data-one-total]", fmtMad(unitPrice()));
    const d = pair ?? one;
    if (d && offerCfg) {
      set("[data-two-pct]", `−${d.percent} %`);
      set("[data-two-total]", fmtMad(unitPrice() + secondPrice() - d.discount));
      set("[data-two-save]", `Vous économisez ${fmtMad(d.discount)}`);
      set("[data-one-hint]", `Encore un sac pour profiter de −${d.percent} %.`);
    }
    paintPrice(); paintStock();
  }

  /* ---------- Benefits (CMS: active, ordered; none → section hidden) ---------- */
  function paintPerks() {
    const ul = $("[data-perks]");
    show($("[data-perks-wrap]"), cur.perks.length > 0);
    ul.replaceChildren(...cur.perks.map((b) => {
      const li = mk("li", "flex items-start gap-3");
      const ic = mk("span", "mt-px grid size-5 shrink-0 place-items-center rounded-full bg-burgundy text-cream-soft");
      ic.innerHTML = b.icon; // trusted: static SVG from data/icons.ts, chosen by key
      const txt = mk("span");
      txt.append(mk("span", "font-semibold", b.title));
      if (b.text) txt.append(mk("span", "text-ink-soft", ` : ${b.text}`));
      li.append(ic, txt);
      return li;
    }));
  }

  /* ---------- CMS variants ---------- */
  const variantBox = $("[data-cms-variants]");
  function paintVariants() {
    const list = $("[data-cms-variant-list]");
    show(variantBox, cur.variants.length > 0); variantBox.classList.toggle("grid", cur.variants.length > 0);
    set("[data-cms-variant-name]", sel()?.name ?? "");
    list.replaceChildren(...cur.variants.map((v, i) => {
      const label = mk("label", `group/v relative block ${v.img ? "w-[4.5rem] min-[60rem]:w-20" : ""} shrink-0 ${v.buyable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`);
      const input = document.createElement("input");
      input.type = "radio"; input.name = "cms-variant"; input.value = String(i); input.className = "peer sr-only"; input.checked = i === vi; input.disabled = !v.buyable;
      input.setAttribute("aria-label", v.buyable ? v.name : `${v.name} : indisponible`);
      const box = mk("span", "block overflow-hidden ring-1 ring-burgundy/20 transition-shadow duration-300 group-hover/v:ring-burgundy/60 peer-checked:ring-2 peer-checked:ring-burgundy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-burgundy");
      if (v.img) {
        box.style.background = tone();
        const im = mk("img", "aspect-square w-full object-cover mix-blend-multiply"); im.src = v.img.w480; im.alt = ""; im.width = 80; im.height = 80; im.loading = "lazy";
        box.append(im);
        label.append(input, box, mk("span", "mt-1.5 block truncate text-center text-xs text-ink-soft peer-checked:font-semibold peer-checked:text-burgundy", v.name));
      } else if (v.color) {
        box.className += " rounded-full"; const dot = mk("span", "block size-9"); dot.style.background = v.color; box.append(dot);
        label.append(input, box);
        label.title = v.name;
      } else {
        box.append(mk("span", "block px-4 py-2 text-sm text-ink", v.name));
        label.append(input, box);
      }
      return label;
    }));
  }
  variantBox.addEventListener("change", (e) => {
    const i = Number((e.target as HTMLInputElement).value);
    if (!cur.variants[i] || i === vi) return;
    const before = photos()[0]?.src;
    vi = i;
    set("[data-cms-variant-name]", sel()!.name);
    if (photos()[0]?.src !== before) buildGallery(cur); // the variant has its own photo
    paint();
    refreshOffer();
  });

  /* ---------- Colourway (sibling products of the family) ---------- */
  function choose(slug: string, push = true) {
    const v = data.find((d) => d.slug === slug);
    if (!v || v === cur) return;
    cur = v;
    vi = Math.max(0, cur.variants.findIndex((x) => x.buyable));
    $("[data-title]").textContent = v.name;
    $("[data-copy]").textContent = v.copy;
    paintPerks(); paintVariants();
    set("[data-variant-name]", v.short); set("[data-sticky-name]", v.name);
    buildGallery(v);
    paint();
    if (push) { history.replaceState(null, "", `/produit/${v.slug}`); document.title = `${v.name} | Maison Sabra`; }
    refreshReviews();
    refreshOffer();
  }
  $("[data-variants]")?.addEventListener("change", (e) => choose((e.target as HTMLInputElement).value));

  /* ---------- Reviews (approved CMS reviews only) ---------- */
  const stars = (n: number) => { const s = mk("span", "tracking-[0.15em] text-gold", "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n))); s.setAttribute("aria-hidden", "true"); return s; };
  function paintReviews(r: CmsReviews | null) {
    const box = $("[data-reviews]"), rating = $("[data-rating]");
    const list = r?.reviews ?? [];
    const hasAvg = !!r && r.average != null && r.count > 0;
    show(box, list.length > 0);
    show(rating, hasAvg); rating.classList.toggle("flex", hasAvg);
    if (hasAvg) {
      const label = `${r!.average!.toLocaleString("fr-FR")} sur 5, ${r!.count} avis`;
      rating.replaceChildren(stars(r!.average!), mk("span", "sr-only", label), mk("span", "", `${r!.average!.toLocaleString("fr-FR")} / 5 · ${r!.count} avis`));
    }
    set("[data-reviews-summary]", hasAvg ? `${r!.average!.toLocaleString("fr-FR")} / 5 · ${r!.count} avis` : "");
    $("[data-reviews-list]").replaceChildren(...list.map((rv) => {
      const li = mk("li", "grid content-start gap-3 border border-gold/40 bg-white/60 p-5");
      if (rv.rating) li.append(stars(rv.rating));
      if (rv.title) li.append(mk("p", "m-0 font-display text-lg leading-tight text-burgundy", rv.title));
      li.append(mk("p", "m-0 whitespace-pre-line text-[0.9375rem] leading-snug text-ink", rv.text));
      if (rv.photo) { const im = mk("img", "aspect-square w-full object-cover"); im.src = rv.photo.sizes[480] ?? rv.photo.url; im.alt = rv.photo.alt || `Photo de ${rv.author}`; im.loading = "lazy"; li.append(im); }
      const who = mk("p", "m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft");
      who.append(mk("span", "font-semibold text-burgundy-deep", rv.author));
      if (rv.verified) who.append(mk("span", "text-xs font-semibold tracking-[0.08em] text-rose-dusty uppercase", "Achat vérifié"));
      li.append(who);
      if (rv.reply) li.append(mk("p", "m-0 border-l-2 border-gold pl-3 text-sm text-ink-soft", `Maison Sabra : ${rv.reply}`));
      return li;
    }));
  }
  async function refreshReviews() {
    const slug = cur.slug;
    if (slug in page.reviews) { paintReviews(page.reviews[slug]); return; }
    paintReviews(null);
    try { const r = await fetchReviews(slug); page.reviews[slug] = r; if (cur.slug === slug) paintReviews(r); } catch { /* no reviews shown rather than invented ones */ }
  }

  /* ---------- Quantity offer (defined by the CMS, confirmed by POST /promo) ---------- */
  const offer = $("[data-offer]");
  const secondBox = $("[data-second]");
  const secondList = $("[data-second-list]");
  const itemOf = (slug: string, n: number, variant?: string) => ({ slug, qty: n, ...(variant ? { variant } : {}) });

  function paintSecond() {
    secondList.replaceChildren(...eligible.map((b) => {
      const label = mk("label", "group/v relative block w-[4.5rem] shrink-0 cursor-pointer min-[60rem]:w-20");
      const input = document.createElement("input");
      input.type = "radio"; input.name = "second"; input.value = b.slug; input.className = "peer sr-only"; input.checked = b.slug === second?.slug;
      const box = mk("span", "block overflow-hidden ring-1 ring-burgundy/20 transition-shadow duration-300 group-hover/v:ring-burgundy/60 peer-checked:ring-2 peer-checked:ring-burgundy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-burgundy");
      box.style.background = tone();
      const im = mk("img", "aspect-square w-full object-cover mix-blend-multiply");
      im.src = data.find((d) => d.slug === b.slug)?.thumb ?? b.img; im.alt = ""; im.width = 80; im.height = 80; im.loading = "lazy";
      box.append(im);
      label.append(input, box, mk("span", "mt-1.5 block truncate text-center text-xs text-ink-soft peer-checked:font-semibold peer-checked:text-burgundy", data.find((d) => d.slug === b.slug)?.short ?? b.name));
      return label;
    }));
    set("[data-second-name]", data.find((d) => d.slug === second?.slug)?.short ?? second?.name ?? "");
  }
  async function pickSecond(slug: string) {
    second = eligible.find((b) => b.slug === slug) ?? second;
    paintSecond();
    const my = ++seq;
    const v = sel()?.name;
    const items = second!.slug === cur.slug ? [itemOf(cur.slug, 2, v)] : [itemOf(cur.slug, 1, v), itemOf(second!.slug, 1)];
    pair = offerCfg ? await verify(offerCfg, items) : null;
    if (my !== seq) return;
    paint();
  }
  secondList.addEventListener("change", (e) => pickSecond((e.target as HTMLInputElement).value));

  offer.addEventListener("change", async (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name !== "qty") return;
    qty = t.value === "2" ? 2 : 1;
    show(secondBox, qty === 2); secondBox.classList.toggle("grid", qty === 2);
    if (qty === 2) {
      second ??= eligible.find((b) => b.slug !== cur.slug) ?? eligible.find((b) => b.slug === cur.slug);
      if (second) await pickSecond(second.slug);
    } else { pair = null; seq++; paint(); }
  });

  async function refreshOffer() {
    const my = ++seq;
    pair = null; second = undefined; qty = 1;
    offer.querySelector<HTMLInputElement>('input[name="qty"][value="1"]')!.checked = true;
    show(secondBox, false); secondBox.classList.remove("grid");
    const cfg = await loadOffer();
    if (my !== seq) return;
    offerCfg = cfg && buyable() && qualifies(cfg, cur.slug) ? cfg : null;
    one = offerCfg ? await verify(offerCfg, [itemOf(cur.slug, offerCfg.quantity, sel()?.name)]) : null;
    if (my !== seq) return;
    // Hidden unless the CMS offer is live AND the CMS confirms it for this product.
    const live = !!offerCfg && !!one;
    offer.classList.toggle("hidden", !live); offer.classList.toggle("grid", live);
    const pickable = live && offerCfg!.quantity === 2; // the picker is built for « 2 bags »; other quantities get a note
    show($("[data-offer-choices]"), pickable);
    show($("[data-offer-note]"), live && !pickable);
    if (live && !pickable) $("[data-offer-note]").textContent = `${offerCfg!.title} : −${one!.percent} % dès ${offerCfg!.quantity} sacs. ${offerCfg!.quantity} sacs à ${fmtMad(unitPrice())} : vous économisez ${fmtMad(one!.discount)}.`;
    if (live) $("[data-offer-legend]").textContent = offerCfg!.badge ?? "Votre sélection";
    paint();
    if (!pickable) return;
    bags = await loadBags();
    if (my !== seq) return;
    eligible = bags.filter((b) => qualifies(offerCfg!, b.slug) && b.purchasable !== false && (!b.variants?.length || b.slug === cur.slug));
    paint();
  }

  /* ---------- Purchase ---------- */
  const add = () => {
    if (!buyable()) return false;
    addToCart({ id: cur.slug, name: cur.name, price: unitPrice(), img: thumbNow(), ...(sel() ? { variant: sel()!.name } : {}) });
    if (qty === 2) {
      const s = second ?? bags.find((b) => b.slug === cur.slug)!;
      if (s.slug === cur.slug) addToCart({ id: cur.slug, name: cur.name, price: unitPrice(), img: thumbNow(), ...(sel() ? { variant: sel()!.name } : {}) });
      else addToCart({ id: s.slug, name: s.name, price: s.price, img: data.find((d) => d.slug === s.slug)?.thumb ?? s.img });
    }
    return true;
  };
  root.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-pdp-buy]")) { if (add()) location.assign("/commande"); }
    else if (t.closest("[data-pdp-add]")) { if (add()) document.querySelector<HTMLElement>("[data-cart-link]")?.click(); }
  });

  /* ---------- Sticky bar ---------- */
  const sticky = $("[data-sticky]");
  const cta = $("[data-primary-cta]");
  new IntersectionObserver(([en]) => {
    const on = !en.isIntersecting && en.boundingClientRect.top < 0;
    sticky.dataset.show = String(on);
    sticky.toggleAttribute("inert", !on);
  }).observe(cta);

  paintVariants();
  paint();
  refreshReviews();
  refreshOffer();
  if (photos()[0]?.src !== cur.imgs[0]?.src) buildGallery(cur); // a preselected variant with its own photo
}
