// Perfiles de agentes: alias y look atados a gestor + carpeta del proyecto.
// Persistencia local en JSON, con escritura atómica y cola para no pisarse.
import { readFileSync, renameSync, mkdirSync, copyFileSync } from 'node:fs';
import { promises as fsp } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../catalogo.js';

const CATALOGO = globalThis.CATALOGO;
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const KEY_RE = /^[a-z0-9-]{1,24}:[a-f0-9]{12}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const MAX_PROFILES = 200;
export const PROFILE_VERSION = 2;
const LOOK_KEYS = new Set(['camisa', 'piel', 'pelo', 'pantalon', 'gorro', 'gorroColor', 'peinado', 'accesorios']);
const COLOR_KEYS = ['camisa', 'piel', 'pelo', 'pantalon', 'gorroColor'];
const HAT_IDS = new Set(CATALOGO.gorros.map((item) => item.id));
const PEINADO_IDS = new Set(CATALOGO.peinados.map((item) => item.id));
const ACCESORIO_RANURA = new Map(CATALOGO.accesorios.map((item) => [item.id, item.ranura]));
const ACCESORIO_IDS = new Set(ACCESORIO_RANURA.keys());

function dataFile() {
  const dir = process.env.CASA_DATA_DIR ? resolve(process.env.CASA_DATA_DIR) : join(ROOT, 'data');
  return join(dir, 'casa.json');
}

function emptyLook() {
  return {
    camisa: null,
    piel: null,
    pelo: null,
    pantalon: null,
    gorro: 'auto',
    gorroColor: null,
    peinado: 'auto',
    accesorios: [],
  };
}

// Conserva el primer accesorio de cada ranura y descarta ids desconocidos.
function dedupeAccesorios(lista) {
  const vistos = new Set();
  const salida = [];
  for (const id of lista) {
    const ranura = ACCESORIO_RANURA.get(id);
    if (!ranura || vistos.has(ranura)) continue;
    vistos.add(ranura);
    salida.push(id);
  }
  return salida;
}

// Normaliza un look leído de disco o de localStorage (incluye datos v1).
function sanearLook(look) {
  const salida = isPlainObject(look) ? { ...look } : {};
  if (!PEINADO_IDS.has(salida.peinado)) salida.peinado = 'auto';
  salida.accesorios = dedupeAccesorios(Array.isArray(salida.accesorios) ? salida.accesorios : []);
  return salida;
}

function emptyProfile(stamp) {
  return { alias: '', look: emptyLook(), actualizado: stamp };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidKey(key) {
  return typeof key === 'string' && KEY_RE.test(key);
}

export function createProfiles({ file = dataFile(), now = Date.now, puedeUsar = () => true } = {}) {
  if (!CATALOGO) throw new Error('No se cargó catalogo.js');

  const perfiles = Object.create(null);
  let chain = Promise.resolve();

  function validarAlias(value) {
    if (typeof value !== 'string') throw new Error('El alias debe ser texto');
    if (/[\r\n]/.test(value)) throw new Error('El alias no puede tener saltos de línea');
    if (value.length > CATALOGO.limites.alias) {
      throw new Error(`El alias no puede pasar de ${CATALOGO.limites.alias} caracteres`);
    }
    return value;
  }

  function validarColor(campo, value) {
    if (value === null) return null;
    if (typeof value !== 'string' || !HEX_RE.test(value)) {
      throw new Error(`Color inválido en ${campo}`);
    }
    return value.toLowerCase();
  }

  function validarLook(value) {
    if (!isPlainObject(value)) throw new Error('El look debe ser un objeto');
    const out = {};
    for (const key of Object.keys(value)) {
      if (!LOOK_KEYS.has(key)) throw new Error(`Campo desconocido en look: ${key}`);
    }
    for (const key of COLOR_KEYS) {
      if (value[key] !== undefined) out[key] = validarColor(key, value[key]);
    }
    if (value.gorro !== undefined) {
      if (typeof value.gorro !== 'string' || !HAT_IDS.has(value.gorro)) {
        throw new Error(`Gorro desconocido: ${String(value.gorro)}`);
      }
      out.gorro = value.gorro;
    }
    if (value.peinado !== undefined) {
      if (typeof value.peinado !== 'string' || !PEINADO_IDS.has(value.peinado)) {
        throw new Error(`Peinado desconocido: ${String(value.peinado)}`);
      }
      out.peinado = value.peinado;
    }
    if (value.accesorios !== undefined) {
      if (!Array.isArray(value.accesorios)) throw new Error('Los accesorios deben ser una lista');
      const vistos = new Set();
      const ranuras = new Set();
      for (const id of value.accesorios) {
        if (typeof id !== 'string' || !ACCESORIO_IDS.has(id)) {
          throw new Error(`Accesorio desconocido: ${String(id)}`);
        }
        if (vistos.has(id)) throw new Error(`Accesorio repetido: ${id}`);
        if (!puedeUsar(id)) throw new Error(`Accesorio no disponible: ${id}`);
        const ranura = ACCESORIO_RANURA.get(id);
        if (ranuras.has(ranura)) {
          throw new Error(`Ya hay un accesorio en la ranura ${ranura}`);
        }
        vistos.add(id);
        ranuras.add(ranura);
      }
      out.accesorios = [...value.accesorios];
    }
    return out;
  }

  function validate(parche) {
    if (!isPlainObject(parche)) throw new Error('El perfil debe ser un objeto');
    const out = {};
    for (const key of Object.keys(parche)) {
      if (key !== 'alias' && key !== 'look') throw new Error(`Campo desconocido: ${key}`);
    }
    if (parche.alias !== undefined) out.alias = validarAlias(parche.alias);
    if (parche.look !== undefined) out.look = validarLook(parche.look);
    return out;
  }

  function cargar() {
    let raw;
    try {
      raw = readFileSync(file, 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') return;
      renombrarCorrupto();
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed) || !isPlainObject(parsed.perfiles)) throw new Error('forma');
      const esV1 = Number(parsed.version) < PROFILE_VERSION;
      if (esV1) {
        // Copia de seguridad del archivo v1 antes de normalizarlo.
        try { copyFileSync(file, `${file}.v1.bak`); } catch { /* sin copia, seguimos */ }
      }
      let migrado = esV1;
      for (const [key, value] of Object.entries(parsed.perfiles)) {
        if (!isValidKey(key) || !isPlainObject(value)) continue;
        try {
          const lookOriginal = value.look ?? {};
          const lookSaneado = sanearLook(lookOriginal);
          const limpio = validate({ alias: value.alias ?? '', look: lookSaneado });
          const look = { ...emptyLook(), ...(limpio.look || {}) };
          perfiles[key] = {
            alias: limpio.alias || '',
            look,
            actualizado: Number.isFinite(value.actualizado) ? value.actualizado : now(),
          };
          if (JSON.stringify(lookSaneado) !== JSON.stringify(lookOriginal)) migrado = true;
        } catch { /* una entrada rota no invalida el resto */ }
      }
      recortar();
      if (migrado) guardar();
    } catch {
      renombrarCorrupto();
    }
  }

  function renombrarCorrupto() {
    try {
      renameSync(file, `${file}.corrupto-${now()}`);
    } catch { /* si no se puede renombrar, se sigue con la casa vacía */ }
  }

  function recortar() {
    const claves = Object.keys(perfiles);
    while (claves.length > MAX_PROFILES) {
      let viejo = null;
      for (const key of claves) {
        const stamp = perfiles[key]?.actualizado ?? 0;
        if (viejo === null || stamp < (perfiles[viejo]?.actualizado ?? 0)) viejo = key;
      }
      if (viejo === null) break;
      delete perfiles[viejo];
      claves.splice(claves.indexOf(viejo), 1);
    }
  }

  function guardar() {
    const payload = JSON.stringify({ version: PROFILE_VERSION, perfiles: clone(perfiles) }, null, 2);
    chain = chain
      .then(async () => {
        mkdirSync(dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        await fsp.writeFile(tmp, payload, 'utf8');
        await fsp.rename(tmp, file);
      })
      .catch(() => { /* un fallo de disco no debe tumbar la casa */ });
    return chain;
  }

  function get(clave) {
    if (!isValidKey(clave)) return null;
    const perfil = perfiles[clave];
    return perfil ? clone(perfil) : null;
  }

  function all() {
    const out = {};
    for (const key of Object.keys(perfiles)) out[key] = clone(perfiles[key]);
    return out;
  }

  function set(clave, parche) {
    if (!isValidKey(clave)) throw new Error('Clave de perfil inválida');
    const limpio = validate(parche);
    const previo = perfiles[clave] || emptyProfile(now());
    const siguiente = {
      alias: limpio.alias !== undefined ? limpio.alias : previo.alias,
      look: { ...emptyLook(), ...previo.look, ...(limpio.look || {}) },
      actualizado: now(),
    };
    perfiles[clave] = siguiente;
    recortar();
    guardar();
    return clone(siguiente);
  }

  function reset(clave) {
    if (!isValidKey(clave)) throw new Error('Clave de perfil inválida');
    delete perfiles[clave];
    guardar();
    return null;
  }

  cargar();

  return {
    get,
    all,
    set,
    reset,
    validate,
    flush: () => chain,
    file,
  };
}
