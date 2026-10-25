// vida.js — vida propia de la casa: gato, caricias, ocio/sueño, agua, ambiente.
// Script clásico, cargado después de app.js. Sin las funciones activas, app.js funciona igual.
(() => {
  const H = window.__vidaHooks;
  if (!H) return;
  const { findPath, assign, freeSpot, SPOTS, AGENTS, STATES, FACING, roomAt, blocked, COLS, ROWS, T, roomCapacity } = H;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rectVida = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const MARIPOSA_COLOR = ['#f2b84a', '#e86a8a', '#8ac2ff'];
  const TV_COLORS = ['#6ee08a', '#8ac2ff', '#f0c060', '#e86a8a'];
  const VAPOR_COLOR = ['rgba(186,203,204,.9)', 'rgba(220,229,225,.82)', 'rgba(255,250,240,.74)'];
  const OCIO_SPOTS = {
    arcade: [[2, 31], [3, 31]],
    consola: [[9, 31], [10, 31]],
    pingpong: [[10, 32], [14, 32], [10, 33], [14, 33]],
    pelota: [[6, 32], [8, 32], [7, 33], [7, 31]],
  };

  // ---------- parámetros ----------
  const params = new URLSearchParams(location.search);
  const modoDemo = (location.protocol === 'file:' || params.has('demo'));
  const ocioParam = params.get('ocio');
  const OCIO_SEGUNDOS = ocioParam ? parseFloat(ocioParam) : (modoDemo ? 25 : 600);

  function faseIdle(a) {
    if (a.state !== 'idle') return null;
    const secs = (performance.now() - (a.since || 0)) / 1000;
    return secs < OCIO_SEGUNDOS ? 'ocio' : 'sueno';
  }

  // ---------- gato ----------
  const ALLOWED_CAT_ROOMS = ['sala', 'estudio', 'recibidor', 'cocina', 'jardin', 'juegos', 'terraza', 'dormitorio'];
  const cat = {
    x: 4, y: 5, dir: 'down', state: 'dormir',
    path: [], timer: 0, next: 0, lastPet: 0, pettingBy: null,
    speed: 2.2,
  };
  const stageEl = document.getElementById('stage');
  const catBub = document.createElement('div');
  catBub.className = 'bubble';
  catBub.hidden = true;
  if (stageEl) stageEl.append(catBub);

  const CAT_STATES = ['dormir', 'estirarse', 'sentarse', 'lavarse', 'caminar', 'mirar_ventana', 'jugar_pelota', 'ronronear', 'huir'];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pickState() {
    const r = Math.random();
    if (r < 0.35) return 'dormir';
    if (r < 0.55) return Math.random() < 0.5 ? 'sentarse' : 'lavarse';
    if (r < 0.80) return 'caminar';
    const rest = ['estirarse', 'mirar_ventana', 'jugar_pelota', 'ronronear'];
    return rest[Math.floor(Math.random() * rest.length)];
  }

  function catWalkable(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
    if (blocked[r][c]) return false;
    const room = roomAt(c, r);
    if (!room) return false;
    if (!ALLOWED_CAT_ROOMS.includes(room.id)) return false;
    // no pararse en casilla objetivo de un agente
    for (const a of AGENTS) {
      if (a.spot && a.spot[0] === c && a.spot[1] === r) return false;
    }
    return true;
  }

  function chooseCatTarget() {
    const cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (catWalkable(c, r)) cells.push([c, r]);
    }
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  let catBubble = null;
  let catBubbleUntil = 0;
  function catSay(text) {
    catBubble = text;
    catBubbleUntil = performance.now() / 1000 + 2;
  }

  function updateCat(dt, t) {
    if (reduceMotion) { cat.state = 'dormir'; cat.path = []; return; }
    if (document.hidden) return;
    // timer de estado
    if (t > cat.next) {
      // si huir terminó (path vacío) vuelve a elegir
      if (cat.state === 'huir' && cat.path.length === 0) {
        cat.state = pickState();
        cat.timer = rnd(6, 25);
        cat.next = t + cat.timer;
        if (cat.state === 'caminar') {
          const tgt = chooseCatTarget();
          if (tgt) {
            const p = findPath([Math.round(cat.x), Math.round(cat.y)], tgt);
            if (p) cat.path = p;
            else cat.state = 'dormir';
          } else cat.state = 'dormir';
        }
        if (cat.state === 'dormir' && Math.random() < 0.3) catSay('miau');
      } else if (cat.state !== 'huir') {
        cat.state = pickState();
        cat.timer = rnd(6, 25);
        cat.next = t + cat.timer;
        if (cat.state === 'caminar') {
          const tgt = chooseCatTarget();
          if (tgt) {
            const p = findPath([Math.round(cat.x), Math.round(cat.y)], tgt);
            if (p) cat.path = p;
            else { cat.state = 'dormir'; }
          } else cat.state = 'dormir';
        }
        if (cat.state === 'ronronear') catSay('prr');
      }
    }
    // movimiento
    if (cat.path.length) {
      const [tx, ty] = cat.path[0];
      const dx = tx - cat.x, dy = ty - cat.y, dist = Math.hypot(dx, dy), step = cat.speed * dt;
      if (Math.abs(dx) > Math.abs(dy)) cat.dir = dx > 0 ? 'right' : 'left';
      else if (dist > 0) cat.dir = dy > 0 ? 'down' : 'up';
      if (dist <= step) {
        cat.x = tx; cat.y = ty; cat.path.shift();
        if (!cat.path.length) {
          if (cat.state === 'caminar') { cat.state = pickState(); cat.next = t + rnd(6, 25); }
        }
      } else { cat.x += dx / dist * step; cat.y += dy / dist * step; }
    }
    // huir si un agente llega encima
    for (const a of AGENTS) {
      if (a.at && a.path && a.path.length === 0) {
        if (Math.round(a.x) === Math.round(cat.x) && Math.round(a.y) === Math.round(cat.y)) {
          if (cat.state !== 'huir') {
            cat.state = 'huir';
            // mover 1-2 casillas
            const opts = [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]];
            let moved = false;
            for (let i = 0; i < opts.length; i++) {
              const o = opts[Math.floor(Math.random()*opts.length)];
              const nc = Math.round(cat.x)+o[0], nr = Math.round(cat.y)+o[1];
              if (catWalkable(nc, nr)) {
                const p = findPath([Math.round(cat.x), Math.round(cat.y)], [nc, nr]);
                if (p) { cat.path = p; moved = true; break; }
              }
            }
            cat.next = t + rnd(1, 2);
            if (!moved) { cat.state = 'dormir'; cat.next = t + rnd(6, 25); }
          }
        }
      }
    }
    // bubble expiry
    if (catBubble && t > catBubbleUntil) catBubble = null;
  }

  // ---------- caricias ----------
  let lastPetGlobal = {}; // agent id -> time
  let pettingAgent = null;
  let pettingUntil = 0;
  let heartsEmitter = (window.efectos && window.efectos.emitir) ? window.efectos.emitir : null;

  const PET_COOLDOWN = 90;
  const PET_STATES_OK = ['idle', 'listo', 'leer', 'docs', 'codigo', 'comandos', 'web', 'tests', 'deploy', 'delegando'];

  function tryPet(a, t) {
    if (pettingAgent && t < pettingUntil) return;
    if (cat.state === 'huir') return;
    if (!PET_STATES_OK.includes(a.state) && a.state !== 'idle') return;
    if (a.state === 'error' || a.state === 'espera') return;
    if (a.pausa) return;
    const last = lastPetGlobal[a.id] || 0;
    if (t - last < PET_COOLDOWN) return;
    const dx = Math.round(a.x) - Math.round(cat.x);
    const dy = Math.round(a.y) - Math.round(cat.y);
    if (Math.abs(dx) + Math.abs(dy) > 1) return;
    if (Math.random() > 0.6) return;
    // iniciar caricia
    a.pausa = { hasta: t + rnd(3, 4), tipo: 'caricia' };
    a.dir = dx > 0 ? 'left' : dx < 0 ? 'right' : (dy > 0 ? 'up' : 'down');
    if (dx === 0 && dy === 0) a.dir = 'down';
    cat.state = 'ronronear';
    cat.next = t + rnd(3, 4);
    pettingAgent = a.id;
    pettingUntil = t + 4;
    lastPetGlobal[a.id] = t;
    if (window.efectos && window.efectos.emitir) window.efectos.emitir('corazon', Math.round(cat.x) * T + 8, Math.round(cat.y) * T + 4);
    catSay('prr');
  }

  // ---------- ocio ----------
  const OCIO_ACTIVITIES = ['arcade', 'consola', 'pingpong', 'pelota'];
  function freeActivityTarget(a, activity) {
    const reserved = new Set(AGENTS.filter(o => o !== a && o.spot).map(o => o.spot.join(',')));
    const from = [Math.round(a.x), Math.round(a.y)];
    if (activity === 'pingpong') {
      const partner = AGENTS.find(o => o !== a && o.ocio?.actividad === 'pingpong' && o.spot);
      const partnerSpot = partner && OCIO_SPOTS.pingpong.find(
        spot => spot[0] === partner.spot[0] && spot[1] === partner.spot[1],
      );
      if (partnerSpot) {
        const opposite = [partnerSpot[0] < 11 ? 14 : 10, partnerSpot[1]];
        if (!reserved.has(opposite.join(','))) {
          const path = findPath(from, opposite);
          if (path !== null) return { spot: opposite, path };
        }
      }
    }
    let bestSpot = null, bestPath = null;
    for (const spot of OCIO_SPOTS[activity] || []) {
      if (reserved.has(spot.join(','))) continue;
      const path = findPath(from, spot);
      if (path === null) continue;
      if (bestPath === null || path.length < bestPath.length) {
        bestSpot = spot;
        bestPath = path;
      }
    }
    return bestSpot ? { spot: bestSpot, path: bestPath } : null;
  }

  function ocioActivityFor(a) {
    const available = [];
    const preferred = [];
    for (const o of AGENTS) {
      if (o === a || !o.ocio) continue;
      preferred.push(o.ocio.actividad);
    }
    for (const activity of OCIO_ACTIVITIES) {
      if (!freeActivityTarget(a, activity)) continue;
      if (!preferred.includes(activity)) available.push(activity);
    }
    const pingpongConPareja = preferred.includes('pingpong') && !available.includes('pingpong')
      && Boolean(freeActivityTarget(a, 'pingpong'));
    if (available.length && pingpongConPareja && Math.random() < 0.25) return 'pingpong';
    if (!available.length) {
      for (const activity of OCIO_ACTIVITIES) {
        if (freeActivityTarget(a, activity)) available.push(activity);
      }
    }
    return available.length ? available[Math.floor(Math.random() * available.length)] : null;
  }

  // pelota de ocio
  const pelota = { x: 10, y: 32, vx: 0, vy: 0, on: false };

  function facingOcio(a) {
    if (!a.ocio) return FACING.idle || 'down';
    if (a.ocio.actividad === 'arcade' || a.ocio.actividad === 'consola') return 'up';
    if (a.ocio.actividad === 'pingpong') return a.spot && a.spot[0] < 11 ? 'right' : 'left';
    return 'down';
  }

  function ensureOcioSpot(a) {
    if (!a.ocio) return false;
    const target = freeActivityTarget(a, a.ocio.actividad);
    if (!target) return false;
    a.spot = target.spot;
    a.path = target.path;
    a.at = a.path.length === 0;
    if (a.at) a.dir = facingOcio(a);
    return true;
  }

  function startOcio(a, t) {
    const actividad = ocioActivityFor(a);
    if (!actividad) return false;
    a.ocio = { actividad, hasta: t + rnd(20, 60) };
    if (!ensureOcioSpot(a)) {
      a.ocio = null;
      return false;
    }
    return true;
  }

  function ensureSuenoSpot(a) {
    const Hk = window.__vidaHooks;
    if (a.spot && roomAt(a.spot[0], a.spot[1])?.id !== 'juegos') {
      // si ya está en una cama (idle spot) ok
    }
    // solo reasignar si está en juegos
    const inJuegos = a.spot && roomAt(a.spot[0], a.spot[1])?.id === 'juegos';
    if (!inJuegos) return;
    const spot = freeSpot(a, 'idle');
    if (!spot) return;
    const moving = a.path.length > 0;
    const start = moving ? a.path[0] : [Math.round(a.x), Math.round(a.y)];
    const p = findPath(start, spot);
    if (p) {
      a.spot = spot;
      a.path = moving ? [a.path[0], ...p] : p;
      a.at = a.path.length === 0;
      if (a.at) a.dir = FACING.idle || 'down';
    }
  }

  // ---------- agua ----------
  let aguaActive = null; // agent id
  let aguaTimer = rnd(45, 150);
  const aguaCooldown = { t: 0 };

  function startAgua(a, t) {
    if (aguaActive) return false;
    aguaActive = a.id;
    const bedSpot = a.spot ? [a.spot[0], a.spot[1]] : null;
    const waterSpot = (SPOTS.agua && SPOTS.agua[0]) || [13, 16];
    a.micro = { tipo: 'agua', fase: 'levantarse', bedSpot, waterSpot, start: t, levantarUntil: t + 1, stretch: Math.random() < 0.3 };
    return true;
  }

  // ---------- update principal ----------
  let frameCount = 0;
  let totalMs = 0;
  let lastMs = 0;

  function finishUpdate(start) {
    lastMs = performance.now() - start;
    totalMs += lastMs;
    frameCount++;
  }

  function update(dt, t) {
    const t0 = performance.now();
    if (document.hidden) { finishUpdate(t0); return; }
    if (reduceMotion) { cat.state = 'dormir'; finishUpdate(t0); return; }

    // cat
    updateCat(dt, t);

    // caricias: intentar por agentes
    pettingAgent = (pettingAgent && t < pettingUntil) ? pettingAgent : null;
    if (!pettingAgent) {
      for (const a of AGENTS) {
        if (a.state === 'error' || a.state === 'espera') continue;
        tryPet(a, t);
        if (pettingAgent) break;
      }
    }

    // ocio/sueno: reasignar spots y actividades
    for (const a of AGENTS) {
      if (a.state !== 'idle') {
        if (a.ocio) a.ocio = null;
        continue;
      }
      if (a.micro) continue;
      const f = faseIdle(a);
      if (a._faseIdle !== f) {
        a._faseIdle = f;
        if (f === 'ocio') {
          if (!a.ocio) startOcio(a, t);
        } else {
          a.ocio = null;
          ensureSuenoSpot(a);
        }
      }
      if (f === 'ocio') {
        if (!a.ocio) startOcio(a, t);
        if (a.ocio && t > a.ocio.hasta) {
          const actividad = ocioActivityFor(a);
          if (actividad) {
            a.ocio.actividad = actividad;
            ensureOcioSpot(a);
          }
          a.ocio.hasta = t + rnd(20, 60);
        }
        if (a.ocio && !a.path.length) a.dir = facingOcio(a);
      }
    }

    // pelota de ocio: si hay agentes en pelota, mover
    let jugandoPelota = false;
    for (const a of AGENTS) {
      if (a.ocio && a.ocio.actividad === 'pelota' && a.at) { jugandoPelota = true; break; }
    }
    if (jugandoPelota) {
      if (!pelota.on) { pelota.on = true; pelota.x = 8; pelota.y = 32; pelota.vx = 3; pelota.vy = 0; }
      pelota.x += pelota.vx * dt;
      pelota.y += pelota.vy * dt;
      if (pelota.x < 3 || pelota.x > 13) { pelota.vx *= -1; pelota.x = Math.max(3, Math.min(13, pelota.x)); }
      // gravedad simple
      pelota.vy += 8 * dt;
      if (pelota.y > 33) { pelota.y = 33; pelota.vy = -pelota.vy * 0.7; }
      // gato persigue si cerca
      const gdx = pelota.x - cat.x, gdy = pelota.y - cat.y;
      if (Math.hypot(gdx, gdy) < 6 && cat.state !== 'huir') {
        cat.state = 'caminar';
        const p = findPath([Math.round(cat.x), Math.round(cat.y)], [Math.round(pelota.x), Math.round(pelota.y)]);
        if (p) cat.path = p;
      }
    } else {
      pelota.on = false;
    }

    // agua: temporizador
    aguaTimer -= dt;
    if (aguaTimer <= 0 && !aguaActive) {
      aguaTimer = rnd(45, 150);
      // elegir un agente en sueno (idle sueno) al azar
      const candidates = AGENTS.filter(a => a.state === 'idle' && faseIdle(a) === 'sueno' && !a.micro && !a.pausa);
      if (candidates.length) {
        const a = candidates[Math.floor(Math.random() * candidates.length)];
        startAgua(a, t);
      }
    }
    // procesar micro agua
    if (aguaActive) {
      const a = AGENTS.find(o => o.id === aguaActive);
      if (!a || a.state !== 'idle') {
        if (a) { a.micro = null; }
        aguaActive = null;
      } else if (a.micro) {
        const m = a.micro;
        if (m.fase === 'levantarse') {
          if (t > m.levantarUntil) {
            m.fase = 'caminar_agua';
            const start = a.path.length ? a.path[0] : [Math.round(a.x), Math.round(a.y)];
            const p = findPath(start, m.waterSpot);
            if (p) { a.path = a.path.length ? [a.path[0], ...p] : p; a.at = false; }
            else { m.fase = 'beber'; m.beberUntil = t + 3; }
          }
        } else if (m.fase === 'caminar_agua') {
          if (!a.path.length) {
            // llegó al agua
            m.fase = 'beber';
            m.beberUntil = t + 3;
            a.dir = 'up';
          }
        } else if (m.fase === 'beber') {
          if (t > m.beberUntil) {
            // volver a cama
            m.fase = 'volver';
            const p = findPath([Math.round(a.x), Math.round(a.y)], m.bedSpot);
            if (p) { a.path = p; a.at = false; }
            else { m.fase = 'acostarse'; }
          }
        } else if (m.fase === 'volver') {
          if (!a.path.length) {
            m.fase = 'acostarse';
          }
        } else if (m.fase === 'acostarse') {
          // a veces bostezo/estiramiento
          if (m.stretch) {
            m.fase = 'estirar';
            m.estirarUntil = t + 1.5;
          } else {
            a.micro = null;
            aguaActive = null;
          }
        } else if (m.fase === 'estirar') {
          if (t > m.estirarUntil) {
            a.micro = null;
            aguaActive = null;
          }
        }
      }
    }

    // extra: gato se acerca a agente en ocio/sueno cada 60-120s
    // (implementado de forma ligera: si cat en dormir y hay agente idle, a veces caminar hacia él)
    // omitido para mantener rendimiento.

    // limpiar caricia expirada
    if (pettingAgent && t > pettingUntil) {
      pettingAgent = null;
    }
    for (const a of AGENTS) {
      if (a.pausa && a.pausa.tipo === 'caricia' && t > a.pausa.hasta) {
        a.pausa = null;
      }
    }

    // agentes en caricia: girar hacia gato (ya hecho) y no mover (pausa lo gestiona update de app)

    finishUpdate(t0);
  }

  // ---------- dibujo gato ----------
  function drawCat(g, px, py, t) {
    if (reduceMotion) {
      drawCatSprite(g, px, py, 'dormir', 0, t);
      if (catBub) catBub.hidden = true;
      return;
    }
    drawCatSprite(g, px, py, cat.state, cat.path.length > 0 ? (Math.floor(t * 8) % 2) : 0, t);
    const s = stageEl.clientWidth / (COLS * T);
    const show = catBubble && t < catBubbleUntil;
    if (catBub) {
      catBub.hidden = !show;
      if (show) {
        catBub.textContent = catBubble;
        catBub.style.transform = `translate(${(px + 8) * s}px, ${(py - 9) * s}px) translate(-50%, -100%)`;
        catBub.style.borderColor = '#2b2420';
        catBub.style.background = '#fffaf0';
      }
    }
  }

  function drawCatSprite(g, px, py, state, frame, t) {
    const INK = '#2b2420';
    const body = '#e6a35f', dark = '#c9823f', light = '#f0c08a';
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    // sombra
    R(px + 3, py + 14, 10, 2, 'rgba(0,0,0,.25)');
    const breathing = (state === 'dormir' || state === 'ronronear') ? (Math.floor(t * 1.1) % 2) : 0;
    const by = breathing ? 1 : 0;
    if (state === 'dormir') {
      // cuerpo acostado
      R(px + 1, py + 7 + by, 14, 7 - by, INK);
      R(px + 2, py + 8 + by, 12, 5 - by, body);
      R(px + 6, py + 8 + by, 2, 5 - by, dark);
      R(px + 10, py + 8 + by, 2, 5 - by, dark);
      // cabeza
      R(px + 1, py + 5 + by, 7, 6, INK);
      R(px + 2, py + 6 + by, 5, 4, body);
      // orejas bajas
      R(px + 1, py + 4 + by, 2, 2, INK);
      R(px + 6, py + 4 + by, 2, 2, INK);
      // ojos cerrados
      R(px + 3, py + 8 + by, 1, 1, INK);
      R(px + 5, py + 8 + by, 1, 1, INK);
      // cola
      const tl = Math.floor(t * 1.4) % 2;
      R(px + 13, py + (tl ? 10 : 12), 3, 2, INK);
      R(px + 14, py + (tl ? 10 : 12), 1, 1, body);
    } else if (state === 'ronronear') {
      R(px + 1, py + 7, 14, 8, INK);
      R(px + 2, py + 8, 12, 6, body);
      R(px + 6, py + 8, 2, 6, dark);
      R(px + 10, py + 8, 2, 6, dark);
      R(px + 1, py + 5, 7, 6, INK);
      R(px + 2, py + 6, 5, 4, body);
      R(px + 1, py + 3, 2, 3, INK);
      R(px + 6, py + 3, 2, 3, INK);
      // ojos cerrados
      R(px + 3, py + 7, 2, 1, INK);
      R(px + 5, py + 7, 2, 1, INK);
      // cola moviendo
      const tl = Math.floor(t * 2) % 2;
      R(px + 13, py + (tl ? 9 : 11), 3, 2, INK);
      R(px + 14, py + (tl ? 9 : 11), 1, 1, body);
    } else if (state === 'sentarse') {
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9, 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 3, py + 1, 2, 3, INK);
      R(px + 8, py + 1, 2, 3, INK);
      R(px + 4, py + 5, 1, 1, INK);
      R(px + 6, py + 5, 1, 1, INK);
      const tl = Math.floor(t * 1.6) % 2;
      R(px + 12, py + (tl ? 10 : 13), 3, 2, INK);
      R(px + 13, py + (tl ? 10 : 13), 1, 1, body);
    } else if (state === 'lavarse') {
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9, 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 3, py + 1, 2, 3, INK);
      R(px + 8, py + 1, 2, 3, INK);
      // pata en la cara
      R(px + 4, py + 4, 2, 2, body);
      R(px + 5, py + 3, 1, 1, INK);
    } else if (state === 'estirarse') {
      R(px + 1, py + 10, 14, 5, INK);
      R(px + 2, py + 11, 12, 3, body);
      R(px + 4, py + 11, 2, 3, dark);
      R(px + 8, py + 11, 2, 3, dark);
      R(px + 1, py + 7, 6, 5, INK);
      R(px + 2, py + 8, 4, 3, body);
      R(px + 1, py + 5, 2, 3, INK);
      R(px + 5, py + 5, 2, 3, INK);
      R(px + 3, py + 9, 1, 1, INK);
      R(px + 4, py + 9, 1, 1, INK);
    } else if (state === 'mirar_ventana') {
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9, 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 3, py + 1, 2, 3, INK);
      R(px + 8, py + 1, 2, 3, INK);
      // ojos mirando (hacia la derecha)
      R(px + 7, py + 5, 1, 1, INK);
      R(px + 8, py + 5, 1, 1, INK);
    } else if (state === 'jugar_pelota') {
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9, 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 3, py + 1, 2, 3, INK);
      R(px + 8, py + 1, 2, 3, INK);
      R(px + 4, py + 5, 1, 1, INK);
      R(px + 6, py + 5, 1, 1, INK);
    } else if (state === 'huir') {
      // corriendo
      const f = frame % 2;
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9 + (f ? 1 : 0), 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 2, py + 1, 2, 3, INK);
      R(px + 7, py + 1, 2, 3, INK);
      R(px + 4, py + 5, 1, 1, INK);
      R(px + 6, py + 5, 1, 1, INK);
      // orejas hacia atrás
    } else {
      // caminar (default)
      const f = frame % 2;
      R(px + 3, py + 8, 10, 8, INK);
      R(px + 4, py + 9 + (f ? 1 : 0), 8, 6, body);
      R(px + 6, py + 9, 2, 6, dark);
      R(px + 9, py + 9, 2, 6, dark);
      R(px + 3, py + 3, 7, 6, INK);
      R(px + 4, py + 4, 5, 4, body);
      R(px + 3, py + 1, 2, 3, INK);
      R(px + 8, py + 1, 2, 3, INK);
      R(px + 4, py + 5, 1, 1, INK);
      R(px + 6, py + 5, 1, 1, INK);
    }
  }

  // ---------- dibujo ocio ----------
  function drawOcio(a, px, py, t, g) {
    const INK = '#2b2420';
    const piel = (a.look && a.look.piel) || '#f6dcc2';
    const act = a.ocio ? a.ocio.actividad : 'arcade';
    const de_pie = Object.create(a);
    de_pie.state = 'listo';
    de_pie.path = [];
    drawAgent(de_pie, px, py, t, g);
    if (act === 'arcade') {
      const lift = Math.floor(t * 5) % 2;
      rectVida(g, px + 1, py + 10 - lift, 2, 2, piel);
      rectVida(g, px + 13, py + 10 - (1 - lift), 2, 2, piel);
    } else if (act === 'consola') {
      rectVida(g, px + 5, py + 11, 6, 3, INK);
      rectVida(g, px + 6, py + 12, 4, 1, '#c8c8c0');
      rectVida(g, px + 8, py + 11, 1, 1, Math.floor(t * 4) % 2 ? '#f2d45a' : '#e86a8a');
    } else if (act === 'pingpong') {
      const paddleX = a.dir === 'left' ? px - 1 : px + 14;
      rectVida(g, paddleX, py + 8, 3, 4, INK);
      rectVida(g, paddleX + 1, py + 9, 1, 2, '#e86a8a');
    }
  }

  // ---------- dibujo micro agua ----------
  function drawMicro(a, px, py, t, g) {
    const INK = '#2b2420';
    const camisa = (a.look && a.look.camisa) || a.col;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const m = a.micro;
    if (!m) return;
    if (m.fase === 'levantarse') {
      // incorporado, ojos medio cerrados, sin gorro
      R(px + 3, py + 16, 10, 2, 'rgba(0,0,0,.28)');
      R(px + 5, py + 14, 2, 2, '#3a4058'); R(px + 9, py + 14, 2, 2, '#3a4058');
      R(px + 3, py + 11, 10, 4, INK); R(px + 4, py + 11, 8, 3, camisa);
      R(px, py + 12, 1, 4, INK); R(px + 15, py + 12, 1, 4, INK);
      R(px + 1, py + 12, 2, 3, camisa); R(px + 13, py + 12, 2, 3, camisa);
      R(px + 3, py + 4, 10, 7, INK); R(px + 4, py + 5, 8, 5, '#f6dcc2');
      // ojos medio cerrados
      R(px + 4, py + 7, 2, 1, INK); R(px + 8, py + 7, 2, 1, INK);
      return;
    }
    if (m.fase === 'beber') {
      // de pie con vaso
      R(px + 3, py + 16, 10, 2, 'rgba(0,0,0,.28)');
      R(px + 5, py + 14, 2, 2, '#3a4058'); R(px + 9, py + 14, 2, 2, '#3a4058');
      R(px + 3, py + 11, 10, 4, INK); R(px + 4, py + 11, 8, 3, camisa);
      R(px, py + 12, 1, 4, INK); R(px + 15, py + 12, 1, 4, INK);
      R(px + 1, py + 12, 2, 3, camisa); R(px + 13, py + 12, 2, 3, camisa);
      R(px + 3, py + 4, 10, 7, INK); R(px + 4, py + 4, 8, 6, '#f6dcc2');
      R(px + 4, py + 5, 2, 2, INK); R(px + 8, py + 5, 2, 2, INK);
      R(px + 7, py + 8, 2, 1, INK);
      // vaso en mano
      R(px + 13, py + 9, 3, 5, INK); R(px + 14, py + 10, 1, 3, '#dff1ff');
      return;
    }
    // caminar/volver/estirar: pose normal de pie
    R(px + 3, py + 16, 10, 2, 'rgba(0,0,0,.28)');
    R(px + 5, py + 14, 2, 2, '#3a4058'); R(px + 9, py + 14, 2, 2, '#3a4058');
    R(px + 3, py + 11, 10, 4, INK); R(px + 4, py + 11, 8, 3, camisa);
    R(px, py + 12, 1, 4, INK); R(px + 15, py + 12, 1, 4, INK);
    R(px + 1, py + 12, 2, 3, camisa); R(px + 13, py + 12, 2, 3, camisa);
    R(px + 3, py + 4, 10, 7, INK); R(px + 4, py + 4, 8, 6, '#f6dcc2');
    R(px + 4, py + 5, 2, 2, INK); R(px + 8, py + 5, 2, 2, INK);
    R(px + 7, py + 8, 2, 1, INK);
  }

  // ---------- dibujo caricia ----------
  function drawCaricia(a, px, py, t, g) {
    const INK = '#2b2420';
    const camisa = (a.look && a.look.camisa) || a.col;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const frame = Math.floor(t * 2) % 2;
    R(px + 3, py + 16, 10, 2, 'rgba(0,0,0,.28)');
    R(px + 5, py + 14, 2, 2, '#3a4058'); R(px + 9, py + 14, 2, 2, '#3a4058');
    R(px + 3, py + 11, 10, 4, INK); R(px + 4, py + 11, 8, 3, camisa);
    R(px, py + 12, 1, 4, INK); R(px + 15, py + 12, 1, 4, INK);
    R(px + 1, py + 12, 2, 3, camisa); R(px + 13, py + 12, 2, 3, camisa);
    R(px + 3, py + 4, 10, 7, INK); R(px + 4, py + 4, 8, 6, '#f6dcc2');
    R(px + 4, py + 5, 2, 2, INK); R(px + 8, py + 5, 2, 2, INK);
    R(px + 7, py + 8, 2, 1, INK);
    // brazo derecho sube y baja
    const ay = frame ? 6 : 10;
    R(px + 13, py + ay, 2, 4, INK); R(px + 13, py + ay, 2, 3, camisa);
    R(px + 13, py + ay + (frame ? 0 : 3), 2, 1, '#f6dcc2');
  }

  // ---------- draw ambient ----------
  const horaParam = params.get('hora');
  const horaForzada = horaParam !== null && Number.isFinite(Number(horaParam)) ? Number(horaParam) : null;
  let esDia = horaForzada === null
    ? (new Date().getHours() >= 6 && new Date().getHours() < 20)
    : (horaForzada >= 6 && horaForzada < 20);
  let siguienteChequeoHora = 0;
  function esDeDia(t) {
    if (horaForzada !== null) return esDia;
    if (t >= siguienteChequeoHora) {
      const hora = new Date().getHours();
      esDia = hora >= 6 && hora < 20;
      siguienteChequeoHora = t + 30;
    }
    return esDia;
  }

  function drawAmbient(g, t) {
    if (document.hidden) return;
    const INK = '#2b2420';
    // Ventilador de pie en la esquina inferior izquierda del dormitorio.
    const fx = 17 * T + 8, fy = 11 * T + 8;
    rectVida(g, fx - 1, fy + 5, 2, 12, '#777d83');
    rectVida(g, fx - 7, fy + 16, 14, 3, INK);
    rectVida(g, fx - 5, fy + 17, 10, 1, '#9aa3a8');
    rectVida(g, fx - 6, fy - 6, 12, 12, INK);
    const ang = (t * 4) % (Math.PI * 2);
    g.save();
    g.translate(fx, fy);
    g.rotate(reduceMotion ? 0 : ang);
    rectVida(g, -1, -5, 2, 4, '#c8c8c0');
    g.rotate(Math.PI * 2 / 3);
    rectVida(g, -1, -5, 2, 4, '#c8c8c0');
    g.rotate(Math.PI * 2 / 3);
    rectVida(g, -1, -5, 2, 4, '#c8c8c0');
    g.restore();
    rectVida(g, fx - 2, fy - 2, 4, 4, '#d9dee3');
    if (reduceMotion) return;

    // Pantalla del televisor: barras de color que se desplazan.
    const tvx = 9 * T + 2, tvy = 29 * T + 3, shift = Math.floor(t * 4) % 8;
    rectVida(g, tvx, tvy, 2 * T - 4, 6, '#14212b');
    for (let k = 0; k < 4; k++) {
      const bx = tvx + 1 + ((k * 7 + shift) % 25);
      rectVida(g, bx, tvy + 1, 2, 4, TV_COLORS[k]);
    }

    // Luz de la pantalla arcade y reflejo corto en el suelo.
    const brillo = Math.floor(t * 4) % 2;
    rectVida(g, 2 * T + 4, 30 * T + 3, 24, 10, brillo ? '#6ee08a' : '#8ac2ff');
    rectVida(g, 2 * T + 8, 30 * T + 6, 6, 2, '#f2d45a');
    rectVida(g, 2 * T + 15, 32 * T + 2, 10, 1, brillo ? 'rgba(110,224,138,.55)' : 'rgba(138,194,255,.55)');

    let cocinando = false;
    for (const a of AGENTS) {
      if (a.state === 'tests') { cocinando = true; break; }
    }
    rectVida(g, 13 * T + 22, 15 * T + 3, 2, 1, cocinando ? '#ff6a3a' : '#444');
    if (cocinando) {
      for (let k = 0; k < 3; k++) {
        const edad = (t * 4 + k * 5) % 16;
        const sx = 13 * T + 2 + k * 2 + Math.round(Math.sin(t * 2 + k) * 1);
        const sy = 15 * T + 5 - Math.floor(edad);
        rectVida(g, sx, sy, 3, 3, VAPOR_COLOR[k]);
        rectVida(g, sx + 1, sy - 1, 1, 1, VAPOR_COLOR[k]);
      }
    }

    if (esDeDia(t)) {
      for (let i = 0; i < 3; i++) {
        const bx = 10 * T + 14 + Math.sin(t * 0.7 + i * 2.5) * 12 + i * 5;
        const by = 23 * T + 10 + Math.cos(t * 0.9 + i * 1.8) * 8 - i * 3;
        const wing = Math.floor(t * 8 + i) % 2;
        const x = Math.round(bx), y = Math.round(by);
        rectVida(g, x - 1, y - 2, 1, 2, INK); rectVida(g, x + 1, y - 2, 1, 2, INK);
        rectVida(g, x - 5, y - wing, 4, 4, INK); rectVida(g, x + 2, y - wing, 4, 4, INK);
        rectVida(g, x - 4, y + 1 - wing, 2, 2, MARIPOSA_COLOR[i]);
        rectVida(g, x - 2, y - wing, 1, 2, '#fffaf0');
        rectVida(g, x + 3, y + 1 - wing, 2, 2, MARIPOSA_COLOR[i]);
        rectVida(g, x + 1, y - wing, 1, 2, '#fffaf0');
        rectVida(g, x, y, 1, 5, INK);
      }
      const birdX = 10 * T + 2 + Math.round(Math.sin(t * 0.5) * 4);
      const birdY = 25 * T + 4 + (Math.floor(t * 2) % 2);
      rectVida(g, birdX + 1, birdY + 2, 10, 5, INK);
      rectVida(g, birdX + 3, birdY + 1, 6, 5, '#f6dd96');
      rectVida(g, birdX + 4, birdY + 3, 4, 2, '#8ac2ff');
      rectVida(g, birdX + 9, birdY + 3, 3, 2, '#e6a23a');
      rectVida(g, birdX + 8, birdY + 2, 1, 1, INK);
      rectVida(g, birdX + 3, birdY + 7, 1, 1, '#8a5a38');
      rectVida(g, birdX + 8, birdY + 7, 1, 1, '#8a5a38');
    }

    // pelota de ocio
    if (pelota.on) {
      rectVida(g, Math.round(pelota.x * T), Math.round(pelota.y * T), 4, 4, '#f2d45a');
      rectVida(g, Math.round(pelota.x * T) + 1, Math.round(pelota.y * T) + 1, 2, 2, '#d6a93c');
    }
    // plantas que se balancean 1px
    const sway = Math.round(Math.sin(t * 1.2) * 1);
    // un par de hojas en plantas del jardin
    rectVida(g, 10 * T + 4 + sway, 23 * T - 4, 2, 2, '#58a96b');
  }

  // ---------- beforeUpdate (micro agua fase beber dibujo no aquí) ----------

  // ---------- debug ----------
  const debug = params.get('debug') === '1';
  function medirDibujoAgente(fn) {
    return function (a, px, py, t, g) {
      const start = performance.now();
      try { return fn(a, px, py, t, g); }
      finally {
        const elapsed = performance.now() - start;
        lastMs += elapsed;
        totalMs += elapsed;
      }
    };
  }
  function medirDibujoGato(fn) {
    return function (g, px, py, t) {
      const start = performance.now();
      try { return fn(g, px, py, t); }
      finally {
        const elapsed = performance.now() - start;
        lastMs += elapsed;
        totalMs += elapsed;
      }
    };
  }
  function medirDibujoAmbiente(fn) {
    return function (g, t) {
      const start = performance.now();
      try { return fn(g, t); }
      finally {
        const elapsed = performance.now() - start;
        lastMs += elapsed;
        totalMs += elapsed;
      }
    };
  }

  const vida = {
    cat,
    OCIO_SEGUNDOS,
    faseIdle,
    update,
    beforeUpdate: null,
    drawCat: medirDibujoGato(drawCat),
    drawOcio: medirDibujoAgente(drawOcio),
    drawMicro: medirDibujoAgente(drawMicro),
    drawCaricia: medirDibujoAgente(drawCaricia),
    drawAmbient: medirDibujoAmbiente(drawAmbient),
    medir: () => (frameCount ? (totalMs / frameCount) : 0),
    forzarCaricia: (id) => {
      const a = AGENTS.find(o => o.id === id) || AGENTS[0];
      if (!a) return;
      a.pausa = { hasta: performance.now() / 1000 + 4, tipo: 'caricia' };
      cat.state = 'ronronear';
      if (window.efectos && window.efectos.emitir) window.efectos.emitir('corazon', Math.round(cat.x) * T + 8, Math.round(cat.y) * T + 4);
    },
    forzarAgua: (id) => {
      const a = AGENTS.find(o => o.id === id);
      if (!a) return;
      startAgua(a, performance.now() / 1000);
    },
    forzarOcio: (id) => {
      const a = AGENTS.find(o => o.id === id);
      if (!a) return;
      a.state = 'idle'; a.since = performance.now(); a._faseIdle = null;
      if (!a.ocio) startOcio(a, performance.now() / 1000);
      else ensureOcioSpot(a);
    },
    forzarSueno: (id) => {
      const a = AGENTS.find(o => o.id === id);
      if (!a) return;
      a.state = 'idle'; a.since = performance.now() - (OCIO_SEGUNDOS + 10) * 1000; a._faseIdle = null;
      a.ocio = null;
      ensureSuenoSpot(a);
    },
    teletransportarGato: (c, r) => { cat.x = c; cat.y = r; cat.path = []; },
  };

  if (debug) {
    window.vida = vida;
  } else {
    // exponer siempre (necesario para app.js hooks), pero debug solo añade? 
    // app.js ya llama window.vida?.*, así que debe existir siempre.
    window.vida = vida;
  }

  // ocultar burbuja del gato del DOM? no aplica.

  // cat bubble DOM? crear un div bubble para el gato reutilizando estilo
  // (opcional) omitido.

  // Inicializar cat en una celda válida
  if (!catWalkable(Math.round(cat.x), Math.round(cat.y))) {
    const t = chooseCatTarget();
    if (t) { cat.x = t[0]; cat.y = t[1]; }
  }
  cat.next = performance.now() / 1000 + rnd(6, 25);
})();
