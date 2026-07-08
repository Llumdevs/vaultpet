import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* ============================================================
   VAULTPET — Fase 2: visor 3D del producto por caja de depósito
   Un mini-visor Three.js independiente dentro de cada .box-viewport.
   Reutiliza el patrón de luces del hero (main.js): key light cálido
   brass + rim light con el color --glow de ESA caja (no fijo).

   NOTA (assets): los GLB actuales son armas de relleno para probar
   la mecánica del visor. Para poner el comedero real de un universo,
   basta cambiar la ruta `model` en VIEWERS — el resto no se toca.
   ============================================================ */

// Config por universo. Solo lo que está aquí monta visor;
// el resto de cajas conserva su .box-placeholder.
const VIEWERS = {
  fallout: { model: "/models/Trident.glb" },
  pokemon: { model: "/models/Cleaver.glb" },
  onepiece: { model: "/models/Talwar.glb" },
};

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const loader = new GLTFLoader();

/**
 * Monta un visor 3D dentro de un .box-viewport.
 * @param {HTMLElement} el  el .box-viewport[data-model-slot]
 * @param {{model:string}} cfg
 */
function createBoxViewer(el, cfg) {
  // --glow real de esta caja concreta (lo define el <article> en index.html)
  const glowRaw =
    getComputedStyle(el.closest(".deposit-box") || el)
      .getPropertyValue("--glow")
      .trim() || "#4fd1c5";
  const glowColor = new THREE.Color(glowRaw);

  // --- Canvas propio, encima del glow CSS de la vitrina (alpha:true) ---
  const canvas = document.createElement("canvas");
  canvas.className = "box-canvas";
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
  });

  const scene = new THREE.Scene(); // sin background: dejamos ver el glow CSS

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3.4);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  // --- Luces: se adaptan al tema. En claro sube el ambient + fill hemisférico
  //     para que el modelo no se vea oscuro sobre la card clara; en oscuro
  //     mantiene el ambiente moody. Lenguaje: fill neutro + key cálido brass
  //     + rim del color del universo. Se re-iluminan al cambiar de tema. ---
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2440, 1);
  const keyLight = new THREE.PointLight(0xc6a664, 30, 20, 2); // brass cálido
  keyLight.position.set(2.5, 3, 4);
  const rimLight = new THREE.PointLight(glowColor, 10, 20, 2); // color del universo
  rimLight.position.set(-2.5, -1, -3);
  scene.add(ambient, hemi, keyLight, rimLight);

  const applyTheme = (dark) => {
    ambient.intensity = dark ? 0.6 : 1.45;
    hemi.intensity = dark ? 0.35 : 0.85;
    keyLight.intensity = dark ? 30 : 42;
    rimLight.intensity = dark ? 10 : 13;
  };
  applyTheme(document.documentElement.dataset.theme === "dark");
  window.addEventListener("themechange", (e) => applyTheme(e.detail.dark));

  // --- Pivot que rota (el modelo se centra dentro) ---
  const pivot = new THREE.Group();
  scene.add(pivot);

  // --- Estado de rotación: idle lento + hacia el cursor con inercia ---
  let hovering = false;
  let idleAngle = 0;
  let targetRotY = 0;
  let targetRotX = 0;
  let curRotY = 0;
  let curRotX = 0;
  let modelReady = false;

  el.addEventListener("pointerenter", () => {
    hovering = true;
  });
  el.addEventListener("pointerleave", () => {
    hovering = false;
    // continuar el idle desde donde está el modelo → sin salto brusco
    idleAngle = curRotY;
    targetRotX = 0;
  });
  el.addEventListener("pointermove", (e) => {
    if (!hovering) return;
    const rect = el.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetRotY = nx * 0.6; // gira hacia el cursor, recorrido contenido
    targetRotX = ny * 0.4;
  });

  // --- Tamaño: cuadrado 1:1, responsive vía ResizeObserver ---
  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // --- Carga del GLB ---
  loader.load(
    cfg.model,
    (gltf) => {
      const model = gltf.scene;

      // Centrar en el origen y escalar para encajar en la vitrina
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      pivot.scale.setScalar(2.0 / maxDim);
      pivot.add(model);

      // Ligera inclinación base para que no se vea plano de frente
      pivot.rotation.x = -0.12;
      curRotX = targetRotX = -0.12;

      // Quitar el placeholder solo cuando el modelo ya está listo
      const placeholder = el.querySelector(".box-placeholder");
      if (placeholder) placeholder.remove();
      el.appendChild(canvas);

      modelReady = true;
      resize();
    },
    undefined,
    (err) => {
      // Si el modelo no carga, dejamos el placeholder y avisamos por consola.
      console.error(
        `[VaultPet] No se pudo cargar el modelo "${cfg.model}" para la caja "${
          el.dataset.modelSlot
        }":`,
        err
      );
    }
  );

  // --- Solo renderiza cuando la caja está a la vista (ahorra GPU: al hacer
  //     scroll por el resto de la página, los 3 canvas dejan de renderizar) ---
  let visible = true;
  new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { threshold: 0.01 }
  ).observe(el);

  // --- Loop de render ---
  function animate() {
    requestAnimationFrame(animate);
    if (!modelReady || !visible) return;

    if (!hovering && !prefersReducedMotion) {
      idleAngle += 0.005; // giro idle lento
      targetRotY = idleAngle;
      targetRotX = -0.12;
    }

    // Inercia suave hacia el objetivo (sin saltos)
    const ease = prefersReducedMotion ? 1 : 0.08;
    curRotY += (targetRotY - curRotY) * ease;
    curRotX += (targetRotX - curRotX) * ease;
    pivot.rotation.y = curRotY;
    pivot.rotation.x = curRotX;

    renderer.render(scene, camera);
  }
  animate();
}

// --- Arranque: monta un visor por cada slot presente en VIEWERS ---
document.querySelectorAll(".box-viewport[data-model-slot]").forEach((el) => {
  const cfg = VIEWERS[el.dataset.modelSlot];
  if (cfg) createBoxViewer(el, cfg);
});
