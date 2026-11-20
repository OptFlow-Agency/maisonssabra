/**
 * Brand films shown on the homepage. The CMS has no video collection yet (media is images only), so the list lives here:
 * add a film by appending an entry. Poster 540x960 (9:16), mp4 under ~4 MB, genuine approved Maison Sabra footage only.
 * To manage them in the CMS later: a `films` collection (video upload, poster, title, note, sortOrder, active) plus a /films store endpoint.
 */
export type Film = { src: string; poster: string; title: string; note: string; label: string };

export const films: Film[] = [
  { src: "/assets/videos/maisonsabra-event.mp4", poster: "/assets/videos/maisonsabra-event.jpg", title: "Maison Sabra, l’événement", note: "La soirée en intégralité", label: "Vidéo complète de l’événement Maison Sabra" },
  { src: "/zmancollection/lp/assets/videos/zman-ugc-1.mp4", poster: "/zmancollection/lp/assets/videos/zman-ugc-1.jpg", title: "Maison Sabra sur 2M", note: "L’élégance marocaine à l’honneur", label: "Maison Sabra sur 2M, l’élégance marocaine à l’honneur" },
  { src: "/zmancollection/lp/assets/videos/zman-deballage-rouge.mp4", poster: "/zmancollection/lp/assets/videos/zman-deballage-rouge.jpg", title: "Le déballage du coffret", note: "Le sac Z’man rouge, de près", label: "Déballage du sac Z’man rouge, son coffret et ses détails" },
  { src: "/zmancollection/lp/assets/videos/zman-ugc-3.mp4", poster: "/zmancollection/lp/assets/videos/zman-ugc-3.jpg", title: "Z’man, portée", note: "La collection avec des caftans", label: "La collection Z’man portée avec des caftans" },
  { src: "/assets/videos/maisonsabra-video.mp4", poster: "/assets/videos/maisonsabra-video.jpg", title: "Maison Sabra, en images", note: "L’univers de la Maison", label: "Vidéo de présentation de l’univers Maison Sabra" },
  { src: "/assets/videos/maisonsabra-craft.mp4", poster: "/assets/videos/maisonsabra-craft.jpg", title: "Maison Sabra, le savoir-faire", note: "Le geste et la matière", label: "Vidéo du savoir-faire artisanal Maison Sabra" },
  { src: "/assets/videos/post-video-1.mp4", poster: "/assets/videos/post-video-1.jpg", title: "Maison Sabra, en vidéo", note: "Instants Maison Sabra", label: "Vidéo Maison Sabra 1" },
];
