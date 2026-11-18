// =====================================================================
//  PROMPTS DE LA IA  ·  Este es el archivo que puedes editar tú.
// =====================================================================
//  - Cambia solo el texto que está entre las comillas invertidas ` `.
//  - {palabra} se sustituye automáticamente por la palabra de la lámina
//    (por ejemplo "vaso"). Ayuda a la IA a saber qué objeto es.
//  - Después de guardar, sube el cambio a GitHub y Vercel publicará
//    la nueva versión sola en 1-2 minutos (ver README).
// =====================================================================

// Nivel 3: DIBUJO ANIMADO (mezcla de foto real y pictograma).
// Recibe la foto con contorno negro (nivel 2).
// Para que se parezca MÁS a la foto: pide «conserva más detalles de la foto».
// Para que se parezca MÁS al pictograma: pide «menos detalles» o «colores más planos».
export const PROMPT_NIVEL_3 = `El objeto es: {palabra}.
La imagen adjunta es la foto real de ESTE objeto concreto rodeada de un contorno negro. Redibújalo como un dibujo animado, a medio camino entre la foto y un pictograma de Comunicación Aumentativa y Alternativa: debe reconocerse claramente que es el mismo objeto de la foto, pero dibujado como en una serie de dibujos animados infantil.
- Misma forma, proporciones, orientación y colores que en la foto, con colores limpios y alegres.
- Conserva los rasgos distintivos y los detalles importantes de la foto (asas, tapas, dibujos, piezas, etiquetas como formas sin letras), simplificados pero presentes: más detalle que un pictograma.
- Estilo de dibujo animado: líneas negras limpias, contorno exterior negro grueso, formas ligeramente suavizadas, sombreado de una sola sombra plana por color y algún brillo blanco sencillo. Sin texturas fotográficas, sin degradados realistas, sin sombras en el suelo.
- NO le añadas cara, ojos, boca, brazos ni personalidad: es un objeto, no un personaje.
- Fondo blanco liso, objeto centrado ocupando el 80% de la imagen, sin texto. Si el objeto es transparente, usa gris muy claro, no azul.`;

// Nivel 4: PICTOGRAMA en color. Recibe el dibujo animado del nivel 3.
export const PROMPT_NIVEL_4 = `El objeto es: {palabra}.
Usa la imagen adjunta como referencia. Dibuja ESTE objeto concreto como pictograma para Comunicación Aumentativa y Alternativa: misma forma, proporciones, orientación y colores principales, incluyendo de forma simplificada sus rasgos distintivos. Relleno de color plano sin degradados ni sombras, contorno negro grueso, fondo blanco liso, objeto centrado ocupando el 80% de la imagen, sin texto. Si el objeto es transparente, usa gris muy claro, no azul.`;

// Nivel 5: PICTOGRAMA ABSTRACTO. Recibe el pictograma del nivel 4.
export const PROMPT_NIVEL_5 = `El objeto es: {palabra}.
Convierte este pictograma en su versión más abstracta: solo la silueta y el contorno negro grueso del mismo objeto, en la misma posición y proporción, relleno blanco, como mucho un detalle interior imprescindible para reconocerlo, sin color, fondo blanco, sin texto.`;

// Palabra propuesta. Recibe la foto recortada.
export const PROMPT_PALABRA = `¿Qué objeto aparece en la imagen? Responde SOLO con su nombre común en español de España, en singular, sin artículo, en minúsculas y sin punto final. Si son dos palabras (por ejemplo "cepillo de dientes"), escríbelas tal cual.`;
