import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROFILE_VERSION } from './profiles.js';

const FILES = new Map([
  ['/', 'Casa de Agentes.html'],
  ['/index.html', 'Casa de Agentes.html'],
  ['/Casa de Agentes.html', 'Casa de Agentes.html'],
  ['/styles.css', 'styles.css'],
  ['/app.js', 'app.js'],
  ['/live.js', 'live.js'],
  ['/catalogo.js', 'catalogo.js'],
  ['/perfiles.js', 'perfiles.js'],
  ['/vida.js', 'vida.js'],
  ['/efectos.js', 'efectos.js'],
  ['/galeria.js', 'galeria.js'],
]);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const MAX_BODY = 4 * 1024;
const PROFILE_PREFIX = '/api/perfiles/';
const KEY_RE = /^[a-z0-9-]{1,24}:[a-f0-9]{12}$/;

function typeOf(file) {
  const dot = file.lastIndexOf('.');
  return TYPES[file.slice(dot)] || 'application/octet-stream';
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(data);
}

function sseHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
  });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let done = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > limit) {
        done = true;
        const error = new Error('Cuerpo demasiado grande');
        error.status = 413;
        reject(error);
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (error) => {
      if (done) return;
      done = true;
      reject(error);
    });
  });
}

export function createAppServer({ store, root = process.cwd(), startedAt = Date.now(), onStop, profiles = null } = {}) {
  if (!store) throw new Error('createAppServer necesita un store');

  const clients = new Set();
  let flushTimer = null;
  let heartbeat = null;

  function writeSnapshot(client) {
    try {
      client.res.write(`event: snapshot\ndata: ${JSON.stringify(store.snapshot())}\n\n`);
    } catch {
      clients.delete(client);
    }
  }

  function broadcast() {
    const current = store.snapshot();
    for (const client of [...clients]) {
      try {
        client.res.write(`event: snapshot\ndata: ${JSON.stringify(current)}\n\n`);
      } catch {
        clients.delete(client);
      }
    }
  }

  const unsubscribe = store.subscribe(() => {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      broadcast();
    }, 50);
    flushTimer.unref?.();
  });

  heartbeat = setInterval(() => {
    for (const client of [...clients]) {
      try { client.res.write(': ping\n\n'); } catch { clients.delete(client); }
    }
  }, 15000);
  heartbeat.unref?.();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { pathname = url.pathname; }

      function originAllowed() {
        const origin = req.headers.origin;
        if (!origin) return true;
        let parsed;
        try { parsed = new URL(origin); } catch { return false; }
        if (parsed.protocol !== 'http:') return false;
        if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') return false;
        const host = String(req.headers.host || '');
        const hostPort = host.includes(':') ? host.slice(host.lastIndexOf(':') + 1) : '';
        const port = hostPort || String(server.address()?.port || '');
        return !port || parsed.port === port;
      }

      if (req.method === 'POST' && pathname === '/api/stop') {
        if (!originAllowed()) {
          json(res, 403, { error: 'Origen no permitido' });
          return;
        }
        json(res, 200, { ok: true });
        if (typeof onStop === 'function') {
          setTimeout(() => onStop(), 100);
        }
        return;
      }

      if (req.method === 'PUT' && pathname.startsWith(PROFILE_PREFIX)) {
        if (!originAllowed()) {
          json(res, 403, { error: 'Origen no permitido' });
          return;
        }
        if (!profiles) {
          json(res, 404, { error: 'Ruta no encontrada' });
          return;
        }
        const clave = pathname.slice(PROFILE_PREFIX.length);
        if (!KEY_RE.test(clave)) {
          json(res, 400, { error: 'Clave de perfil inválida' });
          return;
        }
        const tipo = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (tipo !== 'application/json') {
          json(res, 415, { error: 'Content-Type debe ser application/json' });
          return;
        }
        let raw;
        try {
          raw = await readBody(req, MAX_BODY);
        } catch (error) {
          json(res, error.status === 413 ? 413 : 400, {
            error: error.status === 413 ? 'Cuerpo demasiado grande (máximo 4 KB)' : 'No se pudo leer el cuerpo',
          });
          return;
        }
        let parche;
        try { parche = JSON.parse(raw); } catch {
          json(res, 400, { error: 'JSON inválido' });
          return;
        }
        try {
          const perfil = profiles.set(clave, parche);
          store.touch();
          json(res, 200, perfil);
        } catch (error) {
          json(res, 400, { error: error.message || 'Perfil inválido' });
        }
        return;
      }

      if (req.method === 'PUT') {
        json(res, 404, { error: 'Ruta no encontrada' });
        return;
      }

      if (req.method !== 'GET') {
        json(res, 405, { error: 'Método no permitido' });
        return;
      }

      if (pathname === '/api/health') {
        const current = store.snapshot();
        json(res, 200, {
          ok: true,
          source: current.source,
          opencode: current.source === 'opencode' && current.connected ? 'connected' : 'disconnected',
          startedAt,
        });
        return;
      }

      if (pathname === '/api/agents') {
        json(res, 200, store.snapshot());
        return;
      }

      if (pathname === '/api/perfiles') {
        json(res, 200, { version: PROFILE_VERSION, perfiles: profiles ? profiles.all() : {} });
        return;
      }

      if (pathname === '/api/events') {
        sseHeaders(res);
        res.write('retry: 3000\n\n');
        const client = { res };
        clients.add(client);
        writeSnapshot(client);
        const close = () => clients.delete(client);
        req.on('close', close);
        res.on('close', close);
        res.on('error', close);
        return;
      }

      if (pathname === '/favicon.ico') {
        res.writeHead(204, { 'Cache-Control': 'no-store' });
        res.end();
        return;
      }

      if (pathname.startsWith('/api/')) {
        json(res, 404, { error: 'Ruta no encontrada' });
        return;
      }

      const file = FILES.get(pathname);
      if (!file) {
        json(res, 404, { error: 'Archivo no encontrado' });
        return;
      }

      const data = await readFile(join(root, file));
      res.writeHead(200, {
        'Content-Type': typeOf(file),
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(data);
    } catch (error) {
      if (!res.headersSent) {
        json(res, 500, { error: 'Error interno' });
        return;
      }
      res.end();
    }
  });

  server.on('close', () => {
    unsubscribe();
    if (flushTimer) clearTimeout(flushTimer);
    if (heartbeat) clearInterval(heartbeat);
    for (const client of clients) {
      try { client.res.end(); } catch { /* ya cerrado */ }
    }
    clients.clear();
  });

  return server;
}
