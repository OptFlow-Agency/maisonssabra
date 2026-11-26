/**
 * Fiche technique du modèle (onglet « Details & craft » du CRM), affichée dans la section « Tout ce qu’il faut savoir ».
 * Partagé par le rendu serveur (Details.astro) et le changement de coloris (app.js) pour un balisage identique.
 * Ordre : Dimensions · Poids · Matières · Hauteur de la chaîne, les lignes « Extra » du CRM dans leur ordre, puis Entretien.
 * Un champ vide → sa ligne disparaît ; aucune ligne → "" (section masquée).
 */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function specRows(m) {
  return [
    ["Dimensions", m.dimensions],
    ["Poids", m.weight],
    ["Matières", m.materials],
    ["Hauteur de la chaîne", m.strapDrop],
    ...(m.extra || []).map((e) => [e.label, e.value]),
    ["Entretien", m.care],
  ].filter(([k, v]) => k && v);
}

export function specsHtml(m) {
  return specRows(m)
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v).replace(/\n+/g, "<br>")}</dd></div>`)
    .join("");
}
