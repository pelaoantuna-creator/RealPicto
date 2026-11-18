// Llamadas a la API de Google Gemini. Solo se ejecuta en el servidor (Vercel),
// así la clave GEMINI_API_KEY nunca llega al navegador.

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Error con mensaje en español pensado para mostrarse al docente.
export class ErrorParaDocente extends Error {
  constructor(mensaje, estado = 500) {
    super(mensaje);
    this.estado = estado;
  }
}

async function llamarGemini(modelo, cuerpo) {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) {
    throw new ErrorParaDocente('Falta la clave de Gemini (GEMINI_API_KEY) en el servidor.', 500);
  }
  const respuesta = await fetch(`${URL_BASE}/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    // Guardamos el detalle técnico en los registros de Vercel (no en pantalla).
    console.error('Error de Gemini', respuesta.status, JSON.stringify(datos).slice(0, 500));
    if (respuesta.status === 429) {
      throw new ErrorParaDocente('Google ha limitado el uso por ahora. Espera un minuto y vuelve a intentarlo.', 429);
    }
    if (respuesta.status === 404) {
      throw new ErrorParaDocente(`El modelo "${modelo}" no existe o ya no está disponible. Revisa config/modelos.js (ver README).`, 502);
    }
    if (respuesta.status === 400 || respuesta.status === 403) {
      throw new ErrorParaDocente('Google ha rechazado la petición. Revisa que la clave sea correcta y que la facturación esté activada.', 502);
    }
    throw new ErrorParaDocente('Google no ha respondido bien. Inténtalo de nuevo.', 502);
  }
  return datos;
}

// Devuelve las "partes" de la primera respuesta de Gemini.
function partes(datos) {
  return datos?.candidates?.[0]?.content?.parts ?? [];
}

// Genera una imagen a partir de un texto y una imagen de referencia.
// imagenBase64: la imagen en base64 (sin el prefijo "data:...").
export async function generarImagen({ modelo, prompt, imagenBase64, mime, tamano }) {
  const datos = await llamarGemini(modelo, {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mime, data: imagenBase64 } },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1', imageSize: tamano },
    },
  });
  for (const parte of partes(datos)) {
    const img = parte.inlineData || parte.inline_data;
    if (img?.data) {
      return { imagenBase64: img.data, mime: img.mimeType || img.mime_type || 'image/png' };
    }
  }
  console.error('Gemini no devolvió imagen', JSON.stringify(datos).slice(0, 500));
  throw new ErrorParaDocente('La IA no ha devuelto ninguna imagen. Pulsa "Regenerar" para intentarlo otra vez.', 502);
}

// Pide un texto corto a partir de una imagen (para proponer la palabra).
export async function describirImagen({ modelo, prompt, imagenBase64, mime }) {
  const datos = await llamarGemini(modelo, {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mime, data: imagenBase64 } },
      ],
    }],
    generationConfig: { temperature: 0 },
  });
  return partes(datos).map((p) => p.text || '').join('').trim();
}
