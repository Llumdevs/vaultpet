/* ============================================================
   VAULTPET — Datos de los drops (fuente única por universo)
   El visor 3D lee de aquí; a futuro también el render de las
   cajas. Los modelos actuales son de relleno (armas) hasta
   tener los comederos reales: basta cambiar `model`.
   ============================================================ */

// "/" en dev, "/vaultpet/" en producción (Pages). Prefija los assets para
// que las rutas de los modelos funcionen también en el subpath de Pages.
const BASE = import.meta.env.BASE_URL;

export const drops = {
  fallout: {
    model: `${BASE}models/trident.glb`,
    glow: "#c4d82e",
    label: "Fallout",
    edition: "047 / 300",
  },
  pokemon: {
    model: `${BASE}models/cleaver.glb`,
    glow: "#ffd23f",
    label: "Pokémon",
    edition: "agotado",
  },
  onepiece: {
    model: `${BASE}models/talwar.glb`,
    glow: "#3d7bff",
    label: "One Piece",
    edition: "próximamente",
  },
};
