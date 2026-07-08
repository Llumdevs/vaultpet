/* ============================================================
   VAULTPET — Datos de los drops (fuente única por universo)
   El visor 3D lee de aquí; a futuro también el render de las
   cajas. Los modelos actuales son de relleno (armas) hasta
   tener los comederos reales: basta cambiar `model`.
   ============================================================ */
export const drops = {
  fallout: {
    model: "/models/trident.glb",
    glow: "#c4d82e",
    label: "Fallout",
    edition: "047 / 300",
  },
  pokemon: { model: "/models/cleaver.glb", glow: "#ffd23f", label: "Pokémon", edition: "agotado" },
  onepiece: {
    model: "/models/talwar.glb",
    glow: "#3d7bff",
    label: "One Piece",
    edition: "próximamente",
  },
};
