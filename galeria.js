// Galeria de pruebas de personalizacion. Solo se activa con ?galeria=1.
(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('galeria') !== '1') return;
  document.body.classList.add('galeria-mode');

  const CAT = globalThis.CATALOGO;
  if (!CAT) return;

  let seed = parseInt(params.get('semilla') || '20261025', 10) || 20261025;
  function rng() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function lookVacio() {
    return { camisa: null, piel: null, pelo: null, pantalon: null, gorro: 'auto', gorroColor: null, peinado: 'auto', accesorios: [] };
  }

  function agenteBase(look) {
    return {
      id: 'galeria', name: 'base', gestor: 'OpenCode', model: 'base',
      col: '#3b78d4', hat: '#3b78d4', hatStyle: 0,
      state: 'listo', path: [], at: true, dir: 'down',
      look: look ? JSON.parse(JSON.stringify(look)) : lookVacio(),
    };
  }

  function seccion(titulo) {
    const s = document.createElement('section');
    s.className = 'gseccion';
    const h = document.createElement('h2');
    h.textContent = titulo;
    s.append(h);
    return s;
  }

  function tarjeta(container, nombre, look) {
    const card = document.createElement('div');
    card.className = 'gtarjeta';
    const marco = document.createElement('div');
    marco.className = 'gmarco';
    const dirs = ['down', 'left', 'up', 'right'];
    for (const walking of [false, true]) {
      for (const dir of dirs) {
        const cv = document.createElement('canvas');
        cv.width = 120; cv.height = 156;
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.scale(6, 6);
        const a = agenteBase(look);
        a.dir = dir;
        if (walking) a.path = [[0, 0]];
        drawAgent(a, 2, 8, walking ? 0.13 : 0, ctx);
        marco.append(cv);
      }
    }
    card.append(marco);
    const nm = document.createElement('div');
    nm.className = 'gnombre';
    nm.textContent = nombre;
    card.append(nm);
    // version a escala real (1x)
    const strip = document.createElement('div');
    strip.className = 'g1x';
    const mini = document.createElement('canvas');
    mini.width = 20; mini.height = 26;
    const mctx = mini.getContext('2d');
    mctx.imageSmoothingEnabled = false;
    const a1 = agenteBase(look);
    a1.dir = 'down';
    drawAgent(a1, 2, 8, 0, mctx);
    strip.append(mini);
    const etiqueta = document.createElement('span');
    etiqueta.style.fontSize = '11px';
    etiqueta.style.alignSelf = 'center';
    etiqueta.textContent = '1x';
    strip.append(etiqueta);
    card.append(strip);
    container.append(card);
  }

  const root = document.createElement('div');
  root.id = 'galeria';
  const titulo = document.createElement('h1');
  titulo.textContent = 'Galería de personalización (6x)';
  root.append(titulo);

  // Accesorios
  const secAcc = seccion('Accesorios');
  const gridAcc = document.createElement('div');
  gridAcc.className = 'ggrid';
  for (const item of CAT.accesorios) {
    const look = lookVacio();
    look.accesorios = [item.id];
    tarjeta(gridAcc, item.nombre, look);
  }
  secAcc.append(gridAcc);
  root.append(secAcc);

  // Gorros
  const secGorro = seccion('Gorros');
  const gridGorro = document.createElement('div');
  gridGorro.className = 'ggrid';
  for (const item of CAT.gorros) {
    const look = lookVacio();
    look.gorro = item.id;
    tarjeta(gridGorro, item.nombre, look);
  }
  secGorro.append(gridGorro);
  root.append(secGorro);

  // Peinados
  const secPeinado = seccion('Peinados');
  const gridPeinado = document.createElement('div');
  gridPeinado.className = 'ggrid';
  for (const item of CAT.peinados) {
    const look = lookVacio();
    look.peinado = item.id;
    look.pelo = '#3b78d4';
    tarjeta(gridPeinado, item.nombre, look);
  }
  secPeinado.append(gridPeinado);
  root.append(secPeinado);

  // Combinaciones aleatorias
  const secRand = seccion('Combinaciones aleatorias');
  const rowRand = document.createElement('div');
  rowRand.className = 'galeatorio';
  for (let i = 0; i < 8; i++) {
    const look = lookVacio();
    const keys = ['camisa', 'piel', 'pelo', 'pantalon'];
    for (const k of keys) {
      if (rng() < 0.7) {
        const pal = CAT.colores[k];
        look[k] = pal[Math.floor(rng() * pal.length)];
      }
    }
    look.gorro = CAT.gorros[Math.floor(rng() * CAT.gorros.length)].id;
    if (rng() < 0.6) look.gorroColor = CAT.colores.gorroColor[Math.floor(rng() * CAT.colores.gorroColor.length)];
    look.peinado = CAT.peinados[Math.floor(rng() * CAT.peinados.length)].id;
    if (look.pelo === null && look.peinado !== 'calvo' && rng() < 0.5) {
      const pal = CAT.colores.pelo;
      look.pelo = pal[Math.floor(rng() * pal.length)];
    }
    look.accesorios = [];
    const elegidos = {};
    for (const r of CAT.ranuras) {
      if (rng() < 0.5) {
        const cands = CAT.accesorios.filter((a) => a.ranura === r.id);
        if (cands.length) elegidos[r.id] = cands[Math.floor(rng() * cands.length)].id;
      }
    }
    look.accesorios = Object.values(elegidos);
    tarjeta(rowRand, 'Aleatorio ' + (i + 1), look);
  }
  secRand.append(rowRand);
  root.append(secRand);

  document.body.append(root);
})();