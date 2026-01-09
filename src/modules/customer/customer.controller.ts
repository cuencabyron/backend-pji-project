
/** Controladores HTTP (controllers) para la entidad Customer.
 *
 * Este archivo expone las funciones (handlers) que se asocian a las rutas
 * REST de la API. Cada función:
 *
 *  1) Lee parámetros de la petición (params, body).
 *  2) Invoca la capa de servicios (customer.service) donde está la lógica
 *     de acceso a datos y reglas de negocio.
 *  3) Traduce el resultado a una respuesta HTTP adecuada:
 *       - 200 OK    → operación exitosa (lecturas / actualizaciones).
 *       - 201 Created → recurso creado.
 *       - 204 No Content → recurso eliminado sin cuerpo de respuesta.
 *       - 400 Bad Request → datos inválidos o incompletos.
 *       - 404 Not Found → recurso no encontrado.
 *       - 409 Conflict → conflicto de negocio (email duplicado, etc.).
 *       - 500 Internal Server Error → error inesperado.
 *
 * Importante:
 *   - Aquí NO va la lógica de acceso a datos (eso está en los services).
 *   - Aquí NO debería ir lógica de negocio pesada; solo orquestación y manejo de HTTP.
 */

// Tipos de Express para tipar las funciones de controlador.
import { Request, Response } from 'express';

// Funciones de la capa de servicio que encapsulan la lógica de acceso a datos
// y reglas básicas de negocio para Customer.
import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/customer/customer.service';

// ============================================================================
// GET /api/customers
// ============================================================================

/** Lista todos los customers.
 * - No usa parámetros de la petición (por eso se ignora `_req`).
 * - Llama a `findAllCustomers()` en la capa de servicios.
 * - Devuelve el array de customers como JSON.
 */
export async function listCustomers(_req: Request, res: Response) 
{
  try {
    // Llama al servicio que consulta todos los registros en BD.
    const items = await findAllCustomers();

    // Respuesta 200 OK con el listado completo.
    res.json(items);
  } catch (err) {
    // Cualquier error inesperado se registra en consola…
    console.error('Error listando customers:', err);
    // …y se notifica al cliente con un 500 genérico.
    res.status(500).json({ message: 'Error listando customers' });
  }
}

// ============================================================================
// GET /api/customers/:id
// ============================================================================

/** Obtiene un customer específico por su ID.
 * - Lee el parámetro de ruta `id` (UUID normalmente).
 * - Llama a `findCustomerById(id)` en la capa de servicios.
 * - Si no existe, devuelve 404. Si existe, devuelve el objeto como JSON.
 */
export async function getCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el `id` de los parámetros de ruta: /api/customers/:id
    const { id } = req.params;

    // Consulta al servicio por ese customer.
    const item = await findCustomerById(id);

    // Si no se encontró en la BD, se responde con 404 Not Found.
    if (!item) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    // Si existe, se devuelve con 200 OK.
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo customer:', err);
    res.status(500).json({ message: 'Error obteniendo customer' });
  }
}

// ============================================================================
// POST /api/customers
// ============================================================================

/** Crea un nuevo customer.
 * - Lee el body con los datos del nuevo registro.
 * - Valida que los campos obligatorios estén presentes.
 * - Llama a `createCustomerService` para aplicar reglas de negocio
 *   y guardar en la BD.
 * - Maneja el caso especial de email duplicado con 409 Conflict.
 */
export async function createCustomer(req: Request, res: Response) 
{
  try {
    // Desestructuramos los campos esperados del body.
    const { name, email, phone, address, active } = req.body;

    // Validación rápida de campos obligatorios (nivel controlador).
    if (!name || !email || !phone || !address) 
    {
      return res.status(400).json({
        message: 'name, email, phone, address son requeridos',
      });
    }

    // Llamamos al servicio, que encapsula la lógica de negocio
    // (por ejemplo, normalización de datos, comprobación de duplicados, etc.).
    const saved = await createCustomerService({
      name,
      email,
      phone,
      address,
      active,
    });

    // Si todo sale bien, respondemos con 201 Created y el recurso creado.
    res.status(201).json(saved);
  } catch (err: any) {
    // Regla de negocio propagada desde el servicio:
    // el email ya existe en otro customer.
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }

    // Cualquier otro error se considera inesperado.
    console.error('Error creando customer:', err);
    res.status(500).json({ message: 'Error creando customer' });
  }
}

// ============================================================================
// PUT /api/customers/:id
// ============================================================================

/** Actualiza parcialmente un customer existente.
 * - Lee el `id` de los params y los nuevos valores del body.
 * - Llama a `updateCustomerService(id, dto)` para que la capa de servicios
 *   actualice solo los campos proporcionados.
 * - Si el customer no existe, devuelve 404.
 * - Si el servicio detecta email duplicado, devuelve 409.
 */
export async function updateCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const { name, email, phone, address, active } = req.body;

    // Enviamos al servicio un objeto con los posibles cambios.
    const updated = await updateCustomerService(id, 
    {
      name,
      email,
      phone,
      address,
      active,
    });

    // Si el servicio devuelve null/undefined, el registro no existe.
    if (!updated) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    // Actualización correcta → 200 OK con el customer actualizado.
    res.json(updated);
  } catch (err: any) {
    // Misma regla de negocio que en create:
    // el email ya está ocupado por otro customer.
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }

    console.error('Error actualizando customer:', err);
    res.status(500).json({ message: 'Error actualizando customer' });
  }
}

// ============================================================================
// DELETE /api/customers/:id
// ============================================================================

/** Elimina un customer por su ID.
 * - Lee el `id` desde los parámetros de ruta.
 * - Llama a `deleteCustomerService(id)` que devuelve cuántas filas se han borrado
 *   o lanza errores de negocio (por ejemplo, tiene pagos activos).
 * - Si no se borró ninguna fila, se responde 404 (no existía).
 * - Si se borra correctamente, responde 204 No Content (sin body).
 * - Si el servicio detecta que tiene pagos activos, responde 409 Conflict.
 */
export async function deleteCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    // `deleted` suele ser el número de filas afectadas por el DELETE.
    const deleted = await deleteCustomerService(id);

    // Si es 0, es que no había un customer con ese id.
    if (!deleted) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    // Eliminado correctamente; 204 indica éxito sin contenido en el body.
    return res.status(204).send();
  } catch (err: any) {
    // Regla de negocio: no se puede borrar porque tiene pagos activos.
    if (err?.code === 'CUSTOMER_HAS_ACTIVE_PAYMENTS') {
      return res.status(409).json({
        message: 'No se puede eliminar el customer porque tiene pagos activos.',
      });
    }

    console.error('Error eliminando customer:', err);
    return res.status(500).json({ message: 'Error eliminando customer' });
  }
}