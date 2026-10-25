(() => {
  const badge = document.getElementById('liveStatus');
  const text = document.getElementById('liveText');
  if (!badge) return;

  function status(mode, label) {
    badge.dataset.mode = mode;
    badge.textContent = label;
  }

  // Abrir el HTML como archivo sigue siendo la demo de siempre.
  if (!/^https?:$/.test(location.protocol) || new URLSearchParams(location.search).has('demo')) {
    status('demo', 'Demo');
    return;
  }

  let events = null;

  function connectEvents() {
    if (events) events.close();
    events = new EventSource('/api/events');
    events.addEventListener('snapshot', (event) => {
      try { window.applyAgentSnapshot(JSON.parse(event.data)); } catch { /* snapshot inválido */ }
    });
    events.onopen = () => status('live', 'En vivo');
    events.onerror = () => status('off', 'Sin conexión');
  }

  async function start() {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('health');
      const health = await response.json();
      const label = health.source === 'opencode' ? 'Observando OpenCode' : 'Datos simulados del servidor';
      if (text) text.textContent = label;
      document.body.classList.add('is-live');
      window.setDemoMode?.(false);
      status('live', 'En vivo');
      connectEvents();
    } catch {
      status('demo', 'Demo');
    }
  }

  start();
})();
