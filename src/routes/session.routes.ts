// Importa el creador de routers de Express
import { Router } from 'express';

import { validateSessionId } from '../middlewares/id-validators';

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

// Lista todas los sessions
router.get('/', listSessions);        

// Obtiene una session por ID (usa middleware para validar :id)
router.get('/:id', validateSessionId, getSession);     

// Crea una nueva session (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createSession);       

// Actualiza una session por ID (valida :id)
router.put('/:id', validateSessionId, updateSession);      

// Elimina un session por ID (valida :id)
router.delete('/:id', validateSessionId, deleteSession);   

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/session', router))
export default router;