import { supabase, variant, toast, type ProductLite, type PromoRow } from "./supabase";

const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]")!;
const form = sheet.querySelector<HTMLFormElement>("[data-form]")!;
const formError = form.querySelector<HTMLElement>("[data-form-error]")!;
const submit = form.querySelector<HTMLButtonElement>("[data-submit]")!;
const submitLabel = form.querySelector<HTMLElement>("[data-submit-label]")!;
const deleteBtn = form.querySelector<HTMLButtonElement>("[data-delete]")!;
const list = form.querySelector<HTMLElement>("[data-products]")!;
const count = form.querySelector<HTMLElement>("[data-selected-count]")!;
const toggleAll = form.querySelector<HTMLButtonElement>("[data-toggle-all]")!;
const dlg = document.querySelector<HTMLDialogElement>("[data-delete-dialog]")!;
const f = (id: string) => form.elements.namedItem(id) as HTMLInputElement;
const msgOf = (id: string) => form.querySelector<HTMLElement>(`#${id}-msg`)!;
const boxes = () => [...list.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];

let existing: PromoRow | null = null;
let dirty = false;
let opener: HTMLElement | null = null;
let onDone: (what: "saved" | "deleted") => void = () => {};
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const lock = (on: boolean) => { document.documentElement.style.overflow = on ? "hidden" : ""; };
const busy = (on: boolean, label = "Enregistrer") => { submit.disabled = on; submitLabel.textContent = label; };
const showError = (t: string) => { formError.textContent = t; formError.classList.remove("hidden"); formError.focus(); };
const setMsg = (id: string, err: string) => {
  const m = msgOf(id);
  m.textContent = err || m.dataset.hint || "";
  m.className = err ? "m-0 min-h-5 text-sm font-medium text-burgundy-deep" : "m-0 min-h-5 text-sm text-ink-soft";
};

function syncCount() {
  const n = boxes().filter((b) => b.checked).length, total = boxes().length;
  count.textContent = `${n} sur ${total} sélectionné${n > 1 ? "s" : ""}`;
  toggleAll.textContent = n === total && total > 0 ? "Tout désélectionner" : "Tout sélectionner";
}

function renderProducts(products: ProductLite[], selected: Set<string>) {
  list.replaceChildren(...products.map((p) => {
    const li = document.createElement("li");
    li.className = "bg-white";
    const label = document.createElement("label");
    label.className = "flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-cream-soft";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.value = p.slug; cb.checked = selected.has(p.slug); cb.className = "size-5 shrink-0 accent-burgundy";
    const img = document.createElement("img");
    img.src = variant(p.image, 480); img.alt = ""; img.width = 40; img.height = 40; img.loading = "lazy";
    img.className = "size-10 shrink-0 bg-cream-soft object-cover";
    const name = document.createElement("span");
    name.className = "min-w-0 flex-1 text-sm";
    name.textContent = p.name;
    label.append(cb, img, name);
    if (!p.active) { const off = document.createElement("span"); off.className = "shrink-0 text-xs text-ink-soft"; off.textContent = "Masqué"; label.append(off); }
    li.append(label);
    return li;
  }));
  syncCount();
}

function reset() {
  form.reset();
  formError.classList.add("hidden");
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
  for (const id of ["code", "percent", "products"]) setMsg(id, "");
  f("code").disabled = false;
  existing = null; dirty = false;
  deleteBtn.classList.add("hidden");
  busy(false);
}

function close(force = false) {
  if (!sheet.open) return;
  if (!force && dirty && !confirm("Fermer sans enregistrer ? Vos modifications seront perdues.")) return;
  sheet.dataset.open = "false";
  const done = () => { sheet.close(); lock(false); opener?.focus(); };
  reduced.matches ? done() : setTimeout(done, 380);
}

/** Opens the sheet to create a code, or to edit `promo`. `products` is the full catalogue to choose from. */
export function openPromoSheet(promo: PromoRow | null, products: ProductLite[], done: (what: "saved" | "deleted") => void) {
  if (sheet.open) return;
  reset();
  onDone = done;
  opener = document.activeElement as HTMLElement | null;
  sheet.querySelector<HTMLElement>("[data-title]")!.textContent = promo ? "Modifier le code" : "Créer un code promo";
  renderProducts(products, new Set(promo?.promo_code_products.map((x) => x.product_slug)));
  if (promo) {
    existing = promo;
    f("code").value = promo.code; f("code").disabled = true;
    f("percent").value = String(promo.percent);
    f("active").checked = promo.active;
    f("second_item_only").checked = promo.second_item_only;
    deleteBtn.classList.remove("hidden");
  }
  sheet.showModal();
  lock(true);
  requestAnimationFrame(() => { sheet.dataset.open = "true"; (promo ? f("percent") : f("code")).focus({ preventScroll: true }); });
}

sheet.querySelectorAll("[data-sheet-close]").forEach((b) => b.addEventListener("click", () => close()));
sheet.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
form.addEventListener("input", () => { dirty = true; });

f("code").addEventListener("input", () => { f("code").value = f("code").value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
list.addEventListener("change", () => { syncCount(); if (boxes().some((b) => b.checked)) setMsg("products", ""); });
toggleAll.addEventListener("click", () => { const all = boxes().every((b) => b.checked); boxes().forEach((b) => (b.checked = !all)); dirty = true; syncCount(); if (!all) setMsg("products", ""); });

/* ---------- Validation ---------- */
const rules: Record<string, () => string> = {
  code: () => (/^[A-Z0-9]{3,20}$/.test(f("code").value) ? "" : "Utilisez 3 à 20 lettres ou chiffres, sans espace."),
  percent: () => { const n = Number(f("percent").value); return f("percent").value !== "" && Number.isInteger(n) && n >= 1 && n <= 90 ? "" : "Saisissez un pourcentage entier entre 1 et 90."; },
  products: () => (boxes().some((b) => b.checked) ? "" : "Choisissez au moins un produit."),
};
function check(id: string) {
  const err = rules[id]();
  if (id !== "products") { if (err) f(id).setAttribute("aria-invalid", "true"); else f(id).removeAttribute("aria-invalid"); }
  setMsg(id, err);
  return !err;
}
for (const id of ["code", "percent"]) {
  f(id).addEventListener("blur", () => { if (f(id).value) check(id); });
  f(id).addEventListener("input", () => { if (f(id).getAttribute("aria-invalid")) check(id); if (!form.querySelector("[aria-invalid]")) formError.classList.add("hidden"); });
}

/* ---------- Save ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.classList.add("hidden");
  const bad = Object.keys(rules).filter((id) => !check(id));
  if (bad.length) { showError(`Veuillez corriger ${bad.length > 1 ? "les champs signalés" : "le champ signalé"}.`); (bad[0] === "products" ? boxes()[0] : f(bad[0]))?.focus(); return; }

  busy(true, "Enregistrement…");
  const { error } = await supabase.rpc("save_promo", {
    p_code: f("code").value,
    p_percent: Number(f("percent").value),
    p_active: f("active").checked,
    p_slugs: boxes().filter((b) => b.checked).map((b) => b.value),
    p_create: !existing,
  });
  const flag = error ? null : await supabase.from("promo_codes").update({ second_item_only: f("second_item_only").checked }).eq("code", f("code").value);
  if (flag?.error) { showError("Le code est enregistré, mais l’option « 2e article » a échoué. Réessayez."); busy(false); existing = { ...(existing ?? ({} as PromoRow)), code: f("code").value }; return; }
  if (error) {
    if (error.code === "23505") { f("code").setAttribute("aria-invalid", "true"); setMsg("code", "Ce code existe déjà. Choisissez-en un autre."); showError("Ce code existe déjà."); f("code").focus(); }
    else showError(error.code === "42501" ? "Votre session a expiré. Reconnectez-vous puis réessayez." : "L’enregistrement a échoué. Vos modifications sont conservées : réessayez.");
    busy(false);
    return;
  }
  dirty = false;
  close(true);
  onDone("saved");
});

/* ---------- Delete ---------- */
deleteBtn.addEventListener("click", () => { dlg.querySelector("[data-delete-name]")!.textContent = existing?.code ?? ""; dlg.showModal(); });
dlg.querySelector("[data-delete-cancel]")!.addEventListener("click", () => dlg.close());
dlg.querySelector("[data-delete-confirm]")!.addEventListener("click", async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  btn.disabled = true; btn.textContent = "Suppression…";
  const { error } = await supabase.from("promo_codes").delete().eq("code", existing!.code);
  btn.disabled = false; btn.textContent = "Supprimer";
  dlg.close();
  if (error) { toast("La suppression a échoué. Réessayez.", "error"); return; }
  dirty = false;
  close(true);
  onDone("deleted");
});
