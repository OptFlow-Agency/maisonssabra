/**
 * Brand films shown on the homepage. The CMS has no video collection yet (media is images only), so the list lives here:
 * add a film by appending an entry. Poster 540x960 (9:16), mp4 under ~4 MB, genuine approved Maison Sabra footage only.
 * To manage them in the CMS later: a `films` collection (video upload, poster, title, note, sortOrder, active) plus a /films store endpoint.
 */
export type Film = { src: string; poster: string; title: string; note: string; label: string };

export const films: Film[] = [
  { src: "/zmancollection/lp/assets/videos/zman-ugc-1.mp4", poster: "/zmancollection/lp/assets/videos/zman-ugc-1.jpg", title: "Maison Sabra sur 2M", note: "L’élégance marocaine à l’honneur", label: "Maison Sabra sur 2M, l’élégance marocaine à l’honneur" },
  { src: "/zmancollection/lp/assets/videos/zman-deballage-rouge.mp4", poster: "/zmancollection/lp/assets/videos/zman-deballage-rouge.jpg", title: "Le déballage du coffret", note: "Le sac Z’man rouge, de près", label: "Déballage du sac Z’man rouge, son coffret et ses détails" },
  { src: "/zmancollection/lp/assets/videos/zman-ugc-3.mp4", poster: "/zmancollection/lp/assets/videos/zman-ugc-3.jpg", title: "Z’man, portée", note: "La collection avec des caftans", label: "La collection Z’man portée avec des caftans" },
];
