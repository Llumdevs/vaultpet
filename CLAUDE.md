# VaultPet — brief de proyecto

## Qué es
Comederos coleccionables para mascotas, en drops de edición limitada numerada, cada uno ambientado en un universo de fandom distinto (Fallout, Pokémon, One Piece...). El objeto no lleva el personaje encima — el objeto ES el personaje: relieve esculpido, pintura a mano, efectos de resina (fotoluminiscente, humo, craquelado), y el nombre de la mascota integrado en el lore de la pieza.

Público: fans de fandom que tienen mascota y quieren que su animal "viva" en su universo favorito. Cultura de coleccionismo/drop (piensa Pop Mart, sneakers, gunpla) cruzada con cultura pet.

## Concepto de diseño (ya construido en este scaffold — no reinventar)
**No es cyberpunk/neón genérico.** El eje es literal: "Vault" = cámara acorazada de banco / caja de depósito de coleccionista. La puerta de la cámara es el elemento de firma: se abre con el scroll (Three.js + GSAP ScrollTrigger, pinned) y revela una sala de "cajas de depósito" — cada caja es un drop/universo, con placa numerada de edición como si fuera un objeto de museo o un certificado de autenticidad.

### Tokens (ya en `src/style.css`, no cambiar sin razón)
- `--vault-charcoal` `#15141a` — fondo base
- `--vault-steel` `#29272f` — paneles / cajas de depósito
- `--vault-brass` `#c6a664` — acento primario: cerraduras, bordes, cifras
- `--vault-brass-dim` `#8c7440` — brass apagado, bordes secundarios
- `--vault-velvet` `#4a1220` — CTA, hover, forro de terciopelo
- `--vault-parchment` `#ede6d6` — texto alto contraste, placas grabadas
- `--glow` (variable por drop, ej. `#c4d82e` Fallout) — el único sitio donde entra color de universo es dentro de cada vitrina, nunca en el layout general

Tipografía: **Bodoni Moda** (titulares/placas grabadas) + **Space Grotesk** (cuerpo) + **Space Mono** (numeración de edición). Ya cargadas vía Google Fonts en `index.html`.

## Estado actual del scaffold
- `index.html` — hero (puerta) + sección de drops (3 cajas placeholder) + proceso + acceso anticipado
- `src/style.css` — sistema de tokens completo, responsive básico, `prefers-reduced-motion` respetado
- `src/main.js` — escena Three.js real con puerta acorazada de geometría primitiva (sin assets aún) que gira la rueda y se abre al hacer scroll, pinned con ScrollTrigger

Esto ya corre. Instala y prueba antes de tocar nada:
```bash
npm install
npm run dev
```

## Fases pendientes (hazlas en este orden, prueba en el navegador tras cada una)

**Fase 2 — Producto real en las cajas de depósito**
Sustituir `.box-placeholder` en cada `.deposit-box` (`index.html`) por el producto real: si tienes modelos GLB, un mini-visor Three.js por caja; si no, empieza con foto/video del comedero real (más rápido, igual de creíble) y deja el 3D para más adelante. Assets van en `public/models/` y `public/textures/`.

**Fase 3 — Interacción hover/raycasting**
Si montas visor 3D por caja: raycasting para detectar hover y rotar el producto suavemente (no autorotación constante — que responda al cursor). Reutiliza el patrón de cámara/luces de `main.js`.

**Fase 4 — Material de resina**
Shader o combinación de `MeshStandardMaterial` + `emissiveMap` para los tres efectos reales del producto: fotoluminiscente (glow en zonas concretas, no en toda la pieza), humo (textura interna translúcida), craquelado (normal map de grietas). Esto es lo que de verdad vende — dale tiempo.

**Fase 5 — Personalización**
Formulario: elegir universo + nombre de mascota → preview del texto grabado sobre la pieza (aunque sea overlay 2D sobre el render 3D, no hace falta grabar el texto en el modelo).

**Fase 6 — Rendimiento**
`dispose()` de geometrías/texturas al desmontar visores, comprimir modelos con Draco si pesan, lazy-load de los GLB fuera del viewport.

## Reglas de trabajo
- No metas colores fuera de la paleta anterior. Si un universo necesita su color (`--glow`), va scoped a esa caja, nunca al layout.
- No añadas numeración tipo "01/02/03" decorativa donde no la hay ya — la que existe (proceso, ediciones) es real y debe seguir siendo real.
- Prueba en el navegador después de cada fase. No acumules cambios sin verificar — Three.js rompe silenciosamente (canvas en negro, memory leaks) y cuesta más depurar después.
- Copy: habla desde el lado del coleccionista, no del sistema. "Solicitar acceso", no "Enviar formulario".
