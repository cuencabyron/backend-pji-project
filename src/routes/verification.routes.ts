// Importa el creador de routers de Express
import { Router } from 'express';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listVerifications,      // GET / -> listar todos las verifications
  getVerification,        // GET /:id -> obtener una verification por id
  createVerification,     // POST / -> crear un verification
  updateVerification,     // PUT /:id -> actualizar un verification por id
  deleteVerification     // DELETE /:id -> eliminar un verification por id
} from '../controllers/verification.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente
router.get('/', listVerifications);          // Listar todos
router.get('/:id', getVerification);         // Leer uno por id
router.post('/', createVerification);        // Crear nuevo
router.put('/:id', updateVerification);      // Actualizar existente por id
router.delete('/:id', deleteVerification);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/verifications', router))
export default router;