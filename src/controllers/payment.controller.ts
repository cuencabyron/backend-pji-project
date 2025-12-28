/**
 * Controladores HTTP para la entidad Payment.
 *
 * Expone las operaciones CRUD básicas sobre el recurso `/api/payments`:
 *  - GET    /api/payments        → lista todos los pagos
 *  - GET    /api/payments/:id    → obtiene un pago por su ID
 *  - POST   /api/payments        → crea un nuevo pago
 *  - PUT    /api/payments/:id    → actualiza un pago existente
 *  - DELETE /api/payments/:id    → elimina un pago por su ID
 *
 * Cada controlador:
 *  - Usa `paymentRepo()` para interactuar con la tabla `payment` mediante TypeORM.
 *  - Valida datos básicos antes de tocar la base de datos.
 *  - Está envuelto en `try/catch` para manejar errores y devolver un 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';

// Importa la instancia de conexión/configuración de TypeORM (DataSource) que se creo en src/data-source.ts
import { AppDataSource } from '@/config/data-source';

// Importa la entidad que mapea la tabla "payment"
import { Payment } from '@/models/payment.model';

// Importa la entidad Customer de TypeORM. Esta clase representa la tabla "customer" en la base de datos y su mapeo a objetos JS/TS.
import { Customer } from '@/models/customer.model';

/* Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '@/utils/api-error';*/

/**
 * Tipo que define la forma del cuerpo (body) esperado
 * al crear o actualizar un Payment.
 */
type PaymentBody = 
{
  /** ID del customer asociado a este pago (UUID) */
  customer_id: string;
  /** Importe del pago (se maneja como string para evitar problemas de precisión) */
  amount: string;
  /** Moneda del pago (por ejemplo, 'MXN', 'USD') */
  currency: string;
  /** Método de pago (por ejemplo, 'card', 'cash', 'transfer') */
  method: string;
  /**
   * Estado del pago:
   *  - 'pending'  → pendiente
   *  - 'paid'     → pagado
   *  - 'failed'   → fallido
   *  - 'refunded' → reembolsado
   */
  status?: 'pending' | 'paid' | 'failed' | 'refunded';
  /** Referencia externa del pago (ID del procesador de pagos, folio, etc.) */
  external_ref: string;
};

// ====== GET /api/payments ======

/**
 * Controlador para listar todos los pagos.
 *
 * Ruta: GET /api/payments
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Payment.
 *  - Recupera todos los pagos mediante `repo.find()`.
 *  - Devuelve el listado como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param _req Request de Express (no se usa en este handler).
 * @param res  Response de Express, usado para enviar la respuesta al cliente.
 */
export async function listPayments(_req: Request, res: Response) 
{
  try {
    // Obtiene el repositorio de Payment directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Payment);

    // Recupera todos los registros de pagos de la BD.
    const items = await repo.find();

    // Devolver el listado completo en formato JSON
    res.json(items);
  } catch (err) {
    console.error('Error listando payments:', err);
    res.status(500).json({ message: 'Error listando payments' });
  }
}

// ====== GET /api/payments/:id ======

/**
 * Controlador para obtener un pago por su ID.
 *
 * Ruta: GET /api/payments/:id
 *
 * Comportamiento:
 *  - Lee el parámetro `id` desde la URL.
 *  - Busca un pago cuyo `payment_id` coincida con ese `id`.
 *  - Si lo encuentra, lo devuelve como JSON.
 *  - Si no existe, responde con 404.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getPayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraer el ID del pago desde los parámetros de la ruta
    const { id } = req.params;

    // Obtiene el repositorio de Payment directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Payment);

    // Buscar un pago con ese ID en la base de datos
    const item = await repo.findOneBy({ payment_id: id });

    // Si no se encontró, devolver 404
    if (!item) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    // Devolver el pago encontrado
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo payment:', err);
    res.status(500).json({ message: 'Error obteniendo payment' });
  }
}

// ====== POST /api/payments ======

/**
 * Controlador para crear un nuevo pago.
 *
 * Ruta: POST /api/payments
 *
 * Body esperado (JSON):
 *  {
 *    "customer_id": string,
 *    "amount": string,
 *    "currency": string,
 *    "method": string,
 *    "status": "pending" | "paid" | "failed" | "refunded",
 *    "external_ref": string
 *  }
 *
 * Comportamiento:
 *  - Valida que todos los campos requeridos estén presentes.
 *  - Verifica que el `customer_id` exista en la tabla `customer`.
 *  - Crea y guarda el pago en la base de datos.
 *  - Devuelve el pago creado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express, con el body tipado como `PaymentBody`.
 * @param res Response de Express.
 */
export async function createPayment(req: Request<{}, {}, PaymentBody>, res: Response) 
{
  try {
    // Desestructurar los campos del body
    const { customer_id, amount, currency, method, status, external_ref } =
      req.body ?? {};

    // Validación básica: todos los campos requeridos deben venir informados
    if (!customer_id || !amount || !currency || !method || !status || !external_ref) {
      return res.status(400).json({
        message:
          'customer_id, amount, currency, method, status, external_ref son requeridos',
      });
    }

    // Verificar que el customer exista antes de registrar el pago
    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    // Obtiene el repositorio de Payment directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Payment);

    // Crear una nueva entidad Payment en memoria con los datos recibidos
    const entity = repo.create({
      customer_id,
      amount,
      currency,
      method,
      status,
      external_ref,
    });

    // Guardar el nuevo pago en la base de datos
    const saved = await repo.save(entity);

    // Devolver el pago creado
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error creando payment:', err);
    res.status(500).json({ message: 'Error creando payment' });
  }
}

// ====== PUT /api/payments/:id ======

/**
 * Controlador para actualizar un pago existente.
 *
 * Ruta: PUT /api/payments/:id
 *
 * Body esperado (JSON, parcial):
 *  {
 *    "customer_id"?: string,
 *    "amount"?: string,
 *    "currency"?: string,
 *    "method"?: string,
 *    "status"?: "pending" | "paid" | "failed" | "refunded",
 *    "external_ref"?: string
 *  }
 *
 * Comportamiento:
 *  - Lee el `id` de la ruta y busca el pago correspondiente.
 *  - Si no existe, responde con 404.
 *  - Si viene `customer_id`, comprueba que ese cliente exista.
 *  - Actualiza únicamente los campos que se envían en el body.
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve el pago actualizado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con `id` en params y un body parcial de `PaymentBody`.
 * @param res Response de Express.
 */
export async function updatePayment(req: Request<{ id: string }, {}, Partial<PaymentBody>>, res: Response) 
{
  try {
    // ID del pago a actualizar
    const { id } = req.params;

    // Obtiene el repositorio de Payment directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Payment);

    // Buscar el pago existente en la BD
    const existing = await repo.findOneBy({ payment_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'payment no encontrado' });
    }

    // Desestructurar campos que potencialmente vienen en el body
    const { customer_id, amount, currency, method, status, external_ref } =
      req.body ?? {};

    // Si se quiere cambiar de customer, validar que exista
    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      (existing as any).customer_id = customer_id;
    }

    // Actualizar campos simples solo si vienen definidos
    if (amount !== undefined) existing.amount = String(amount);
    if (currency !== undefined) existing.currency = currency;
    if (method !== undefined) existing.method = method;
    if (status !== undefined) existing.status = status as any;
    if (external_ref !== undefined) existing.external_ref = external_ref;

    // Guardar los cambios en la base de datos
    const saved = await repo.save(existing);

    // Devolver el pago actualizado
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando payment:', err);
    res.status(500).json({ message: 'Error actualizando payment' });
  }
}

// ====== DELETE /api/payments/:id ======

/**
 * Controlador para eliminar un pago por ID.
 *
 * Ruta: DELETE /api/payments/:id
 *
 * Comportamiento:
 *  - Lee el `id` desde la URL.
 *  - Busca el pago en la base de datos.
 *  - Si no existe, responde con 404.
 *  - Si existe, lo elimina mediante `repo.remove`.
 *  - Devuelve 204 (No Content) si el borrado fue exitoso.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id`.
 * @param res Response de Express.
 */
export async function deletePayment(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Obtiene el repositorio de Payment directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Payment);

    // Buscar el pago por ID
    const existing = await repo.findOneBy({ payment_id: req.params.id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Payment no encontrado' });
    }

    // Eliminar el pago encontrado
    await repo.remove(existing);

    // Responder con 204 indicando que no hay contenido pero la operación fue exitosa
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando payment:', err);
    res.status(500).json({ message: 'Error eliminando payment' });
  }
}