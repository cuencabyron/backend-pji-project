// Importa los tipos Request y Response de Express para tipar los handlers HTTP.
import { Request, Response } from 'express';
// Importa una función factory que devuelve el repositorio TypeORM de Session.
import { sessionRepo } from '../repositories/session.repo';

import { AppDataSource } from '../data-source';

import { Customer } from '../entities/Customer';



// Define el shape del cuerpo (body) que esperamos para crear/actualizar una Session.
type SessionBody = {
  customer_id: string;
  user_agent: string;        
  status?: 'active' | 'ended' | 'revoked'           
};

// ====== GET /api/sessions ======
export async function listSessions(_req: Request, res: Response) {
  const repo = sessionRepo();      // Obtiene el repositorio de Session.
  const items = await repo.find(); // Recupera todos los registros (SELECT *).
  res.json(items);                 // Responde en JSON con la lista.
}

// ====== GET /api/sessions/:id ======
export async function getSession(
  req: Request<{ id: string }>, // Tipamos params para que req.params.id sea string.
  res: Response
) {
  const { id } = req.params;               // Extraemos el id de la ruta.
  const repo = sessionRepo();              // Repositorio de Session.
  const item = await repo.findOneBy({      // Busca por clave primaria/columna única.
    session_id: id
  });
  if (!item)                               // Si no existe, 404 con mensaje.
    return res.status(404).json({ message: 'Session no encontrado' });
  res.json(item);                          // Si existe, devolverlo en JSON.
}

// ====== POST /api/sessions ======
export async function createSession(
  req: Request<unknown, unknown, SessionBody>, // Tipamos el body según SessionBody.
  res: Response
) {
  
  const { customer_id, user_agent, status = 'active' } = req.body ?? {};

  // Validación mínima: user_agent y status son obligatorios.
  if ( !customer_id || !user_agent ) {
    return res
      .status(400)
      .json({ message: 'customer_id y user_agent son requeridos' });
  }

  // Valida existencia del customer (evita 500 por FK)
  const customerRepo = AppDataSource.getRepository(Customer);
  const exists = await customerRepo.findOneBy({ customer_id });
  if (!exists) {
    return res.status(400).json({ message: 'customer_id no existe' });
  }

  const repo = sessionRepo();                 // Repositorio de Service.
  const entity = repo.create({                // Crea instancia (no persiste aún).
    customer_id,
    user_agent,
    status
  });
  const saved = await repo.save(entity);      // Inserta en DB y devuelve la fila.
  res.status(200).json(saved);                // 200 Petición exitosa.
}

// ====== PUT /api/sessions/:id ======
export async function updateSession(
  // id en params, body parcial (puede venir sólo uno de los campos).
  req: Request<{ id: string }, unknown, Partial<SessionBody>>,
  res: Response
) {
  const { id } = req.params;                     // Id del recurso a actualizar.
  const repo = sessionRepo();                    // Repositorio de Session.
  const existing = await repo.findOneBy({        // Busca el registro actual.
    session_id: id
  });
  if (!existing)                                 // Si no existe, 404.
    return res.status(404).json({ message: 'Session no encontrado' });

  const { user_agent, status, customer_id } = req.body ?? {};

  // Permitir cambiar de customer, validándolo
  if (customer_id !== undefined) {
    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }
    (existing as any).customer_id = customer_id;
  }

  if (user_agent !== undefined) existing.user_agent = user_agent;
  if (status !== undefined) existing.status = status as any;

  const saved = await repo.save(existing);       // Persiste cambios (UPDATE).
  res.json(saved);                               // Devuelve el recurso actualizado.
}

// ====== DELETE /api/session/:id ======
export async function deleteSession(
  req: Request<{ id: string }>, // Tipamos params con id string.
  res: Response
) {
  const { id } = req.params;                  // Id del recurso a eliminar.
  const repo = sessionRepo();                 // Repositorio de Session.
  const existing = await repo.findOneBy({     // Busca el registro.
    session_id: id
  });
  if (!existing)                              // Si no existe, 404.
    return res.status(404).json({ message: 'Session no encontrado' });

  await repo.remove(existing);                // Borra físicamente la fila.
  res.status(204).send();                     // 204 No Content (sin cuerpo).
}