// Utilidades comunes para las funciones de /api.
import { ErrorParaDocente } from './gemini.js';

// Tamaño máximo de una imagen recibida (Vercel admite hasta 4,5 MB por petición).
const MAX_CARACTERES = 4_000_000;

// Convierte "data:image/jpeg;base64,AAAA" en { mime, base64 } y la valida.
export function leerImagen(dataUrl) {
  const coincide = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!coincide) throw new ErrorParaDocente('La imagen enviada no es válida.', 400);
  if (dataUrl.length > MAX_CARACTERES) throw new ErrorParaDocente('La imagen es demasiado grande.', 400);
  return { mime: coincide[1], base64: coincide[3] };
}

// Limpia la palabra que escribe el docente: corta, sin símbolos raros.
export function leerPalabra(texto) {
  const limpia = String(texto ?? '').replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 40);
  if (!limpia) throw new ErrorParaDocente('Escribe la palabra del objeto.', 400);
  return limpia;
}

export function responder(datos, estado = 200) {
  return Response.json(datos, { status: estado, headers: { 'Cache-Control': 'no-store' } });
}

// Convierte cualquier error en una respuesta con mensaje entendible.
export function responderError(error) {
  if (error instanceof ErrorParaDocente) return responder({ error: error.message }, error.estado);
  console.error(error);
  return responder({ error: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.' }, 500);
}
