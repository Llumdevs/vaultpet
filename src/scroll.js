import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/* Scroll suave (Lenis) integrado con el ticker de GSAP para que ScrollTrigger
   (hero/buceo, reveals) siga funcionando. En táctil NO suaviza (scroll nativo).
   Además, enlaces internos (#...) con scroll suave. Devuelve la instancia. */
export function initSmoothScroll() {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const target = href.length > 1 ? document.querySelector(href) : null;
      e.preventDefault();
      if (target) lenis.scrollTo(target, { offset: -20 });
      else lenis.scrollTo(0);
    });
  });

  return lenis;
}
