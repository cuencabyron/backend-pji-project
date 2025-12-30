/*
// Importa el creador de routers de Express
import { Router } from 'express';

// Importa los controladores (handlers) para cada operación del CRUD
import { 
  listRanges,       // GET / -> listar todos los rangos de precios
  getRange,        // GET /:id -> obtener un rango de precio por id
  createRange,     // POST / -> crear un rango de precio
  updateRange,     // PUT /:id -> actualizar un rango de precio por id
  deleteRange      // DELETE /:id -> eliminar un rango de precio por id
} from '../controllers/servicepricerange.controller';

// Crea una instancia de router independiente
const router = Router();

// Define las rutas y asigna el controlador correspondiente
router.get('/', listRanges);          // Listar todos
router.get('/:id', getRange);         // Leer uno por id
router.post('/', createRange);        // Crear nuevo
router.put('/:id', updateRange);      // Actualizar existente por id
router.delete('/:id', deleteRange);   // Eliminar por id

// Exporta el router para montarlo en app.ts (por ejemplo: app.use('/api/servicepricerange', router))
export default router;
*/
