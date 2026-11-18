// Llamadas desde el navegador a nuestras funciones de Vercel (/api/...).
// El navegador NUNCA habla directamente con Google ni conoce la clave.

async function pedir(ruta, datos) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error('No hay conexión a internet.');
  }
  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(json.error || 'Ha fallado la conexión con el servidor.');
  return json;
}

export function proponerPalabra(imagen) {
  return pedir('/api/palabra', { imagen });
}

export function generarPictograma(nivel, palabra, imagen) {
  return pedir('/api/pictograma', { nivel, palabra, imagen });
}
