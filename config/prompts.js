// =====================================================================
//  PROMPTS DE LA IA  ·  Este es el archivo que puedes editar tú.
// =====================================================================
//  - Cambia solo el texto que está entre las comillas invertidas ` `.
//  - {palabra} se sustituye automáticamente por la palabra de la lámina
//    (por ejemplo "vaso"). Ayuda a la IA a saber qué objeto es.
//  - Después de guardar, sube el cambio a GitHub y Vercel publicará
//    la nueva versión sola en 1-2 minutos (ver README).
// =====================================================================

// Nivel 3: PICTOGRAMA en color. Recibe la foto recortada (nivel 1).
export const PROMPT_NIVEL_3 = `El objeto es: {palabra}.
Usa la imagen adjunta como referencia. Dibuja ESTE objeto concreto como pictograma para Comunicación Aumentativa y Alternativa: misma forma, proporciones, orientación y colores principales, incluyendo de forma simplificada sus rasgos distintivos. Relleno de color plano sin degradados ni sombras, contorno negro grueso, fondo blanco liso, objeto centrado ocupando el 80% de la imagen, sin texto. Si el objeto es transparente, usa gris muy claro, no azul.`;

// Nivel 4: PICTOGRAMA ABSTRACTO. Recibe el pictograma del nivel 3.
export const PROMPT_NIVEL_4 = `El objeto es: {palabra}.
Convierte este pictograma en su versión más abstracta: solo la silueta y el contorno negro grueso del mismo objeto, en la misma posición y proporción, relleno blanco, como mucho un detalle interior imprescindible para reconocerlo, sin color, fondo blanco, sin texto.`;

// Palabra propuesta. Recibe la foto recortada.
export const PROMPT_PALABRA = `¿Qué objeto aparece en la imagen? Responde SOLO con su nombre común en español de España, en singular, sin artículo, en minúsculas y sin punto final. Si son dos palabras (por ejemplo "cepillo de dientes"), escríbelas tal cual.`;
