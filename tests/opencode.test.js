import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenCodeSource } from '../server/sources/opencode.js';

function makeClient(events) {
  return {
    server: { info: async () => ({ version: '2.0.32' }) },
    session: {
      list: async () => ({ data: [{ id: 's1', title: 'Sesión de prueba', model: { id: 'modelo' }, location: { directory: 'C:\\\\repo' }, time: { updated: 10 } }] }),
      active: async () => ({}),
      get: async ({ sessionID }) => ({ id: sessionID, title: 'Sesión de prueba', model: { id: 'modelo' }, location: { directory: 'C:\\\\repo' } }),
    },
    event: {
      subscribe: async function* () {
        for (const event of events) yield event;
      },
    },
  };
}

test('traduce eventos de OpenCode a estados de la casa', async () => {
  const snapshots = [];
  const source = createOpenCodeSource({
    emit: (agents) => snapshots.push(agents),
    onStatus: () => {},
    maxAgents: 4,
    pollMs: 100000,
    client: makeClient([
      { type: 'session.created', sessionID: 's1' },
      { type: 'session.tool.input.started', sessionID: 's1', data: { name: 'read' } },
      { type: 'session.tool.success', sessionID: 's1', data: {} },
      { type: 'session.execution.succeeded', sessionID: 's1', data: {} },
    ]),
  });

  source.start();
  await new Promise((resolve) => setTimeout(resolve, 500));
  source.stop();

  const last = snapshots.at(-1);
  assert.ok(last, 'debe emitir al menos un snapshot');
  assert.equal(last.length, 1);
  assert.equal(last[0].id, 's1');
  assert.equal(last[0].state, 'listo');
  assert.equal(last[0].name, 'Sesión de prueba');
});

test('permission.replied con reject termina en error', async () => {
  const snapshots = [];
  const source = createOpenCodeSource({
    emit: (agents) => snapshots.push(agents),
    onStatus: () => {},
    maxAgents: 4,
    pollMs: 100000,
    client: makeClient([
      { type: 'session.created', sessionID: 's2' },
      { type: 'permission.asked', sessionID: 's2', data: {} },
      { type: 'permission.replied', sessionID: 's2', data: { reply: 'reject' } },
    ]),
  });

  source.start();
  await new Promise((resolve) => setTimeout(resolve, 500));
  source.stop();

  const last = snapshots.at(-1);
  assert.equal(last[0].state, 'error');
});

test('limita activos e inactivos', async () => {
  const sessions = Array.from({ length: 10 }, (_, i) => ({
    id: `s${i + 1}`,
    title: `Sesión ${i + 1}`,
    model: { id: 'modelo' },
    location: { directory: 'C:\\\\repo' },
    time: { updated: 100 - i },
  }));
  const snapshots = [];
  const source = createOpenCodeSource({
    emit: (agents) => snapshots.push(agents),
    onStatus: () => {},
    maxAgents: 6,
    maxIdle: 2,
    pollMs: 100000,
    client: {
      server: { info: async () => ({ version: '2.0.32' }) },
      session: {
        list: async () => ({ data: sessions }),
        active: async () => ({ s1: { type: 'running' }, s2: { type: 'running' } }),
        get: async ({ sessionID }) => ({ id: sessionID, title: 'Sesión', model: { id: 'modelo' }, location: { directory: 'C:\\\\repo' } }),
      },
      event: { subscribe: async function* () {} },
    },
  });

  source.start();
  await new Promise((resolve) => setTimeout(resolve, 500));
  source.stop();

  const last = snapshots.at(-1);
  assert.ok(last, 'debe emitir snapshot');
  assert.equal(last.length, 4, '2 activos + 2 inactivos');
});
