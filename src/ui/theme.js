/* Toggle de tema (luna/sol). Claro por defecto; el estado se guarda en
   localStorage y se aplica antes de pintar desde el <script> del <head>.
   Emite `themechange` para que el 3D se re-ilumine. */
export function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const root = document.documentElement;
  const syncLabel = () => {
    const dark = root.dataset.theme === "dark";
    toggle.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    toggle.setAttribute("title", dark ? "Modo claro" : "Modo oscuro");
  };

  syncLabel();
  toggle.addEventListener("click", () => {
    const dark = root.dataset.theme === "dark";
    if (dark) delete root.dataset.theme;
    else root.dataset.theme = "dark";
    try {
      localStorage.setItem("vaultpet-theme", dark ? "light" : "dark");
    } catch (e) {}
    syncLabel();
    window.dispatchEvent(new CustomEvent("themechange", { detail: { dark: !dark } }));
  });
}
