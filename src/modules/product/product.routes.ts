// Importa el creador de routers de Express
import { Router } from 'express';

//import { validateServiceId } from '../middlewares/id-validators';

import { validateProductId } from '../../middlewares/id-validators2';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listProducts,      // GET / -> listar todos los products
  getProduct,        // GET /:id -> obtener un product por id
  createProduct,     // POST / -> crear un product
  updateProduct,     // PUT /:id -> actualizar un product por id
  deleteProduct      // DELETE /:id -> eliminar un product por id
} from './product.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todos los services
router.get('/', listProducts);          

// Obtiene un service por ID (usa middleware para validar :id)
router.get('/:id', validateProductId, getProduct);      

// Crea un nuevo service (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createProduct);   

// Actualiza un service por ID (valida :id)
router.put('/:id', validateProductId, updateProduct);   

// Elimina un service por ID (valida :id)
router.delete('/:id', validateProductId, deleteProduct);  

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/services', router))
export default router;