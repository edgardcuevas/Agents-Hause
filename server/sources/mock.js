const CYCLE = ['codigo', 'leer', 'tests', 'deploy', 'espera', 'idle'];

const SEEDS = [
  { id: 'mock-opencode-1', name: 'opencode-1', manager: 'OpenCode', model: 'deepseek', project: 'C:\\proyectos\\ServerHub' },
  { id: 'mock-opencode-2', name: 'opencode-2', manager: 'OpenCode', model: 'claude-sonnet', project: 'C:\\proyectos\\Portafolio' },
  { id: 'mock-codex-1', name: 'codex-1', manager: 'Codex', model: 'gpt-5', project: 'C:\\proyectos\\ServerHub' },
  { id: 'mock-claude-1', name: 'claude-1', manager: 'Claude Code', model: 'claude-opus', project: 'C:\\proyectos\\Api' },
  { id: 'mock-opencode-3', name: 'opencode-3', manager: 'OpenCode', model: 'gemini', project: 'C:\\proyectos\\Docs' },
  { id: 'mock-codex-2', name: 'codex-2', manager: 'Codex', model: 'gpt-5-mini', project: 'C:\\proyectos\\Portafolio' },
];

export function createMockSource({ emit, onStatus, intervalMs = 5000 } = {}) {
  if (typeof emit !== 'function') throw new Error('createMockSource necesita emit');

  let step = 0;
  let timer = null;
  const agents = SEEDS.map((seed, index) => ({
    ...seed,
    state: CYCLE[index % CYCLE.length],
    detail: 'demo',
    since: Date.now(),
    updatedAt: Date.now(),
  }));

  function send() {
    const stamp = Date.now();
    emit(agents.map((agent) => ({ ...agent, updatedAt: stamp })));
  }

  function tick() {
    step += 1;
    const stamp = Date.now();
    agents.forEach((agent, index) => {
      agent.state = CYCLE[(index + step) % CYCLE.length];
      agent.since = stamp;
      agent.updatedAt = stamp;
    });
    send();
  }

  return {
    name: 'mock',
    start() {
      if (timer) return;
      onStatus?.(true);
      send();
      timer = setInterval(tick, intervalMs);
      timer.unref?.();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      onStatus?.(false);
    },
  };
}
