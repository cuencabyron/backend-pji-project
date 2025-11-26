// Importa el creador de routers de Express
import { Router } from 'express';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listCustomers,      // GET / -> listar todos los customers
  getCustomer,        // GET /:id -> obtener un customer por id
  createCustomer,     // POST / -> crear un customer
  updateCustomer,     // PUT /:id -> actualizar un customer por id
  deleteCustomer      // DELETE /:id -> eliminar un customer por id
} from '../controllers/customer.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente
router.get('/', listCustomers);          // Listar todos
router.get('/:id', getCustomer);         // Leer uno por id
router.post('/', createCustomer);        // Crear nuevo
router.put('/:id', updateCustomer);      // Actualizar existente por id
router.delete('/:id', deleteCustomer);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/customers', router))
export default router;