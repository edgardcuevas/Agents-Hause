import { OpenCode } from '@opencode/client';
import { Service } from '@opencode/client/service';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now() {
  return Date.now();
}

function toSnapshot(agent) {
  return {
    id: agent.id,
    name: agent.name,
    manager: agent.manager,
    model: agent.model,
    state: agent.state,
    detail: agent.detail,
    project: agent.project,
    since: agent.since,
    updatedAt: agent.updatedAt,
  };
}

function toolState(name, input) {
  const normalized = String(name || '').toLowerCase();
  if (['read', 'grep', 'glob', 'list'].includes(normalized)) return 'leer';
  if (['edit', 'write', 'multiedit', 'apply_patch', 'patch'].includes(normalized)) {
    const path = input?.path || input?.file_path || input?.filePath || '';
    if (/\.(md|mdx|txt|rst)$/i.test(String(path))) return 'docs';
    return 'codigo';
  }
  if (['bash', 'shell'].includes(normalized)) {
    const command = String(input?.command || '');
    if (/\b(test|pytest|jest|vitest|mocha|cargo test|npm test|pnpm test|yarn test)\b/i.test(command)) return 'tests';
    if (/\b(git push|docker|ssh|deploy|kubectl|terraform apply)\b/i.test(command)) return 'deploy';
    return 'comandos';
  }
  if (['webfetch', 'websearch'].includes(normalized)) return 'web';
  if (['task'].includes(normalized)) return 'delegando';
  return 'comandos';
}

function createBase(id) {
  return {
    id,
    name: String(id).slice(0, 16),
    manager: 'OpenCode',
    model: 'modelo',
    project: '',
    state: 'idle',
    detail: '',
    since: now(),
    updatedAt: now(),
    currentTool: null,
    previousState: null,
    listoUntil: 0,
    hydrated: false,
    listoTimer: null,
  };
}

export function createOpenCodeSource({
  emit,
  onStatus,
  maxAgents = 6,
  maxIdle = 2,
  pollMs = 12000,
  autostart = false,
  url = '',
  client: injectedClient = null,
} = {}) {
  if (typeof emit !== 'function') throw new Error('createOpenCodeSource necesita emit');

  const agents = new Map();
  let stopped = false;
  let client = null;
  let connected = false;
  let refreshTimer = null;
  let abortController = null;

  function setConnected(value) {
    if (connected === Boolean(value)) return;
    connected = Boolean(value);
    onStatus?.(connected);
  }

  function removeAgent(id) {
    const agent = agents.get(id);
    if (agent?.listoTimer) clearTimeout(agent.listoTimer);
    agents.delete(id);
  }

  function rebuild() {
    const list = [...agents.values()]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, maxAgents)
      .map(toSnapshot);
    emit(list);
  }

  function applyState(id, state, detail) {
    const agent = agents.get(id);
    if (!agent) return;
    if (agent.listoTimer) {
      clearTimeout(agent.listoTimer);
      agent.listoTimer = null;
    }
    agent.previousState = agent.state;
    agent.state = state;
    agent.detail = detail || '';
    agent.since = now();
    agent.updatedAt = now();
    if (state === 'listo') {
      agent.listoUntil = now() + 8000;
      agent.listoTimer = setTimeout(() => {
        const current = agents.get(id);
        if (current && current.state === 'listo') {
          current.state = 'idle';
          current.since = now();
          current.updatedAt = now();
          rebuild();
        }
      }, 8000);
      agent.listoTimer.unref?.();
    }
    rebuild();
  }

  function getOrCreate(id) {
    if (agents.has(id)) return agents.get(id);
    const agent = createBase(id);
    agents.set(id, agent);
    rebuild();
    hydrate(id);
    return agent;
  }

  async function hydrate(id) {
    const agent = agents.get(id);
    if (!agent || agent.hydrated) return;
    agent.hydrated = true;
    if (!client) return;
    try {
      const session = await client.session.get({ sessionID: id });
      const current = agents.get(id);
      if (!current) return;
      if (session.parentID) {
        removeAgent(id);
        rebuild();
        return;
      }
      current.name = session.title || current.name;
      current.model = session.model?.id || current.model;
      current.project = session.location?.directory || current.project;
      current.updatedAt = now();
      rebuild();
    } catch {
      // Si la sesión ya no existe o falla la red, se conserva el marcador.
    }
  }

  async function refreshSessions() {
    if (!client) return;
    const response = await client.session.list({ limit: 50, parentID: null, archived: false });
    const sessions = [...(response.data || [])];
    let activeIds = new Set();
    try {
      const active = await client.session.active();
      activeIds = new Set(Object.keys(active));
    } catch {
      // Sin lista de activas se sigue con las recientes.
    }

    sessions.sort((a, b) => {
      const activeDiff = (activeIds.has(b.id) ? 1 : 0) - (activeIds.has(a.id) ? 1 : 0);
      if (activeDiff !== 0) return activeDiff;
      return (b.time?.updated || 0) - (a.time?.updated || 0);
    });

    const activeSessions = sessions.filter((session) => activeIds.has(session.id));
    const idleSessions = sessions.filter((session) => !activeIds.has(session.id));
    const selected = [
      ...activeSessions.slice(0, maxAgents),
      ...idleSessions.slice(0, Math.min(maxIdle, Math.max(0, maxAgents - activeSessions.length))),
    ].slice(0, maxAgents);
    const selectedIds = new Set(selected.map((session) => session.id));
    for (const id of [...agents.keys()]) {
      if (!selectedIds.has(id)) removeAgent(id);
    }

    for (const session of selected) {
      if (session.parentID) continue;
      const existing = agents.get(session.id);
      if (existing) {
        existing.name = session.title || existing.name;
        existing.model = session.model?.id || existing.model;
        existing.project = session.location?.directory || existing.project;
        existing.updatedAt = now();
      } else {
        const agent = createBase(session.id);
        agent.name = session.title || agent.name;
        agent.model = session.model?.id || agent.model;
        agent.project = session.location?.directory || agent.project;
        agent.state = 'idle';
        agent.since = now();
        agent.updatedAt = now();
        agents.set(session.id, agent);
      }
    }

    for (const id of activeIds) {
      const agent = agents.get(id);
      if (agent && agent.state === 'idle') applyState(id, 'codigo', 'ejecutando');
    }
    rebuild();
  }

  function handleEvent(event) {
    if (!event || typeof event !== 'object') return;
    const sid = event.sessionID || event.data?.sessionID;
    if (!sid) return;
    const type = event.type;

    switch (type) {
      case 'session.created':
        getOrCreate(sid);
        applyState(sid, 'codigo', 'iniciando');
        break;
      case 'session.deleted':
        removeAgent(sid);
        rebuild();
        break;
      case 'session.renamed': {
        const agent = getOrCreate(sid);
        agent.name = event.data?.title || agent.name;
        agent.updatedAt = now();
        rebuild();
        break;
      }
      case 'session.agent.selected': {
        const agent = getOrCreate(sid);
        agent.detail = event.data?.agent || agent.detail;
        agent.updatedAt = now();
        rebuild();
        break;
      }
      case 'session.model.selected': {
        const agent = getOrCreate(sid);
        agent.model = event.data?.model?.id || agent.model;
        agent.updatedAt = now();
        rebuild();
        break;
      }
      case 'session.status': {
        const agent = getOrCreate(sid);
        const status = event.data?.status;
        if (status?.type === 'busy') {
          applyState(sid, agent.currentTool ? toolState(agent.currentTool, {}) : 'codigo', agent.currentTool || 'ejecutando');
        } else if (status?.type === 'idle') {
          if (agent.state === 'listo' && Date.now() < agent.listoUntil) break;
          if (agent.state === 'error' && Date.now() - agent.since < 15000) break;
          applyState(sid, 'idle', '');
        } else if (status?.type === 'retry') {
          applyState(sid, 'espera', status.message || 'reintentando');
        }
        break;
      }
      case 'session.execution.started': {
        const agent = getOrCreate(sid);
        applyState(sid, agent.currentTool ? toolState(agent.currentTool, {}) : 'codigo', 'ejecutando');
        break;
      }
      case 'session.tool.input.started': {
        const agent = getOrCreate(sid);
        agent.currentTool = event.data?.name || agent.currentTool;
        applyState(sid, toolState(agent.currentTool, {}), agent.currentTool);
        break;
      }
      case 'session.tool.called': {
        const agent = getOrCreate(sid);
        agent.currentTool = event.data?.name || agent.currentTool;
        applyState(sid, toolState(agent.currentTool, event.data?.input), agent.currentTool);
        break;
      }
      case 'session.tool.progress':
        break;
      case 'session.tool.success': {
        const agent = getOrCreate(sid);
        agent.currentTool = null;
        applyState(sid, 'codigo', 'pensando');
        break;
      }
      case 'session.tool.failed': {
        const agent = getOrCreate(sid);
        agent.currentTool = null;
        applyState(sid, 'error', event.data?.error?.message || 'error');
        break;
      }
      case 'session.execution.succeeded': {
        const agent = getOrCreate(sid);
        agent.currentTool = null;
        applyState(sid, 'listo', 'terminado');
        break;
      }
      case 'session.execution.failed': {
        const agent = getOrCreate(sid);
        agent.currentTool = null;
        applyState(sid, 'error', event.data?.error?.message || 'error');
        break;
      }
      case 'session.execution.interrupted': {
        const agent = getOrCreate(sid);
        agent.currentTool = null;
        applyState(sid, 'idle', 'interrumpido');
        break;
      }
      case 'permission.asked': {
        const agent = getOrCreate(sid);
        agent.previousState = agent.state;
        applyState(sid, 'espera', 'permiso');
        break;
      }
      case 'permission.replied': {
        const agent = getOrCreate(sid);
        if (event.data?.reply === 'reject') applyState(sid, 'error', 'rechazado');
        else applyState(sid, agent.previousState || 'codigo', 'continuando');
        break;
      }
      default:
        break;
    }
  }

  async function connect() {
    while (!stopped) {
      try {
        let endpoint;
        if (injectedClient) {
          client = injectedClient;
        } else if (url) {
          endpoint = { url };
          client = OpenCode.make({
            baseUrl: endpoint.url,
            headers: {},
          });
        } else if (autostart) {
          endpoint = await Service.ensure({ version: (version) => String(version).startsWith('2.') });
          client = OpenCode.make({
            baseUrl: endpoint.url,
            headers: Service.headers(endpoint),
          });
        } else {
          endpoint = await Service.discover();
          client = OpenCode.make({
            baseUrl: endpoint.url,
            headers: Service.headers(endpoint),
          });
        }

        if (!injectedClient) await client.server.info();
        setConnected(true);
        await refreshSessions();

        abortController = new AbortController();
        try {
          for await (const event of client.event.subscribe({ signal: abortController.signal })) {
            handleEvent(event);
          }
        } catch {
          // Se perdió la conexión; se reintenta abajo.
        }
        setConnected(false);
      } catch {
        setConnected(false);
        emit([]);
      }
      if (stopped) break;
      await sleep(3000);
    }
  }

  function start() {
    if (refreshTimer) return;
    onStatus?.(false);
    refreshTimer = setInterval(() => {
      if (connected && client) refreshSessions().catch(() => {});
    }, pollMs);
    refreshTimer.unref?.();
    connect().catch(() => {});
  }

  function stop() {
    stopped = true;
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
    if (abortController) abortController.abort();
    for (const agent of agents.values()) {
      if (agent.listoTimer) clearTimeout(agent.listoTimer);
    }
    agents.clear();
    setConnected(false);
  }

  return { name: 'opencode', start, stop };
}