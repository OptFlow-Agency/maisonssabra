import { supabase } from "./supabase";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);

/** Signs out and returns a message when the account is not on the admins list. */
async function checkAdmin(): Promise<string | null> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) { await supabase.auth.signOut(); return "Connexion impossible pour le moment. Réessayez."; }
  if (!data) { await supabase.auth.signOut(); return "Ce compte n’a pas accès à l’administration."; }
  return null;
}

/**
 * Shows the login panel until an admin session exists, then reveals the app and calls `onReady`.
 * Access is enforced by database policies, never by this page: hiding the UI is a convenience.
 */
export async function guard(onReady: () => void | Promise<void>, { loginHere = true } = {}) {
  const login = $("[data-login]");
  const app = $("[data-app]");
  const form = $<HTMLFormElement>("[data-login-form]");
  const err = $("[data-login-error]");
  const show = (ready: boolean) => { login?.toggleAttribute("hidden", ready); app?.toggleAttribute("hidden", !ready); };

  $("[data-logout]")?.addEventListener("click", async () => { await supabase.auth.signOut(); location.assign("/admin/"); });

  const { data: { session } } = await supabase.auth.getSession();
  if (session && !(await checkAdmin())) {
    const user = $("[data-user]"); if (user) user.textContent = session.user.email ?? "";
    show(true);
    await onReady();
    return;
  }
  if (!loginHere) { location.assign("/admin/"); return; }
  show(false);
  $<HTMLInputElement>("#email")?.focus();

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    const label = btn.textContent;
    err!.classList.add("hidden");
    btn.disabled = true; btn.textContent = "Connexion…";
    const fd = new FormData(form);
    const { error } = await supabase.auth.signInWithPassword({ email: String(fd.get("email")).trim(), password: String(fd.get("password")) });
    const msg = error ? "E-mail ou mot de passe incorrect." : await checkAdmin();
    if (msg) {
      err!.textContent = msg; err!.classList.remove("hidden");
      btn.disabled = false; btn.textContent = label;
      return;
    }
    location.reload();
  });
}
