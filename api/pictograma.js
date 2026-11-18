// POST /api/pictograma
// Recibe: { nivel: 3 | 4, palabra: "vaso", imagen: "data:image/jpeg;base64,..." }
//   - nivel 3: imagen = foto recortada del nivel 1
//   - nivel 4: imagen = pictograma del nivel 3 (para que sean coherentes)
// Devuelve: { imagen: "data:image/png;base64,..." }

import { generarImagen } from './_lib/gemini.js';
import { comprobarLimite } from './_lib/limite.js';
import { leerImagen, leerPalabra, responder, responderError } from './_lib/peticion.js';
import { PROMPT_NIVEL_3, PROMPT_NIVEL_4 } from '../config/prompts.js';
import { MODELO_IMAGEN, TAMANO_IMAGEN, LIMITE_IMAGENES_DIA, LIMITE_LAMINAS_DIA } from '../config/modelos.js';

export async function POST(request) {
  try {
    const cuerpo = await request.json();
    const nivel = Number(cuerpo.nivel);
    if (nivel !== 3 && nivel !== 4) return responder({ error: 'Nivel no válido.' }, 400);
    const palabra = leerPalabra(cuerpo.palabra);
    const { mime, base64 } = leerImagen(cuerpo.imagen);

    // Primero el límite diario: si se ha llegado al máximo, no se gasta nada.
    await comprobarLimite('imagenes', LIMITE_IMAGENES_DIA, `${LIMITE_LAMINAS_DIA} láminas`);

    const plantilla = nivel === 3 ? PROMPT_NIVEL_3 : PROMPT_NIVEL_4;
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
