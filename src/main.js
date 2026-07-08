import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initTheme } from "./ui/theme.js";
import { initWaitlistForm } from "./ui/form.js";
import { initHero } from "./animations/hero.js";
import { initReveals } from "./animations/reveals.js";
import { initSmoothScroll } from "./scroll.js";

/* ============================================================
   VAULTPET — Orquestador. Registra ScrollTrigger y arranca cada
   módulo en orden. El visor 3D (Three) se carga en su propio
   chunk solo cuando la sala de cajas se acerca al viewport.
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initTheme();
initWaitlistForm();
initHero();

if (!reduceMotion) {
  initSmoothScroll();
  initReveals();
}

// Lazy-load del visor 3D cuando "Drops" se acerca (bundle inicial más ligero)
const dropsSection = document.getElementById("drops");
if (dropsSection) {
  const io = new IntersectionObserver(
    (entries, obs) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        import("./viewers/deposit-viewers.js").then((m) => m.initDepositViewers());
      }
    },
    { rootMargin: "600px 0px" }
  );
  io.observe(dropsSection);
}
