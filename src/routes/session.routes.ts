// Importa el creador de routers de Express
import { Router } from 'express';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listSessions,      // GET / -> listar todos las sessions
  getSession,        // GET /:id -> obtener una session por id
  createSession,     // POST / -> crear una session
  updateSession,     // PUT /:id -> actualizar una session por id
  deleteSession      // DELETE /:id -> eliminar un session por id
} from '../controllers/session.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente
router.get('/', listSessions);          // Listar todos
router.get('/:id', getSession);         // Leer uno por id
router.post('/', createSession);        // Crear nuevo
router.put('/:id', updateSession);      // Actualizar existente por id
router.delete('/:id', deleteSession);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/session', router))
export default router;