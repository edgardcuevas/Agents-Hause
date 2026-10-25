// Efectos visuales de la casa: ciclo día/noche, luces cálidas y partículas por estado.
// Se dibuja encima de la casa desde el bucle de app.js (window.drawEffects).
// Probar una hora concreta: Casa de Agentes.html?hora=22
(() => {
  const W = COLS * T, H = ROWS * T;
  const forced = parseFloat(new URLSearchParams(location.search).get('hora'));

  // Capa de oscuridad (se reutiliza cada cuadro).
  const dark = document.createElement('canvas');
  dark.width = W; dark.height = H;
  const dg = dark.getContext('2d');

  // Luces fijas de la casa: x, y (px del canvas), radio, color RGB.
  const LAMPS = [
    [120, 84, 54, '255,226,150'],   // sala
    [360, 148, 48, '255,226,150'],  // dormitorio
    [214, 29, 44, '255,226,150'],   // estudio (escritorio)
    [248, 99, 54, '255,226,150'],   // estudio (lámpara de pie)
    [60, 304, 48, '255,226,150'],   // biblioteca
    [120, 324, 54, '255,226,150'],  // biblioteca (lámpara de pie)
    [224, 248, 56, '255,200,140'],  // cocina
    [312, 260, 70, '120,200,255'],  // servidores
    [56, 390, 56, '170,255,220'],   // enfermería
    [280, 436, 54, '255,226,150'],  // reuniones
    [128, 496, 54, '255,226,150'],  // sala de juegos
    [304, 496, 48, '255,226,150'],  // terraza
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function hourNow() {
    if (Number.isFinite(forced)) return forced;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }
  // 0 = pleno día, 1 = noche cerrada.
  function darkness(h) {
    if (h >= 7.5 && h <= 17.5) return 0;
    if (h > 17.5 && h < 20) return (h - 17.5) / 2.5;
    if (h >= 5 && h < 7.5) return 1 - (h - 5) / 2.5;
    return 1;
  }

  function lightHole(ctx, x, y, r, a) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,0,' + a + ')');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function drawLighting(g, t, d) {
    const flick = 1 + Math.sin(t * 7) * 0.03 + Math.sin(t * 13.3) * 0.02;
    dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, W, H);
    dg.fillStyle = 'rgba(10,16,48,' + (0.6 * d).toFixed(3) + ')';
    dg.fillRect(0, 0, W, H);
    // Recortes: donde hay luz no hay oscuridad.
    dg.globalCompositeOperation = 'destination-out';
    for (const [x, y, r] of LAMPS) lightHole(dg, x, y, r * flick, 0.9);
    for (const a of AGENTS) if (a.at !== false) lightHole(dg, a.x * T + 8, a.y * T + 8, 26, 0.55);
    g.drawImage(dark, 0, 0);
    // Resplandor cálido encima.
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, rgb] of LAMPS) {
      const gr = g.createRadialGradient(x, y, 0, x, y, r * flick);
      gr.addColorStop(0, 'rgba(' + rgb + ',' + (0.28 * d).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r * flick, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    // Un toque naranja al atardecer / amanecer.
    if (d > 0 && d < 1) {
      g.fillStyle = 'rgba(255,140,60,' + (Math.sin(Math.PI * d) * 0.1).toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  // Luciérnagas del jardín (solo de noche).
  const FLIES = Array.from({ length: 7 }, (_, i) => ({ ox: rnd(0, 6), oy: rnd(0, 5), sp: rnd(0.4, 1), ph: i * 1.7 }));
  function drawFireflies(g, t, d) {
    if (d < 0.35) return;
    const x0 = 9 * T, y0 = 22 * T;
    for (const f of FLIES) {
      const x = x0 + (f.ox + Math.sin(t * f.sp + f.ph) * 1.3) * T + 8;
      const y = y0 + (f.oy + Math.cos(t * f.sp * 1.3 + f.ph) * 1.1) * T + 8;
      const on = (Math.sin(t * 3 + f.ph) + 1) / 2;
      g.fillStyle = 'rgba(255,240,140,' + (0.18 * on * d).toFixed(3) + ')';
      g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
      g.fillStyle = 'rgba(255,250,190,' + (0.9 * on * d).toFixed(3) + ')';
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  // ---------- Partículas ----------
  const P = [];
  const MAX_P = 320;
  const FX = {
    codigo:    { every: 0.10, make: (x, y) => ({ x: x + rnd(-5, 5), y, vx: rnd(-3, 3), vy: rnd(-22, -12), life: 0.7, c: pick(['#6ee08a', '#8ac2ff', '#f0c060']) }) },
    docs:      { every: 0.28, make: (x, y) => ({ x: x + rnd(-6, 6), y, vx: rnd(-3, 3), vy: rnd(-9, -5), life: 1.0, c: pick(['#fffaf0', '#2b2420']) }) },
    comandos:  { every: 0.07, make: (x, y) => ({ x: x + rnd(-4, 4), y, vx: rnd(-16, 16), vy: rnd(-24, -10), g: 55, life: 0.55, c: pick(['#ffb347', '#ffe08a']) }) },
    error:     { every: 0.14, make: (x, y) => ({ x: x + rnd(-3, 3), y, vx: rnd(-3, 3), vy: rnd(-12, -7), life: 0.9, s: 2, c: pick(['#6b6b6b', '#8a8a8a', '#d6452f']) }) },
    listo:     { every: 0.12, make: (x, y) => ({ x: x + rnd(-4, 4), y, vx: rnd(-18, 18), vy: rnd(-34, -20), g: 45, life: 1.1, c: pick(['#ffd34a', '#ff7a7a', '#7ad0ff', '#9be08a']) }) },
    tests:     { every: 0.18, make: (x, y) => ({ x: x + rnd(-3, 3), y: y + 6, vx: rnd(-3, 3), vy: rnd(-12, -8), life: 0.9, s: 2, c: '#ffffff' }) },
    deploy:    { every: 0.14, make: (x, y) => ({ x: x + rnd(-6, 6), y, vx: rnd(-2, 2), vy: rnd(-26, -16), life: 0.8, c: pick(['#7fd0ff', '#b7e6ff']) }) },
    delegando: { every: 0.16, make: (x, y) => ({ x: x + rnd(-6, 6), y, vx: rnd(-8, 8), vy: rnd(-14, -6), life: 0.8, c: '#c79bff' }) },
    web:       { every: 0.20, make: (x, y) => ({ x: x + rnd(-7, 7), y: y + 2, vx: rnd(-4, 4), vy: rnd(-8, -3), life: 0.9, c: '#8ac2ff' }) },
    leer:      { every: 0.55, make: (x, y) => ({ x: x + rnd(-6, 6), y: y + 4, vx: rnd(-4, 4), vy: rnd(3, 7), life: 1.2, c: '#f3e6c0' }) },
  };
  const acc = new Map();

  function emit(a, dt) {
    const walking = a.path && a.path.length > 0;
    const px = a.x * T + 8, py = a.y * T;
    let spec = null, x = px, y = py - 2;
    if (walking) {
      spec = { every: 0.14, make: (xx, yy) => ({ x: xx + rnd(-3, 3), y: yy, vx: rnd(-4, 4), vy: rnd(-5, -1), life: 0.45, s: 2, c: '#d8cdb8' }) };
      y = py + 15;
    } else if (a.at !== false) {
      spec = FX[a.state];
    }
    if (!spec) return;
    const n = (acc.get(a.id) || 0) + dt;
    if (n >= spec.every) {
      acc.set(a.id, n - spec.every);
      if (P.length < MAX_P) { const p = spec.make(x, y); p.max = p.life; P.push(p); }
    } else acc.set(a.id, n);
  }

  function drawParticles(g, dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = Math.min(1, (p.life / p.max) * 1.4);
      g.fillStyle = p.c;
      const s = p.s || 1;
      g.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    g.globalAlpha = 1;
  }

  const HEARTS = [];
  window.efectos = window.efectos || {};
  window.efectos.emitir = function (tipo, x, y) {
    if (tipo === 'corazon') {
      for (let i = 0; i < 3; i++) {
        HEARTS.push({ x: x + (i - 1) * 4, y: y, vy: -18 - i * 4, life: 1.2, max: 1.2 });
      }
    }
  };
  window.drawEffects = function (g, t, dt) {
    const d = darkness(hourNow());
    if (d > 0.01) { drawLighting(g, t, d); drawFireflies(g, t, d); }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    for (const a of AGENTS) emit(a, dt);
    drawParticles(g, dt);
    // corazones
    for (let i = HEARTS.length - 1; i >= 0; i--) {
      const h = HEARTS[i];
      h.life -= dt;
      if (h.life <= 0) { HEARTS.splice(i, 1); continue; }
      h.y += h.vy * dt;
      const a = Math.min(1, h.life / h.max);
      g.globalAlpha = a;
      g.fillStyle = '#ff6fa3';
      // corazón 5x5
      R(g, Math.round(h.x), Math.round(h.y), 5, 5, '#ff6fa3');
      g.globalAlpha = 1;
    }
  };
})();