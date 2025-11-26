// Importa los tipos Request y Response de Express para tipar los handlers HTTP.
import { Request, Response } from 'express';
// Importa una función factory que devuelve el repositorio TypeORM de Service.
import { serviceRepo } from '../repositories/service.repo';

// Define el shape del cuerpo (body) que esperamos para crear/actualizar un Service.
type ServiceBody = {
  name: string;        // Nombre legible del servicio/plan.
  description: string; // Descripción corta.
  active?: boolean;    // Campo opcional; si no viene, asumimos true.
};

// ====== GET /api/services ======
export async function listServices(_req: Request, res: Response) {
  const repo = serviceRepo();   // Obtiene el repositorio de Service.
  const items = await repo.find(); // Recupera todos los registros (SELECT *).
  res.json(items);              // Responde en JSON con la lista.
}

// ====== GET /api/services/:id ======
export async function getService(
  req: Request<{ id: string }>, // Tipamos params para que req.params.id sea string.
  res: Response
) {
  const { id } = req.params;               // Extraemos el id de la ruta.
  const repo = serviceRepo();              // Repositorio de Service.
  const item = await repo.findOneBy({      // Busca por clave primaria/columna única.
    service_id: id
  });
  if (!item)                               // Si no existe, 404 con mensaje.
    return res.status(404).json({ message: 'Service no encontrado' });
  res.json(item);                          // Si existe, devolverlo en JSON.
}

// ====== POST /api/services ======
export async function createService(
  req: Request<unknown, unknown, ServiceBody>, // Tipamos el body según ServiceBody.
  res: Response
) {
  // Desestructuramos el body y establecemos active = true por defecto.
  const { name, description, active = true } = req.body ?? {};
  // Validación mínima: name y description son obligatorios.
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: 'name y description son requeridos' });
  }
  const repo = serviceRepo();                 // Repositorio de Service.
  const entity = repo.create({                // Crea instancia (no persiste aún).
    name,
    description,
    active
  });
  const saved = await repo.save(entity);      // Inserta en DB y devuelve la fila.
  res.status(201).json(saved);                // 201 Created + entidad creada.
}

// ====== PUT /api/services/:id ======
export async function updateService(
  // id en params, body parcial (puede venir sólo uno de los campos).
  req: Request<{ id: string }, unknown, Partial<ServiceBody>>,
  res: Response
) {
  const { id } = req.params;                     // Id del recurso a actualizar.
  const repo = serviceRepo();                    // Repositorio de Service.
  const existing = await repo.findOneBy({        // Busca el registro actual.
    service_id: id
  });
  if (!existing)                                 // Si no existe, 404.
    return res.status(404).json({ message: 'Service no encontrado' });

  // Solo actualiza los campos que realmente llegaron en el body.
  const { name, description, active } = req.body ?? {};
  if (name !== undefined) existing.name = name;
  if (description !== undefined) existing.description = description;
  if (active !== undefined) existing.active = active;

  const saved = await repo.save(existing);       // Persiste cambios (UPDATE).
  res.json(saved);                               // Devuelve el recurso actualizado.
}

// ====== DELETE /api/services/:id ======
export async function deleteService(
  req: Request<{ id: string }>, // Tipamos params con id string.
  res: Response
) {
  const { id } = req.params;                  // Id del recurso a eliminar.
  const repo = serviceRepo();                 // Repositorio de Service.
  const existing = await repo.findOneBy({     // Busca el registro.
    service_id: id
  });
  if (!existing)                              // Si no existe, 404.
    return res.status(404).json({ message: 'Service no encontrado' });

  await repo.remove(existing);                // Borra físicamente la fila.
  res.status(204).send();                     // 204 No Content (sin cuerpo).
}