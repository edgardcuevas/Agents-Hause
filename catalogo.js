// Catálogo compartido por el navegador (script clásico) y el servidor (import).
// Solo asigna a globalThis para no necesitar export ni bundler.
//
// v2: paletas ampliadas, peinados y accesorios por ranura (un accesorio por ranura).
globalThis.CATALOGO = Object.freeze({
  version: 2,
  colores: Object.freeze({
    // Dos filas de 12: colores vivos y su versión oscura/apagada.
    camisa: Object.freeze([
      '#d9702f', '#3b78d4', '#2f9e63', '#c4412f', '#8a5a9a', '#d6a93c',
      '#e86a8a', '#2b2b33', '#e8e2d0', '#4fb3b3', '#7a8f3c', '#5a6bd6',
      '#8c4a22', '#27548f', '#1f6b45', '#7d2c22', '#5b3d66', '#8f7128',
      '#9c4560', '#1a1a20', '#a8a293', '#2f7474', '#4f5c2a', '#3a458f',
    ]),
    gorroColor: Object.freeze([
      '#d9702f', '#3b78d4', '#2f9e63', '#c4412f', '#8a5a9a', '#d6a93c',
      '#e86a8a', '#2b2b33', '#e8e2d0', '#4fb3b3', '#7a8f3c', '#5a6bd6',
      '#8c4a22', '#27548f', '#1f6b45', '#7d2c22', '#5b3d66', '#8f7128',
      '#9c4560', '#1a1a20', '#a8a293', '#2f7474', '#4f5c2a', '#3a458f',
    ]),
    // De muy clara a muy oscura.
    piel: Object.freeze([
      '#fbe9d8', '#f6dcc2', '#eec5a0', '#d9a577', '#b9824f',
      '#96603a', '#8a5a38', '#6b432b', '#5e3b24', '#3f2718',
    ]),
    // Naturales y de fantasía (azul, rosa, verde, plateado, blanco).
    pelo: Object.freeze([
      '#2b2420', '#3b2a22', '#5a3d2b', '#7a4a2b', '#a0522d', '#d6a93c',
      '#e8dcc0', '#b8bcc4', '#e8e2d0', '#c4412f', '#3b78d4', '#e86a8a',
      '#2f9e63', '#8a5a9a',
    ]),
    pantalon: Object.freeze([
      '#3a4058', '#2b2b33', '#5a4838', '#3d6fa5', '#4f8a5b', '#8a3a3a',
      '#24304a', '#4a4030', '#6b6b73', '#2f5e44', '#6b3a5a', '#7a5a2a',
    ]),
  }),
  peinados: Object.freeze([
    Object.freeze({ id: 'auto', nombre: 'Automático', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'corto', nombre: 'Corto', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'largo', nombre: 'Largo', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'coleta', nombre: 'Coleta', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'mohicano', nombre: 'Mohicano', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'afro', nombre: 'Afro', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'flequillo', nombre: 'Flequillo', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'rapado', nombre: 'Rapado', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'calvo', nombre: 'Calvo', precio: 0, tipo: 'agente' }),
  ]),
  gorros: Object.freeze([
    Object.freeze({ id: 'auto', nombre: 'Automático (según modelo)', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'pompon', nombre: 'Gorro con pompón', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'gorra', nombre: 'Gorra', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'helice', nombre: 'Gorro de hélice', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'ninguno', nombre: 'Sin gorro', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'corona', nombre: 'Corona', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'copa', nombre: 'Sombrero de copa', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'orejas', nombre: 'Orejas de gato', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'flor', nombre: 'Flor', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'orejas_conejo', nombre: 'Orejas de conejo', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'aureola', nombre: 'Aureola', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'casco', nombre: 'Casco', precio: 0, tipo: 'agente' }),
  ]),
  // Ranuras: como mucho un accesorio de cada una.
  ranuras: Object.freeze([
    Object.freeze({ id: 'cara', nombre: 'Cara' }),
    Object.freeze({ id: 'cuello', nombre: 'Cuello' }),
    Object.freeze({ id: 'espalda', nombre: 'Espalda' }),
    Object.freeze({ id: 'torso', nombre: 'Torso' }),
    Object.freeze({ id: 'manos', nombre: 'Manos' }),
  ]),
  accesorios: Object.freeze([
    // Cara
    Object.freeze({ id: 'lentes', nombre: 'Lentes de sol', ranura: 'cara', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'lentes_redondos', nombre: 'Lentes redondos', ranura: 'cara', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'antifaz', nombre: 'Antifaz', ranura: 'cara', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'parche', nombre: 'Parche', ranura: 'cara', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'bigote', nombre: 'Bigote', ranura: 'cara', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'barba', nombre: 'Barba', ranura: 'cara', precio: 0, tipo: 'agente' }),
    // Cuello
    Object.freeze({ id: 'bufanda', nombre: 'Bufanda', ranura: 'cuello', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'mono', nombre: 'Moño', ranura: 'cuello', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'corbata', nombre: 'Corbata', ranura: 'cuello', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'collar', nombre: 'Collar', ranura: 'cuello', precio: 0, tipo: 'agente' }),
    // Espalda
    Object.freeze({ id: 'mochila', nombre: 'Mochila', ranura: 'espalda', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'capa', nombre: 'Capa', ranura: 'espalda', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'alas', nombre: 'Alas', ranura: 'espalda', precio: 0, tipo: 'agente' }),
    // Torso
    Object.freeze({ id: 'bata', nombre: 'Bata', ranura: 'torso', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'delantal', nombre: 'Delantal', ranura: 'torso', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'chaleco', nombre: 'Chaleco', ranura: 'torso', precio: 0, tipo: 'agente' }),
    // Manos
    Object.freeze({ id: 'reloj', nombre: 'Reloj', ranura: 'manos', precio: 0, tipo: 'agente' }),
    Object.freeze({ id: 'guante', nombre: 'Guante', ranura: 'manos', precio: 0, tipo: 'agente' }),
  ]),
  limites: Object.freeze({ alias: 24 }),
});
