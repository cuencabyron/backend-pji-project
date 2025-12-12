/**
 * Controladores HTTP para la entidad Customer.
 *
 * Expone las operaciones CRUD básicas sobre el recurso `/api/customers`:
 *  - GET    /api/customers        → lista todos los customers
 *  - GET    /api/customers/:id    → obtiene un customer por su ID
 *  - POST   /api/customers        → crea un nuevo customer
 *  - PUT    /api/customers/:id    → actualiza un customer existente
 *  - DELETE /api/customers/:id    → elimina un customer por su ID
 *
 * Cada controlador:
 *  - Usa `customerRepo()` para interactuar con la base de datos mediante TypeORM.
 *  - Envuelve la lógica en un `try/catch` para manejar errores y devolver un 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';
// Importa una función de fábrica que devuelve el repositorio de Customer. Se usara para leer/escribir en la tabla "customer" mediante TypeORM.
import { customerRepo } from '../repositories/customer.repo';
// Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '../utils/api-error';

/**
 * Tipo que define la forma del cuerpo (body) esperado para crear/actualizar un Customer.
 * Se usa únicamente a nivel de TypeScript para tener tipado fuerte en los controladores.
 */
type CustomerBody = 
{
  /** Nombre del cliente */
  name: string;
  /** Correo electrónico del cliente */
  email: string;
  /** Teléfono de contacto del cliente */
  phone: string;
  /** Dirección física del cliente */
  address: string;
  /**
   * Indicador de si el customer está activo.
   * Es opcional en el body; si no se envía, se asume `true` al crear.
   */
  active?: boolean;
};

// ====== GET /api/customers ======

/**
 * Controlador para listar todos los customers.
 *
 * Ruta: GET /api/customers
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Customer.
 *  - Recupera todos los registros mediante `repo.find()`.
 *  - Devuelve el resultado como JSON.
 *  - En caso de error, escribe en consola y responde con 500.
 *
 * @param _req Request de Express (no se utiliza en este handler).
 * @param res  Response de Express, usado para enviar la respuesta al cliente.
 */
export async function listCustomers(_req: Request, res: Response) 
{
  try {
    // Obtener el repositorio de la entidad Customer
    const repo = customerRepo();

    // Recuperar todos los registros de customers
    const items = await repo.find();

    // Devolver el listado completo en formato JSON
    res.json(items);
  } catch (err) {
    // Define un identificador técnico y estable para este tipo de error, sirve para saber rápidamente en logs y en el frontend qué operación falló.
    const errorId = 'CUSTOMER_LIST_ERROR';

    // Escribe en la consola del servidor el código de error y el objeto de error real para diagnóstico..
    console.error(errorId, err);

    // Responder al cliente con un error genérico 500
    res
      .status(500)
      .json(formatError('Error listando customers', errorId, err));
  }
}

// ====== GET /api/customers/:id ======

/**
 * Controlador para obtener un customer por ID.
 *
 * Ruta: GET /api/customers/:id
 *
 * Comportamiento:
 *  - Lee el parámetro `id` desde la URL.
 *  - Busca un customer con ese `customer_id` en la base de datos.
 *  - Si lo encuentra, lo devuelve como JSON.
 *  - Si no existe, responde con 404 (not found).
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express, contiene el parámetro `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraer el ID desde los parámetros de la ruta
    const { id } = req.params;

    // Obtener el repositorio de Customer
    const repo = customerRepo();

    // Buscar un customer cuyo `customer_id` sea igual a `id`
    const item = await repo.findOneBy({ customer_id: id });

    // Si no se encontró ningún registro, responder con 404
    if (!item) {
      return res
        .status(404)
        .json({ message: 'Customer no encontrado', errorId: 'CUSTOMER_NOT_FOUND' });
    }

    // Si se encontró, devolver el customer como JSON
    res.json(item);
  } catch (err) {
    // Define un identificador técnico y estable para este tipo de error, sirve para saber rápidamente en logs y en el frontend qué operación falló.
    const errorId = 'CUSTOMER_GET_ERROR';

    // Escribe en la consola del servidor el código de error y el objeto de error real para diagnóstico.
    console.error(errorId, err);

    // Responder al cliente con un error genérico 500
    res
      .status(500)
      .json(formatError('Error obteniendo customer', errorId, err));
  }
}

// ====== POST /api/customers ======

/**
 * Controlador para crear un nuevo customer.
 *
 * Ruta: POST /api/customers
 *
 * Body esperado (JSON):
 *  {
 *    "name": string,
 *    "email": string,
 *    "phone": string,
 *    "address": string,
 *    "active": boolean (opcional)
 *  }
 *
 * Comportamiento:
 *  - Lee y desestructura el body.
 *  - Valida que `name`, `email`, `phone`, `address` estén presentes.
 *  - Si falta alguno, responde con 400 (bad request).
 *  - Crea una nueva entidad Customer y la guarda en la base de datos.
 *  - Devuelve el customer creado con código 201 (created).
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express, con el body tipado como `CustomerBody`.
 * @param res Response de Express.
 */
export async function createCustomer(req: Request<{}, {}, CustomerBody>, res: Response) 
{
  try {
    // Extraer campos del body, asignando `active = true` por defecto si no viene
    const { name, email, phone, address, active = true } = req.body ?? {};

    // Validación básica: los campos obligatorios no pueden ser falsy
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ 
        message: 'name, email, phone, address son requeridos',
        errorId: 'CUSTOMER_VALIDATION_ERROR',
      });
    }

    // Obtener el repositorio de Customer
    const repo = customerRepo();

    // Crear una nueva entidad Customer en memoria (aún sin persistir)
    const entity = repo.create({ name, email, phone, address, active });

    // Guardar la entidad en la base de datos (INSERT)
    const saved = await repo.save(entity);

    // Devolver el registro creado con HTTP 201 (Created)
    res.status(201).json(saved);
  } catch (err) {
    // Define un identificador técnico y estable para este tipo de error, sirve para saber rápidamente en logs y en el frontend qué operación falló.
    const errorId = 'CUSTOMER_CREATE_ERROR';

    // Escribe en la consola del servidor el código de error y el objeto de error real para diagnóstico.
    console.error(errorId, err);

    // Responder al cliente con un error genérico 500
    res
      .status(500)
      .json(formatError('Error creando customer', errorId, err));
  }
}

// ====== PUT /api/customers/:id ======

/**
 * Controlador para actualizar un customer existente.
 *
 * Ruta: PUT /api/customers/:id
 *
 * Body esperado (JSON):
 *  - Cualquier subset de `CustomerBody`:
 *    {
 *      "name"?: string,
 *      "email"?: string,
 *      "phone"?: string,
 *      "address"?: string,
 *      "active"?: boolean
 *    }
 *
 * Comportamiento:
 *  - Lee el `id` de la URL.
 *  - Busca el customer correspondiente en la base de datos.
 *  - Si no existe, responde con 404.
 *  - Actualiza solo los campos enviados en el body (update parcial).
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve el registro actualizado.
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express con `id` en params y un body parcial de `CustomerBody`.
 * @param res Response de Express.
 */
export async function updateCustomer(req: Request<{ id: string }, {}, Partial<CustomerBody>>, res: Response) 
{
  try {
    // ID del customer a actualizar
    const { id } = req.params;

    // Obtener el repositorio de Customer
    const repo = customerRepo();

    // Buscar la entidad existente en la BD
    const existing = await repo.findOneBy({ customer_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res
        .status(404)
        .json({ message: 'Customer no encontrado', errorId: 'CUSTOMER_NOT_FOUND' });
    }

    // Extraer campos del body (pueden venir o no)
    const { name, email, phone, address, active } = req.body ?? {};

    // Actualizar únicamente los campos que vengan definidos en la petición
    if (name !== undefined) existing.name = name;
    if (email !== undefined) existing.email = email;
    if (phone !== undefined) existing.phone = phone;
    if (address !== undefined) existing.address = address;
    if (active !== undefined) existing.active = active;

    // Guardar los cambios en la base de datos (UPDATE)
    const saved = await repo.save(existing);

    // Devolver el registro actualizado
    res.json(saved);
  } catch (err) {
    // Define un identificador técnico y estable para este tipo de error, sirve para saber rápidamente en logs y en el frontend qué operación falló.
    const errorId = 'CUSTOMER_UPDATE_ERROR';

    // Escribe en la consola del servidor el código de error y el objeto de error real para diagnóstico.
    console.error(errorId, err);

    // Responder al cliente con un error genérico 500
    res
      .status(500)
      .json(formatError('Error actualizando customer', errorId, err));
  }
}

// ====== DELETE /api/customers/:id ======

/**
 * Controlador para eliminar un customer por ID.
 *
 * Ruta: DELETE /api/customers/:id
 *
 * Comportamiento:
 *  - Lee el `id` de la URL.
 *  - Verifica primero si el customer existe (`repo.exist`).
 *  - Si no existe, responde con 404.
 *  - Si existe, ejecuta un `DELETE` directo en BD (`repo.delete`).
 *  - Responde con 204 (No Content) si la eliminación fue exitosa.
 *  - En caso de error, responde con 500.
 *
 * @param req Request de Express con el parámetro `id`.
 * @param res Response de Express.
 */
export async function deleteCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Leer el ID desde la URL
    const { id } = req.params;

    // Obtener el repositorio de Customer
    const repo = customerRepo();

    // Verificar si existe algún customer con ese ID sin cargar toda la entidad
    const exists = await repo.exist({ where: { customer_id: id } });
    if (!exists) {
      return res
      .status(404)
       .json({ message: 'Customer no encontrado', errorId: 'CUSTOMER_NOT_FOUND' });
    }

    // Eliminar el registro directamente en la base de datos
    await repo.delete({ customer_id: id });

    // Responder con 204 (No Content) indicando que la operación fue exitosa
    return res.status(204).send();
  } catch (err) {
    // Define un identificador técnico y estable para este tipo de error, sirve para saber rápidamente en logs y en el frontend qué operación falló.
    const errorId = 'CUSTOMER_DELETE_ERROR';

    // Escribe en la consola del servidor el código de error y el objeto de error real para diagnóstico..
    console.error(errorId, err);

    // Responder al cliente con un error genérico 500
    return res.status(500).json(formatError('Error eliminando customer', errorId, err));
  }
}