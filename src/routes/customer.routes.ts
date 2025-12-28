// Importa el creador de routers de Express
import { Router } from 'express';

//import { validateCustomerId } from '../middlewares/id-validators';

//import { validateCustomerId } from '../middlewares/id-validators2';

import { uuidIdParamValidator } from '@/middlewares/common.validators';

import { handleValidationErrors } from '@/middlewares/validation.middleware';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listCustomers,      // GET / -> listar todos los customers
  getCustomer,        // GET /:id -> obtener un customer por id
  createCustomer,     // POST / -> crear un customer
  updateCustomer,     // PUT /:id -> actualizar un customer por id
  //deleteCustomer      // DELETE /:id -> eliminar un customer por id
} from '../controllers/customer.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todos los customers
router.get('/', listCustomers);                            

// Obtiene un customer por ID (usa middleware para validar :id)
router.get(
  '/:id',
  uuidIdParamValidator('customer'),
  handleValidationErrors,
  getCustomer
);      

// Crea un nuevo customer (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createCustomer);                                           

// Actualiza un customer por ID (valida :id)
router.put(
  '/:id',
  uuidIdParamValidator('customer'),
  handleValidationErrors,
  updateCustomer
);    

/* Elimina un customer por ID (valida :id)
router.delete(
  '/:id',
  uuidIdParamValidator('customer'),
  handleValidationErrors,
  deleteCustomer
);*/

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/customers', router))
export default router;