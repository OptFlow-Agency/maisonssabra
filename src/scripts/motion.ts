// Scroll parallax: [data-parallax="0.12"] drifts by that fraction of its distance from the viewport centre.
// Skipped entirely under reduced motion, so images simply sit still.
import { onScroll } from "./smooth";

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const els = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
  if (els.length) {
    let vh = innerHeight;
    addEventListener("resize", () => (vh = innerHeight), { passive: true });
    const ks = els.map((el) => parseFloat(el.dataset.parallax || "0.1"));
    const last: string[] = [];
    const tick = () => {
      const rects = els.map((el) => el.parentElement!.getBoundingClientRect()); // all reads…
      rects.forEach((r, i) => { // …then all writes, and only when the value changed
        if (r.bottom < -200 || r.top > vh + 200) return;
        const t = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -ks[i]).toFixed(1)}px, 0) scale(1.14)`;
        if (t !== last[i]) { els[i].style.transform = t; last[i] = t; }
      });
    };
    onScroll(tick);
    tick();
  }
}
