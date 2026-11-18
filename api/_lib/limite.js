// Contador diario para no pasar nunca de un número máximo de usos al día.
//
// Las funciones de Vercel no tienen memoria entre una petición y otra, así
// que el contador se guarda en una pequeña base de datos gratuita (Upstash
// Redis, se añade desde Vercel con 2 clics; ver README). Vercel crea solo
// las variables KV_REST_API_URL y KV_REST_API_TOKEN.
//
// - En tu ordenador (sin Upstash) se usa un contador en memoria.
// - En Vercel, si falta Upstash, la app SE NIEGA a generar: preferimos
//   no funcionar antes que arriesgarnos a un gasto sin control.

import { ErrorParaDocente } from './gemini.js';

const memoria = new Map(); // solo para pruebas en local

// Fecha de hoy en España, por ejemplo "2026-11-18".
function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
}

// Suma 1 al contador de hoy y devuelve el nuevo valor.
async function sumarUno(clave) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.VERCEL) {
      throw new ErrorParaDocente('Falta conectar el contador de uso diario (Upstash). Mira el README, paso "Contador diario".', 500);
    }
    const valor = (memoria.get(clave) || 0) + 1;
    memoria.set(clave, valor);
    return valor;
  }

  // INCR suma 1; EXPIRE borra el contador a los 2 días para no acumular basura.
  const respuesta = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([['INCR', clave], ['EXPIRE', clave, 172800]]),
  });
  if (!respuesta.ok) {
    throw new ErrorParaDocente('No se pudo comprobar el límite diario. Inténtalo más tarde.', 500);
  }
  const [incr] = await respuesta.json();
  return Number(incr.result);
}

// Lanza un error si hoy ya se ha llegado al máximo de este tipo de uso.
export async function comprobarLimite(tipo, maximo, explicacion = `${maximo} ${tipo}`) {
  const usados = await sumarUno(`picto:${tipo}:${hoy()}`);
  if (usados > maximo) {
    throw new ErrorParaDocente(`Se ha llegado al límite de hoy (${explicacion}). Mañana se podrá seguir.`, 429);
  }
  return usados;
}
