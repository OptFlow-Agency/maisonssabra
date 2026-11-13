// Scroll parallax: [data-parallax="0.12"] drifts by that fraction of its distance from the viewport centre.
// Skipped entirely under reduced motion, so images simply sit still.
import { onScroll } from "./smooth";

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
  if (els.length) {
    let vh = innerHeight;
    addEventListener("resize", () => (vh = innerHeight), { passive: true });
    const tick = () => {
      for (const el of els) {
        const r = el.parentElement!.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const k = parseFloat(el.dataset.parallax || "0.1");
        const offset = (r.top + r.height / 2 - vh / 2) * -k;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.14)`;
      }
    };
    onScroll(tick);
    tick();
  }
}
