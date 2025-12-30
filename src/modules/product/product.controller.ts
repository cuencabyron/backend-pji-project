/**
 * Controladores HTTP para la entidad Product.
 *
 * Expone las operaciones CRUD básicas sobre el recurso `/api/products`:
 *  - GET    /api/products        → lista todos los productos
 *  - GET    /api/products/:id    → obtiene un productos por su ID
 *  - POST   /api/products        → crea un nuevo productos asociado a un customer
 *  - PUT    /api/products/:id    → actualiza un productos existente
 *  - DELETE /api/products/:id    → elimina un productos por su ID
 *
 * Cada controlador:
 *  - Usa `serviceRepo()` para interactuar con la tabla `product` mediante TypeORM.
 *  - Valida datos básicos antes de tocar la base de datos.
 *  - Verifica que el `customer_id` exista cuando se crea o se cambia el dueño del producto.
 *  - Está envuelto en `try/catch` para manejar errores y devolver un 500 en caso de fallo inesperado.
 */

// Importa los tipos Request y Response de Express, que representan la petición HTTP que llega y la respuesta que se va a enviar.
import { Request, Response } from 'express';

// Importa la instancia de conexión/configuración de TypeORM (DataSource) que se creo en src/data-source.ts
import { AppDataSource } from '@/config/data-source';

// Importa la entidad que mapea la tabla "product"
import { Product } from '@/modules/product/product.entity';

// Importa la entidad Customer de TypeORM. Esta clase representa la tabla "customer" en la base de datos y su mapeo a objetos JS/TS.
import { Customer } from '@/modules/customer/customer.entity';

/* Importa un helper para dar un formato estándar a las respuestas de error de la API. Lo usas en los catch para devolver siempre: { message, errorId, details }.
import { formatError } from '@/utils/api-error'; */

/**
 * Tipo que define la forma del cuerpo (body) esperado
 * al crear o actualizar un Product.
 */
type ProductBody = 
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

// ====== GET /api/products ======

/**
 * Controlador para listar todos los productos.
 *
 * Ruta: GET /api/products
 *
 * Comportamiento:
 *  - Obtiene el repositorio de Product.
 *  - Recupera todos los productos mediante `repo.find()`.
 *  - Devuelve el listado como JSON.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param _req Request de Express (no se usa en este handler).
 * @param res  Response de Express, usado para enviar la respuesta al cliente.
 */
export async function listProducts(_req: Request, res: Response) 
{
  try {
    // Obtiene el repositorio de roduct directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Product);

    // Recupera todos los registros de productos de la BD.
    const items = await repo.find();

    // Devolver el listado completo en formato JSON
    res.json(items);
  } catch (err) {

    // Loguear el error en el servidor para diagnóstico
    console.error('Error listando products:', err);
    
    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error listando products' });
  }
}

// ====== GET /api/products/:id ======

/**
 * Controlador para obtener un producto por su ID.
 *
 * Ruta: GET /api/products/:id
 *
 * Comportamiento:
 *  - Lee el parámetro `id` desde la URL.
 *  - Busca un producto cuyo `product_id` coincida con ese `id`.
 *  - Si lo encuentra, lo devuelve como JSON.
 *  - Si no existe, responde con 404.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con el parámetro `id` en `req.params`.
 * @param res Response de Express.
 */
export async function getProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extraer el ID del producto desde los parámetros de la ruta
    const { id } = req.params;

    // Obtiene el repositorio de Producto directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Product);

    // Buscar un producto con ese ID en la base de datos
    const item = await repo.findOneBy({ product_id: id });

    // Si no se encontró, devolver 404
    if (!item) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    // Devolver el producto encontrado
    res.json(item);
  } catch (err) {
    // Loguear el error en el servidor para diagnóstico
    console.error('Error obteniendo product:', err);
    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error obteniendo product' });
  }
}

// ====== POST /api/products ======

/**
 * Controlador para crear un nuevo producto.
 *
 * Ruta: POST /api/products
 *
 * Body esperado (JSON):
 *  {
 *    "customer_id": string,        // ID del cliente dueño del producto
 *    "name": string,               // nombre del producto
 *    "description": string,        // descripción del producto
 *    "active"?: boolean            // opcional, por defecto true
 *  }
 *
 * Comportamiento:
 *  - Valida que `customer_id`, `name` y `description` estén presentes.
 *  - Verifica que el `customer_id` exista en la tabla `customer`.
 *  - Crea y guarda el producto en la base de datos.
 *  - Devuelve el producto creado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express, con el body tipado como `ProductBody`.
 * @param res Response de Express.
 */
export async function createProduct(req: Request<{}, {}, ProductBody>, res: Response) 
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

    // Obtiene el repositorio de Product directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Product);

    // Crear una nueva entidad Product en memoria con los datos recibidos
    const entity = repo.create({ customer_id, name, description, active });

    // Guardar el nuevo producto en la base de datos
    const saved = await repo.save(entity);

    // Devolver el producto creado
    res.status(200).json(saved);
  } catch (err: any) {
    // Loguear el error en el servidor para diagnóstico
    console.error('Error creando product:', err);

    // Responder al cliente con un error genérico 500
    res.status(500).json({ message: 'Error creando product' });
  }
}

// ====== PUT /api/products/:id ======

/**
 * Controlador para actualizar un producto existente.
 *
 * Ruta: PUT /api/products/:id
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
 *  - Lee el `id` de la ruta y busca el producto correspondiente.
 *  - Si no existe, responde con 404.
 *  - Si viene `customer_id`, valida que el nuevo cliente exista.
 *  - Actualiza únicamente los campos enviados en el body.
 *  - Guarda los cambios en la base de datos.
 *  - Devuelve el producto actualizado.
 *  - En caso de error inesperado, responde con 500.
 *
 * @param req Request de Express con `id` en params y un body parcial de `ServiceBody`.
 * @param res Response de Express.
 */
export async function updateProduct(req: Request<{ id: string }, {}, Partial<ProductBody>>, res: Response) 
{
  try {
    // ID del servicio a actualizar
    const { id } = req.params;

    // Obtiene el repositorio de Product directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Product);

    // Buscar el producto existente en la BD
    const existing = await repo.findOneBy({ product_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Product no encontrado' });
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

    // Devolver el producto actualizado
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando product:', err);
    res.status(500).json({ message: 'Error actualizando product' });
  }
}

// ====== DELETE /api/products/:id ======

/**
 * Controlador para eliminar un producto por ID.
 *
 * Ruta: DELETE /api/products/:id
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
export async function deleteProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    // ID del product a eliminar
    const { id } = req.params;

    // Obtiene el repositorio de Product directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Product);

    // Buscar el producto por ID en la base de datos
    const existing = await repo.findOneBy({ product_id: id });

    // Si no existe, devolver 404
    if (!existing) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    // Eliminar el producto encontrado
    await repo.remove(existing);

    // Responder con 204 indicando que no hay contenido pero la operación fue exitosa
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando product:', err);
    res.status(500).json({ message: 'Error eliminando product' });
  }
}