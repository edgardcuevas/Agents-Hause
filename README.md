# 🏠 Casa de Agentes

Una pequeña casa de pixel art donde los agentes de programación pasean, trabajan, descansan y juegan. Puedes usarla como demo independiente o conectarla a un servidor local para observar sesiones de OpenCode.

> **La casa es una ventana de observación:** muestra estados y actividad resumida; no permite controlar ni enviar instrucciones a los agentes.

## ✨ Qué incluye

- **Demo sin instalación:** abre el archivo HTML y explora la casa directamente en el navegador.
- **Modo en vivo:** un servidor local puede mostrar sesiones de OpenCode en tiempo real.
- **Agentes personalizables:** cambia alias, colores, peinados, gorros y accesorios.
- **Una casa con vida propia:** gato, jardín, juegos, descanso y detalles ambientales.
- **Vista adaptable:** zoom, movimiento del mapa y una ventana compacta Mini.
- **Privacidad local:** los perfiles se guardan en tu equipo; no se envían prompts ni contenido de archivos al navegador.

## 🚀 Empezar

### Demo rápida

Abre [`Casa de Agentes.html`](./Casa%20de%20Agentes.html) en el navegador. No hace falta instalar dependencias ni iniciar un servidor.

### Servidor local con agentes simulados

Necesitas **Node.js 22 o posterior**. Desde la carpeta del proyecto:

```powershell
npm install
npm start
```

Después abre <http://127.0.0.1:4317>. El servidor usa agentes simulados por defecto.

### Conectar OpenCode

En PowerShell:

```powershell
$env:SOURCE = "opencode"
npm start
```

Abre <http://127.0.0.1:4317>. Para que el servidor intente iniciar OpenCode si no está activo:

```powershell
$env:SOURCE = "opencode"
$env:OPENCODE_AUTOSTART = "1"
npm start
```

## 🎮 Controles y opciones

- Selecciona un agente para ver su estado y personalizarlo.
- Arrastra para mover la casa; usa la rueda o los botones para cambiar el zoom.
- Haz doble clic o doble toque en un espacio vacío para encuadrar toda la casa.
- Usa **Mini** para abrir una ventana compacta.
- Añade `?demo=1` a la URL para forzar la demo, incluso con el servidor activo.
- Añade `?mini=1` para abrir directamente la vista compacta.

La [guía de uso y documentación](./DOCUMENTACION.md) explica los modos, los perfiles, los comandos y las opciones de prueba.

## 🧪 Pruebas

```powershell
npm test
```

## 🧰 Tecnologías

JavaScript, HTML y CSS sin framework ni proceso de compilación. El servidor usa Node.js y SSE para enviar actualizaciones al navegador.

## 📁 Estructura

| Ruta | Contenido |
| --- | --- |
| `Casa de Agentes.html`, `styles.css`, `app.js` | Interfaz y demo visual |
| `vida.js`, `catalogo.js`, `galeria.js` | Vida propia, personalización y galería |
| `live.js`, `perfiles.js` | Conexión en vivo y perfiles |
| `server/` | Servidor local, fuentes de datos y almacenamiento |
| `tests/` | Pruebas automatizadas |
| `scripts/` | Accesos directos y utilidades para Windows |
| `ROADMAP.md` | Fases, decisiones y próximos pasos del proyecto |

## 🔒 Datos locales

Los perfiles del servidor se guardan en `data/casa.json`, que está excluido de Git. Al abrir la demo como archivo, los perfiles se guardan en el almacenamiento local del navegador. Las posiciones y los estados de las sesiones no se conservan al recargar.

