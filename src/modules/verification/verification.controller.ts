/**
 * Controladores HTTP para la entidad Verification.
 *
 * Expone las operaciones CRUD sobre el recurso `/api/verifications`:
 *  - GET    /api/verifications        → lista todas las verificaciones
 *  - GET    /api/verifications/:id    → obtiene una verificación por su ID
 *  - POST   /api/verifications        → crea una nueva verificación
 *  - PUT    /api/verifications/:id    → actualiza una verificación existente
 *  - DELETE /api/verifications/:id    → elimina una verificación por ID
 *
 * Cada verificación está relacionada con:
 *  - un Customer
 *  - una Session
 *  - un Payment
 *
 * Cada controlador:
 *  - Usa `verificationRepo()` para interactuar con la tabla `verification`.
 *  - Valida que existan los IDs relacionados (`customer_id`, `session_id`, `payment_id`).
 *  - Usa `try/catch` para capturar errores y responder con 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';

// Importa la fuente de datos principal de TypeORM. `AppDataSource` es la configuración de conexión a la base de datos (credenciales, host, puerto, entidades, etc.) y desde aquí puedes obtener repositorios.
import { AppDataSource } from '@/config/data-source';

// Importa la entidad que mapea la tabla "verification"
import { Verification } from '@/modules/verification/verification.entity';

// Importa la entidad Customer de TypeORM. Esta clase representa la tabla "customer" en la base de datos y su mapeo a objetos JS/TS.
import { Customer } from '@/modules/customer/customer.entity';

// Importa la entidad Session de TypeORM. Esta clase representa la tabla "session" en la base de datos y su mapeo a objetos JS/TS.
import { Session } from '@/modules/session/session.entity';

// Importa la entidad Payment de TypeORM. Esta clase representa la tabla "payment" en la base de datos y su mapeo a objetos JS/TS.
import { Payment } from '@/modules/payment/payment.entity';

// Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '../../utils/api-error'; 

/**
 * Tipo que define la forma del body esperado
 * al crear o actualizar una Verification.
 */
type VerificationBody = 
{
  /** ID del customer al que pertenece la verificación */
  customer_id: string;
  /** ID de la sesión asociada a esta verificación */
  session_id: string;
  /** ID del pago asociado a esta verificación */
  payment_id: string;
  /** Tipo de verificación (por ejemplo, 'sms', 'email', 'totp', etc.) */
  type: string;
  /**
   * Estado de la verificación:
   *  - 'pending'  → pendiente
   *  - 'approved' → aprobada
   *  - 'rejected' → rechazada
   *  - 'expired'  → expirada
   */
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  /** Número de intentos realizados para completar la verificación */
  attempts: number;
};

// ====== GET /api/verifications ======

/**
 * Controlador para listar todas las verificaciones.
 *
 * Ruta: GET /api/verifications
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Verification.
 *  - Recupera todas las verificaciones ordenadas por `created_at` descendente.
 *  - Incluye relaciones con `customer`, `session` y `payment`.
 *  - Devuelve el listado como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param _req Request de Express (no se utiliza en este handler).
 * @param res  Response de Express.
 */
export async function listVerifications(_req: Request, res: Response) 
{
  try {
    // Obtiene el repositorio de Verification directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Verification);

    // Recupera todos los registros de verificaciones de la BD.
    const items = await repo.find(
    {
      relations: { customer: true, session: true, payment: true },
      order: { created_at: 'DESC' as const },
    });

    res.json(items);
  } catch (err) {
    const errorId = 'VERIFICATION_LIST_ERROR';
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error listando verifications', errorId, err));
  }
}

// ====== GET /api/verifications/:id =====

/**
 * Controlador para obtener una verificación por su ID.
 *
 * Ruta: GET /api/verifications/:id
 *
 * Comportamiento:
 *  - Lee el `id` desde los parámetros de la ruta.
 *  - Busca una verificación con ese `verification_id`.
 *  - Incluye las relaciones `customer`, `session` y `payment`.
 *  - Si no existe, responde con 404.
 *  - Si existe, la devuelve como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Obtiene el repositorio de Verification directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Verification);

    // Buscar una verificación por ID incluyendo sus relaciones
    const item = await repo.findOne({
      where: { verification_id: req.params.id },
      relations: { customer: true, session: true, payment: true },
    });

    if (!item) {
      return res.status(404).json({ 
        message: 'Verification no encontrado',
        errorId: 'VERIFICATION_NOT_FOUND',
      });
    }

    res.json(item);
  } catch (err) {
    const errorId = 'VERIFICATION_GET_ERROR';
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error obteniendo verification', errorId, err));
  }
}

// ====== POST /api/verifications ======

/**
 * Controlador para crear una nueva verificación.
 *
 * Ruta: POST /api/verifications
 *
 * Body esperado (JSON):
 *  {
 *    "customer_id": string,
 *    "session_id": string,
 *    "payment_id": string,
 *    "type": string,
 *    "status": "pending" | "approved" | "rejected" | "expired",
 *    "attempts": number
 *  }
 *
 * Comportamiento:
 *  - Valida que todos los campos requeridos estén presentes.
 *  - Verifica que existan el Customer, la Session y el Payment asociados.
 *  - Crea una nueva entidad Verification asociando las entidades cargadas.
 *  - Guarda la verificación en la base de datos.
 *  - Devuelve la verificación creada con código 201.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el body tipado como `VerificationBody`.
 * @param res Response de Express.
 */
export async function createVerification(req: Request<{}, {}, VerificationBody>, res: Response) 
{
  try {
    const { customer_id, session_id, payment_id, type, status, attempts } =
      req.body ?? {};

    // Validación básica de campos requeridos
    if (!customer_id || !session_id || !payment_id || !type || !status || attempts == null) 
    {
      return res.status(400).json({
        message:
          'customer_id, session_id, payment_id, type, status y attempts son requeridos',
        errorId: 'VERIFICATION_VALIDATION_ERROR',
      });
    }

    // Buscar en paralelo las entidades relacionadas: Customer, Session y Payment
    const [customer, session, payment] = await Promise.all([
      AppDataSource.getRepository(Customer).findOneBy({ customer_id }),
      AppDataSource.getRepository(Session).findOneBy({ session_id }),
      AppDataSource.getRepository(Payment).findOneBy({ payment_id }),
    ]);

    // Validar existencia de las entidades relacionadas
    if (!customer) 
    {
      return res
        .status(400)
        .json({ message: 'customer_id no existe', errorId: 'CUSTOMER_NOT_FOUND' });
    }
    if (!session) 
    {
      return res
        .status(400)
        .json({ message: 'session_id no existe', errorId: 'SESSION_NOT_FOUND' });
    }
    if (!payment) 
    {
      return res
        .status(400)
        .json({ message: 'payment_id no existe', errorId: 'PAYMENT_NOT_FOUND' });
    }

    // Obtiene el repositorio de Verification directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Verification);

    // Crear una nueva Verification asociando las entidades completas
    const entity = repo.create({
      customer,
      session,
      payment,
      type,
      status,
      attempts,
    });

    // Guardar la verificación en la base de datos
    const saved = await repo.save(entity);

    // Devolver la nueva verificación
    res.status(201).json(saved);
  } catch (err: any) {
    const errorId = 'VERIFICATION_CREATE_ERROR';
    console.error(errorId, err);

    // Si viene de MySQL/TypeORM, a veces hay sqlMessage
    const payload = formatError('Error creando verification', errorId, err);
    if (err?.sqlMessage) {
      (payload as any).sqlMessage = err.sqlMessage;
    }

    res.status(500).json(payload);
  }
}

// ====== PUT /api/verifications/:id ======

/**
 * Controlador para actualizar una verificación existente.
 *
 * Ruta: PUT /api/verifications/:id
 *
 * Body esperado (JSON, parcial):
 *  {
 *    "customer_id"?: string,
 *    "session_id"?: string,
 *    "payment_id"?: string,
 *    "type"?: string,
 *    "status"?: "pending" | "approved" | "rejected" | "expired",
 *    "attempts"?: number
 *  }
 *
 * Comportamiento:
 *  - Lee el `id` de la ruta y busca la verificación correspondiente (con relaciones).
 *  - Si no existe, responde con 404.
 *  - Si llegan nuevos IDs (`customer_id`, `session_id`, `payment_id`), valida que existan
 *    las entidades asociadas y actualiza las relaciones.
 *  - Actualiza los campos simples (`type`, `status`, `attempts`) si vienen en el body.
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve la verificación actualizada.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con `id` en params y body parcial de `VerificationBody`.
 * @param res Response de Express.
 */
export async function updateVerification(req: Request<{ id: string }, {}, Partial<VerificationBody>>, res: Response) 
{
  try {
    // Extrae el id de los parámetros de ruta.
    const { id } = req.params;

    // Obtiene el repositorio de Verification directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Verification);

    // Buscar la verificación por ID, incluyendo relaciones
    const existing = await repo.findOne({
      where: { verification_id: id },
      relations: { customer: true, session: true, payment: true },
    });

    if (!existing) 
    {
      return res.status(404).json({ 
        message: 'Verification no encontrado', 
        errorId: 'VERIFICATION_NOT_FOUND',
      });
    }

    const { customer_id, session_id, payment_id, type, status, attempts } =
      req.body ?? {};

    // Si se envía un nuevo customer_id, validar y actualizar la relación
    if (customer_id !== undefined) 
    {
      const c = await AppDataSource.getRepository(Customer).findOneBy({
        customer_id,
      });
      if (!c) {
        return res.status(400).json({ 
          message: 'customer_id no existe',
          errorId: 'CUSTOMER_NOT_FOUND',
        });
      }
      existing.customer = c;
    }

    // Si se envía un nuevo session_id, validar y actualizar la relación
    if (session_id !== undefined) 
    {
      const s = await AppDataSource.getRepository(Session).findOneBy({
        session_id,
      });
      if (!s) {
        return res.status(400).json({ 
          message: 'session_id no existe',
          errorId: 'SESSION_NOT_FOUND',
        });
      }
      existing.session = s;
    }

    // Si se envía un nuevo payment_id, validar y actualizar la relación
    if (payment_id !== undefined) 
    {
      const p = await AppDataSource.getRepository(Payment).findOneBy({
        payment_id,
      });
      if (!p) {
        return res.status(400).json({ 
          message: 'payment_id no existe', 
          errorId: 'PAYMENT_NOT_FOUND',
        });
      }
      existing.payment = p;
    }

    // Actualizar campos simples solo si vienen definidos
    if (type !== undefined) existing.type = type;
    if (status !== undefined) existing.status = status;
    if (attempts !== undefined) existing.attempts = attempts;

    // Guardar los cambios en la base de datos
    const saved = await repo.save(existing);

    // Devolver la verificación actualizada
    res.json(saved);
  } catch (err) {
    const errorId = 'VERIFICATION_UPDATE_ERROR';
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error actualizando verification', errorId, err));
  }
}

// ====== DELETE /api/verifications/:id ======

/**
 * Controlador para eliminar una verificación por ID.
 *
 * Ruta: DELETE /api/verifications/:id
 *
 * Comportamiento:
 *  - Lee el `id` desde la URL.
 *  - Busca la verificación en la base de datos.
 *  - Si no existe, responde con 404.
 *  - Si existe, la elimina mediante `repo.remove`.
 *  - Devuelve 204 (No Content) si el borrado fue exitoso.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id`.
 * @param res Response de Express.
 */
export async function deleteVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Obtiene el repositorio de Verification directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Verification);

    // Buscar la verificación por ID
    const existing = await repo.findOneBy({
      verification_id: req.params.id,
    });

    if (!existing) 
    {
      return res.status(404).json({
        message: 'Verification no encontrado',
        errorId: 'VERIFICATION_NOT_FOUND',
      });
    }

    // Eliminar la verificación encontrada
    await repo.remove(existing);

    // Responder con 204 indicando éxito sin contenido en el body
    res.status(204).send();
  } catch (err) {
    const errorId = 'VERIFICATION_DELETE_ERROR'
    console.error(errorId, err);
    res
      .status(500)
      .json(formatError('Error eliminando verification', errorId, err));
  }
}