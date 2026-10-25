import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProfiles } from '../server/profiles.js';
import { profileKeyFor, projectNameOf } from '../server/state.js';

const KEY_RE = /^[a-z0-9-]{1,24}:[a-f0-9]{12}$/;

async function tempFile(t, name = 'casa.json') {
  const dir = await mkdtemp(join(tmpdir(), 'casa-perfiles-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return { dir, file: join(dir, name) };
}

test('la clave de perfil es estable y depende de gestor y carpeta', () => {
  const a = profileKeyFor({ manager: 'OpenCode', project: 'C:\\Proyectos\\ServerHub\\' });
  const b = profileKeyFor({ manager: 'OpenCode', project: 'c:/proyectos/serverhub' });
  const c = profileKeyFor({ manager: 'Codex', project: 'c:/proyectos/serverhub' });

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, KEY_RE);
  assert.match(c, KEY_RE);
  assert.match(profileKeyFor({ manager: 'Claude Code' }), /^claude-code:[a-f0-9]{12}$/);
  assert.match(profileKeyFor({ manager: 'Claude Code', project: '' }), /^claude-code:[a-f0-9]{12}$/);
});

test('el nombre de proyecto es solo la última carpeta', () => {
  assert.equal(projectNameOf('C:\\proyectos\\ServerHub'), 'ServerHub');
  assert.equal(projectNameOf('C:\\proyectos\\ServerHub\\'), 'ServerHub');
  assert.equal(projectNameOf('/home/ana/Portafolio'), 'Portafolio');
  assert.equal(projectNameOf(''), '');
  assert.equal(projectNameOf('x'.repeat(60)), 'x'.repeat(40));
});

test('validate rechaza colores, gorros, accesorios, alias y campos inválidos', async (t) => {
  const { file } = await tempFile(t);
  const profiles = createProfiles({ file, now: () => 1000 });

  assert.throws(() => profiles.validate({ look: { camisa: '#fff' } }), /Color inválido/);
  assert.throws(() => profiles.validate({ look: { piel: 'rojo' } }), /Color inválido/);
  assert.throws(() => profiles.validate({ look: { gorro: 'no-existe' } }), /Gorro desconocido/);
  assert.throws(() => profiles.validate({ look: { peinado: 'no-existe' } }), /Peinado desconocido/);
  assert.throws(() => profiles.validate({ look: { accesorios: ['bufanda', 'mono'] } }), /ranura/);
  assert.throws(() => profiles.validate({ look: { accesorios: ['capa', 'capa'] } }), /repetido/);
  assert.throws(() => profiles.validate({ look: { accesorios: ['no-existe'] } }), /Accesorio desconocido/);
  assert.throws(() => profiles.validate({ alias: 'x'.repeat(25) }), /24 caracteres/);
  assert.throws(() => profiles.validate({ alias: 'a\nb' }), /saltos de línea/);
  assert.throws(() => profiles.validate({ alias: 'ok', extra: 1 }), /Campo desconocido/);
  assert.throws(() => profiles.validate({ look: { extra: true } }), /Campo desconocido en look/);
  assert.throws(() => profiles.validate(null), /objeto/);

  const valido = profiles.validate({
    alias: 'Codex',
    look: { camisa: '#ABCDEF', gorro: 'corona', peinado: 'afro', accesorios: ['lentes_redondos', 'corbata', 'alas', 'bata', 'guante'] },
  });
  assert.equal(valido.look.camisa, '#abcdef');
  assert.equal(valido.look.gorro, 'corona');
  assert.equal(valido.look.peinado, 'afro');
  assert.deepEqual(valido.look.accesorios, ['lentes_redondos', 'corbata', 'alas', 'bata', 'guante']);
});

test('set fusiona el look y sobrevive a recargar desde disco', async (t) => {
  const { file } = await tempFile(t);
  const key = profileKeyFor({ manager: 'Codex', project: 'C:\\proyectos\\ServerHub' });
  const profiles = createProfiles({ file, now: () => 1000 });

  const primero = profiles.set(key, { alias: 'Codex ServerHub', look: { camisa: '#112233', gorro: 'corona' } });
  assert.equal(primero.alias, 'Codex ServerHub');
  assert.equal(primero.look.camisa, '#112233');
  assert.equal(primero.look.gorro, 'corona');
  assert.equal(primero.actualizado, 1000);

  const segundo = profiles.set(key, { look: { accesorios: ['capa'] } });
  assert.equal(segundo.look.camisa, '#112233');
  assert.deepEqual(segundo.look.accesorios, ['capa']);
  assert.equal(segundo.alias, 'Codex ServerHub');

  await profiles.flush();
  const raw = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(raw.version, 2);
  assert.equal(raw.perfiles[key].look.camisa, '#112233');

  const recargado = createProfiles({ file, now: () => 2000 });
  assert.deepEqual(recargado.get(key), segundo);
  assert.equal(recargado.get('clave-invalida'), null);
  assert.throws(() => recargado.set('clave-invalida', {}), /Clave de perfil inválida/);

  recargado.reset(key);
  await recargado.flush();
  assert.equal(recargado.get(key), null);
});

test('un archivo corrupto se renombra y se empieza vacío', async (t) => {
  const { dir, file } = await tempFile(t);
  await writeFile(file, '{ esto no es json', 'utf8');

  const profiles = createProfiles({ file, now: () => 5000 });
  assert.deepEqual(profiles.all(), {});
  const nombres = await readdir(dir);
  assert.ok(nombres.includes('casa.json.corrupto-5000'), nombres.join(', '));

  await writeFile(file, JSON.stringify({ version: 1, perfiles: [] }), 'utf8');
  const otra = createProfiles({ file, now: () => 6000 });
  assert.deepEqual(otra.all(), {});
  assert.ok((await readdir(dir)).includes('casa.json.corrupto-6000'));
});

test('el máximo de perfiles conserva los más recientes', async (t) => {
  const { file } = await tempFile(t);
  let stamp = 0;
  const profiles = createProfiles({ file, now: () => ++stamp });
  for (let i = 0; i < 201; i++) {
    profiles.set(`gestor-${i}:aaaaaaaaaaaa`, { alias: 'a' + i });
  }
  assert.equal(Object.keys(profiles.all()).length, 200);
  assert.equal(profiles.get('gestor-0:aaaaaaaaaaaa'), null);
  assert.ok(profiles.get('gestor-200:aaaaaaaaaaaa'));
  await profiles.flush();
});


test('migra un perfil v1 a v2 y conserva el .bak', async (t) => {
  const { dir, file } = await tempFile(t);
  const key = profileKeyFor({ manager: 'Codex', project: 'C:\\proyectos\\ServerHub' });
  const v1 = {
    version: 1,
    perfiles: {
      [key]: {
        alias: 'Codex ServerHub',
        look: {
          camisa: '#112233',
          gorro: 'corona',
          accesorios: ['bufanda', 'mono', 'capa', 'mochila'],
        },
        actualizado: 1000,
      },
    },
  };
  await writeFile(file, JSON.stringify(v1, null, 2), 'utf8');
  const original = await readFile(file, 'utf8');

  const profiles = createProfiles({ file, now: () => 2000 });
  await profiles.flush();

  const bak = await readFile(file + '.v1.bak', 'utf8');
  assert.equal(bak, original);

  const raw = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(raw.version, 2);
  const perfil = raw.perfiles[key];
  assert.equal(perfil.look.peinado, 'auto');
  assert.deepEqual(perfil.look.accesorios, ['bufanda', 'capa']);

  const recargado = createProfiles({ file, now: () => 3000 });
  const p2 = recargado.get(key);
  assert.equal(p2.look.peinado, 'auto');
  assert.deepEqual(p2.look.accesorios, ['bufanda', 'capa']);
});
