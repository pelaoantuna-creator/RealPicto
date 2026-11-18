// POST /api/palabra
// Recibe: { imagen: "data:image/jpeg;base64,..." } (la foto ya recortada)
// Devuelve: { palabra: "vaso" }

import { describirImagen } from './_lib/gemini.js';
import { comprobarLimite } from './_lib/limite.js';
import { leerImagen, responder, responderError } from './_lib/peticion.js';
import { PROMPT_PALABRA } from '../config/prompts.js';
import { MODELO_TEXTO, LIMITE_PALABRAS_DIA } from '../config/modelos.js';

// Artículos que quitamos por si el modelo los añade ("el vaso" → "vaso").
const ARTICULOS = /^(el|la|los|las|un|una|unos|unas)\s+/i;

export async function POST(request) {
  try {
    const cuerpo = await request.json();
    const { mime, base64 } = leerImagen(cuerpo.imagen);
    await comprobarLimite('palabras', LIMITE_PALABRAS_DIA);

    const texto = await describirImagen({ modelo: MODELO_TEXTO, prompt: PROMPT_PALABRA, imagenBase64: base64, mime });
    const palabra = texto
      .split('\n')[0]
      .replace(/[.,;:!¡?¿"«»*]/g, '')
      .trim()
      .toLowerCase()
      .replace(ARTICULOS, '')
      .slice(0, 40);
    return responder({ palabra });
  } catch (error) {
    return responderError(error);
  }
}
