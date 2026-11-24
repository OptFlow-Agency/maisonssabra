import Lenis from "lenis";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// One shared instance. Null under reduced motion, so native scrolling is untouched.
export const lenis: Lenis | null = reduce
  ? null
  // lerp: each frame closes 14 % of the gap to the wheel target. Smooth, but it tracks the hand instead of gliding
  // for over a second after it (the old duration: 1.15 felt like lag). Touch keeps native scrolling (Lenis default).
  : new Lenis({ lerp: 0.14, wheelMultiplier: 1, anchors: true });

if (lenis) {
  const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/** Lock / unlock page scroll (mobile menu). Works with or without Lenis. */
export function lockScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  if (lenis) lock ? lenis.stop() : lenis.start();
}

/** Subscribe to scroll position in px, whether Lenis or native drives it. */
export function onScroll(fn: (y: number) => void) {
  if (lenis) lenis.on("scroll", ({ scroll }: { scroll: number }) => fn(scroll));
  else addEventListener("scroll", () => fn(scrollY), { passive: true });
}
