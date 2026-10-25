import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from '../server/http.js';
import { createStore } from '../server/state.js';
import { createProfiles } from '../server/profiles.js';

const root = fileURLToPath(new URL('..', import.meta.url));

async function start(t, { profiles = null } = {}) {
  const store = createStore({
    source: 'mock',
    decorate: profiles
      ? (agent) => {
        const perfil = profiles.get(agent.profileKey);
        return { alias: perfil ? perfil.alias : '', look: perfil ? perfil.look : null };
      }
      : null,
  });
  store.replace([
    { id: 'mock-opencode-1', name: 'opencode-1', manager: 'OpenCode', model: 'deepseek', state: 'codigo', project: 'C:\\proyectos\\ServerHub' },
  ]);
  const server = createAppServer({ store, root, startedAt: 123, profiles });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  t.after(() => {
    server.closeAllConnections?.();
    server.close();
  });
  return { base: `http://127.0.0.1:${port}`, store, server };
}

async function tempProfiles(t) {
  const dir = await mkdtemp(join(tmpdir(), 'casa-http-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return createProfiles({ file: join(dir, 'casa.json') });
}

test('sirve la maqueta y los archivos conocidos', async (t) => {
  const { base } = await start(t);
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Casa de Agentes/);
  assert.match(html, /live\.js/);
  assert.match(html, /efectos\.js/);

  const css = await fetch(`${base}/styles.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);

  const js = await fetch(`${base}/app.js`);
  assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /javascript/);

  const effects = await fetch(`${base}/efectos.js`);
  assert.equal(effects.status, 200);
  assert.match(effects.headers.get('content-type'), /javascript/);

  const catalogo = await fetch(`${base}/catalogo.js`);
  assert.equal(catalogo.status, 200);
  assert.match(await catalogo.text(), /CATALOGO/);

  const perfiles = await fetch(`${base}/perfiles.js`);
  assert.equal(perfiles.status, 200);
  assert.match(await perfiles.text(), /casaPerfiles/);
});

test('health y agents devuelven JSON', async (t) => {
  const { base } = await start(t);

  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {
    ok: true,
    source: 'mock',
    opencode: 'disconnected',
    startedAt: 123,
  });

  const agents = await fetch(`${base}/api/agents`);
  assert.equal(agents.status, 200);
  const body = await agents.json();
  assert.equal(body.agents.length, 1);
  assert.equal(body.agents[0].id, 'mock-opencode-1');
});

test('bloquea rutas desconocidas y traversal', async (t) => {
  const { base } = await start(t);
  assert.equal((await fetch(`${base}/package.json`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e/package.json`)).status, 404);
  assert.equal((await fetch(`${base}/api/desconocida`)).status, 404);
});

test('rechaza métodos que no son GET', async (t) => {
  const { base } = await start(t);
  const response = await fetch(`${base}/api/health`, { method: 'POST' });
  assert.equal(response.status, 405);
});

test('SSE envía un snapshot inicial', async (t) => {
  const { base } = await start(t);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${base}/api/events`, { signal: controller.signal });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (!buffer.includes('event: snapshot')) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }

    assert.match(buffer, /event: snapshot/);
    assert.match(buffer, /mock-opencode-1/);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
});

test('GET /api/perfiles devuelve la lista vacía', async (t) => {
  const profiles = await tempProfiles(t);
  const { base } = await start(t, { profiles });
  const response = await fetch(`${base}/api/perfiles`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(response.headers.get('x-content-type-options'), /nosniff/);
  assert.deepEqual(await response.json(), { version: 2, perfiles: {} });
});

test('PUT /api/perfiles guarda, valida y llega al snapshot', async (t) => {
  const profiles = await tempProfiles(t);
  const { base } = await start(t, { profiles });
  const agentes = await (await fetch(`${base}/api/agents`)).json();
  const clave = agentes.agents[0].profileKey;
  assert.match(clave, /^opencode:[a-f0-9]{12}$/);

  const put = (body, headers = {}, path = clave) => fetch(`${base}/api/perfiles/${path}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  const ok = await put({ alias: 'Codex ServerHub', look: { camisa: '#112233', gorro: 'corona', accesorios: ['capa'] } });
  assert.equal(ok.status, 200);
  const perfil = await ok.json();
  assert.equal(perfil.alias, 'Codex ServerHub');
  assert.equal(perfil.look.camisa, '#112233');

  const snapshot = await (await fetch(`${base}/api/agents`)).json();
  assert.equal(snapshot.agents[0].alias, 'Codex ServerHub');
  assert.equal(snapshot.agents[0].look.gorro, 'corona');
  assert.equal(snapshot.agents[0].projectName, 'ServerHub');

  const lista = await (await fetch(`${base}/api/perfiles`)).json();
  assert.equal(lista.perfiles[clave].alias, 'Codex ServerHub');

  assert.equal((await put({ look: { camisa: 'rojo' } })).status, 400);
  assert.equal((await put({ look: { gorro: 'no-existe' } })).status, 400);
  assert.equal((await put({ look: { accesorios: ['bufanda', 'mono'] } })).status, 400);
  assert.equal((await put({ alias: 'x'.repeat(25) })).status, 400);
  assert.equal((await put({ extra: true })).status, 400);
  assert.equal((await put({}, {}, 'clave-invalida')).status, 400);
  assert.equal((await put({}, { origin: 'http://evil.example' })).status, 403);
  assert.equal((await put({}, { origin: base })).status, 200);
  assert.equal((await put('{}', { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await put(JSON.stringify({ alias: 'a'.repeat(5000) }))).status, 413);
  assert.equal((await fetch(`${base}/api/perfiles`, { method: 'PUT' })).status, 404);
});
