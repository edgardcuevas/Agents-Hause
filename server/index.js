import { fileURLToPath } from 'node:url';
import { createStore } from './state.js';
import { createAppServer } from './http.js';
import { createProfiles } from './profiles.js';
import { createMockSource } from './sources/mock.js';
import { createOpenCodeSource } from './sources/opencode.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4317);
const sourceName = process.env.SOURCE || 'mock';
const maxAgents = Number(process.env.MAX_AGENTS || 6);
const maxIdle = Number(process.env.MAX_IDLE || 2);
const pollMs = Number(process.env.POLL_MS || 12000);
const mockMs = Number(process.env.MOCK_MS || 5000);
const autostart = process.env.OPENCODE_AUTOSTART === '1';
const opencodeUrl = process.env.OPENCODE_URL || '';

if (!['mock', 'opencode'].includes(sourceName)) {
  console.error(`Fuente "${sourceName}" no disponible. Usa mock u opencode.`);
  process.exit(1);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Puerto inválido: ${process.env.PORT}`);
  process.exit(1);
}

const profiles = createProfiles();
const store = createStore({
  source: sourceName,
  maxAgents,
  decorate: (agent) => {
    const perfil = profiles.get(agent.profileKey);
    return { alias: perfil ? perfil.alias : '', look: perfil ? perfil.look : null };
  },
});
let source;
if (sourceName === 'opencode') {
  source = createOpenCodeSource({
    emit: (agents) => store.replace(agents),
    onStatus: (connected) => store.setConnected(connected),
    maxAgents,
    maxIdle,
    pollMs,
    autostart,
    url: opencodeUrl,
  });
} else {
  source = createMockSource({
    emit: (agents) => store.replace(agents),
    onStatus: (connected) => store.setConnected(connected),
    intervalMs: mockMs,
  });
}
let stopHandler = null;
const server = createAppServer({ store, root, profiles, onStop: () => { if (stopHandler) stopHandler(); } });

server.on('error', (error) => {
  console.error('No se pudo arrancar el servidor:', error.message);
  source.stop();
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Casa de Agentes en http://${host}:${port}`);
  console.log(`Fuente: ${source.name} · ${sourceName === 'mock' ? 'datos simulados' : sourceName}`);
  source.start();
});

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`\nCerrando (${signal})...`);
  source.stop();
  server.close(() => process.exit(0));
  server.closeAllConnections?.();
  setTimeout(() => process.exit(0), 2000).unref();
}
stopHandler = () => shutdown('POST /api/stop');

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
