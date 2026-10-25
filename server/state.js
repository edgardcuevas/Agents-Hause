import { createHash } from 'node:crypto';

export const STATE_IDS = Object.freeze([
  'leer', 'codigo', 'docs', 'comandos', 'web', 'tests',
  'deploy', 'delegando', 'listo', 'espera', 'idle', 'error',
]);

const TEXT_LIMIT = 120;

function text(value, fallback, limit = TEXT_LIMIT) {
  const out = String(value ?? fallback ?? '').trim();
  return out.slice(0, limit);
}

function slugManager(manager) {
  const base = text(manager, 'agente', 60)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (base || 'agente').slice(0, 24);
}

function normalizeDirectory(directory) {
  return text(directory, '', 500)
    .replace(/\\/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

export function profileKeyFor({ manager, project } = {}) {
  const slug = slugManager(manager);
  const normalized = normalizeDirectory(project) || 'sin-proyecto';
  const hash = createHash('sha1').update(normalized).digest('hex').slice(0, 12);
  return `${slug}:${hash}`;
}

export function projectNameOf(project) {
  const normalized = String(project ?? '').replace(/\\/g, '/').replace(/\/+$/, '');
  const base = normalized.split('/').filter(Boolean).pop() || '';
  return base.slice(0, 40);
}

function makeAgent(raw, stamp) {
  if (!raw || typeof raw !== 'object') return null;
  const id = text(raw.id, '', 80);
  if (!id) return null;
  const manager = text(raw.manager, 'OpenCode', 40);
  const project = text(raw.project, '');
  return {
    id,
    name: text(raw.name, id, 80),
    manager,
    model: text(raw.model, 'modelo', 80),
    state: STATE_IDS.includes(raw.state) ? raw.state : 'idle',
    detail: text(raw.detail, ''),
    project,
    profileKey: profileKeyFor({ manager, project }),
    projectName: projectNameOf(project),
    since: Number.isFinite(raw.since) ? raw.since : stamp,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : stamp,
  };
}

export function createStore({ source = 'mock', maxAgents = 8, now = Date.now, decorate = null } = {}) {
  const limit = Number.isFinite(maxAgents) && maxAgents > 0 ? Math.floor(maxAgents) : 8;
  let agents = new Map();
  let connected = true;
  let updatedAt = now();
  const listeners = new Set();

  function decorateAgent(agent) {
    const extra = typeof decorate === 'function' ? decorate(agent) : null;
    return extra && typeof extra === 'object' ? { ...agent, ...extra } : { ...agent };
  }

  function snapshot() {
    return {
      version: 1,
      source,
      connected,
      updatedAt,
      agents: [...agents.values()].map(decorateAgent),
    };
  }

  function emit() {
    const current = snapshot();
    for (const listener of listeners) {
      try { listener(current); } catch { /* un cliente roto no debe tumbar el resto */ }
    }
  }

  function replace(list) {
    const next = new Map();
    for (const raw of Array.isArray(list) ? list : []) {
      const agent = makeAgent(raw, now());
      if (!agent) continue;
      next.delete(agent.id);
      next.set(agent.id, agent);
      if (next.size >= limit) break;
    }
    agents = next;
    updatedAt = now();
    emit();
    return snapshot();
  }

  function upsert(raw) {
    const agent = makeAgent(raw, now());
    if (!agent) return snapshot();
    if (!agents.has(agent.id) && agents.size >= limit) return snapshot();
    agents.set(agent.id, agent);
    updatedAt = now();
    emit();
    return snapshot();
  }

  function remove(id) {
    if (agents.delete(String(id))) {
      updatedAt = now();
      emit();
    }
    return snapshot();
  }

  function setConnected(value) {
    if (connected === Boolean(value)) return;
    connected = Boolean(value);
    updatedAt = now();
    emit();
  }

  function touch() {
    updatedAt = now();
    emit();
    return snapshot();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { snapshot, replace, upsert, remove, setConnected, touch, subscribe };
}
