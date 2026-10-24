import { supabase, variant, toast, type ProductRow } from "./supabase";
import { uploadImage, removeImage } from "./images";

const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]")!;
const form = sheet.querySelector<HTMLFormElement>("[data-form]")!;
const formError = form.querySelector<HTMLElement>("[data-form-error]")!;
const submit = form.querySelector<HTMLButtonElement>("[data-submit]")!;
const submitLabel = form.querySelector<HTMLElement>("[data-submit-label]")!;
const removeBtn = form.querySelector<HTMLButtonElement>("[data-remove-image2]")!;
const deleteBtn = form.querySelector<HTMLButtonElement>("[data-delete]")!;
const dlg = document.querySelector<HTMLDialogElement>("[data-delete-dialog]")!;
const f = (id: string) => form.elements.namedItem(id) as HTMLInputElement;
const msgOf = (id: string) => form.querySelector<HTMLElement>(`#${id}-msg`)!;

let existing: ProductRow | null = null;
let removeSecond = false;
let slugTouched = false;
let dirty = false;
let opener: HTMLElement | null = null;
let onSaved: (what: "saved" | "deleted") => void = () => {};

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const lock = (on: boolean) => { document.documentElement.style.overflow = on ? "hidden" : ""; };

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const setPreview = (id: "image" | "image2", src: string | null) => {
  const img = form.querySelector<HTMLImageElement>(`[data-preview=${id}]`)!;
  if (src) img.src = src;
  img.classList.toggle("hidden", !src);
};
const syncRemove = () => removeBtn.classList.toggle("hidden", !(f("image2").files?.length || (existing?.image2 && !removeSecond)));
const busy = (on: boolean, label = "Enregistrer") => { submit.disabled = on; submitLabel.textContent = label; };
const showError = (t: string) => { formError.textContent = t; formError.classList.remove("hidden"); formError.focus(); };

/* ---------- Open / close ---------- */
function close(force = false) {
  if (!sheet.open) return;
  if (!force && dirty && !confirm("Fermer sans enregistrer ? Vos modifications seront perdues.")) return;
  sheet.dataset.open = "false";
  const done = () => { sheet.close(); lock(false); opener?.focus(); };
  reduced.matches ? done() : setTimeout(done, 380);
}

function reset() {
  form.reset();
  for (const id of ["image", "image2"] as const) setPreview(id, null);
  for (const m of form.querySelectorAll<HTMLElement>("[data-msg]")) { m.textContent = m.dataset.hint ?? ""; m.className = "m-0 min-h-5 text-sm text-ink-soft"; }
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
  formError.classList.add("hidden");
  f("slug").disabled = false;
  existing = null; removeSecond = false; slugTouched = false; dirty = false;
  deleteBtn.classList.add("hidden");
  syncRemove();
  busy(false);
}

/** Opens the sheet to create a product, or to edit `product`. `done` runs after a save or delete. */
export function openSheet(product: ProductRow | null, done: (what: "saved" | "deleted") => void) {
  if (sheet.open) return;
  reset();
  onSaved = done;
  opener = document.activeElement as HTMLElement | null;
  const title = sheet.querySelector<HTMLElement>("[data-title]")!;
  title.textContent = product ? "Modifier le produit" : "Ajouter un produit";

  if (product) {
    existing = product;
    slugTouched = true;
    f("name").value = product.name;
    f("slug").value = product.slug; f("slug").disabled = true;
    const m = msgOf("slug");
    m.textContent = m.dataset.hint = "Ne peut plus changer : utilisée par le panier, les commandes et Google.";
    f("collection").value = product.collection;
    f("description").value = product.description;
    f("price").value = String(product.price);
    f("was_price").value = product.was_price ? String(product.was_price) : "";
    f("alt").value = product.alt;
    f("is_new").checked = product.is_new;
    f("active").checked = product.active;
    setPreview("image", variant(product.image, 480));
    if (product.image2) setPreview("image2", variant(product.image2, 480));
    syncRemove();
    deleteBtn.classList.remove("hidden");
  }

  sheet.showModal();
  lock(true);
  requestAnimationFrame(() => { sheet.dataset.open = "true"; f("name").focus({ preventScroll: true }); });
}

sheet.querySelectorAll("[data-sheet-close]").forEach((b) => b.addEventListener("click", () => close()));
sheet.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });

/* ---------- Fields ---------- */
for (const id of ["image", "image2"] as const) {
  f(id).addEventListener("change", () => {
    dirty = true;
    const file = f(id).files?.[0];
    if (id === "image2") removeSecond = false;
    if (file) setPreview(id, URL.createObjectURL(file));
    else setPreview(id, id === "image" ? (existing ? variant(existing.image, 480) : null) : (existing?.image2 ? variant(existing.image2, 480) : null));
    syncRemove();
    if (id === "image") check("image");
  });
}
removeBtn.addEventListener("click", () => { dirty = true; f("image2").value = ""; removeSecond = true; setPreview("image2", null); syncRemove(); });

f("name").addEventListener("input", () => { if (!slugTouched) f("slug").value = slugify(f("name").value); });
f("slug").addEventListener("input", () => { slugTouched = true; });
form.addEventListener("input", () => { dirty = true; });

const rules: Record<string, () => string> = {
  name: () => (f("name").value.trim().length < 3 ? "Saisissez le nom du produit (3 caractères minimum)." : ""),
  slug: () => (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f("slug").value) ? "" : "Utilisez uniquement des lettres minuscules, des chiffres et des tirets."),
  price: () => (f("price").value !== "" && Number.isInteger(Number(f("price").value)) && Number(f("price").value) > 0 ? "" : "Saisissez un prix en dhs, supérieur à 0."),
  was_price: () => (!f("was_price").value || Number(f("was_price").value) > Number(f("price").value) ? "" : "Le prix barré doit être supérieur au prix."),
  image: () => (existing || f("image").files?.length ? "" : "Ajoutez l’image principale."),
};
function check(id: string) {
  const err = rules[id]();
  const m = msgOf(id);
  if (err) f(id).setAttribute("aria-invalid", "true"); else f(id).removeAttribute("aria-invalid");
  m.textContent = err || m.dataset.hint || "";
  m.className = err ? "m-0 min-h-5 text-sm font-medium text-burgundy-deep" : "m-0 min-h-5 text-sm text-ink-soft";
  return !err;
}
Object.keys(rules).forEach((id) => {
  f(id).addEventListener("blur", () => { if (f(id).value) check(id); });
  f(id).addEventListener("input", () => {
    if (f(id).getAttribute("aria-invalid")) check(id);
    if (!form.querySelector("[aria-invalid]")) formError.classList.add("hidden");
  });
});

/* ---------- Save ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.classList.add("hidden");
  const bad = Object.keys(rules).filter((id) => !check(id));
  if (bad.length) { showError(`Veuillez corriger ${bad.length > 1 ? "les champs signalés" : "le champ signalé"}.`); f(bad[0]).focus(); return; }

  busy(true, "Enregistrement…");
  const uploaded: string[] = [];
  try {
    const slug = f("slug").value;
    let image = existing?.image ?? "";
    let image2 = removeSecond ? null : existing?.image2 ?? null;
    const main = f("image").files?.[0], second = f("image2").files?.[0];
    if (main) { image = await uploadImage(main, slug); uploaded.push(image); }
    if (second) { image2 = await uploadImage(second, `${slug}-2`); uploaded.push(image2); }

    const row = {
      name: f("name").value.trim(),
      collection: f("collection").value as "bladi" | "zman",
      price: Number(f("price").value),
      was_price: f("was_price").value ? Number(f("was_price").value) : null,
      description: f("description").value.trim(),
      image, image2,
      alt: f("alt").value.trim(),
      is_new: f("is_new").checked,
      active: f("active").checked,
    };
    const { error } = existing
      ? await supabase.from("products").update(row).eq("slug", existing.slug)
      : await supabase.from("products").insert({ slug, ...row });
    if (error) {
      await Promise.all(uploaded.map(removeImage));
      if (error.code === "23505") { f("slug").setAttribute("aria-invalid", "true"); msgOf("slug").textContent = "Cette adresse existe déjà. Modifiez-la."; showError("Ce produit existe déjà : changez l’adresse de la page."); f("slug").focus(); }
      else showError(error.code === "42501" ? "Votre session a expiré. Reconnectez-vous puis réessayez." : "L’enregistrement a échoué. Vos modifications sont conservées : réessayez.");
      busy(false);
      return;
    }
    if (existing) {
      if (main) await removeImage(existing.image);
      if (second || removeSecond) await removeImage(existing.image2);
    }
    dirty = false;
    close(true);
    onSaved("saved");
  } catch (err) {
    await Promise.all(uploaded.map(removeImage));
    showError(err instanceof Error ? err.message : "L’enregistrement a échoué. Réessayez.");
    busy(false);
  }
});

/* ---------- Delete ---------- */
deleteBtn.addEventListener("click", () => { dlg.querySelector("[data-delete-name]")!.textContent = existing?.name ?? ""; dlg.showModal(); });
dlg.querySelector("[data-delete-cancel]")!.addEventListener("click", () => dlg.close());
dlg.querySelector("[data-delete-confirm]")!.addEventListener("click", async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  btn.disabled = true; btn.textContent = "Suppression…";
  const { error } = await supabase.from("products").delete().eq("slug", existing!.slug);
  btn.disabled = false; btn.textContent = "Supprimer";
  dlg.close();
  if (error) { toast("La suppression a échoué. Réessayez.", "error"); return; }
  await Promise.all([removeImage(existing?.image), removeImage(existing?.image2)]);
  dirty = false;
  close(true);
  onSaved("deleted");
});
