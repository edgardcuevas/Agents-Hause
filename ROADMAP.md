# ROADMAP — Casa de Agentes

Documento de continuidad para agentes. Antes de tocar código, leer también `AGENTS.md`.

## Estado actual

- Maqueta estática funcional: `Casa de Agentes.html`, `styles.css`, `app.js`.
- Fase 1 lista: servidor Node local con SSE, datos simulados y modo en vivo.
- Fase 2 lista: adaptador real de OpenCode.
- Fase 3 lista: robustez, reconexión y capacidad.
- Fase 3.6 lista: perfiles y personalización (alias + look por gestor + carpeta).
- `file://` sigue funcionando como demo; `npm start` activa el modo en vivo.
- Sin repositorio Git.
- Entorno verificado: Node `24.21`, npm `11.19`, OpenCode `2.0.32`.
- Fase de investigación y arquitectura: **completada**.

## Decisiones aprobadas

- Empezar por un servidor Node pequeño con datos simulados (Fase 1) antes de conectar OpenCode.
- Una sola dependencia en Fase 2: `@opencode/client`. Nada de Express ni WebSocket.
- Servidor en `127.0.0.1:4317`; SSE para enviar snapshots completos al navegador.
- Mostrar solo sesiones activas de nivel superior, máximo 8 agentes visibles.
- La UI es solo de observación; los controles de estado siguen siendo de demo.
- El token de OpenCode se queda en el servidor; nunca llega al navegador.
- La maqueta debe seguir funcionando al abrir el HTML con `file://`.
- Documentación breve, en español, y tests con `node --test`.
- Ocio reserva destinos caminables junto al mueble y orienta al agente; dos jugadores de ping-pong ocupan casillas opuestas.
- Doble clic o doble toque en un espacio vacío del visor equivale a **Ver todo** y reutiliza `fitAll`.

## Arquitectura objetivo

```text
OpenCode local (/api/event)
        │
        ▼
Servidor Node (127.0.0.1:4317)
  - descubre el servicio de OpenCode
  - traduce eventos a estados de la casa
  - mantiene un snapshot en memoria
  - sirve la web y /api/events (SSE)
        │
        ▼
Navegador: app.js + live.js
  - recibe snapshots completos
  - crea, mueve y elimina agentes reales
```

Modo de ejecución:

- `file://` → demo original, sin red.
- `http://` + `/api/health` disponible → modo en vivo.
- Servidor sin OpenCode → demo o estado “OpenCode apagado”, sin romper la casa.

## Estado de fases

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Investigación, arquitectura y decisiones | Hecha |
| 1 | Servidor mínimo + SSE + datos simulados | Hecha |
| 2 | Adaptador real de OpenCode | Hecha |
| 3 | Robustez, reconexi�n y capacidad | Hecha |
| 3.5 | Acceso directo y arranque local | Hecha |
| 3.6 | Perfiles y personalización (alias + look) | Hecha |
| 3.7 | Personalización v2: catálogo v2, peinados, accesorios por ranura, galería | Hecha |
| 3.8 | Vida propia: mapa ampliado, gato, caricias, ocio/sueño, agua, ambiente | Hecha |
| 4 | Adaptadores Codex y Claude Code | Pendiente |
| 5 | Documentación y empaquetado | Pendiente |

Actualizar esta tabla al cerrar cada fase.

### Ajustes de vida propia (Fase 3.8)

- Ocio usa casillas dedicadas: arcade `[2,31]`/`[3,31]`, consola `[9,31]`/`[10,31]`, ping-pong `[10,32]`/`[14,32]`/`[10,33]`/`[14,33]` y pelota `[6,32]`/`[8,32]`/`[7,33]`/`[7,31]`.
- El puff se puede pisar; el dibujo de ocio conserva la personalización del agente y añade solo los accesorios de juego.
- Se retiró el gato duplicado y se rediseñó la sala de juegos. El ventilador ahora es de pie y queda quieto con movimiento reducido.
- Mariposas y pájaro aparecen de día; el vapor solo aparece durante `tests`. `vida.medir()` incluye la actualización y los dibujos de vida.

## Fase 1 — Servidor mínimo + SSE con datos simulados

Objetivo: validar el circuito completo sin OpenCode.

Tareas:

- [x] `package.json` con `start`, `dev`, `test`; sin dependencias.
- [x] `server/index.js` como entrada y arranque limpio (`SIGINT`/`SIGTERM`).
- [x] Servir `/`, `/styles.css`, `/app.js` y assets conocidos; bloquear path traversal.
- [x] `GET /api/health`.
- [x] `GET /api/agents` con snapshot.
- [x] `GET /api/events` con SSE: snapshot inicial, actualizaciones y heartbeat.
- [x] Fuente simulada en `server/sources/mock.js`.
- [x] `live.js` + hooks mínimos en `app.js` para alta, actualización y baja de agentes.
- [x] Indicador visual `Demo` / `En vivo` / `Sin conexión`.

Archivos previstos:

```text
package.json
server/index.js
server/http.js
server/state.js
server/sources/mock.js
tests/state.test.js
tests/http.test.js
live.js
```

Criterios de aceptación:

- `npm start` sirve la casa en `http://127.0.0.1:4317`.
- Los agentes simulados aparecen, se mueven y desaparecen.
- Abrir `Casa de Agentes.html` con `file://` conserva la demo y no lanza errores de red.
- `npm test` pasa.
- La casa existente no cambia de aspecto ni de comportamiento en modo demo.

## Fase 2 — Integración real con OpenCode

Tareas:

- [x] Instalar `@opencode/client`.
- [x] Adaptador `server/sources/opencode.js` con `Service.discover()`.
- [x] Usar `client.event.subscribe()` y reintentar si el stream termina.
- [x] Snapshot inicial con sesiones activas; sesiones hijas no se muestran.
- [x] Mapear eventos y herramientas a los estados existentes.
- [x] `permission.asked` → `espera`; `permission.replied` → estado anterior.
- [x] `session.execution.succeeded` → `listo` temporal; `failed` → `error`.
- [x] No enviar prompts, contenido de archivos ni comandos completos.
- [x] Si OpenCode está apagado, informar sin arrancarlo. `OPENCODE_AUTOSTART=1` habilita `Service.ensure()`.

Eventos V2 verificados:

| Evento | Uso |
|---|---|
| `session.created`, `session.renamed`, `session.deleted` | alta, nombre y baja |
| `session.model.selected`, `session.step.started` | modelo y datos |
| `session.status` (`busy`, `idle`, `retry`) | estado base |
| `session.tool.input.started`, `session.tool.called` | herramienta activa |
| `session.tool.success`, `session.tool.failed` | fin de herramienta |
| `session.execution.started/succeeded/failed/interrupted` | ciclo de la tarea |
| `permission.asked`, `permission.replied` | espera de aprobación |

Mapeo de herramientas:

| Herramienta | Estado |
|---|---|
| `read`, `grep`, `glob`, `list` | `leer` |
| `edit`, `write` | `codigo`; `docs` si la ruta termina en `.md` |
| `bash`, `shell` | `comandos`; `tests` o `deploy` según el comando |
| `webfetch`, `websearch` | `web` |
| `task` | `delegando` |
| desconocida | `comandos` |

Criterios de aceptación:

- Una sesión real se refleja en la casa en menos de un segundo.
- Permisos, errores e idle se ven correctamente.
- Reiniciar el servidor no rompe el navegador; reconecta solo.
- Tests con fixtures grabados, sin necesitar OpenCode encendido.

## Fase 3 — Robustez y capacidad

- [x] Reconciliaci�n peri�dica con snapshot (10-15 s) adem�s del stream.
- [x] Heartbeat SSE y cierre limpio de clientes lentos.
- [x] Reconexi�n autom�tica del navegador y del adaptador.
- [x] L�mite `MAX_AGENTS` (por defecto 8), priorizando sesiones activas.
- [x] Reserva de posiciones cuando `SPOTS` est� lleno; nadie debe quedar bloqueado.
- [x] Tests de reconexi�n, l�mite y falta de posiciones (fallback validado en navegador).

## Fase 3.6 — Perfiles y personalización

- [x] `catalogo.js` compartido (paletas, gorros, accesorios, límites).
- [x] `server/profiles.js` con validación, escritura atómica y cola.
- [x] Clave `slug(gestor) + ":" + sha1(carpeta).slice(0,12)`.
- [x] `/api/perfiles` GET y `/api/perfiles/:clave` PUT con 400/403/413/415/404.
- [x] Decoración de agentes con `profileKey`, `projectName`, `alias`, `look`.
- [x] Cliente `perfiles.js`: PUT en vivo + `localStorage` en `file://`, toast.
- [x] UI: ficha con Proyecto y botón **Personalizar**, diálogo completo.
- [x] Dibujo con look opcional; pin del modelo solo con look.
- [x] Tests `tests/profiles.test.js` y ampliación de `tests/http.test.js`.

Decisiones:
- Sin look guardado, el dibujo es exactamente el anterior.
- El cliente aplica el look editado aunque el PUT falle.
- Solo el nombre base de la carpeta se muestra en la UI.
- `CASA_DATA_DIR` permite datos en una carpeta distinta (tests).

## Fase 4 — Codex y Claude Code

Solo después de estabilizar OpenCode.

- [ ] Definir interfaz común: `createSource({ emit, onStatus }) -> { start, stop }`.
- [ ] Investigar cómo exponen eventos Codex y Claude Code en esta máquina.
- [ ] Un adaptador a la vez, con fixtures y sin regresiones.

## Fase 5 — Documentación y empaquetado

- [ ] README breve: instalar, arrancar, variables de entorno.
- [ ] Actualizar `AGENTS.md` con comandos y estructura nuevos.
- [ ] Revisar que la tabla de fases quede al día.

## Contrato de API

`GET /api/health`

```json
{ "ok": true, "source": "mock", "opencode": "disconnected", "startedAt": 0 }
```

`GET /api/agents`

```json
{
  "version": 1,
  "source": "mock",
  "connected": true,
  "updatedAt": 0,
  "agents": [
    {
      "id": "session-id",
      "name": "nombre corto",
      "manager": "OpenCode",
      "model": "modelo",
      "state": "codigo",
      "detail": "edit",
      "project": "proyecto",
      "since": 0,
      "updatedAt": 0
    }
  ]
}
```

`GET /api/events` (SSE)

- `event: snapshot` con el mismo objeto que `/api/agents`.
- `event: heartbeat` cada 15 s.
- Snapshots completos, no deltas. Throttle máximo ~200 ms.

Estados válidos: `leer`, `codigo`, `docs`, `comandos`, `web`, `tests`, `deploy`, `delegando`, `listo`, `espera`, `idle`, `error`.

## Variables de entorno

| Variable | Defecto | Uso |
|---|---|---|
| `PORT` | `4317` | puerto |
| `HOST` | `127.0.0.1` | interfaz; no exponer a LAN |
| `SOURCE` | `mock` | `mock` u `opencode` |
| `MAX_AGENTS` | `8` | agentes visibles |
| `POLL_MS` | `12000` | reconciliación |
| `OPENCODE_AUTOSTART` | `0` | arrancar servicio si falta |
| `OPENCODE_URL` | vacío | forzar URL del servicio |
| `CASA_DATA_DIR` | `data` | carpeta de `casa.json` (perfiles) |

## Reglas para continuar

1. Leer este archivo y `AGENTS.md` antes de cambiar código.
2. Trabajar una fase a la vez; no mezclar Fase 2 con retoques visuales.
3. Cada fase debe dejar `npm test` en verde y la demo `file://` funcionando.
4. Actualizar la tabla de fases y las casillas al terminar.
5. Comentarios y documentación en español, breves y sin jerga innecesaria.
6. No añadir frameworks, bundlers ni dependencias fuera de las acordadas.
7. Si una decisión cambia, anotarla en “Decisiones aprobadas”, no solo en el código.

## Riesgos conocidos

- El stream de OpenCode es volátil: no hay replay; hace falta reconciliación.
- `SPOTS` solo admite 3 agentes por estado; con sesiones reales se llena.
- `AGENTS` es un array estático y `selected` asume al menos dos agentes.
- El proyecto no tiene Git; conviene inicializarlo antes de Fase 1 para poder revertir.
- Los datos de sesión son sensibles: servidor solo en localhost y sin prompts en la API.
