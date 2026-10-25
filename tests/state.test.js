import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STATE_IDS } from '../server/state.js';

test('replace normaliza agentes y respeta el límite', () => {
  const store = createStore({ source: 'mock', maxAgents: 2, now: () => 1000 });
  const snapshot = store.replace([
    { id: 'a', name: 'Agente A', manager: 'OpenCode', model: 'm1', state: 'codigo' },
    { id: 'b', state: 'estado-invalido' },
    { id: 'c', state: 'tests' },
    { id: '', state: 'idle' },
  ]);

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.source, 'mock');
  assert.equal(snapshot.agents.length, 2);
  assert.equal(snapshot.agents[0].name, 'Agente A');
  assert.equal(snapshot.agents[1].state, 'idle');
  assert.equal(snapshot.agents[1].manager, 'OpenCode');
  assert.equal(snapshot.agents[1].since, 1000);
  assert.ok(STATE_IDS.includes(snapshot.agents[0].state));
});

test('upsert y remove actualizan el snapshot', () => {
  const store = createStore({ now: () => 2000 });
  store.replace([{ id: 'a', name: 'A', state: 'leer' }]);
  store.upsert({ id: 'b', name: 'B', state: 'error' });

  let snapshot = store.snapshot();
  assert.equal(snapshot.agents.length, 2);
  assert.equal(snapshot.agents[1].state, 'error');

  store.upsert({ id: 'a', name: 'A2', state: 'docs' });
  snapshot = store.snapshot();
  assert.equal(snapshot.agents[0].name, 'A2');
  assert.equal(snapshot.agents[0].state, 'docs');

  store.remove('a');
  snapshot = store.snapshot();
  assert.deepEqual(snapshot.agents.map((agent) => agent.id), ['b']);
});

test('subscribe notifica cambios y se puede cancelar', () => {
  const store = createStore();
  const seen = [];
  const unsubscribe = store.subscribe((snapshot) => seen.push(snapshot.agents.length));

  store.replace([{ id: 'a', state: 'codigo' }]);
  store.upsert({ id: 'b', state: 'idle' });
  store.remove('a');
  assert.deepEqual(seen, [1, 2, 1]);

  unsubscribe();
  store.upsert({ id: 'c', state: 'web' });
  assert.deepEqual(seen, [1, 2, 1]);
});

test('setConnected cambia el estado de la fuente', () => {
  const store = createStore({ source: 'opencode' });
  assert.equal(store.snapshot().connected, true);
  store.setConnected(false);
  assert.equal(store.snapshot().connected, false);
});
