import { Request, Response } from 'express';
import { sessionRepo } from '../repositories/session.repo';
import { AppDataSource } from '../data-source';
import { Customer } from '../entities/Customer';

type SessionBody = 
{
  customer_id: string;
  user_agent: string;
  status?: 'active' | 'ended' | 'revoked';
};

// ====== GET /api/sessions ======
export async function listSessions(_req: Request, res: Response) 
{
  try {
    const repo = sessionRepo();
    const items = await repo.find();
    res.json(items);
  } catch (err) {
    console.error('Error listando sessions:', err);
    res.status(500).json({ message: 'Error listando sessions' });
  }
}

// ====== GET /api/sessions/:id ======
export async function getSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = sessionRepo();
    const item = await repo.findOneBy({ session_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    res.json(item);
  } catch (err) {
    console.error('Error obteniendo session:', err);
    res.status(500).json({ message: 'Error obteniendo session' });
  }
}

// ====== POST /api/sessions ======
export async function createSession(req: Request<{}, {}, SessionBody>, res: Response) 
{
  try {
    const { customer_id, user_agent, status = 'active' } = req.body ?? {};

    if (!customer_id || !user_agent) {
      return res.status(400).json({
        message: 'customer_id y user_agent son requeridos',
      });
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    const repo = sessionRepo();
    const entity = repo.create({ customer_id, user_agent, status });
    const saved = await repo.save(entity);
    res.status(200).json(saved);
  } catch (err) {
    console.error('Error creando session:', err);
    res.status(500).json({ message: 'Error creando session' });
  }
}

// ====== PUT /api/sessions/:id ======
export async function updateSession(req: Request<{ id: string }, {}, Partial<SessionBody>>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = sessionRepo();
    const existing = await repo.findOneBy({ session_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

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

    const saved = await repo.save(existing);
    res.json(saved);
  } catch (err) {
    console.error('Error actualizando session:', err);
    res.status(500).json({ message: 'Error actualizando session' });
  }
}

// ====== DELETE /api/session/:id ======
export async function deleteSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;
    const repo = sessionRepo();
    const existing = await repo.findOneBy({ session_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    await repo.remove(existing);
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando session:', err);
    res.status(500).json({ message: 'Error eliminando session' });
  }
}