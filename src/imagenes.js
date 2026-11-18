// Tratamiento de imágenes en el propio dispositivo (sin IA en la nube):
// quitar el fondo (nivel 1), contorno negro (nivel 2) y encuadrar las
// imágenes de la IA para que el objeto quede en la misma posición y tamaño.

export const LADO = 1024; // las imágenes de cada nivel son cuadradas: 1024 x 1024
const OCUPACION = 0.8; // el objeto ocupa el 80 % del lado más largo

export function lienzo(ancho, alto) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return c;
}

// Carga una imagen desde un Blob o una dirección "data:...".
export async function cargarImagen(fuente) {
  if (fuente instanceof Blob) return createImageBitmap(fuente);
  const img = new Image();
  img.src = fuente;
  await img.decode();
  return img;
}

export function aDataUrl(canvas, tipo = 'image/jpeg', calidad = 0.92) {
  return canvas.toDataURL(tipo, calidad);
}

export function aBlob(canvas, tipo = 'image/png', calidad = 0.92) {
  return new Promise((ok) => canvas.toBlob(ok, tipo, calidad));
}

// Reduce la foto a un tamaño razonable (las fotos del iPad son enormes)
// para que el recorte sea más rápido. Respeta la orientación de la foto.
export async function reducirFoto(archivo, maximo = 1600) {
  const img = await createImageBitmap(archivo);
  const escala = Math.min(1, maximo / Math.max(img.width, img.height));
  const c = lienzo(Math.round(img.width * escala), Math.round(img.height * escala));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return aBlob(c, 'image/jpeg', 0.92);
}

// NIVEL 1 · Quita el fondo en el propio dispositivo con @imgly/background-removal.
// La primera vez descarga el modelo de recorte (unos 40-80 MB) y luego queda en caché.
export async function quitarFondo(blob, alProgresar) {
  const { removeBackground } = await import('@imgly/background-removal');
  return removeBackground(blob, {
    output: { format: 'image/png' },
    progress: (_clave, actual, total) => alProgresar?.(total ? actual / total : 0),
  });
}

// Busca el rectángulo que contiene al objeto.
// esObjeto(r, g, b, a) dice si un píxel pertenece al objeto.
function buscarCaja(imagen, esObjeto) {
  const c = lienzo(imagen.width, imagen.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imagen, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (esObjeto(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

// Coloca el objeto centrado en un cuadrado de LADO x LADO, ocupando el 80 %.
// Así todos los niveles tienen el objeto en la misma posición y proporción.
function colocar(imagen, caja, fondoBlanco) {
  const c = lienzo(LADO, LADO);
  const ctx = c.getContext('2d');
  if (fondoBlanco) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, LADO, LADO);
  }
  const escala = (LADO * OCUPACION) / Math.max(caja.ancho, caja.alto);
  const w = caja.ancho * escala;
  const h = caja.alto * escala;
  ctx.drawImage(imagen, caja.x, caja.y, caja.ancho, caja.alto, (LADO - w) / 2, (LADO - h) / 2, w, h);
  return c;
}

// Del PNG recortado (con transparencia) saca el objeto encuadrado, aún transparente.
export async function encuadrarRecorte(pngBlob) {
  const imagen = await createImageBitmap(pngBlob);
  const caja = buscarCaja(imagen, (r, g, b, a) => a > 40);
  if (!caja) throw new Error('No se ha encontrado ningún objeto en la foto. Prueba con otra foto con el objeto más grande y un fondo liso.');
  return limpiarBordes(colocar(imagen, caja, false));
}

// Quita las sombras casi transparentes que deja el recorte (si no, salen
// manchas grises en el nivel 1 y un contorno borroso en el nivel 2).
function limpiarBordes(c) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const datos = ctx.getImageData(0, 0, c.width, c.height);
  const d = datos.data;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 100) d[i] = 0; // casi transparente → transparente del todo
    else if (d[i] > 200) d[i] = 255; // casi opaco → opaco del todo
  }
  ctx.putImageData(datos, 0, 0);
  return c;
}

// Pone una imagen transparente sobre fondo blanco (NIVEL 1 final).
export function sobreBlanco(transparente) {
  const c = lienzo(LADO, LADO);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.drawImage(transparente, 0, 0);
  return c;
}

// NIVEL 2 · Misma foto recortada con un contorno negro grueso alrededor.
// Se calcula "engordando" la silueta del objeto en negro y poniendo la foto encima.
export function conContorno(transparente, grosor = Math.round(LADO * 0.022)) {
  // Silueta negra del objeto.
  const silueta = lienzo(LADO, LADO);
  const sctx = silueta.getContext('2d');
  sctx.drawImage(transparente, 0, 0);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = '#000';
  sctx.fillRect(0, 0, LADO, LADO);

  const c = sobreBlanco(lienzo(LADO, LADO));
  const ctx = c.getContext('2d');
  // Dibujamos la silueta desplazada en todas direcciones = contorno grueso.
  for (const radio of [grosor, grosor * 0.5]) {
    for (let angulo = 0; angulo < 360; angulo += 10) {
      const rad = (angulo * Math.PI) / 180;
      ctx.drawImage(silueta, Math.cos(rad) * radio, Math.sin(rad) * radio);
    }
  }
  ctx.drawImage(transparente, 0, 0); // la foto encima del contorno
  return c;
}

// NIVELES 3 y 4 · Encuadra la imagen que devuelve la IA igual que el nivel 1:
// busca lo que no es blanco y lo centra al 80 %.
export async function encuadrarIA(dataUrl) {
  const imagen = await cargarImagen(dataUrl);
  const caja = buscarCaja(imagen, (r, g, b, a) => a > 40 && Math.min(r, g, b) < 235);
  if (!caja) return colocar(imagen, { x: 0, y: 0, ancho: imagen.width, alto: imagen.height }, true);
  return colocar(imagen, caja, true);
}

// Copia una imagen cualquiera (por ejemplo, la guardada en Mi banco) a un lienzo.
export async function aLienzo(fuente) {
  const imagen = await cargarImagen(fuente);
  const c = lienzo(LADO, LADO);
  c.getContext('2d').drawImage(imagen, 0, 0, LADO, LADO);
  return c;
}
