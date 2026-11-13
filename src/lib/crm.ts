/**
 * Maison Sabra's backend is the shared CRM (Payload). Every call is scoped to this store by the
 * tenant slug in the URL: `${PUBLIC_CRM_URL}/api/store/${PUBLIC_CRM_TENANT}/…`.
 */
const BASE = (import.meta.env.PUBLIC_CRM_URL as string | undefined)?.replace(/\/$/, "");
const TENANT = import.meta.env.PUBLIC_CRM_TENANT as string | undefined;

/** False when the env vars are missing: pages fall back to bundled data and ordering is disabled. */
export const crmReady = !!(BASE && TENANT);

export const crmUrl = (path: string) => `${BASE}/api/store/${TENANT}${path}`;

/** POST JSON. Resolves with the Response; non-2xx bodies are `{ error: "<code>" }`. */
export const crmPost = (path: string, body: unknown, signal?: AbortSignal) =>
  fetch(crmUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
    signal,
  });

/** The error code the CRM returned (e.g. `invalid_promo`), or "" when the body isn't JSON. */
export const crmErrorCode = async (res: Response): Promise<string> => {
  try { return String(((await res.json()) as { error?: string }).error ?? ""); } catch { return ""; }
};
