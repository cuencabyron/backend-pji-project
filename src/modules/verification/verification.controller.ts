/** Controladores HTTP para la entidad Verification.
 *  Estas funciones son los "handlers" que atienden las rutas:
 *    - GET    /api/verifications
 *    - GET    /api/verifications/:id
 *    - POST   /api/verifications
 *    - PUT    /api/verifications/:id
 *    - DELETE /api/verifications/:id
 *  Responsabilidades del controller:
 *    1) Leer datos de la petición (params, body).
 *    2) Llamar a la capa de servicios (verification.service.ts).
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

/** Funciones de la capa de servicio que encapsulan la lógica de acceso a datos
 *  y reglas básicas de negocio para Verification.
 *  Aquí NO se hace SQL directo ni operaciones de TypeORM, eso vive en
 * `verification.service.ts`. El controller solo delega y maneja HTTP.
 */
import {
  findAllVerifications,
  findVerificationById,
  createVerificationService,
  updateVerificationService,
  deleteVerificationService,
} from '@/modules/verification/verification.service';

// ============================================================================
// GET /api/verifications
// ============================================================================
/** Lista todas las verificaciones registradas.
 *    - No usa parámetros ni body.
 *    - Llama a `findAllVerifications()` en la capa de servicios.
 *    - Devuelve el arreglo de verifications como JSON.
 */
export async function listVerifications(_req: Request, res: Response) 
{
  try {
    // Recupera todas las verifications desde la capa de servicios.
    const items = await findAllVerifications();

    // Responde con la lista completa.
    res.json(items);
  } catch (err) {
    // Error inesperado (BD caída, bug, etc.): log + 500.
    console.error('Error listando verifications:', err);
    res.status(500).json({ message: 'Error listando verifications' });
  }
}

// ============================================================================
// GET /api/verifications/:id
// ============================================================================
/** Devuelve una verification específica por su ID.
 * - Lee `id` del parámetro de ruta.
 * - Llama a `findVerificationById(id)` en la capa de servicios.
 * - Si no existe, responde 404.
 * - Si existe, la devuelve como JSON.
 */
export async function getVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el id de los parámetros de ruta: /api/verifications/:id
    const { id } = req.params;

    // Busca la verification en la capa de servicios.
    const item = await findVerificationById(id);

    // Si no se encontró, devolver 404.
    if (!item) {
      return res
        .status(404)
        .json({ message: 'Verification no encontrada' });
    }

    // Devolver la verification encontrada.
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo verification:', err);
    res.status(500).json({ message: 'Error obteniendo verification' });
  }
}

// ============================================================================
// POST /api/verifications
// ============================================================================
/** Crea una nueva verification.
 * - Lee del body:
 *     - customer_id (FK obligatoria)
 *     - session_id  (FK obligatoria)
 *     - payment_id  (FK obligatoria)
 *     - type        (obligatorio)
 *     - status      (opcional, la capa de servicio puede aplicar defaults)
 *     - attempts    (obligatorio, número de intentos)
 * - Valida campos mínimos requeridos:
 *     - Si falta alguno de los obligatorios → 400 Bad Request.
 * - Llama a `createVerificationService(...)`:
 *     - Este servicio:
 *         - Verifica que existan el Customer, Session y Payment.
 *         - Si alguno no existe, lanza error con code:
 *           'CUSTOMER_NOT_FOUND' | 'SESSION_NOT_FOUND' | 'PAYMENT_NOT_FOUND'.
 * - Si se crea correctamente, responde 201 con la verification creada.
 */
export async function createVerification(req: Request, res: Response) 
{
  try {
    // Extrae los campos del body. `?? {}` evita errores si req.body es undefined.
    const {
      customer_id,
      session_id,
      payment_id,
      type,
      status,
      attempts,
    } = req.body ?? {};

    // Validación rápida de campos requeridos mínimos.
    if ( !customer_id || !session_id || !payment_id || !type || attempts == null // chequeo explícito contra null/undefined
    ) {
      return res.status(400).json({
        message:
          'customer_id, session_id, payment_id, type y attempts son requeridos',
      });
    }

    // Delegamos la creación en la capa de servicios (reglas de negocio + BD).
    const saved = await createVerificationService({
      customer_id,
      session_id,
      payment_id,
      type,
      status,
      attempts,
    });

    // Devolvemos la verification creada con 201 (Created).
    res.status(201).json(saved);
  } catch (err: any) {
    // Errores de negocio específicos, señalados por `code` en el error.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res.status(400).json({ message: 'customer_id no existe' });
    }
    if (err?.code === 'SESSION_NOT_FOUND') {
      return res.status(400).json({ message: 'session_id no existe' });
    }
    if (err?.code === 'PAYMENT_NOT_FOUND') {
      return res.status(400).json({ message: 'payment_id no existe' });
    }

    // Cualquier otro error se considera 500 genérico.
    console.error('Error creando verification:', err);
    res.status(500).json({ message: 'Error creando verification' });
  }
}

// ============================================================================
// PUT /api/verifications/:id
// ============================================================================
/** Actualiza parcialmente una verification existente.
 *    - Lee `id` desde la ruta y los posibles campos a actualizar desde el body:
 *        - customer_id, session_id, payment_id, type, status, attempts.
 *    - Llama a `updateVerificationService(id, dto)`:
 *        - Si no existe la verification → devuelve null.
 *        - Si se pasa un customer_id / session_id / payment_id no válidos, el servicio lanza errores con code:
 *          'CUSTOMER_NOT_FOUND' | 'SESSION_NOT_FOUND' | 'PAYMENT_NOT_FOUND'.
 *    - Si `updateVerificationService` devuelve null → responde 404.
 *    - Si se actualiza correctamente → responde 200 con la verification actualizada.
 */
export async function updateVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID de la verification que se quiere actualizar.
    const { id } = req.params;

    // Datos opcionales a actualizar.
    const {
      customer_id,
      session_id,
      payment_id,
      type,
      status,
      attempts,
    } = req.body ?? {};

    // Llama a la capa de servicios para aplicar la actualización.
    const updated = await updateVerificationService(id, {
      customer_id,
      session_id,
      payment_id,
      type,
      status,
      attempts,
    });

    // Si no se encontró la verification, responder 404.
    if (!updated) {
      return res
        .status(404)
        .json({ message: 'Verification no encontrada' });
    }

    // Devolver la verification actualizada.
    res.json(updated);
  } catch (err: any) {
    // Errores de negocio: alguna FK no existe.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res.status(400).json({ message: 'customer_id no existe' });
    }
    if (err?.code === 'SESSION_NOT_FOUND') {
      return res.status(400).json({ message: 'session_id no existe' });
    }
    if (err?.code === 'PAYMENT_NOT_FOUND') {
      return res.status(400).json({ message: 'payment_id no existe' });
    }

    console.error('Error actualizando verification:', err);
    res.status(500).json({ message: 'Error actualizando verification' });
  }
}

// ============================================================================
// DELETE /api/verifications/:id
// ============================================================================
/** Elimina una verification por su ID.
 *    - Lee `id` desde los parámetros de ruta.
 *    - Llama a `deleteVerificationService(id)`:
 *        - Devuelve el número de filas eliminadas (0 si no existía).
 *    - Si `deleted === 0` → responde 404 (no había verification con ese id).
 *    - Si `deleted > 0`  → responde 204 (No Content), indicando borrado correcto.
 */
export async function deleteVerification(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID de la verification que se quiere eliminar.
    const { id } = req.params;

    // Ejecuta el borrado en la capa de servicios.
    const deleted = await deleteVerificationService(id);

    // Si no se eliminó nada, es que la verification no existía.
    if (!deleted) {
      return res
        .status(404)
        .json({ message: 'Verification no encontrada' });
    }

    // Borrado correcto: 204 sin cuerpo.
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando verification:', err);
    res.status(500).json({ message: 'Error eliminando verification' });
  }
}