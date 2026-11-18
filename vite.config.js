// Configuración de Vite (el programa que sirve la app en tu ordenador y la
// prepara para publicarla).
//
// El complemento "apiLocal" hace que, al probar en tu ordenador con
// "npm run dev", las direcciones /api/... funcionen igual que en Vercel,
// leyendo la clave del archivo .env.local.
import { defineConfig, loadEnv } from 'vite';

function apiLocal() {
  return {
    name: 'api-local',
    configureServer(server) {
      // Cargamos .env.local en process.env (solo en el servidor, nunca en el navegador).
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));

      server.middlewares.use(async (req, res, next) => {
        const nombre = req.url.match(/^\/api\/([a-z]+)$/)?.[1];
        if (!nombre) return next();
        try {
          const modulo = await server.ssrLoadModule(`/api/${nombre}.js`);
          const trozos = [];
          for await (const trozo of req) trozos.push(trozo);
          const peticion = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: req.method === 'POST' ? Buffer.concat(trozos) : undefined,
          });
          const manejador = modulo[req.method];
          const respuesta = manejador
            ? await manejador(peticion)
            : new Response('Método no permitido', { status: 405 });
          res.statusCode = respuesta.status;
          respuesta.headers.forEach((valor, clave) => res.setHeader(clave, valor));
          res.end(Buffer.from(await respuesta.arrayBuffer()));
        } catch (error) {
          console.error(error);
          res.statusCode = 500;
          res.end('Error en la función local');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [apiLocal()],
});
