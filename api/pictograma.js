// POST /api/pictograma
// Recibe: { nivel: 3 | 4 | 5, palabra: "vaso", imagen: "data:image/jpeg;base64,..." }
// Cada nivel se dibuja a partir del anterior, para que sean coherentes:
//   - nivel 3 (dibujo animado):        imagen = foto con contorno (nivel 2)
//   - nivel 4 (pictograma):            imagen = dibujo animado (nivel 3)
//   - nivel 5 (pictograma abstracto):  imagen = pictograma (nivel 4)
// Devuelve: { imagen: "data:image/png;base64,..." }

import { generarImagen } from './_lib/gemini.js';
import { comprobarLimite } from './_lib/limite.js';
import { leerImagen, leerPalabra, responder, responderError } from './_lib/peticion.js';
import { PROMPT_NIVEL_3, PROMPT_NIVEL_4, PROMPT_NIVEL_5 } from '../config/prompts.js';
import { MODELO_IMAGEN, TAMANO_IMAGEN, LIMITE_IMAGENES_DIA, LIMITE_LAMINAS_DIA } from '../config/modelos.js';

export async function POST(request) {
  try {
    const cuerpo = await request.json();
    const nivel = Number(cuerpo.nivel);
    const plantilla = { 3: PROMPT_NIVEL_3, 4: PROMPT_NIVEL_4, 5: PROMPT_NIVEL_5 }[nivel];
    if (!plantilla) return responder({ error: 'Nivel no válido.' }, 400);
    const palabra = leerPalabra(cuerpo.palabra);
    const { mime, base64 } = leerImagen(cuerpo.imagen);

    // Primero el límite diario: si se ha llegado al máximo, no se gasta nada.
    await comprobarLimite('imagenes', LIMITE_IMAGENES_DIA, `${LIMITE_LAMINAS_DIA} láminas`);

    const resultado = await generarImagen({
      modelo: MODELO_IMAGEN,
      prompt: plantilla.replaceAll('{palabra}', palabra),
      imagenBase64: base64,
      mime,
      tamano: TAMANO_IMAGEN,
    });
    return responder({ imagen: `data:${resultado.mime};base64,${resultado.imagenBase64}` });
  } catch (error) {
    return responderError(error);
  }
}
