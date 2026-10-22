// Fade-up on scroll. Content is only hidden once JS has marked <html class="js">.
const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
  items.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
}
