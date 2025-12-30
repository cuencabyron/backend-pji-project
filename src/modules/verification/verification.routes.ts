// Importa el creador de routers de Express
import { Router } from 'express';

//import { validateVerificationId } from '../middlewares/id-validators';

import { validateVerificationId } from '../../middlewares/id-validators2';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listVerifications,      // GET / -> listar todos las verifications
  getVerification,        // GET /:id -> obtener una verification por id
  createVerification,     // POST / -> crear un verification
  updateVerification,     // PUT /:id -> actualizar un verification por id
  deleteVerification     // DELETE /:id -> eliminar un verification por id
} from './verification.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todas los verifications
router.get('/', listVerifications);        

// Obtiene una verification por ID (usa middleware para validar :id)
router.get('/:id', validateVerificationId, getVerification);         

// Crea una nueva verification (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createVerification);        

// Actualiza una session por ID (valida :id)
router.put('/:id', validateVerificationId, updateVerification);     

// Elimina una verification por ID (valida :id)
router.delete('/:id', validateVerificationId, deleteVerification);   

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/verifications', router))
export default router;