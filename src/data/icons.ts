// Stroke icons for the CMS benefit "icon" field (BENEFIT_ICONS in the CMS). Unknown or missing keys fall back to a tick.
const p = (d: string) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const icons: Record<string, string> = {
  tick: p('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  hand: p('<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-2.5-3.5a1.5 1.5 0 0 1 2.3-1.9L8 14"/>'),
  gem: p('<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 5 3-5M12 20L9 9m3 11l3-11"/>'),
  leather: p('<path d="M4 8c2-3 5-4 8-4s6 1 8 4v8c-2 3-5 4-8 4s-6-1-8-4z"/><path d="M8 12h8" stroke-dasharray="2 2"/>'),
  sparkle: p('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>'),
  bag: p('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  chain: p('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  palette: p('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.3.2-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
  heritage: p('<path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6"/>'),
  gift: p('<path d="M4 11h16v9H4zM3 8h18v3H3zM12 8v12"/><path d="M12 8S10 3.5 7.5 4.5 8 8 12 8zm0 0s2-4.5 4.5-3.5S16 8 12 8z"/>'),
  truck: p('<path d="M2 6h11v10H2zM13 9h4l4 3v4h-8"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  return: p('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  shield: p('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  heart: p('<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>'),
  ruler: p('<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2m1-5l2 2m1-5l2 2"/>'),
};
export const benefitIcon = (key?: string | null) => icons[key ?? ""] ?? icons.tick;
