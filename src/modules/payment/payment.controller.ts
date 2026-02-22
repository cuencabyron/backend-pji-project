/** Controladores HTTP para la entidad Payment.
 *  Estas funciones son los "handlers" que atienden las rutas:
 *    - GET    /api/payments
 *    - GET    /api/payments/:id
 *    - POST   /api/payments
 *    - PUT    /api/payments/:id
 *    - DELETE /api/payments/:id
 *  Responsabilidades del controller:
 *    1) Leer datos de la petición (params, body).
 *    2) Llamar a la capa de servicios (payment.service.ts).
 *    3) Traducir el resultado / errores de negocio a respuestas HTTP:
 *          - 200 OK
 *          - 201 Created
 *          - 204 No Content
 *          - 400 Bad Request
 *          - 404 Not Found
 *          - 500 Internal Server Error
 */

// Tipos de Express para tipar las funciones de controlador.
import { Request, Response } from 'express';

import { findProductById } from '@/modules/product/product.service';

// Funciones de la capa de servicio que encapsulan la lógica de acceso a datos
// y reglas básicas de negocio para Payment.
import {
  findAllPayments,
  findPaymentById,
  createPaymentService,
  updatePaymentService,
  deletePaymentService,
} from '@/modules/payment/payment.service';

// ============================================================================
// GET /api/payments
// ============================================================================
/** Lista todos los payments registrados.
 *    - No usa parámetros ni body.
 *    - Llama al servicio `findAllPayments`, que se encarga de consultar la BD.
 *    - Devuelve el arreglo de payments como JSON.
 */
export async function listPayments(_req: Request, res: Response) 
{
  try {
    // Recupera todos los payments desde la capa de servicios.
    const items = await findAllPayments();

    // Responde con la lista de payments.
    res.json(items);
  } catch (err) {
    // Si ocurre un error inesperado (BD caída, bug, etc.),
    // se escribe en consola y se devuelve 500.
    console.error('Error listando payments:', err);
    res.status(500).json({ message: 'Error listando payments' });
  }
}

// ============================================================================
// GET /api/payments/:id
// ============================================================================
/** Devuelve un payment específico por su ID.
 *    - Lee `id` desde los parámetros de ruta.
 *    - Llama a `findPaymentById(id)` para buscar en la BD.
 *    - Si no existe, responde con 404.
 *    - Si existe, lo devuelve como JSON (incluyendo su customer asociado).
 */
export async function getPayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el id de los parámetros de ruta: /api/payments/:id
    const { id } = req.params;

    // Consulta el pago por ID en la capa de servicios.
    const item = await findPaymentById(id);

    // Si no se encontró, responder 404.
    if (!item) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    // Devolver el payment encontrado.
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo payment:', err);
    res.status(500).json({ message: 'Error obteniendo payment' });
  }
}

// ============================================================================
// POST /api/payments
// ============================================================================
/** Crea un nuevo payment.
 *    - Lee el body con los datos del pago:
 *        - customer_id (obligatorio)
 *        - amount (obligatorio)
 *        - currency (opcional en esta validación básica)
 *        - method (obligatorio)
 *        - status (opcional, por defecto 'pending' a nivel de servicio)
 *        - external_ref (opcional en esta validación básica, pero requerido en el DTO)
 *    - Valida campos mínimos requeridos:
 *        - Si falta customer_id, amount o method → 400 Bad Request.
 *    - Llama a `createPaymentProduct(...)`, que:
 *        - Verifica que el customer exista (si no, lanza error con code 'CUSTOMER_NOT_FOUND').
 *        - Crea y guarda el payment en la BD.
 *    - Devuelve el payment creado con 201 (Created).
 */
export async function createPayment(req: Request, res: Response) 
{
  try {
    // Extrae los campos del body. `?? {}` evita errores si el body viene undefined.
    const { customer_id, product_id, method } = req.body ?? {};

    // Validación rápida de campos obligatorios mínimos.
    if (!customer_id || !product_id || !method ) 
    {
      return res.status(400).json({
        message: 'Datos incompletos',
      });
    }

    // Buscar producto en la BD
    const product = await findProductById(product_id);

    if (!product) {
      return res.status(400).json({ message: 'product_id no existe en la BD' });
    }

    const amount = (product.min_monthly_rent + product.max_monthly_rent) / 2;
    const currency = 'MXN';
    const status = 'paid';
    const external_ref = `PAY-${Date.now()}`;
    const paid_at = new Date();

    const saved = await createPaymentService({
      customer_id,
      product_id,
      method,
    });

    // Devolvemos el pago creado con código 201.
    res.status(201).json(saved);

  } catch (err: any) {
    // Regla de negocio: el customer_id no existe en la BD
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    if (err?.code === 'PRODUCT_NOT_FOUND') {
      return res
      .status(400)
      .json({ message: 'product_id no existe en la BD' });
    }
    
    // Cualquier otro error se maneja como 500 genérico.
    console.error('Error creando payment:', err);
    res.status(500).json({ message: 'Error creando payment' });
  }
}

// ============================================================================
// PUT /api/payments/:id
// ============================================================================
/** Actualiza parcialmente un payment existente.
 *    - Lee `id` desde la ruta y los campos a actualizar desde el body.
 *    - Construye un objeto DTO (UpdatePaymentDto) con los campos recibidos.
 *    - Llama a `updatePaymentService(id, dto)`:
 *      - Si el payment no existe → devuelve null.
 *      - Si viene un customer_id nuevo, verifica que el Customer exista.
 *          - Si no existe → lanza error con code 'CUSTOMER_NOT_FOUND'.
 *      - Actualiza los campos definidos y guarda en la BD.
 *    - Si `updatePaymentService` devuelve null → responde 404.
 *    - Si funciona → devuelve el payment actualizado (200 OK).
 */
export async function updatePayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID del payment a actualizar.
    const { id } = req.params;

    // Datos que se desean actualizar.
    const { status } = req.body ?? {};

    // Llamada a la capa de servicios para aplicar la actualización.
    const updated = await updatePaymentService(id, {
      status,
    });

    // Si no se encontró el payment, responder 404.
    if (!updated) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    // Devolver el pago actualizado.
    res.json(updated);
  } catch (err: any) {
    // Caso específico: el customer_id proporcionado no existe.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    if (err?.code === 'PRODUCT_NOT_FOUND') {
      return res
      .status(400)
      .json({ message: 'product_id no existe en la BD' });
    }

    console.error('Error actualizando payment:', err);
    res.status(500).json({ message: 'Error actualizando payment' });
  }
}

// ============================================================================
// DELETE /api/payments/:id
// ============================================================================
/** Elimina un payment por su ID.
 *    - Lee `id` desde los parámetros de ruta.
 *    - Llama a `deletePaymentService(id)`:
 *      - Devuelve el número de filas borradas (0 si no existía).
 *    - Si `deleted === 0` → responde 404 (no había payment con ese id).
 *    - Si `deleted > 0` → responde 204 (No Content), indicando borrado correcto.
 */
export async function deletePayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID del payment que se quiere eliminar.
    const { id } = req.params;

    // Ejecuta el borrado en la capa de servicios.
    const deleted = await deletePaymentService(id);

    // Si no se borró ninguna fila, es que el payment no existía.
    if (!deleted) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    // Borrado correcto: no se devuelve cuerpo, solo 204.
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando payment:', err);
    res.status(500).json({ message: 'Error eliminando payment' });
  }
}