// Perfiles de agente en el navegador: PUT al servidor en modo vivo y
// localStorage en modo demo. La validación replica los límites del servidor.
(() => {
  const CAT = globalThis.CATALOGO;
  const STORAGE_KEY = 'casa.perfiles.v2';
  const STORAGE_KEY_V1 = 'casa.perfiles.v1';
  const STORAGE_BACKUP = 'casa.perfiles.v1.bak';
  const PERFIL_VERSION = 2;
  const HEX_RE = /^#[0-9a-f]{6}$/i;
  const KEY_RE = /^[a-z0-9-]{1,24}:[a-f0-9]{12}$/;
  const LOOK_KEYS = ['camisa', 'piel', 'pelo', 'pantalon', 'gorro', 'gorroColor', 'peinado', 'accesorios'];
  const COLOR_KEYS = ['camisa', 'piel', 'pelo', 'pantalon', 'gorroColor'];

  if (!CAT) return;

  const gorroIds = new Set(CAT.gorros.map((item) => item.id));
  const peinadoIds = new Set(CAT.peinados.map((item) => item.id));
  const accesorioRanura = new Map(CAT.accesorios.map((item) => [item.id, item.ranura]));
  const accesorioIds = new Set(accesorioRanura.keys());

  function esVivo() {
    return /^https?:$/.test(location.protocol) && document.body.classList.contains('is-live');
  }

  function esDemo() {
    return location.protocol === 'file:' || new URLSearchParams(location.search).has('demo');
  }

  function validarColor(campo, valor) {
    if (valor === null) return null;
    if (typeof valor !== 'string' || !HEX_RE.test(valor)) {
      throw new Error(`Color inválido en ${campo}`);
    }
    return valor.toLowerCase();
  }

  function dedupeAccesorios(lista) {
    const vistos = new Set();
    const salida = [];
    for (const id of lista) {
      const ranura = accesorioRanura.get(id);
      if (!ranura || vistos.has(ranura)) continue;
      vistos.add(ranura);
      salida.push(id);
    }
    return salida;
  }

  function validar(parche) {
    if (!parche || typeof parche !== 'object' || Array.isArray(parche)) {
      throw new Error('El perfil debe ser un objeto');
    }
    const salida = {};
    for (const clave of Object.keys(parche)) {
      if (clave !== 'alias' && clave !== 'look') throw new Error(`Campo desconocido: ${clave}`);
    }
    if (parche.alias !== undefined) {
      if (typeof parche.alias !== 'string') throw new Error('El alias debe ser texto');
      if (/[\r\n]/.test(parche.alias)) throw new Error('El alias no puede tener saltos de línea');
      if (parche.alias.length > CAT.limites.alias) {
        throw new Error(`El alias no puede pasar de ${CAT.limites.alias} caracteres`);
      }
      salida.alias = parche.alias;
    }
    if (parche.look !== undefined) {
      if (!parche.look || typeof parche.look !== 'object' || Array.isArray(parche.look)) {
        throw new Error('El look debe ser un objeto');
      }
      const look = {};
      for (const clave of Object.keys(parche.look)) {
        if (!LOOK_KEYS.includes(clave)) throw new Error(`Campo desconocido en look: ${clave}`);
      }
      for (const clave of COLOR_KEYS) {
        if (parche.look[clave] !== undefined) look[clave] = validarColor(clave, parche.look[clave]);
      }
      if (parche.look.gorro !== undefined) {
        if (typeof parche.look.gorro !== 'string' || !gorroIds.has(parche.look.gorro)) {
          throw new Error(`Gorro desconocido: ${String(parche.look.gorro)}`);
        }
        look.gorro = parche.look.gorro;
      }
      if (parche.look.peinado !== undefined) {
        if (typeof parche.look.peinado !== 'string' || !peinadoIds.has(parche.look.peinado)) {
          throw new Error(`Peinado desconocido: ${String(parche.look.peinado)}`);
        }
        look.peinado = parche.look.peinado;
      }
      if (parche.look.accesorios !== undefined) {
        const lista = parche.look.accesorios;
        if (!Array.isArray(lista)) throw new Error('Los accesorios deben ser una lista');
        const vistos = new Set();
        const ranuras = new Set();
        for (const id of lista) {
          if (typeof id !== 'string' || !accesorioIds.has(id)) throw new Error(`Accesorio desconocido: ${String(id)}`);
          if (vistos.has(id)) throw new Error(`Accesorio repetido: ${id}`);
          const ranura = accesorioRanura.get(id);
          if (ranuras.has(ranura)) throw new Error(`Ya hay un accesorio en la ranura ${ranura}`);
          vistos.add(id);
          ranuras.add(ranura);
        }
        look.accesorios = [...lista];
      }
      salida.look = look;
    }
    return salida;
  }

  function lookVacio() {
    return { camisa: null, piel: null, pelo: null, pantalon: null, gorro: 'auto', gorroColor: null, peinado: 'auto', accesorios: [] };
  }

  function sanearPerfil(perfil) {
    const base = perfil && typeof perfil === 'object' ? perfil : {};
    const look = { ...lookVacio(), ...(base.look && typeof base.look === 'object' ? base.look : {}) };
    if (!peinadoIds.has(look.peinado)) look.peinado = 'auto';
    look.accesorios = dedupeAccesorios(Array.isArray(look.accesorios) ? look.accesorios : []);
    return {
      alias: typeof base.alias === 'string' ? base.alias : '',
      look,
      actualizado: Number.isFinite(base.actualizado) ? base.actualizado : 0,
    };
  }

  function sanearDatos(parsed) {
    const salida = { version: PERFIL_VERSION, perfiles: {} };
    if (!parsed || typeof parsed !== 'object' || !parsed.perfiles || typeof parsed.perfiles !== 'object') return salida;
    for (const [clave, perfil] of Object.entries(parsed.perfiles)) {
      salida.perfiles[clave] = sanearPerfil(perfil);
    }
    return salida;
  }

  function escribirStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  let migrado = false;

  // Migra casa.perfiles.v1 -> v2 y deja copia del original.
  function migrarStorage() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY_V1);
    } catch {
      return false;
    }
    if (!raw) return false;
    try { localStorage.setItem(STORAGE_BACKUP, raw); } catch { /* sin copia, seguimos */ }
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
    const data = sanearDatos(parsed);
    if (escribirStorage(data)) migrado = true;
    return migrado;
  }

  function leerStorage() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return { version: PERFIL_VERSION, perfiles: {} };
    }
    if (!raw) {
      migrarStorage();
      try { raw = localStorage.getItem(STORAGE_KEY); } catch { raw = null; }
      if (!raw) return { version: PERFIL_VERSION, perfiles: {} };
    }
    try {
      const parsed = JSON.parse(raw);
      const data = sanearDatos(parsed);
      // Reescribe si faltaba migrar peinado/ranuras en un archivo v2 antiguo.
      if (JSON.stringify(parsed) !== JSON.stringify(data) && !migrado) escribirStorage(data);
      return data;
    } catch {
      return { version: PERFIL_VERSION, perfiles: {} };
    }
  }

  function leerLocal(agente) {
    const data = leerStorage();
    const perfil = data.perfiles['demo-' + agente.id];
    return {
      alias: perfil && typeof perfil.alias === 'string' ? perfil.alias : '',
      look: perfil && perfil.look ? perfil.look : null,
    };
  }

  let avisoTimer = null;
  function aviso(texto) {
    let el = document.getElementById('casaAviso');
    if (!el) {
      el = document.createElement('div');
      el.id = 'casaAviso';
      el.className = 'casa-aviso';
      el.setAttribute('role', 'status');
      document.body.append(el);
    }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { el.hidden = true; }, 3600);
  }

  async function guardar(agente, parche) {
    let limpio;
    try {
      limpio = validar(parche);
    } catch (error) {
      aviso(error.message);
      return null;
    }
    if (!agente) return null;

    if (esVivo()) {
      const clave = String(agente.profileKey || '');
      if (!KEY_RE.test(clave)) {
        aviso('El agente no tiene una clave de perfil válida.');
        return null;
      }
      try {
        const response = await fetch('/api/perfiles/' + encodeURIComponent(clave), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(limpio),
        });
        if (!response.ok) {
          let detalle = 'No se pudo guardar el look.';
          try {
            const body = await response.json();
            if (body && body.error) detalle = body.error;
          } catch { /* respuesta sin JSON */ }
          aviso(detalle);
          return null;
        }
        return await response.json();
      } catch {
        aviso('No se pudo guardar el look. Se mantiene solo en esta pestaña.');
        return null;
      }
    }

    const data = leerStorage();
    const clave = 'demo-' + agente.id;
    const previo = data.perfiles[clave] || {};
    const perfil = sanearPerfil({
      alias: limpio.alias !== undefined ? limpio.alias : (previo.alias || ''),
      look: {
        ...lookVacio(),
        ...(previo.look || {}),
        ...(limpio.look || {}),
      },
      actualizado: Date.now(),
    });
    data.version = PERFIL_VERSION;
    data.perfiles[clave] = perfil;
    if (!escribirStorage(data)) {
      aviso('No se pudo guardar en este navegador. El look se mantiene solo en esta pestaña.');
      return null;
    }
    return perfil;
  }

  window.casaPerfiles = { guardar, leerLocal, validar, esVivo, esDemo };
  window.casaRecargarLooks?.();
})();
