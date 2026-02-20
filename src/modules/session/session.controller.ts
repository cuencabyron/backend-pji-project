/** Controladores HTTP para la entidad Session.
 *  Aquí se definen los handlers que atienden las rutas:
 *    - GET    /api/sessions
 *    - GET    /api/sessions/:id
 *    - POST   /api/sessions
 *    - PUT    /api/sessions/:id
 *    - DELETE /api/sessions/:id
 *  Cada función:
 *    1) Lee los datos de la petición (params / body).
 *    2) Llama a la capa de servicios (session.service) que contiene
 *        la lógica de acceso a datos y reglas de negocio.
 *    3) Traduce el resultado o los errores a una respuesta HTTP
 *      adecuada (200, 201, 204, 400, 404, 409, 500, etc.).
 */

// Tipos de Express para tipar las funciones de controlador
import { Request, Response } from 'express';

// Funciones de la capa de servicio que encapsulan la lógica de negocio.
import {
  findAllSessions,
  findSessionById,
  createSessionService,
  updateSessionService,
  deleteSessionService,
} from '@/modules/session/session.service';

function getClientIp(req: Request): string 
{
  const header = req.headers['x-forwarded-for'];

  let ip: string | undefined;

  if (typeof header === 'string') {
    ip = header.split(',')[0];
  } else if (Array.isArray(header)) {
    ip = header[0];
  }

  if (!ip) {
    ip = req.socket?.remoteAddress ?? req.ip ?? '';
  }

  return ip.trim();
}

// ============================================================================
// GET /api/sessions
// ============================================================================
/** Lista todas las sesiones almacenadas.
 *    - No utiliza parámetros de ruta ni de consulta (por eso se ignora `_req`).
 *    - Devuelve un arreglo de sesiones en formato JSON.
 */
export async function listSessions(_req: Request, res: Response) 
{
  try {
    // Recupera todos las sessions desde la capa de servicios.
    const items = await findAllSessions();

    // Respuesta 200 OK con el listado.
    res.json(items);
  } catch (err) {
    // Ante cualquier fallo inesperado, registramos el error en servidor…
    console.error('Error listando sessions:', err);

    // …y devolvemos 500 Internal Server Error al cliente.
    res.status(500).json({ message: 'Error listando sessions' });
  }
}

// ============================================================================
// GET /api/sessions/:id
// ============================================================================
/** Obtiene una sesión específica por su ID (UUID).
 *    - Lee el parámetro de ruta `id`.
 *    - Si la sesión no existe, responde 404.
 *    - Si existe, la devuelve como JSON (200 OK).
 */
export async function getSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraemos el ID desde los parámetros de la URL.
    const { id } = req.params;

    // Buscamos la sesión en la capa de servicios.
    const item = await findSessionById(id);

    // Si no se encontró, devolvemos 404 Not Found.
    if (!item) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    // Si se encontró, devolvemos la sesión (200 OK).
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo session:', err);
    res.status(500).json({ message: 'Error obteniendo session' });
  }
}

// ============================================================================
// POST /api/sessions
// ============================================================================
/** Crea una nueva sesión.
 *    - Lee el body (customer_id, user_agent, status).
 *    - Realiza una validación mínima de campos obligatorios.
 *    - Llama a createSessionService, que:
 *        - Verifica que el customer exista.
 *        - Crea y persiste la entidad Session en la base de datos.
 *    - Si el customer no existe → 400 Bad Request.
 *    - Si todo va bien → 201 Created con la sesión creada.
 */
export async function createSession(req: Request, res: Response) 
{
  try {
    // Desestructuramos los campos esperados del body.
    const { customer_id, user_agent, status } = req.body ?? {};
    
    // Obten la IP desde la solicitud HTTP
    const ip_address = getClientIp(req);

    // Validación rápida de campos obligatorios (a nivel controlador).
    if (!customer_id || !ip_address || !user_agent) {
      return res.status(400).json({
        // Nota: el mensaje menciona ip_address por diseño del dominio,
        // aunque en este handler solo usamos customer_id y user_agent.
        message: 'customer_id y user_agent son requeridos',
      });
    }

    // Delegamos la creación de la sesión en la capa de servicios.
    const saved = await createSessionService({
      customer_id,
      ip_address,
      user_agent,
      status,
    });

    // Devolvemos 201 Created con la sesión persistida.
    res.status(201).json(saved);
  } catch (err: any) {
    // Regla de negocio propagada desde el servicio:
    // el customer indicado no existe.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error creando session:', err);
    res.status(500).json({ message: 'Error creando session' });
  }
}

// ============================================================================
// PUT /api/sessions/:id
// ============================================================================
/** Actualiza parcialmente una sesión existente.
 *    - Lee el `id` de la URL y los campos a actualizar del body.
 *    - Llama a updateSessionService, que:
 *        - Comprueba que la sesión exista.
 *        - Valida y aplica cambios (customer, user_agent, status).
 *    - Si la sesión no existe → 404 Not Found.
 *    - Si el nuevo customer_id no existe → 400 Bad Request.
 *    - Si todo va bien → 200 OK con la sesión actualizada.
 */
export async function updateSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID de la session a actualizar.
    const { id } = req.params;

    // Desestructuramos los campos esperados del body.
    const { customer_id, user_agent, status } = req.body ?? {};

    // Obten la IP desde la solicitud HTTP
    const ip_address = getClientIp(req);

    // Delegamos la actualización en la capa de servicios.
    const updated = await updateSessionService(id, {
      customer_id,
      ip_address,
      user_agent,
      status,
    });

    // Si no se encontró la sesión, devolvemos 404.
    if (!updated) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    // Devolvemos la entidad ya actualizada.
    res.json(updated);
  } catch (err: any) {
    // El servicio indica que el customer_id enviado no existe.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    console.error('Error actualizando session:', err);
    res.status(500).json({ message: 'Error actualizando session' });
  }
}

// ============================================================================
// DELETE /api/sessions/:id
// ============================================================================
/** Elimina una sesión por su ID.
 *    - Lee el `id` de los parámetros de ruta.
 *    - Llama a deleteSessionService, que intenta borrar el registro.
 *    - Si no se eliminó ninguna fila → 404 Not Found.
 *    - Si se eliminó correctamente → 204 No Content (sin body).
 */
export async function deleteSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID de la session a eliminar.
    const { id } = req.params;

    // Intentamos eliminar la sesión en la capa de servicios.
    const deleted = await deleteSessionService(id);

    // Si no se afectó ninguna fila, la sesión no existía.
    if (!deleted) {
      return res.status(404).json({ message: 'Session no encontrada' });
    }

    // Eliminado correctamente → 204 No Content.
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando session:', err);
    res.status(500).json({ message: 'Error eliminando session' });
  }
}