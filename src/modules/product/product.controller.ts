// Importa los tipos Request y Response de Express para tipar correctamente los handlers.
import { Request, Response } from 'express';

// Importa las funciones del service (capa de negocio / acceso a datos).
// El controller delega en el service para no mezclar lógica HTTP con lógica de persistencia.
import {
  findAllProducts,
  findProductById,
  createProductService,
  updateProductService,
  deleteProductService,
} from '@/modules/product/product.service';


// ============================================================================
// GET /api/payments
// ============================================================================
// Devuelve la lista de productos.
export async function listProducts(_req: Request, res: Response) 
{
  // Se usa try/catch para capturar cualquier error inesperado en el service.
  try {
    // Llama al service para obtener todos los productos.
    const items = await findAllProducts();

    // Responde con 200 (implícito) y el arreglo en JSON.
    res.json(items);
  } catch (err) {
    // Log del error real para diagnóstico (no se expone al cliente).
    console.error('Error listando products:', err);

    // Respuesta estándar de error interno.
    res.status(500).json({ message: 'Error listando products' });
  }
}

// ============================================================================
// GET /api/products/:id
// ============================================================================
// Devuelve un producto por id.
export async function getProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el parámetro "id" de la URL.
    const { id } = req.params;

    // Consulta el producto en el service.
    const item = await findProductById(id);

    // Si no existe, responde 404 y termina (return evita continuar).
    if (!item) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    // Si existe, responde 200 (implícito) con el producto.
    res.json(item);
  } catch (err) {
    // Log interno del error.
    console.error('Error obteniendo product:', err);

    // Error interno.
    res.status(500).json({ message: 'Error obteniendo product' });
  }
}

// ============================================================================
// POST /api/products
// ============================================================================
// Crea un producto nuevo.
export async function createProduct(req: Request, res: Response) 
{
  try {
    // Desestructura los campos esperados del body.
    // "req.body ?? {}" evita error si body es undefined/null.
    const { customer_id, name, description, min_monthly_rent, max_monthly_rent, active } = req.body ?? {};

    // Validación mínima de campos obligatorios.
    // Si falta alguno, responde 400 (Bad Request) con mensaje.
    if (!customer_id || !name || !description) {
      return res.status(400).json({
        message: 'customer_id, name y description son requeridos',
      });
    }

    // Llama al service con el DTO de creación.
    // El service valida relaciones (customer existe) y persiste el producto.
    const saved = await createProductService({
      customer_id,
      name,
      description,
      min_monthly_rent,
      max_monthly_rent,
      active,
    });

    // Responde 201 (Created) y retorna el objeto creado.
    res.status(201).json(saved);
  } catch (err: any) {
    // Si el service lanza un error tipificado, se mapea a 400.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    // Para cualquier otro error: log + 500.
    console.error('Error creando product:', err);
    res.status(500).json({ message: 'Error creando product' });
  }
}


// ============================================================================
// PUT /api/products/:id
// ============================================================================
// Actualiza un producto existente.
export async function updateProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el id de la URL.
    const { id } = req.params;

    // Extrae campos del body (parcial). "?? {}" evita errores si body está vacío.
    const { customer_id, name, description, min_monthly_rent, max_monthly_rent, active } = req.body ?? {};

    // Llama al service para actualizar.
    // Nota: el controller pasa todos los campos (posiblemente undefined).
    // El service decide qué actualizar (normalmente solo los != undefined).
    const updated = await updateProductService(id, {
      customer_id,
      name,
      description,
      min_monthly_rent,
      max_monthly_rent,
      active,
    });

    // Si el service retorna null, significa que el producto no existe.
    // Se responde 404.
    if (!updated) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    // Si existe y se actualizó, responde 200 (implícito) con el objeto actualizado.
    res.json(updated);
  } catch (err: any) {
    // Caso tipificado: customer_id inválido al reasignar relación.
    if (err?.code === 'CUSTOMER_NOT_FOUND') {
      return res
        .status(400)
        .json({ message: 'customer_id no existe en la BD' });
    }

    // Caso general: log + 500.
    console.error('Error actualizando product:', err);
    res.status(500).json({ message: 'Error actualizando product' });
  }
}

// ============================================================================
// DELETE /api/products/:id
// ============================================================================
// Elimina un producto por id.
export async function deleteProduct(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el id de la URL.
    const { id } = req.params;

    // Llama al service para eliminar.
    // Normalmente retorna el número de filas afectadas (0 o 1).
    const deleted = await deleteProductService(id);

    // Si deleted es 0 (falsy), no existía el producto: 404.
    if (!deleted) {
      return res.status(404).json({ message: 'Product no encontrado' });
    }

    // Si sí se eliminó, responde 204 No Content (sin body).
    res.status(204).send();
  } catch (err) {
    // Log interno.
    console.error('Error eliminando product:', err);

    // Error interno.
    res.status(500).json({ message: 'Error eliminando product' });
  }
}