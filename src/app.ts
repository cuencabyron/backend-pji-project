// Importa Express (framework para crear el servidor HTTP / API)
import express from 'express';
// Importa CORS, para permitir peticiones desde otro origen (ej. Angular en localhost:4200)
import cors from 'cors';
// Importa Helmet, un conjunto de middlewares de seguridad (cabeceras HTTP)
import helmet from 'helmet';
// Importa el router de customer, que maneja las rutas /api/customers
import customersRoutes from '@/routes/customer.routes';
// Importa el router de service, que maneja las rutas /api/services
import servicesRoutes from '@/routes/service.routes';
// Importa el router de session, que maneja las rutas /api/sessions
import sessionsRoutes from '@/routes/session.routes';
// Importa el router de payment, que maneja las rutas /api/payments
import paymentsRoutes from '@/routes/payment.routes';
// Importa el router de verification, que maneja las rutas /api/verifications
import verificationsRoutes from '@/routes/verification.routes';
// Importa el router de servicepricerange, que maneja las rutas /api/servicepricerange
//import servicepricerangeRoutes from './routes/servicepricerange.routes';

// Crea una instancia de aplicación Express
const app = express();

// Aplica Helmet a toda la app para mejorar la seguridad con cabeceras HTTP
app.use(helmet());

// Habilita CORS, permitiendo solicitudes desde el origen configurado en env.ALLOWED_ORIGIN
// credentials: true permite enviar cookies / cabeceras de autenticación si las usas
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGIN ?? '*',
  credentials: false
}));

// Middleware para que Express pueda leer JSON en el body de las peticiones (req.body)
app.use(express.json());

// Monta el router de customers bajo el prefijo /api/customers.
// Cualquier ruta definida en customerRoutes se expondrá como /api/customers/...
app.use('/api/customers', customersRoutes);

// Monta el router de services bajo el prefijo /api/services.
// Cualquier ruta definida en serviceRoutes se expondrá como /api/services/...
app.use('/api/services', servicesRoutes);

// Monta el router de sessions bajo el prefijo /api/sessions.
// Cualquier ruta definida en sessionRoutes se expondrá como /api/sessions/...
app.use('/api/sessions', sessionsRoutes);

// Monta el router de verifications bajo el prefijo /api/verifications.
// Cualquier ruta definida en verificationRoutes se expondrá como /api/verifications/...
app.use('/api/verifications', verificationsRoutes);

// Monta el router de payments bajo el prefijo /api/payments.
// Cualquier ruta definida en sessionRoutes se expondrá como /api/payment/...
app.use('/api/payments', paymentsRoutes);

// Monta el router de payments bajo el prefijo /api/payments.
// Cualquier ruta definida en sessionRoutes se expondrá como /api/payment/...
//app.use('/api/servicepricerange', servicepricerangeRoutes);

// Ruta base de “healthcheck” para comprobar que el servidor está levantado.
// GET /api/health devolverá { ok: true }
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Exporta la instancia de app para usarla en server.ts (donde se llama app.listen)
export default app;