/**
 * Controladores HTTP para la entidad Service.
 *
 * Expone las operaciones CRUD básicas sobre el recurso `/api/services`:
 *  - GET    /api/services        → lista todos los servicios
 *  - GET    /api/services/:id    → obtiene un servicio por su ID
 *  - POST   /api/services        → crea un nuevo servicio asociado a un customer
 *  - PUT    /api/services/:id    → actualiza un servicio existente
 *  - DELETE /api/services/:id    → elimina un servicio por su ID
 *
 * Cada controlador:
 *  - Usa `serviceRepo()` para interactuar con la tabla `service` mediante TypeORM.
 *  - Valida datos básicos antes de tocar la base de datos.
 *  - Verifica que el `customer_id` exista cuando se crea o se cambia el dueño del servicio.
 *  - Está envuelto en `try/catch` para manejar errores y devolver un 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';
// Importa una función de fábrica que devuelve el repositorio de Service. Se usara para leer/escribir en la tabla "service" mediante TypeORM.
import { serviceRepo } from '../repositories/service.repo';
// Importa la fuente de datos principal de TypeORM. `AppDataSource` es la configuración de conexión a la base de datos (credenciales, host, puerto, entidades, etc.) y desde aquí puedes obtener repositorios.
import { AppDataSource } from '../config/data-source';
// Importa la entidad Customer de TypeORM. Esta clase representa la tabla "customer" en la base de datos y su mapeo a objetos JS/TS.
import { Customer } from '../entities/Customer';
// Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '../utils/api-error';

/**
 * Tipo que define la forma del cuerpo (body) esperado
 * al crear o actualizar un Service.
 */
type ServiceBody = 
{
  /** ID del customer al que pertenece el servicio (UUID) */
  customer_id: string;
  /** Nombre del servicio (por ejemplo, "Seguro Básico", "Plan Premium", etc.) */
  name: string;
  /** Descripción textual del servicio */
  description: string;
  /**
   * Indicador de si el servicio está activo o no.
   * Es opcional; si no se envía al crear, se asume `true`.
   */
  active?: boolean;
};

// ====== GET /api/services ======

/**
 * Controlador para listar todos los servicios.
 *
 * Ruta: GET /api/services
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Service.
 *  - Recupera todos los servicios mediante `repo.find()`.
 *  - Devuelve el listado como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param _req Request de Express (no se usa en este handler).
 * @param res  Response de Express, usado para enviar la respuesta al cliente.
 */
export async function listServices(_req: Request, res: Response) 
{
  try {
    // Obtener el repositorio de Service
    const repo = serviceRepo();

    // Recuperar todos los registros de servicios
    const items = await repo.find();

    // Devolver el listado completo en formato JSON
    res.json(items);
  } catch (err) {

    // Loguear el error en el servidor para diagnóstico
    console.error('Error listando services:', err);
    
    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error listando services' });
  }
}

// ====== GET /api/services/:id ======

/**
 * Controlador para obtener un servicio por su ID.
 *
 * Ruta: GET /api/services/:id
 *
 * Comportamiento:
 *  - Lee el parámetro `id` desde la URL.
 *  - Busca un servicio cuyo `service_id` coincida con ese `id`.
 *  - Si lo encuentra, lo devuelve como JSON.
 *  - Si no existe, responde con 404.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getService(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraer el ID del servicio desde los parámetros de la ruta
    const { id } = req.params;

    // Obtener el repositorio de Service
    const repo = serviceRepo();

    // Buscar un servicio con ese ID en la base de datos
    const item = await repo.findOneBy({ service_id: id });

    // Si no se encontró, devolver 404
    if (!item) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    // Devolver el servicio encontrado
    res.json(item);
  } catch (err) {
    // Loguear el error en el servidor para diagnóstico
    console.error('Error obteniendo service:', err);
    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error obteniendo service' });
  }
}

// ====== POST /api/services ======

/**
 * Controlador para crear un nuevo servicio.
 *
 * Ruta: POST /api/services
 *
 * Body esperado (JSON):
 *  {
 *    "customer_id": string,        // ID del cliente dueño del servicio
 *    "name": string,               // nombre del servicio
 *    "description": string,        // descripción del servicio
 *    "active"?: boolean            // opcional, por defecto true
 *  }
 *
 * Comportamiento:
 *  - Valida que `customer_id`, `name` y `description` estén presentes.
 *  - Verifica que el `customer_id` exista en la tabla `customer`.
 *  - Crea y guarda el servicio en la base de datos.
 *  - Devuelve el servicio creado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express, con el body tipado como `ServiceBody`.
 * @param res Response de Express.
 */
export async function createService(req: Request<{}, {}, ServiceBody>, res: Response) 
{
  try {
    // Desestructurar los campos del body; `active` por defecto es true
    const { customer_id, name, description, active = true } = req.body ?? {};

    // Validación básica: estos campos no pueden venir vacíos
    if (!customer_id || !name || !description) {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    // Verificar que el customer asociado exista
    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    // Obtener el repositorio de Service
    const repo = serviceRepo();

    // Crear una nueva entidad Service en memoria con los datos recibidos
    const entity = repo.create({ customer_id, name, description, active });

    // Guardar el nuevo servicio en la base de datos
    const saved = await repo.save(entity);

    // Devolver el servicio creado
    res.status(200).json(saved);
  } catch (err: any) {
    // Loguear el error en el servidor para diagnóstico
    console.error('Error creando service:', err);

    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error creando service' });
  }
}

// ====== PUT /api/services/:id ======

/**
 * Controlador para actualizar un servicio existente.
 *
 * Ruta: PUT /api/services/:id
 *
 * Body esperado (JSON, parcial):
 *  {
 *    "customer_id"?: string,
 *    "name"?: string,
 *    "description"?: string,
 *    "active"?: boolean
 *  }
 *
 * Comportamiento:
 *  - Lee el `id` de la ruta y busca el servicio correspondiente.
 *  - Si no existe, responde con 404.
 *  - Si viene `customer_id`, valida que el nuevo cliente exista.
 *  - Actualiza únicamente los campos enviados en el body.
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve el servicio actualizado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con `id` en params y un body parcial de `ServiceBody`.
 * @param res Response de Express.
 */
export async function updateService(req: Request<{ id: string }, {}, Partial<ServiceBody>>, res: Response) 
{
  try {
    // ID del servicio a actualizar
    const { id } = req.params;

    // Repositorio de Service
    const repo = serviceRepo();

    // Buscar el servicio existente en la BD
    const existing = await repo.findOneBy({ service_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    // Desestructurar campos que potencialmente vienen en el body
    const { customer_id, name, description, active } = req.body ?? {};

    // Si se quiere cambiar de customer, validar que exista
    if (customer_id !== undefined) {
      const customerRepo = AppDataSource.getRepository(Customer);
      const exists = await customerRepo.findOneBy({ customer_id });
      if (!exists) {
        return res.status(400).json({ message: 'customer_id no existe' });
      }
      (existing as any).customer_id = customer_id;
    }

    // Actualizar campos simples si vienen definidos
    if (name !== undefined) existing.name = name;
    if (description !== undefined) existing.description = description;
    if (active !== undefined) existing.active = active;

    // Guardar los cambios en la base de datos
    const saved = await repo.save(existing);

    // Devolver el servicio actualizado
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando service:', err);
    res.status(500).json({ message: 'Error actualizando service' });
  }
}

// ====== DELETE /api/services/:id ======

/**
 * Controlador para eliminar un servicio por ID.
 *
 * Ruta: DELETE /api/services/:id
 *
 * Comportamiento:
 *  - Lee el `id` desde la URL.
 *  - Busca el servicio en la base de datos.
 *  - Si no existe, responde con 404.
 *  - Si existe, lo elimina mediante `repo.remove`.
 *  - Devuelve 204 (No Content) si el borrado fue exitoso.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id`.
 * @param res Response de Express.
 */
export async function deleteService(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID del servicio a eliminar
    const { id } = req.params;

    // Repositorio de Service
    const repo = serviceRepo();

    // Buscar el servicio por ID en la base de datos
    const existing = await repo.findOneBy({ service_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Service no encontrado' });
    }

    // Eliminar el servicio encontrado
    await repo.remove(existing);

    // Responder con 204 indicando que no hay contenido pero la operación fue exitosa
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando service:', err);
    res.status(500).json({ message: 'Error eliminando service' });
  }
}