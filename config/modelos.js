// Modelos de Google Gemini y límites de gasto.
// Se pueden cambiar sin tocar el código creando variables de entorno
// en Vercel (Settings → Environment Variables) con estos mismos nombres.

// Modelo de imagen para los niveles 3 y 4.
// Nota (nov. 2026): "Nano Banana 2" (gemini-3.1-flash-image) está marcado como
// obsoleto por Google desde el 6-oct-2026; Google recomienda su sucesor
// "gemini-nano-banana-2.1", que además es más barato. Si quieres volver al
// original, pon MODELO_IMAGEN=gemini-3.1-flash-image en Vercel.
export const MODELO_IMAGEN = process.env.MODELO_IMAGEN || 'gemini-nano-banana-2.1';

// Modelo de texto barato con visión, para proponer la palabra.
export const MODELO_TEXTO = process.env.MODELO_TEXTO || 'gemini-3.1-flash-lite';

// Tamaño de las imágenes que genera la IA ("1K" = 1024 x 1024 píxeles).
// "2K" o "4K" son más caros y no hacen falta para una tarjeta.
export const TAMANO_IMAGEN = process.env.TAMANO_IMAGEN || '1K';

// Máximo de láminas al día. Cada lámina = 2 imágenes (nivel 3 + nivel 4),
// y cada "Regenerar" también cuenta como una imagen.
export const LIMITE_LAMINAS_DIA = Number(process.env.LIMITE_LAMINAS_DIA || 30);
export const LIMITE_IMAGENES_DIA = LIMITE_LAMINAS_DIA * 2;

// Máximo de palabras propuestas al día (son muy baratas, menos de 0,001 €).
export const LIMITE_PALABRAS_DIA = 200;
