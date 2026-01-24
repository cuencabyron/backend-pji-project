// Importa el creador de routers de Express
import { Router } from 'express';

//import { validatePaymentId } from '../middlewares/id-validators';

//import { validatePaymentId } from '../middlewares/id-validators2';

import { uuidIdParamValidator } from '../../middlewares/common.validators';

import { handleValidationErrors } from '../../middlewares/validation.middleware';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listPayments,      // GET / -> listar todos los payments
  getPayment,        // GET /:id -> obtener un payment por id
  createPayment,     // POST / -> crear un payment
  updatePayment,     // PUT /:id -> actualizar un payment por id
  deletePayment      // DELETE /:id -> eliminar un payment por id
} from './payment.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todos los payments
router.get('/', listPayments);                            

// Obtiene un payment por ID (usa middleware para validar :id)
router.get(
  '/:id',
  uuidIdParamValidator('payment'),
  handleValidationErrors,
  getPayment
);      

// Crea un nuevo payment (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createPayment);                                           

// Actualiza un payment por ID (valida :id)
router.put(
  '/:id',
  uuidIdParamValidator('payment'),
  handleValidationErrors,
  updatePayment
);    

// Elimina un payment por ID (valida :id)
router.delete(
  '/:id',
  uuidIdParamValidator('payment'),
  handleValidationErrors,
  deletePayment
);

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/payments', router))
export default router;