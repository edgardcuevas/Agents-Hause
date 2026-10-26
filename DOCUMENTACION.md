# Documentación — Casa de Agentes

Esta guía explica cómo ejecutar y utilizar el proyecto. Para una presentación breve, consulta el [README](./README.md); para el estado de desarrollo y las decisiones técnicas, consulta la [hoja de ruta](./ROADMAP.md).

## Requisitos

- **Node.js 22 o posterior** para usar el servidor y ejecutar las pruebas.
- Un navegador moderno.
- **OpenCode** instalado y disponible localmente para usar la fuente real.

La demo abierta como archivo HTML no requiere Node.js.

## Formas de ejecución

### 1. Demo en el navegador

Abre `Casa de Agentes.html`. Esta modalidad funciona con `file://`, no necesita conexión al servidor y utiliza agentes simulados. Los cambios de alias y aspecto se guardan en el almacenamiento local del navegador.

### 2. Servidor con datos simulados

Desde la carpeta del proyecto, instala las dependencias y arranca el servidor:

```powershell
npm install
npm start
```

El servidor queda disponible en <http://127.0.0.1:4317>. Si no configuras una fuente, utiliza agentes simulados. Para detenerlo, pulsa `Ctrl+C`.

### 3. Servidor conectado a OpenCode

En PowerShell, selecciona la fuente antes de arrancar:

```powershell
$env:SOURCE = "opencode"
npm start
```

Para que el adaptador intente iniciar el servicio de OpenCode cuando no lo encuentre:

```powershell
$env:SOURCE = "opencode"
$env:OPENCODE_AUTOSTART = "1"
npm start
```

En otras terminales, configura las mismas variables de entorno con la sintaxis correspondiente a esa terminal. El adaptador descubre el servicio local y vuelve a intentar conectarse si se interrumpe la conexión. Si OpenCode no está disponible, la página informa que no hay conexión.

El servidor, no el navegador, se conecta a OpenCode. La interfaz recibe estados resumidos; no recibe prompts, contenido de archivos ni comandos completos.

## Lanzador de Windows

Los comandos npm siguientes usan los scripts PowerShell/VBS del proyecto:

| Comando | Acción |
| --- | --- |
| `npm run casa` | Inicia el servidor y abre la casa |
| `npm run casa:mini` | Inicia el servidor y abre la ventana compacta |
| `npm run casa:stop` | Detiene la instancia del servidor |
| `npm run casa:install` | Instala el acceso directo |
| `npm run casa:uninstall` | Quita el acceso directo |

El lanzador está configurado para usar OpenCode por defecto. Para elegir otra fuente, establece `CASA_SOURCE` antes de ejecutarlo; por ejemplo, `$env:CASA_SOURCE = "mock"`. Para evitar que intente iniciar OpenCode, ejecuta directamente el script con `-NoOpenCodeAutostart`.

## Uso de la interfaz

- **Seleccionar agente:** haz clic o toca un personaje para abrir su ficha.
- **Personalizar:** desde la ficha puedes cambiar el alias, los colores, el peinado, el gorro y los accesorios. La vista previa permite girar y animar al personaje.
- **Mover el mapa:** arrastra la casa; utiliza la rueda, los botones de zoom o el gesto de pellizco en pantallas táctiles.
- **Ver toda la casa:** pulsa **Ver todo** o haz doble clic/doble toque en un espacio vacío del visor.
- **Vista compacta:** usa **Mini** o añade `?mini=1` a la dirección.
- **Modo demo:** añade `?demo=1` para forzar agentes simulados, incluso cuando se abre la página desde el servidor.

La demo permite cambiar estados manualmente. En modo en vivo, los controles que alterarían estados están desactivados: la aplicación observa las sesiones, no las controla.

## Perfiles y almacenamiento

- Cada perfil se asocia al gestor y a la carpeta del proyecto.
- En el servidor, los perfiles se guardan en `data/casa.json`. Puedes cambiar el directorio con `CASA_DATA_DIR`.
- En modo `file://`, se guardan en el almacenamiento local del navegador.
- Si no se puede guardar un cambio en el servidor, el aspecto editado se conserva localmente en la página.
- Los perfiles están excluidos de Git; los datos de cada usuario no deberían añadirse al repositorio.
- La posición y el estado actual de los agentes se reinician al recargar.

## Opciones de diagnóstico y prueba visual

Se añaden como parámetros a la dirección de la página:

| Parámetro | Uso |
| --- | --- |
| `?demo=1` | Fuerza la demo |
| `?mini=1` | Abre la vista compacta |
| `?galeria=1` | Muestra la galería de piezas de prueba |
| `?ocio=SEGUNDOS` | Cambia el umbral de ocio antes de dormir |
| `?debug=1` | Expone herramientas de depuración de vida propia en `window.vida` |

La galería y las herramientas de depuración son utilidades de desarrollo, no modos necesarios para el uso normal.

## Pruebas

Ejecuta toda la suite con:

```powershell
npm test
```

Para ejecutar una parte concreta:

```powershell
node --test tests/state.test.js
node --test tests/http.test.js
node --test tests/opencode.test.js
node --test tests/profiles.test.js
```

Las pruebas no requieren tener OpenCode encendido. La validación del aspecto visual se hace manualmente en el navegador.

## Estructura del proyecto

| Ruta | Responsabilidad |
| --- | --- |
| `Casa de Agentes.html` | Estructura de la interfaz |
| `styles.css` | Estilos y diseño adaptable |
| `app.js` | Renderizado, mapa, estados e interacción |
| `vida.js` | Comportamiento autónomo y detalles ambientales |
| `catalogo.js` | Catálogo de colores, peinados, gorros y accesorios |
| `galeria.js` | Galería visual de pruebas |
| `live.js` | Cliente de actualizaciones en vivo |
| `perfiles.js` | Cliente de perfiles |
| `server/index.js` | Arranque y selección de la fuente |
| `server/http.js` | Servidor web y API |
| `server/state.js` | Estado y normalización de agentes |
| `server/profiles.js` | Validación y persistencia de perfiles |
| `server/sources/` | Fuentes simulada y OpenCode |
| `tests/` | Pruebas del servidor, estados, perfiles e integración |
| `scripts/` | Lanzadores y accesos directos de Windows |

## Solución de problemas

### El puerto 4317 ya está en uso

Cierra la otra instancia o configura otro puerto al iniciar el servidor:

```powershell
$env:PORT = "4318"
npm start
```

Luego abre <http://127.0.0.1:4318>.

### Aparece “Sin conexión” con OpenCode

Comprueba que OpenCode esté activo y que el servidor se haya iniciado con `SOURCE=opencode`. Si la página estaba abierta antes de iniciar el servicio, pulsa **Reconectar** o recarga.

### No se guardan los perfiles

En modo servidor, comprueba que Node pueda escribir en el directorio de datos. En modo `file://`, revisa que el almacenamiento local esté habilitado en el navegador. Los cambios de apariencia aún se aplican en la sesión actual aunque falle la escritura del perfil del servidor.

### No se abre el archivo de la demo

Abre `Casa de Agentes.html` en un navegador moderno. Para la demo no es necesario iniciar `npm start`.

