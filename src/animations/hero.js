import { gsap } from "gsap";

/* Hero type-reveal + "buceo" al hacer scroll.
   - Primera impresión: el holo sigue al cursor (revelado por blob).
   - Al bajar: el holo crece desde el centro (barato) y luego zoom grande
     con holo completo cacheado en GPU (clases .diving/.diving-full).
   Requiere que ScrollTrigger esté registrado (lo hace main.js). */
export function initHero() {
  const hero = document.getElementById("hero");
  const wordmark = document.querySelector(".wordmark");
  const reveal = document.querySelector(".wordmark__reveal");
  const veil = document.querySelector(".hero__veil");
  if (!hero || !wordmark || !reveal) return;

  const canHover = window.matchMedia("(hover: hover)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Revelado al cursor ---------- */
  if (canHover) {
    const blobRadius = () => Math.round(Math.max(150, Math.min(320, window.innerWidth * 0.2)));

    hero.addEventListener("pointermove", (e) => {
      const r = wordmark.getBoundingClientRect();
      reveal.style.setProperty("--mx", e.clientX - r.left + "px");
      reveal.style.setProperty("--my", e.clientY - r.top + "px");
    });
    hero.addEventListener("pointerenter", () => {
      gsap.to(reveal, { "--blob": blobRadius() + "px", duration: 0.35, ease: "power2.out" });
    });
    hero.addEventListener("pointerleave", () => {
      gsap.to(reveal, { "--blob": "0px", duration: 0.35, ease: "power2.out" });
    });
  }

  /* ---------- Pausa el shimmer cuando el hero sale de pantalla ---------- */
  new IntersectionObserver(([entry]) => {
    reveal.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
  }).observe(hero);

  /* ---------- Buceo ---------- */
  if (!veil || reduceMotion) return;

  const mm = gsap.matchMedia();

  // Desktop: pin + zoom grande, con holo cacheado en GPU en la fase 2.
  mm.add("(min-width: 768px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=110%",
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          wordmark.classList.toggle("diving", p > 0.02);
          wordmark.classList.toggle("diving-full", p > 0.4);
        },
      },
    });
    tl.to(
      [".hero-eyebrow", ".hero-sub", ".scroll-hint"],
      { opacity: 0, ease: "none", duration: 0.15 },
      0
    )
      .to(reveal, { "--dive": "1000px", ease: "none", duration: 0.4 }, 0)
      .to(wordmark, { scale: 1.3, ease: "none", duration: 0.4 }, 0)
      .to(wordmark, { scale: 6.5, ease: "none", duration: 0.6 }, 0.4)
      .to(veil, { opacity: 1, ease: "none", duration: 0.6 }, 0.4);
  });

  // Móvil: pin corto sin transformar el wordmark (para no congelar el holo).
  mm.add("(max-width: 767px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * 0.55),
        scrub: 0.3,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(
      [".hero-eyebrow", ".hero-sub", ".scroll-hint"],
      { opacity: 0, ease: "none", duration: 0.2 },
      0
    ).to(veil, { opacity: 1, ease: "none", duration: 0.65 }, 0.12);
  });
}
