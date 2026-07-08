import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   VAULTPET — Hero: type-reveal + "buceo" al hacer scroll
   1) Primera impresión: wordmark gigante sobre cromo claro.
      Al mover el cursor, un blob revela un holograma animado
      DENTRO de las letras (.wordmark__reveal).
   2) Al bajar: las letras se llenan de holo, hacen zoom hacia
      dentro y el hero funde a void — sensación de adentrarse
      en VaultPet, y aterrizas en la sala de cajas.

   El relleno holo es placeholder (gradiente CSS animado).
   Fase futura: sustituir por vídeo real de la resina/producto.

   La antigua puerta 3D se retiró en la Fase 2; el 3D vive ahora
   solo en las cajas de producto (deposit-viewers.js).
   ============================================================ */

/* ---------- Toggle de tema (luna/sol) ---------- */
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  const root = document.documentElement;
  const syncLabel = () => {
    const dark = root.dataset.theme === "dark";
    const txt = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    themeToggle.setAttribute("aria-label", txt);
    themeToggle.setAttribute("title", dark ? "Modo claro" : "Modo oscuro");
  };
  syncLabel();
  themeToggle.addEventListener("click", () => {
    const dark = root.dataset.theme === "dark";
    if (dark) delete root.dataset.theme;
    else root.dataset.theme = "dark";
    try {
      localStorage.setItem("vaultpet-theme", dark ? "light" : "dark");
    } catch (e) {}
    syncLabel();
    // avisa a los visores 3D para que se re-iluminen
    window.dispatchEvent(new CustomEvent("themechange", { detail: { dark: !dark } }));
  });
}

const hero = document.getElementById("hero");
const wordmark = document.querySelector(".wordmark");
const reveal = document.querySelector(".wordmark__reveal");
const veil = document.querySelector(".hero__veil");

const canHover = window.matchMedia("(hover: hover)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Revelado al cursor (primera impresión) ---------- */
if (hero && wordmark && reveal && canHover) {
  const blobRadius = () =>
    Math.round(Math.max(150, Math.min(320, window.innerWidth * 0.2)));

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

/* Pausa la animación del holo del wordmark cuando el hero sale de pantalla
   (si no, repinta un texto enmascarado en cada frame aunque estés abajo). */
if (hero && reveal) {
  new IntersectionObserver(([entry]) => {
    reveal.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
  }).observe(hero);
}

/* ---------- Buceo: adentrarse en VaultPet al hacer scroll ----------
   Todo lineal (ease:"none") para que el movimiento vaya atado 1:1 al
   scroll — sin acelerones ni retenciones que se lean como "pausa".
   El velo funde MIENTRAS el zoom sigue, así nunca hay quietud.
   Parámetros distintos en móvil (menos zoom, recorrido más corto). */
if (hero && wordmark && reveal && veil && !reduceMotion) {
  const mm = gsap.matchMedia();

  // Desktop: buceo con pin — el hero se queda fijo y atraviesas la palabra.
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
          // Fase 1 (holo crece desde el centro, escala ~1 → barato): sin shimmer.
          wordmark.classList.toggle("diving", p > 0.02);
          // Fase 2 (zoom grande): holo completo + cache GPU, para no rasterizar
          // la máscara escalada ×6.5 en cada frame (era el tirón del final).
          wordmark.classList.toggle("diving-full", p > 0.4);
        },
      },
    });
    tl.to([".hero-eyebrow", ".hero-sub", ".scroll-hint"], { opacity: 0, ease: "none", duration: 0.15 }, 0)
      // el holo crece desde el centro mientras casi no escala (barato)
      .to(reveal, { "--dive": "1000px", ease: "none", duration: 0.4 }, 0)
      .to(wordmark, { scale: 1.3, ease: "none", duration: 0.4 }, 0)
      // ya lleno de holo: arranca el zoom grande, cacheado en GPU
      .to(wordmark, { scale: 6.5, ease: "none", duration: 0.6 }, 0.4)
      .to(veil, { opacity: 1, ease: "none", duration: 0.6 }, 0.4);
  });

  // Móvil: pin corto sobre el hero completo. No transformamos el wordmark,
  // así el holo sigue animando; solo fundimos la pantalla a negro.
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
    // Sin transformar el wordmark (eso congelaba la animación del holo):
    // se queda fijo y animándose mientras el velo cubre todo el plano.
    tl.to([".hero-eyebrow", ".hero-sub", ".scroll-hint"], { opacity: 0, ease: "none", duration: 0.2 }, 0)
      .to(veil, { opacity: 1, ease: "none", duration: 0.65 }, 0.12);
  });
}

/* ============================================================
   Movimiento: scroll suave (Lenis) + reveals al entrar sección.
   Lenis se integra con el ticker de GSAP para que ScrollTrigger
   (hero/buceo) siga funcionando. En táctil NO suaviza (scroll
   nativo, que ya cuidamos). Respeta prefers-reduced-motion.
   ============================================================ */
if (!reduceMotion) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Enlaces internos (logo, CTA del header) con scroll suave vía Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const target = href.length > 1 ? document.querySelector(href) : null;
      e.preventDefault();
      if (target) lenis.scrollTo(target, { offset: -20 });
      else lenis.scrollTo(0);
    });
  });

  // Reveals suaves al entrar cada bloque (el hero tiene su propia animación)
  const revealTargets = gsap.utils.toArray([
    ".drops .section-head",
    ".deposit-box",
    ".manifiesto-title",
    ".spec",
    ".proceso .section-head",
    ".proceso-list li",
    ".acceso-panel",
  ]);
  revealTargets.forEach((el) => {
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

/* ============================================================
   Lazy-load del visor 3D: Three/GLTF pesan, así que se cargan
   en su propio chunk solo cuando la sala de cajas se acerca al
   viewport, en vez de en el arranque (bundle inicial más ligero).
   ============================================================ */
const dropsSection = document.getElementById("drops");
if (dropsSection) {
  const io = new IntersectionObserver(
    (entries, obs) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        import("./deposit-viewers.js");
      }
    },
    { rootMargin: "600px 0px" }
  );
  io.observe(dropsSection);
}

/* ============================================================
   Formulario de acceso: sin backend todavía, pero con handler
   mínimo (valida y confirma) para que no parezca roto.
   ============================================================ */
const waitlistForm = document.getElementById("waitlist-form");
if (waitlistForm) {
  const emailInput = waitlistForm.querySelector('input[type="email"]');
  const status = document.getElementById("waitlist-status");
  const setStatus = (msg, state) => {
    if (!status) return;
    status.textContent = msg;
    status.dataset.state = state;
  };
  waitlistForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      setStatus("Revisa el email e inténtalo de nuevo.", "error");
      emailInput.focus();
      return;
    }
    // Pendiente backend: aquí irá el envío del email a la lista real.
    setStatus("Estás en la lista. Te avisamos al abrir el próximo drop.", "ok");
    waitlistForm.reset();
  });
}
