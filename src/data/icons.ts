// Icons for the CMS benefit "icon" field (BENEFIT_ICONS in the CMS), drawn from Lucide (lucide-static: plain SVG strings,
// usable both in server markup and in the PDP script). Unknown or missing keys fall back to a check mark.
// Server-side only: the PDP ships the chosen SVG strings in its JSON payload, so the library never reaches the browser bundle.
import { Check, Gem, Gift, Hand, Heart, Landmark, Layers, Link, Palette, Ruler, ShieldCheck, ShoppingBag, Sparkles, Truck, Undo2 } from "lucide-static";

/** One consistent size and stroke for every icon, hidden from assistive tech (the benefit text carries the meaning). */
const size = (svg: string, px = 18) =>
  svg
    .replace(/\swidth="\d+"/, ` width="${px}"`)
    .replace(/\sheight="\d+"/, ` height="${px}"`)
    .replace(/stroke-width="[\d.]+"/, 'stroke-width="1.75"')
    .replace("<svg", '<svg aria-hidden="true" focusable="false"');

const icons: Record<string, string> = {
  tick: size(Check),
  hand: size(Hand),
  gem: size(Gem),
  leather: size(Layers),
  sparkle: size(Sparkles),
  bag: size(ShoppingBag),
  chain: size(Link),
  palette: size(Palette),
  heritage: size(Landmark),
  gift: size(Gift),
  truck: size(Truck),
  return: size(Undo2),
  shield: size(ShieldCheck),
  heart: size(Heart),
  ruler: size(Ruler),
};
export const benefitIcon = (key?: string | null, px?: number) => {
  const svg = icons[key ?? ""] ?? icons.tick;
  return px ? svg.replace(/width="18"/, `width="${px}"`).replace(/height="18"/, `height="${px}"`) : svg;
};
