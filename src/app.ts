// Importa Express (framework para crear el servidor HTTP / API)
import express from 'express';
// Importa CORS, para permitir peticiones desde otro origen (ej. Angular en localhost:4200)
import cors from 'cors';
// Importa Helmet, un conjunto de middlewares de seguridad (cabeceras HTTP)
import helmet from 'helmet';
// Importa el router de planes, que maneja las rutas /api/plans
import plansRoutes from './routes/plans.routes';

// Crea una instancia de aplicación Express
const app = express();

// Aplica Helmet a toda la app para mejorar la seguridad con cabeceras HTTP
app.use(helmet());

// Habilita CORS, permitiendo solicitudes desde el origen configurado en env.ALLOWED_ORIGIN
// credentials: true permite enviar cookies / cabeceras de autenticación si las usas
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:4200',
  credentials: false
}));

// Middleware para que Express pueda leer JSON en el body de las peticiones (req.body)
app.use(express.json());

// Monta el router de planes bajo el prefijo /api/plans.
// Cualquier ruta definida en plansRoutes se expondrá como /api/plans/...
app.use('/api/plans', plansRoutes);

// Ruta base de “healthcheck” para comprobar que el servidor está levantado.
// GET /api/health devolverá { ok: true }
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Exporta la instancia de app para usarla en server.ts (donde se llama app.listen)
export default app;