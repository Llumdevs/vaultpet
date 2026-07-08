import { defineConfig } from "vite";

// GitHub Pages sirve el proyecto en un subpath: https://llumdevs.github.io/vaultpet/
// Por eso el `base` en producción es "/vaultpet/" (en dev sigue siendo "/").
// Si algún día pones un dominio propio, cámbialo a "/".
export default defineConfig({
  base: "/vaultpet/",
});
