# PICTO APP

App web (se instala en el móvil o el iPad como una app) que, a partir de **una foto de un objeto real**, crea una lámina de Comunicación Aumentativa y Alternativa con el mismo objeto en **6 niveles**:

| Nivel | Qué es | Cómo se hace |
|---|---|---|
| 1 · Foto real | Objeto recortado sobre fondo blanco | En el propio dispositivo (`@imgly/background-removal`), sin IA en la nube |
| 2 · Foto con contorno | La misma foto con contorno negro grueso | En el propio dispositivo, a partir del recorte del nivel 1 |
| 3 · Dibujo animado | Mezcla de foto y pictograma: el mismo objeto dibujado como en una serie infantil de dibujos animados, con sus detalles, líneas negras limpias y sombreado sencillo (sin cara ni ojos) | IA de Google Gemini (envía la foto con contorno del nivel 2) |
| 4 · Pictograma | Dibujo plano, mismos colores y rasgos | IA de Google Gemini (envía el dibujo animado del nivel 3) |
| 5 · Pictograma abstracto | Silueta en blanco y negro | IA de Google Gemini (envía el pictograma del nivel 4) |
| 6 · Palabra | Solo la palabra | En el propio dispositivo |

Cada nivel de IA se dibuja **a partir del anterior**, así se van simplificando paso a paso y siguen pareciéndose entre sí. Por eso **«Regenerar» en un nivel rehace también los siguientes** (regenerar el 3 rehace 3, 4 y 5; el 4 rehace 4 y 5; el 5 solo el 5).

La palabra la propone un modelo de texto barato de Gemini y **el docente siempre puede corregirla**.

---

## 1. Cómo cambiar los prompts (lo que se le pide a la IA)

1. En GitHub, abre tu repositorio y entra en la carpeta **`config`** → archivo **`prompts.js`**.
2. Pulsa el **lápiz ✏️** (arriba a la derecha, "Edit this file").
3. Cambia **solo el texto que está entre las comillas invertidas** `` ` `` (no borres las comillas ni el `;` del final).
   - `{palabra}` se sustituye sola por la palabra de la lámina (por ejemplo "vaso").
4. Abajo, pulsa **"Commit changes…"** y otra vez **"Commit changes"**.
5. Vercel publica la nueva versión sola en 1-2 minutos. No hay que hacer nada más.

En `prompts.js` hay cuatro textos: `PROMPT_NIVEL_3` (dibujo animado), `PROMPT_NIVEL_4` (pictograma), `PROMPT_NIVEL_5` (abstracto) y `PROMPT_PALABRA`.

**Ajustar el dibujo animado (nivel 3):**
- Si se parece demasiado a la foto → pide «menos detalles» o «colores más planos».
- Si se parece demasiado al pictograma → pide «conserva más detalles de la foto» o «añade un segundo tono de sombra».
- Si la IA le pone cara u ojos al objeto → la frase «NO le añadas cara, ojos…» ya lo prohíbe; si aun así pasa, ponla al principio del texto.

> Si algún cambio rompe la app (por ejemplo, borraste una comilla), en GitHub abre el archivo → **History** → elige la versión anterior y vuelve a copiar su texto.

---

## 2. Cuánto cuesta cada lámina

Precios de la API de Gemini (nivel de pago, noviembre 2026, en dólares; compruébalos en la [página oficial de precios](https://ai.google.dev/gemini-api/docs/pricing), porque Google los cambia):

| Paso | Modelo | Coste aproximado |
|---|---|---|
| Dibujo animado (nivel 3), imagen 1K | `gemini-nano-banana-2.1` | ~0,036 $ |
| Pictograma (nivel 4), imagen 1K | `gemini-nano-banana-2.1` | ~0,036 $ |
| Pictograma abstracto (nivel 5), imagen 1K | `gemini-nano-banana-2.1` | ~0,036 $ |
| Palabra propuesta | `gemini-3.1-flash-lite` | ~0,0004 $ |
| **Lámina completa** | | **≈ 0,11 $ (unos 0,10 €)** |
| «Regenerar» | | ≈ 0,036 $ por cada nivel que se rehace (desde el 3: ≈ 0,11 $; desde el 4: ≈ 0,07 $; el 5: ≈ 0,036 $) |

Cuentas rápidas:
- **5 € al mes ≈ 45 láminas.**
- El **límite de 30 láminas al día** (90 imágenes, contando las regeneraciones) hace que el máximo posible en un día sea de unos **3 €**.
- Quitar el fondo, el contorno, la palabra (nivel 6), la lámina y "Mi banco" son **gratis**: se hacen en el dispositivo.
- Si vuelves al modelo original Nano Banana 2 (`gemini-3.1-flash-image`), la lámina cuesta unas **0,21 $** (el doble).

---

## 3. Cómo ver el gasto y poner la alerta de 5 €/mes

**Ver el gasto:**
1. Entra en [console.cloud.google.com](https://console.cloud.google.com) con la misma cuenta de Google.
2. Arriba, selecciona el proyecto que creó AI Studio (suele llamarse "Gemini API" o "Default Gemini Project").
3. Menú ☰ → **Facturación** → **Informes**. Ahí ves lo gastado por día y por servicio ("Gemini API" / "Generative Language API").
   - Los cargos pueden tardar hasta 24 h en aparecer.
4. También en [aistudio.google.com](https://aistudio.google.com) → **Usage / Uso** ves cuántas peticiones se han hecho.

**Alerta de presupuesto de 5 €:**
1. Menú ☰ → **Facturación** → **Presupuestos y alertas** → **Crear presupuesto**.
2. Nombre: `PICTO APP`. En "Proyectos", marca solo el proyecto de Gemini. Pulsa **Siguiente**.
3. Tipo: **Importe especificado** → `5` €. **Siguiente**.
4. Umbrales: deja 50 %, 90 % y 100 %. Marca **"Enviar alertas por correo a los administradores de facturación"**.
5. **Finalizar**.

⚠️ La alerta **avisa, pero no corta** el servicio. Lo que de verdad impide gastos grandes es el **límite diario** de la app (sección 4). Si quieres gastar aún menos, bájalo.

---

## 4. Límite diario y modelos (sin tocar código)

En Vercel → tu proyecto → **Settings → Environment Variables** puedes añadir:

| Variable | Para qué | Por defecto |
|---|---|---|
| `LIMITE_LAMINAS_DIA` | Máximo de láminas al día | `30` |
| `MODELO_IMAGEN` | Modelo de los niveles 3, 4 y 5 | `gemini-nano-banana-2.1` |
| `MODELO_TEXTO` | Modelo que propone la palabra | `gemini-3.1-flash-lite` |
| `TAMANO_IMAGEN` | Tamaño de las imágenes de la IA | `1K` |

Tras cambiar una variable: **Deployments** → los tres puntos `⋯` del último → **Redeploy**.

> **Sobre "Nano Banana 2":** el 6 de octubre de 2026 Google marcó `gemini-3.1-flash-image` (Nano Banana 2) como obsoleto y recomienda su sucesor `gemini-nano-banana-2.1` para proyectos nuevos, que además es más barato. Por eso la app usa el 2.1. Si un día Google lo retira, la app mostrará «El modelo … no existe»: busca el nuevo nombre en [la lista de modelos](https://ai.google.dev/gemini-api/docs/models) y ponlo en `MODELO_IMAGEN`.

El contador diario se guarda en **Upstash Redis** (gratuito). Si no está conectado, la app publicada **se niega a generar** imágenes: así nunca puede haber un gasto sin control.

---

## 5. Publicar la app (una sola vez)

### 5.1 Cuentas que necesitas
1. **GitHub** (gratis): guarda el código. Ya la tienes.
2. **Google AI Studio con facturación** (de pago, por uso): da la clave de Gemini.
3. **Vercel** (plan gratuito "Hobby"): publica la app y guarda la clave en secreto.
4. **Upstash** (gratis): se crea desde Vercel con 2 clics, no hace falta registrarse aparte.

### 5.2 Clave de Gemini
1. Entra en [aistudio.google.com](https://aistudio.google.com) con tu cuenta de Google.
2. Abajo a la izquierda, **Get API key** → **Create API key** → elige o crea un proyecto.
3. Junto a la clave verás **"Set up billing"** (Configurar facturación): púlsalo, crea una cuenta de facturación y añade una tarjeta. Sin esto los modelos de imagen no funcionan.
4. **Copia la clave** (empieza por `AIza…`). Guárdala en un sitio seguro. **No la pegues nunca en un archivo del código, ni en GitHub, ni en un chat.**

### 5.3 Vercel
1. Entra en [vercel.com](https://vercel.com) → **Sign Up** → **Hobby** → **Continue with GitHub**.
2. **Add New… → Project**. Si no aparece el repositorio `RealPicto`, pulsa **"Adjust GitHub App Permissions"** y dale acceso.
3. Pulsa **Import** en `RealPicto`.
4. "Framework Preset" debe decir **Vite** (sale solo). No toques nada más.
5. Abre **Environment Variables** y añade:
   - Name: `GEMINI_API_KEY` · Value: *(pega tu clave)* → **Add**.
6. Pulsa **Deploy** y espera 1-2 minutos.

### 5.4 Contador diario (Upstash)
1. En tu proyecto de Vercel, pestaña **Storage** → **Create Database**.
2. Elige **Upstash** → **Upstash for Redis** → **Continue**.
3. Plan **Free**, región **Frankfurt (eu-central-1)** → **Create**.
4. Cuando pregunte, **Connect** al proyecto `RealPicto` (deja marcados todos los entornos).
5. Vercel añade solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
6. Ve a **Deployments** → `⋯` del último → **Redeploy** (las variables solo se aplican a las publicaciones nuevas).

### 5.5 Abrirla en el iPad
1. En Vercel, copia la dirección del proyecto (algo como `https://realpicto.vercel.app`).
2. Ábrela en **Safari** del iPad.
3. Botón **Compartir** (cuadrado con flecha) → **Añadir a pantalla de inicio** → **Añadir**.
4. Ábrela desde el icono. **Importante:** así Safari no borra "Mi banco" aunque pases semanas sin usarla.
5. La primera foto tarda más (descarga una vez el programa de recorte, unos 40-80 MB; mejor con wifi).

### 5.6 Si Vercel publica la rama equivocada
Vercel publica la rama principal del repositorio. Si la app no se actualiza al cambiar los prompts, en Vercel → **Settings → Git → Production Branch** escribe el nombre de la rama donde haces los cambios.

---

## 6. Privacidad
- **No fotografíes caras de alumnos** (aviso visible en la app).
- La foto original **no sale del dispositivo**: el fondo se quita en el propio iPad o móvil.
- Solo el **objeto recortado** (y los dibujos que va haciendo la IA) se envían a Google Gemini a través de nuestra función de Vercel, que **no guarda nada**.
- "Mi banco" se guarda **solo en el dispositivo** (IndexedDB). No hay cuentas ni base de datos en la nube. Si borras los datos de Safari, se borra el banco.
- La clave de Gemini está solo en Vercel (variable de entorno). El navegador nunca la ve.

---

## 7. Probar en un ordenador (opcional, para quien programe)
Requiere [Node.js](https://nodejs.org) 20 o superior.
```bash
npm install
cp .env.example .env.local   # y pega tu clave en GEMINI_API_KEY
npm run dev                  # abre http://localhost:5173
```
En local el contador diario funciona en memoria (se reinicia al parar el programa).

---

## 8. Archivos del proyecto
```
config/prompts.js     ← LOS PROMPTS (lo que puedes editar)
config/modelos.js     ← modelos, tamaño de imagen y límites
api/pictograma.js     ← función de Vercel: niveles 3, 4 y 5
api/palabra.js        ← función de Vercel: palabra propuesta
api/_lib/             ← llamada a Gemini, límite diario, utilidades
src/main.js           ← pantalla y funcionamiento de la app
src/imagenes.js       ← recorte (nivel 1), contorno (nivel 2), encuadre
src/tarjetas.js       ← dibujo de tarjetas y lámina
src/banco.js          ← "Mi banco" (IndexedDB)
public/               ← iconos, manifest y service worker (instalación como app)
```

## 9. Licencias
- La librería de recorte `@imgly/background-removal` tiene licencia **AGPL-3.0**: puedes usarla gratis, pero el código de la app debe estar disponible para quien la use. Lo más sencillo es dejar el repositorio de GitHub **público**. Si algún día se quiere hacer privado o comercial, IMG.LY vende una licencia comercial.
- Tipografía Atkinson Hyperlegible (SIL Open Font License), incluida en la app (no se carga de Google Fonts, para no enviar datos a terceros).

## 10. Láminas guardadas antes de añadir el dibujo animado
Las láminas que guardaste con la versión de 5 niveles se abren bien: su pictograma pasa a ser el nivel 4, su abstracto el 5, y el nivel 3 aparece como «Falta el nivel 3». Pulsa «Regenerar» en él para crearlo. Ten en cuenta que eso rehace también los niveles 4 y 5.
