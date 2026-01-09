/**
 * Controladores HTTP (controllers) para la entidad Customer.
 *
 * Estos handlers:
 *   - Reciben la petición HTTP (Request) y construyen la respuesta (Response).
 *   - Llaman a las funciones de la capa de servicios (customer.service).
 *   - Traducen resultados / errores a códigos HTTP (200, 201, 400, 404, 500, etc.).
 *
 * Importante:
 *   - Aquí NO va la lógica de acceso a datos (eso está en los services).
 *   - Aquí NO debería ir lógica de negocio pesada; solo orquestación y manejo de HTTP.
 */

// Tipos de Express para tipar las funciones de controlador.
import { Request, Response } from 'express';

// Funciones de la capa de servicio que encapsulan la lógica de acceso a datos
// y reglas básicas de negocio para Customer.
import {
  findAllCustomers,
  findCustomerById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from '@/modules/product/dtos/customer.service';

// ============================================================================
// GET /api/customers
// ============================================================================

/**
 * Lista todos los customers.
 */
export async function listCustomers(_req: Request, res: Response) 
{
  try {
    const items = await findAllCustomers();
    res.json(items);
  } catch (err) {
    console.error('Error listando customers:', err);
    res.status(500).json({ message: 'Error listando customers' });
  }
}

// ============================================================================
// GET /api/customers/:id
// ============================================================================

/**
 * Devuelve un customer por su ID.
 */
export async function getCustomer(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const item = await findCustomerById(id);

    if (!item) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo customer:', err);
    res.status(500).json({ message: 'Error obteniendo customer' });
  }
}

// ============================================================================
// POST /api/customers
// ============================================================================

/**
 * Crea un nuevo customer.
 *
 * Manejo de errores de negocio:
 * - Si el servicio lanza 'EMAIL_IN_USE' → 409 Conflict.
 * - Otros errores → 500.
 */
export async function createCustomer(req: Request, res: Response) 
{
  try {
    const { name, email, phone, address, active } = req.body;

    // Validación rápida de campos obligatorios (además de lo que haga class-validator)
    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        message: 'name, email, phone, address son requeridos',
      });
    }

    const saved = await createCustomerService({
      name,
      email,
      phone,
      address,
      active,
    });

    res.status(201).json(saved);
  } catch (err: any) {
    // Regla de negocio: email ya está en uso
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }

    console.error('Error creando customer:', err);
    res.status(500).json({ message: 'Error creando customer' });
  }
}

// ============================================================================
// PUT /api/customers/:id
// ============================================================================

/**
 * Actualiza parcialmente un customer existente.
 *
 * Manejo de errores de negocio:
 * - Si el servicio devuelve null → 404.
 * - Si el servicio lanza 'EMAIL_IN_USE' → 409 Conflict.
 * - Otros errores → 500.
 */
export async function updateCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const { name, email, phone, address, active } = req.body;

    const updated = await updateCustomerService(id, 
    {
      name,
      email,
      phone,
      address,
      active,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    res.json(updated);
  } catch (err: any) {
    if (
      err?.code === 'EMAIL_IN_USE' ||
      err?.message === 'EMAIL_IN_USE'
    ) {
      return res.status(409).json({
        message: 'El email ya está en uso por otro customer',
      });
    }

    console.error('Error actualizando customer:', err);
    res.status(500).json({ message: 'Error actualizando customer' });
  }
}

export async function deleteCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const deleted = await deleteCustomerService(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    return res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'CUSTOMER_HAS_ACTIVE_PAYMENTS') {
      return res.status(409).json({
        message: 'No se puede eliminar el customer porque tiene pagos activos.',
      });
    }

    console.error('Error eliminando customer:', err);
    return res.status(500).json({ message: 'Error eliminando customer' });
  }
}