/**
 * Controladores HTTP para la entidad Customer.
 *
 * Aquí se definen los handlers que atienden las rutas:
 *   - GET    /api/customers
 *   - GET    /api/customers/:id
 *   - POST   /api/customers
 *   - PUT    /api/customers/:id
 *
 * Cada función:
 *   1) Lee los datos de la petición (params / body).
 *   2) Usa el repositorio de TypeORM para acceder a la BD.
 *   3) Mapea la entidad a un DTO de respuesta (CustomerResponseDto).
 *   4) Devuelve una respuesta JSON adecuada (200, 201, 404, 500, etc.).
 */
import { Request, Response } from 'express';

// Importa la instancia de conexión/configuración de TypeORM (DataSource) que se creo en src/data-source.ts
import { AppDataSource } from '@/config/data-source';

// Importa la entidad que mapea la tabla "customer"
import { Customer } from '@/models/customer.model';

// DTOs usados para tipar body (entrada) y respuesta (salida).
import {CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto,} from '@/controllers/customer.dto';

// ============================================================================
// GET /api/customers
// ============================================================================

/**
 * Lista todos los customers.
 *
 * - No recibe parámetros (por eso el Request está ignorado como `_req`).
 * - Obtiene todas las filas de la tabla `customer` usando el repositorio.
 * - Convierte las entidades de TypeORM a objetos CustomerResponseDto.
 * - Devuelve el listado como JSON.
 */
export async function listCustomers(_req: Request, res: Response) 
{
  try {
    // Obtiene el repositorio de Customer directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Customer);

    // Recupera todos los registros de clientes de la BD.
    const items = await repo.find();

    // Mapea la entidad de BD → DTO de respuesta.
    const response: CustomerResponseDto[] = items.map((c) => ({
      customer_id: c.customer_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      active: c.active,
    }));

    // Envía el arreglo de customers al cliente.
    res.json(response);
  } catch (err) {
    // Si algo falla (BD caída, error inesperado, etc.), se escribe en consola
    // y se responde con 500 (Internal Server Error).
    console.error('Error listando customers:', err);
    res.status(500).json({ message: 'Error listando customers' });
  }
}

// ============================================================================
// GET /api/customers/:id
// ============================================================================

/**
 * Devuelve un customer específico por su ID.
 *
 * - Lee el parámetro de ruta `id` (UUID).
 * - Busca en la BD un registro cuyo `customer_id` coincida.
 * - Si no existe, responde 404.
 * - Si existe, lo mapea a CustomerResponseDto y lo devuelve como JSON.
 */
export async function getCustomer(req: Request<{ id: string }>, res: Response) 
{
  try {
    // Extrae el id de los parámetros de ruta.
    const { id } = req.params;

    // Obtiene el repositorio de Customer directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Customer);

    // Busca un customer por su ID.
    const item = await repo.findOneBy({ customer_id: id });

    // Si no se encontró, responde 404.
    if (!item) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    // Construye el DTO de respuesta a partir de la entidad.
    const response: CustomerResponseDto = {
      customer_id: item.customer_id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      active: item.active,
    };

    // Devuelve el customer encontrado.
    res.json(response);
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
 * - Lee el body tipado como CreateCustomerDto.
 * - Valida que los campos obligatorios vengan informados.
 * - Crea una nueva entidad de Customer y la guarda en la BD.
 * - Mapea la entidad guardada a CustomerResponseDto.
 * - Devuelve el nuevo registro con código 201 (Created).
 */
export async function createCustomer(req: Request<{}, {}, CreateCustomerDto>, res: Response) 
{
  try {
    // Extrae los campos del body, con `active` por defecto en true.
    const { name, email, phone, address, active = true } = req.body ?? {};

    // Validación básica de campos obligatorios.
    if (!name || !email || !phone || !address) {
      return res
        .status(400)
        .json({ message: 'name, email, phone, address son requeridos' });
    }

    // Obtiene el repositorio de Customer directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Customer);

    // Crea una nueva instancia de la entidad Customer (en memoria).
    const entity = repo.create({ name, email, phone, address, active });

    // Persiste la entidad en la BD y devuelve el registro ya guardado.
    const saved = await repo.save(entity);

    // Construye el DTO de respuesta con los datos creados.
    const response: CustomerResponseDto = {
      customer_id: saved.customer_id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      active: saved.active,
    };

    // Devuelve el recurso recién creado con código 201.
    res.status(201).json(response);
  } catch (err) {
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
 * - Lee el `id` de los parámetros de ruta y el body como UpdateCustomerDto.
 * - Busca el registro en la BD; si no existe, responde 404.
 * - Solo actualiza los campos que vienen definidos en el body (name, email, etc.).
 * - Guarda los cambios en la BD.
 * - Mapea el registro actualizado a CustomerResponseDto y lo devuelve.
 */
export async function updateCustomer(req: Request<{ id: string }, {}, UpdateCustomerDto>, res: Response) 
{
  try {
    // Extrae el id de los parámetros de ruta.
    const { id } = req.params;

    // Obtiene el repositorio de Customer directamente desde el DataSource.
    const repo = AppDataSource.getRepository(Customer);

    // Busca el customer que se desea actualizar.
    const existing = await repo.findOneBy({ customer_id: id });

    // Si no existe, responde 404.
    if (!existing) {
      return res.status(404).json({ message: 'Customer no encontrado' });
    }

    // Extrae posibles nuevos valores del body.
    const { name, email, phone, address, active } = req.body ?? {};

    // Actualiza solo los campos que vengan definidos (no undefined).
    if (name !== undefined) existing.name = name;
    if (email !== undefined) existing.email = email;
    if (phone !== undefined) existing.phone = phone;
    if (address !== undefined) existing.address = address;
    if (active !== undefined) existing.active = active;

    // Guarda los cambios en la BD.
    const saved = await repo.save(existing);

    // Construye el DTO de respuesta con el registro actualizado.
    const response: CustomerResponseDto = {
      customer_id: saved.customer_id,
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      active: saved.active,
    };

    // Devuelve el customer actualizado.
    res.json(response);
  } catch (err) {
    console.error('Error actualizando customer:', err);
    res.status(500).json({ message: 'Error actualizando customer' });
  }
}