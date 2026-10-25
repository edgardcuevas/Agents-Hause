
// ---------- Mapa: 24x15 tiles de 16px ----------
const T = 16, COLS = 24, ROWS = 36;
const MAX_VISIBLE_AGENTS = 6;
const isMiniMode = new URLSearchParams(location.search).get('mini') === '1';
if (isMiniMode) document.body.classList.add('mini-mode');
const INK = '#2b2420';
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

const ROOMS = [
  { id: 'sala',      name: 'SALA',       x0: 1,  y0: 1, x1: 7,  y1: 6,  a: '#c9a06b', b: '#c19a64' },
  { id: 'estudio',   name: 'ESTUDIO',    x0: 9,  y0: 1, x1: 15, y1: 6,  a: '#d8b88a', b: '#d0b082' },
  { id: 'oficina',   name: 'OFICINA',    x0: 17, y0: 1, x1: 22, y1: 6,  a: '#8e9db0', b: '#8797ab' },
  { id: 'taller',    name: 'TALLER',     x0: 1,  y0: 8, x1: 7,  y1: 13, a: '#9b9a93', b: '#929189' },
  { id: 'recibidor', name: 'RECIBIDOR',  x0: 9,  y0: 8, x1: 15, y1: 13, a: '#dacdb6', b: '#cfc2aa' },
  { id: 'dormitorio',name: 'DORMITORIO', x0: 17, y0: 8, x1: 22, y1: 13, a: '#b6a5ba', b: '#ae9db2' },
  { id: 'biblioteca',name: 'BIBLIOTECA', x0: 1,  y0: 15, x1: 7,  y1: 20, a: '#a8845a', b: '#a07c52' },
  { id: 'cocina',    name: 'COCINA',     x0: 9,  y0: 15, x1: 15, y1: 20, a: '#ebe5d2', b: '#d9d2bc' },
  { id: 'servidores',name: 'SERVIDORES', x0: 17, y0: 15, x1: 22, y1: 20, a: '#6b7078', b: '#646a72' },
  { id: 'enfermeria',name: 'ENFERMERÍA', x0: 1,  y0: 22, x1: 7,  y1: 27, a: '#e3efee', b: '#d3e4e2' },
  { id: 'jardin',    name: 'JARDÍN',     x0: 9,  y0: 22, x1: 15, y1: 27, a: '#7fb36a', b: '#78ae64' },
  { id: 'reuniones', name: 'REUNIONES',  x0: 17, y0: 22, x1: 22, y1: 27, a: '#6d7c8f', b: '#667589' },
  { id: 'juegos',    name: 'SALA DE JUEGOS', x0: 1, y0: 29, x1: 15, y1: 34, a: '#d4a574', b: '#cc9e6e' },
  { id: 'terraza',   name: 'TERRAZA',    x0: 17, y0: 29, x1: 22, y1: 34, a: '#b8d4a0', b: '#adc995' },
];
const DOORS = [[4, 7], [12, 7], [19, 7], [8, 4], [8, 11], [16, 4], [16, 11], [4, 14], [12, 14], [19, 14], [8, 18], [16, 18], [4, 21], [12, 21], [19, 21], [8, 25], [16, 25], [4, 28], [12, 28], [19, 28], [16, 31]];

function isWall(c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  if (c === 0 || c === COLS - 1 || r === 0 || r === ROWS - 1) return true;
  if (DOORS.some(d => d[0] === c && d[1] === r)) return false;
  if (r === 7 || r === 14 || r === 21 || r === 28) return true;
  // en la sala de juegos (filas 29-34) no hay pared vertical en x=8
  if (c === 16) return true;
  if (c === 8 && !(r >= 29 && r <= 34)) return true;
  return false;
}
const blocked = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => isWall(c, r)));
function block(c, r, w = 1, h = 1) { for (let j = r; j < r + h; j++) for (let i = c; i < c + w; i++) blocked[j][i] = true; }

// Muebles que bloquean el paso
block(1, 1, 4, 1);   // librero sala
block(7, 5, 1, 1);   // mesita sala
block(9, 1, 2, 1);   // librero estudio
block(11, 2, 4, 1);  // escritorio estudio
block(15, 1, 1, 1);  // planta
block(18, 2, 4, 1);  // escritorio oficina
block(22, 1, 1, 2);  // rack
block(2, 9, 4, 1);   // banco de trabajo
block(6, 9, 2, 2);   // maquina
block(1, 12, 2, 1);  // cajas
block(9, 9, 1, 1);   // perchero
block(14, 9, 2, 1);  // banca
block(22, 9, 1, 1);  // mesa de noche
block(17, 13, 3, 1); // sofa
// Decoracion que tambien bloquea el paso
block(4, 5); block(1, 6);
block(9, 6); block(15, 6);
block(17, 6); block(22, 5, 1, 2);
block(7, 13); block(1, 13);
block(10, 9); block(9, 12); block(9, 13); block(15, 13);
block(17, 9); block(21, 8, 2, 1); block(22, 13);   // dormitorio
block(1, 15, 3, 1); block(5, 15, 3, 1); block(7, 16); block(2, 19, 2, 1); block(3, 20); block(5, 19); block(6, 19); block(7, 20); block(1, 20);  // biblioteca
block(9, 15, 3, 1); block(13, 15, 3, 1); block(11, 18, 3, 1); block(9, 20); block(15, 20);   // cocina
block(17, 15, 2, 1); block(20, 15, 3, 1); block(22, 19, 1, 2); block(17, 19, 2, 1); block(17, 20);   // servidores
block(5, 22, 3, 1); block(1, 24, 2, 2); block(3, 24); block(1, 27); block(7, 27); block(5, 26);   // enfermeria
block(9, 22, 2, 2); block(13, 23, 3, 2); block(9, 27); block(10, 27); block(14, 27); block(15, 27);   // jardin
block(18, 24, 4, 2); block(22, 22); block(17, 27); block(22, 27);   // reuniones
// sala de juegos
block(2, 30, 2, 1);   // maquina arcade
block(9, 29, 2, 1);   // TV
block(11, 32, 3, 2);  // mesa ping-pong
block(5, 33, 1, 1);   // cesta juguetes
// terraza (solo decoracion ligera)
block(18, 30, 2, 1);  // mesa baja
block(18, 32, 1, 1); block(21, 32, 1, 1);  // sillas

// Lugares donde se sienta/para cada estado, en orden de preferencia
const SPOTS = {
  leer:     [[3, 4], [6, 4]],
  web:      [[2, 16], [3, 16], [5, 16], [6, 16]],
  tests:    [[13, 16], [14, 16], [10, 16]],
  deploy:   [[18, 16], [21, 16], [22, 16]],
  listo:    [[10, 25], [11, 25], [14, 26]],
  delegando:[[18, 23], [20, 23], [21, 23]],
  error:    [[5, 23], [6, 23], [3, 23]],
  docs:     [[12, 3], [14, 3]],
  codigo:   [[19, 3], [21, 3]],
  comandos: [[3, 10], [5, 10], [6, 11]],
  espera:   [[12, 12], [11, 12], [13, 12]],
  idle:     [[20, 10], [19, 12], [22, 12]],
  ocio:     [[4, 31], [6, 31], [8, 31], [10, 31], [12, 31], [14, 31], [4, 33], [6, 33], [8, 33], [10, 33], [12, 33], [14, 33]],
  agua:     [[13, 16], [14, 16], [12, 17], [13, 17]],
};
const FACING = { tests: 'up', deploy: 'up', listo: 'down', delegando: 'down', leer: 'down', web: 'up', docs: 'up', codigo: 'up', comandos: 'up', espera: 'down', idle: 'down', error: 'down' };

// ---------- Camino mas corto (BFS en cuadricula) ----------
function findPath(from, to) {
  const key = (c, r) => r * COLS + c;
  const prev = new Map([[key(from[0], from[1]), null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur[0] === to[0] && cur[1] === to[1]) {
      const out = [];
      let k = key(cur[0], cur[1]);
      let node = cur;
      while (node) { out.unshift(node); node = prev.get(key(node[0], node[1])); }
      return out.slice(1);
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = cur[0] + dc, r = cur[1] + dr;
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS || blocked[r][c] || prev.has(key(c, r))) continue;
      prev.set(key(c, r), cur);
      q.push([c, r]);
    }
  }
  return null;
}

// ---------- Fondo estatico (se dibuja una vez) ----------
const bg = document.createElement('canvas');
bg.width = COLS * T; bg.height = ROWS * T;
const b = bg.getContext('2d');

function roomAt(c, r) { return ROOMS.find(m => c >= m.x0 && c <= m.x1 && r >= m.y0 && r <= m.y1); }

function drawWallTile(c, r) {
  const x = c * T, y = r * T;
  R(b, x, y, T, T, '#5a4838');
  R(b, x, y, T, 4, '#7d6751');
  R(b, x, y + T - 3, T, 3, '#3b2f25');
  if ((c + r) % 2 === 0) R(b, x + 6, y + 7, 4, 1, '#4d3d2f');
}

function bookshelf(c, r, w, seed) {
  const x = c * T, y = r * T, cols = ['#b5453a', '#3d6fa5', '#d6a93c', '#4f8a5b', '#8a5a9a', '#e8e2d0'];
  R(b, x, y, w * T, T, '#6b4a2f'); R(b, x + 1, y + 1, w * T - 2, T - 2, '#4a3220');
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < w * 5; i++) {
      const hh = 5 + ((i * 7 + seed + row * 3) % 3);
      R(b, x + 2 + i * 3, y + 2 + row * 7 + (6 - hh), 2, hh, cols[(i * 5 + seed + row) % cols.length]);
    }
    R(b, x + 1, y + 8 + row * 0, w * T - 2, 1, '#6b4a2f');
  }
}

function armchair(c, r) {
  const x = c * T, y = r * T;
  R(b, x + 1, y + 1, 14, 14, INK); R(b, x + 2, y + 2, 12, 5, '#8f4a2c'); R(b, x + 2, y + 7, 12, 7, '#b5653a');
  R(b, x + 2, y + 7, 2, 7, '#9a5430'); R(b, x + 12, y + 7, 2, 7, '#9a5430');
}
function officeChair(c, r, col) {
  const x = c * T, y = r * T;
  R(b, x + 3, y + 2, 10, 11, INK); R(b, x + 4, y + 3, 8, 9, col); R(b, x + 4, y + 3, 8, 3, '#00000022');
}

function drawFurniture() {
  // SALA
  R(b, 3 * T, 3 * T + 4, 4 * T, 2 * T + 4, '#2f5f5b'); R(b, 3 * T + 2, 3 * T + 6, 4 * T - 4, 2 * T, '#3c7a74');
  bookshelf(1, 1, 4, 0);
  armchair(3, 4); armchair(6, 4);
  R(b, 7 * T + 2, 5 * T + 4, 12, 10, INK); R(b, 7 * T + 3, 5 * T + 5, 10, 8, '#a8794a'); // mesita
  R(b, 7 * T + 6, 5 * T + 1, 4, 4, '#f3d98a'); R(b, 7 * T + 7, 5 * T + 5, 2, 2, '#7a5a38'); // lampara
  // ESTUDIO
  bookshelf(9, 1, 2, 3);
  R(b, 11 * T, 2 * T, 4 * T, T, INK); R(b, 11 * T + 1, 2 * T + 1, 4 * T - 2, T - 3, '#a8794a'); R(b, 11 * T + 1, 3 * T - 3, 4 * T - 2, 2, '#7a5a38');
  officeChair(12, 3, '#4f7a8a'); officeChair(14, 3, '#4f7a8a');
  R(b, 15 * T + 3, 1 * T + 8, 10, 7, '#8a5a38'); R(b, 15 * T + 2, 1 * T + 1, 12, 9, '#3f8a52'); R(b, 15 * T + 5, 1 * T - 0, 6, 4, '#58a96b'); // planta
  R(b, 10 * T, 4 * T + 4, 3 * T, 2 * T, '#b59a6b'); R(b, 10 * T + 2, 4 * T + 6, 3 * T - 4, 2 * T - 4, '#c9b184');
  // OFICINA
  R(b, 18 * T, 2 * T, 4 * T, T, INK); R(b, 18 * T + 1, 2 * T + 1, 4 * T - 2, T - 3, '#6e7b8c'); R(b, 18 * T + 1, 3 * T - 3, 4 * T - 2, 2, '#55616f');
  officeChair(19, 3, '#2f3b4a'); officeChair(21, 3, '#2f3b4a');
  R(b, 22 * T + 1, 1 * T, 14, 2 * T, INK); R(b, 22 * T + 2, 1 * T + 1, 12, 2 * T - 2, '#3a424d');
  for (let i = 0; i < 5; i++) R(b, 22 * T + 4, 1 * T + 3 + i * 5, 8, 3, '#222831');
  // TALLER
  R(b, 2 * T, 9 * T, 4 * T, T, INK); R(b, 2 * T + 1, 9 * T + 1, 4 * T - 2, T - 3, '#b7824f'); R(b, 2 * T + 1, 10 * T - 3, 4 * T - 2, 2, '#855a36');
  R(b, 2 * T + 4, 9 * T + 4, 6, 2, '#c8c8c0'); R(b, 4 * T + 3, 9 * T + 3, 3, 6, '#d6a93c');
  R(b, 6 * T, 9 * T, 2 * T, 2 * T, INK); R(b, 6 * T + 1, 9 * T + 1, 2 * T - 2, 2 * T - 2, '#6d7580'); R(b, 6 * T + 3, 9 * T + 3, 2 * T - 6, 2 * T - 6, '#3a424d');
  R(b, 1 * T + 1, 12 * T + 2, 2 * T - 2, T - 3, INK); R(b, 1 * T + 2, 12 * T + 3, 2 * T - 4, T - 6, '#b88a55'); R(b, 1 * T + 2, 12 * T + 6, 2 * T - 4, 1, '#8c6a3f');
  // RECIBIDOR
  R(b, 11 * T, 13 * T, 3 * T, T, '#7d3f3a'); R(b, 11 * T + 2, 13 * T + 2, 3 * T - 4, T - 4, '#a05048'); // felpudo
  R(b, 9 * T + 6, 9 * T + 1, 4, 14, INK); R(b, 9 * T + 7, 9 * T + 2, 2, 12, '#6b4a2f'); R(b, 9 * T + 3, 9 * T + 3, 4, 3, '#b5453a'); R(b, 9 * T + 9, 9 * T + 5, 4, 3, '#3d6fa5'); // perchero
  R(b, 14 * T, 9 * T + 2, 2 * T, 12, INK); R(b, 14 * T + 1, 9 * T + 3, 2 * T - 2, 8, '#a8794a'); // banca
  // DORMITORIO
  R(b, 20 * T - 1, 9 * T - 1, 2 * T + 2, 2 * T + 2, INK); R(b, 20 * T, 9 * T, 2 * T, 2 * T, '#e8e2d0'); R(b, 20 * T + 2, 9 * T + 2, 12, 7, '#f4f0e4'); R(b, 20 * T, 10 * T - 2, 2 * T, 2 * T + 2, '#5a6fa8'); // cama
  R(b, 22 * T + 2, 9 * T + 3, 12, 11, INK); R(b, 22 * T + 3, 9 * T + 4, 10, 9, '#a8794a'); R(b, 22 * T + 6, 9 * T + 1, 4, 4, '#f3d98a'); // mesa de noche
  R(b, 17 * T, 13 * T, 3 * T, T, INK); R(b, 17 * T + 1, 13 * T + 1, 3 * T - 2, T - 2, '#5c8a72'); R(b, 17 * T + 1, 13 * T + 1, 3 * T - 2, 5, '#4a7660'); // sofa
  R(b, 22 * T + 1, 12 * T + 1, 14, 14, INK); R(b, 22 * T + 2, 12 * T + 2, 12, 12, '#d98a5a'); // puf
  R(b, 18 * T, 9 * T + 4, 2 * T, 2 * T, '#8a7390'); R(b, 18 * T + 2, 9 * T + 6, 2 * T - 4, 2 * T - 4, '#9c85a2'); // alfombra
}

function drawHouse() {
  R(b, 0, 0, bg.width, bg.height, '#2a2420');
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (isWall(c, r)) { drawWallTile(c, r); continue; }
    const room = roomAt(c, r);
    if (room) {
      R(b, c * T, r * T, T, T, (c + r) % 2 ? room.a : room.b);
      if (room.id === 'recibidor' || room.id === 'taller') R(b, c * T, r * T, T, 1, '#00000014'), R(b, c * T, r * T, 1, T, '#00000014');
      else if (room.id === 'sala' || room.id === 'estudio') R(b, c * T, r * T + 7, T, 1, '#00000012');
    } else {
      R(b, c * T, r * T, T, T, '#8a6f50'); R(b, c * T, r * T + 6, T, 4, '#a58862');
    }
  }
  // puerta de entrada (pared inferior, col 12)

  drawFurniture();
  drawDecor();
  drawRooms2();
  drawRooms3();
  drawRooms4();
}

// ---------- Decoracion estatica ----------
function shadowRect(x, y, w, h) { R(b, x, y, w, h, 'rgba(0,0,0,.18)'); }
function frameBox(x, y, w, h, inner) { R(b, x, y, w, h, INK); R(b, x + 1, y + 1, w - 2, h - 2, '#d9b36a'); R(b, x + 2, y + 2, w - 4, h - 4, inner); }
function windowDay(x, y, w, h) {
  R(b, x - 1, y - 1, w + 2, h + 2, INK); R(b, x, y, w, h, '#a9d8ee'); R(b, x, y + h - 2, w, 2, '#7fb06a');
  R(b, x, y, w, 1, '#d4f0fa'); R(b, x + (w >> 1) - 1, y, 2, h, '#e8e2d0');
}
function windowNight(x, y, w, h) {
  R(b, x - 1, y - 1, w + 2, h + 2, INK); R(b, x, y, w, h, '#27345e');
  R(b, x + w - 9, y + 2, 4, 4, '#f4efc4'); R(b, x + w - 8, y + 2, 3, 3, '#27345e');
  R(b, x + (w >> 1) - 1, y, 2, h, '#3a4a7a');
}
function glow(cx, cy, r, rgb) {
  for (let i = 0; i < 3; i++) { b.fillStyle = 'rgba(' + rgb + ',0.06)'; b.beginPath(); b.arc(cx, cy, r * (1 - i * 0.3), 0, Math.PI * 2); b.fill(); }
}
function plantAt(c, r, terracotta) {
  const x = c * T, y = r * T;
  shadowRect(x + 2, y + 13, 12, 3);
  R(b, x + 4, y + 9, 8, 6, INK); R(b, x + 5, y + 10, 6, 4, terracotta ? '#c9774a' : '#8a5a38'); R(b, x + 5, y + 10, 6, 1, 'rgba(0,0,0,.2)');
  R(b, x + 7, y + 5, 2, 5, '#2f6b3d');
  R(b, x + 2, y + 3, 5, 4, INK); R(b, x + 3, y + 4, 3, 2, '#4a9a5a');
  R(b, x + 9, y + 2, 5, 4, INK); R(b, x + 10, y + 3, 3, 2, '#58a96b');
  R(b, x + 5, y, 6, 5, INK); R(b, x + 6, y + 1, 4, 3, '#3f8a52');
}
function floorLamp(c, r) {
  const x = c * T, y = r * T;
  shadowRect(x + 3, y + 14, 10, 2);
  R(b, x + 5, y + 13, 6, 2, INK); R(b, x + 7, y + 5, 2, 9, '#4a3a2a');
  R(b, x + 3, y + 1, 10, 6, INK); R(b, x + 4, y + 2, 8, 4, '#f6dd96'); R(b, x + 4, y + 2, 8, 1, '#fff0c0');
}
function rugBorder(x, y, w, h, c) { R(b, x, y, w, 1, c); R(b, x, y + h - 1, w, 1, c); R(b, x, y, 1, h, c); R(b, x + w - 1, y, 1, h, c); }
function diamonds(x, y, n, step, c) { for (let k = 0; k < n; k++) { const cx = x + k * step; R(b, cx - 1, y - 1, 3, 3, c); R(b, cx, y - 2, 1, 1, c); R(b, cx, y + 2, 1, 1, c); } }

function drawDecor() {
  // sombras de pared sobre el piso
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (isWall(c, r)) continue;
    if (isWall(c, r - 1)) R(b, c * T, r * T, T, 3, 'rgba(0,0,0,.16)');
    if (isWall(c - 1, r)) R(b, c * T, r * T, 2, T, 'rgba(0,0,0,.10)');
  }

  // ---- alfombras ----
  rugBorder(52, 56, 56, 27, '#8cc9bf'); diamonds(60, 69, 5, 10, '#e6d28a');                         // sala
  rugBorder(165, 73, 38, 22, '#a58b5c'); diamonds(176, 84, 3, 10, '#8a6f45');                       // estudio
  R(b, 18 * T + 2, 4 * T + 3, 4 * T - 4, 2 * T - 6, '#3e4a5a'); rugBorder(18 * T + 4, 4 * T + 5, 4 * T - 8, 2 * T - 10, '#6e7f95');   // oficina
  R(b, 18 * T + 6, 4 * T + 9, 4 * T - 12, 2, '#6e7f95');
  R(b, 11 * T + 2, 9 * T + 2, 3 * T - 4, 4 * T - 4, '#8a3b3b'); rugBorder(11 * T + 5, 9 * T + 5, 3 * T - 10, 4 * T - 10, '#d6b56a');   // recibidor
  for (let i = 0; i < 5; i++) { R(b, 11 * T + 4 + i * 8, 9 * T, 1, 2, '#d6b56a'); R(b, 11 * T + 4 + i * 8, 13 * T - 2, 1, 2, '#d6b56a'); }
  rugBorder(292, 153, 24, 22, '#b49cb8'); diamonds(298, 164, 2, 12, '#e8d6ec');                     // dormitorio
  R(b, 2 * T + 4, 10 * T + 2, 56, 12, '#444850'); rugBorder(2 * T + 4, 10 * T + 2, 56, 12, '#5a5f68');                                 // taller: tapete
  for (let i = 0; i < 8; i++) R(b, 6 * T + i * 4, 11 * T + 12, 4, 4, i % 2 ? '#f2d45a' : '#2b2420'); // franja de seguridad
  R(b, 4 * T + 4, 12 * T + 5, 9, 4, '#85847d'); R(b, 4 * T + 7, 12 * T + 4, 5, 2, '#85847d');       // mancha de aceite

  // ---- decoracion de pared (pared norte) ----
  frameBox(70, 3, 14, 10, '#9ccfe6'); R(b, 72, 8, 10, 3, '#4f8a5b'); R(b, 77, 6, 2, 2, '#f6e27a');   // cuadro sala
  frameBox(13 * T + 4, 3, 22, 10, '#e6d3a3'); R(b, 216, 6, 5, 3, '#a9915a'); R(b, 224, 7, 4, 2, '#a9915a'); R(b, 222, 5, 1, 1, '#b5453a'); // mapa estudio
  R(b, 20 * T, 2, 30, 11, INK); R(b, 20 * T + 1, 3, 28, 9, '#f4f6f8');                                  // pizarra oficina
  R(b, 20 * T + 3, 4, 7, 4, '#3b78d4'); R(b, 20 * T + 4, 5, 5, 2, '#f4f6f8');
  R(b, 20 * T + 16, 4, 7, 4, '#3b78d4'); R(b, 20 * T + 17, 5, 5, 2, '#f4f6f8');
  R(b, 20 * T + 10, 6, 6, 1, '#555'); R(b, 20 * T + 14, 5, 1, 3, '#555');
  R(b, 20 * T + 4, 9, 18, 1, '#d6533e'); R(b, 20 * T + 25, 4, 3, 3, '#f2d45a'); R(b, 20 * T + 25, 8, 3, 3, '#f08f8f');
  // ---- pared central (divisoria) ----
  R(b, 5 * T + 2, 7 * T + 2, 3 * T - 4, 11, INK); R(b, 5 * T + 3, 7 * T + 3, 3 * T - 6, 9, '#b58f5b');   // panel de herramientas
  R(b, 5 * T + 6, 7 * T + 5, 1, 6, '#8a5a38'); R(b, 5 * T + 5, 7 * T + 4, 3, 2, '#999');
  R(b, 5 * T + 12, 7 * T + 4, 1, 7, '#c8c8c0'); R(b, 5 * T + 11, 7 * T + 4, 3, 2, '#c8c8c0');
  R(b, 5 * T + 18, 7 * T + 6, 10, 3, '#c8c8c0'); for (let i = 0; i < 5; i++) R(b, 5 * T + 18 + i * 2, 7 * T + 9, 1, 1, '#c8c8c0');
  R(b, 5 * T + 33, 7 * T + 5, 1, 5, '#d6a93c'); R(b, 5 * T + 33, 7 * T + 10, 1, 1, '#999');
  R(b, 14 * T + 3, 7 * T + 2, 12, 11, INK); R(b, 14 * T + 4, 7 * T + 3, 10, 9, '#d9b36a'); R(b, 14 * T + 5, 7 * T + 4, 8, 7, '#cfe9f2');   // espejo
  R(b, 14 * T + 6, 7 * T + 5, 2, 1, '#fff'); R(b, 14 * T + 7, 7 * T + 6, 1, 1, '#fff');
  windowNight(21 * T + 4, 7 * T + 2, 26, 10);                                                       // ventana de noche del dormitorio

  // ---- muebles y plantas extra ----
  plantAt(1, 6, false); plantAt(9, 6, true); floorLamp(15, 6); plantAt(22, 13, true); plantAt(15, 13, false);
  // sala: tazon en la mesita
  R(b, 7 * T + 9, 5 * T + 6, 3, 3, '#fffaf0');
  // estudio: globo, libros, lampara y taza del escritorio
  R(b, 12 * T + 6, 1 * T + 12, 4, 2, INK); R(b, 12 * T + 3, 1 * T + 3, 10, 10, INK); R(b, 12 * T + 4, 1 * T + 4, 8, 8, '#4a8ab5');
  R(b, 12 * T + 5, 1 * T + 5, 3, 3, '#58a96b'); R(b, 12 * T + 9, 1 * T + 8, 2, 3, '#58a96b');
  R(b, 14 * T + 2, 1 * T + 7, 12, 3, INK); R(b, 14 * T + 3, 1 * T + 8, 10, 1, '#b5453a');
  R(b, 14 * T + 3, 1 * T + 10, 10, 3, INK); R(b, 14 * T + 4, 1 * T + 11, 8, 1, '#3d6fa5');
  R(b, 11 * T + 5, 2 * T + 3, 4, 4, INK); R(b, 11 * T + 6, 2 * T + 4, 2, 2, '#fffaf0');
  R(b, 13 * T + 4, 2 * T + 2, 5, 2, INK); R(b, 13 * T + 6, 2 * T - 4, 1, 6, INK); R(b, 13 * T + 3, 2 * T - 7, 7, 4, INK); R(b, 13 * T + 4, 2 * T - 6, 5, 2, '#f6dd96');
  R(b, 10 * T + 3, 5 * T + 9, 5, 3, '#b5453a'); R(b, 11 * T + 2, 5 * T + 8, 5, 3, '#3d6fa5');      // libros en el piso
  // oficina: papelera, taza, acuario
  { const x = 17 * T, y = 6 * T; shadowRect(x + 3, y + 14, 10, 2); R(b, x + 4, y + 5, 8, 2, INK); R(b, x + 4, y + 6, 8, 9, INK); R(b, x + 5, y + 7, 6, 7, '#6b7a88'); R(b, x + 7, y + 4, 2, 2, '#fffaf0'); }
  R(b, 18 * T + 3, 2 * T + 3, 3, 3, '#fffaf0'); R(b, 18 * T + 3, 2 * T + 3, 3, 1, '#c4412f');
  { const x = 22 * T, y = 5 * T;
    R(b, x, y + 1, 16, 22, INK); R(b, x + 1, y + 2, 14, 20, '#5cb8d9'); R(b, x + 1, y + 2, 14, 3, '#8ed4ea');
    R(b, x + 1, y + 19, 14, 3, '#e6d3a3'); R(b, x + 3, y + 13, 2, 6, '#3f8a52'); R(b, x + 10, y + 11, 2, 8, '#58a96b'); R(b, x + 6, y + 18, 3, 2, '#8a8a82');
    R(b, x, y, 16, 2, '#3a424d');
    R(b, x + 1, y + 23, 14, 9, INK); R(b, x + 2, y + 24, 12, 8, '#5a4838'); R(b, x + 7, y + 24, 1, 8, '#3b2f25'); R(b, x + 5, y + 27, 1, 2, '#e6c25a'); R(b, x + 10, y + 27, 1, 2, '#e6c25a'); }
  // taller: barril y llantas
  { const x = 7 * T, y = 13 * T; shadowRect(x + 2, y + 14, 12, 2);
    R(b, x + 2, y + 1, 12, 15, INK); R(b, x + 3, y + 2, 10, 13, '#b5453a'); R(b, x + 3, y + 5, 10, 1, '#6b2a24'); R(b, x + 3, y + 11, 10, 1, '#6b2a24');
    R(b, x + 4, y + 2, 2, 13, '#d06a5c'); R(b, x + 6, y + 7, 4, 3, '#f2d45a'); }
  { const x = 1 * T, y = 13 * T; for (let i = 0; i < 3; i++) { const ty = y + 3 + i * 4; R(b, x + 2, ty, 12, 5, INK); R(b, x + 3, ty + 1, 10, 3, '#3b3e43'); R(b, x + 6, ty + 2, 4, 1, '#222'); } }
  // recibidor: paragüero, zapatero, mesita con flores
  { const x = 10 * T, y = 9 * T; R(b, x + 6, y + 1, 2, 8, '#b5453a'); R(b, x + 9, y + 2, 2, 7, '#2f3b4a'); R(b, x + 5, y + 0, 3, 1, '#b5453a'); R(b, x + 4, y + 8, 8, 7, INK); R(b, x + 5, y + 9, 6, 5, '#4a5a6a'); }
  { const x = 9 * T, y = 12 * T; R(b, x + 1, y + 3, 14, 12, INK); R(b, x + 2, y + 4, 12, 10, '#a8794a'); R(b, x + 2, y + 8, 12, 1, '#7a5a38');
    R(b, x + 3, y + 5, 4, 3, '#3d6fa5'); R(b, x + 8, y + 5, 4, 3, '#b5453a'); R(b, x + 3, y + 10, 5, 3, '#4a3f36'); R(b, x + 9, y + 10, 4, 3, '#d6d0c0'); }
  { const x = 9 * T, y = 13 * T; R(b, x + 1, y + 7, 14, 3, INK); R(b, x + 2, y + 8, 12, 1, '#a8794a'); R(b, x + 2, y + 10, 2, 6, INK); R(b, x + 12, y + 10, 2, 6, INK);
    R(b, x + 6, y + 1, 4, 6, INK); R(b, x + 7, y + 2, 2, 4, '#58a6c9'); R(b, x + 5, y - 2, 2, 3, '#e86a8a'); R(b, x + 8, y - 3, 2, 3, '#f2d45a'); R(b, x + 10, y - 1, 2, 2, '#e86a8a'); }
  R(b, 14 * T + 3, 9 * T + 3, 10, 3, '#c4412f');                                                    // cojin de la banca
  // dormitorio: armario, comoda, cojines, pantuflas
  { const x = 21 * T, y = 8 * T; R(b, x, y, 32, 16, INK); R(b, x + 1, y + 1, 30, 14, '#8a5a38'); R(b, x + 1, y + 1, 30, 1, '#a8754a'); R(b, x + 15, y + 1, 2, 14, '#5a3d28');
    R(b, x + 13, y + 7, 1, 3, '#e6c25a'); R(b, x + 18, y + 7, 1, 3, '#e6c25a'); }
  { const x = 17 * T, y = 9 * T; shadowRect(x + 1, y + 15, 14, 1); R(b, x + 1, y + 3, 14, 13, INK); R(b, x + 2, y + 4, 12, 11, '#a8794a'); R(b, x + 2, y + 9, 12, 1, INK);
    R(b, x + 7, y + 6, 2, 1, '#e6c25a'); R(b, x + 7, y + 12, 2, 1, '#e6c25a'); R(b, x + 3, y, 4, 4, INK); R(b, x + 4, y + 1, 2, 2, '#9ccfe6'); R(b, x + 10, y + 1, 4, 3, '#f6dd96'); }
  R(b, 18 * T + 2, 13 * T + 3, 5, 5, '#d9a05a'); R(b, 19 * T + 3, 13 * T + 3, 6, 5, '#d98a8a');   // cojines del sofa
  R(b, 19 * T + 2, 11 * T + 10, 3, 2, '#f0a79a'); R(b, 19 * T + 7, 11 * T + 10, 3, 2, '#f0a79a'); // pantuflas
  // luces calidas
  glow(7 * T + 8, 5 * T + 4, 22, '255,226,150'); glow(22 * T + 8, 9 * T + 4, 20, '255,226,150');
  glow(13 * T + 6, 2 * T - 3, 18, '255,226,150'); glow(15 * T + 8, 6 * T + 3, 22, '255,226,150');
}

// ---------- Decoracion animada ----------
function pixLine(x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) R(g, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, c);
}
function drawDynamic2(t) {
  // rayo de sol bajo la ventana de la sala
  const sway = Math.round(Math.sin(t * 0.3) * 2);
  for (let i = 0; i < 5; i++) R(g, 6 * T + 4 - i * 3 + sway, T + 2 + i * 9, 18, 9, 'rgba(255,240,180,.10)');
  // reloj
  const d = new Date(), cx = 15 * T + 10, cy = 7;
  R(g, cx - 4, cy - 4, 9, 9, INK); R(g, cx - 3, cy - 3, 7, 7, '#fffaf0'); R(g, cx, cy - 3, 1, 1, INK); R(g, cx, cy + 3, 1, 1, INK);
  const mA = d.getMinutes() / 60 * Math.PI * 2, hA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2;
  pixLine(cx, cy, cx + Math.sin(mA) * 3, cy - Math.cos(mA) * 3, INK); pixLine(cx, cy, cx + Math.sin(hA) * 2, cy - Math.cos(hA) * 2, '#b5453a');
  // acuario
  { const x = 22 * T, y = 5 * T;
    for (let i = 0; i < 2; i++) {
      const ph = t * [1.1, 0.7][i] + i * 2, fx = x + 3 + Math.round((Math.sin(ph) + 1) / 2 * 8), fy = y + 7 + i * 5 + Math.round(Math.sin(t * 1.7 + i));
      const dir = Math.cos(ph) > 0 ? 1 : -1, c = ['#f08d4a', '#f2d45a'][i];
      R(g, fx, fy, 4, 2, c); R(g, fx + (dir > 0 ? -2 : 4), fy, 2, 2, c); R(g, fx + (dir > 0 ? 3 : 0), fy, 1, 1, INK);
    }
    for (let k = 0; k < 3; k++) R(g, x + 11 + (k % 2), y + 20 - Math.floor((t * 6 + k * 7) % 16), 1, 1, 'rgba(255,255,255,.8)'); }
  // luces del rack de la oficina
  for (let i = 0; i < 5; i++) R(g, 22 * T + 11, T + 3 + i * 5, 1, 1, (Math.floor(t * (1.5 + i * 0.8)) % 2) ? (i % 2 ? '#6ee08a' : '#f0a060') : '#2a4a34');
  // estrellas de la ventana nocturna
  const tw = Math.floor(t * 1.3) % 2;
  R(g, 21 * T + 7, 7 * T + 4, 1, 1, tw ? '#fff' : '#27345e'); R(g, 21 * T + 14, 7 * T + 8, 1, 1, tw ? '#27345e' : '#fff'); R(g, 21 * T + 20, 7 * T + 6, 1, 1, '#fff');
}


// ---------- Habitaciones nuevas: biblioteca, cocina, sala de servidores ----------
function counterBlock(c, r, w) {
  const x = c * T, y = r * T;
  R(b, x, y + 2, w * T, 14, INK); R(b, x + 1, y + 3, w * T - 2, 4, '#c9b891'); R(b, x + 1, y + 7, w * T - 2, 8, '#b58f5b');
  for (let i = 0; i < w; i++) { R(b, x + i * T + 2, y + 9, T - 4, 5, '#9c7a48'); R(b, x + i * T + 7, y + 10, 2, 1, '#e6c25a'); }
}
function rackAt(c, r) {
  const x = c * T, y = r * T;
  R(b, x + 1, y, 14, 16, INK); R(b, x + 2, y + 1, 12, 14, '#2e3440');
  for (let i = 0; i < 3; i++) { R(b, x + 3, y + 2 + i * 4, 10, 3, '#1d222b'); R(b, x + 4, y + 3 + i * 4, 4, 1, '#454e5e'); }
}
const RACKS = [[17, 15], [18, 15], [20, 15], [21, 15], [22, 15]];

function drawRooms2() {
  // patrones de piso
  for (let r = 15; r <= 20; r++) {
    for (let c = 1; c <= 7; c++) { R(b, c * T, r * T + 7, T, 1, 'rgba(0,0,0,.09)'); R(b, c * T + ((r % 2) ? 4 : 11), r * T, 1, 7, 'rgba(0,0,0,.07)'); }
    for (let c = 17; c <= 22; c++) { R(b, c * T, r * T, T, 1, 'rgba(255,255,255,.08)'); R(b, c * T, r * T, 1, T, 'rgba(255,255,255,.08)'); }
  }

  // ===== BIBLIOTECA =====
  bookshelf(1, 15, 3, 5); bookshelf(5, 15, 3, 7);
  { const x = 7 * T, y = 16 * T; R(b, x + 3, y, 1, 16, '#8a5a38'); R(b, x + 12, y, 1, 16, '#8a5a38'); for (let i = 0; i < 4; i++) R(b, x + 3, y + 2 + i * 4, 10, 1, '#a8794a'); }   // escalera
  R(b, 3 * T, 17 * T + 4, 4 * T, 2 * T - 8, '#7d3f3a'); rugBorder(3 * T + 3, 17 * T + 7, 4 * T - 6, 2 * T - 14, '#d6b56a'); diamonds(3 * T + 12, 18 * T, 4, 12, '#d6b56a');
  { const x = 2 * T, y = 19 * T; R(b, x, y + 2, 2 * T, 14, INK); R(b, x + 1, y + 3, 2 * T - 2, 5, '#b88a55'); R(b, x + 1, y + 8, 2 * T - 2, 7, '#7a5a38');
    R(b, x + 4, y + 3, 8, 4, '#fffaf0'); R(b, x + 8, y + 3, 1, 4, '#b5453a'); R(b, x + 5, y + 4, 2, 1, '#b9ae96'); R(b, x + 10, y + 4, 2, 1, '#b9ae96');
    R(b, x + 22, y - 3, 5, 3, INK); R(b, x + 23, y - 2, 3, 1, '#f6dd96'); R(b, x + 24, y, 1, 3, INK); }
  officeChair(3, 20, '#7a4f3a');
  armchair(6, 19);
  { const x = 5 * T, y = 19 * T; R(b, x + 2, y + 7, 12, 3, INK); R(b, x + 3, y + 8, 10, 1, '#a8794a'); R(b, x + 3, y + 10, 2, 6, INK); R(b, x + 11, y + 10, 2, 6, INK);
    R(b, x + 5, y + 1, 6, 6, INK); R(b, x + 6, y + 2, 4, 4, '#4a8ab5'); R(b, x + 7, y + 3, 1, 2, '#58a96b'); R(b, x + 7, y + 7, 2, 1, INK); }
  floorLamp(7, 20); plantAt(1, 20, true);
  glow(3 * T + 12, 19 * T, 20, '255,226,150'); glow(7 * T + 8, 20 * T + 4, 22, '255,226,150');

  // ===== COCINA =====
  R(b, 9 * T + 1, 15 * T, 14, 16, INK); R(b, 9 * T + 2, 15 * T + 1, 12, 14, '#dfe6ea'); R(b, 9 * T + 2, 15 * T + 7, 12, 1, '#9aa3a8');
  R(b, 9 * T + 11, 15 * T + 3, 1, 3, '#7a828a'); R(b, 9 * T + 11, 15 * T + 9, 1, 4, '#7a828a'); R(b, 9 * T + 4, 15 * T + 3, 2, 2, '#e86a8a'); R(b, 9 * T + 4, 15 * T + 10, 2, 2, '#58a96b');
  counterBlock(10, 15, 2); R(b, 10 * T + 6, 15 * T + 3, 12, 3, '#7f8f99'); R(b, 10 * T + 15, 15 * T - 1, 2, 4, '#c8c8c0'); R(b, 10 * T + 13, 15 * T - 1, 4, 1, '#c8c8c0');
  { const x = 13 * T, y = 15 * T; R(b, x, y + 1, 32, 15, INK); R(b, x + 1, y + 2, 30, 13, '#2f3338'); R(b, x + 1, y + 2, 30, 3, '#4a5058');
    R(b, x + 6, y + 7, 20, 6, '#15181c'); R(b, x + 5, y + 6, 22, 1, '#9aa3a8'); for (let i = 0; i < 4; i++) R(b, x + 4 + i * 7, y + 3, 2, 1, '#c8c8c0');
    R(b, x + 7, y - 1, 10, 5, INK); R(b, x + 9, y, 6, 3, '#9aa3a8'); R(b, x + 5, y + 1, 2, 1, INK); R(b, x + 17, y + 1, 2, 1, INK); }
  counterBlock(15, 15, 1); R(b, 15 * T + 1, 15 * T - 2, 14, 8, INK); R(b, 15 * T + 2, 15 * T - 1, 8, 6, '#cfd5d9'); R(b, 15 * T + 11, 15 * T - 1, 3, 6, '#2f3338');
  { const x = 11 * T, y = 18 * T; shadowRect(x + 1, y + 15, 3 * T - 2, 2);
    R(b, x, y + 1, 3 * T, 15, INK); R(b, x + 1, y + 2, 3 * T - 2, 5, '#d9b36a'); R(b, x + 1, y + 7, 3 * T - 2, 8, '#6b4a2f');
    R(b, x + 3, y + 3, 6, 3, '#e6d3a3'); R(b, x + 28, y - 1, 10, 4, '#8a5a38'); R(b, x + 30, y - 2, 2, 2, '#d6533e'); R(b, x + 33, y - 2, 2, 2, '#f2d45a'); }
  R(b, 13 * T, 16 * T + 3, 2 * T, 11, '#c4412f'); R(b, 13 * T + 2, 16 * T + 5, 2 * T - 4, 1, '#f2d45a'); R(b, 13 * T + 2, 16 * T + 9, 2 * T - 4, 1, '#f2d45a');
  R(b, 11 * T + 2, 20 * T + 3, 3 * T - 4, 10, '#5a4838'); R(b, 11 * T + 4, 20 * T + 5, 3 * T - 8, 6, '#7a6248');
  R(b, 13 * T + 1, 14 * T + 3, 7, 7, INK); R(b, 13 * T + 2, 14 * T + 4, 5, 5, '#7a828a'); R(b, 13 * T + 7, 14 * T + 6, 5, 1, INK);
  R(b, 14 * T + 8, 14 * T + 2, 7, 7, INK); R(b, 14 * T + 9, 14 * T + 3, 5, 5, '#b5653a'); R(b, 14 * T + 14, 14 * T + 5, 1, 1, INK);
  plantAt(9, 20, false); plantAt(15, 20, true);
  // dispensador de agua (garrafon azul sobre soporte)
  { const x = 14 * T, y = 15 * T;
    R(b, x + 2, y + 8, 12, 8, INK); R(b, x + 3, y + 9, 10, 6, '#8a5a38'); R(b, x + 5, y + 10, 6, 1, '#5a3d28');
    R(b, x + 4, y - 6, 8, 14, INK); R(b, x + 5, y - 5, 6, 12, '#5cb8d9'); R(b, x + 5, y - 5, 6, 3, '#8ed4ea'); R(b, x + 7, y - 1, 2, 2, '#fffaf0'); }
  glow(13 * T + 16, 15 * T + 8, 24, '255,200,140');

  // ===== SALA DE SERVIDORES =====
  for (const [c, r] of RACKS) rackAt(c, r);
  R(b, 17 * T + 2, 17 * T + 6, 6 * T - 4, 4, '#3a424d'); for (let i = 0; i < 10; i++) R(b, 17 * T + 4 + i * 8, 17 * T + 7, 4, 2, '#e0a030');
  { const x = 22 * T, y = 19 * T; R(b, x + 1, y, 14, 32, INK); R(b, x + 2, y + 1, 12, 30, '#e8ecef'); for (let i = 0; i < 8; i++) R(b, x + 3, y + 3 + i * 3, 10, 1, '#9aa3a8'); R(b, x + 4, y + 27, 8, 2, '#6ee08a'); }
  { const x = 17 * T, y = 19 * T; R(b, x, y + 2, 2 * T, 14, INK); R(b, x + 1, y + 3, 2 * T - 2, 5, '#59636f'); R(b, x + 1, y + 8, 2 * T - 2, 7, '#3a424d');
    R(b, x + 3, y - 4, 10, 8, INK); R(b, x + 19, y - 4, 10, 8, INK); R(b, x + 5, y + 4, 6, 2, '#2f3640'); R(b, x + 21, y + 4, 6, 2, '#2f3640'); }
  officeChair(17, 20, '#2f3b4a');
  R(b, 21 * T + 2, 14 * T + 3, 12, 10, INK); R(b, 21 * T + 3, 14 * T + 4, 10, 8, '#f2d45a'); R(b, 21 * T + 7, 14 * T + 5, 2, 4, INK); R(b, 21 * T + 7, 14 * T + 10, 2, 1, INK);
  glow(19 * T + 8, 16 * T + 4, 42, '120,200,255');

  // pared entre taller y biblioteca
  frameBox(6 * T + 2, 14 * T + 3, 14, 9, '#9ccfe6'); R(b, 6 * T + 4, 14 * T + 8, 10, 3, '#4f8a5b');
}

function drawDynamic3(t) {
  // lechuza de la biblioteca
  { const ox = 6 * T + 5, oy = 15 * T - 5, blink = (t % 4) < 0.15;
    R(g, ox, oy + 1, 7, 7, INK); R(g, ox + 1, oy + 2, 5, 6, '#8a6f50'); R(g, ox, oy, 2, 2, INK); R(g, ox + 5, oy, 2, 2, INK);
    R(g, ox + 1, oy + 3, 2, 2, blink ? '#8a6f50' : '#fffaf0'); R(g, ox + 4, oy + 3, 2, 2, blink ? '#8a6f50' : '#fffaf0');
    if (!blink) { R(g, ox + 2, oy + 4, 1, 1, INK); R(g, ox + 4, oy + 4, 1, 1, INK); } R(g, ox + 3, oy + 5, 1, 1, '#e6a23a'); }
  // luces de los racks y monitores de la consola
  const busy = AGENTS.some(a => a.at && a.state === 'deploy'), sp = busy ? 3.2 : 1;
  RACKS.forEach(([c, r], n) => {
    for (let i = 0; i < 3; i++) {
      const on = Math.floor(t * (1.1 + i * 0.7) * sp + n * 1.7) % 2;
      R(g, c * T + 11, r * T + 3 + i * 4, 1, 1, on ? ((n + i) % 3 === 0 ? '#f0a060' : '#6ee08a') : '#254030');
      R(g, c * T + 13, r * T + 3 + i * 4, 1, 1, (Math.floor(t * 2 * sp + i + n) % 3 === 0) ? '#8ac2ff' : '#2b3a52');
    }
  });
  for (const mx of [17 * T + 4, 18 * T + 4]) {
    R(g, mx, 19 * T - 3, 8, 6, '#0f2a1c');
    for (let k = 0; k < 3; k++) R(g, mx + 1, 19 * T - 2 + k * 2, 2 + ((k * 5 + Math.floor(t * 3)) % 5), 1, '#6ee08a');
  }
}


// ---------- Habitaciones nuevas (2): enfermeria, jardin, sala de reuniones ----------
function drawRooms3() {
  // pasto con textura
  for (let r = 22; r <= 27; r++) for (let c = 9; c <= 15; c++) {
    const x = c * T, y = r * T;
    R(b, x + ((c * 7 + r * 3) % 12), y + ((c * 5 + r * 11) % 12), 1, 2, '#5f9a52'); R(b, x + ((c * 3 + r * 5) % 13) + 1, y + ((c * 9 + r) % 11), 1, 1, '#8cc27a');
  }

  // ===== ENFERMERIA =====
  { const x = 5 * T, y = 22 * T; R(b, x, y + 1, 3 * T, 15, INK); R(b, x + 1, y + 2, 3 * T - 2, 13, '#e8eef0'); R(b, x + 16, y + 2, 1, 13, '#9aa3a8'); R(b, x + 32, y + 2, 1, 13, '#9aa3a8');
    R(b, x + 22, y + 4, 2, 7, '#c4412f'); R(b, x + 20, y + 6, 6, 3, '#c4412f');
    R(b, x + 4, y - 3, 3, 4, '#58a96b'); R(b, x + 9, y - 2, 3, 3, '#e86a8a'); R(b, x + 36, y - 3, 4, 4, '#fffaf0'); }
  { const x = 1 * T, y = 24 * T; R(b, x, y, 2 * T, 2 * T, INK); R(b, x + 1, y + 1, 2 * T - 2, 2 * T - 2, '#c8d3d6'); R(b, x + 2, y + 2, 2 * T - 4, 2 * T - 4, '#f4f8f9');
    R(b, x + 4, y + 3, 10, 5, '#ffffff'); R(b, x + 2, y + 16, 2 * T - 4, 14, '#7fb8c9'); R(b, x + 2, y + 16, 2 * T - 4, 2, '#a9d3df'); R(b, x + 14, y + 20, 4, 1, '#fff'); R(b, x + 15, y + 19, 2, 3, '#fff'); }
  { const x = 3 * T, y = 24 * T; R(b, x + 1, y + 2, 12, 10, INK); R(b, x + 2, y + 3, 10, 8, '#0f2a1c'); R(b, x + 7, y + 12, 2, 4, '#555d68'); }
  plantAt(1, 27, false);
  { const x = 7 * T, y = 27 * T; R(b, x + 3, y + 10, 10, 5, INK); R(b, x + 4, y + 11, 8, 3, '#9aa3a8'); R(b, x + 7, y + 1, 2, 10, '#9aa3a8'); R(b, x + 5, y, 6, 3, INK); R(b, x + 6, y + 1, 4, 1, '#e8eef0'); }
  { const x = 5 * T, y = 26 * T; R(b, x + 1, y + 4, 14, 11, INK); R(b, x + 2, y + 5, 12, 3, '#e8eef0'); R(b, x + 2, y + 9, 12, 5, '#c8d3d6'); R(b, x + 3, y + 1, 2, 4, '#58a96b'); R(b, x + 7, y + 2, 2, 3, '#e86a8a'); R(b, x + 2, y + 15, 2, 1, INK); R(b, x + 12, y + 15, 2, 1, INK); }
  R(b, 6 * T + 4, 21 * T + 3, 10, 10, INK); R(b, 6 * T + 5, 21 * T + 4, 8, 8, '#ffffff'); R(b, 6 * T + 8, 21 * T + 5, 2, 6, '#c4412f'); R(b, 6 * T + 6, 21 * T + 7, 6, 2, '#c4412f');
  glow(3 * T + 8, 24 * T + 6, 26, '170,255,220');

  // ===== JARDIN =====
  for (let r = 22; r <= 27; r++) { R(b, 12 * T + 3, r * T + 3, 10, 10, '#cfc8b4'); R(b, 12 * T + 3, r * T + 12, 10, 1, '#aaa38e'); R(b, 12 * T + 3, r * T + 3, 10, 1, '#e4ddc9'); }
  { const x = 13 * T, y = 23 * T; R(b, x, y + 2, 3 * T, 2 * T - 3, INK); R(b, x + 1, y + 3, 3 * T - 2, 2 * T - 5, '#b7b09c'); R(b, x + 3, y + 5, 3 * T - 6, 2 * T - 9, '#4ea6d4'); R(b, x + 3, y + 5, 3 * T - 6, 3, '#74c2e6');
    R(b, x + 26, y + 20, 6, 3, '#3f8a52'); R(b, x + 28, y + 19, 2, 2, '#f2b8d0'); R(b, x + 8, y + 22, 4, 3, '#3f8a52'); }
  { const x = 10 * T, y = 25 * T; R(b, x + 1, y + 1, 2 * T - 2, 5, INK); R(b, x + 2, y + 2, 2 * T - 4, 3, '#8a5a38'); R(b, x + 1, y + 6, 2 * T - 2, 5, INK); R(b, x + 2, y + 7, 2 * T - 4, 3, '#a8794a');
    R(b, x + 2, y + 11, 2, 4, INK); R(b, x + 2 * T - 4, y + 11, 2, 4, INK); }
  for (const c of [9, 10, 14, 15]) {
    const x = c * T, y = 27 * T; R(b, x + 1, y + 7, 14, 9, INK); R(b, x + 2, y + 8, 12, 7, '#6b4a2f');
    for (let i = 0; i < 3; i++) { R(b, x + 3 + i * 4, y + 6, 1, 3, '#3f8a52'); R(b, x + 2 + i * 4, y + 4 + (i % 2), 3, 3, ['#e86a8a', '#f2d45a', '#b69be8', '#ffffff'][(c + i) % 4]); }
  }
  // arbol
  R(b, 10 * T - 3, 23 * T + 8, 6, 12, '#6b4a2f'); R(b, 10 * T - 3, 23 * T + 8, 2, 12, '#8a5a38');
  for (const [r, col] of [[19, INK], [17, '#2f7a45']]) { b.fillStyle = col; b.beginPath(); b.arc(10 * T, 23 * T - 1, r, 0, Math.PI * 2); b.fill(); }
  for (const [dx, dy, rr] of [[-6, -6, 6], [5, -3, 5], [-2, 4, 5]]) { b.fillStyle = '#4a9a5a'; b.beginPath(); b.arc(10 * T + dx, 23 * T - 1 + dy, rr, 0, Math.PI * 2); b.fill(); }
  R(b, 10 * T - 4, 22 * T - 1, 3, 2, '#e86a8a'); R(b, 10 * T + 6, 22 * T + 7, 3, 2, '#e86a8a');
  // reja y puerta a la calle
  R(b, 11 * T + 2, 28 * T, 3 * T - 4, T, '#3b2f25'); R(b, 11 * T + 4, 28 * T + 2, 3 * T - 8, T - 2, '#8a5a38'); R(b, 11 * T + 4, 28 * T + 2, 3 * T - 8, 2, '#a66f45'); R(b, 13 * T - 2, 28 * T + 8, 3, 3, '#e6c25a');
  { const x = 14 * T, y = 27 * T; shadowRect(x + 3, y + 14, 10, 2); }
  R(b, 13 * T + 6, 22 * T + 4, 3, 3, '#cfc8b4'); R(b, 15 * T + 3, 26 * T + 9, 4, 3, '#a8a290'); R(b, 9 * T + 6, 26 * T + 4, 3, 2, '#a8a290');

  // ===== SALA DE REUNIONES =====
  for (const c of [18, 19, 20, 21]) { officeChair(c, 23, '#3a4a60'); officeChair(c, 26, '#3a4a60'); }
  { const x = 18 * T, y = 24 * T; shadowRect(x + 1, y + 2 * T, 4 * T - 2, 2);
    R(b, x, y + 1, 4 * T, 2 * T - 1, INK); R(b, x + 1, y + 2, 4 * T - 2, 2 * T - 3, '#a8794a'); R(b, x + 2, y + 3, 4 * T - 4, 2, '#c2915a');
    R(b, x + 5, y + 10, 8, 5, '#d9dee3'); R(b, x + 6, y + 11, 6, 1, '#8a93a0'); R(b, x + 17, y + 6, 8, 5, '#d9dee3'); R(b, x + 18, y + 7, 6, 1, '#8a93a0');
    R(b, x + 30, y + 8, 4, 4, INK); R(b, x + 31, y + 9, 2, 2, '#fffaf0'); R(b, x + 44, y + 6, 4, 4, INK); R(b, x + 45, y + 7, 2, 2, '#fffaf0');
    R(b, x + 26, y + 12, 8, 6, '#3a4a60'); R(b, x + 27, y + 13, 6, 3, '#6ee08a'); }
  R(b, 20 * T + 4, 21 * T + 2, 28, 11, INK); R(b, 20 * T + 5, 21 * T + 3, 26, 9, '#1f3a5a');
  R(b, 20 * T + 8, 21 * T + 8, 3, 3, '#6ee08a'); R(b, 20 * T + 13, 21 * T + 6, 3, 5, '#8ac2ff'); R(b, 20 * T + 18, 21 * T + 5, 3, 6, '#f0c060'); R(b, 20 * T + 23, 21 * T + 7, 3, 4, '#e86a8a');
  plantAt(22, 22, true); floorLamp(17, 27);
  { const x = 22 * T, y = 27 * T; shadowRect(x + 2, y + 14, 12, 2); R(b, x + 3, y + 3, 10, 12, INK); R(b, x + 4, y + 4, 8, 10, '#e8eef0'); R(b, x + 4, y + 1, 8, 4, INK); R(b, x + 5, y + 2, 6, 2, '#7fc4e6'); R(b, x + 6, y + 8, 2, 2, '#c4412f'); R(b, x + 9, y + 8, 2, 2, '#4a8ab5'); }
  glow(17 * T + 8, 27 * T + 4, 22, '255,226,150');
}

function drawRooms4() {
  // ===== SALA DE JUEGOS =====
  // suelo con cuadros
  for (let r = 29; r <= 34; r++) for (let c = 1; c <= 15; c++) {
    R(b, c * T, r * T, T, T, (c + r) % 2 ? '#d4a574' : '#cc9e6e');
    R(b, c * T, r * T + 14, T, 2, 'rgba(0,0,0,.08)');
  }
  // arcade
  { const x = 2 * T, y = 30 * T;
    shadowRect(x + 3, y + 2 * T, 2 * T - 2, 3);
    R(b, x, y, 2 * T, 2 * T, INK); R(b, x + 1, y + 1, 2 * T - 2, 2 * T - 2, '#3a424d');
    R(b, x + 3, y + 2, 2 * T - 6, T - 2, INK); R(b, x + 4, y + 3, 2 * T - 8, T - 4, '#152a26');
    R(b, x + 6, y + 10, 20, 2, '#5a5a5a'); R(b, x + 7, y + 11, 18, 1, '#8a8a82');
    R(b, x + 5, y + 17, 22, 7, INK); R(b, x + 6, y + 18, 20, 5, '#b5453a');
    R(b, x + 9, y + 19, 2, 2, '#f2d45a'); R(b, x + 21, y + 19, 2, 2, '#6ee08a');
    R(b, x + 1, y + 2 * T - 2, 2 * T - 2, 2, '#5a5a5a'); }
  // televisor y puff de dos casillas
  { const x = 9 * T, y = 29 * T;
    R(b, x - 2, y, 2 * T + 4, 16, INK); R(b, x, y + 2, 2 * T, 11, '#8a8a82');
    R(b, x + 2, y + 3, 2 * T - 4, 8, '#14212b'); R(b, x + 3, y + 4, 2 * T - 6, 6, '#2f5f5b');
    R(b, x + 13, y + 14, 6, 3, INK); R(b, x + 14, y + 15, 4, 2, '#5a5a5a');
    // Puff redondeado, con silueta escalonada pixelada.
    R(b, x + 5, 31 * T + 2, 22, 2, INK); R(b, x + 2, 31 * T + 4, 28, 8, INK);
    R(b, x + 5, 31 * T + 12, 22, 2, INK); R(b, x + 5, 31 * T + 4, 22, 8, '#e86a8a');
    R(b, x + 7, 31 * T + 5, 18, 2, '#f2a1b4'); R(b, x + 5, 31 * T + 9, 22, 2, '#c44168');
    R(b, x + 4, 31 * T + 6, 2, 4, '#f2a1b4'); R(b, x + 26, 31 * T + 6, 2, 4, '#c44168'); }
  // mesa de ping-pong: tablero con bordes, red y patas
  { const x = 11 * T, y = 32 * T;
    R(b, x + 4, y + 20, 3, 12, INK); R(b, x + 5, y + 21, 1, 9, '#6b4a2f');
    R(b, x + 3 * T - 7, y + 20, 3, 12, INK); R(b, x + 3 * T - 6, y + 21, 1, 9, '#6b4a2f');
    R(b, x, y, 3 * T, 22, INK); R(b, x + 1, y + 1, 3 * T - 2, 20, '#fffaf0');
    R(b, x + 2, y + 2, 3 * T - 4, 18, '#1f6f4a');
    R(b, x + 3 * T / 2 - 1, y + 2, 2, 18, INK); R(b, x + 3 * T / 2, y + 2, 1, 18, '#fffaf0');
    R(b, x + 2, y + 2, 1, 18, '#fffaf0'); R(b, x + 3 * T - 3, y + 2, 1, 18, '#fffaf0');
    R(b, x + 3 * T / 2 - 2, y + 1, 4, 2, '#d6d0c0'); }
  // cartel, guirnalda y estantería baja de juguetes
  { const x = 4 * T + 3, y = 29 * T + 3;
    R(b, x, y, 22, 13, INK); R(b, x + 1, y + 1, 20, 11, '#d6b56a');
    R(b, x + 4, y + 3, 14, 7, '#6b94b5'); R(b, x + 6, y + 5, 10, 4, '#f2d45a');
    R(b, x + 10, y + 3, 2, 7, '#b5453a'); }
  for (let i = 0; i < 5; i++) {
    const x = 6 * T + 1 + i * 8, y = 29 * T + 2 + (i % 2);
    R(b, x, y, 3, 3, i % 2 ? '#e86a8a' : '#f2d45a');
    if (i < 4) R(b, x + 4, y + 3, 4, 1, INK);
  }
  { const x = 4 * T + 4, y = 30 * T + 2;
    shadowRect(x + 1, y + 12, 24, 2); R(b, x, y, 26, 12, INK);
    R(b, x + 1, y + 1, 24, 9, '#a8794a'); R(b, x + 2, y + 2, 22, 1, '#c2915a');
    R(b, x + 4, y + 5, 6, 4, '#3d6fa5'); R(b, x + 12, y + 4, 5, 5, '#f2d45a');
    R(b, x + 19, y + 5, 4, 4, '#e86a8a'); }
  // cesta de juguetes
  { const x = 5 * T, y = 33 * T;
    R(b, x + 1, y + 4, 14, 12, INK); R(b, x + 2, y + 5, 12, 10, '#b5453a');
    R(b, x + 4, y + 8, 8, 1, '#8a3030'); R(b, x + 6, y + 1, 4, 4, '#f2d45a'); } // pelota
  // alfombra compacta en la zona de la pelota, sin invadir el puff ni la mesa.
  { const x = 5 * T + 2, y = 31 * T + 2, w = 4 * T - 4, h = 3 * T - 4;
    R(b, x, y, w, h, INK); R(b, x + 1, y + 1, w - 2, h - 2, '#8cc9bf');
    R(b, x + 3, y + 3, w - 6, h - 6, '#a6d8cf');
    for (let i = 0; i < 4; i++) {
      const dx = x + 8 + i * 12;
      R(b, dx, y + 8, 2, 2, '#d6f0dc'); R(b, dx + 2, y + 10, 2, 2, '#d6f0dc');
      R(b, dx, y + 12, 2, 2, '#d6f0dc'); R(b, dx - 2, y + 10, 2, 2, '#d6f0dc');
    } }
  // rótulo ya lo pone ROOMS

  // ===== TERRAZA =====
  for (let r = 29; r <= 34; r++) for (let c = 17; c <= 22; c++) {
    R(b, c * T, r * T, T, T, (c + r) % 2 ? '#b8d4a0' : '#adc995');
  }
  // sillas y mesa baja
  { const x = 18 * T, y = 30 * T;
    R(b, x, y, 2 * T, T, INK); R(b, x + 1, y + 1, 2 * T - 2, T - 2, '#a8794a'); }
  { const x = 18 * T, y = 32 * T;
    R(b, x, y, T, T, INK); R(b, x + 1, y + 1, T - 2, T - 2, '#6b4a2f'); }
  { const x = 21 * T, y = 32 * T;
    R(b, x, y, T, T, INK); R(b, x + 1, y + 1, T - 2, T - 2, '#6b4a2f'); }
  // plantas en macetas
  plantAt(17, 29, true); plantAt(22, 29, false); plantAt(17, 34, false); plantAt(22, 34, true);
  // guirnalda de luces (estática)
  for (let i = 0; i < 6; i++) R(b, 17 * T + 4 + i * 16, 29 * T - 2, 2, 2, (i % 2) ? '#f2d45a' : '#e86a8a');
  glow(9 * T, 31 * T, 30, '255,226,150');
  glow(20 * T, 31 * T, 30, '255,226,150');
}
function drawDynamic4(t) {
  // monitor cardiaco de la enfermeria
  { const x = 3 * T + 3, y = 24 * T + 4, ph = Math.floor(t * 6) % 10;
    for (let i = 0; i < 8; i++) { const k = (i + ph) % 10; R(g, x + i, y + 3 + (k === 3 ? -2 : k === 4 ? 2 : 0), 1, 1, '#6ee08a'); } }
  // peces del estanque y ondas
  for (let i = 0; i < 2; i++) {
    const ph = t * (0.6 + i * 0.25) + i * 2.4, fx = 13 * T + 6 + Math.round((Math.sin(ph) + 1) / 2 * 30), fy = 23 * T + 9 + i * 8 + Math.round(Math.sin(t * 1.4 + i) * 1);
    const dir = Math.cos(ph) > 0 ? 1 : -1, c = ['#f08d4a', '#f6f0e0'][i];
    R(g, fx, fy, 5, 2, c); R(g, fx + (dir > 0 ? -2 : 5), fy, 2, 2, c); R(g, fx + (dir > 0 ? 4 : 0), fy, 1, 1, INK);
  }
  { const rr = (t * 6) % 8; g.strokeStyle = 'rgba(255,255,255,' + (0.5 - rr / 18).toFixed(2) + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(15 * T + 3, 24 * T + 4, rr, rr * 0.5, 0, 0, Math.PI * 2); g.stroke(); }
  // hoja que cae
  { const f = (t * 4) % 24; R(g, 10 * T + 6 + Math.round(Math.sin(t * 2) * 3), 23 * T + 10 + Math.floor(f), 2, 1, '#e0b84a'); }
  // pantalla de la sala de reuniones
  { const x = 20 * T + 5, y = 21 * T + 3, p = Math.floor(t * 1.5) % 4;
    R(g, x + 3 + p * 5, y + 6, 3, 3, '#ffffff'); R(g, x + 3 + p * 5, y + 5, 1, 1, '#ffd34a'); }
}


// ---------- Colores ----------
const GESTOR_COLOR = { 'Codex': '#2f9e63', 'OpenCode': '#3b78d4', 'Claude Code': '#d9702f' };
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
}
function hatFor(model) {
  let h = 0; for (const ch of model) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360, s = 0.62, l = 0.56;
  const k = n => (n + hue / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------- Estados ----------
const STATES = [
  { id: 'leer',     label: 'Leyendo código',            short: 'Leyendo',      tool: 'read, grep, glob' },
  { id: 'codigo',   label: 'Programando',               short: 'Programando',  tool: 'edit, write en código' },
  { id: 'docs',     label: 'Escribiendo documentación', short: 'Documentando', tool: 'write en archivos .md' },
  { id: 'comandos', label: 'Ejecutando comandos',       short: 'Comandos',     tool: 'bash, tests, build' },
  { id: 'web',      label: 'Investigando en la web',    short: 'Investigando', tool: 'websearch, webfetch' },
  { id: 'tests',    label: 'Corriendo tests o build',   short: 'Tests',        tool: 'npm test, pytest, build' },
  { id: 'deploy',   label: 'Haciendo deploy',           short: 'Deploy',       tool: 'git push, docker, ssh' },
  { id: 'delegando',label: 'Delegando a otro agente',   short: 'Delegando',    tool: 'task, subagente' },
  { id: 'listo',    label: 'Tarea terminada',           short: 'Listo',        tool: 'sesión completada' },
  { id: 'espera',   label: 'Esperando aprobación',      short: 'Esperando',    tool: 'permiso pendiente' },
  { id: 'idle',     label: 'Descansando',               short: 'Descansa',     tool: 'sesión inactiva' },
  { id: 'error',    label: 'Con un error',              short: 'Error',        tool: 'una herramienta falló', err: true },
];
const BUBBLES = {
  leer: ['libro'], codigo: ['</>'], docs: ['ABC'], comandos: ['$_'], espera: ['¿?'], tests: ['OK?'], deploy: ['PUSH'], delegando: ['@ag'], listo: ['GG!'],
  web: ['.', '..', '...'], idle: ['z', 'zZ', 'zZz'], error: ['¡!'],
};
const DEMO_WEIGHTS = { leer: 3, codigo: 4, docs: 2, comandos: 2, web: 1.5, tests: 2, deploy: 1.4, delegando: 1.2, listo: 1.6, espera: 1.5, idle: 2, error: 0.6 };

// ---------- Agentes de ejemplo ----------
const AGENTS = [
  { id: 'codex',      name: 'codex',      gestor: 'Codex',    model: 'gpt-5',         init: 'codigo' },
  { id: 'opencode-1', name: 'opencode-1', gestor: 'OpenCode', model: 'claude-sonnet', init: 'leer' },
  { id: 'opencode-2', name: 'opencode-2', gestor: 'OpenCode', model: 'deepseek',      init: 'idle' },
];
const stage = document.getElementById('stage');
const cv = document.getElementById('house');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

function modoDemo() {
  return location.protocol === 'file:' || new URLSearchParams(location.search).has('demo');
}

function etiquetaDe(a) { return a.alias || a.name; }
function actualizarEtiqueta(a) {
  if (!a.tag) return;
  const nombre = etiquetaDe(a);
  a.tag.textContent = nombre;
  a.tag.title = nombre;
}

function aplicarLookLocal(a) {
  if (!window.casaPerfiles || !modoDemo()) return false;
  const local = window.casaPerfiles.leerLocal(a);
  if (!local) return false;
  a.alias = local.alias || '';
  if (local.look) a.look = local.look;
  actualizarEtiqueta(a);
  return true;
}

function initAgent(a) {
  a.col = GESTOR_COLOR[a.gestor] || GESTOR_COLOR.OpenCode;
  a.hat = hatFor(a.model || '');
  a.hatStyle = hatStyleFor(a.model || '');
  a.x = 0; a.y = 0; a.path = []; a.dir = 'down'; a.state = a.state || 'idle';
  a.spot = null; a.at = true; a.next = 0;
  a.profileKey = a.profileKey || '';
  a.projectName = a.projectName || '';
  a.alias = a.alias || '';
  a.look = a.look || null;
  aplicarLookLocal(a);
  a.tag = document.createElement('div'); a.tag.className = 'tag';
  actualizarEtiqueta(a); a.tag.style.background = '#fffaf0'; a.tag.style.color = '#2b2420';
  a.tag.style.border = '2px solid ' + a.col;
  a.bub = document.createElement('div'); a.bub.className = 'bubble'; a.bub.hidden = true;
  stage.append(a.tag, a.bub);
}
for (const a of AGENTS) initAgent(a);

// perfiles.js carga después de app.js: al terminar, refresca los looks locales.
window.casaRecargarLooks = function () {
  if (!modoDemo()) return;
  for (const a of AGENTS) {
    const local = window.casaPerfiles?.leerLocal(a);
    if (!local) continue;
    a.alias = local.alias || '';
    a.look = local.look || null;
    actualizarEtiqueta(a);
  }
  renderUI();
};
for (const m of ROOMS) {
  const el = document.createElement('div'); el.className = 'room-label'; el.textContent = m.name;
  el.style.left = ((m.x0 * T + 3) / (COLS * T) * 100) + '%';
  el.style.top = (((m.y0 - 1) * T + 8) / (ROWS * T) * 100) + '%';
  el.style.transform = 'translateY(-50%)';
  stage.append(el);
}

// ---------- Logica de movimiento ----------
const ROOM_CAPACITY = 3;
function roomCapacity(roomId) { return roomId === 'juegos' ? 5 : ROOM_CAPACITY; }
const WAITING_SPOTS = [[10, 9], [11, 9], [12, 9], [13, 9], [10, 10], [13, 10]];
const WAITING_CAPACITY = 4;

function roomOccupancy(roomId, exclude) {
  return AGENTS.reduce((count, agent) => {
    if (agent === exclude || !agent.spot) return count;
    const room = roomAt(agent.spot[0], agent.spot[1]);
    return room && room.id === roomId ? count + 1 : count;
  }, 0);
}

function freeSpot(a, state) {
  const taken = new Set(AGENTS.filter(o => o !== a && o.spot).map(o => o.spot.join(',')));
  const prefs = SPOTS[state] || [];
  const preferred = prefs.filter(s => !taken.has(s.join(',')) && roomOccupancy(roomAt(s[0], s[1])?.id, a) < roomCapacity(roomAt(s[0], s[1])?.id));
  preferred.sort((p, q) => Math.abs(p[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(p[1] - (a.path.length ? a.path[0][1] : Math.round(a.y))) - (Math.abs(q[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(q[1] - (a.path.length ? a.path[0][1] : Math.round(a.y)))));
  if (preferred.length) return preferred[0];

  const waiting = WAITING_SPOTS.filter(s => !taken.has(s.join(',')) && roomOccupancy('recibidor', a) < WAITING_CAPACITY);
  waiting.sort((p, q) => Math.abs(p[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(p[1] - (a.path.length ? a.path[0][1] : Math.round(a.y))) - (Math.abs(q[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(q[1] - (a.path.length ? a.path[0][1] : Math.round(a.y)))));
  if (waiting.length) return waiting[0];

  const candidates = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (blocked[r][c] || taken.has(c + ',' + r)) continue;
      const room = roomAt(c, r);
      if (room && roomOccupancy(room.id, a) >= roomCapacity(room.id)) continue;
      candidates.push([c, r]);
    }
  }
  candidates.sort((p, q) => Math.abs(p[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(p[1] - (a.path.length ? a.path[0][1] : Math.round(a.y))) - (Math.abs(q[0] - (a.path.length ? a.path[0][0] : Math.round(a.x))) + Math.abs(q[1] - (a.path.length ? a.path[0][1] : Math.round(a.y)))));
  return candidates[0] || null;
}
function assign(a, state, snap) {
  a.pausa = null; a.micro = null; a.ocio = null; a._faseIdle = null;
  const spot = freeSpot(a, state);
  if (!spot) return false;
  if (snap) {
    a.state = state; a.since = performance.now(); a.spot = spot;
    a.x = spot[0]; a.y = spot[1]; a.path = []; a.at = true; a.dir = FACING[state];
    return true;
  }
  const moving = a.path.length > 0;
  const start = moving ? a.path[0] : [Math.round(a.x), Math.round(a.y)];
  const p = findPath(start, spot);
  if (!p) return false;
  a.state = state; a.since = performance.now(); a.spot = spot;
  a.path = moving ? [a.path[0], ...p] : p;
  a.at = a.path.length === 0;
  if (a.at) a.dir = FACING[state];
  return true;
}
function setAgentState(id, state) {
  const a = AGENTS.find(o => o.id === id);
  if (!a || !STATES.some(s => s.id === state)) return false;
  const ok = assign(a, state, false);
  a.next = performance.now() / 1000 + 12;
  renderUI();
  return ok;
}
window.setAgentState = setAgentState;
window.__vidaHooks = { findPath, assign, freeSpot, SPOTS, AGENTS, STATES, FACING, roomAt, blocked, COLS, ROWS, T, roomCapacity };

// ---------- Modo en vivo ----------
function applyAgentSnapshot(payload) {
  if (!payload || !Array.isArray(payload.agents)) return false;
  const incoming = payload.agents.slice(0, MAX_VISIBLE_AGENTS).filter(item => item && item.id);
  const ids = new Set(incoming.map(item => String(item.id)));

  for (let i = AGENTS.length - 1; i >= 0; i--) {
    const a = AGENTS[i];
    if (!ids.has(a.id)) {
      a.tag?.remove(); a.bub?.remove();
      if (selected === a.id) selected = null;
      AGENTS.splice(i, 1);
    }
  }

  for (const item of incoming) {
    const id = String(item.id);
    const state = STATES.some(s => s.id === item.state) ? item.state : 'idle';
    let a = AGENTS.find(o => o.id === id);
    if (!a) {
      a = {
        id, name: item.name || id, gestor: item.manager || 'OpenCode',
        model: item.model || 'modelo', state: 'idle',
        profileKey: item.profileKey || '', projectName: item.projectName || '',
        alias: item.alias || '', look: item.look || null,
      };
      initAgent(a);
      AGENTS.push(a);
      const ok = assign(a, state, true);
      if (!ok) { a.state = state; a.since = performance.now(); a.at = true; a.dir = FACING[state]; }
      continue;
    }

    const gestor = item.manager || a.gestor;
    const model = item.model || a.model;
    const label = item.name || a.name;
    a.profileKey = item.profileKey || a.profileKey || '';
    a.projectName = item.projectName || '';
    a.alias = item.alias || '';
    a.look = item.look || null;
    if (modoDemo()) aplicarLookLocal(a);
    const changed = a.name !== label || a.gestor !== gestor || a.model !== model
      || a.tag.textContent !== etiquetaDe(a);
    a.name = label; a.gestor = gestor; a.model = model;
    if (changed) {
      a.col = GESTOR_COLOR[a.gestor] || GESTOR_COLOR.OpenCode;
      a.hat = hatFor(a.model);
      a.hatStyle = hatStyleFor(a.model);
      actualizarEtiqueta(a);
      if (a.tag) a.tag.style.border = '2px solid ' + a.col;
    }
    if (state !== a.state) {
      const ok = assign(a, state, false);
      if (!ok) {
        a.state = state; a.since = performance.now(); a.spot = null;
        a.at = true; a.dir = FACING[state];
      }
    }
  }

  if (!selected || !AGENTS.some(a => a.id === selected)) selected = AGENTS[0]?.id || null;
  renderUI();
  return true;
}
window.applyAgentSnapshot = applyAgentSnapshot;

function update(dt, t) {
  if (window.vida && typeof window.vida.beforeUpdate === 'function') window.vida.beforeUpdate(dt, t);
  for (const a of AGENTS) {
    // pausa temporal (caricia, etc.) respeta el movimiento
    if (a.pausa && t > a.pausa.hasta) a.pausa = null;
    if (a.path.length && !a.pausa) {
      const [tx, ty] = a.path[0];
      const dx = tx - a.x, dy = ty - a.y, dist = Math.hypot(dx, dy), step = 4.6 * dt;
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (dist > 0) a.dir = dy > 0 ? 'down' : 'up';
      if (dist <= step) {
        a.x = tx; a.y = ty; a.path.shift();
        if (!a.path.length) { a.at = true; a.dir = FACING[a.state]; }
      } else { a.x += dx / dist * step; a.y += dy / dist * step; }
    }
    if (demoOn && t > a.next) {
      a.next = t + 5 + Math.random() * 6;
      let tot = 0; for (const s of STATES) tot += DEMO_WEIGHTS[s.id];
      let r = Math.random() * tot, pick = 'idle';
      for (const s of STATES) { r -= DEMO_WEIGHTS[s.id]; if (r <= 0) { pick = s.id; break; } }
      if (pick !== a.state) {
        if (pick === 'idle') a.next = t + 40 + Math.random() * 30;
        assign(a, pick, false); renderUI();
      }
    }
  }
  if (window.vida && typeof window.vida.update === 'function') window.vida.update(dt, t);
}

// ---------- Dibujo de agentes ----------
const SKIN = '#f6dcc2', SKIN_DK = '#e0bfa0', HAIR = '#5a3d2b', PANTS = '#3a4058';
function hatStyleFor(model) { let h = 7; for (const ch of model) h = (h * 17 + ch.charCodeAt(0)) >>> 0; return h % 3; }

function lookDe(a) { return a.look && typeof a.look === 'object' ? a.look : {}; }
function accesoriosDe(a) {
  const look = lookDe(a);
  return Array.isArray(look.accesorios) ? look.accesorios : [];
}
const CAT_DIBUJO = globalThis.CATALOGO || { accesorios: [], ranuras: [] };
const RANURA_POR_ACC = new Map((CAT_DIBUJO.accesorios || []).map((item) => [item.id, item.ranura]));
const MENOS_MOVIMIENTO = typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function accesorioEn(a, ranura) {
  for (const id of accesoriosDe(a)) if (RANURA_POR_ACC.get(id) === ranura) return id;
  return null;
}
function tieneAccesorio(a, id) { return accesoriosDe(a).includes(id); }
function tieneLook(a) {
  const look = lookDe(a);
  return Boolean(look.camisa || look.piel || look.pelo || look.pantalon || look.gorroColor
    || (look.gorro && look.gorro !== 'auto')
    || (look.peinado && look.peinado !== 'auto')
    || accesoriosDe(a).length);
}
function estiloGorro(a) {
  const gorro = lookDe(a).gorro || 'auto';
  if (gorro === 'auto') return a.hatStyle;
  if (gorro === 'pompon') return 0;
  if (gorro === 'gorra') return 1;
  if (gorro === 'helice') return 2;
  return gorro;
}
function llevaGorro(a) { return estiloGorro(a) !== 'ninguno'; }
function lookPelo(a) { return lookDe(a).pelo || HAIR; }
function lookPiel(a) { return lookDe(a).piel || SKIN; }
function acentoDe(a, camisa) { return lookDe(a).gorroColor || shade(camisa, -0.22); }

// ---------- Espalda: capa ----------
function drawCapaFondo(a, x, sy, hb, t, gx, camisa, walking, fase) {
  if (!tieneAccesorio(a, 'capa')) return;
  const look = lookDe(a);
  const col = look.gorroColor || shade(camisa, -0.22);
  const dk = shade(col, -0.35), lt = shade(col, 0.25);
  const reduce = MENOS_MOVIMIENTO;
  const sway = walking && !reduce ? (fase ? 1 : -1) : 0;
  const up = a.dir === 'up', down = a.dir === 'down', left = a.dir === 'left';
  const back = left ? x + 13 : x + 1;
  if (up) {
    R(gx, x + 2, sy + 15 + sway, 12, 4, INK);
    R(gx, x + 3, sy + 15 + sway, 10, 3, col);
    R(gx, x + 3, sy + 16 + sway, 10, 2, dk);
    R(gx, x + 6, sy + 15 + sway, 4, 1, lt);
  } else if (down) {
    R(gx, x + 2, sy + 10, 2, 8, INK); R(gx, x + 12, sy + 10, 2, 8, INK);
    R(gx, x + 3, sy + 11, 1, 6, col); R(gx, x + 13, sy + 11, 1, 6, col);
    R(gx, x + 2, sy + 18, 2, 1, INK); R(gx, x + 12, sy + 18, 2, 1, INK);
  } else {
    R(gx, back, sy + 10, 3, 9, INK);
    R(gx, back + 1, sy + 11, 1, 7, col);
    R(gx, back + 1, sy + 17, 1, 1, dk);
  }
}

function drawCapaHombros(a, x, sy, hb, t, gx, camisa, walking, fase) {
  if (!tieneAccesorio(a, 'capa')) return;
  const look = lookDe(a);
  const col = look.gorroColor || shade(camisa, -0.22);
  const dk = shade(col, -0.35), lt = shade(col, 0.25);
  const reduce = MENOS_MOVIMIENTO;
  const sway = walking && !reduce ? (fase ? 1 : -1) : 0;
  const up = a.dir === 'up', down = a.dir === 'down';
  if (up) {
    R(gx, x + 2, sy + 9, 12, 8, INK);
    R(gx, x + 3, sy + 9, 10, 7, col);
    R(gx, x + 3, sy + 9, 10, 1, lt);
    R(gx, x + 7, sy + 9, 2, 7, dk);
    R(gx, x + 2 + sway, sy + 16, 3, 2, INK);
    R(gx, x + 11 + sway, sy + 16, 3, 2, INK);
  } else if (down) {
    R(gx, x + 3, sy + 9, 2, 2, INK); R(gx, x + 4, sy + 9, 1, 1, col);
    R(gx, x + 11, sy + 9, 2, 2, INK); R(gx, x + 11, sy + 9, 1, 1, col);
  } else {
    const back = a.dir === 'left' ? x + 13 : x + 1;
    R(gx, back, sy + 9, 3, 8, INK);
    R(gx, back + 1, sy + 10, 1, 6, col);
    R(gx, back + 1, sy + 15, 1, 1, dk);
  }
}

// ---------- Espalda: alas ----------
function drawAlas(a, x, sy, hb, t, gx, walking, fase) {
  if (!tieneAccesorio(a, 'alas')) return;
  const reduce = MENOS_MOVIMIENTO;
  const flut = walking && !reduce ? (fase ? 1 : 0) : 0;
  const base = '#f4f7ff', dk = '#c9d6ea', lt = '#ffffff';
  const up = a.dir === 'up', down = a.dir === 'down', left = a.dir === 'left';
  if (up) {
    R(gx, x - 1, sy + 9 - flut, 3, 6, INK); R(gx, x, sy + 10 - flut, 2, 4, base); R(gx, x + 1, sy + 10 - flut, 1, 2, lt);
    R(gx, x + 14, sy + 9 - flut, 3, 6, INK); R(gx, x + 14, sy + 10 - flut, 2, 4, base); R(gx, x + 15, sy + 10 - flut, 1, 2, lt);
    R(gx, x - 2, sy + 11, 2, 3, INK); R(gx, x + 16, sy + 11, 2, 3, INK);
  } else if (down) {
    R(gx, x + 0, sy + 11, 2, 4, INK); R(gx, x + 0, sy + 12, 1, 2, base);
    R(gx, x + 14, sy + 11, 2, 4, INK); R(gx, x + 15, sy + 12, 1, 2, base);
  } else {
    const bx = left ? x + 13 : x + 1;
    R(gx, bx, sy + 8 - flut, 3, 7, INK);
    R(gx, bx + 1, sy + 9 - flut, 2, 5, base);
    R(gx, bx + 2, sy + 9 - flut, 1, 2, lt);
  }
}

// ---------- Espalda: mochila ----------
function drawMochila(a, x, sy, hb, t, gx) {
  if (!tieneAccesorio(a, 'mochila')) return;
  const base = '#6b4f36', dk = '#4a3625', lt = '#8a6a49', bucle = '#d6a93c';
  const up = a.dir === 'up', down = a.dir === 'down', left = a.dir === 'left';
  if (up) {
    R(gx, x + 4, sy + 9, 8, 8, INK);
    R(gx, x + 5, sy + 10, 6, 6, base);
    R(gx, x + 5, sy + 10, 6, 1, lt);
    R(gx, x + 5, sy + 13, 6, 2, dk);
    R(gx, x + 7, sy + 11, 2, 1, bucle);
    R(gx, x + 4, sy + 8, 1, 1, INK); R(gx, x + 11, sy + 8, 1, 1, INK);
  } else if (down) {
    R(gx, x + 4, sy + 9, 2, 1, INK); R(gx, x + 10, sy + 9, 2, 1, INK);
    R(gx, x + 5, sy + 10, 1, 5, INK); R(gx, x + 10, sy + 10, 1, 5, INK);
    R(gx, x + 5, sy + 10, 1, 1, base); R(gx, x + 10, sy + 10, 1, 1, base);
    R(gx, x + 3, sy + 11, 1, 2, base); R(gx, x + 12, sy + 11, 1, 2, base);
    R(gx, x + 4, sy + 9, 1, 1, bucle);
  } else {
    const bx = left ? x + 12 : x + 2;
    R(gx, bx, sy + 9, 3, 8, INK);
    R(gx, bx + 1, sy + 10, 1, 6, base);
    R(gx, bx + 1, sy + 12, 1, 1, bucle);
    R(gx, bx + 1, sy + 15, 1, 1, dk);
  }
}

// ---------- Torso: prendas ----------
function drawTorsoPrenda(a, x, sy, hb, t, gx) {
  const torso = accesorioEn(a, 'torso');
  if (!torso) return;
  const up = a.dir === 'up', down = a.dir === 'down';
  if (torso === 'bata') {
    const base = '#f0ebe0', dk = '#d8d1c3', lt = '#ffffff';
    if (up) {
      R(gx, x + 3, sy + 10, 10, 6, INK); R(gx, x + 4, sy + 10, 8, 5, base);
      R(gx, x + 4, sy + 12, 8, 1, dk); R(gx, x + 7, sy + 10, 2, 5, dk);
    } else if (down) {
      R(gx, x + 3, sy + 10, 3, 6, INK); R(gx, x + 4, sy + 10, 2, 5, base);
      R(gx, x + 10, sy + 10, 3, 6, INK); R(gx, x + 10, sy + 10, 2, 5, base);
      R(gx, x + 6, sy + 10, 1, 2, INK); R(gx, x + 9, sy + 10, 1, 2, INK);
      R(gx, x + 4, sy + 14, 2, 1, dk); R(gx, x + 10, sy + 14, 2, 1, dk);
    } else {
      const left = a.dir === 'left';
      const front = left ? x + 10 : x + 3;
      R(gx, front, sy + 10, 3, 6, INK); R(gx, front + 1, sy + 10, 1, 5, base);
      R(gx, front === x + 10 ? x + 3 : x + 10, sy + 10, 3, 6, INK); R(gx, front === x + 10 ? x + 4 : x + 10, sy + 10, 1, 5, base);
    }
  } else if (torso === 'delantal') {
    const base = '#b8753f', dk = '#8a5a30', lt = '#d69b6a';
    if (up) {
      R(gx, x + 5, sy + 9, 1, 1, INK); R(gx, x + 10, sy + 9, 1, 1, INK);
      R(gx, x + 4, sy + 13, 8, 1, INK); R(gx, x + 5, sy + 13, 6, 1, base);
    } else if (down) {
      R(gx, x + 6, sy + 9, 4, 1, INK); R(gx, x + 7, sy + 9, 2, 1, base);
      R(gx, x + 5, sy + 10, 6, 5, INK); R(gx, x + 6, sy + 10, 4, 4, base);
      R(gx, x + 6, sy + 11, 4, 1, lt); R(gx, x + 7, sy + 13, 2, 1, dk);
      R(gx, x + 5, sy + 10, 1, 1, base); R(gx, x + 10, sy + 10, 1, 1, base);
    } else {
      const front = a.dir === 'left' ? x + 10 : x + 3;
      R(gx, front + 1, sy + 9, 1, 1, INK);
      R(gx, front, sy + 10, 3, 5, INK); R(gx, front + 1, sy + 10, 1, 4, base);
      R(gx, front + 1, sy + 12, 1, 1, dk);
    }
  } else if (torso === 'chaleco') {
    const base = '#3f6b5a', dk = '#2b4a3e', lt = '#5f9a83';
    if (up) {
      R(gx, x + 4, sy + 10, 8, 6, INK); R(gx, x + 5, sy + 10, 6, 5, base);
      R(gx, x + 7, sy + 10, 2, 5, dk); R(gx, x + 5, sy + 10, 6, 1, lt);
    } else if (down) {
      R(gx, x + 3, sy + 10, 3, 6, INK); R(gx, x + 4, sy + 10, 2, 5, base);
      R(gx, x + 10, sy + 10, 3, 6, INK); R(gx, x + 10, sy + 10, 2, 5, base);
      R(gx, x + 4, sy + 11, 2, 1, lt); R(gx, x + 10, sy + 11, 2, 1, lt);
      R(gx, x + 6, sy + 12, 4, 1, dk);
    } else {
      const front = a.dir === 'left' ? x + 10 : x + 3;
      R(gx, front, sy + 10, 3, 6, INK); R(gx, front + 1, sy + 10, 1, 5, base);
      R(gx, front + 1, sy + 10, 1, 1, lt);
    }
  }
}

// ---------- Manos ----------
function drawManos(a, x, sy, hb, t, gx, al, walking) {
  const manos = accesorioEn(a, 'manos');
  const reduce = MENOS_MOVIMIENTO;
  // reloj: mano izquierda
  if (manos === 'reloj') {
    const y = sy + 14 + al;
    R(gx, x + 1, y, 2, 1, '#b08a2a');
    R(gx, x + 2, y - 1, 2, 2, INK);
    R(gx, x + 2, y - 1, 1, 1, '#f4f0e0');
    R(gx, x + 2, y, 1, 1, '#e8c54a');
  }
  // guante: mano derecha
  if (manos === 'guante') {
    const y = sy + 14 - al;
    const col = '#b5453a', lt = '#e07a62';
    R(gx, x + 12, y - 1, 4, 3, INK);
    R(gx, x + 13, y - 1, 2, 2, col);
    R(gx, x + 13, y - 1, 1, 1, lt);
    R(gx, x + 12, y - 2, 4, 1, '#e8e2d0');
  }
}

// ---------- Cuello ----------
function drawCuello(a, x, sy, hb, t, gx, camisa, walking, fase) {
  const cuello = accesorioEn(a, 'cuello');
  if (!cuello) return;
  const look = lookDe(a);
  const col = look.gorroColor || (cuello === 'bufanda' ? '#c4412f' : '#e86a8a');
  const reduce = MENOS_MOVIMIENTO;
  const sway = walking && !reduce ? (fase ? 1 : -1) : 0;
  const up = a.dir === 'up', down = a.dir === 'down', left = a.dir === 'left';
  const y = sy + 10 + hb;
  if (cuello === 'bufanda') {
    const base = col, dk = shade(col, -0.3), lt = shade(col, 0.3);
    R(gx, x + 4, y, 8, 1, INK); R(gx, x + 5, y, 6, 1, base);
    R(gx, x + 4, y + 1, 8, 1, INK); R(gx, x + 5, y + 1, 6, 1, dk);
    if (down) {
      R(gx, x + 9 + sway, y + 1, 2, 4, INK); R(gx, x + 9 + sway, y + 1, 1, 3, base); R(gx, x + 10 + sway, y + 4, 1, 1, lt);
    } else if (up) {
      R(gx, x + 5 + sway, y + 1, 2, 4, INK); R(gx, x + 5 + sway, y + 1, 1, 3, base); R(gx, x + 6 + sway, y + 4, 1, 1, lt);
    } else {
      const front = left ? x + 9 : x + 5;
      R(gx, front + sway, y + 1, 2, 4, INK); R(gx, front + sway, y + 1, 1, 3, base); R(gx, front + sway + 1, y + 4, 1, 1, lt);
    }
  } else if (cuello === 'mono') {
    const base = '#e86a8a', dk = shade(base, -0.3), lt = shade(base, 0.3);
    if (up) {
      R(gx, x + 5, y, 6, 1, base);
    } else {
      R(gx, x + 6, y, 1, 1, INK); R(gx, x + 7, y, 1, 1, base); R(gx, x + 8, y, 1, 1, INK);
      R(gx, x + 5, y + 1, 2, 1, base); R(gx, x + 6, y + 1, 1, 1, dk);
      R(gx, x + 9, y + 1, 2, 1, base); R(gx, x + 9, y + 1, 1, 1, dk);
      if (left) { R(gx, x + 9, y, 2, 1, base); } else { R(gx, x + 5, y, 2, 1, base); }
    }
  } else if (cuello === 'corbata') {
    const base = '#8a3a3a', dk = shade(base, -0.35), lt = shade(base, 0.25);
    if (up) {
      R(gx, x + 5, y, 6, 1, base); R(gx, x + 6, y, 4, 1, dk);
    } else if (down) {
      R(gx, x + 7, y, 2, 1, INK); R(gx, x + 7, y, 1, 1, base);
      R(gx, x + 7, y + 1, 2, 4, INK); R(gx, x + 7, y + 1, 1, 3, base);
      R(gx, x + 7, y + 4, 2, 1, INK); R(gx, x + 7, y + 4, 1, 1, dk);
      R(gx, x + 8, y + 1, 1, 1, lt);
    } else {
      const front = left ? x + 9 : x + 5;
      R(gx, front, y, 2, 1, base);
      R(gx, front, y + 1, 2, 3, INK); R(gx, front, y + 1, 1, 2, base);
    }
  } else if (cuello === 'collar') {
    const base = '#e8c54a', dk = '#a8842a', lt = '#fff3c4';
    if (up) {
      R(gx, x + 5, y, 6, 1, base); R(gx, x + 7, y, 2, 1, dk);
    } else {
      R(gx, x + 4, y, 1, 1, base); R(gx, x + 11, y, 1, 1, base);
      R(gx, x + 5, y + 1, 1, 1, base); R(gx, x + 10, y + 1, 1, 1, base);
      R(gx, x + 7, y + 2, 2, 1, INK); R(gx, x + 7, y + 2, 1, 1, base);
      const brillo = !reduce && Math.floor(t * 0.8) % 4 === 0;
      if (brillo) R(gx, x + 8, y + 2, 1, 1, lt);
    }
  }
}

// ---------- Cara ----------
function drawCara(a, x, sy, hb, t, gx) {
  const cara = accesorioEn(a, 'cara');
  if (!cara) return;
  const look = lookDe(a);
  const up = a.dir === 'up', down = a.dir === 'down', left = a.dir === 'left';
  const y = sy + 5 + hb;
  const ey = sy + 6 + hb;
  if (cara === 'lentes' || cara === 'lentes_redondos') {
    if (up) {
      R(gx, x + 4, ey, 8, 1, INK);
      return;
    }
    const redondos = cara === 'lentes_redondos';
    const lens = (lx) => {
      if (redondos) {
        R(gx, lx + 1, y, 2, 1, INK);
        R(gx, lx, y + 1, 1, 1, INK); R(gx, lx + 3, y + 1, 1, 1, INK);
        R(gx, lx + 1, y + 2, 2, 1, INK);
        R(gx, lx + 1, y + 1, 2, 1, '#a9d8ee');
        R(gx, lx + 1, y + 1, 1, 1, '#ffffff');
      } else {
        R(gx, lx, y, 4, 4, INK);
        R(gx, lx + 1, y + 1, 2, 2, '#2b2b33');
        R(gx, lx + 1, y + 1, 1, 1, '#ffffff');
      }
    };
    if (down) {
      lens(x + 4); lens(x + 8);
      R(gx, x + 7, y + 1, 2, 1, INK);
      R(gx, x + 3, y + 1, 1, 1, INK); R(gx, x + 12, y + 1, 1, 1, INK);
    } else {
      const front = left ? x + 4 : x + 8;
      lens(front);
      const back = left ? x + 9 : x + 3;
      R(gx, back, y + 1, 4, 1, INK);
    }
  } else if (cara === 'antifaz') {
    if (up) {
      R(gx, x + 4, ey, 8, 1, '#3b2a55');
      return;
    }
    const base = '#3b2a55', lt = '#6a4c94';
    if (down) {
      R(gx, x + 3, y, 10, 3, INK);
      R(gx, x + 4, y, 8, 2, base);
      R(gx, x + 4, y + 2, 8, 1, INK);
      R(gx, x + 5, y, 2, 1, lt); R(gx, x + 9, y, 2, 1, lt);
      R(gx, x + 4, y + 1, 3, 1, '#1b1524'); R(gx, x + 9, y + 1, 3, 1, '#1b1524');
      R(gx, x + 2, y + 1, 2, 1, INK); R(gx, x + 12, y + 1, 2, 1, INK);
    } else {
      const front = left ? x + 4 : x + 6;
      R(gx, front, y, 6, 3, INK); R(gx, front + 1, y, 4, 2, base);
      R(gx, front + 1, y + 2, 4, 1, INK);
      R(gx, front - 2, y + 1, 3, 1, INK);
    }
  } else if (cara === 'parche') {
    if (up) {
      R(gx, x + 4, ey, 8, 1, INK);
      return;
    }
    if (down) {
      R(gx, x + 4, y, 4, 4, INK); R(gx, x + 5, y + 1, 2, 2, '#1b1524');
      R(gx, x + 8, y, 1, 1, '#1b1524');
      R(gx, x + 7, y - 1, 4, 1, INK); R(gx, x + 8, y, 3, 1, INK);
    } else {
      const front = left ? x + 4 : x + 8;
      R(gx, front, y, 4, 4, INK); R(gx, front + 1, y + 1, 2, 2, '#1b1524');
      R(gx, front + 4, y - 1, 3, 1, INK);
    }
  } else if (cara === 'bigote') {
    if (up) return;
    const base = lookPelo(a), dk = shade(base, -0.35);
    if (down) {
      R(gx, x + 5, ey + 2, 6, 1, INK);
      R(gx, x + 5, ey + 1, 6, 1, base);
      R(gx, x + 4, ey, 1, 1, base); R(gx, x + 11, ey, 1, 1, base);
    } else {
      const front = left ? x + 4 : x + 9;
      R(gx, front, ey + 1, 3, 1, base);
      R(gx, front - 1, ey, 1, 1, base);
    }
  } else if (cara === 'barba') {
    if (up) return;
    const base = lookPelo(a), dk = shade(base, -0.35);
    if (down) {
      R(gx, x + 3, ey + 2, 10, 1, INK);
      R(gx, x + 4, ey + 2, 8, 2, base);
      R(gx, x + 5, ey + 4, 6, 1, INK);
      R(gx, x + 3, ey, 1, 3, base); R(gx, x + 12, ey, 1, 3, base);
      R(gx, x + 6, ey + 2, 4, 1, dk);
    } else {
      const front = left ? x + 9 : x + 3;
      R(gx, front, ey + 2, 4, 2, INK); R(gx, front + 1, ey + 2, 2, 1, base);
      R(gx, front + 1, ey + 3, 2, 1, base);
    }
  }
}


function drawHat(a, x, sy, hb, t, gx = g, flotar = 0) {
  const look = lookDe(a);
  const hat = look.gorroColor || a.hat, hatDk = shade(hat, -0.32), hatLt = shade(hat, 0.38);
  const estilo = estiloGorro(a);
  if (estilo === 'ninguno') return;
  if (estilo === 'corona') {
    R(gx, x + 2, sy + 1 + hb, 12, 3, INK); R(gx, x + 3, sy + 1 + hb, 10, 2, hat);
    R(gx, x + 3, sy + 1 + hb, 10, 1, hatLt); R(gx, x + 8, sy + 2 + hb, 1, 1, '#e86a8a');
    R(gx, x + 3, sy - 1 + hb, 2, 2, INK); R(gx, x + 4, sy - 1 + hb, 1, 2, hat);
    R(gx, x + 7, sy - 2 + hb, 2, 3, INK); R(gx, x + 8, sy - 2 + hb, 1, 3, hat);
    R(gx, x + 11, sy - 1 + hb, 2, 2, INK); R(gx, x + 11, sy - 1 + hb, 1, 2, hat);
    return;
  }
  if (estilo === 'copa') {
    R(gx, x + 2, sy + 2 + hb, 12, 2, INK); R(gx, x + 3, sy + 2 + hb, 10, 1, hatDk);
    R(gx, x + 5, sy - 3 + hb, 6, 6, INK); R(gx, x + 6, sy - 3 + hb, 4, 5, hat);
    R(gx, x + 6, sy - 3 + hb, 4, 1, hatLt); R(gx, x + 6, sy + 1 + hb, 4, 1, '#2b2b33');
    return;
  }
  if (estilo === 'orejas') {
    R(gx, x + 3, sy + 2 + hb, 4, 2, INK); R(gx, x + 4, sy + 1 + hb, 2, 2, INK);
    R(gx, x + 4, sy + 2 + hb, 1, 1, hat); R(gx, x + 4, sy + 1 + hb, 1, 1, hatLt);
    R(gx, x + 9, sy + 2 + hb, 4, 2, INK); R(gx, x + 10, sy + 1 + hb, 2, 2, INK);
    R(gx, x + 11, sy + 2 + hb, 1, 1, hat); R(gx, x + 11, sy + 1 + hb, 1, 1, hatLt);
    return;
  }
  if (estilo === 'flor') {
    const fx = a.dir === 'left' ? x + 9 : x + 10;
    const fy = sy - 1 + hb;
    R(gx, fx, fy, 4, 4, INK);
    R(gx, fx + 1, fy, 2, 1, '#e86a8a'); R(gx, fx + 1, fy + 3, 2, 1, '#e86a8a');
    R(gx, fx, fy + 1, 1, 2, '#e86a8a'); R(gx, fx + 3, fy + 1, 1, 2, '#e86a8a');
    R(gx, fx + 1, fy + 1, 2, 2, '#f0c060');
    R(gx, fx + 1, fy + 1, 1, 1, '#fff3c4');
    R(gx, fx + 2, fy + 2, 1, 1, '#d6a93c');
    return;
  }
  if (estilo === 'orejas_conejo') {
    const ears = [[x + 4, sy - 4 + hb], [x + 10, sy - 4 + hb]];
    for (const [ex, ey] of ears) {
      R(gx, ex, ey, 3, 6, INK);
      R(gx, ex + 1, ey + 1, 1, 4, hat);
      R(gx, ex + 1, ey + 1, 1, 1, hatLt);
      R(gx, ex + 2, ey + 1, 1, 4, shade(hat, -0.25));
    }
    if (a.dir === 'left' || a.dir === 'right') {
      const ex = a.dir === 'left' ? x + 8 : x + 5;
      R(gx, ex, sy - 5 + hb, 2, 7, INK);
      R(gx, ex + 1, sy - 4 + hb, 1, 5, hat);
    }
    return;
  }
  if (estilo === 'aureola') {
    const ay = sy - 3 + hb + flotar;
    R(gx, x + 3, ay, 10, 1, INK);
    R(gx, x + 4, ay, 8, 1, '#e8c54a');
    R(gx, x + 3, ay + 1, 10, 1, INK);
    R(gx, x + 4, ay + 1, 8, 1, '#f0d878');
    R(gx, x + 6, ay + 1, 4, 1, '#fff3c4');
    R(gx, x + 4, ay - 1, 1, 1, '#fff3c4');
    return;
  }
  if (estilo === 'casco') {
    R(gx, x + 4, sy - 2 + hb, 8, 2, INK);
    R(gx, x + 5, sy - 2 + hb, 6, 1, hatLt);
    R(gx, x + 2, sy - 1 + hb, 12, 4, INK);
    R(gx, x + 3, sy - 1 + hb, 10, 3, hat);
    R(gx, x + 3, sy + 1 + hb, 10, 1, hatDk);
    R(gx, x + 1, sy + 3 + hb, 14, 2, INK);
    R(gx, x + 2, sy + 3 + hb, 12, 1, hatDk);
    R(gx, x + 10, sy + hb, 2, 2, INK); R(gx, x + 10, sy + hb, 1, 1, '#f0c060');
    return;
  }
  if (estilo === 1) {                // gorra con visera
    R(gx, x + 3, sy - 1 + hb, 10, 1, INK); R(gx, x + 2, sy + hb, 12, 4, INK);
    R(gx, x + 3, sy + hb, 10, 3, hat); R(gx, x + 4, sy + hb, 4, 1, hatLt);
    R(gx, x + 6, sy + 1 + hb, 4, 1, hatDk);
    if (a.dir !== 'up') { R(gx, x + 3, sy + 3 + hb, 10, 2, INK); R(gx, x + 4, sy + 3 + hb, 8, 1, hatDk); }
  } else {                           // gorro (con pompon o con helice)
    R(gx, x + 3, sy - 1 + hb, 10, 1, INK); R(gx, x + 2, sy + hb, 12, 5, INK);
    R(gx, x + 3, sy + hb, 10, 3, hat); R(gx, x + 4, sy + hb, 4, 1, hatLt);
    R(gx, x + 3, sy + 3 + hb, 10, 1, hatDk); R(gx, x + 3, sy + 4 + hb, 10, 1, hatDk);
    if (estilo === 0) { R(gx, x + 6, sy - 4 + hb, 4, 3, INK); R(gx, x + 7, sy - 3 + hb, 2, 1, '#fffaf0'); }
    else if (estilo === 2) {
      R(gx, x + 7, sy - 3 + hb, 2, 2, INK);
      if (Math.floor(t * 12) % 2) R(gx, x + 3, sy - 4 + hb, 10, 1, '#e8e8e8'); else R(gx, x + 5, sy - 4 + hb, 6, 1, '#e8e8e8');
      R(gx, x + 7, sy - 5 + hb, 2, 1, '#c4412f');
    }
  }
}

// ---------- Peinado ----------
function drawPeinado(a, x, sy, hb, t, gx, pelo, walking) {
  const look = lookDe(a);
  const estilo = look.peinado || 'auto';
  if (estilo === 'calvo') return;
  const hip = sy + 4 + hb;
  const dir = a.dir;
  const up = dir === 'up';
  const left = dir === 'left';
  const cubierto = llevaGorro(a);
  const dk = shade(pelo, -0.35), lt = shade(pelo, 0.45), mid = shade(pelo, -0.15);
  const fase = Math.floor(t * 8) % 2;
  const swing = !MENOS_MOVIMIENTO && (walking ? fase : (Math.floor(t * 1.5) % 2));
  function lados(largo) {
    R(gx, x + 3, hip + 1, 2, largo, INK); R(gx, x + 4, hip + 1, 1, largo, pelo);
    R(gx, x + 11, hip + 1, 2, largo, INK); R(gx, x + 11, hip + 1, 1, largo, pelo);
  }
  if (estilo === 'auto') {
    R(gx, x + 4, hip, 1, 2, pelo); R(gx, x + 11, hip, 1, 2, pelo);
    if (up) { R(gx, x + 4, hip, 8, 6, pelo); R(gx, x + 5, hip + 4, 6, 1, shade(pelo, -0.2)); }
    return;
  }
  if (estilo === 'corto') {
    if (up) {
      R(gx, x + 3, hip - 1, 10, 8, INK); R(gx, x + 4, hip - 1, 8, 7, pelo);
      R(gx, x + 4, hip - 1, 8, 1, lt); R(gx, x + 5, hip + 4, 6, 2, dk);
      R(gx, x + 3, hip - 1, 1, 8, INK); R(gx, x + 12, hip - 1, 1, 8, INK);
      return;
    }
    if (!cubierto) {
      R(gx, x + 3, hip - 1, 10, 2, INK); R(gx, x + 4, hip - 1, 8, 1, pelo);
      R(gx, x + 5, hip - 1, 3, 1, lt);
      R(gx, x + 3, hip, 10, 1, INK); R(gx, x + 4, hip, 8, 1, mid);
      R(gx, x + 4, hip + 1, 3, 1, pelo); R(gx, x + 8, hip + 1, 3, 1, pelo);
    }
    lados(2);
    return;
  }
  if (estilo === 'largo') {
    if (up) {
      R(gx, x + 3, hip - 1, 10, 9, INK); R(gx, x + 4, hip - 1, 8, 8, pelo);
      R(gx, x + 4, hip - 1, 8, 1, lt); R(gx, x + 5, hip + 5, 6, 2, dk);
      R(gx, x + 3, hip - 1, 1, 9, INK); R(gx, x + 12, hip - 1, 1, 9, INK);
      return;
    }
    if (!cubierto) {
      R(gx, x + 3, hip - 1, 10, 2, INK); R(gx, x + 4, hip - 1, 8, 1, pelo);
      R(gx, x + 5, hip - 1, 3, 1, lt);
    }
    // mechones laterales largos
    R(gx, x + 2, hip, 3, 8, INK); R(gx, x + 3, hip + 1, 1, 6, pelo); R(gx, x + 3, hip + 1, 1, 1, lt);
    R(gx, x + 11, hip, 3, 8, INK); R(gx, x + 12, hip + 1, 1, 6, pelo); R(gx, x + 12, hip + 1, 1, 1, lt);
    return;
  }
  if (estilo === 'coleta') {
    if (up) {
      R(gx, x + 3, hip - 1, 10, 5, INK); R(gx, x + 4, hip - 1, 8, 4, pelo);
      R(gx, x + 4, hip - 1, 8, 1, lt); R(gx, x + 5, hip + 2, 6, 1, dk);
      // coleta
      const cx = x + 6 + (swing ? 1 : 0);
      R(gx, cx, hip + 4, 4, 6, INK); R(gx, cx + 1, hip + 5, 2, 4, pelo);
      R(gx, cx + 1, hip + 4, 2, 1, '#e86a8a');
      R(gx, cx + 2, hip + 6, 1, 2, lt);
    } else if (left) {
      if (!cubierto) {
        R(gx, x + 3, hip - 1, 10, 2, INK); R(gx, x + 4, hip - 1, 8, 1, pelo);
      }
      const cx = x + 11 + (swing ? 1 : 0);
      R(gx, cx, hip + 2, 3, 7, INK); R(gx, cx + 1, hip + 3, 1, 5, pelo); R(gx, cx + 1, hip + 2, 1, 1, '#e86a8a');
    } else if (dir === 'right') {
      const cx = x + 2 + (swing ? 1 : 0);
      R(gx, cx, hip + 2, 3, 7, INK); R(gx, cx + 1, hip + 3, 1, 5, pelo); R(gx, cx + 1, hip + 2, 1, 1, '#e86a8a');
      if (!cubierto) {
        R(gx, x + 3, hip - 1, 10, 2, INK); R(gx, x + 4, hip - 1, 8, 1, pelo);
      }
    } else {
      if (!cubierto) {
        R(gx, x + 3, hip - 1, 10, 2, INK); R(gx, x + 4, hip - 1, 8, 1, pelo);
      }
      // mechón que asoma detrás
      R(gx, x + 12, hip + 2, 2, 4, INK); R(gx, x + 12, hip + 2, 1, 3, pelo);
    }
    return;
  }
  if (estilo === 'mohicano') {
    if (up) {
      R(gx, x + 6, hip - 3, 4, 9, INK); R(gx, x + 7, hip - 3, 2, 9, pelo);
      R(gx, x + 7, hip - 3, 2, 1, lt); R(gx, x + 7, hip + 4, 2, 1, dk);
      // lados rapados
      R(gx, x + 4, hip, 2, 5, mid); R(gx, x + 10, hip, 2, 5, mid);
      return;
    }
    if (!cubierto) {
      R(gx, x + 6, hip - 3, 4, 1, INK); R(gx, x + 7, hip - 3, 2, 1, pelo);
      R(gx, x + 6, hip - 2, 4, 1, INK); R(gx, x + 7, hip - 2, 2, 1, lt);
      R(gx, x + 6, hip - 1, 4, 2, INK); R(gx, x + 7, hip - 1, 2, 2, pelo);
      R(gx, x + 6, hip + 1, 4, 1, INK); R(gx, x + 7, hip + 1, 2, 1, dk);
    }
    // lados rapados
    R(gx, x + 4, hip, 2, 3, mid); R(gx, x + 10, hip, 2, 3, mid);
    if (left) R(gx, x + 10, hip - 2, 2, 2, pelo); else if (dir === 'right') R(gx, x + 4, hip - 2, 2, 2, pelo);
    return;
  }
  if (estilo === 'afro') {
    if (up) {
      R(gx, x + 2, hip - 2, 12, 10, INK); R(gx, x + 3, hip - 2, 10, 8, pelo);
      R(gx, x + 3, hip - 2, 10, 1, lt); R(gx, x + 5, hip + 4, 6, 2, dk);
      R(gx, x + 4, hip + 6, 8, 1, mid);
      return;
    }
    if (!cubierto) {
      R(gx, x + 3, hip - 2, 10, 3, INK); R(gx, x + 4, hip - 2, 8, 2, pelo);
      R(gx, x + 5, hip - 2, 3, 1, lt);
      R(gx, x + 2, hip, 3, 6, INK); R(gx, x + 3, hip + 1, 1, 4, pelo);
      R(gx, x + 11, hip, 3, 6, INK); R(gx, x + 12, hip + 1, 1, 4, pelo);
    }
    if (left) {
      R(gx, x + 10, hip - 1, 4, 7, INK); R(gx, x + 11, hip, 2, 5, pelo);
    } else if (dir === 'right') {
      R(gx, x + 2, hip - 1, 4, 7, INK); R(gx, x + 3, hip, 2, 5, pelo);
    }
    return;
  }
  if (estilo === 'flequillo') {
    if (up) {
      R(gx, x + 3, hip - 1, 10, 6, INK); R(gx, x + 4, hip - 1, 8, 5, pelo);
      R(gx, x + 4, hip - 1, 8, 1, lt); R(gx, x + 5, hip + 3, 6, 1, dk);
      return;
    }
    if (!cubierto) {
      R(gx, x + 3, hip - 1, 10, 3, INK); R(gx, x + 4, hip - 1, 8, 2, pelo);
      R(gx, x + 5, hip - 1, 3, 1, lt);
      // flequillo dentado
      R(gx, x + 4, hip + 1, 2, 1, pelo); R(gx, x + 7, hip + 1, 1, 1, pelo); R(gx, x + 10, hip + 1, 2, 1, pelo);
      R(gx, x + 4, hip + 2, 1, 1, INK); R(gx, x + 6, hip + 2, 1, 1, INK); R(gx, x + 9, hip + 2, 1, 1, INK); R(gx, x + 11, hip + 2, 1, 1, INK);
    }
    lados(2);
    if (left) R(gx, x + 4, hip - 2, 3, 2, pelo);
    if (dir === 'right') R(gx, x + 9, hip - 2, 3, 2, pelo);
    return;
  }
  if (estilo === 'rapado') {
    if (up) {
      R(gx, x + 4, hip, 8, 6, mid);
      for (let i = 0; i < 8; i += 2) R(gx, x + 4 + i, hip + 1 + (i % 3), 1, 1, dk);
      return;
    }
    R(gx, x + 4, hip, 8, 1, mid); R(gx, x + 5, hip, 1, 1, dk);
    R(gx, x + 4, hip + 1, 1, 2, mid); R(gx, x + 11, hip + 1, 1, 2, mid);
    R(gx, x + 6, hip + 1, 1, 1, dk); R(gx, x + 9, hip + 1, 1, 1, dk);
    if (!cubierto) R(gx, x + 4, hip - 1, 8, 1, mid);
    return;
  }
}

function drawLying(a, px, py, t, gx = g) {
  const look = lookDe(a);
  const camisa = look.camisa || a.col, dk = shade(camisa, -0.3), lt = shade(camisa, 0.35);
  const piel = look.piel || SKIN, pelo = look.pelo || HAIR;
  const peinado = look.peinado || 'auto';
  const br = Math.floor(t * 1.2) % 2;
  R(gx, px, py + 2, 8, 11, INK); R(gx, px + 1, py + 3, 6, 9, '#fffaf0'); R(gx, px + 1, py + 10, 6, 2, '#e8e0cc');
  R(gx, px + 1, py + 4 + br, 6, 6, INK); R(gx, px + 2, py + 5 + br, 4, 4, piel);
  R(gx, px + 1, py + 3 + br, 6, 3, INK);
  // peinado acostado
  if (peinado !== 'calvo') {
    const color = pelo || HAIR;
    if (peinado === 'afro') {
      R(gx, px, py + 2 + br, 2, 5, color); R(gx, px + 6, py + 2 + br, 2, 5, color);
    } else if (peinado === 'largo' || peinado === 'coleta') {
      R(gx, px, py + 3 + br, 2, 4, color); R(gx, px + 6, py + 4 + br, 1, 3, color);
    } else if (peinado === 'mohicano') {
      R(gx, px + 3, py + 1 + br, 2, 2, color);
    } else if (peinado === 'rapado') {
      R(gx, px + 1, py + 3 + br, 1, 2, shade(color, -0.15));
    } else {
      R(gx, px + 1, py + 4 + br, 1, 2, color); R(gx, px + 6, py + 4 + br, 1, 2, color);
    }
  }
  R(gx, px + 2, py + 4 + br, 4, 2, look.gorroColor || a.hat);
  if (look.peinado && look.peinado !== 'auto' && (look.peinado === 'aureola')) {
    R(gx, px + 2, py + 1 + br, 4, 1, '#e8c54a');
  }
  R(gx, px + 2, py + 7 + br, 1, 1, INK); R(gx, px + 5, py + 7 + br, 1, 1, INK); R(gx, px + 3, py + 8 + br, 2, 1, '#f0a79a');
  R(gx, px + 6, py + 3, 10, 12, INK); R(gx, px + 7, py + 4 + br, 8, 10 - br, camisa);
  R(gx, px + 7, py + 4 + br, 8, 1, lt); R(gx, px + 7, py + 9, 8, 2, dk); R(gx, px + 7, py + 12, 8, 1, dk);
  // accesorios cara acostado
  const cara = accesorioEn(a, 'cara');
  if (cara === 'lentes' || cara === 'lentes_redondos') {
    R(gx, px + 2, py + 5 + br, 3, 1, INK); R(gx, px + 5, py + 5 + br, 2, 1, INK);
  }
  if (cara === 'bigote') R(gx, px + 2, py + 7 + br, 4, 1, pelo);
  if (cara === 'barba') R(gx, px + 2, py + 7 + br, 4, 2, pelo);
  // bufanda acostado
  if (accesorioEn(a, 'cuello') === 'bufanda') {
    const col = look.gorroColor || '#c4412f';
    R(gx, px + 6, py + 3, 8, 1, col); R(gx, px + 6, py + 4, 8, 1, shade(col, -0.3));
  }
}

function drawAgent(a, px, py, t, gx = g) {
  const walking = a.path.length > 0, st = a.state;
  const ocioPhase = (st === 'idle' && window.vida && typeof window.vida.faseIdle === 'function' && window.vida.faseIdle(a) === 'ocio');
  if (!walking && st === 'idle' && !ocioPhase) { drawLying(a, px, py, t, gx); return; }
  const look = lookDe(a);
  const camisa = look.camisa || a.col;
  const piel = look.piel || SKIN;
  const pielOscura = look.piel ? shade(look.piel, -0.09) : SKIN_DK;
  const pelo = look.pelo || HAIR;
  const pantalon = look.pantalon || PANTS;
  const dk = shade(camisa, -0.3), lt = shade(camisa, 0.4);
  const step = walking ? Math.floor(t * 8) % 2 : 0;
  const err = st === 'error' && !walking;
  const hb = ((!walking && (st === 'docs' || st === 'codigo') && Math.floor(t * 5) % 2) || (walking && step)) ? 1 : 0;
  const x = px + (err ? (Math.floor(t * 14) % 2 ? 1 : -1) : 0), sy = py - 3;
  let al = walking ? (step ? -1 : 1) : 0;
  if (!walking && st === 'comandos') al = Math.floor(t * 6) % 2 ? -1 : 1;
  if (!walking && st === 'codigo') al = Math.floor(t * 10) % 2 ? -1 : 0;
  const tap = (!walking && st === 'espera' && Math.floor(t * 3) % 2) ? 1 : 0;
  const fase = Math.floor(t * 8) % 2;
  const flotar = MENOS_MOVIMIENTO ? 0 : Math.round(Math.sin(t * 2.3));
  // 1. espalda: alas y capa (fondo)
  drawAlas(a, x, sy, hb, t, gx, walking, fase);
  drawCapaFondo(a, x, sy, hb, t, gx, camisa, walking, fase);
  // sombra y piernas
  R(gx, x + 3, sy + 18, 10, 2, 'rgba(0,0,0,.28)');
  const l1 = step ? 1 : 0, l2 = step ? 0 : 1;
  R(gx, x + 5, sy + 16 - l1, 2, 1, pantalon); R(gx, x + 9, sy + 16 - l2, 2, 1, pantalon);
  R(gx, x + 4, sy + 17 - l1 - tap, 3, 1, INK); R(gx, x + 4, sy + 18 - l1 - tap, 3, 1, '#e8e2d0');
  R(gx, x + 9, sy + 17 - l2, 3, 1, INK); R(gx, x + 9, sy + 18 - l2, 3, 1, '#e8e2d0');
  // torso
  R(gx, x + 3, sy + 11, 10, 5, INK); R(gx, x + 4, sy + 11, 8, 4, camisa); R(gx, x + 4, sy + 14, 8, 1, dk);
  R(gx, x + 6, sy + 11, 4, 1, lt); R(gx, x + 4, sy + 12, 1, 2, lt); R(gx, x + 7, sy + 13, 2, 1, lt);
  // prendas del torso (encima del torso)
  drawTorsoPrenda(a, x, sy, hb, t, gx);
  // capa sobre los hombros (encima del torso)
  drawCapaHombros(a, x, sy, hb, t, gx, camisa, walking, fase);
  // brazos
  R(gx, x, sy + 12 + al, 1, 4, INK); R(gx, x + 15, sy + 12 - al, 1, 4, INK);
  R(gx, x + 1, sy + 12 + al, 2, 3, camisa); R(gx, x + 13, sy + 12 - al, 2, 3, camisa);
  R(gx, x + 1, sy + 15 + al, 2, 1, piel); R(gx, x + 13, sy + 15 - al, 2, 1, piel);
  // manos / accesorios en manos
  drawManos(a, x, sy, hb, t, gx, al, walking);
  // mochila (espalda, encima del torso)
  drawMochila(a, x, sy, hb, t, gx);
  // cabeza
  R(gx, x + 3, sy + 4 + hb, 10, 7, INK);
  R(gx, x + 4, sy + 4 + hb, 8, 6, err ? '#f6c7b8' : piel);
  R(gx, x + 4, sy + 9 + hb, 8, 1, err ? '#e8aa9a' : pielOscura);
  // peinado
  drawPeinado(a, x, sy, hb, t, gx, pelo, walking);
  // cara (ojos, boca)
  if (a.dir === 'up') {
    R(gx, x + 4, sy + 4 + hb, 8, 6, pelo); R(gx, x + 5, sy + 8 + hb, 6, 1, shade(pelo, -0.2));
  } else {
    const off = a.dir === 'left' ? -1 : a.dir === 'right' ? 1 : 0;
    const exL = 5 + off, exR = 9 + off, ey = sy + 6 + hb, blink = (t % 3.4) < 0.12, eh = blink ? 1 : 2;
    if (a.dir !== 'down') R(gx, x + (a.dir === 'left' ? 4 : 11), sy + 8 + hb, 1, 1, pielOscura);
    R(gx, x + 4, sy + 8 + hb, 1, 1, '#f0a79a'); R(gx, x + 11, sy + 8 + hb, 1, 1, '#f0a79a');
    if (!walking && st === 'leer' && !tieneAccesorio(a, 'lentes') && !tieneAccesorio(a, 'lentes_redondos')) {
      for (const ex of [exL, exR]) { R(gx, x + ex - 1, sy + 5 + hb, 4, 4, INK); R(gx, x + ex, sy + 6 + hb, 2, 2, '#dff1ff'); R(gx, x + ex + (off < 0 ? 0 : 1), sy + 6 + hb, 1, 2, INK); }
      R(gx, x + 7 + off, sy + 6 + hb, 2, 1, INK);
      R(gx, x + 7, sy + 9 + hb, 2, 1, INK);
    } else if (err) {
      for (const ex of [exL, exR]) { R(gx, x + ex, ey, 1, 1, INK); R(gx, x + ex + 1, ey + 1, 1, 1, INK); R(gx, x + ex + 1, ey, 1, 1, INK); R(gx, x + ex, ey + 1, 1, 1, INK); }
      R(gx, x + 6, sy + 9 + hb, 4, 1, INK);
      R(gx, x + 13, sy + 3 + (Math.floor(t * 6) % 5), 1, 2, '#8fd3ff'); R(gx, x + 2, sy + 2 + (Math.floor(t * 5 + 2) % 5), 1, 2, '#8fd3ff');
    } else {
      R(gx, x + exL, ey, 2, eh, INK); R(gx, x + exR, ey, 2, eh, INK);
      if (st === 'web' || st === 'espera') R(gx, x + 7 + off, sy + 9 + hb, 2, 1, INK);
      else if (st === 'comandos') R(gx, x + 6 + off, sy + 9 + hb, 4, 1, INK);
      else { R(gx, x + 6 + off, sy + 8 + hb, 1, 1, INK); R(gx, x + 9 + off, sy + 8 + hb, 1, 1, INK); R(gx, x + 7 + off, sy + 9 + hb, 2, 1, INK); }
    }
  }
  // cara: accesorios de cara (encima de la cara)
  drawCara(a, x, sy, hb, t, gx);
  // gorro
  drawHat(a, x, sy, hb, t, gx, flotar);
  // cuello
  drawCuello(a, x, sy, hb, t, gx, camisa, walking, fase);
  // pin del modelo: solo si el agente tiene look propio
  if (tieneLook(a) && a.dir !== 'up') R(gx, x + 11, sy + 12, 2, 2, hatFor(a.model));
  // accesorios segun la tarea
  if (!walking) {
    if (st === 'leer') {
      R(gx, x + 3, sy + 12, 10, 5, INK); R(gx, x + 4, sy + 13, 4, 3, '#fffaf0'); R(gx, x + 8, sy + 13, 4, 3, '#efe6d0');
      R(gx, x + 7, sy + 12, 2, 5, '#b5453a');
      R(gx, x + 5, sy + 14, 2, 1, '#b9ae96'); R(gx, x + 9, sy + 14, 2, 1, '#b9ae96');
      if (Math.floor(t * 0.8) % 2) R(gx, x + 5, sy + 15, 2, 1, '#b9ae96'); else R(gx, x + 9, sy + 15, 2, 1, '#b9ae96');
      R(gx, x + 2, sy + 13, 2, 3, camisa); R(gx, x + 12, sy + 13, 2, 3, camisa); R(gx, x + 2, sy + 15, 2, 1, piel); R(gx, x + 12, sy + 15, 2, 1, piel);
    } else if (st === 'codigo') {
      R(gx, x + 2, sy + 4 + hb, 1, 5, '#2b2b33'); R(gx, x + 13, sy + 4 + hb, 1, 5, '#2b2b33');
      R(gx, x + 1, sy + 5 + hb, 2, 4, INK); R(gx, x + 13, sy + 5 + hb, 2, 4, INK);
      R(gx, x + 1, sy + 6 + hb, 1, 2, '#c4412f');
      R(gx, x + 3, sy + 2 + hb, 10, 1, '#2b2b33');
    } else if (st === 'docs') {
      const w = Math.floor(t * 6) % 2;
      R(gx, x + 14, sy + 10 + w, 1, 5, '#e8c54a'); R(gx, x + 14, sy + 15 + w, 1, 1, INK); R(gx, x + 14, sy + 9 + w, 1, 1, '#e86a8a');
    } else if (st === 'comandos') {
      const w = al > 0;
      R(gx, x + 14, sy + 9 + (w ? 1 : 0), 1, 6, '#c8c8c0'); R(gx, x + 13, sy + 8 + (w ? 1 : 0), 3, 2, '#9a9a92'); R(gx, x + 14, sy + 8 + (w ? 1 : 0), 1, 1, INK);
    } else if (st === 'web') {
      R(gx, x + 13, sy + 6, 4, 4, INK); R(gx, x + 14, sy + 7, 2, 2, '#dff1ff'); R(gx, x + 13, sy + 10, 1, 3, '#8a5a38');
    }
  }
}

// ---------- Elementos animados de la casa ----------
function drawDynamic(t) {
  const occ = new Set(AGENTS.filter(a => a.at && a.spot).map(a => a.spot.join(',')));
  const inState = s => AGENTS.some(a => a.at && a.state === s);
  // ventana
  const wx = 6 * T, wy = 3;
  R(g, wx + 1, wy - 1, 2 * T - 2, 13, '#e8e2d0'); R(g, wx + 3, wy + 1, 2 * T - 6, 9, '#a9d8ee');
  g.save(); g.beginPath(); g.rect(wx + 3, wy + 1, 2 * T - 6, 9); g.clip();
  const cx = ((t * 5) % 44) - 10; R(g, wx + 3 + cx, wy + 3, 10, 3, '#fff'); R(g, wx + 6 + cx, wy + 2, 6, 2, '#fff'); R(g, wx + 3 + ((cx + 22) % 44) - 10, wy + 6, 8, 2, '#f4fbff');
  g.restore(); R(g, wx + 15, wy + 1, 2, 9, '#e8e2d0');
  // monitores de la oficina
  for (let i = 0; i < 2; i++) {
    const on = occ.has((19 + i * 2) + ',3'), mx = (19 + i * 2) * T + 3, my = 2 * T + 1;
    R(g, mx, my, 10, 9, INK); R(g, mx + 1, my + 1, 8, 6, on ? '#0f2a1c' : '#1b2420');
    if (on) for (let k = 0; k < 3; k++) R(g, mx + 2, my + 2 + k * 2, 3 + ((k * 5 + Math.floor(t * 3) + i * 2) % 5), 1, ['#6ee08a', '#8ac2ff', '#f0c060'][k]);
    R(g, mx + 4, my + 9, 2, 2, '#555d68');
  }
  // papeles del escritorio del estudio
  for (const c of [12, 14]) {
    const on = occ.has(c + ',3'), px = c * T + 3, py = 2 * T + 3;
    R(g, px, py, 10, 8, '#fffaf0');
    const n = on ? 1 + (Math.floor(t * 1.5) % 4) : 3;
    for (let k = 0; k < n; k++) R(g, px + 1, py + 1 + k * 2, on && k === n - 1 ? 3 + Math.floor((t * 6) % 4) : 7, 1, '#8f8470');
  }
  // maquina del taller y terminal del banco
  const act = inState('comandos'), mcx = 7 * T, mcy = 10 * T, col = act ? '#e0c060' : '#5a626d';
  R(g, mcx - 2, mcy - 2, 5, 5, col);
  if (!act || Math.floor(t * 6) % 2) { R(g, mcx - 1, mcy - 7, 3, 14, col); R(g, mcx - 7, mcy - 1, 14, 3, col); }
  else for (const [dx, dy] of [[-6, -6], [4, -6], [-6, 4], [4, 4]]) R(g, mcx + dx, mcy + dy, 3, 3, col);
  R(g, 6 * T + 4, 9 * T + 4, 2, 2, act && Math.floor(t * 4) % 2 ? '#6ee06e' : '#8a3a3a');
  R(g, 3 * T + 3, 9 * T + 1, 9, 8, INK); R(g, 3 * T + 4, 9 * T + 2, 7, 5, '#10241a');
  R(g, 3 * T + 5, 9 * T + 3, 2, 1, '#6ee08a'); if (!act || Math.floor(t * 2) % 2) R(g, 3 * T + 8, 9 * T + 3, 1, 2, '#6ee08a');
}

// ---------- Interfaz ----------
let selected = AGENTS[1].id, demoOn = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const agentsEl = document.getElementById('agents'), statesEl = document.getElementById('states');
const whoEl = document.getElementById('who'), demoBtn = document.getElementById('demo');
function stateOf(a) { return STATES.find(s => s.id === a.state); }

function renderUI() {
  agentsEl.replaceChildren();
  for (const a of AGENTS) {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'agent-row'; row.setAttribute('aria-pressed', String(a.id === selected));
    row.innerHTML = '<span class="dot"></span><span><span class="agent-name"></span><span class="agent-meta"></span></span><span class="agent-state"></span>';
    row.querySelector('.dot').style.background = a.col;
    row.querySelector('.agent-name').textContent = etiquetaDe(a);
    row.querySelector('.agent-meta').textContent = a.gestor + ' · ' + a.model;
    row.querySelector('.agent-state').textContent = stateOf(a).short;
    row.addEventListener('click', () => focusAgent(a.id));
    agentsEl.append(row);
  }
  const summary = document.createElement('p'); summary.className = 'hint';
  summary.textContent = AGENTS.length + ' agentes en casa · ' + AGENTS.filter(a => a.state !== 'idle').length + ' activos';
  agentsEl.append(summary);

  const leg = document.createElement('p'); leg.className = 'hint';
  leg.innerHTML = '<span class="dot" style="display:inline-block;vertical-align:-2px;background:var(--codex)"></span> Codex &nbsp; <span class="dot" style="display:inline-block;vertical-align:-2px;background:var(--opencode)"></span> OpenCode &nbsp; <span class="dot" style="display:inline-block;vertical-align:-2px;background:var(--claude)"></span> Claude Code';
  agentsEl.append(leg);

  const cur = AGENTS.find(a => a.id === selected) || AGENTS[0] || null;
  selected = cur ? cur.id : null;
  whoEl.textContent = cur ? '· ' + etiquetaDe(cur) : '';
  statesEl.replaceChildren();
  for (const s of STATES) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'state-btn' + (s.err ? ' err' : '') + (cur && cur.state === s.id ? ' on' : '');
    btn.innerHTML = '<b></b><span></span>'; btn.firstChild.textContent = s.label; btn.lastChild.textContent = s.tool;
    btn.addEventListener('click', () => { if (selected) setAgentState(selected, s.id); });
    statesEl.append(btn);
  }
}
function setDemoMode(on) {
  demoOn = on;
  demoBtn.setAttribute('aria-pressed', String(demoOn));
  demoBtn.textContent = 'Demo automática: ' + (demoOn ? 'activa' : 'pausada');
}
window.setDemoMode = setDemoMode;
demoBtn.addEventListener('click', () => setDemoMode(!demoOn));
setDemoMode(demoOn);

// ---------- Arranque y bucle ----------
drawHouse();
for (const a of AGENTS) { assign(a, a.init, true); a.next = 4 + Math.random() * 5; }
renderUI();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  update(dt, t);
  camStep(dt);
  stage.style.setProperty('--u', (stage.clientWidth / (COLS * T)) + 'px');
  g.drawImage(bg, 0, 0);
  drawDynamic(t);
  drawDynamic2(t);
  drawDynamic3(t);
  drawDynamic4(t);
  if (window.vida && typeof window.vida.drawAmbient === 'function') window.vida.drawAmbient(g, t);
  const s = stage.clientWidth / (COLS * T);
  const drawables = AGENTS.map(a => ({ y: a.y, a }));
  if (window.vida && window.vida.cat) drawables.push({ y: window.vida.cat.y, cat: window.vida.cat });
  drawables.sort((p, q) => p.y - q.y);
  for (const d of drawables) {
    if (d.cat) {
      if (window.vida && typeof window.vida.drawCat === 'function') window.vida.drawCat(g, Math.round(d.cat.x * T), Math.round(d.cat.y * T), t);
      continue;
    }
    const a = d.a;
    const px = Math.round(a.x * T), py = Math.round(a.y * T);
    if (infoId === a.id) { const pc = Math.floor(t * 3) % 2 ? '#ffd34a' : '#fff1b0'; R(g, px + 1, py + 15, 14, 1, pc); R(g, px + 3, py + 16, 10, 1, pc); }
    if (a.pausa && a.pausa.tipo === 'caricia') {
      if (window.vida && typeof window.vida.drawCaricia === 'function') window.vida.drawCaricia(a, px, py, t, g);
      else drawAgent(a, px, py, t);
    } else if (a.micro) {
      if (window.vida && typeof window.vida.drawMicro === 'function') window.vida.drawMicro(a, px, py, t, g);
      else drawAgent(a, px, py, t);
    } else if (window.vida && typeof window.vida.drawOcio === 'function' && a.state === 'idle' && window.vida.faseIdle && window.vida.faseIdle(a) === 'ocio') window.vida.drawOcio(a, px, py, t, g);
    else drawAgent(a, px, py, t);
    a.tag.style.transform = `translate(${(px + 8) * s}px, ${(py + 18) * s}px) translate(-50%, 0)`;
    let frames = BUBBLES[a.state];
    const ocioPhase2 = (a.state === 'idle' && window.vida && typeof window.vida.faseIdle === 'function' && window.vida.faseIdle(a) === 'ocio');
    if (a.micro) {
      frames = ['~'];
    } else if (ocioPhase2) {
      const act = a.ocio && a.ocio.actividad;
      frames = act === 'arcade' ? ['GG'] : act === 'consola' ? ['►'] : act === 'pingpong' ? ['PONG'] : act === 'pelota' ? ['⚽'] : frames;
    }
    const show = (a.at || a.state === 'error') && frames;
    a.bub.hidden = !show;
    if (show) {
      a.bub.textContent = frames[Math.floor(t * 2) % frames.length];
      a.bub.style.transform = `translate(${(px + 8) * s}px, ${(py - 9) * s}px) translate(-50%, -100%)`;
      a.bub.style.borderColor = a.state === 'error' ? '#b3261e' : '#2b2420';
      a.bub.style.background = a.state === 'error' ? '#ffd9d0' : '#fffaf0';
    }
  }
    if (window.drawEffects) drawEffects(g, t, dt);
  infoStep();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);


// ---------- Camara (zoom y arrastre) y ficha del agente ----------
const viewport = document.getElementById('viewport'), info = document.getElementById('info');
const cam = { k: 1, x: 0, y: 0, auto: true, goal: null };
let infoId = null;
const DESCS = {
  leer: 'Lee archivos del proyecto para entender cómo está hecho el código antes de cambiar nada.',
  codigo: 'Edita código: escribe o modifica archivos del proyecto.',
  docs: 'Escribe documentación o notas en archivos de texto, como un README.',
  comandos: 'Ejecuta comandos en la terminal, por ejemplo instalar paquetes o revisar el repositorio.',
  web: 'Investiga en internet: busca documentación o ejemplos para resolver la tarea.',
  tests: 'Corre las pruebas o compila el proyecto para comprobar que todo funciona.',
  deploy: 'Publica los cambios: sube el código o lo despliega en un servidor.',
  listo: 'Terminó su tarea y descansa en el jardín.',
  delegando: 'Reparte trabajo: le pasa partes de la tarea a otro agente.',
  espera: 'Se detuvo y espera que apruebes un permiso para seguir.',
  idle: 'No tiene tareas ahora. La sesión está inactiva.',
  error: 'Una herramienta falló. Está en la enfermería mientras se resuelve.',
};
const baseScale = () => stage.offsetWidth / (COLS * T);
const fitK = () => Math.min(viewport.clientWidth / stage.offsetWidth, viewport.clientHeight / stage.offsetHeight);
function clampCam() {
  const w = stage.offsetWidth * cam.k, h = stage.offsetHeight * cam.k, vw = viewport.clientWidth, vh = viewport.clientHeight, pad = 40;
  cam.x = w <= vw ? (vw - w) / 2 : Math.min(pad, Math.max(vw - w - pad, cam.x));
  cam.y = h <= vh ? (vh - h) / 2 : Math.min(pad, Math.max(vh - h - pad, cam.y));
}
function applyCam() { clampCam(); stage.style.transform = 'translate(' + cam.x + 'px,' + cam.y + 'px) scale(' + cam.k + ')'; }
function fitAll() { cam.k = fitK(); cam.auto = true; cam.goal = null; applyCam(); }
function sizeStage() {
  stage.style.width = viewport.clientWidth + 'px';
  if (cam.auto) fitAll(); else { cam.k = Math.max(cam.k, fitK()); applyCam(); }
}
function zoomAt(px, py, nk) {
  nk = Math.min(6, Math.max(fitK(), nk));
  const wx = (px - cam.x) / cam.k, wy = (py - cam.y) / cam.k;
  cam.k = nk; cam.x = px - wx * nk; cam.y = py - wy * nk; cam.auto = false; cam.goal = null; applyCam();
}
function focusAgent(id) {
  const a = AGENTS.find(o => o.id === id); if (!a) return;
  infoId = id; selected = id; renderUI();
  const k = Math.max(cam.k, 2.4), wx = (a.x * T + 8) * baseScale(), wy = (a.y * T + 4) * baseScale();
  cam.auto = false; cam.goal = { k, x: viewport.clientWidth / 2 - wx * k, y: viewport.clientHeight / 2 - wy * k };
}
function camStep(dt) {
  if (!cam.goal) return;
  const f = 1 - Math.pow(0.0005, dt), g2 = cam.goal;
  cam.k += (g2.k - cam.k) * f; cam.x += (g2.x - cam.x) * f; cam.y += (g2.y - cam.y) * f;
  if (Math.abs(g2.k - cam.k) < 0.005 && Math.abs(g2.x - cam.x) < 0.5 && Math.abs(g2.y - cam.y) < 0.5) cam.goal = null;
  applyCam();
}

function agentAt(clientX, clientY) {
  const r = stage.getBoundingClientRect(), cx = (clientX - r.left) / r.width * COLS * T, cy = (clientY - r.top) / r.height * ROWS * T;
  const tol = Math.max(10, 18 / (baseScale() * cam.k));
  let best = null, bd = 1e9;
  for (const a of AGENTS) {
    const dx = cx - (a.x * T + 8), dy = cy - (a.y * T + 5);
    if (Math.abs(dx) <= tol && dy >= -tol - 3 && dy <= tol) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = a; } }
  }
  return best;
}

// puntero: arrastrar, pellizcar y tocar
const ptrs = new Map(); let moved = 0, pinch = null;
let lastEmptyTap = null;
function vpPoint(e) { const r = viewport.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
viewport.addEventListener('pointerdown', e => {
  if (e.target.closest('.ctl, .info')) return;
  viewport.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, vpPoint(e)); moved = 0; cam.goal = null;
  if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch = { d: Math.hypot(p.x - q.x, p.y - q.y) || 1, k: cam.k }; }
});
viewport.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const prev = ptrs.get(e.pointerId), cur = vpPoint(e); ptrs.set(e.pointerId, cur);
  if (ptrs.size === 2 && pinch) {
    const [p, q] = [...ptrs.values()]; zoomAt((p.x + q.x) / 2, (p.y + q.y) / 2, pinch.k * Math.hypot(p.x - q.x, p.y - q.y) / pinch.d); moved = 99; return;
  }
  const dx = cur.x - prev.x, dy = cur.y - prev.y; moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 6) { viewport.classList.add('dragging'); cam.x += dx; cam.y += dy; cam.auto = false; applyCam(); }
});
function endPtr(e, cancel) {
  if (!ptrs.has(e.pointerId)) return;
  const wasSingle = ptrs.size === 1; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
  viewport.classList.remove('dragging');
  if (!cancel && wasSingle && moved <= 6) {
    const a = agentAt(e.clientX, e.clientY);
    if (a) {
      infoId = a.id; selected = a.id; renderUI(); lastEmptyTap = null;
    } else {
      infoId = null;
      const point = vpPoint(e), now = performance.now();
      if (lastEmptyTap && now - lastEmptyTap.time < 350
        && Math.hypot(point.x - lastEmptyTap.x, point.y - lastEmptyTap.y) < 28) {
        fitAll();
        lastEmptyTap = null;
      } else {
        lastEmptyTap = { ...point, time: now };
      }
    }
  }
}
viewport.addEventListener('pointerup', e => endPtr(e, false));
viewport.addEventListener('pointercancel', e => endPtr(e, true));
viewport.addEventListener('dblclick', e => {
  if (e.target.closest('.ctl, .info') || agentAt(e.clientX, e.clientY)) return;
  fitAll();
});
viewport.addEventListener('wheel', e => {
  e.preventDefault(); const p = vpPoint(e);
  zoomAt(p.x, p.y, cam.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
}, { passive: false });
document.getElementById('zin').addEventListener('click', () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, cam.k * 1.4));
document.getElementById('zout').addEventListener('click', () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, cam.k / 1.4));
document.getElementById('zfit').addEventListener('click', fitAll);
const openMiniWindow = () => {
  const url = new URL(location.href);
  url.searchParams.set('mini', '1');
  const win = window.open(url.toString(), 'casa-mini', 'width=360,height=560,resizable=yes,scrollbars=no,status=no,menubar=no,toolbar=no,location=no');
  if (!win) alert('Permite las ventanas emergentes para abrir la vista mini.');
};
document.getElementById('zmini').addEventListener('click', openMiniWindow);

const btnMini = document.getElementById('btnMini');
const btnStop = document.getElementById('btnStop');
const btnMode = document.getElementById('btnMode');
const btnReconnect = document.getElementById('btnReconnect');
if (btnMini) btnMini.addEventListener('click', openMiniWindow);
if (btnStop) btnStop.addEventListener('click', async () => {
  if (!confirm('¿Detener el servidor de Casa de Agentes?')) return;
  try { await fetch('/api/stop', { method: 'POST' }); } catch { /* ignore */ }
  alert('Servidor detenido. Usa el acceso directo para volver a encenderlo.');
});
if (btnMode) {
  const isDemo = new URLSearchParams(location.search).has('demo');
  btnMode.textContent = isDemo ? 'En vivo' : 'Demo';
  btnMode.addEventListener('click', () => {
    const url = new URL(location.href);
    if (url.searchParams.has('demo')) url.searchParams.delete('demo');
    else url.searchParams.set('demo', '1');
    location.href = url.toString();
  });
}
if (btnReconnect) btnReconnect.addEventListener('click', () => location.reload());
const zexpand = document.getElementById('zexpand');
if (zexpand) zexpand.addEventListener('click', () => {
  if (window.opener && !window.opener.closed) {
    window.opener.focus();
    window.close();
  } else {
    const url = new URL(location.href);
    url.searchParams.delete('mini');
    location.href = url.toString();
  }
});
document.getElementById('infoClose').addEventListener('click', () => { infoId = null; });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('custom')?.open) infoId = null;
});

// ficha: texto y posicion junto al agente
let infoKey = '';
function infoStep() {
  const a = infoId && AGENTS.find(o => o.id === infoId);
  if (!a) { info.hidden = true; return; }
  const moving = a.path.length > 0, spotRoom = a.spot && roomAt(a.spot[0], a.spot[1]), here = roomAt(Math.round(a.x), Math.round(a.y));
  const roomTxt = moving && spotRoom ? 'En camino a ' + spotRoom.name.toLowerCase() : (here ? here.name.charAt(0) + here.name.slice(1).toLowerCase() : 'Pasillo');
  const st = STATES.find(s => s.id === a.state), secs = Math.max(0, Math.round((performance.now() - (a.since || 0)) / 1000));
  const timeTxt = secs < 60 ? secs + ' s' : Math.floor(secs / 60) + ' min ' + (secs % 60) + ' s';
  const key = [a.id, a.alias, a.projectName, a.state, roomTxt, timeTxt].join('|');
  if (key !== infoKey) {
    infoKey = key;
    document.getElementById('iDot').style.background = a.col;
    document.getElementById('iName').textContent = etiquetaDe(a);
    document.getElementById('iMeta').textContent = a.gestor + ' · ' + a.model;
    let stateLabel = st.label;
    if (a.state === 'idle' && window.vida && typeof window.vida.faseIdle === 'function') {
      stateLabel = window.vida.faseIdle(a) === 'ocio' ? 'Libre (sesión activa)' : 'Descansando';
      const micro = a.micro && a.micro.tipo === 'agua' ? ' (fue por agua)' : '';
      if (a.micro && a.micro.tipo === 'agua') stateLabel = 'Descansando' + micro;
    }
    document.getElementById('iState').textContent = stateLabel;
    document.getElementById('iDesc').textContent = DESCS[a.state];
    document.getElementById('iTool').textContent = st.tool;
    document.getElementById('iRoom').textContent = roomTxt;
    document.getElementById('iTime').textContent = timeTxt;
    const proyecto = document.getElementById('iProject');
    if (proyecto) proyecto.textContent = a.projectName || '—';
  }
  info.hidden = false;
  const sr = stage.getBoundingClientRect(), vr = viewport.getBoundingClientRect();
  const ax = sr.left - vr.left + (a.x * T + 8) / (COLS * T) * sr.width, ay = sr.top - vr.top + (a.y * T - 8) / (ROWS * T) * sr.height;
  const cw = info.offsetWidth, ch = info.offsetHeight, vw = viewport.clientWidth, vh = viewport.clientHeight;
  let left = Math.min(vw - cw - 8, Math.max(8, ax - cw / 2)), top = ay - ch - 14;
  if (top < 8) top = Math.min(vh - ch - 8, ay + 14 + 24 * baseScale() * cam.k);
  info.style.left = Math.round(left) + 'px'; info.style.top = Math.round(Math.max(8, top)) + 'px';
}

if (window.ResizeObserver) new ResizeObserver(sizeStage).observe(viewport); else window.addEventListener('resize', sizeStage);
sizeStage();

// ---------- Personalizar: diálogo, vista previa y guardado ----------
(() => {
  const CAT = globalThis.CATALOGO;
  const dialog = document.getElementById('custom');
  const canvas = document.getElementById('cPreview');
  if (!CAT || !dialog || !canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const COLOR_INPUTS = { camisa: 'cCamisa', piel: 'cPiel', pelo: 'cPelo', pantalon: 'cPantalon', gorroColor: 'cGorroColor' };
  const COLOR_SWATCHES = { camisa: 'cSwCamisa', piel: 'cSwPiel', pelo: 'cSwPelo', pantalon: 'cSwPantalon', gorroColor: 'cSwGorroColor' };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let customAgent = null;
  let customLook = lookBase();
  let customAlias = '';
  let previewDir = 'down';
  let previewWalking = false;
  let previewFrame = 0;
  let previewRAF = 0;
  let customOpener = null;
  const undoStack = [];

  function lookBase() {
    return { camisa: null, piel: null, pelo: null, pantalon: null, gorro: 'auto', gorroColor: null, peinado: 'auto', accesorios: [] };
  }
  function normalizarLook(look) {
    const base = lookBase();
    const out = { ...base, ...(look && typeof look === 'object' ? look : {}) };
    if (!CAT.peinados.some((p) => p.id === out.peinado)) out.peinado = 'auto';
    // Un accesorio por ranura, conservando el primero.
    const vistos = new Set();
    const accs = [];
    for (const id of Array.isArray(out.accesorios) ? out.accesorios : []) {
      const item = CAT.accesorios.find((a) => a.id === id);
      if (!item || vistos.has(item.ranura)) continue;
      vistos.add(item.ranura);
      accs.push(id);
    }
    out.accesorios = accs;
    return out;
  }

  // Paletas de color.
  for (const key of Object.keys(COLOR_INPUTS)) {
    const cont = document.getElementById(COLOR_SWATCHES[key]);
    const input = document.getElementById(COLOR_INPUTS[key]);
    if (!cont || !input) continue;
    for (const hex of CAT.colores[key]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cswatch';
      btn.dataset.color = key;
      btn.dataset.hex = hex;
      btn.style.background = hex;
      btn.setAttribute('aria-label', hex);
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        pushUndo();
        customLook[key] = hex;
        syncColor(key);
        dibujarPreview();
      });
      cont.append(btn);
    }
    input.addEventListener('input', () => {
      pushUndo();
      customLook[key] = input.value.toLowerCase();
      syncColor(key);
      dibujarPreview();
    });
  }
  for (const btn of document.querySelectorAll('.cdefault')) {
    btn.addEventListener('click', () => {
      const key = btn.dataset.color;
      if (!key) return;
      pushUndo();
      customLook[key] = null;
      syncColor(key);
      dibujarPreview();
    });
  }

  function syncColor(key) {
    const input = document.getElementById(COLOR_INPUTS[key]);
    const cont = document.getElementById(COLOR_SWATCHES[key]);
    const actual = customLook[key];
    if (input) input.value = actual || CAT.colores[key][0];
    if (cont) {
      for (const btn of cont.querySelectorAll('.cswatch')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.hex === actual));
      }
    }
    const porDefecto = document.querySelector(`.cdefault[data-color="${key}"]`);
    if (porDefecto) porDefecto.classList.toggle('on', !actual);
  }

  // Gorros.
  const selectGorro = document.getElementById('cGorro');
  for (const item of CAT.gorros) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.nombre;
    selectGorro.append(option);
  }
  selectGorro.addEventListener('change', () => {
    pushUndo();
    customLook.gorro = selectGorro.value;
    dibujarPreview();
  });

  // Peinado.
  const selectPeinado = document.getElementById('cPeinado');
  if (selectPeinado) {
    for (const item of CAT.peinados) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.nombre;
      selectPeinado.append(option);
    }
    selectPeinado.addEventListener('change', () => {
      pushUndo();
      customLook.peinado = selectPeinado.value;
      dibujarPreview();
    });
  }

  // Accesorios por ranura (un botón por ranura, "Ninguno" incluido).
  const accsCont = document.getElementById('cAccs');
  const accsInputs = new Map(); // id -> input
  const ranuras = CAT.ranuras || [];
  for (const ranura of ranuras) {
    const grupo = document.createElement('fieldset');
    grupo.className = 'cgrupo';
    const leyenda = document.createElement('legend');
    leyenda.className = 'clabel';
    leyenda.textContent = ranura.nombre;
    grupo.append(leyenda);
    const fila = document.createElement('div');
    fila.className = 'caccesorios';
    // Ninguno
    const noneLabel = document.createElement('label');
    noneLabel.className = 'cacc';
    const noneInput = document.createElement('input');
    noneInput.type = 'radio';
    noneInput.name = 'ranura-' + ranura.id;
    noneInput.value = '';
    noneInput.checked = true;
    noneInput.addEventListener('change', () => {
      pushUndo();
      customLook.accesorios = customLook.accesorios.filter((id) => CAT.accesorios.find((a) => a.id === id)?.ranura !== ranura.id);
      syncAccs();
      dibujarPreview();
    });
    noneLabel.append(noneInput, document.createTextNode('Ninguno'));
    fila.append(noneLabel);
    for (const item of CAT.accesorios.filter((a) => a.ranura === ranura.id)) {
      const label = document.createElement('label');
      label.className = 'cacc';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'ranura-' + ranura.id;
      input.value = item.id;
      input.addEventListener('change', () => {
        if (!input.checked) return;
        pushUndo();
        // quita cualquier otro de la misma ranura y añade este
        customLook.accesorios = customLook.accesorios.filter((id) => CAT.accesorios.find((a) => a.id === id)?.ranura !== ranura.id);
        if (!customLook.accesorios.includes(item.id)) customLook.accesorios.push(item.id);
        syncAccs();
        dibujarPreview();
      });
      label.append(input, document.createTextNode(item.nombre));
      fila.append(label);
      accsInputs.set(item.id, input);
    }
    grupo.append(fila);
    accsCont.append(grupo);
  }
  function syncAccs() {
    for (const ranura of ranuras) {
      const activo = customLook.accesorios.find((id) => CAT.accesorios.find((a) => a.id === id)?.ranura === ranura.id) || '';
      const inputs = [accsCont.querySelector(`input[name="ranura-${ranura.id}"][value=""]`), ...Array.from(accsCont.querySelectorAll(`input[name="ranura-${ranura.id}"]`)).filter((i) => i.value)];
      for (const input of inputs) {
        input.checked = (input.value === activo);
      }
    }
  }

  const aliasInput = document.getElementById('cAlias');
  aliasInput.addEventListener('input', () => {
    customAlias = aliasInput.value;
    actualizarTitulo();
  });

  for (const btn of dialog.querySelectorAll('.cturnos button')) {
    btn.addEventListener('click', () => {
      previewDir = btn.dataset.dir || 'down';
      for (const otro of dialog.querySelectorAll('.cturnos button')) {
        otro.setAttribute('aria-pressed', String(otro === btn));
      }
      dibujarPreview();
    });
  }
  for (const btn of dialog.querySelectorAll('.cwalk button')) {
    btn.addEventListener('click', () => {
      previewWalking = btn.dataset.walk === '1';
      for (const otro of dialog.querySelectorAll('.cwalk button')) {
        otro.setAttribute('aria-pressed', String(otro === btn));
      }
      dibujarPreview();
    });
  }

  function actualizarTitulo() {
    if (!customAgent) return;
    const nombre = customAlias || customAgent.name;
    const proyecto = customAgent.projectName || 'sin proyecto';
    document.getElementById('cTitle').textContent = `Personalizar · ${nombre} (${customAgent.gestor} en ${proyecto})`;
  }

  function dibujarPreview() {
    if (!customAgent) return;
    ctx.clearRect(0, 0, 32, 32);
    const temporal = { ...customAgent, look: customLook, state: 'listo', path: previewWalking ? [[0, 0]] : [], at: true, dir: previewDir };
    drawAgent(temporal, 8, 12, previewFrame / 1000, ctx);
  }

  function buclePreview(now) {
    if (!dialog.open) { previewRAF = 0; return; }
    previewFrame = now;
    dibujarPreview();
    previewRAF = requestAnimationFrame(buclePreview);
  }
  function iniciarPreview() {
    if (reduceMotion.matches) { dibujarPreview(); return; }
    if (!previewRAF) previewRAF = requestAnimationFrame(buclePreview);
  }
  function pararPreview() {
    if (previewRAF) cancelAnimationFrame(previewRAF);
    previewRAF = 0;
  }

  function abrirPersonalizar(agente) {
    if (!agente) return;
    customAgent = agente;
    customLook = normalizarLook(agente.look);
    customAlias = agente.alias || '';
    previewDir = 'down';
    previewWalking = false;
    previewFrame = 0;
    undoStack.length = 0;
    customOpener = document.getElementById('iCustom');
    aliasInput.value = customAlias;
    selectGorro.value = customLook.gorro || 'auto';
    if (selectPeinado) selectPeinado.value = customLook.peinado || 'auto';
    for (const key of Object.keys(COLOR_INPUTS)) syncColor(key);
    syncAccs();
    for (const btn of dialog.querySelectorAll('.cturnos button')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.dir === 'down'));
    }
    for (const btn of dialog.querySelectorAll('.cwalk button')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.walk === '0'));
    }
    actualizarTitulo();
    dibujarPreview();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    aliasInput.focus();
    aliasInput.select();
    iniciarPreview();
  }

  function pushUndo() {
    undoStack.push(JSON.stringify(customLook));
    if (undoStack.length > 80) undoStack.shift();
  }
  function aplicarLook(look) {
    customLook = normalizarLook(look);
    if (selectGorro) selectGorro.value = customLook.gorro || 'auto';
    if (selectPeinado) selectPeinado.value = customLook.peinado || 'auto';
    for (const key of Object.keys(COLOR_INPUTS)) syncColor(key);
    syncAccs();
    dibujarPreview();
  }
  function deshacerLook() {
    if (!undoStack.length) return;
    const anterior = JSON.parse(undoStack.pop());
    aplicarLook(anterior);
  }
  function lookAleatorio() {
    pushUndo();
    const look = lookBase();
    for (const key of COLOR_KEYS) {
      const paleta = CAT.colores[key];
      look[key] = Math.random() < 0.7 ? paleta[Math.floor(Math.random() * paleta.length)] : null;
    }
    look.gorro = CAT.gorros[Math.floor(Math.random() * CAT.gorros.length)].id;
    look.gorroColor = Math.random() < 0.6 ? CAT.colores.gorroColor[Math.floor(Math.random() * CAT.colores.gorroColor.length)] : null;
    look.peinado = CAT.peinados[Math.floor(Math.random() * CAT.peinados.length)].id;
    // un accesorio por ranura con ~50% de probabilidad
    look.accesorios = [];
    for (const ranura of (CAT.ranuras || [])) {
      if (Math.random() < 0.5) {
        const candidatos = CAT.accesorios.filter((a) => a.ranura === ranura.id);
        if (candidatos.length) look.accesorios.push(candidatos[Math.floor(Math.random() * candidatos.length)].id);
      }
    }
    aplicarLook(look);
  }

  function restablecerLook() {
    pushUndo();
    customLook = lookBase();
    if (selectGorro) selectGorro.value = 'auto';
    if (selectPeinado) selectPeinado.value = 'auto';
    for (const key of Object.keys(COLOR_INPUTS)) syncColor(key);
    syncAccs();
    dibujarPreview();
  }

  async function guardarPersonalizar() {
    if (!customAgent) return;
    const agente = customAgent;
    const parche = { alias: customAlias, look: normalizarLook(customLook) };
    if (window.casaPerfiles) await window.casaPerfiles.guardar(agente, parche);
    agente.alias = parche.alias;
    agente.look = parche.look;
    actualizarEtiqueta(agente);
    renderUI();
    dialog.close();
  }

  document.getElementById('iCustom').addEventListener('click', () => {
    const agente = (infoId && AGENTS.find((a) => a.id === infoId)) || AGENTS.find((a) => a.id === selected);
    abrirPersonalizar(agente);
  });
  document.getElementById('cSave').addEventListener('click', guardarPersonalizar);
  document.getElementById('cCancel').addEventListener('click', () => dialog.close());
  document.getElementById('cClose').addEventListener('click', () => dialog.close());
  document.getElementById('cReset').addEventListener('click', restablecerLook);
  const cRandom = document.getElementById('cRandom'); if (cRandom) cRandom.addEventListener('click', lookAleatorio);
  const cUndo = document.getElementById('cUndo'); if (cUndo) cUndo.addEventListener('click', deshacerLook);
  dialog.addEventListener('close', () => {
    pararPreview();
    customAgent = null;
    if (customOpener && typeof customOpener.focus === 'function') customOpener.focus();
  });
  dialog.addEventListener('cancel', () => { pararPreview(); });
})();
