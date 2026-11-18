// "Mi banco": guarda las láminas en el propio dispositivo (IndexedDB).
// Nada se envía a ningún servidor. Si se borran los datos del navegador,
// se borra también el banco.

const BASE = 'picto-app';
const ALMACEN = 'laminas';

function abrir() {
  return new Promise((ok, mal) => {
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => {
      peticion.result.createObjectStore(ALMACEN, { keyPath: 'id', autoIncrement: true });
    };
    peticion.onsuccess = () => ok(peticion.result);
    peticion.onerror = () => mal(peticion.error);
  });
}

// Ejecuta una operación sobre el almacén y devuelve su resultado.
async function operar(modo, accion) {
  const db = await abrir();
  return new Promise((ok, mal) => {
    const tx = db.transaction(ALMACEN, modo);
    const peticion = accion(tx.objectStore(ALMACEN));
    tx.oncomplete = () => ok(peticion.result);
    tx.onerror = () => mal(tx.error);
  });
}

// lamina = { id?, palabra, mayusculas, fecha, imagenes: {1,2,3,4: Blob}, miniatura: Blob }
export function guardarLamina(lamina) {
  // Pedimos al navegador que no borre estos datos por falta de espacio.
  navigator.storage?.persist?.().catch(() => {});
  return operar('readwrite', (almacen) => almacen.put(lamina));
}

export async function listarLaminas() {
  const todas = await operar('readonly', (almacen) => almacen.getAll());
  return todas.sort((a, b) => b.fecha - a.fecha);
}

export function obtenerLamina(id) {
  return operar('readonly', (almacen) => almacen.get(id));
}

export function borrarLamina(id) {
  return operar('readwrite', (almacen) => almacen.delete(id));
}
