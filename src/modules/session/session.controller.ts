
import { Request, Response } from 'express';

import { AppDataSource } from '@/config/data-source';

import { Session } from '@/modules/session/session.entity';

import { Customer } from '@/modules/customer/customer.entity';

import {CreateSessionDto} from '@/modules/session/dtos/create-session.dto';

import {UpdateSessionDto} from '@/modules/session/dtos/update-session.dto';


export async function listSessions(_req: Request, res: Response) 
{
  try {
    const repo = AppDataSource.getRepository(Session);

    const items = await repo.find();

    const response = items.map((c) => ({
      customer_id: c.customer_id,
      user_Agent: c.user_agent,
      status: c.status,
    }));

    res.json(response);
  } catch (err) {
    console.error('Error listando sessions:', err);
    res.status(500).json({ message: 'Error listando sessions' });
  }
}

export async function getSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Session);

    const item = await repo.findOneBy({ session_id: id });

    if (!item) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    const response = {
      customer_id: item.customer_id,
      user_Agent: item.user_agent,
      status: item.status,
    };

    res.json(response);
  } catch (err) {
    console.error('Error obteniendo session:', err);
    res.status(500).json({ message: 'Error obteniendo session' });
  }
}

export async function createSession(req: Request<{}, {}, CreateSessionDto>, res: Response) 
{
  try {
    const { customer_id, user_agent, status = 'active' } = req.body ?? {};

    if (!customer_id || !user_agent) 
    {
      return res.status(400).json({
        message: 'customer_id y user_agent son requeridos',
      });
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const exists = await customerRepo.findOneBy({ customer_id });
    if (!exists) {
      return res.status(400).json({ message: 'customer_id no existe' });
    }

    const repo = AppDataSource.getRepository(Session);

    const entity = repo.create({ customer_id, user_agent, status });

    const saved = await repo.save(entity);

    const response = {
      customer_id: saved.customer_id,
      user_Agent: saved.user_agent,
      status: saved.status,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error creando session:', err);
    res.status(500).json({ message: 'Error creando session' });
  }
}

export async function updateSession(req: Request<{ id: string }, {}, UpdateSessionDto>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Session);

    const existing = await repo.findOneBy({ session_id: id });

    if (!existing) {
      return res.status(404).json({ message: 'Session no encontrado' });
    }

    const { user_agent, status, customer_id } = req.body ?? {};

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

    const response = {
      customer_id: saved.customer_id,
      user_Agent: saved.user_agent,
      status: saved.status,
    };

    res.json(response);
  } catch (err) {
    console.error('Error actualizando session:', err);
    res.status(500).json({ message: 'Error actualizando session' });
  }
}

export async function deleteSession(req: Request<{ id: string }>, res: Response) 
{
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Session);

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