// Importa el creador de routers de Express
import { Router } from 'express';

import { validateServiceId } from '../middlewares/id-validators';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listServices,      // GET / -> listar todos los services
  getService,        // GET /:id -> obtener un service por id
  createService,     // POST / -> crear un service
  updateService,     // PUT /:id -> actualizar un service por id
  deleteService      // DELETE /:id -> eliminar un service por id
} from '../controllers/service.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente

// Lista todos los services
router.get('/', listServices);          

// Obtiene un service por ID (usa middleware para validar :id)
router.get('/:id', validateServiceId, getService);      

// Crea un nuevo service (no necesita validar :id porque no hay parámetro en la URL)
router.post('/', createService);   

// Actualiza un service por ID (valida :id)
router.put('/:id', validateServiceId, updateService);   

// Elimina un service por ID (valida :id)
router.delete('/:id', validateServiceId, deleteService);  

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/services', router))
export default router;