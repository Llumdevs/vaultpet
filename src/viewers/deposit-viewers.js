import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { drops } from "../data/drops.js";

/* ============================================================
   VAULTPET — Visores 3D del producto por caja de depósito.
   Cada caja es un DepositViewer (escena/cámara/renderer propios),
   pero un ÚNICO ticker (requestAnimationFrame) actualiza todos,
   y cada visor solo renderiza si está visible. `dispose()` para
   limpiar geometrías/texturas/listeners al desmontar.

   Luces por tema: en claro sube ambient + fill (para que el modelo
   no se apague sobre la card clara); en oscuro, moody. Key cálido
   brass + rim del color --glow del universo. Se re-ilumina en vivo.
   Los GLB actuales son de relleno: el modelo real se cambia en
   src/data/drops.js sin tocar este archivo.
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = new GLTFLoader();
const isDark = () => document.documentElement.dataset.theme === "dark";

class DepositViewer {
  constructor(el, cfg) {
    this.el = el;
    this.visible = true;
    this.modelReady = false;
    this.hovering = false;
    this.idleAngle = 0;
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.curRotY = 0;
    this.curRotX = 0;

    // --glow real de esta caja concreta (lo define el <article> en index.html)
    const glowRaw =
      getComputedStyle(el.closest(".deposit-box") || el)
        .getPropertyValue("--glow")
        .trim() || "#4fd1c5";
    const glowColor = new THREE.Color(glowRaw);

    // Canvas propio, encima del glow CSS de la vitrina (alpha:true)
    const canvas = document.createElement("canvas");
    canvas.className = "box-canvas";
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    this.canvas = canvas;

    this.scene = new THREE.Scene(); // sin background: se ve el glow CSS
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3.4);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Luces + adaptación al tema
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2440, 1);
    const keyLight = new THREE.PointLight(0xc6a664, 30, 20, 2); // brass cálido
    keyLight.position.set(2.5, 3, 4);
    const rimLight = new THREE.PointLight(glowColor, 10, 20, 2); // color del universo
    rimLight.position.set(-2.5, -1, -3);
    this.scene.add(ambient, hemi, keyLight, rimLight);

    this.applyTheme = (dark) => {
      ambient.intensity = dark ? 0.6 : 1.45;
      hemi.intensity = dark ? 0.35 : 0.85;
      keyLight.intensity = dark ? 30 : 42;
      rimLight.intensity = dark ? 10 : 13;
    };
    this.applyTheme(isDark());
    this._onTheme = (e) => this.applyTheme(e.detail.dark);
    window.addEventListener("themechange", this._onTheme);

    // Pivot que rota (el modelo se centra dentro)
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    // Rotación: idle lento + hacia el cursor con inercia
    this._onEnter = () => {
      this.hovering = true;
    };
    this._onLeave = () => {
      this.hovering = false;
      this.idleAngle = this.curRotY; // continúa el idle desde donde está
      this.targetRotX = 0;
    };
    this._onMove = (e) => {
      if (!this.hovering) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      this.targetRotY = nx * 0.6;
      this.targetRotX = ny * 0.4;
    };
    el.addEventListener("pointerenter", this._onEnter);
    el.addEventListener("pointerleave", this._onLeave);
    el.addEventListener("pointermove", this._onMove);

    // Tamaño 1:1 responsive
    this._resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    this.ro = new ResizeObserver(this._resize);
    this.ro.observe(el);

    // Solo renderiza cuando la caja está a la vista
    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0].isIntersecting;
      },
      { threshold: 0.01 }
    );
    this.io.observe(el);

    loader.load(
      cfg.model,
      (gltf) => this._onModel(gltf),
      undefined,
      (err) => {
        console.error(
          `[VaultPet] No se pudo cargar el modelo "${cfg.model}" para la caja "${el.dataset.modelSlot}":`,
          err
        );
      }
    );
  }

  _onModel(gltf) {
    const model = gltf.scene;

    // Centrar en el origen y escalar para encajar en la vitrina
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    this.pivot.scale.setScalar(2.0 / maxDim);
    this.pivot.add(model);

    // Ligera inclinación base para que no se vea plano de frente
    this.pivot.rotation.x = -0.12;
    this.curRotX = this.targetRotX = -0.12;

    const placeholder = this.el.querySelector(".box-placeholder");
    if (placeholder) placeholder.remove();
    this.el.appendChild(this.canvas);

    this.model = model;
    this.modelReady = true;
    this._resize();
  }

  update() {
    if (!this.modelReady || !this.visible) return;

    if (!this.hovering && !prefersReducedMotion) {
      this.idleAngle += 0.005; // giro idle lento
      this.targetRotY = this.idleAngle;
      this.targetRotX = -0.12;
    }

    const ease = prefersReducedMotion ? 1 : 0.08;
    this.curRotY += (this.targetRotY - this.curRotY) * ease;
    this.curRotX += (this.targetRotX - this.curRotX) * ease;
    this.pivot.rotation.y = this.curRotY;
    this.pivot.rotation.x = this.curRotX;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener("themechange", this._onTheme);
    this.el.removeEventListener("pointerenter", this._onEnter);
    this.el.removeEventListener("pointerleave", this._onLeave);
    this.el.removeEventListener("pointermove", this._onMove);
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          for (const key in m) {
            const val = m[key];
            if (val && val.isTexture) val.dispose();
          }
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.remove();
  }
}

const viewers = [];
let rafId = null;

function tick() {
  rafId = requestAnimationFrame(tick);
  for (let i = 0; i < viewers.length; i++) viewers[i].update();
}

/* Monta un visor por cada caja con datos de drop, y arranca el ticker común. */
export function initDepositViewers() {
  document.querySelectorAll(".box-viewport[data-model-slot]").forEach((el) => {
    const cfg = drops[el.dataset.modelSlot];
    if (cfg) viewers.push(new DepositViewer(el, cfg));
  });
  if (viewers.length && rafId === null) tick();
}

/* Limpieza (Fase 6 / al desmontar): para el ticker y libera recursos. */
export function disposeDepositViewers() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  viewers.forEach((v) => v.dispose());
  viewers.length = 0;
}
