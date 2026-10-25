# Casa de Agentes

Static pixel-art prototype of a house where coding agents walk between rooms. UI text is Spanish. The base experience is still a three-file demo, but Phases 1 and 2 added an optional local Node server and a live mode.

Work is phased; current status and next steps are in `ROADMAP.md`. Read it before starting a phase.

## Run & verify

- Demo only: open `Casa de Agentes.html` directly (`Start-Process ".\Casa de Agentes.html"`). It must keep working over `file://`.
- With server: `npm install`, then `npm start` and open `http://127.0.0.1:4317`. The page switches to live mode automatically.
- Real OpenCode: `SOURCE=opencode npm start`. Use `OPENCODE_AUTOSTART=1` to start the service if it is down.
- Tests: `npm test`. Focused runs: `node --test tests/state.test.js`, `node --test tests/http.test.js`, `node --test tests/opencode.test.js`, `node --test tests/profiles.test.js`.
- Launcher: `npm run casa`, `npm run casa:mini`, `npm run casa:stop`, `npm run casa:install`, `npm run casa:uninstall`.
- Force demo over HTTP: append `?demo=1` to the URL.
- Mini view: append `?mini=1` or use the **Mini** button to open a small window with only the house.
- Verification is manual for visuals plus `npm test` for server/state/mapping. Do not invent other test commands.

## Layout

- `Casa de Agentes.html`, `styles.css`, `app.js`, `vida.js`, `live.js` — UI, drawing, camera, vida propia y cliente en vivo.
- `catalogo.js` — shared catalog: palettes, hairstyles, hats, accessories by slot, and limits (browser + server).
- `galeria.js` — test gallery activated with `?galeria=1`.
- `vida.js` — vida propia: gato autónomo, caricias, ocio/sueño, agua, ambiente. Cargado después de app.js.
- `perfiles.js` — browser profile client: live PUT, `file://` localStorage, toast.
- `server/index.js` — entry point and source selection (`mock` or `opencode`).
- `server/http.js` — static files, `/api/health`, `/api/agents`, `/api/perfiles`, and SSE.
- `server/state.js` — in-memory snapshot store, normalization, and profile decoration.
- `server/profiles.js` — profile persistence and validation (atomic JSON file).
- `server/sources/mock.js` — simulated agents.
- `server/sources/opencode.js` — real OpenCode adapter.
- `tests/*.test.js` — Node tests.
- `scripts/*.ps1` and `scripts/*.vbs` — local launcher, stop, install and uninstall helpers.
- `assets/casa.ico` — desktop icon.
- `ROADMAP.md` — phase status and decisions.

## Server and live mode

- Static files are allowlisted in `server/http.js` (`FILES`). Add new root assets there or they return 404.
- The browser receives full snapshots from `/api/events`; `live.js` calls `window.applyAgentSnapshot`.
- `applyAgentSnapshot` creates/removes agents through `initAgent` and reuses `assign`; keep `SPOTS` walkable.
- `setDemoMode` toggles the demo loop; live mode disables state buttons via `body.is-live`.
- OpenCode source uses `Service.discover()` by default and retries every 3 s. `OPENCODE_AUTOSTART=1` uses `Service.ensure()`.
- Snapshots include only top-level sessions, max `MAX_AGENTS`, prioritizing active ones.
- Do not send prompts, file contents, or full commands to the browser; keep details short.
- `permission.replied` with `reject` maps to `error`.
- Room capacity is `ROOM_CAPACITY` (default 3); overflow goes to `WAITING_SPOTS` in the recibidor.

- Grid constants live at the top of `app.js`: `T=16`, `COLS=24`, `ROWS=36`. The canvas is `384×576` and `.stage` is `aspect-ratio: 24 / 36`; a map resize must update the constants, the canvas `width`/`height`, and the CSS ratio together.
- `isWall()` hardcodes corridor rows 7/14/21/28 and divider columns 8/16 (salvo en la sala de juegos, filas 29-34, donde la columna 8 está abierta). `DOORS` must punch through those walls or pathfinding silently cannot reach rooms.
- `blocked` is built once at load. Furniture must be registered with `block()` there, before any `assign()`; and every coordinate in `SPOTS` must be walkable, otherwise `findPath` returns `null` and the state change fails.
- Static art is painted once into the offscreen `bg` canvas (`drawHouse`, `drawFurniture`, `drawRooms2/3/4`) using context `b`. Per-frame art (`drawDynamic*`) paints to `g` and is discarded every frame because `bg` is redrawn first — never put persistent geometry in a dynamic function.
- All helpers use tile units (`c * T`, `r * T`) with integer pixels; `imageSmoothingEnabled` is off deliberately. Keep new art pixel-aligned and palette-consistent.

## Perfiles y personalización

- Cada agente puede tener alias y look (colores, peinado, gorro y un accesorio por ranura) guardados por **gestor + carpeta del proyecto**.
- El catálogo está en v2: 24 colores de camisa/gorro, 10 de piel, 14 de pelo, 12 de pantalón; 9 peinados; 12 gorros; 18 accesorios organizados por ranuras (`cara`, `cuello`, `espalda`, `torso`, `manos`).
- Un look lleva como mucho un accesorio por ranura; no hay límite global de 3.
- `look.peinado` acepta: `auto`, `corto`, `largo`, `coleta`, `mohicano`, `afro`, `flequillo`, `rapado`, `calvo`.
- Gorros nuevos: `flor`, `orejas_conejo`, `aureola` (flota 1 px) y `casco`.
- Conflicto: si el look trae `lentes` o `lentes_redondos`, no se dibujan los lentes de lectura del estado `leer`.
- Migración v1→v2: al cargar `data/casa.json` de versión 1 se añade `peinado: 'auto'`, se conserva el primer accesorio de cada ranura y se guarda copia como `casa.json.v1.bak`. Igual en `localStorage` del modo demo (`casa.perfiles.v1.bak`).
- `GET /api/perfiles` devuelve `version: 2`.
- La clave es `slug(gestor) + ":" + sha1(carpeta normalizada).slice(0, 12)`; cumple `/^[a-z0-9-]{1,24}:[a-f0-9]{12}$/` y nunca se usa como nombre de archivo.
- `server/profiles.js` valida todo lo que llega del cliente y guarda en `data/casa.json` (o `CASA_DATA_DIR`). Escritura atómica con cola; `flush()` existe para tests. Rechaza ids repetidos o dos accesorios de la misma ranura.
- `GET /api/perfiles` devuelve todos; `PUT /api/perfiles/:clave` acepta parches `{ alias?, look? }` y mezcla el look con el perfil existente. Responde 400/403/413/415/404 según validación, Origin, tamaño, tipo o clave.
- El navegador usa `window.casaPerfiles` (`perfiles.js`): PUT en vivo y `localStorage` en `file://`. Si el PUT falla, el look editado se aplica igual en local.
- `server/state.js` decora cada agente con `profileKey`, `projectName`, `alias` y `look`; la UI solo muestra el nombre base de la carpeta.
- Sin look guardado, `drawAgent` usa exactamente los colores y gorro de siempre. El pin del modelo solo aparece cuando `tieneLook(a)` y el agente no mira hacia arriba.
- El diálogo **Personalizar** está en `Casa de Agentes.html` y su lógica en `app.js`; la vista previa anima con el diálogo abierto. Esc cierra y devuelve el foco a `#iCustom`.
- Galería de pruebas: `?galeria=1` oculta el resto de la interfaz y muestra piezas a 6x y 1x.

## State changes

A state id must exist consistently in **all** of these, or you get a crash or blank UI:

`STATES`, `SPOTS`, `FACING`, `BUBBLES`, `DEMO_WEIGHTS`, `DESCS` (in `app.js`).

`applyAgentSnapshot` ignores unknown states and falls back to `idle`.

New state and room labels go in Spanish, matching existing capitalization. A new manager needs an entry in `GESTOR_COLOR`, matching CSS vars (`--codex`, `--claude`, `--opencode`), and the hardcoded legend in `renderUI()`.

## Agent API & demo behavior

- `setAgentState(id, state)` is exposed on `window`; it returns `false` for unknown ids/states or when no free spot/path exists.
- `applyAgentSnapshot(snapshot)` is the live-mode entry point. It adds, updates, and removes agents and calls `renderUI`.
- Each agent changes state randomly every ~5-11 s while `demoOn` is true. `demoOn` defaults to false only under `prefers-reduced-motion: reduce`.
- `?demo=1` forces demo mode even over HTTP.
- `?ocio=SEGUNDOS` cambia el umbral de ocio→sueño (por defecto 600 s, 25 s en demo).
- `?debug=1` expone `window.vida` con helpers de depuración.
- Agents are driven by `a.path` (BFS tiles), `a.spot`, and `a.at`; only idle agents lie down.
- Session state and positions are not persisted: refreshing resets them. Alias and look do persist (server JSON in live mode, `localStorage` over `file://`).
- En ocio, `vida.js` dirige a cada agente a una casilla propia del mueble (arcade `[2,31]`/`[3,31]`, consola `[9,31]`/`[10,31]`, ping-pong `[10,32]`/`[14,32]`/`[10,33]`/`[14,33]`, pelota `[6,32]`/`[8,32]`/`[7,33]`/`[7,31]`). Ping-pong mira al otro lado según la columna; el puff no bloquea el paso.
- Doble clic o doble toque en espacio vacío del visor ejecuta **Ver todo** (`fitAll`); el botón **Ver todo** mantiene el mismo comportamiento.
- Las animaciones de vida propia respetan `document.hidden` y `prefers-reduced-motion`; `vida.medir()` promedia la actualización y los dibujos de vida por cuadro.

## Conventions

- Don't translate the UI or introduce a framework/bundler for small changes; this is intentionally a three-file prototype.
- Avoid adding more hardcoded raw-pixel geometry; prefer tile math and the existing `roomAt`/`block` helpers.
- Keep `R(ctx, …)` as the drawing primitive so static and dynamic painters stay interchangeable.
