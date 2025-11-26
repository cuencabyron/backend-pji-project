// Importa el creador de routers de Express
import { Router } from 'express';

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
router.get('/', listServices);          // Listar todos
router.get('/:id', getService);         // Leer uno por id
router.post('/', createService);        // Crear nuevo
router.put('/:id', updateService);      // Actualizar existente por id
router.delete('/:id', deleteService);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/services', router))
export default router;