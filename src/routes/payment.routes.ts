// Importa el creador de routers de Express
import { Router } from 'express';

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
router.get('/', listPayments);          // Listar todos
router.get('/:id', getPayment);         // Leer uno por id
router.post('/', createPayment);        // Crear nuevo
router.put('/:id', updatePayment);      // Actualizar existente por id
router.delete('/:id', deletePayment);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/payments', router))
export default router;