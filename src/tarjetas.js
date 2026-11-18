// Composición de las tarjetas y de la lámina final en el navegador (sin IA).
import { LADO, lienzo } from './imagenes.js';

const ANCHO = LADO; // 1024
const BANDA = 256; // franja inferior para la palabra
const ALTO = LADO + BANDA; // 1280: todas las tarjetas miden igual
const FUENTE = '"Atkinson Hyperlegible", sans-serif';

// Espera a que la tipografía esté cargada antes de dibujar texto en el lienzo.
export async function prepararFuente() {
  await document.fonts.load(`700 100px ${FUENTE}`);
}

export function textoVisible(palabra, mayusculas) {
  return mayusculas ? palabra.toLocaleUpperCase('es-ES') : palabra.toLocaleLowerCase('es-ES');
}

// Tamaño de letra más grande posible (hasta "inicial") que cabe en "maxAncho".
function tamanoQueCabe(ctx, texto, maxAncho, inicial) {
  let tamano = inicial;
  ctx.font = `700 ${tamano}px ${FUENTE}`;
  while (tamano > 20 && ctx.measureText(texto).width > maxAncho) {
    tamano -= 4;
    ctx.font = `700 ${tamano}px ${FUENTE}`;
  }
  return tamano;
}

// Dibuja una tarjeta. Si "imagen" es null, es la tarjeta del nivel 5 (solo palabra).
export function dibujarTarjeta(imagen, texto) {
  const c = lienzo(ANCHO, ALTO);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (imagen) {
    ctx.drawImage(imagen, 0, 0, LADO, LADO);
    tamanoQueCabe(ctx, texto, ANCHO * 0.86, 170);
    ctx.fillText(texto, ANCHO / 2, LADO + BANDA / 2 - 30);
  } else {
    tamanoQueCabe(ctx, texto, ANCHO * 0.86, 260);
    ctx.fillText(texto, ANCHO / 2, ALTO / 2);
  }

  // Borde redondeado igual en todas las tarjetas.
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(6, 6, ANCHO - 12, ALTO - 12, 48);
  ctx.stroke();
  return c;
}

// Junta todas las tarjetas (6) en una fila: la lámina.
export function componerLamina(tarjetas) {
  const escala = 0.5;
  const w = ANCHO * escala;
  const h = ALTO * escala;
  const hueco = 32;
  const margen = 48;
  const n = tarjetas.length;
  const c = lienzo(margen * 2 + w * n + hueco * (n - 1), margen * 2 + h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  tarjetas.forEach((tarjeta, i) => ctx.drawImage(tarjeta, margen + i * (w + hueco), margen, w, h));
  return c;
}
