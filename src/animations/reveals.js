import { gsap } from "gsap";

/* Reveals suaves al entrar cada bloque en el viewport (el hero tiene su
   propia animación aparte). Requiere ScrollTrigger registrado (main.js). */
export function initReveals() {
  const targets = gsap.utils.toArray([
    ".drops .section-head",
    ".deposit-box",
    ".manifiesto-title",
    ".spec",
    ".proceso .section-head",
    ".proceso-list li",
    ".acceso-panel",
  ]);

  targets.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.7,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });
}
