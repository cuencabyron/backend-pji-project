/**
 * Controladores HTTP para la entidad Session.
 *
 * Expone las operaciones CRUD básicas sobre el recurso `/api/sessions`:
 *  - GET    /api/sessions        → lista todas las sesiones
 *  - GET    /api/sessions/:id    → obtiene una sesión por su ID
 *  - POST   /api/sessions        → crea una nueva sesión
 *  - PUT    /api/sessions/:id    → actualiza una sesión existente
 *  - DELETE /api/sessions/:id    → elimina una sesión por su ID
 *
 * Cada controlador:
 *  - Usa `sessionRepo()` para interactuar con la tabla `session` mediante TypeORM.
 *  - Valida datos básicos antes de tocar la base de datos.
 *  - Está envuelto en `try/catch` para manejar errores y devolver un 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';

// Importa la instancia de conexión/configuración de TypeORM (DataSource) que se creo en src/data-source.ts
import { AppDataSource } from '@/config/data-source';

// Importa la entidad que mapea la tabla "session"
import { Session } from '@/modules/session/session.entity';

// Importa la entidad Customer de TypeORM. Esta clase representa la tabla "customer" en la base de datos y su mapeo a objetos JS/TS.
import { Customer } from '@/modules/customer/customer.entity';

/* Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '../utils/api-error'; */

/**
 * Tipo que define la forma del cuerpo (body) esperado
 * al crear o actualizar una Session.
 */
type SessionBody = 
{
  /** ID del customer al que pertenece la sesión (UUID) */
  customer_id: string;
  /** Información del agente de usuario (navegador / cliente) que inició la sesión */
  user_agent: string;
  /**
   * Estado de la sesión:
   *  - 'active'  → sesión activa
   *  - 'ended'   → sesión terminada
   *  - 'revoked' → sesión revocada manualmente
   *
   * Es opcional en el body; por defecto se usa 'active' al crear.
   */
  status?: 'active' | 'ended' | 'revoked';
};

// ====== GET /api/sessions ======

/**
 * Controlador para listar todas las sesiones.
 *
 * Ruta: GET /api/sessions
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Session.
 *  - Recupera todas las sesiones mediante `repo.find()`.
 *  - Devuelve el listado como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param _req Request de Express (no se usa en este handler).
 * @param res  Response de Express, usado para enviar la respuesta al cliente.
 */
export async function listSessions(_req: Request, res: Response) 
{
  try {
    // Obtiene el repositorio de Session directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Session);

    // Recuperar todas las sesiones de la base de datos
    const items = await repo.find();

    // Devolver el listado completo en formato JSON
    res.json(items);
  } catch (err) {
    console.error('Error listando sessions:', err);
    res.status(500).json({ message: 'Error listando sessions' });
  }
}

// ====== GET /api/sessions/:id ======

/**
 * Controlador para obtener una sesión por su ID.
 *
 * Ruta: GET /api/sessions/:id
 *
 * Comportamiento:
 *  - Lee el parámetro `id` desde la URL.
 *  - Busca una sesión cuyo `session_id` coincida con ese `id`.
 *  - Si la encuentra, la devuelve como JSON.
 *  - Si no existe, responde con 404.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraer el ID de la sesión desde los parámetros de la ruta
    const { id } = req.params;

    // Obtiene el repositorio de Session directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Session);

    // Buscar una sesión con ese ID en la base de datos
    const item = await repo.findOneBy({ session_id: id });

    // Si no se encontró, devolver 404
    if (!item) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    // Devolver la sesión encontrada
    res.json(item);
  } catch (err) {
    console.error('Error obteniendo session:', err);
    res.status(500).json({ message: 'Error obteniendo session' });
  }
}

// ====== POST /api/sessions ======

/**
 * Controlador para crear una nueva sesión.
 *
 * Ruta: POST /api/sessions
 *
 * Body esperado (JSON):
 *  {
 *    "customer_id": string,          // ID del cliente dueño de la sesión
 *    "user_agent": string,           // agente de usuario que inició la sesión
 *    "status"?: "active" | "ended" | "revoked"   // opcional, por defecto 'active'
 *  }
 *
 * Comportamiento:
 *  - Valida que `customer_id` y `user_agent` estén presentes.
 *  - Verifica que el `customer_id` exista en la tabla `customer`.
 *  - Crea y guarda la sesión en la base de datos.
 *  - Devuelve la sesión creada.
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express, con el body tipado como `SessionBody`.
 * @param res Response de Express.
 */
export async function createSession(req: Request<{}, {}, SessionBody>, res: Response) 
{
  try {
    // Desestructurar los campos del body, con `status` por defecto en 'active'
    const { customer_id, user_agent, status = 'active' } = req.body ?? {};

    // Validación básica: campos obligatorios
    if (!customer_id || !user_agent) {
      return res.status(400).json({
        message: 'customer_id y user_agent son requeridos',
      });
    }

    // Verificar que el customer exista antes de crear la sesión
    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    // Obtiene el repositorio de Session directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Session);

    // Crear entidad Session en memoria con los datos recibidos
    const entity = repo.create({ customer_id, user_agent, status });

    // Guardar la nueva sesión en la base de datos
    const saved = await repo.save(entity);

    // Devolver la sesión creada al cliente
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error creando session:', err);
    res.status(500).json({ message: 'Error creando session' });
  }
}

// ====== PUT /api/sessions/:id ======

/**
 * Controlador para actualizar una sesión existente.
 *
 * Ruta: PUT /api/sessions/:id
 *
 * Body esperado (JSON, parcial):
 *  {
 *    "customer_id"?: string,
 *    "user_agent"?: string,
 *    "status"?: "active" | "ended" | "revoked"
 *  }
 *
 * Comportamiento:
 *  - Lee el `id` de la ruta y busca la sesión correspondiente.
 *  - Si no existe, responde con 404.
 *  - Si viene `customer_id`, comprueba que ese cliente exista y actualiza la relación.
 *  - Actualiza los campos `user_agent` y `status` solo si se envían.
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve la sesión actualizada.
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express con `id` en params y un body parcial de `SessionBody`.
 * @param res Response de Express.
 */
export async function updateSession(req: Request<{ id: string }, {}, Partial<SessionBody>>, res: Response) 
{
  try {
    // ID de la sesión a actualizar
    const { id } = req.params;

    // Obtiene el repositorio de Session directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Session);

    // Buscar la sesión existente
    const existing = await repo.findOneBy({ session_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    // Body con los campos opcionales a actualizar
    const { user_agent, status, customer_id } = req.body ?? {};

    // Permitir cambiar de customer, validando que exista en la BD
    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      // Asignar el nuevo customer_id a la sesión
      (existing as any).customer_id = customer_id;
    }

    // Actualizar campos simples si vienen en el body
    if (user_agent !== undefined) existing.user_agent = user_agent;
    if (status !== undefined) existing.status = status as any;

    // Guardar cambios en la base de datos
    const saved = await repo.save(existing);

    // Devolver la sesión actualizada
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando session:', err);
    res.status(500).json({ message: 'Error actualizando session' });
  }
}

// ====== DELETE /api/session/:id ======

/**
 * Controlador para eliminar una sesión por ID.
 *
 * Ruta: DELETE /api/session/:id
 *
 * Comportamiento:
 *  - Lee el `id` desde la URL.
 *  - Busca la sesión correspondiente en la base de datos.
 *  - Si no existe, responde con 404.
 *  - Si existe, la elimina mediante `repo.remove`.
 *  - Devuelve 204 (No Content) si el borrado fue exitoso.
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express con el parámetro `id`.
 * @param res Response de Express.
 */
export async function deleteSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID de la sesión a eliminar
    const { id } = req.params;

    // Obtiene el repositorio de Session directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Session);

    // Buscar la sesión en base de datos
    const existing = await repo.findOneBy({ session_id: id });

    // Si no se encontró, responder con 404
    if (!existing) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    // Eliminar la sesión encontrada
    await repo.remove(existing);

    // Responder con 204 (sin cuerpo) indicando éxito
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando session:', err);
    res.status(500).json({ message: 'Error eliminando session' });
  }
}