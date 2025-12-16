// Importa el creador de routers de Express
import { Router } from 'express';

//import { validatePaymentId } from '../middlewares/id-validators';

import { validatePaymentId } from '../middlewares/id-validators2';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listPayments,      // GET / -> listar todos los payments
  getPayment,        // GET /:id -> obtener un payment por id
  createPayment,     // POST / -> crear un payment
  updatePayment,     // PUT /:id -> actualizar un payment por id
  deletePayment      // DELETE /:id -> eliminar un payment por id
} from '../controllers/payment.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todos los payments
router.get('/', listPayments);          

// Obtiene un payment por ID (usa middleware para validar :id)
router.get('/:id', validatePaymentId, getPayment);  

// Crea una nueva session (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createPayment);        

// Actualiza un payment por ID (valida :id)
router.put('/:id', validatePaymentId, updatePayment);     

// Elimina un payment por ID (valida :id)
router.delete('/:id', validatePaymentId, deletePayment);   

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/payments', router))
export default router;