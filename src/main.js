// PICTO APP · lógica principal de la pantalla.
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './estilos.css';

import {
  reducirFoto, quitarFondo, encuadrarRecorte, sobreBlanco, conContorno,
  encuadrarIA, aDataUrl, aBlob, aLienzo, lienzo,
} from './imagenes.js';
import { prepararFuente, textoVisible, dibujarTarjeta, componerLamina } from './tarjetas.js';
import { proponerPalabra, generarPictograma } from './api.js';
import { guardarLamina, listarLaminas, obtenerLamina, borrarLamina } from './banco.js';

const $ = (id) => document.getElementById(id);

const NOMBRES = {
  1: '1 · Foto real',
  2: '2 · Foto con contorno',
  3: '3 · Pictograma',
  4: '4 · Pictograma abstracto',
  5: '5 · Palabra',
};

// Todo lo que sabe la app sobre la lámina en curso.
const estado = {
  palabra: '',
  mayusculas: leerPreferencia(),
  niveles: { 1: null, 2: null, 3: null, 4: null }, // lienzos de 1024 x 1024
  errores: { 3: '', 4: '' },
  generando: { 3: false, 4: false },
  idGuardada: null, // si ya está en Mi banco, su número
};

// ---------- Preferencia MAYÚSCULAS / minúsculas (se recuerda en el dispositivo) ----------
function leerPreferencia() {
  try { return localStorage.getItem('mayusculas') !== 'no'; } catch { return true; }
}
function guardarPreferencia(valor) {
  try { localStorage.setItem('mayusculas', valor ? 'si' : 'no'); } catch { /* no pasa nada */ }
}

// ---------- Mensajes de estado ----------
function avisar(texto, esError = false) {
  $('estado').textContent = texto;
  $('estado').classList.toggle('error', esError);
}
function progreso(valor) {
  $('progreso').hidden = valor === null;
  if (valor !== null) $('progreso').value = valor;
}

// ---------- Navegación entre "Nueva lámina" y "Mi banco" ----------
function mostrarVista(nombre) {
  $('vista-nueva').hidden = nombre !== 'nueva';
  $('vista-banco').hidden = nombre !== 'banco';
  for (const [boton, vista] of [['ir-nueva', 'nueva'], ['ir-banco', 'banco']]) {
    if (nombre === vista) $(boton).setAttribute('aria-current', 'page');
    else $(boton).removeAttribute('aria-current');
  }
  if (nombre === 'banco') pintarBanco();
}
$('ir-nueva').addEventListener('click', () => mostrarVista('nueva'));
$('ir-banco').addEventListener('click', () => mostrarVista('banco'));

// ---------- Empezar de cero ----------
function reiniciar() {
  estado.palabra = '';
  estado.niveles = { 1: null, 2: null, 3: null, 4: null };
  estado.errores = { 3: '', 4: '' };
  estado.idGuardada = null;
  $('palabra').value = '';
  $('paso-foto').hidden = false;
  $('paso-palabra').hidden = true;
  $('resultado').hidden = true;
  avisar('');
  progreso(null);
}
$('boton-otra').addEventListener('click', () => { reiniciar(); window.scrollTo(0, 0); });

// ---------- PASO 1: foto → quitar fondo (niveles 1 y 2) → palabra propuesta ----------
async function alElegirFoto(evento) {
  const archivo = evento.target.files?.[0];
  evento.target.value = ''; // permite elegir la misma foto otra vez
  if (!archivo) return;
  reiniciar();
  try {
    avisar('Quitando el fondo… La primera vez tarda más porque descarga el programa de recorte.');
    progreso(0);
    const foto = await reducirFoto(archivo);
    const recortePng = await quitarFondo(foto, (p) => progreso(p));
    const recorte = await encuadrarRecorte(recortePng);
    estado.niveles[1] = sobreBlanco(recorte);
    estado.niveles[2] = conContorno(recorte);
    progreso(null);

    $('vista-previa').src = aDataUrl(estado.niveles[1]);
    $('paso-palabra').hidden = false;

    avisar('Buscando la palabra…');
    const pequena = lienzo(512, 512);
    pequena.getContext('2d').drawImage(estado.niveles[1], 0, 0, 512, 512);
    try {
      const { palabra } = await proponerPalabra(aDataUrl(pequena, 'image/jpeg', 0.85));
      if (!$('palabra').value) $('palabra').value = palabra;
      avisar('Revisa la palabra y pulsa «Generar lámina».');
    } catch (error) {
      avisar(`No se ha podido proponer la palabra (${error.message}). Escríbela tú.`, true);
    }
    $('palabra').focus();
  } catch (error) {
    console.error(error);
    progreso(null);
    avisar(error.message || 'No se ha podido recortar la foto. Prueba con otra.', true);
  }
}
$('entrada-camara').addEventListener('change', alElegirFoto);
$('entrada-galeria').addEventListener('change', alElegirFoto);

// ---------- PASO 2: generar la lámina ----------
$('boton-generar').addEventListener('click', async () => {
  const palabra = $('palabra').value.trim();
  if (!palabra) { avisar('Escribe la palabra del objeto.', true); $('palabra').focus(); return; }
  estado.palabra = palabra;
  $('paso-foto').hidden = true;
  $('paso-palabra').hidden = true;
  $('resultado').hidden = false;
  avisar('Dibujando los pictogramas con IA… (unos segundos por nivel)');
  pintarTarjetas();
  await generarNivel(3);
  if (estado.niveles[3]) await generarNivel(4);
  avisar(estado.niveles[3] && estado.niveles[4] ? 'Lámina lista.' : 'Algún nivel ha fallado: pulsa «Regenerar».', !estado.niveles[4]);
});

// Pide a la IA el nivel 3 (a partir de la foto) o el 4 (a partir del 3).
async function generarNivel(nivel) {
  estado.generando[nivel] = true;
  estado.errores[nivel] = '';
  estado.niveles[nivel] = null;
  estado.idGuardada = null; // la lámina ha cambiado: habrá que volver a guardarla
  pintarTarjetas();
  try {
    const referencia = nivel === 3 ? estado.niveles[1] : estado.niveles[3];
    const { imagen } = await generarPictograma(nivel, estado.palabra, aDataUrl(referencia, 'image/jpeg', 0.9));
    estado.niveles[nivel] = await encuadrarIA(imagen);
  } catch (error) {
    estado.errores[nivel] = error.message;
  }
  estado.generando[nivel] = false;
  pintarTarjetas();
}

async function regenerar(nivel) {
  avisar(`Regenerando el nivel ${nivel}…`);
  await generarNivel(nivel);
  // Si cambia el 3, el 4 se rehace a partir del nuevo 3 para que sigan siendo coherentes.
  if (nivel === 3 && estado.niveles[3]) await generarNivel(4);
  avisar(estado.errores[nivel] ? 'Ha fallado. Puedes volver a intentarlo.' : 'Hecho.', Boolean(estado.errores[nivel]));
}

// ---------- Dibujar las 5 tarjetas en pantalla ----------
function tarjetaCanvas(nivel) {
  const texto = textoVisible(estado.palabra, estado.mayusculas);
  return dibujarTarjeta(nivel === 5 ? null : estado.niveles[nivel], texto);
}

function nombreArchivo(sufijo) {
  const base = estado.palabra.toLocaleLowerCase('es-ES').replace(/[^\p{L}\p{N}]+/gu, '-');
  return `${base || 'lamina'}-${sufijo}.png`;
}

async function descargar(canvas, nombre) {
  const blob = await aBlob(canvas);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function pintarTarjetas() {
  const contenedor = $('tarjetas');
  contenedor.replaceChildren();
  const ocupado = estado.generando[3] || estado.generando[4];

  for (const nivel of [1, 2, 3, 4, 5]) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    const titulo = document.createElement('h3');
    titulo.textContent = NOMBRES[nivel];
    tarjeta.append(titulo);

    const listo = nivel === 5 || estado.niveles[nivel];
    if (listo) {
      const canvas = tarjetaCanvas(nivel);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${NOMBRES[nivel]}: ${estado.palabra}`);
      tarjeta.append(canvas);
    } else {
      const espera = document.createElement('div');
      espera.className = 'espera';
      if (estado.errores[nivel]) {
        espera.classList.add('error');
        espera.textContent = estado.errores[nivel];
      } else {
        espera.textContent = estado.generando[nivel] ? 'Dibujando…' : 'Esperando al nivel 3…';
      }
      tarjeta.append(espera);
    }

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    if (listo) {
      const botonDescargar = document.createElement('button');
      botonDescargar.type = 'button';
      botonDescargar.className = 'boton boton-pequeno';
      botonDescargar.textContent = '⬇️ PNG';
      botonDescargar.setAttribute('aria-label', `Descargar tarjeta ${NOMBRES[nivel]}`);
      botonDescargar.addEventListener('click', () => descargar(tarjetaCanvas(nivel), nombreArchivo(`nivel-${nivel}`)));
      acciones.append(botonDescargar);
    }
    if (nivel === 3 || nivel === 4) {
      const botonRegenerar = document.createElement('button');
      botonRegenerar.type = 'button';
      botonRegenerar.className = 'boton boton-pequeno';
      botonRegenerar.textContent = '🔄 Regenerar';
      botonRegenerar.setAttribute('aria-label', `Regenerar ${NOMBRES[nivel]}`);
      botonRegenerar.title = nivel === 3 ? 'Rehace el nivel 3 y después el 4, para que coincidan' : 'Rehace solo el nivel 4';
      botonRegenerar.disabled = ocupado || (nivel === 4 && !estado.niveles[3]);
      botonRegenerar.addEventListener('click', () => regenerar(nivel));
      acciones.append(botonRegenerar);
    }
    tarjeta.append(acciones);
    contenedor.append(tarjeta);
  }

  const completa = estado.niveles[3] && estado.niveles[4];
  $('boton-lamina').disabled = !completa;
  $('boton-guardar').disabled = !completa || ocupado;
  $('boton-guardar').textContent = estado.idGuardada ? '✅ Guardada en Mi banco' : '💾 Guardar en Mi banco';
  $('boton-mayusculas').setAttribute('aria-pressed', String(estado.mayusculas));
  $('boton-minusculas').setAttribute('aria-pressed', String(!estado.mayusculas));
}

function laminaCanvas() {
  return componerLamina([1, 2, 3, 4, 5].map(tarjetaCanvas));
}

// ---------- MAYÚSCULAS / minúsculas ----------
function cambiarLetra(mayusculas) {
  estado.mayusculas = mayusculas;
  guardarPreferencia(mayusculas);
  pintarTarjetas();
}
$('boton-mayusculas').addEventListener('click', () => cambiarLetra(true));
$('boton-minusculas').addEventListener('click', () => cambiarLetra(false));

// ---------- Descargar lámina completa ----------
$('boton-lamina').addEventListener('click', () => descargar(laminaCanvas(), nombreArchivo('lamina')));

// ---------- Guardar en Mi banco ----------
$('boton-guardar').addEventListener('click', async () => {
  try {
    const imagenes = {};
    for (const n of [1, 2, 3, 4]) imagenes[n] = await aBlob(estado.niveles[n]);
    const lamina = laminaCanvas();
    const mini = lienzo(Math.round(lamina.width / 3), Math.round(lamina.height / 3));
    mini.getContext('2d').drawImage(lamina, 0, 0, mini.width, mini.height);
    const datos = {
      palabra: estado.palabra,
      mayusculas: estado.mayusculas,
      fecha: Date.now(),
      imagenes,
      miniatura: await aBlob(mini, 'image/jpeg', 0.85),
    };
    if (estado.idGuardada) datos.id = estado.idGuardada;
    estado.idGuardada = await guardarLamina(datos);
    avisar('Guardada en Mi banco.');
    pintarTarjetas();
  } catch (error) {
    console.error(error);
    avisar('No se ha podido guardar en este dispositivo (¿falta espacio?).', true);
  }
});

// ---------- Vista "Mi banco" ----------
const urlsMiniaturas = [];

async function pintarBanco() {
  const lista = $('lista-banco');
  urlsMiniaturas.splice(0).forEach((u) => URL.revokeObjectURL(u));
  lista.replaceChildren();
  let laminas = [];
  try { laminas = await listarLaminas(); } catch { /* sin almacenamiento disponible */ }
  if (!laminas.length) {
    const vacio = document.createElement('li');
    vacio.textContent = 'Todavía no has guardado ninguna lámina.';
    lista.append(vacio);
    return;
  }
  for (const lamina of laminas) {
    const elemento = document.createElement('li');
    const url = URL.createObjectURL(lamina.miniatura);
    urlsMiniaturas.push(url);
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Lámina de ${lamina.palabra}`;

    const datos = document.createElement('div');
    datos.className = 'datos';
    const nombre = document.createElement('p');
    nombre.className = 'palabra-banco';
    nombre.textContent = lamina.palabra;
    const fecha = document.createElement('p');
    fecha.textContent = new Date(lamina.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' });

    const acciones = document.createElement('div');
    acciones.className = 'botonera';
    const abrir = document.createElement('button');
    abrir.type = 'button';
    abrir.className = 'boton boton-pequeno boton-principal';
    abrir.textContent = 'Abrir';
    abrir.addEventListener('click', () => abrirDelBanco(lamina.id));
    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'boton boton-pequeno';
    borrar.textContent = '🗑️ Borrar';
    borrar.setAttribute('aria-label', `Borrar la lámina ${lamina.palabra}`);
    borrar.addEventListener('click', async () => {
      if (!confirm(`¿Borrar la lámina «${lamina.palabra}»? No se puede deshacer.`)) return;
      await borrarLamina(lamina.id);
      if (estado.idGuardada === lamina.id) estado.idGuardada = null;
      pintarBanco();
    });
    acciones.append(abrir, borrar);
    datos.append(nombre, fecha, acciones);
    elemento.append(img, datos);
    lista.append(elemento);
  }
}

async function abrirDelBanco(id) {
  const lamina = await obtenerLamina(id);
  if (!lamina) return;
  reiniciar();
  estado.palabra = lamina.palabra;
  estado.mayusculas = lamina.mayusculas;
  for (const n of [1, 2, 3, 4]) estado.niveles[n] = await aLienzo(lamina.imagenes[n]);
  estado.idGuardada = lamina.id;
  $('palabra').value = lamina.palabra;
  $('paso-foto').hidden = true;
  $('resultado').hidden = false;
  mostrarVista('nueva');
  pintarTarjetas();
  window.scrollTo(0, 0);
}

// ---------- Arranque ----------
prepararFuente().finally(reiniciar);

// Instalación como app (PWA). Solo en la versión publicada, no al programar.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
