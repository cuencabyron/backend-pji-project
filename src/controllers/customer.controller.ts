// Importa los tipos Request y Response de Express para tipar los handlers HTTP.
import { Request, Response } from 'express';
// Importa una función factory que devuelve el repositorio TypeORM de Customer.
import { customerRepo } from '../repositories/customer.repo';

import { AppDataSource } from '../data-source';

import { Session } from '../entities/Session';

// Define el shape del cuerpo (body) que esperamos para crear/actualizar un Customer.
type CustomerBody = {
  name: string;        // Nombre legible del cliente.
  email: string;       // Correo electrónico.
  phone: string;       // Teléfono
  address: string;     // Dirección
  active?: boolean;    // Campo opcional; si no viene, asumimos true.
};

// ====== GET /api/customer ======
export async function listCustomers(_req: Request, res: Response) {
  const repo = customerRepo();     // Obtiene el repositorio de Customer.
  const items = await repo.find(); // Recupera todos los registros (SELECT *).
  res.json(items);                 // Responde en JSON con la lista.
}

// ====== GET /api/customer/:id ======
export async function getCustomer(
  req: Request<{ id: string }>, // Tipamos params para que req.params.id sea string.
  res: Response
) {
  const { id } = req.params;               // Extraemos el id de la ruta.
  const repo = customerRepo();              // Repositorio de Customer.
  const item = await repo.findOneBy({      // Busca por clave primaria/columna única.
    customer_id: id
  });
  if (!item)                               // Si no existe, 404 con mensaje.
    return res.status(404).json({ message: 'Customer no encontrado' });
  res.json(item);                          // Si existe, devolverlo en JSON.
}

// ====== POST /api/customers ======
export async function createCustomer(
  req: Request<unknown, unknown, CustomerBody>, // Tipamos el body según CustomerBody.
  res: Response
) {
  // Desestructuramos el body y establecemos active = true por defecto.
  const { name, email, phone, address, active = true } = req.body ?? {};
  // Validación mínima: name y description son obligatorios.
  if (!name || !email || !phone || !address) {
    return res
      .status(400)
      .json({ message: 'name, email, phone, address description son requeridos' });
  }
  const repo = customerRepo();                 // Repositorio de Customer.
  const entity = repo.create({                // Crea instancia (no persiste aún).
    name,
    email,
    phone,
    address,
    active
  });
  const saved = await repo.save(entity);      // Inserta en DB y devuelve la fila.
  res.status(201).json(saved);                // 201 Created + entidad creada.
}

// ====== PUT /api/customers/:id ======
export async function updateCustomer(
  // id en params, body parcial (puede venir sólo uno de los campos).
  req: Request<{ id: string }, unknown, Partial<CustomerBody>>,
  res: Response
) {
  const { id } = req.params;                     // Id del recurso a actualizar.
  const repo = customerRepo();                   // Repositorio de Customer.
  const existing = await repo.findOneBy({        // Busca el registro actual.
    customer_id: id
  });
  if (!existing)                                 // Si no existe, 404.
    return res.status(404).json({ message: 'Customer no encontrado' });

  // Solo actualiza los campos que realmente llegaron en el body.
  const { name, email, phone, address, active } = req.body ?? {};
  if (name !== undefined) existing.name = name;
  if (email !== undefined) existing.email = email;
  if (phone !== undefined) existing.phone = phone;
  if (address !== undefined) existing.address = address;
  if (active !== undefined) existing.active = active;

  const saved = await repo.save(existing);       // Persiste cambios (UPDATE).
  res.json(saved);                               // Devuelve el recurso actualizado.
}

// ====== DELETE /api/services/:id ======
export async function deleteCustomer(req: Request<{ id: string }>, res: Response) {// Tipamos params con id string.
  const { id } = req.params;                  // Id del recurso a eliminar.
  const repo = customerRepo();                 // Repositorio de Customer.
  const existing = await repo.findOneBy({     // Busca el registro.
    customer_id: id
  });
  if (!existing)                              // Si no existe, 404.
    return res.status(404).json({ message: 'Customer no encontrado' });

  await repo.remove(existing);                // Borra físicamente la fila.
  res.status(204).send();                     // 204 No Content (sin cuerpo).
}